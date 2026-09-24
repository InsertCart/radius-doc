# Checkout & addresses

<ScreenList :screens="[
  { route: '/checkout', name: 'Checkout', role: 'Public' },
  { route: '/account/addresses', name: 'Customer address book', role: 'Customer' },
  { route: '/admin/settings/shop', name: 'Shop settings' },
  { route: '/admin/settings/checkout', name: 'Checkout field settings' },
]" />

## Choosing the checkout fields

**Settings → Checkout** decides what checkout asks for. Each field is set to
one of three positions:

| Position | On the form | When the order is placed |
| --- | --- | --- |
| **Required** | Shown, and the browser will not submit it blank | Refused if blank |
| **Optional** | Shown | Accepted blank |
| **Hidden** | Left off | Anything sent for it is thrown away |

| Field | Default |
| --- | --- |
| Phone | Optional |
| Street address | Required |
| Apartment, suite, unit | Optional |
| City | Required |
| State / region | Optional |
| Postcode / ZIP | Optional |
| Country | Required |
| Order notes | Optional |

**Email address** and **Full name** are always required. An order with no email
cannot be confirmed or looked up, and every payment provider needs a name.

The choice is enforced by the server, not just the form. A crafted request
cannot skip a required field or slip a hidden one onto an order. The same rules
apply to the website checkout, the builder's **Checkout** widget and the
[mobile API](/developers/mobile-api#checkout-and-payment).

A few things follow from it:

- **Country stays required while you sell to chosen countries.** The shop has
  to know where an order is going to refuse the places it doesn't serve (see
  [Where you sell](#where-you-sell)).
- **Hiding every address field removes the address entirely.** The section is
  renamed **Your details**, and **Ship to a different address** disappears. This
  suits a shop that only sells downloads.
- **A different delivery address follows the same rules.** If a postcode is
  required, it is required for the delivery address too, but only once the
  customer ticks **Ship to a different address**.
- **The address book needs a whole address.** If you hide or make optional the
  street, city or country, an order that leaves one of them out is still placed,
  but that address is not saved to the customer's account.

::: warning Third-party themes
The bundled themes and the builder's Checkout widget follow these settings. A
theme that draws its own checkout has to support them too; see
[Checkout fields](/appearance/theme-development#checkout-fields). Before making a
field **Required**, check that your theme shows it. A required field the form
never draws means nobody can place an order.
:::

## Where you sell

**Settings → Shop → Sell to** decides which countries checkout will accept an
order from. It has two positions:

| Setting | What happens |
| --- | --- |
| **The whole world** (default) | Every country is offered at checkout |
| **Only the countries I choose** | Reveals **Countries you sell to** — a searchable list of checkboxes |

The country list is a dropdown with a search box: type `uni` to narrow it to the
United Arab Emirates, United Kingdom and United States, tick the ones you want,
and the button shows what you picked. **Select these** ticks everything the
current search is showing, so you can add a region in one go.

::: tip An empty list still sells worldwide
Turning **Sell to** to the chosen-countries option before you have ticked
anything would otherwise stop the shop taking a single order. Until at least one
country is ticked, the shop keeps selling everywhere.
:::

Once countries are chosen, three things follow:

- the **Country** dropdown at checkout only lists them;
- an order billed or delivered anywhere else is **refused server-side**, so a
  crafted form cannot get around the dropdown;
- the same list is used for the address book in the customer's account.

Countries are stored on the order as their two-letter ISO code (`IN`, `GB`,
`US`) rather than as free text, so "USA", "U.S.A." and "United States" can no
longer end up as three different places in your order list. Screens that show an
address spell the name out. Orders taken before this existed keep whatever text
was typed at the time and still read correctly.

## Addresses a customer only types once

**Settings → Shop → Remember customer addresses** (on by default) means nobody
has to type their own address at every checkout.

### What the customer sees

- **First order.** They fill the address in as usual. It is saved once the order
  exists — a checkout that failed on the way through never leaves anything
  behind.
- **Every order after that.** Checkout opens with the address already filled in.
- **More than one saved address.** A **Use a saved address** picker appears above
  the billing fields. Choosing one reloads checkout with those details in place.
  It is an ordinary form, not script, so it works in any browser.
- **A one-off delivery.** Typing a different address does *not* quietly add it to
  their account. A **Save this address to my account** tickbox does that, and the
  saved address then becomes their default.

Guests get the same convenience, kept in their browser session rather than an
account, so coming back the same day still finds the form filled in.

### The address book

Signed-in customers get an **Addresses** page in their account, alongside Orders
and Profile. From there they can add an address, edit one, remove one, and
choose which is used by default at checkout. One address is always the default;
removing it promotes whichever is left.

::: info An order keeps its own copy
The address written on an order is a snapshot taken at the time. A customer
editing or deleting an address book entry afterwards never rewrites the history
of an order that has already shipped.
:::

Switching **Remember customer addresses** off returns checkout to a blank form
every time and hides the account page. Addresses already saved are left alone,
so turning it back on restores them.
