# Artisan commands

Run from the project root, where `artisan` lives. Everything here is optional —
the admin panel covers the same ground — but the command line does not time
out, which makes it the reliable route for a slow operation.

## Radius commands

```bash
php artisan cms:admin              # create or promote an admin account
php artisan cms:sync               # register new modules, gateways and settings
php artisan cms:sync --themes      # re-scan the themes folder
php artisan cms:demo               # install sample content
php artisan cms:demo --remove      # delete that sample content
php artisan cms:update             # install an available update
php artisan cms:release            # build a release ZIP (maintainers)
```

### `cms:admin`

Creates an administrator, or promotes an existing account to one. Prompts for
name, email and password.

**This is the way back in if you lose admin access.** Running it against an
existing email promotes that account rather than failing.

### `cms:sync`

Registers things the database has not learned about yet: new modules, new
payment gateways, new settings keys. It never touches anything already
configured.

Run it after **replacing files by hand**. The in-panel updater runs it for you.

`--themes` re-scans `themes/` — use it after uploading a theme over FTP rather
than through the admin panel.

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

See [Updates](/system/updates#updating-over-ssh-instead).

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
