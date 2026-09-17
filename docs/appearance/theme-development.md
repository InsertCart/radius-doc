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
  "version": "1.0.0",
  "author": "Your name",
  "description": "One line, shown in the theme list.",
  "screenshot": "screenshot.png",

  "menus": {
    "primary": "Primary navigation",
    "footer": "Footer links"
  },

  "regions": {
    "header": "Site header",
    "footer": "Site footer",
    "before_content": "Before page content",
    "after_content": "After page content"
  },

  "supports": ["dark_mode"]
}
```

Only `name` and `version` are required.

| Key | Does |
| --- | --- |
| `menus` | Declares menu locations, which then appear in [Menus](/admin/menus) |
| `regions` | Declares which parts the [visual builder](/builder/regions) may take over |
| `supports` | Feature flags; `dark_mode` tells the logo component to use `auto` ink |

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
            {!! menu('primary') !!}
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
theme_asset('css/theme.css')    // a URL under public/themes/<slug>/
theme_option('key')             // this theme's own stored options
```

### Branding

Views never read `setting('site_logo')` directly and never pick an ink
themselves. They use one component, which names **the background** — the thing
whoever writes the tag can actually see:

```blade
<x-site-logo class="h-10 w-auto" />             {{-- follows the colour scheme --}}
<x-site-logo on="light" class="h-10 w-auto" />  {{-- surface is always pale --}}
<x-site-logo on="dark" small class="h-8" />     {{-- surface is always dark --}}
```

`on="auto"` (the default) resolves through the **Color scheme** setting. On
*Always light* or *Always dark* the choice is made server-side; on *Follow
visitor system setting* the component emits a `<picture>` with a
`prefers-color-scheme` source, because the server never learns what the
visitor's browser prefers.

::: tip If your theme is light-only, say so explicitly
Ask for `on="light"`. A white logo on a bar that never darkens is just an
invisible logo. Only use `auto` if you actually implement dark mode.
:::

Full helper list in [Branding](/appearance/branding#helpers).

### Menus

```blade
{!! menu('primary') !!}
```

Or, for control over the markup:

```blade
@foreach (menu_items('primary') as $item)
    <a href="{{ $item->url }}" @class(['active' => $item->isActive()])>
        {{ $item->label }}
    </a>
@endforeach
```

### Modules

Never assume a module is on:

```blade
@if (modules()->enabled('shop'))
    <a href="{{ route('shop.index') }}">Shop</a>
@endif
```

A theme that links to `route('shop.index')` unconditionally throws when the
shop is off, because that route does not exist.

### Media

```blade
<img src="{{ $post->image_url('medium') }}" alt="{{ $post->image_alt }}">
```

Sizes are `thumb`, `medium`, `large`, or omit for the original.

### SEO

```blade
{!! seo()->render() !!}
```

One call emits the title, description, canonical, Open Graph, Twitter card and
schema.org graph. Do not hand-write these tags — the [SEO module](/settings/#seo)
already resolves per-page overrides against site defaults.

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

There is **no build step for themes**. If you want Tailwind or Sass, compile it
before packaging and ship the output.

::: warning Do not load libraries from a CDN
A theme that pulls a script from a CDN makes every page hostage to somebody
else's uptime, and hands them execution on your site. Ship the file in
`assets/`.
:::

## Theme options

Declare options in `theme.json` and they appear under Appearance for the site
owner to set:

```json
"options": {
  "accent_color": { "type": "color", "label": "Accent colour", "default": "#2563eb" },
  "show_author":  { "type": "boolean", "label": "Show post authors", "default": true }
}
```

Read them with `theme_option('accent_color')`.

This is how you make a theme configurable without the owner editing files —
which matters because their edits do not survive a theme update.

## Packaging

```bash
cd themes/my-theme
zip -r ../my-theme-1.0.0.zip . -x "*.DS_Store" -x "node_modules/*"
```

Zip the **contents**, not the parent folder — the archive's root should contain
`theme.json`, not `my-theme/theme.json`.

Remember that `.php` files are dropped during extraction and Blade templates are
scanned for raw PHP. Write Blade, not PHP. See
[Theme security](/appearance/themes#theme-uploads-are-checked).

## Keeping your changes

Editing a theme that shipped with Radius is a trap: an update can replace those
files.

| Instead of | Do this |
| --- | --- |
| Editing `themes/default/` | Copy it to `themes/my-theme/` and edit that |
| Editing a bought theme | Check whether it supports a child theme or options |
| Small CSS tweaks | [Settings → Appearance → Custom CSS](/settings/#appearance) |

An update's path allowlist does not touch `themes/`, so your own theme folder is
safe — but the bundled ones are part of the product. See
[Updates](/system/updates#what-an-update-touches).

## Testing checklist

- Every page type: home, page, post, category, tag, product, cart, checkout
- Signed in and signed out
- With the shop module **off**, to catch unconditional `route()` calls
- At phone width
- With a long page title and a missing featured image
- With `APP_DEBUG=false`, so a template error shows as a 500 rather than a trace
