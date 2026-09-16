# Theme regions

How the builder and a theme share a page without fighting over it.

## The problem this solves

Most page builders either take the whole page, or are confined to the content
area. Radius does neither: a theme keeps owning its own chrome and **marks the
parts it is willing to hand over**.

## Declaring a region in a theme

Two steps. First, list the regions in `theme.json`:

```json
{
  "name": "My theme",
  "version": "1.0.0",
  "regions": {
    "header": "Site header",
    "footer": "Site footer",
    "before_content": "Before page content",
    "after_content": "After page content"
  }
}
```

Then wrap the theme's own markup in the matching directive:

```blade
@region('header')
    {{-- The theme's own header, used until an admin builds one --}}
    <header class="site-header">
        <a href="{{ url('/') }}">{{ setting('site_name') }}</a>
        {!! menu('primary') !!}
    </header>
@endregion
```

## What that does

| State | What renders |
| --- | --- |
| No layout built for the region | The markup inside `@region` — exactly as before |
| A layout has been built and published | The built layout instead |
| The layout is turned off, or restored to default | Back to the theme's markup |

So the directive is a **fallback**, not a placeholder. The theme works
standalone, and the builder is an optional override.

::: tip A theme with no @region markers is completely unaffected
The builder is then limited to page content, which still works. Adding region
support to an existing theme is opt-in, and adding one region does not commit
you to the rest.
:::

## Page bodies work the other way round

A theme that already does this:

```blade
{!! $page->content !!}
```

transparently gets the built layout once one exists, and the stored rich text
when it does not. **No theme changes are needed at all** for page-level
building — which is why a theme written before the builder existed still works
with it.

## Editing a region

Regions appear in the builder overview alongside pages.

<Screenshot
  src="builder/regions-list.png"
  screen="/admin/builder"
  alt="The builder overview showing the theme's declared regions with their build state"
  caption="Only regions the active theme declares are listed. Switching theme changes this list." />

<Screenshot
  src="builder/region-editor.png"
  screen="/admin/builder/region/header"
  wide
  tall
  alt="The builder editing a header region, with the rest of a page shown around it for context" />

A region is edited in the same editor as a page. The difference is scope: **a
region renders on every page that includes it**, so a mistake in a header is a
mistake everywhere.

## Starter layouts

Rather than starting from an empty canvas, each region offers a ready-made
starting point — a conventional header with a logo, menu and cart icon, for
instance — which you then edit.

<Screenshot
  src="builder/region-starters.png"
  screen="/admin/builder/region/header"
  alt="The starter layout chooser for a region, offering several pre-built arrangements" />

## Which widgets belong in a region

The **Site parts** widgets exist for this: Site logo, Navigation menu, Cart
icon, Search, Social icons and Page title all read from the site rather than
holding their own content, so one layout works across every page.

Putting a **Heading** widget with fixed text in a header gives every page on the
site the same heading. Use **Page title** instead.

## Getting back to the theme's markup

**Restore default** on the region. That discards the layout and hands the region
back to the theme.

This is the recovery path if a region layout goes wrong on a live site — it is
one click, and it does not require the builder to be working.

## Common mistakes

**Building a header before switching theme.** Regions are per-theme. Changing
theme leaves the old layout behind, un-rendered, because the new theme declares
different regions.

**Fixed text in a region.** See above — use the site-aware widgets.

**Forgetting the footer exists.** A built header and a theme footer often do not
match visually. Either build both or neither.
