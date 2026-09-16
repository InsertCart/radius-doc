# Visual builder

A drag-and-drop editor for designing pages without writing HTML. It is built
into Radius rather than bolted on, and **it does not replace your theme**.

<ScreenList :screens="[
  { route: '/admin/builder', name: 'Builder overview' },
  { route: '/admin/builder/edit/{type}/{id}', name: 'The editor' },
  { route: '/admin/builder/preview/{type}/{id}', name: 'Preview' },
  { route: '/admin/builder/presets', name: 'Saved sections' },
  { route: '/admin/builder/{layout}/revisions', name: 'Revision history' },
]" />

## What makes it different

Most visual builders ship a small application to every visitor: a stack of
scripts that assembles the page in the reader's browser.

**Radius renders on the server.** The builder produces a layout tree, the server
compiles it to Blade, and what goes out is plain HTML with one stylesheet. No
JavaScript is required to read a built page — which is what makes the output
fast, indexable, and readable on a bad connection.

## Opening the editor

<Screenshot
  src="builder/overview.png"
  screen="/admin/builder"
  wide
  alt="The builder overview, listing pages and theme regions with their build state" />

Either from this screen, or from the **Edit with builder** button on any page or
post.

<Screenshot
  src="builder/editor.png"
  screen="/admin/builder/edit/page/1"
  wide
  tall
  alt="The builder editor: widget palette on the left, the page canvas in the centre, and the settings panel on the right" />

Three areas:

| Area | Contains |
| --- | --- |
| **Left** | The widget palette, grouped by category, and the layout tree |
| **Centre** | The canvas — the page as it will render |
| **Right** | The settings panel for whatever is selected |

## The layout model

A layout is a tree, three levels deep:

```
Section
└── Column
    └── Widget
```

Sections hold columns, columns hold widgets. Each level has its own settings
panel with **Content**, **Style** and **Advanced** tabs.

| Level | Owns |
| --- | --- |
| **Section** | Full-width band: background, padding, width, wrapper tag |
| **Column** | Horizontal division: width per breakpoint, vertical alignment |
| **Widget** | One piece of content |

A tree is capped at 2000 nodes and 6 levels deep, so a crafted request cannot
make the renderer walk an enormous structure.

## Why the editor feels immediate

Controls are split by what they affect, which is the reason dragging a colour
slider does not wait on the network:

- **Style controls** (colour, spacing, typography, borders) declare a CSS
  mapping, so the editor rewrites the preview's stylesheet in place. Instant, no
  server round trip.
- **Content controls** re-render only the element that changed.
- **Structural edits** re-render the canvas, which is rare enough not to be felt.

The server recompiles the authoritative stylesheet on publish.

## Drafts and publishing

Work **autosaves as a private draft**. Nothing reaches the public site until you
press Publish.

That means you can leave a half-finished redesign sitting on a live page for a
week without anybody seeing it.

## Revision history

Every publish stores a revision. **The last 25 are kept**, and any one can be
restored.

<Screenshot
  src="builder/revisions.png"
  screen="/admin/builder/1/revisions"
  alt="The revision list, showing who published each revision and when, with restore buttons" />

Restoring a revision is itself a publish, so it appears in the history too —
you can undo an undo.

## Responsive design

Switch between desktop, tablet and mobile in the toolbar. Any control marked
responsive stores a **separate value per breakpoint**, so mobile padding is
genuinely independent of desktop padding rather than a scaled guess.

<Screenshot
  src="builder/responsive.png"
  screen="/admin/builder/edit/page/1"
  alt="The breakpoint switcher in the builder toolbar, with the canvas narrowed to mobile width" />

Work desktop-first, then check the other two. A value set at desktop cascades
down until a narrower breakpoint overrides it.

## Design tokens

Colours picked from the palette are stored as `var(--cb-color-primary)` rather
than as a hex code. Change a token later and everything using it follows,
instead of leaving one-off hex codes scattered through forty sections.

<Screenshot
  src="builder/design-tokens.png"
  alt="The design token palette in the builder, showing named colour swatches" />

This is the single most useful habit to adopt early. Picking a raw hex colour
works, but it is the thing you will regret when the brand colour changes.

## Saved sections

Built a hero you want on six pages? Save the section as a **preset** and drop it
in elsewhere.

<Screenshot
  src="builder/presets.png"
  screen="/admin/builder/presets"
  alt="The saved sections library, showing thumbnails of stored presets" />

A preset is a copy, not a link — editing one instance does not change the others.

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Redo |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Publish |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | Duplicate the selection |

On macOS, <kbd>Cmd</kbd> works in place of <kbd>Ctrl</kbd>.

## Turning the builder off for a page

The switch is reversible and destroys nothing. A page whose builder layout is
turned off falls straight back to its rich text content; the layout is kept, so
turning it on again restores the design.

There is also **Restore default** on any theme region, which discards the layout
and hands the region back to the theme's own markup.

## Security of builder output

The builder is administrator-only, but its output still becomes a stylesheet and
markup, so both are constrained:

- Settings written into CSS are stripped of anything that could close a rule or
  start a new one — `}`, `;`, comment markers, `expression()`, `@import`.
- Element ids are validated before they become class names, so a crafted id
  cannot escape its selector.
- `href` values accept only `http`, `https`, `mailto`, `tel` and relative
  paths. `javascript:` and `data:` URLs are dropped, including obfuscated forms
  like `java\tscript:`.
- Section wrapper tags come from a fixed allowlist; custom CSS ids and classes
  are stripped to safe characters.

The **HTML widget is the deliberate exception** — outputting raw markup is its
entire purpose, and the editor says so plainly on the widget.

## Next

- [Widgets](/builder/widgets) — what is in the palette
- [Theme regions](/builder/regions) — designing headers and footers
- [Building a widget](/builder/custom-widgets) — one class and one Blade view
