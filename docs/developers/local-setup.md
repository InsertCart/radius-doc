# Local development

## Getting it running

```bash
git clone https://github.com/InsertCart/radius.git
cd radius

composer install
npm install && npm run build

cp .env.example .env
php artisan key:generate
```

Then create a database, fill in the `DB_` values, and:

```bash
php artisan migrate --seed
php artisan cms:admin
php artisan storage:link
php artisan cms:demo          # optional: realistic sample content
echo "{}" > storage/installed
```

```bash
php artisan serve             # http://127.0.0.1:8000
```

::: warning A clone will not run until assets are built
`vendor/` and `public/build/` are build output and are **not committed**. A
fresh clone with neither shows a short page saying exactly that, rather than a
PHP fatal about `vendor/autoload.php`.
:::

## Working on assets

```bash
npm run dev      # Vite dev server with hot reload
npm run build    # compile for production
```

Compiled assets **are** committed under `public/build/` in a release, so a
buyer never needs Node installed. In the source repository they are not — build
them yourself.

## Development settings

In `.env`:

```ini
APP_ENV=local
APP_DEBUG=true
```

And under **Settings → Advanced**, leave **Cache rendered pages** off. A cached
page does not reflect your last edit, which wastes an afternoon roughly once per
developer.

## The stack

| | |
| --- | --- |
| Framework | Laravel 12 |
| PHP | 8.2+ |
| Database | MySQL 5.7+ / MariaDB 10.3+ |
| CSS | Tailwind 4, via the Vite plugin |
| JS | Alpine.js 3 — no build-step framework |
| Editor | A hand-written rich text editor, no third-party dependency |
| Builder | Server-rendered Blade, with a vanilla-JS editor |

Alpine and a hand-written editor rather than a framework is a deliberate choice:
the product has to run on hosting where nobody will ever run `npm install`.

## Tests

```bash
php artisan test                              # everything
php artisan test --filter=CheckoutTest        # one class
php artisan test tests/Feature/Shop           # one directory
```

Tests run against an in-memory SQLite database by default, configured in
`phpunit.xml`, so they do not touch your development data.

::: tip Run the payment tests before touching a gateway
They cover the verification paths — the code that decides whether an order is
paid. That is the most expensive thing in the codebase to get wrong.
:::

## Useful commands while developing

```bash
php artisan optimize:clear      # after any config change
php artisan route:list          # confirm a module's routes exist
php artisan about               # environment summary
php artisan tinker              # REPL with the app booted
php artisan cms:demo            # reset to known sample content
```

`cms:demo` re-run restores the demo records to their original state, which makes
it a quick way to reset a database you have been experimenting with.

## Testing what a buyer receives

::: danger A source download is not a release
Testing with a git archive only tests the missing pieces. It has no `vendor/`,
no `public/build/`, and may wrongly include `storage/installed`.
:::

Build a real release and extract that:

```bash
composer install --no-dev --optimize-autoloader
npm install && npm run build
php artisan cms:release
```

See [Cutting a release](/developers/releases).

## Things that will catch you out

**Route caching.** `optimize:clear` after touching routes, modules or
`CMS_ADMIN_PREFIX`. A cached route table does not notice that a module changed.

**The catch-all page route.** `routes/pages.php` is loaded last so it cannot
shadow anything. If you add a route file, keep it before that one.

**Module guards.** A new public route belonging to an optional module goes
inside the `if (modules()->enabled(...))` block, and a new admin section gets
`module:<slug>` middleware. Forgetting the second one leaves the section
reachable by URL when the module is off.

**Integer money.** `499` is `4.99`. Passing a float into an order total is a
bug that will not show up until somebody's invoice is a penny out.

**`site_logo_light_url()` naming.** `-light` describes the **ink**, not the
background. The light files are white. See
[Branding](/appearance/branding#the-two-inks).

**The uploads `.htaccess` files.** `storage/app/public/.htaccess` and
`public/themes/.htaccess` are part of the product, not leftovers. `cms:release`
ships them deliberately.

## Code style

```bash
./vendor/bin/pint
```

Laravel's default style. The repository carries an `.editorconfig`; match the
surrounding file for anything Pint does not decide.

Comments in this codebase tend to explain **why**, not what — the existing
comments in `config/cms.php` and `routes/admin.php` are a good guide to the
register expected.
