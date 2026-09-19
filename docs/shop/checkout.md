# Checkout & addresses

<ScreenList :screens="[
  { route: '/checkout', name: 'Checkout', role: 'Public' },
  { route: '/account/addresses', name: 'Customer address book', role: 'Customer' },
  { route: '/admin/settings/shop', name: 'Shop settings' },
]" />

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
