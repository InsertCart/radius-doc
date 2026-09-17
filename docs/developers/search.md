# Search internals

How site search is put together, and the four ways to extend it: restyle the
live results, add live results to a theme, make your own model searchable, and
plug in a different search engine.

For what site owners see and set, read [Site search](/admin/search) first.

## The pieces

```
config/search.php                     searchable types, index location, limits
app/Cms/Search/
├── SearchManager.php                 the entry point: search()
├── SearchResults.php                 one page of matches: total + items
├── Tokenizer.php                     text → words, shared by index and query
├── Contracts/
│   ├── Searchable.php                what a model implements
│   └── Engine.php                    what an engine implements
├── Concerns/IsSearchable.php         defaults for Searchable models
└── Engines/
    ├── DatabaseEngine.php            LIKE queries
    └── IndexEngine.php               JSON word index under storage/
app/Http/Controllers/Front/SearchController.php   /search and /search/suggest
app/Console/Commands/Search*Command.php          search:rebuild, search:status
resources/views/theme/search/
├── index.blade.php                   the /search results page
├── form.blade.php                    a search box with live results
└── script.blade.php                  the live-results CSS and JavaScript
```

Everything goes through `SearchManager`, reached with the `search()` helper. It
picks the engine chosen under Settings → Search, checks which content types are
switched on, and falls back to `DatabaseEngine` whenever the chosen engine
reports it is not ready. Callers never have to handle a missing index.

### Routes

| Route | Name | Notes |
| --- | --- | --- |
| `GET /search` | `search` | Registered only while **Site-wide results page** is on |
| `GET /search/suggest` | `search.suggest` | JSON for live results. Rate-limited by the `search` limiter. 404 while live results are off |

`/search` is conditional because it would otherwise shadow a CMS page with the
slug `search`. Use `Route::has('search')` before linking to it.

## Using search from PHP

### Filtering a listing

`constrain()` narrows an Eloquent query or relation, so a listing keeps its own
filters, sorting and pagination:

```php
$posts = search()
    ->constrain(Post::published(), 'post', $request->input('q'), rank: true)
    ->with('author')
    ->orderByDesc('published_at')   // applies after relevance when rank is true
    ->paginate(12);
```

A blank term returns the query untouched, so call it unconditionally. With
`rank: true` the index engine orders by relevance first. The database engine
ignores `rank`, so listings keep the order they had before search engines
existed. `BlogController` and `ShopController` both use this. The shop passes
`rank: false` when the visitor has picked a sort order.

### Getting results directly

```php
$results = search()->search('product', 'espresso', limit: 10, offset: 0);

$results->total;   // int, all matches
$results->items;   // array of result arrays, best first
```

Each item has the same keys whichever engine answered:

| Key | Type | |
| --- | --- | --- |
| `id` | int | The model's key |
| `type` | string | `post`, `product`, `page`, … |
| `title` | string | |
| `url` | string | Absolute |
| `excerpt` | ?string | Plain text, about 160 characters |
| `image` | ?string | Absolute URL |
| `meta` | ?string | A short line: a price, a date |

Items are arrays rather than models so the index engine can answer without a
query. If you need models, load them by `id`.

### Grouped live results

```php
search()->suggest('espresso');            // every enabled type
search()->suggest('espresso', 'product'); // one type
```

This returns exactly what `/search/suggest` sends as JSON:

```json
{
  "query": "espresso",
  "url": "https://example.com/search?q=espresso",
  "groups": [
    {
      "type": "product",
      "label": "Products",
      "total": 12,
      "url": "https://example.com/shop?q=espresso",
      "items": [
        { "id": 36, "type": "product", "title": "Espresso Blend", "url": "…", "excerpt": "…", "image": "…", "meta": "₹16.50" }
      ]
    }
  ]
}
```

Queries shorter than **Start after this many characters** return no groups.

### Other manager methods

