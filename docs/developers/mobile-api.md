# Mobile API for app developers

Everything needed to build an app against a Radius site: authentication, the
request and response shapes, and every endpoint. The site owner's side — turning
the API on, registering your app, choosing what it exposes — is in
[Mobile API](/system/mobile-api).

All endpoints live under:

```
https://example.com/api/v1
```

The `/api` part can be changed by the site (`CMS_API_PREFIX`). Ask the owner
for the exact base URL, or read it off their **Mobile API** screen.

## Authentication at a glance

Two layers, and they do different jobs:

| Layer | Headers | Proves | Needed on |
| --- | --- | --- | --- |
| **App** | `X-Api-Key` + `X-Api-Secret` (or a signature) | This is a registered app | **Every** request |
| **Customer** | `Authorization: Bearer <access token>` | This is a signed-in customer | Endpoints about that customer |

There are no cookies and no sessions. Do not send CSRF tokens; there are none
to send.

```bash
curl https://example.com/api/v1/site \
  -H "X-Api-Key: rad_k3x9…" \
  -H "X-Api-Secret: 7Tq…"
```

Clients that make Basic auth easier than custom headers may send
`key:secret` as HTTP Basic credentials instead.

## Signed requests

If the site has **Require signed requests** on, the secret must not be sent.
Sign each request instead — and it is worth doing even where it is not
required, because a signature is always accepted.

Send three more headers alongside `X-Api-Key`:

| Header | Value |
| --- | --- |
| `X-Api-Timestamp` | Current Unix time, in seconds |
| `X-Api-Nonce` | A fresh random string, 8–128 characters, never reused |
| `X-Api-Signature` | Base64 of HMAC-SHA256 over the string below, keyed with the app secret |

The string to sign is these seven lines joined with `\n`, no trailing newline:

```
<app key>
<HTTP method, upper case>
/<path, e.g. /api/v1/cart/items>
<query string exactly as sent, without the "?"; empty line if none>
<X-Api-Timestamp value>
<X-Api-Nonce value>
<lower-case hex SHA-256 of the raw request body; of "" when there is none>
```

```js
// JavaScript (Web Crypto) — a sketch
async function sign({ key, secret, method, path, query = '', body = '' }) {
  const enc = new TextEncoder();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID();
  const bodyHash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(body)))]
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const canonical = [key, method.toUpperCase(), path, query, timestamp, nonce, bodyHash].join('\n');

  const hmacKey = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', hmacKey, enc.encode(canonical));

  return {
    'X-Api-Key': key,
    'X-Api-Timestamp': timestamp,
    'X-Api-Nonce': nonce,
    'X-Api-Signature': btoa(String.fromCharCode(...new Uint8Array(mac))),
  };
}
```

::: warning Sign the bytes you send
Hash the body **exactly** as it goes over the wire. Serialising JSON twice — once
to hash, once to send — produces two different strings sooner or later. A GET
has no body; some HTTP clients send `[]` or `{}` anyway, which then has to be
what you hash.
:::

A signed request is valid for the site's signing window (5 minutes by
default) and **only once**: repeating a nonce is refused as a replay. A phone
with a badly wrong clock fails here; the error says so.

## Signing a customer in

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "asha@example.com", "password": "…", "device_name": "Asha's Pixel 8" }
```

```json
{
  "data": {
    "access_token": "…",
    "refresh_token": "…",
    "token_type": "Bearer",
    "expires_at": "2026-10-22T09:14:03+00:00",
    "refresh_expires_at": "2026-12-21T09:14:03+00:00",
    "user": { "id": 42, "name": "Asha Menon", "email": "asha@example.com", "email_verified": true, "…": "…" }
  }
}
```

`device_name` is what the customer sees in their list of signed-in devices.

**Store both tokens in the platform's secure storage** — Keychain on iOS,
Keystore-backed storage on Android. Never in plain preferences.

### Two-factor accounts

If the account has 2FA, login does not return tokens:

```json
{ "data": { "two_factor_required": true, "challenge": "…", "expires_in": 300 } }
```

Ask for the code and finish within five minutes:

```http
POST /api/v1/auth/two-factor

