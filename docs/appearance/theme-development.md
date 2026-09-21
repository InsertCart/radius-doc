# Building a theme

Themes are Blade templates. If you have written a Laravel view, you have
written a Radius theme.

## Start from a copy

```bash
cp -r themes/default themes/my-theme
```

Then edit `themes/my-theme/theme.json` and press **Re-scan themes** in
Appearance → Themes.

Starting from `default` rather than an empty folder means you inherit working
templates for every screen and can replace them one at a time.

## theme.json

```json
{
  "name": "My theme",
  "slug": "my-theme",
  "version": "1.0.0",
  "author": "Your name",
  "description": "One line, shown in the theme list.",
  "screenshot": "screenshot.png",

  "regions": {
    "header": "Site header",
    "footer": "Site footer",
    "before_content": "Before page content",
    "after_content": "After page content"
  }
}
```

Only `name` and `version` are required.

| Key | Does |
| --- | --- |
| `slug` | Fixes the theme's identifier/folder name instead of deriving it from `name` |
| `regions` | Declares which parts the [visual builder](/builder/regions) may take over |

::: tip Menus are not declared in theme.json
There is no `menus` key. A menu's **slug**, set when it is created in
[Menus](/admin/menus), is what connects it to your theme — your theme decides
which slugs it looks up (see [Menus](#menus) below). A `supports` array is
likewise not read by the CMS; it has no effect on anything, including dark mode
(see [Branding](#branding) below).
:::

### Screenshot

Keep **one** preview image, in the theme's root folder beside `theme.json`, and
name it in the `screenshot` key. It is published for you when the theme is
installed or activated — do not put a second copy in `assets/`.

| | |
| --- | --- |
| Size | **1200 × 675** pixels (16:9) |
| Format | PNG, or JPG / WebP for a photographic design |
| Weight | Under 500 KB |

Every place a preview appears — the theme list, the theme directory, a theme's
details page — shows it in a 16:9 frame, so any other shape is cropped. Capture
the theme's homepage in a browser window 1200 pixels wide.

Save the file in the format its name says. A JPEG renamed to `.png` still shows
in most browsers, but `cms:theme-package` flags it.

An SVG illustration is accepted, but a real screenshot of the finished theme is
what makes someone choose it.

## The view tree

| View | Renders |
| --- | --- |
| `layout.blade.php` | The wrapper every page extends |
| `home.blade.php` | The front page, when no homepage is set |
| `pages/show.blade.php` | A single page |
| `blog/index.blade.php` | The post index |
| `blog/show.blade.php` | A single post |
| `blog/category.blade.php` | A category archive |
| `blog/tag.blade.php` | A tag archive |
| `shop/index.blade.php` | The shop index |
| `shop/show.blade.php` | A product |
| `shop/cart.blade.php` | The cart |
| `shop/checkout.blade.php` | Checkout |
| `partials/*.blade.php` | Whatever you split out |

Leave any of them out and the default theme's version is used.

## A minimal layout

```blade
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Meta tags, canonical, Open Graph and schema.org --}}
    {!! seo()->render() !!}

    @include('partials.favicon')

    <link rel="stylesheet" href="{{ theme_asset('css/theme.css') }}">

    {{-- Custom CSS and header scripts from Settings → Appearance --}}
    @stack('head')
</head>
<body>
    @region('header')
        <header class="site-header">
            <a href="{{ url('/') }}">
                <x-site-logo on="light" class="h-10 w-auto" />
            </a>
            @foreach ($siteMenus['primary'] ?? [] as $item)
                @continue(! $item->isVisible())
                <a href="{{ $item->resolveUrl() }}">{{ $item->label }}</a>
            @endforeach
        </header>
    @endregion

    <main>
        @yield('content')
    </main>

    @region('footer')
        <footer>
            <p>&copy; {{ date('Y') }} {{ setting('site_name') }}</p>
        </footer>
    @endregion

    @stack('scripts')
</body>
</html>
```

`@stack('head')` and `@stack('scripts')` are not optional in practice — they are
where Custom CSS, header scripts, and any widget's own assets are injected.
A theme that omits them silently breaks those settings.

## Helpers available in a theme

### Site

```php
setting('site_name')            // any value from Settings
setting('shop_currency', 'USD') // with a fallback
theme_asset('css/theme.css')    // a URL under public/themes/<slug>/, versioned
safe_url($settings['link'])     // a link typed in the builder, or '' if unsafe
safe_route('shop.index')        // route(), or '' if the route doesn't exist right now
format_date($post->published_at)
money($product->price)          // minor units formatted as currency; also @money(...) in Blade
theme_view('search.form')       // this theme's own view if it has one, else the CMS's
```

::: tip There is no per-theme "options" screen
A theme cannot declare its own settings for the site owner to fill in outside
the builder. If a theme needs to be configurable, use [builder section
controls](#declare-the-sections) (owner-editable per region) or read [Settings
→ Appearance → Custom CSS](/settings/#appearance) for styling.
:::

### Branding

Views never read `setting('site_logo')` directly and never pick an ink
themselves. They use one component, which names **the background** — the thing
whoever writes the tag can actually see:

```blade
<x-site-logo class="h-10 w-auto" />             {{-- follows the colour scheme --}}
<x-site-logo on="light" class="h-10 w-auto" />  {{-- surface is always pale --}}
<x-site-logo on="dark" small class="h-8" />     {{-- surface is always dark --}}
```

`on="auto"` (the default) resolves through the site-wide **Color scheme**
setting (Settings → Appearance) — not anything declared by the theme. On
*Always light* or *Always dark* the choice is made server-side; on *Follow
visitor system setting* the component emits a `<picture>` with a
`prefers-color-scheme` source, because the server never learns what the
visitor's browser prefers.

::: tip If your theme is light-only, say so explicitly
Ask for `on="light"`. A white logo on a bar that never darkens is just an
invisible logo. Only use `auto` if your theme's CSS actually looks right in
both colour schemes — there is no `theme.json` flag to declare this either way.
:::

Full helper list in [Branding](/appearance/branding#helpers).

### Menus

Every theme view is handed `$siteMenus`, an array keyed by menu **slug** of
that menu's top-level items (each with `children` eager loaded):

```blade
@foreach ($siteMenus['primary'] ?? [] as $item)
    @continue(! $item->isVisible())
    <a href="{{ $item->resolveUrl() }}" target="{{ $item->target }}"
       @class(['active' => request()->url() === $item->resolveUrl()])>
        {{ $item->label }}
    </a>
@endforeach
```

Use `$item->resolveUrl()`, not `$item->url` — a page or post item stores the
page/post it points at, not a literal URL, so `->url` is empty for those types.
`isVisible()` applies the item's Visibility setting (signed-in / signed-out
only) and hides it if its module is off. There is nothing in `theme.json` that
declares which slugs exist; a theme simply documents which ones it looks up
(`primary`, `footer`, whatever it needs), and the site owner points a menu at
that slug in [Menus](/admin/menus).

### Modules

Never assume a module is on:

```blade
@if (modules()->enabled('shop'))
    <a href="{{ route('shop.index') }}">Shop</a>
@endif
```

A theme that links to `route('shop.index')` unconditionally throws when the
shop is off, because that route does not exist. `safe_route('shop.index')`
(above) is a shorthand for the same guard when you just need the URL.

The `@module` / `@endmodule` directive does the same check for a block of
markup, and `@anymodule('shop', 'blog')` ... `@endanymodule` is true if any of
the named modules is on:

```blade
@module('shop')
    <a href="{{ route('shop.index') }}">Shop</a>
@endmodule
```

### Media

```blade
<img src="{{ $post->image_url('medium') }}" alt="{{ $post->image_alt }}">
```

Sizes are `thumb`, `medium`, `large`, or omit for the original. `media_url($path)`
resolves a stored media path to its public URL directly, for cases outside a
model's own `image_url()` accessor.

### SEO

```blade
{!! seo()->render() !!}
```

Or, as a directive: `@seoHead`. One call emits the title, description,
canonical, Open Graph, Twitter card and schema.org graph. Do not hand-write
these tags — the [SEO module](/settings/#seo) already resolves per-page
overrides against site defaults.

### Search

Site search, including the live results dropdown, is provided by the CMS. To
give a search form live results, name what it searches and add
`@searchScripts` after it:

```blade
<form method="GET" action="{{ route('shop.index') }}" role="search" data-radius-search="product">
    <input type="search" name="q" value="{{ request('q') }}" autocomplete="off">
</form>
@searchScripts
```

Restyle the dropdown with `--radius-search-*` CSS properties, or override
`views/search/index.blade.php`, `form.blade.php` or `script.blade.php`. See
[Search internals](/developers/search#theming-search) for every option.

## Assets

Put CSS and JS in `assets/`, reference with `theme_asset()`. On activation the
folder is copied to `public/themes/<slug>/`.

`theme_asset()` appends a version taken from the published file, so a changed
stylesheet reaches returning visitors on its own:

```blade
<link rel="stylesheet" href="{{ theme_asset('css/theme.css') }}">
{{-- renders .../themes/your-theme/css/theme.css?v=b11748a7f3 --}}
```

**Do not add your own `?v=`**, and do not rely on bumping `version` in
`theme.json` to bust caches — that only works when somebody remembers to do it.
For the rare file that must keep a bare URL, pass `versioned: false`.

There is **no build step for themes**. If you want Tailwind or Sass, compile it
before packaging and ship the output.

::: warning Do not load libraries from a CDN
A theme that pulls a script from a CDN makes every page hostage to somebody
else's uptime, and hands them execution on your site. Ship the file in
`assets/`.
:::

## Builder sections and starters

A site owner can only rearrange what the builder can see. Without help, a
region such as your header opens as an empty canvas, and rebuilding your design
from generic widgets never looks quite the same. So hand the builder your own
sections.

### Declare the sections

Each section is a Blade view in `views/sections/` plus an entry in `theme.json`.
Its controls become the section's settings panel:

```json
"sections": {
  "rail": {
    "label": "Product rail",
    "icon": "grid",
    "controls": [
      { "type": "text", "key": "title", "label": "Heading", "default": "Featured this week" },
      { "type": "select", "key": "source", "label": "Products", "default": "featured",
        "options": { "featured": "Featured first", "latest": "Newest" } },
      { "type": "select", "key": "category", "label": "Category", "options": "@shop_categories" },
      { "type": "number", "key": "count", "label": "How many", "default": 8, "min": 1, "max": 24 }
    ]
  }
}
```

| Key | Meaning |
| --- | --- |
| `label`, `icon` | The tile in the builder's **Your theme** group. Icons are from the builder's icon set |
| `description` | Optional, shown under the label in the tile |
| `view` | Defaults to `sections.<key>` |
| `areas` | Optional list of regions the section is offered in. Leave it out to offer it everywhere |
| `controls` | `text`, `textarea`, `richtext`, `number`, `slider`, `dimensions`, `toggle`, `select`, `color`, `image`, `link` or `icon`. A select's `options` is an object, or `@shop_categories`, `@blog_categories` or `@menus` |

Every control also takes `key`, `label`, `default` and an optional `help` line
shown under it. `number` and `slider` take `min`/`max`/`step`; `slider` also
takes a `unit` (`px`, `%`, ...) shown next to the value.

#### Binding a control to CSS

Give a control `tab: "style"` and it moves to the section's **Style** tab
instead of its main settings, and — if it also has `selector` and `property` —
the builder writes its value straight into that CSS rule as the owner edits it,
live, with no page reload:

```json
{ "type": "color", "key": "bg_color", "label": "Background", "tab": "style",
  "section": "Colors", "selector": "{{WRAPPER}} .my-rail", "property": "background-color" }
```

| Key | Meaning |
| --- | --- |
| `tab` | `"style"` moves the control to the Style tab. Omit for the main settings tab |
| `section` | Groups controls under a heading within the Style tab (e.g. "Colors", "Spacing") |
| `selector` | The CSS selector to write to. `{{WRAPPER}}` is replaced with this instance's scope, so two copies of the same section never collide |
| `selectors` | An array, when one control needs to set the same property on more than one selector |
| `property` | The CSS property `selector` gets |
| `units` | Array of unit choices offered alongside a `slider`/`number` value (e.g. `["px", "%"]`) |
| `responsive` | `true` lets the owner set a different value per breakpoint |

In practice `selector`/`property` is used with `color`, `slider` and `number`
controls. A `text` or `select` control's value is read from `$settings` in
your section's own Blade view instead.

The view receives `$settings` (defaults already applied) and `$editing`. A
section fetches its own data, because the builder can put it anywhere:

```blade
{{-- views/sections/rail.blade.php --}}
@php
    $products = \App\Models\Product::published()->latest()->limit($settings['count'])->get();
@endphp

@include('theme::partials.rail', ['title' => $settings['title'], 'products' => $products])
```

Use the same views in your own templates with `theme_section()`, so the page a
visitor sees before anything is built comes from the same markup:

```blade
@region('hero')
    {!! theme_section('hero') !!}
@endregion

{!! theme_section('rail', ['title' => 'New in', 'source' => 'latest']) !!}
```

### Ship starters

`starters.json`, next to `theme.json`, gives each region a starting layout. A
region with a starter opens in the editor already filled with it, as a draft:

```json
{
  "header": [
    { "key": "storefront", "label": "Storefront header", "hint": "Logo, nav and cart icon",
      "sections": [ { "width": "edge", "widgets": [ { "section": "header" } ] } ] }
  ],
  "home": [
    { "key": "storefront", "label": "Storefront homepage",
      "sections": [
        { "width": "edge", "widgets": [ { "section": "hero" } ] },
        { "width": "edge", "widgets": [ { "section": "rail", "settings": { "count": 8 } } ] }
      ] }
  ]
}
```

`"width": "edge"` removes the builder's side padding and gaps, for a section
that draws its own full-width band and inner container. A widget is either
`{ "section": "…" }` or an ordinary builder widget such as
`{ "type": "heading", "settings": { "text": "Hello" } }`. A section can also
hold several `columns`, each with a `width` and `widgets`. `hint`, shown under
a starter's `label` when the owner picks one, is optional.

### Let the editor load your stylesheet

A region is previewed on its own, outside your layout. Tell the builder which
assets and body class your sections need:

```json
"builder": {
  "styles": ["css/theme.css"],
  "scripts": ["js/theme.js"],
  "body_class": "sf"
}
```

Paths are relative to your theme's `assets/` folder.

::: tip Wrap the whole homepage
Give the homepage a region of its own, such as `"home": "Homepage (whole page)"`,
and wrap its template in `@region('home')`. Owners can then reorder or remove
every block on it, not just the hero.
:::

## Packaging

Build the ZIP with the packaging command rather than by hand:

```bash
php artisan cms:theme-package my-theme
```

It writes `storage/app/private/theme-packages/my-theme-1.0.0.zip`, then runs the
**theme installer's own checks** against it — the same code every site runs on
upload — and deletes the ZIP if any of them fail. A theme that packages is a
theme that installs.

```
Packaged storefront 1.0.1: 50 file(s)

  ok   passes the theme installer (50 file(s) accepted)
  note views/partials/header.blade.php contains @php blocks.
  ok   screenshot 1200x675

Theme ZIP ready.
```

`note` lines are information, not errors — an admin sees them after installing.

::: warning Why not just zip the folder?
Hand-made ZIPs fail in ways that only show up on somebody else's server:

- **Windows PowerShell's `Compress-Archive` stores backslashes** in paths. Older
  releases of Radius read those as one long file name on Linux and refused the
  theme with "No theme.json was found". Current releases accept them, but a
  buyer may be on an older one.
- Editor and OS clutter — `.DS_Store`, `Thumbs.db`, `node_modules` — ships too.
- A template that trips the safety scan looks fine until a site refuses it.
:::

### What the installer refuses

| Refused | Because |
| --- | --- |
| No `theme.json`, or no `name` / `version` in it | It cannot tell what it is installing |
| No `views/` folder | A theme with no templates renders nothing |
| The slug `default` | The bundled default theme is the fallback every theme builds on |
| More than 2,000 files, or over 200 MB uncompressed | Protection against archive bombs |
| A path escaping the theme folder (`../`) | Protection against overwriting the site |

Files that are not an allowed type — anything but Blade templates and static
assets such as CSS, JS, images, fonts and JSON — are **dropped**, not refused.
Plain `.php` files are always dropped.

### What the template scan looks for

Every `.blade.php` file is read before the theme is installed. Any of these
rejects the whole theme:

- raw `<?php` or `<?=` tags
- `eval`, `assert`, shell execution, or backticks inside `{{ }}` or `@php`
- reading or writing files and URLs directly, or superglobals such as `$_GET`
- `include` / `require` (Blade's `@include` is fine)
- **calling a variable as a function** — `$format(...)`

The last one catches honest code too. Storing a closure and calling it looks
exactly like `$f = 'system'; $f(...)`, so write the call directly:

```blade
{{-- Refused --}}
@php $safe = fn ($url) => ...; $link = $safe($settings['url']); @endphp

{{-- Fine --}}
@php $link = safe_url($settings['url']); @endphp
```

Blade comments are not scanned, so describing a template in prose never trips
it.

## Keeping your changes

Editing a theme that shipped with Radius is a trap: an update can replace those
files.

| Instead of | Do this |
| --- | --- |
| Editing `themes/default/` | Copy it to `themes/my-theme/` and edit that |
| Editing a bought theme | Check whether it supports a child theme or configurable builder sections |
| Small CSS tweaks | [Settings → Appearance → Custom CSS](/settings/#appearance) |

Updates never touch a theme you installed or created yourself. The two bundled
themes, `default` and `storefront`, are part of the product and **are** updated
— files you have edited in them are skipped and reported, but copying the theme
first is the durable fix. See [Updates](/system/updates#what-an-update-touches).

## Testing checklist

- Every page type: home, page, post, category, tag, product, cart, checkout
- Signed in and signed out
- With the shop module **off**, to catch unconditional `route()` calls
- At phone width
- With a long page title and a missing featured image
- With `APP_DEBUG=false`, so a template error shows as a 500 rather than a trace
- Packaged with `php artisan cms:theme-package`, then **installed from that ZIP**
  on a clean test site — not just copied into `themes/`