| Method | Returns |
| --- | --- |
| `types()` | Enabled types: module on and not switched off in settings |
| `definitions()` | Every registered type |
| `engineName()` | The chosen engine's name |
| `engine(?string $name)` | An engine instance |
| `engineFor(string $type)` | The engine that will actually answer for `$type` |
| `rebuild(?string $type, ?string $engine)` | `['post' => 120, …]` |
| `status()` | Per-type rows for the admin card |
| `formAction(string $type)` | Where a search box for `$type` should submit |
| `resultsUrl(string $type, string $q)` | "See all" link for one type |

## Making a model searchable

Three steps: implement the contract, use the trait, register the type.

```php
use App\Cms\Search\Concerns\IsSearchable;
use App\Cms\Search\Contracts\Searchable;
use Illuminate\Database\Eloquent\Builder;

class Event extends Model implements Searchable
{
    use IsSearchable;

    /** Rows the public may find. */
    public static function searchableQuery(bool $includeScheduled = false): Builder
    {
        return static::query()->where('status', 'published');
    }

    /** Columns the database engine matches with LIKE, and their weight. */
    public static function searchableColumns(): array
    {
        return ['title' => 5, 'venue' => 3, 'description' => 1];
    }

    public function toSearchResult(): array
    {
        return [
            'title' => $this->title,
            'url' => route('events.show', $this->slug),
            'excerpt' => $this->searchExcerpt($this->description),
            'image' => $this->image_url,
            'meta' => $this->starts_at->format('j M Y'),
            'visible_from' => null,
        ];
    }
}
```

Then register it from a service provider's `boot()`:

```php
search()->register('event', [
    'model' => Event::class,
    'label' => 'Events',
    'module' => null,                 // hide the type while this module is off
    'setting' => null,                // a boolean setting key, or null for always on
    'results_route' => 'events.index', // "See all" target; null uses /search
]);
```

Or add the same array under `types` in `config/search.php`. The order of types
there is the order groups appear on screen.

Registering is enough to keep an index current: the manager listens for the
model's `saved`, `deleted` and `restored` events.

### What each method is for

**`searchableQuery($includeScheduled)`** is the only visibility rule. Anything
this query does not return is removed from the index when saved. When
`$includeScheduled` is `true` (the index engine asks for this), include rows
that are published but dated in the future, and return their publish time as
`visible_from` from `toSearchResult()`. The index then hides them until that
moment, with no save needed. `Post` does this.

**`searchableColumns()`** must list real columns, because the database engine
queries them. If your model already has a `scopeSearch()`, the database engine
calls that instead, so existing behaviour is preserved exactly.

**`searchableFields()`** is what the index reads, as `field => [text, weight]`.
The trait's default reads `searchableColumns()`. Override it to index text that
is not a column:

```php
public function searchableFields(): array
{
    return [
        'title' => [$this->title, 5],
        'speakers' => [$this->speakers->pluck('name')->implode(' '), 3],
        'description' => [$this->description, 1],
    ];
}
```

HTML is stripped for you. Each field is capped at
`search.index.max_field_length` characters (20,000 by default).

**`toSearchResult()`** is how a row looks in results. The index stores this
output, so anything here that changes over time without a save (a price
driven by dates, a stock label) goes stale until the next rebuild. Radius
schedules `search:rebuild` nightly for that reason.

::: warning Integer primary keys
The index engine stores ids as integers. A model keyed by UUID works with the
database engine only.
:::

## The index engine

Files live in `storage/app/search-index/<type>/`. Override the location with
`SEARCH_INDEX_PATH`.

| File | Holds |
| --- | --- |
| `manifest.json` | Format version, document count, total length, build times |
| `terms/<shard>.json` | `word → {id: weight}`. Shard is the hex of the word's first two characters |
| `docs/<n>.json` | `id → stored result`, 256 ids per file |
| `forward/<n>.json` | `id → the words it was indexed under`, so an update removes exactly what it added |
| `future.json` | `id → timestamp` for rows not yet visible |

**A query** tokenises the input, reads one shard per word, and scores with
BM25. Every word must match. The last word also matches words it begins,
because it is usually still being typed. If nothing contains every word, any
match is returned instead. At most `search.max_results` (1,000) matches are
ranked.

