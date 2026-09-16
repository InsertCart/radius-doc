# Cutting a release

For maintainers. This is how a version reaches sites in the field.

## The three steps

```bash
# 1. Bump the version in config/cms.php  ->  'version' => '1.1.3'

# 2. Tag it. The message becomes the release description.
git tag -a v1.1.3 -m "Fixes the thing."

# 3. Push both.
git push && git push --tags
```

The `release.yml` workflow fires on any `v*` tag, builds the ZIP on a clean
machine and publishes it.

Building on CI rather than locally is deliberate: it meant remembering to swap
dev dependencies out and back in again, and a release built on the wrong machine
state is not obviously wrong until somebody installs it.

## Building one by hand

```bash
composer install --no-dev --optimize-autoloader
npm install && npm run build
php artisan cms:release
```

That writes the ZIP and a starter `manifest.json` — with the SHA-256 already
filled in — to `storage/app/private/releases/`.

Upload both, set the `download` address in the manifest to wherever the ZIP now
lives, and point `CMS_UPDATE_URL` at the manifest.

## Never publish a ZIP from version control

It cannot work:

| Missing from a git archive | What the buyer sees |
| --- | --- |
| `vendor/` | A fatal error on `require .../vendor/autoload.php` — Laravel never boots |
| `public/build/` | The site loads with no CSS or JavaScript |

And one thing a git archive can wrongly **include**: `storage/installed`, the
lock file that says setup is finished. Ship it and the buyer's setup wizard never
opens.

It is in `.gitignore` for that reason. If it was committed before, remove it
from the index:

```bash
git rm --cached storage/installed
```

`cms:release` handles all three, refuses to build when `vendor/` or
`public/build/` is missing, and ships the `.htaccess` files that keep uploads and
paid downloads from being served directly.

::: warning The ZIP must declare the version the manifest promises
`config/cms.php` inside the archive has to match. If the two disagree, the
update stops before touching anything on the buyer's site.
:::

## The manifest

```json
{
  "format": 1,
  "version": "1.1.3",
  "released_at": "2026-09-20",
  "tags": ["security", "breaking"],
  "requires_backup": true,
  "min_version": "1.0.0",
  "min_php": "8.2.0",
  "requires_extensions": ["gd", "zip"],
  "download": "https://www.insertcart.com/releases/myfile.zip",
  "sha256": "9f2c…",
  "size": 48210432,
  "notes": "Shown to the site owner before they install.",
  "changelog_url": "https://www.insertcart.com/changelog"
}
```

Only `version` and `download` are required. The rest have sensible defaults —
`requires_backup` defaults to **true**, on the grounds that silence should not
mean "skip the backup".

| Key | Default | Notes |
| --- | --- | --- |
| `version` | required | **Must be a string** — see below |
| `download` | required | HTTPS only |
| `sha256` | required by default | `sha256sum file.zip`, or `Get-FileHash` on Windows |
| `requires_backup` | `true` | |
| `min_version` | none | Refuses to jump from too old a version |
| `min_php` | none | |
| `requires_extensions` | none | |
| `tags` | none | Free text, only ever displayed |
| `notes` | none | Shown to the site owner before installing |

### `version` must be a string

::: danger Written as a JSON number, versions break silently
`1.10` parses as `1.1`, and `1.9` compares as greater than `1.10` — so sites
would stop seeing updates the moment your version numbers reach double digits.

Versions are compared with PHP's `version_compare()`. Always quote them.
:::

### `sha256` is required by default

The archive becomes program code running on your buyers' servers, so a download
nobody verified is a very large hole. Publish over `https://` — plain `http` is
refused.

### `tags` are display-only

Free text, only ever shown. Anything the CMS actually **acts** on has its own
field — that way a typo in a tag can never silently disable a backup.

## Adding fields later

The reader ignores keys it does not recognise, so you can add anything to the
manifest at any time without breaking sites already in the field.

Missing keys fall back to defaults, `tag` as a plain string works as well as
`tags` as an array, and the release may sit at the top level or inside a
`"latest"` object.

## What a buyer's first request does

A fresh extract has no `.env`, and Laravel cannot start without an `APP_KEY` —
so the first request would die before reaching the wizard that writes one.

Radius breaks that loop itself: on the first request it copies `.env.example` to
`.env` and generates an `APP_KEY` unique to that installation.

::: tip The key is generated on the buyer's server, never shipped
A key baked into the download would be identical on every site that bought the
product, and anyone holding it could forge session cookies for all of them.
:::

Sessions and cache default to **files**, not the database — the wizard needs
somewhere to keep a session before there is a database to keep one in.

## Release checklist

1. Bump `version` in `config/cms.php`
2. Run the tests — `php artisan test`
3. Update the changelog
4. Tag and push
5. Wait for the workflow, then **download the published ZIP and install it on a
   clean host**
6. Confirm the setup wizard opens — it must not be pre-locked
7. Confirm the site loads with CSS
8. Test the in-panel updater from the previous version to this one

::: warning Step 8 is the one people skip
A release that installs cleanly from scratch can still fail as an **update**,
because updating exercises the path allowlist, the checksum comparison against
locally modified files, and the migrations. Keep an install on the previous
version around to update from.
:::

## Documenting the release

These docs version alongside the product:

1. Update the affected pages in this repository
2. Bump `RADIUS_VERSION` in `docs/.vitepress/config.mts`
3. Add any new screenshots — see the [contributing notes](https://github.com/InsertCart/radius-doc#readme)
4. Push to `main`; the docs deploy workflow publishes automatically
