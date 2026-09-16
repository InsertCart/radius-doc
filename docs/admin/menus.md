# Menus

Navigation. A menu is a named, ordered tree of links that a theme renders
wherever it declares a menu location.

<ScreenList :screens="[
  { route: '/admin/menus', name: 'Menu list' },
  { route: '/admin/menus/create', name: 'New menu' },
  { route: '/admin/menus/{id}/edit', name: 'Edit menu and its items' },
]" />

## Creating a menu

<Screenshot
  src="content/menus-list.png"
  screen="/admin/menus"
  alt="The menu list showing each menu's name, location and item count" />

A menu has a **name** and a **location**. The location is what connects it to
your theme: a theme declares the locations it supports in `theme.json`, and
whichever menu is assigned to a location renders there.

Common locations are `primary`, `footer` and `mobile`, but they are entirely up
to the theme. See [Building a theme](/appearance/theme-development).

## Adding items

<Screenshot
  src="content/menu-builder.png"
  screen="/admin/menus/{id}/edit"
  wide
  tall
  alt="The menu editor, with the available link types on the left and the drag-and-drop item tree on the right"
  caption="Drag an item onto another to nest it. Drag it left to promote it back up a level." />

Items come in five kinds:

| Type | Points at | Survives a slug change? |
| --- | --- | --- |
| **Page** | A page you pick from a list | Yes — it stores the page, not the URL |
| **Post** | A single post | Yes |
| **Category** | A blog or shop category archive | Yes |
| **Custom link** | Any URL you type | No — it is a literal URL |
| **Shop** | The shop index, cart, or account area | Yes |

Prefer the typed kinds over custom links wherever you can. A page item follows
the page if you later change its slug; a custom link quietly 404s.

### Nesting

Drag an item onto another to make it a child. How deep a theme renders is up to
the theme — most handle two levels, and the default theme renders a dropdown for
children and ignores grandchildren.

### Per-item options

| Option | Notes |
| --- | --- |
| **Label** | Defaults to the page or post title; override it for a shorter menu |
| **Open in new tab** | Adds `target="_blank"` with the matching `rel` |
| **CSS class** | Passed through to the rendered `<li>`, for theme styling |
| **Visibility** | Always, signed-in only, or signed-out only |

**Visibility** is what you want for a Sign in / My account pair: two items in the
same slot, each shown to the half of your visitors it applies to.

## Reordering

Drag to reorder. The order saves as you drop — there is no separate save button
for the tree, though the menu's own name and location do need saving.

## Deleting

Deleting a menu does not delete the pages it pointed at. Deleting a **page**
that a menu item points at leaves the item behind pointing at nothing, so the
item needs removing by hand.

## Rendering a menu in a theme

```blade
{!! menu('primary') !!}
```

Or, for full control over the markup:

```blade
@foreach (menu_items('primary') as $item)
    <a href="{{ $item->url }}" @class(['active' => $item->isActive()])>
        {{ $item->label }}
    </a>
@endforeach
```

The builder also has a **Navigation menu** widget, so a menu can be dropped into
a header you designed visually rather than one the theme hardcodes. See
[Widgets](/builder/widgets).