**Weights** are BM25's term-frequency part, computed per field and multiplied
by the field's weight. A title hit (weight 5) outranks the same word in a body
(weight 1).

**Words** come from `Tokenizer::words()`. Text is lower-cased, accents on Latin
letters are folded (`café` → `cafe`), letters in every script are kept, and
words of 2 to 40 characters are indexed. There is no stemming.

**Writes** go to a temporary file that is renamed over the old one, under a
per-type `flock`. A rebuild assembles a separate folder and swaps it in, holding
the lock throughout, so an edit made during a rebuild waits and then lands in
the new index. On Windows the swap retries, then falls back to copying, because
a just-written folder is often briefly locked by the indexer or antivirus.

**Scale.** Comfortable up to some tens of thousands of documents per type.
Beyond that, shards for common two-letter prefixes grow large. That is the point
to plug in a search server, as described below.

The folder is excluded from release ZIPs and never touched by the updater.
Deleting it is safe: search falls back to the database until the next rebuild.

## Adding an engine

Implement `App\Cms\Search\Contracts\Engine` and register it:

```php
use App\Cms\Search\Contracts\Engine;

class MeilisearchEngine implements Engine
{
    public function constrain(Builder|Relation $query, string $type, string $term, bool $rank = false): Builder|Relation
    {
        $ids = $this->client->index($type)->search($term, ['limit' => 1000])->getHits();
        return $query->whereIntegerInRaw($query->getModel()->getQualifiedKeyName(), array_column($ids, 'id'));
    }

    public function search(string $type, string $term, int $limit, int $offset = 0): SearchResults { /* … */ }
    public function ready(string $type): bool { /* server reachable, index exists */ }
    public function update(string $type, Model $model): void { /* push toSearchResult() + searchableFields() */ }
    public function delete(string $type, int|string $id): void { /* … */ }
    public function rebuild(string $type): int { /* … */ }
    public function status(string $type): array { /* ready, documents, built_at, updated_at, bytes */ }
}
```

```php
// AppServiceProvider::boot()
search()->extend('meilisearch', fn ($app) => new MeilisearchEngine(/* … */));
```

The name then appears in the **Search engine** picker. Choosing it builds the
index on save, the status card and `search:status` report on it, and
`search:rebuild` rebuilds it. When `ready()` returns `false` or throws,
searches fall back to the database automatically.

## Theming search

Search belongs to the CMS, not the theme. A theme changes how it looks, and can
replace how it behaves, at whatever depth it needs.

### Restyle the live results

The dropdown reads CSS custom properties. Set them on the form, or on any
ancestor, in your theme's stylesheet:

```css
.my-header-search {
    --radius-search-bg: #fff;
    --radius-search-fg: #141416;
    --radius-search-muted: #6b6b78;
    --radius-search-border: #e7e7ee;
    --radius-search-active: #f6f6f8;     /* hovered / keyboard-selected row */
    --radius-search-accent: #141416;     /* "See all" links */
    --radius-search-radius: 12px;
    --radius-search-shadow: 0 12px 32px rgb(0 0 0 / 14%);
}
```

For more than colours, style the classes directly:

| Class | Element |
| --- | --- |
| `.radius-search-panel` | The dropdown |
| `.radius-search-group` | One content type |
| `.radius-search-heading` | Group label row |
| `.radius-search-all` | "See all N" link |
| `.radius-search-item` | One result link. `[aria-selected="true"]` when keyboard-selected |
| `.radius-search-thumb` | Result image |
| `.radius-search-title` | Title. Matched words are wrapped in `<mark>` |
| `.radius-search-excerpt` | Excerpt |
| `.radius-search-meta` | Price or date |
| `.radius-search-empty` | "No results" line |
| `.radius-search-footer` | "Search the whole site" link |
| `form.is-searching` | Set on the form while a request is in flight |

The Storefront theme is a working example: see the end of its `theme.css`.

### Adding live results to a theme

Keep your own search form markup and add two things: a `data-radius-search`
attribute naming what to search, and `@searchScripts` after the form.

