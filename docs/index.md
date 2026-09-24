---
layout: home

hero:
  name: Radius
  text: Documentation
  tagline: A modular, self-hosted CMS and eCommerce platform built on Laravel 12. Install it once on your own hosting, and own it.
  image:
    light: /radius-logo.png
    dark: /radius-logo-light.png
    alt: Radius
  actions:
    - theme: brand
      text: Install Radius
      link: /guide/installation
    - theme: alt
      text: Download Radius
      link: https://github.com/InsertCart/radius/releases/latest/download/radius.zip
    - theme: alt
      text: What Radius is
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/InsertCart/radius

features:
  - title: Install in an afternoon
    details: Upload, create an empty database, open your site. A four-step wizard checks your server, writes the config, migrates and creates your admin account.
    link: /guide/installation
    linkText: Installation guide
  - title: Thirteen modules, nine optional
    details: A switched-off module registers no routes and runs no queries, so a blog-only site carries none of the shop's weight.
    link: /system/modules
    linkText: Managing modules
  - title: A builder that renders on the server
    details: Drag and drop into a tree of sections, columns and widgets. What ships to the visitor is plain HTML and one stylesheet.
    link: /builder/
    linkText: Visual builder
  - title: A shop with the hard parts done
    details: Integer money, server-side totals, stock decremented inside the order transaction, and paid downloads that never sit at a URL.
    link: /shop/
    linkText: Shop guide
  - title: Eight ways to take payment
    details: Stripe, PayPal, Razorpay, PayU, Cashfree, Wise, cash on delivery and bank transfer — with verified webhooks and admin refunds.
    link: /shop/payments
    linkText: Payment gateways
  - title: Updates you can verify
    details: HTTPS only, a SHA-256 that must match, and an allowlist of paths a release may write. Nothing installs itself.
    link: /system/updates
    linkText: Updates & backups
---

## Where to start

| If you are… | Start here |
| --- | --- |
| Installing Radius for the first time | [Requirements](/guide/requirements), then [Installation](/guide/installation) |
| Just finished installing | [First steps](/guide/first-steps) — the six things to do before going live |
| Building pages and writing content | [The dashboard](/admin/dashboard) and [Pages](/admin/pages) |
| Setting up a shop | [Products & stock](/shop/), then [Payment gateways](/shop/payments) |
| Designing a theme | [Building a theme](/appearance/theme-development) |
| Rebranding Radius for a client | [Branding](/appearance/branding) |
| Extending the builder | [Building a widget](/builder/custom-widgets) |
| Moving a site to a new host | [Security](/system/security) and [Environment variables](/reference/env) |

## About this documentation

These pages describe **Radius 1.1.2**. Radius is under active development, so
features arrive and screens change; each page records when it was last
reviewed at the bottom.

If something here is wrong or out of date, the fastest fix is the
**"Suggest a change to this page"** link at the foot of any page — it opens
that page's markdown source directly on GitHub.

::: warning Security issues are not bug reports
Never open a public issue for a security problem. Use the private contact
address in [SECURITY.md](https://github.com/InsertCart/radius/blob/main/SECURITY.md).
:::
