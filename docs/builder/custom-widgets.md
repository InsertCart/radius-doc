# Building a widget

One PHP class and one Blade view. The settings panel is **generated from the
controls you declare**, so the editor itself never needs touching.

## The class

`app/Cms/Builder/Blocks/QuoteBlock.php`:

```php
<?php

namespace App\Cms\Builder\Blocks;

use App\Cms\Builder\Control;

class QuoteBlock extends Block
{
    public static function type(): string
    {
        return 'quote';
    }

    public static function name(): string
    {
        return 'Quote';
    }

    public static function controls(): array
    {
        return [
            Control::textarea('text', 'Quote')
                ->default('Something worth saying.'),

            Control::text('attribution', 'Attributed to'),

            Control::color('color', 'Colour')
                ->tab(Control::TAB_STYLE)
                ->selector('{{WRAPPER}} .cb-quote', 'color'),
        ];
    }
}
```

## The view

`resources/views/blocks/quote.blade.php`:

```blade
<blockquote class="cb-quote">
    <p>{{ $settings['text'] ?? '' }}</p>

    @if (! empty($settings['attribution']))
        <footer>— {{ $settings['attribution'] }}</footer>
    @endif
</blockquote>
```

`$settings` is an array keyed by your control names. Escape everything with
`{{ }}` unless outputting markup is the widget's actual purpose.

## Register it

In `config/builder.php`:

```php
'blocks' => [
    // ...
    \App\Cms\Builder\Blocks\QuoteBlock::class,
],
```

Clear the cache and it appears in the palette.

## The one rule worth understanding

Whether a control has a `->selector()` decides how the editor behaves when
somebody changes it:

| Control | Editor behaviour |
| --- | --- |
| **With `->selector()`** | Applied as CSS. The stylesheet is rewritten in place — instant, no re-render |
| **Without `->selector()`** | Re-renders the element on the server |

So a colour, a padding or a font size should always declare a selector. Text,
an image choice or a post filter cannot, because they change the markup.

`{{WRAPPER}}` is replaced with a selector scoped to that one widget instance,
so styling one quote never touches another.

## Available controls

| Control | Produces |
| --- | --- |
| `Control::text()` | Single-line text |
| `Control::textarea()` | Multi-line text |
| `Control::richtext()` | The rich text editor |
| `Control::number()` | A number, with optional min/max/step |
| `Control::select()` | A dropdown — pass options as an array |
| `Control::toggle()` | A boolean switch |
| `Control::color()` | A colour picker, wired to the design tokens |
| `Control::image()` | A media library picker |
| `Control::url()` | A link field, scheme-validated |
| `Control::icon()` | An icon picker |
| `Control::dimensions()` | Top/right/bottom/left, for padding and margin |
| `Control::typography()` | Family, size, weight, line height, letter spacing |
| `Control::repeater()` | A list of sub-items, each with its own controls |
| `Control::media()` | Video or file selection |

### Chainable modifiers

```php
Control::number('columns', 'Columns')
    ->default(3)
    ->min(1)
    ->max(6)
    ->responsive()                      // a separate value per breakpoint
    ->tab(Control::TAB_STYLE)           // TAB_CONTENT | TAB_STYLE | TAB_ADVANCED
    ->help('How many items per row.')
    ->selector('{{WRAPPER}} .grid', 'grid-template-columns', 'repeat({{VALUE}}, 1fr)')
    ->when('layout', 'grid');           // only shown when another control equals a value
```

`{{VALUE}}` in a selector's third argument is where the control's value lands,
which is how one number becomes a whole CSS declaration.

## A repeater

For a widget holding a list — features, logos, team members:

```php
Control::repeater('items', 'Items')
    ->fields([
        Control::text('label', 'Label'),
        Control::icon('icon', 'Icon'),
    ])
    ->default([
        ['label' => 'First', 'icon' => 'check'],
    ]),
```

In the view:

```blade
@foreach ($settings['items'] ?? [] as $item)
    <li>{{ $item['label'] ?? '' }}</li>
@endforeach
```

## Tying a widget to a module

A widget that needs the shop should disappear when the shop is off:

```php
public static function module(): ?string
{
    return 'shop';
}
```

It then vanishes from the palette and renders as nothing publicly, rather than
producing an error or an empty box.

## Assets

If a widget needs its own CSS or JS, declare it rather than inlining a `<script>`
tag in the view:

```php
public static function styles(): array
{
    return ['blocks/quote.css'];
}
```

Files resolve against `public/`, are emitted once per page no matter how many
instances are on it, and are skipped entirely when the widget is not used.

::: warning Do not fetch from a CDN in a widget view
A widget that loads a remote script makes every page depending on it hostage to
somebody else's uptime, and hands them execution on your site. Ship the file.
:::

## Testing it

1. Clear the cache — `php artisan optimize:clear`
2. Open the builder and confirm it is in the palette
3. Drop it on a page, set every control, and publish
4. View the published page **signed out**, to confirm it renders without the
   editor present
5. Check it at all three breakpoints if any control is `->responsive()`

## Where this lives after an update

`app/` is application code, so an update can overwrite it. Keep custom widgets
in version control, and read
[Updates & backups](/system/updates#what-an-update-touches) before updating a
site carrying local changes.