{ "challenge": "…", "code": "123456", "device_name": "…" }
```

Send `recovery_code` instead of `code` to use a recovery code. The challenge is
single-use: a wrong code means starting again from the password.

### Refreshing

Access tokens expire (30 days by default). Before or after they do, swap the
refresh token for a new pair:

```http
POST /api/v1/auth/refresh

{ "refresh_token": "…" }
```

**Both tokens change.** Replace both in storage; the old pair stops working
immediately. A refresh token can only be used through the app it was issued to.

When a refresh fails with `401`, the session is over — send the customer back
to the sign-in screen.

### Signing out

`POST /api/v1/auth/logout` with the bearer token revokes it on the server. Then
delete both tokens from the device.

## Responses

Success wraps the payload in `data`:

```json
{ "data": { … } }
```

Lists add paging in `meta`:

```json
{
  "data": [ … ],
  "meta": { "current_page": 1, "last_page": 4, "per_page": 12, "total": 41, "has_more": true }
}
```

Pass `?page=2` for the next page and `?per_page=` to change the size (capped at 50).

Failures carry a human-readable `message` you can show, and a stable `error`
code to branch on:

```json
{ "message": "That session has expired. Sign in again.", "error": "invalid_token" }
```

Validation failures are `422` with the fields that failed:

```json
{ "message": "The email field is required.", "errors": { "email": ["The email field is required."] } }
```

### Money

Amounts are integers in the currency's smallest unit, with a formatted string
next to them so the app never has to reimplement the site's currency settings:

```json
"price": { "amount": 45000, "formatted": "₹450.00" }
```

Do sums with `amount`; show `formatted`.

### Error codes

| Status | `error` | Meaning | What the app should do |
| --- | --- | --- | --- |
| 401 | `missing_key`, `unknown_key`, `bad_credentials` | App credentials missing or wrong | A build or configuration problem, not a user one |
| 403 | `app_disabled` | The site owner switched this app off | Show a maintenance message |
| 404 | `api_disabled` | The API module is off | Same |
| 404 | `feature_disabled` | That group of endpoints is off | Hide the feature — read `/site` for what is on |
| 401 | `not_signed_in` | Endpoint needs a customer | Show sign-in |
| 401 | `invalid_token` | Expired, revoked, or unknown token | Refresh once; if that fails, sign in |
| 401 | `wrong_app` | Token issued through another app | Sign in again |
| 401 | `invalid_credentials` | Wrong email or password | Show the message |
| 403 | `account_inactive` | Account suspended | Show the message |
| 403 | `staff_blocked` | Staff accounts cannot use the API | Show the message |
| 429 | `too_many_attempts` | Sign-in lockout (5 wrong passwords in a row) | Show the message; it says how long |
| 429 | `rate_limited` | Over the requests-per-minute budget | Back off; honour `Retry-After` |

## Start with `/site`

`GET /api/v1/site` is always available while the API is on, and needs no
customer. Call it at launch:

```json
{
  "data": {
    "name": "Filter & Co.",
    "logo": "https://…",
    "primary_color": "#2563eb",
    "currency": { "code": "INR", "symbol": "₹", "position": "before" },
    "features": ["auth", "registration", "posts", "pages", "search", "shop"],
    "account": { "registration_open": true, "email_verification_required": false, "guest_cart": true },
    "shop": { "guest_checkout": true, "tax_inclusive": false, "terms_url": "https://…" },
    "maintenance": { "active": false, "message": "…" },
    "…": "…"
  }
}
```

Build the app's navigation from `features` rather than assuming. When the owner
switches the shop off, the shop tab should disappear — not start failing.
`GET /api/v1/menus` returns the site's menus if you want the same navigation as
the website.

## The cart

A signed-in customer's cart belongs to their account. A guest's cart is kept by
a **cart token**:

1. The first cart call without one returns a new token in `data.token`.
2. Send it back as `X-Cart-Token` on every later cart and checkout call.
3. When the guest signs in, send `X-Cart-Token` with the login request and the
   basket is merged into their account.

Every cart endpoint returns the **whole** cart with fresh totals, so render the
response rather than patching local state:

```http
POST /api/v1/cart/items
X-Cart-Token: cart_…

