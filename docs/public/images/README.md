# Screenshots

Every screen in Radius has a slot waiting for it in these docs. Until the file
exists, the page renders a labelled placeholder naming the exact path to drop
the file at — so nothing needs editing when you add one, and no layout shifts.

## Finding what is still needed

```bash
npm run shots
```

That prints every missing screenshot grouped by the page that wants it, plus any
image on disk that no page references.

You can also just run `npm run dev` and browse — every placeholder shows its own
path and the route to capture.

## Adding one

1. Run `npm run shots` to see the path a page expects, for example
   `docs/public/images/shop/orders-list.png`
2. Capture that screen
3. Save it at exactly that path
4. Refresh — the placeholder is replaced automatically

No markdown edit is needed. The filename **is** the wiring.

## Folders

| Folder | Covers |
| --- | --- |
| `install/` | The setup wizard |
| `dashboard/` | Sign-in, two-factor challenge, the dashboard |
| `content/` | Pages, posts, categories, comments, menus, media |
| `builder/` | The visual builder |
| `shop/` | Products, orders, coupons, payments |
| `appearance/` | Themes |
| `settings/` | The nine settings screens |
| `system/` | Modules, health, updates, backups, logs |
| `users/` | Users, roles, two-factor setup |
| `marketing/` | Contact inbox, subscribers, SEO tools |
| `storefront/` | The public site |

## How to capture them

Consistency matters more than perfection — mismatched screenshots look worse
than plain ones.

**Browser**

- Width **1440px**, at 1× or 2× device pixel ratio (pick one and stay with it)
- Light theme, unless the page is specifically about dark mode
- No browser chrome, no bookmarks bar, no extensions visible
- Hide your own cursor

**The site**

- Run `php artisan cms:demo` first. Its catalogue deliberately includes an
  out-of-stock item, a backorder, a sale inside a date window, a digital
  product, a draft, a scheduled post and an unapproved comment — so lists look
  like real lists.
- Sign in as an **administrator**, so no sections are missing
- Turn **every module on** before capturing the sidebar or the dashboard
- Use the shipped Radius branding, not a client's logo

**Cropping**

- Full-width screens: the whole content area, including the sidebar
- A single panel or field: crop tight, leave ~16px of surrounding context
- Never crop mid-row or mid-label

## Privacy — read this before capturing anything

::: danger Screenshots leak more than people expect
These are published on a public site.
:::

Never capture:

- Real customer names, emails, addresses or phone numbers
- Real order data
- Any API key, secret, token or password — including partly masked ones
- Your admin URL if you have changed `CMS_ADMIN_PREFIX`
- The contents of `.env`, or a log containing a stack trace with paths
- Browser tabs, bookmarks or notifications from other sites

Use demo content for everything. If a real value has to appear, blur it — do not
just cover it with a coloured box, since an image can carry the original
underneath depending on how it was edited.

## File format and size

| | |
| --- | --- |
| Format | PNG for UI, JPEG only for photographic content |
| Max width | 2880px (that is 1440 at 2×) |
| Target size | Under 300 KB each; compress before committing |
| Naming | `kebab-case.png`, describing the screen — `order-detail.png`, not `Screenshot_2026.png` |

Run them through an optimiser before committing. A docs repo full of 2 MB PNGs
is slow to clone and slow to load.

## Alt text is already written

Each `<Screenshot>` slot carries alt text describing what the image will show.
It is part of the page, not an afterthought — if your capture ends up showing
something different from what the alt text says, update the alt text in the
markdown too.

## Retaking after a UI change

When a screen changes, replace the file at the same path. Nothing else needs
touching.

If a screen is **removed** from the product, delete both its `<Screenshot>` tag
and the file — `npm run shots` will report the orphan if you forget the second
part.
