---
title: "Preview themes and demos"
description: "Use the Radius CMS Theme Preview plugin to preview storefront themes and demos before changing the active theme."
---

# Theme Preview

**Theme Preview** is a [plugin](/system/plugins) for looking at a theme
without activating it. It does two jobs:

- **Admin preview.** Open any installed theme and browse the whole site in it.
  Your visitors keep seeing the active theme.
- **Public live demos.** Let anyone browse the themes you choose. This is the
  link to give buyers if you sell themes: each demo is the complete, working
  site in that design.

<ScreenList :screens="[
  { route: '/admin/theme-preview', name: 'Theme preview', role: 'Administrator' },
  { route: '/theme-demo', name: 'Public demo gallery', role: 'Anyone' },
]" />

## Setting it up

1. Install the plugin under *System → Plugins* and switch it on.
2. Go to *Appearance → Theme preview*.
3. Tick each theme the public may browse. You can add a **Buy link** to any of
   them.
4. Turn on **Let anyone browse the ticked themes** and save.

## Previewing a theme yourself

Every theme card on *Appearance → Themes* now has a **Preview** button, which
opens the site in that theme in a new tab. A bar along the bottom of the page
lets you:

- switch to another theme on the same page
- **Activate** the theme, which makes it live and takes you to the same page
  on the real site
- **Exit preview**

Administrators can preview any installed theme, public or not.

## Public demos

Each public theme has an address of its own:

```
https://example.com/theme-demo/zenith
https://example.com/theme-demo/zenith/shop
https://example.com/theme-demo/storefront/blog
```

The theme is part of the address, so a visitor can open several demos in
separate tabs and compare them side by side. Every link in a demo stays inside
it, including menu items and links typed into page content.

`https://example.com/theme-demo` lists every public demo with its screenshot,
a **Live demo** button and its buy link. It is one link that covers all of
them.

::: tip A demo is the real site
Demo pages use your real content and the real shop. Visitors can search, add to
the cart and check out. If you sell themes, run your demos on a site set up
for the purpose, filled with the sample content from
[`cms:demo`](/reference/cli#cms-demo).
:::

### Who sees what

| Request | Visitor | Administrator |
| --- | --- | --- |
| A public theme | The demo | The demo, with Activate |
| An installed theme that isn't public | Sent to the same page on the real site | The preview |
| A theme that isn't installed | Page not found | Page not found |
| `/theme-demo/<theme>/admin/…` | Sent to the real admin address | Sent to the real admin address |

### Search engines

A demo repeats the whole site at another address. To keep search engines from
indexing it twice, every demo page is marked `noindex, nofollow` (in both the
HTTP header and the page), and its canonical link points to the real page.

## Settings

| Setting | Default | |
| --- | --- | --- |
| **Let anyone browse the ticked themes** | Off | The master switch for public demos |
| **Buy link** | — | Set per theme. Shown on the demo bar and in the gallery |
| **Address prefix** | `theme-demo` | Radius refuses a prefix already used by a page, the admin panel or the API |
| **Show the theme switcher bar to visitors** | On | Administrators always see the bar |
| **List every public demo at the prefix address** | On | The gallery page |
| **Gallery heading** | Theme demos | |
| **Buy button label** | Buy this theme | |

## Page cache

With [page caching](/settings/) on, demo pages are cached separately from real
ones. A cached demo is never served in place of the real page, even for the
active theme.

## Uninstalling

Switch the plugin off, then choose **Uninstall** under *System → Plugins*. Its
settings are removed along with it. Your themes are not affected.
