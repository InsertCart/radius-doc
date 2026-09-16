# Radius documentation

The source for **docs.insertcart.com** — documentation for
[Radius](https://github.com/InsertCart/radius), a modular self-hosted CMS and
eCommerce platform.

Built with [VitePress](https://vitepress.dev). Deployed to GitHub Pages on every
push to `main`.

## Running it locally

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # production build into docs/.vitepress/dist
npm run preview    # serve that build
npm run shots      # list screenshots still missing
```

The build **fails on a dead internal link** (`ignoreDeadLinks: false`), so run
`npm run build` before pushing a page with new cross-references.

## Layout

```
docs/
├── .vitepress/
│   ├── config.mts              site config, nav and the whole sidebar
│   └── theme/
│       ├── index.ts            registers the global components
│       ├── custom.css          palette and typography
│       └── components/
│           ├── Screenshot.vue  a screenshot slot with a placeholder
│           └── ScreenList.vue  a table of the routes a page covers
├── public/
│   ├── CNAME                   docs.insertcart.com
│   └── images/                 screenshots, one folder per section
├── index.md                    home page
├── guide/                      install and first steps
├── admin/                      the admin panel, screen by screen
├── builder/                    the visual builder
├── shop/                       products, orders, payments
├── appearance/                 themes and branding
├── settings/                   all nine settings screens
├── system/                     modules, health, updates, security
├── reference/                  CLI and environment variables
└── developers/                 layout, local setup, releases
```

## The two components

Both are registered globally — no import needed in a page.

### `<Screenshot>`

Every screen in the product gets one of these, **whether or not the image exists
yet**. When the file is missing it renders a labelled placeholder naming the
exact path to save to and the route to capture.

```md
<Screenshot
  src="settings/general.png"
  screen="/admin/settings/general"
  wide
  alt="The General settings screen with site name, logo and timezone"
  caption="Optional line shown under the image." />
```

| Prop | Required | Notes |
| --- | --- | --- |
| `src` | yes | Path under `docs/public/images/` |
| `alt` | yes | These images carry real information; describe them |
| `screen` | no | The route to capture, shown on the placeholder |
| `caption` | no | Rendered under the image |
| `wide` | no | Breaks out wider than the prose column on large viewports |
| `tall` | no | Reserves more placeholder height, for a long screen |

Adding a screenshot needs **no markdown edit** — save the file at the path the
placeholder names and it appears. See
[`docs/public/images/README.md`](docs/public/images/README.md) for capture
conventions and the privacy rules.

### `<ScreenList>`

A table of the admin routes a page covers, and the minimum role for each. Useful
at the top of a section page.

```md
<ScreenList :screens="[
  { route: '/admin/products', name: 'Product list' },
  { route: '/admin/products/create', name: 'New product', role: 'Editor' },
]" />
```

## Keeping these docs current

Radius gains features continuously, so this repository is expected to change
with it rather than being written once.

### When a feature is added

1. Write the page, or the section, where a reader would look for it first
2. Add it to the sidebar in `docs/.vitepress/config.mts` — **a page not in the
   sidebar is effectively invisible**
3. Add a `<Screenshot>` slot for every new screen, even before the image exists
4. Add the new folder under `docs/public/images/` if the section is new
5. Cross-link from related pages
6. `npm run build` to catch dead links

### When a feature changes

- Replace the screenshot file at the same path; nothing else needs touching
- Check the `<ScreenList>` at the top of the page still matches the routes
- Grep for the old behaviour across `docs/` — details get repeated deliberately,
  so the same fact often lives in two places

### When a version ships

1. Bump `RADIUS_VERSION` in `docs/.vitepress/config.mts`
2. Review the pages the release touched

### Facts that live in more than one place

Some details are deliberately repeated where a reader needs them. When one
changes, these are the pages to check together:

| Fact | Pages |
| --- | --- |
| PHP and MySQL versions | `guide/requirements`, `guide/introduction` |
| Module list | `system/modules`, `guide/introduction` |
| Settings fields | `settings/index` — and wherever a page links to a specific field anchor |
| Payment gateway list | `shop/payments`, `guide/introduction`, `index.md` |
| Widget list | `builder/widgets` |
| Upload rules | `admin/media`, `system/security` |
| What an update touches | `system/updates`, `developers/project-layout` |
| `.env` variables | `reference/env`, `reference/cli` |

## Writing style

Match the existing pages:

- **Say what it does, then why.** The "why" is what a reader cannot get from
  the interface.
- **Second person, present tense.** "Open Settings → Email", not "the user
  should navigate to".
- **Tables for reference, prose for explanation.** A field list is a table. A
  decision is prose.
- **Name the real path.** `storage/app/private/downloads/`, not "the downloads
  folder".
- **Flag the traps.** Use `::: warning` for something that will cost time and
  `::: danger` for something that loses data, money or security. Do not spend
  them on ordinary advice.
- **No marketing.** This is documentation; the pitch lives on the main site.

## Deployment

`.github/workflows/deploy.yml` builds and publishes on every push to `main`. A
pull request builds but does not publish, so a broken build is caught first.

### Pointing the subdomain at it

1. `docs/public/CNAME` already contains `docs.insertcart.com`
2. Add a DNS `CNAME` record: `docs` → `insertcart.github.io`
3. In the repository's **Settings → Pages**, set the source to **GitHub
   Actions**, then enter the custom domain and enable **Enforce HTTPS**

The certificate takes a few minutes to issue after the DNS record resolves.

::: note Serving from a project subpath instead
If you ever drop the custom domain and serve from
`insertcart.github.io/radius-docs/`, set `base: '/radius-docs/'` in
`docs/.vitepress/config.mts`. Leave it as `'/'` for the subdomain.
:::

## Search

Local index, built at deploy time. No account, no third-party service, no
per-search cost. Configured under `themeConfig.search` in the config.

If the corpus grows past the point where a local index is comfortable,
[Algolia DocSearch](https://docsearch.algolia.com) is free for open-source docs
and is a drop-in replacement for that config block.

## Licence

Documentation content is published under the same MIT licence as Radius itself.
