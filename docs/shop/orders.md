# Orders & coupons

<ScreenList :screens="[
  { route: '/admin/orders', name: 'Order list' },
  { route: '/admin/orders/{id}', name: 'Order detail' },
  { route: '/admin/orders/{id}/invoice', name: 'Printable invoice' },
  { route: '/admin/coupons', name: 'Coupon list' },
  { route: '/admin/coupons/create', name: 'New coupon' },
]" />

## The order list

<Screenshot
  src="shop/orders-list.png"
  screen="/admin/orders"
  wide
  alt="The order list showing order number, customer, total, payment state, fulfilment status and date" />

Filter by status, payment state and date range. Search matches order number,
customer name and email.

Order numbers are **unguessable** — they carry a random component rather than
incrementing — so a customer cannot enumerate other people's orders by editing
a URL. The prefix comes from **Settings → Shop → Order number prefix**.

## An order

<Screenshot
  src="shop/order-detail.png"
  screen="/admin/orders/{id}"
  wide
  tall
  alt="An order detail screen with line items, totals, customer and address panels, payment transaction log and status controls" />

| Panel | Contains |
| --- | --- |
| **Line items** | What was bought, at the price paid |
| **Totals** | Subtotal, discount, tax, shipping, grand total |
| **Customer** | Name, email, phone, and account link if registered |
| **Addresses** | Billing and shipping as entered |
| **Payment** | Gateway, transaction reference, and every callback received |
| **Timeline** | Status changes, with who made them and when |

The **payment panel** is the one to read when something looks wrong. It records
each interaction with the gateway, so you can see whether a webhook arrived, was
rejected, or never came.

## Two separate states

This trips people up, so it is worth being explicit:

| State | Values | Means |
| --- | --- | --- |
| **Payment** | Pending, paid, failed, refunded | Whether you have the money |
| **Fulfilment** | Pending, processing, shipped, completed, cancelled | Whether the customer has the goods |

They move independently. A bank transfer order is `pending` payment and can
still be `processing` fulfilment if you choose to trust it. Digital downloads
unlock on **payment**, not fulfilment.

### Marking an order paid by hand

For cash on delivery and bank transfer, **Mark as paid** records payment you
received outside the system. This unlocks any digital downloads on the order, so
only use it once the money has actually arrived.

## Refunds

| Gateway | Refund from admin |
| --- | --- |
| Stripe, PayPal, Razorpay, PayU, Cashfree | Yes |
| Wise, cash on delivery, bank transfer | No — refund at your bank, then mark it here |

A refund through a supported gateway calls the provider's API and records the
result. Partial refunds are supported where the provider supports them.

::: warning Refunding does not restock
Stock is not returned automatically, because a refund does not tell you whether
the goods came back. Adjust the stock figure yourself if they did.
:::

## Reconcile

The **Reconcile** button re-queries the gateway for an order's true state.

Use it when an order looks stuck — a customer who says they paid while the order
says pending. This usually means a webhook never arrived, and reconciling asks
the provider directly rather than waiting.

## Invoices

<Screenshot
  src="shop/order-invoice.png"
  screen="/admin/orders/{id}/invoice"
  alt="A printable invoice showing site branding, order details and totals" />

A printable invoice per order, using your logo from Settings → General and your
address from Settings → General.

Fill in your business address before you send one — the template renders what is
there, including nothing.

## Coupons

<Screenshot
  src="shop/coupons-list.png"
  screen="/admin/coupons"
  alt="The coupon list showing code, type, value, usage count and expiry" />

<Screenshot
  src="shop/coupon-edit.png"
  screen="/admin/coupons/create"
  alt="The coupon editor with code, discount type, value, minimum spend, usage limits and date window" />

| Field | Notes |
| --- | --- |
| **Code** | What the customer types. Case-insensitive |
| **Type** | Percentage, fixed amount, or free shipping |
| **Value** | The percentage or the amount |
| **Minimum spend** | Cart subtotal below which it does not apply |
| **Usage limit** | Total redemptions across all customers |
| **Per-customer limit** | Redemptions by one account |
| **Starts / expires** | Optional date window |
| **Products / categories** | Restrict which items it discounts |

Validation happens **server-side at checkout**, not when the code is typed. A
coupon that expired between the cart and the payment is rejected.

::: tip Percentage coupons and shipping
A percentage discount applies to the item subtotal, not to shipping or tax. Use
the free-shipping type if that is what you mean.
:::

## Webhooks matter here

A customer who closes the tab after paying never returns to your site, so the
redirect that would have confirmed their order never happens. The gateway's
**webhook** is what marks that order paid.

If orders are regularly sitting at `pending` while customers insist they paid,
the webhook URL is missing or wrong in the provider's dashboard. See
[Payment gateways](/shop/payments#webhooks).