```blade
<form method="GET" action="{{ route('shop.index') }}" role="search" data-radius-search="product">
    <input type="search" name="q" value="{{ request('q') }}" autocomplete="off">
    <button>Search</button>
</form>
@searchScripts
```

- `data-radius-search`: `all`, or any type key (`post`, `product`, `page`).
- The field must be named `q`.
- `data-radius-instant="off"` opts one form out.
- `@searchScripts` prints the script at most once per page, and nothing while
  live results are switched off, so put it after every form that needs it.
  Your layout needs no change.

A form without the script still works. It submits normally.

Or skip the markup entirely and include the CMS's own form:

```blade
@include('theme::search.form', [
    'type' => 'all',               // all | post | product | page
    'placeholder' => 'Search…',
    'button' => true,
    'buttonText' => 'Go',
    'instant' => true,
    'class' => 'my-search',
])
```

### Replace the dropdown markup

Two hooks, both on the page's JavaScript.

**Replace the renderer** for every search box on the site:

```js
window.RadiusSearch = window.RadiusSearch || {};
window.RadiusSearch.render = function (data, context) {
    // data: the JSON shown above
    // context: { form, input, panel, type, query, config }
    data.groups.forEach(function (group) {
        group.items.forEach(function (item) {
            var a = document.createElement('a');
            a.href = item.url;
            a.textContent = item.title;
            a.setAttribute('role', 'option');   // joins arrow-key navigation
            context.panel.appendChild(a);
        });
    });
};
```

Set it anywhere: before or after the CMS script loads. It is looked up on every
render.

**Or intercept one form** with the cancelable event:

```js
document.querySelector('#header-search').addEventListener('radius:search:results', function (event) {
    event.preventDefault();                 // skip the built-in renderer
    var panel = event.detail.context.panel;
    panel.innerHTML = myTemplate(event.detail.data);
});
```

Either way, give each clickable result `role="option"` and an `href`. The CMS
still handles opening and closing the panel, the debounce, cancelling stale
requests, the arrow keys, Enter, Escape and the ARIA attributes.

| Event (on the form, bubbles) | `detail` | |
| --- | --- | --- |
| `radius:search:results` | `{ data, context }` | Cancelable. Fired before drawing |
| `radius:search:select` | `{ url, element }` | A result was clicked or chosen with Enter |
| `radius:search:close` | `{ context }` | The panel closed |

**Config** can be adjusted before the script runs:

```js
window.RadiusSearch = { config: { delay: 300, labels: { noResults: 'Nothing for “:query”' } } };
```

Keys: `endpoint`, `minChars`, `delay` (ms, default 200), and `labels`
(`noResults`, `seeAll`, `viewAll`).

Forms added to the page later, inside a drawer for example, are picked up with
`window.RadiusSearch.enhance(rootElement)`.

### Replace everything

Ship any of these in your theme's `views/` folder and it wins over the CMS's
copy:

| Theme file | Replaces |
| --- | --- |
| `views/search/index.blade.php` | The `/search` results page |
| `views/search/form.blade.php` | The form used by the Search widget and results page |
| `views/search/script.blade.php` | The whole live-results script and stylesheet |

The results page receives `$query`, `$type`, `$types`, `$groups` (each with
`type`, `label`, `total`, `url`, `items`), `$total`, and `$paginator` when a
single type is being paged. The CMS's own `resources/views/theme/search/index.blade.php`
documents each one at the top.

A replacement `script.blade.php` receives `$config`
(`endpoint`, `minChars`, `delay`, `labels`). It is printed wherever a theme
calls `@searchScripts`, at most once per page.

::: info Themes cannot ship PHP
Theme ZIPs only accept Blade, CSS, JS and assets. Adding a searchable type or an
engine is done from a module or the application's service providers, not from a
theme.
:::

## Testing

`tests/Feature/SiteSearchTest.php` runs the shared behaviour against both
engines through a data provider, and covers index updates, scheduled posts,
prefixes and accents, the fallback when no index exists, and the admin screen.
Point the index at a throwaway folder in `setUp()`:

```php
config(['search.index.path' => storage_path('framework/testing/search-index-'.uniqid())]);
```
