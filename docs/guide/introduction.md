# What Radius is

Radius is a **content management system and online store** that you install on
your own hosting. It is built on Laravel 12, runs on PHP 8.2 and MySQL, and is
open source under the MIT licence.

That licence is the important part. You may use it commercially, fork it, and
build closed-source themes and plugins on top of it. There is no per-seat fee,
no revenue share, and no account to keep paying for.

## What you get

| | |
| --- | --- |
| **Content** | Pages with a visual builder, a blog with categories, tags and comments, menus, and a media library |
| **Shop** | Products with variants, stock tracking, digital downloads, coupons, orders, refunds and invoices |
| **Payments** | Stripe, PayPal, Razorpay, PayU, Cashfree, Wise, cash on delivery, bank transfer |
| **Marketing** | SEO meta and sitemaps, contact forms, newsletter capture, transactional SMS, web push |
| **Administration** | Roles, two-factor authentication, an activity log, a health checklist, self-installing updates |

Everything above the administration row is a **module**, and eight of the twelve
can be switched off. See [Modules](/system/modules).

## The shape of the thing

Radius is one Laravel application, not a core plus a marketplace of plugins.
Three consequences follow, and they explain most of the design decisions
documented in these pages:

**A disabled feature costs nothing.** Switching off a module means it registers
no routes, runs no queries, adds no menu entries, and its builder widgets
disappear from the palette. It is not hidden — it is absent.

**The builder and your theme are not rivals.** A theme keeps owning its own
markup until it explicitly hands a region over. A theme with no
`@region` markers is completely unaffected by the builder. See
[Theme regions](/builder/regions).

**Pages are rendered on the server.** The builder produces Blade, and Blade
produces HTML. A built page ships as plain markup with one stylesheet and needs
no JavaScript to be read. That is what makes builder output fast and indexable.

## What Radius is not

Being straight about this saves everybody time.

- **It is not a hosted service.** Nobody is managing your backups, your TLS
  certificate or your PHP version. You are. If that is unwelcome, a hosted
  builder is a reasonable purchase.
- **It is not a WordPress plugin host.** WordPress plugins and themes do not
  work here. Themes are Blade templates.
- **It is not multi-site.** One install serves one site.
- **It does not need Node on the server.** Assets are built before release;
  a buyer's host only needs PHP and MySQL.

## The admin panel at a glance

<Screenshot
  src="dashboard/admin-overview.png"
  screen="/admin"
  wide
  tall
  alt="The Radius admin panel, showing the sidebar navigation and dashboard"
  caption="The admin panel. The sidebar only lists sections belonging to modules that are switched on, so your install may show fewer entries than this." />

## Where to go next

- [Requirements](/guide/requirements) — check your host before you upload anything
- [Installation](/guide/installation) — the four-step wizard, or the command line
- [First steps](/guide/first-steps) — what to do in the first ten minutes
