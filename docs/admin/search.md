# Site search

Radius gives visitors three ways to search your site. You pick the mix under
**Settings → Search**, and you can change it at any time without touching your
theme.

| | What visitors see | Best for |
| --- | --- | --- |
| **Database search** | Type, press Enter, get a results page | Most sites. Nothing to set up |
| **Results while typing** | A dropdown of matches appears as they type | Any site. Works with either engine |
| **Index search** | Same as above, but answered from a prebuilt index | Large sites, or sites with a lot of searching |

Results while typing is a display option, not a separate engine. It works with
database search and with index search.

## Choosing an engine

**Database** is the default. Every search reads your posts, products and pages
straight from the database. Results are always up to date, and there is nothing
to build or maintain.

**Index** builds a word index of your content ahead of time and answers from
that. A search never touches the database, so a thousand visitors searching at
once cost your database nothing. The index updates itself whenever you save,
publish, unpublish or delete something.

Stay on **Database** unless one of these is true:

- You have thousands of posts or products and search has started to feel slow.
- Search is busy: a store where most visitors use the search box, say.
- Your host limits database load and you are hitting that limit.

::: tip Switching is safe
If the index has not been built yet, or cannot be read, Radius quietly uses
database search instead. Visitors always get results.
:::

## Turning on index search

1. Go to **Settings → Search**.
2. Set **Search engine** to **Index**.
3. Click **Save settings**.

The index is built as you save. A few thousand items take a few seconds. The
message at the top of the screen confirms how many items were indexed, and the
**Search status** card below the form shows the details.

That is all. From now on the index keeps itself current as you edit.

## The settings

| Field | Default | What it does |
| --- | --- | --- |
| Search engine | Database | Where answers come from. See [Choosing an engine](#choosing-an-engine) |
| Show results while typing | on | The live dropdown under search boxes. Pressing Enter still opens the full results |
| Start after this many characters | `2` | Live results wait until this much has been typed |
| Results per group while typing | `5` | How many products, posts and pages the dropdown shows before "See all" |
| Search blog posts | on | Include posts. Has no effect while the Blog module is off |
| Search products | on | Include products. Has no effect while the Shop module is off |
| Search pages | on | Include your CMS pages |
| Site-wide results page at /search | on | One page listing matches from everything above |
| Live searches allowed per visitor per minute | `60` | Stops scripts from flooding the search. A person typing uses a handful |
| Remember live results for (seconds) | `60` | Database engine only. Repeated searches skip the database |

::: warning Already have a page at /search?
The results page takes over the address `/search`. If you built your own page
with that slug, turn off **Site-wide results page at /search** to keep yours.
:::

## The Search status card

Below the settings form, the card lists each kind of content with:

- **Searchable**: whether it is switched on above.
- **Index**: **Ready**, or **Not built, using database** if the index is missing.
- **Items**: how many entries the index holds.
- **Size**: disk space used.
- **Last change**: when the index was last built or updated.

### Rebuild index now

You do not normally need this, because the index follows your edits. Use it when
content changed **outside** the admin panel:

- after importing posts or products directly into the database
- after restoring a database backup
- after changing your site's address (domain)
- if a result looks out of date

On very large sites the rebuild can take longer than your host allows for one
page load. Run it from the command line instead, where there is no time limit:

```bash
php artisan search:rebuild
```

See [Artisan commands](/reference/cli#search-rebuild).

## Where visitors search

### The search boxes in your theme

Both bundled themes have search boxes that show live results:

- **Default theme**: the search field on the blog page and on the shop page.
- **Storefront theme**: the search bar in the header (products) and the search
  field on the blog page.

Pressing Enter still goes to the blog or shop listing, filtered by what was
typed, the same as before.

### The Search widget

In the [builder](/builder/widgets#site-parts), the **Search** widget has two
settings for this:

- **Search in**: **Whole site**, **Blog posts** or **Products**. **Whole site**
  sends visitors to the `/search` results page.
- **Results while typing**: **Use the site setting**, or **Off for this box** for
  a box where a dropdown would get in the way.

### The /search page

`yoursite.com/search?q=coffee` lists matches from every searchable kind of
content, a few of each, with a **See all** link per group. Visitors can also
filter to just one kind.

Results pages are marked `noindex`, so search engines do not index them.

## What gets searched

| Content | Matched on |
| --- | --- |
| Posts | Title, excerpt, tags, category and the post body |
| Products | Name, SKU, variant SKUs, categories, short description and description |
| Pages | Title and page content |

A match in a title ranks above a match in body text.

Only content the public can see is searchable: drafts never appear. Scheduled
posts appear from their publish time. With index search, that happens
automatically at the right moment.

::: info Database and index search differ slightly
Index search also looks inside post tags, product descriptions and variant SKUs,
and matches the start of the last word typed ("espr" finds "espresso"). It
ignores accents ("cafe" finds "café"). Database search matches any part of a
word, but only in the main fields.
:::

## Troubleshooting

**The dropdown never appears.** Check **Show results while typing** is on. If
you use a third-party theme, its search boxes need a small change to support
live results. Send its author to the
[developer guide](/developers/search#adding-live-results-to-a-theme).

**A new product does not show up with index search.** Check it is
**Published**. If it was added by an import rather than the admin panel, click
**Rebuild index now**.

**Saving the settings said the index could not be built.** Search keeps using
the database, so nothing is broken. The usual cause is that the web server
cannot write to `storage/app/search-index`. Fix the folder permissions, or run
`php artisan search:rebuild` to see the full error.

**Prices in the dropdown are out of date.** Index search stores the price when a
product is saved. A sale that starts or ends on a date does not save the
product, so its dropdown price can lag until the next save or rebuild. The
product page and shop listing always show the live price. If the
[scheduler](/reference/cli#the-scheduler) cron entry is set up, Radius rebuilds
the index every night at 03:30, which catches these.
