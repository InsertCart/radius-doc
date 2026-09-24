# Artisan commands

Run from the project root, where `artisan` lives. Everything here is optional —
the admin panel covers the same ground — but the command line does not time
out, which makes it the reliable route for a slow operation.

## Radius commands

```bash
php artisan cms:admin              # create or promote an admin account
php artisan cms:sync               # register new modules, gateways and settings
php artisan cms:sync --themes      # re-scan the themes folder
php artisan cms:cdn-sync           # move the media library to the storage provider
php artisan cms:demo               # install sample content
php artisan cms:demo --remove      # delete that sample content
php artisan cms:export             # export content as a portable bundle
php artisan cms:import             # import a Radius export bundle
php artisan cms:import-wordpress   # import a WordPress .xml export
php artisan cms:update             # install an available update
php artisan cms:release            # build a release ZIP (maintainers)
php artisan cms:theme-package      # build a checked, installable theme ZIP
php artisan cms:marketplace-entry  # print a theme directory listing for a ZIP
php artisan search:rebuild         # rebuild the site search index
php artisan search:status          # show the search engine and index state
```

### `cms:admin`

Creates an administrator, or promotes an existing account to one. Prompts for
name, email and password.

**This is the way back in if you lose admin access.** Running it against an
existing email promotes that account rather than failing.

### `cms:sync`

Registers things the database has not learned about yet: new modules, new
payment gateways, new media storage providers, new settings keys. It never touches anything already
configured.

Run it after **replacing files by hand**. The in-panel updater runs it for you.

`--themes` re-scans `themes/` — use it after uploading a theme over FTP rather
than through the admin panel.

### `cms:cdn-sync`

Uploads every media file still on this server to the active storage provider.
This is the command-line version of the batch buttons on
[Media storage](/system/media-storage), for libraries too big to click through.

- `--pull` brings files that exist only on the provider back to this server
- `--limit=N` stops after N files
- `--force` skips the confirmation asked before local copies are deleted
  (asked only when the provider is set not to keep them)

It exits non-zero if any file failed, and running it again retries those files.

### `cms:demo`

Fills an install with something to look at and test against: **12 blog posts, 9
pages and 15 products**, plus the categories, tags, comments, reviews, variants
and placeholder images that go with them. Images are drawn at run time rather
than shipped, so nothing is added to the repository.

The catalogue is chosen to cover the cases a real one has — a product on sale
inside a date window, one out of stock, one on backorder, one digital, one still
in draft, a scheduled post, an unapproved comment — because fifteen identical
in-stock products test nothing.

It is **not** part of `db:seed`, so a normal install never gets it.

Re-running it restores the demo records to their original state, which makes it
a quick way to reset a database you have been experimenting with.

`--remove` deletes exactly what the seeder created, keyed on slug, and leaves
content you wrote yourself alone.

::: warning Do not run cms:demo on a live site
It creates published content on the public site immediately.
:::

### `cms:update`

Installs an available update with no request timeout to run into — the most
reliable route for a large release, and the recovery path if a browser update
times out halfway. Takes the same backup first.

```bash
php artisan cms:update            # check, confirm, install
php artisan cms:update --check    # only report what is available
php artisan cms:update --finish   # migrate and clear caches after copying files in by hand
```

`--finish` is the command for a release unzipped over the site with FTP: it
runs the migrations, registers new modules, gateways and settings, adds new
`.env` keys and clears the caches. It needs no update server, and a site that
is already up to date just says so.

