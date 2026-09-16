# Security

What Radius does for you, and what remains yours to get right.

## The hardening checklist

Everything here takes under a minute. In rough order of how much it matters:

| | Where |
| --- | --- |
| 1. Turn on two-factor authentication | Profile menu → Two-factor auth |
| 2. Set `APP_DEBUG=false` and `APP_ENV=production` | `.env` |
| 3. Point the document root at `public/` | Your host's control panel |
| 4. Run the exposure check | System → System |
| 5. Move the admin panel off `/admin` | `CMS_ADMIN_PREFIX` in `.env` |
| 6. Require 2FA for all admins | Settings → Advanced |
| 7. Force HTTPS — **after** the certificate works | Settings → Advanced |
| 8. Switch off modules you do not use | System → Modules |

## Only `public/` belongs on the web

Nothing else in the project is meant to be reachable, and `.env` — the database
password, the key that signs every session cookie, the payment gateway
secrets — sits one level above it.

In practice a lot of installs skip this. The ZIP gets extracted into
`public_html/mysite/`, `mysite/public/` opens fine in a browser, and nothing
gets changed. The project root then sits inside the web root, and `mysite/.env`
is a URL anybody can request.

The root `.htaccess` covers exactly that case. It maps every request into
`public/`, which does two jobs at once: the site answers on
`https://example.com/` without `/public/` in the address, and **nothing outside
`public/` can be reached by URL at all** — not by a list of denied names, but
because no URL resolves anywhere else.

::: danger On nginx, .htaccess does nothing
Neither does it on any host with `AllowOverride` off. There, the root
`.htaccess` is an inert text file and every protection on this page that depends
on it is absent.
:::

### nginx

Set the document root to `public/`, or add:

```nginx
root /path/to/project/public;

location / {
    try_files $uri $uri/ /index.php?$query_string;
}

location ~ ^/(app|bootstrap|config|database|lang|resources|routes|storage|tests|themes|vendor)/ {
    deny all;
}

location ~ /\. {
    deny all;
}
```

And the two rules that stop uploads and theme assets executing:

```nginx
location ^~ /storage/ {
    location ~* \.(php\d?|phtml|phar|pht|cgi|pl|py|sh|shtml|html?)$ { deny all; }
    add_header X-Content-Type-Options nosniff;
}

location ^~ /themes/ {
    location ~* \.(php\d?|phtml|phar|pht|cgi|pl|py|sh|shtml|html?)$ { deny all; }
    add_header X-Content-Type-Options nosniff;
}
```

On Apache those two are already handled by `storage/app/public/.htaccess` and
`public/themes/.htaccess`.

## Verify, do not assume

**System → System → Check exposure** makes your own server request its `.env`,
its config files, its log file and its install lock, and reports what actually
came back.

Green means those files are genuinely unreachable on your host. Re-run it after
any hosting change. See [System health](/system/health#the-exposure-check).

## What Radius does for you

### Authentication

- **Two-factor (TOTP)** with any authenticator app. Secrets and recovery codes
  encrypted at rest. The password check establishes the session but marks it
  **unconfirmed**, and every request is held at the challenge until a valid code
  is entered. Recovery codes work exactly once each.
- **Login rate limited per email *and* per IP** — five attempts in five
  minutes. Two separate limits, so one attacker cannot lock out a legitimate
  user.
- **Role separation** drawn at anything that changes what the site's code does,
  rather than what it says. See [Users & roles](/admin/users#roles).

### Money

- **Stored as integers** in the currency's minor unit, so repeated addition
  never accumulates the rounding error floats would.
- **Cart prices snapshotted** when an item is added; order totals recalculated
  server-side at checkout. The browser sees prices but never decides them.
- **Stock decremented inside the order transaction**, so two people racing for
  the last item cannot both succeed.
- **Order numbers unguessable**, so a customer cannot enumerate other people's
  orders.
- **Payment returns always verified against the provider's API.** A redirect
  back from a gateway proves nothing on its own — the customer controls it.
- **Gateway credentials encrypted at rest** with `APP_KEY`, never sent back to
  the browser once saved.

### Files

- **Uploads are checked**: extension on the allowlist *and* contents matching
  it; program code refused, including PHP hidden after real image data; double
  extensions refused; SVGs stripped of scripts; photos re-encoded, which removes
  EXIF and the GPS coordinates phones embed. See
  [Media library](/admin/media#what-happens-to-an-upload).
- **The uploads folder cannot run code.**
- **Paid downloads are never served by URL.** They live outside the web root and
  leave only through a controller that has checked the order. See
  [Digital products](/shop/digital-products).

### Code

- **Theme uploads are checked**: zip-slip traversal rejected, only allowlisted
  extensions extracted, Blade scanned for raw PHP and shell execution. See
  [Theme security](/appearance/themes#theme-uploads-are-checked).
- **Builder output is constrained**: CSS values stripped of anything that could
  close a rule, element ids validated, `href` schemes restricted, wrapper tags
  allowlisted, trees capped at 2000 nodes and 6 levels. See
  [Builder security](/builder/#security-of-builder-output).
- **Editor content is sanitised on save** against a tag and attribute allowlist,
  with `iframe` sources restricted to a host allowlist. See
  [Pages](/admin/pages#editing-html-directly).
- **Release archives are verified**: HTTPS only, SHA-256 must match, the version
  inside the archive must agree with the manifest, and an allowlist of paths an
  update may write. See [Updates](/system/updates#how-a-release-is-verified).

## What remains yours

Nothing above helps with these:

| Your job | Why it matters |
| --- | --- |
| Keeping PHP patched | Radius cannot patch its own runtime |
| A TLS certificate that works | Sessions and payment returns assume HTTPS |
| Off-server backups | The five update backups are not a backup strategy |
| Strong admin passwords | Rate limiting slows an attacker; it does not stop a guessable password |
| Vetting themes and HTML widgets | Both are ways of running code you did not write |
| Keeping `.env` out of version control | It is in `.gitignore`; keep it there |
| Updating | A known fixed vulnerability is still a vulnerability on an old install |

## The deliberate exceptions

Two places accept raw input on purpose, and both say so in the interface:

- **The HTML widget** in the builder — outputting raw markup is its entire
  purpose.
- **Custom JS and header scripts** in Settings → Appearance — running your
  analytics snippet is the point.

Anything pasted into either runs for every visitor. Paste only what you
understand.

## Reporting a vulnerability

::: danger Never open a public issue for a security problem
Use the private contact address in
[SECURITY.md](https://github.com/InsertCart/radius/blob/main/SECURITY.md).

A public issue tells every operator of every Radius site — and everyone else —
about a hole before there is a fix for it.
:::

## If you think a site is compromised

1. Put it in maintenance mode
2. Change the database password
3. Run `php artisan key:generate` — then **re-enter every gateway credential**,
   because the old key decrypted them
4. Force a password reset on every admin account and reset their second factors
5. Read the [activity log](/system/health#activity-log) for what was done, and
   the [application log](/system/health#application-log) for how
6. Compare files against a clean release; an update reports locally modified
   files, which is a useful signal here
7. Restore from a backup predating the compromise if you have one