{ "product_id": 12, "variant_id": 31, "quantity": 2 }
```

`data.issues` lists anything that must be fixed before checkout — an item that
went out of stock, a price that changed.

## Checkout and payment

`GET /api/v1/checkout` returns what the checkout screen needs: the cart, the
available payment methods, the countries the shop sells to, and — for a
signed-in customer — their saved addresses and a prefill.

`data.fields` says how to draw the form, following **Settings → Checkout**. Each
field is `required`, `optional` or `hidden`:

```json
"fields": {
  "email": "required", "name": "required", "phone": "optional",
  "line1": "required", "line2": "optional", "city": "required",
  "state": "optional", "postcode": "optional", "country": "required",
  "customer_note": "optional"
}
```

Leave `hidden` fields out of the form. The address parts (`line1` to `country`)
apply to both `billing` and `shipping`, and `name` is `billing.name`. The server
enforces the same rules: a blank required field gets a `422`, and anything sent
for a hidden field is dropped. If every address part is `hidden`, don't offer
`ship_to_different`.

`POST /api/v1/checkout` places the order:

```json
{
  "email": "asha@example.com",
  "phone": "+91 98765 43210",
  "payment_gateway": "razorpay",
  "billing": { "name": "Asha Menon", "line1": "12 Residency Road", "city": "Bengaluru", "postcode": "560025", "country": "IN" },
  "ship_to_different": false,
  "save_address": true,
  "terms": true
}
```

The response's `data.payment.type` says what happens next:

| `type` | Meaning | Do this |
| --- | --- | --- |
| `instructions` | An offline method — cash on delivery, bank transfer | Show `message`. The order is placed |
| `paid` | Settled already | Show the confirmation |
| `web` | An online gateway | Open `url` in a browser or web view |
| `failed` | The payment could not be started | Show `message`; the order exists, so offer another method |

For `web`, the link is signed and expires after 30 minutes. It opens the
website's own payment flow. Watch the web view's address: when it reaches
`success_url`, close it and poll `status_url` to read the final
`payment_status`. Webhooks may confirm a payment a few seconds after the
customer lands back, so poll briefly rather than once.

**Guests** get an `order_token` in the checkout response. Keep it: reading a
guest order requires it, as `X-Order-Token` or `?order_token=`. `status_url`
already includes it. Signed-in customers need no token — they can only ever
read their own orders.

## Endpoints

Every group except the first must be switched on by the site owner.

### Always available

| Method | Path | Customer |
| --- | --- | --- |
| GET | `/site` | — |
| GET | `/menus` | — |

### Sign in & customer account — `auth`

| Method | Path | Customer |
| --- | --- | --- |
| POST | `/auth/login` | — |
| POST | `/auth/two-factor` | — |
| POST | `/auth/refresh` | — |
| POST | `/auth/logout` | Required |
| GET | `/auth/me` | Required |
| PATCH | `/auth/me` — `name`, `phone` | Required |
| PUT | `/auth/password` — `current_password`, `password`, `password_confirmation` | Required |
| GET | `/auth/devices` | Required |
| DELETE | `/auth/devices/{id}` | Required |

Changing the password signs every *other* device out; the one that made the
change stays signed in.

### Customer registration — `registration`

| Method | Path | Customer |
| --- | --- | --- |
| POST | `/auth/register` — `name`, `email`, `password`, `password_confirmation`, `terms`, optional `phone`, `device_name` | — |
| POST | `/auth/forgot-password` — `email` | — |
| POST | `/auth/resend-verification` | Required |

Registration signs the customer straight in and returns tokens, like a login.
The password reset link is emailed and opens on the website.

### Blog posts — `posts`

| Method | Path | Query |
| --- | --- | --- |
| GET | `/posts` | `q`, `category`, `tag`, `featured`, `page`, `per_page` |
| GET | `/posts/{slug}` | |
| GET | `/post-categories` | |
| GET | `/post-tags` | |

### Post comments — `comments`

| Method | Path | Customer |
| --- | --- | --- |
| GET | `/posts/{slug}/comments` | — |
| POST | `/posts/{slug}/comments` — `body`, optional `parent_id`; guests also `author_name`, `author_email` | Optional |

New comments are held for moderation.

### Pages — `pages`

| Method | Path | Query |
| --- | --- | --- |
| GET | `/pages` | `menu_only`, `page`, `per_page` |
| GET | `/pages/{slug}` | |

### Shop — `shop`

| Method | Path | Customer |
| --- | --- | --- |
| GET | `/products` — `q`, `category`, `featured`, `min`, `max`, `in_stock`, `sort` (`price_asc`, `price_desc`, `name`, `rating`, `popular`) | — |
| GET | `/products/{slug}` | — |
| GET | `/product-categories` | — |
| GET | `/cart` | Optional |
| POST | `/cart/items` — `product_id`, optional `variant_id`, `quantity` | Optional |
| PATCH | `/cart/items/{id}` — `quantity` (0 removes) | Optional |
| DELETE | `/cart/items/{id}` | Optional |
| POST | `/cart/coupon` — `code` | Optional |
| DELETE | `/cart/coupon` | Optional |
| GET | `/checkout` | Optional |
| POST | `/checkout` | Optional |
| GET | `/orders/{number}` | Optional (guests need the order token) |
| GET | `/orders` | Required |
| GET | `/addresses` | Required |
| POST | `/addresses` | Required |
| PATCH | `/addresses/{id}` | Required |
| DELETE | `/addresses/{id}` | Required |

`min` and `max` are in major units (`450`, not `45000`). Prices in responses
are always minor units.

### Product reviews — `reviews`

| Method | Path | Customer |
| --- | --- | --- |
| GET | `/products/{slug}/reviews` | — |
| POST | `/products/{slug}/reviews` — `rating` (1–5), optional `title`, `body` | Required |

One review per customer per product. Held for moderation.

### Search — `search`

| Method | Path | Query |
| --- | --- | --- |
| GET | `/search` | `q`, optional `type` (`product`, `post`, `page`) with `page`, `per_page` |

Without `type`, results come back grouped, a few of each. With it, one type,
paged.

### Contact, newsletter and push

| Group | Method | Path | Body |
| --- | --- | --- | --- |
| `contact` | POST | `/contact` | `name`, `email`, `message`, optional `phone`, `subject` |
| `newsletter` | POST | `/newsletter` | `email`, optional `name` |
| `push` | POST | `/devices` | `token` (FCM), optional `platform` |
| `push` | DELETE | `/devices` | `token` |

Register the push token after sign-in as well as before: a token sent with a
bearer token is attached to that customer, so order notifications reach them.

## Rate limits

Every app gets its own budget per minute, per IP address (60 by default, set
by the site owner) — one app being noisy does not spend another app's
allowance. Sign-in, sign-up and password reset share a separate, tighter
budget, keyed on IP alone, so it slows down anyone working through a list of
addresses regardless of which app they claim to be. Over either limit the API
answers `429` with `error: "rate_limited"` and a `Retry-After` header — wait
that long rather than retrying immediately.

## What the API will never do

There are no admin endpoints. Nothing here publishes content, changes a
setting, reads another customer's data or reaches an order that is not the
caller's own, and staff accounts are refused at sign-in unless the owner has
explicitly allowed them. If an app needs something the storefront cannot do,
it does not belong in this API.