See [Updates](/system/updates#updating-over-ssh-instead).

### `cms:theme-package`

```bash
php artisan cms:theme-package storefront
```

Builds `storage/app/private/theme-packages/<slug>-<version>.zip` from
`themes/<slug>`, runs the theme installer's own checks against it, and deletes
the ZIP if they fail. It also checks the screenshot's size and format. Use
`--output=` to write it somewhere else.

The `default` theme cannot be packaged: it ships with every install and cannot
be uploaded over.

### `cms:marketplace-entry`

For whoever runs a [theme directory](/appearance/theme-directory#listing-a-theme).
Prints the catalogue entry for a theme ZIP — checksum, size, slug and version
read from the archive itself — ready to paste into the catalogue file.

```bash
php artisan cms:marketplace-entry path/to/aurora-1.2.0.zip \
    --url=https://www.insertcart.com/marketplace/aurora
```

`--url` is the folder the ZIP and its `screenshot.png` will be served from. It
warns about files the theme installer would drop, and refuses a `theme.json`
whose version is written as a number.

### `cms:export`

Writes the same bundle the [Import & export](/system/import-export) screen
does, without an upload limit or a request timeout. The format to reach for on
a site with tens of thousands of records.

```bash
php artisan cms:export --output=/backups
php artisan cms:export --types=posts,pages --status=published --format=json
php artisan cms:export --types=products --format=csv --from=2026-01-01
```

| Option | Does |
| --- | --- |
| `--types=` | Comma-separated: `pages,posts,categories,tags,comments,products,coupons,menus,media`. Default is everything |
| `--ids=` | Just these records, by id. Needs a single `--types`, so there is no doubt what the ids belong to |
| `--status=` | Only records with this status |
| `--from=` / `--to=` | Date range: posts by publication, everything else by creation |
| `--format=` | `zip` (default), `json` or `csv` |
| `--no-media` | Leave the image files out of the archive |
| `--no-layouts` | Leave builder layouts out |
| `--output=` | A directory, or a full path. Defaults to the current directory |

### `cms:import`

Applies a bundle. No time limit, unlike the web importer, which stops itself
after ten minutes so a request cannot hang.

```bash
php artisan cms:import backup.zip --dry-run     # say what is in it, change nothing
php artisan cms:import backup.zip               # skip anything already here
php artisan cms:import backup.zip --update      # overwrite it instead
```

| Option | Does |
| --- | --- |
| `--types=` | Only these types, whatever else the file holds |
| `--update` | Overwrite records that already exist, instead of skipping them |
| `--status=` | Force everything to `draft` or `published` |
| `--author=` | Email of the account to own content whose author is not on this site |
| `--create-authors` | Create accounts for authors this site has not got, with no usable password |
| `--no-media` | Do not touch the media library |
| `--download` | Fetch images the bundle does not carry from the old site |
| `--no-layouts` | Skip builder layouts |
| `--dry-run` | Read and report, import nothing |

Exits non-zero when any record failed, so a scripted migration can tell.

### `cms:import-wordpress`

Imports a WordPress `.xml` (WXR) export — posts, pages, categories, tags,
comments, menus and WooCommerce products. See
[Import & export](/system/import-export#importing-from-wordpress) for what does
and does not come across.

```bash
php artisan cms:import-wordpress export.xml --dry-run
php artisan cms:import-wordpress export.xml --media --create-authors
```

| Option | Does |
| --- | --- |
| `--media` | Fetch the image files from the old site. Without it, no pictures arrive |
| `--types=` | Only these types |
| `--update` | Overwrite records that already exist |
| `--status=` | Force everything to `draft` or `published` |
| `--author=` | Email of the account to own posts whose writer is not on this site |
| `--create-authors` | Create accounts for the WordPress authors |
| `--dry-run` | Read and report, import nothing |

Running the same file twice is safe: everything already brought across is
skipped.

### `search:rebuild`

Rebuilds the [search index](/admin/search) from the database. The same as
**Rebuild index now** under Settings → Search, without the web server's time
limit, which makes it the way to build the index on a very large site.

```bash
php artisan search:rebuild              # every searchable type
php artisan search:rebuild product      # just one
php artisan search:rebuild --engine=index   # build before switching the setting
```

With the database engine selected and no `--engine`, it does nothing: database
search has no index.

### `search:status`

Prints the engine in use, whether live results are on, and for each content
type whether the index is built, how many items it holds, its size and when it
was built.

## Laravel commands you will actually use

```bash
php artisan optimize:clear         # clear every cache
php artisan storage:link           # recreate the public/storage symlink
php artisan migrate --force        # run pending migrations
php artisan key:generate           # regenerate APP_KEY — read the warning
php artisan about                  # environment summary
php artisan route:list             # every registered route
```

### `optimize:clear`

The first thing to try when a change is not taking effect. Clears config,
routes, views and the application cache.

### `storage:link`

Recreates the symlink that serves uploaded files. Run it when uploaded images
start returning 404 — some hosts drop symlinks when copying files or restoring
a backup.

### `key:generate`

::: danger This makes every encrypted value unreadable
`APP_KEY` decrypts payment gateway credentials, two-factor secrets and recovery
codes, and signs every session cookie. After regenerating it you must re-enter
every gateway's credentials and every admin must re-enrol their second factor.

Only run it on a fresh install, or deliberately after a suspected key
compromise. Back up `.env` first.
:::

### `route:list`

Useful for confirming a module is actually on. If `/shop` 404s, check whether
the route exists at all:

```bash
php artisan route:list | grep shop
```

No output means the module is off, or the route cache is stale.

## Production caching

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

The admin panel's **Optimise for production** button runs all three.

::: warning Caching routes freezes which ones exist
After caching, toggling a module or changing `CMS_ADMIN_PREFIX` has no effect
until you clear. Always `optimize:clear` before changing configuration, and
re-cache afterwards.
:::

## The scheduler

One cron entry covers scheduled posts and the daily update check:

```
* * * * * cd /path/to/your/site && php artisan schedule:run >> /dev/null 2>&1
```

It also rebuilds the search index nightly at 03:30 when index search is
selected, which refreshes prices of products whose sale started or ended.

Radius works without it — you simply publish scheduled posts by hand and press
**Check for updates** yourself.

## Installing from the command line

```bash
cp .env.example .env          # then fill in your DB_ credentials
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan cms:admin
php artisan storage:link
echo "{}" > storage/installed
```

That last line writes the lock file that closes the setup wizard. Without it,
your site keeps offering to install itself.

See [Installation](/guide/installation#installing-from-the-command-line).

## If `php` is not on your PATH

On shared hosting the binary is often version-specific:

```bash
/usr/local/bin/php82 artisan cms:admin
php8.2 artisan cms:admin
```

Check with `php -v` that you are running 8.2 or newer — a host's default `php`
is sometimes an older version than the one serving your site.
