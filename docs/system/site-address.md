# Change site address

Use this after copying a site's **database** to a new domain, for example
from `https://staging.example.com` to `https://www.example.com`. It changes
every link and image address in the content to the new domain in one go.

<ScreenList :screens="[
  { route: '/admin/system/site-address', name: 'Change site address', role: 'Administrator' },
]" />

Open it from **System → Maintenance → Change site address**.

::: tip Used Import & export instead?
Then you don't need this page. An import already changes links to the old
site to the site it runs on. See
[Moving from staging to live](/system/import-export#moving-from-staging-to-live).
:::

## Moving a site by copying the database

1. Copy the database to the live server (phpMyAdmin export and import, or
   `mysqldump`).
2. Copy the `storage/app/public` folder too. Uploaded images live there, not
   in the database.
3. Set `APP_URL` in the live site's `.env` to the live address. Image
   addresses are built from it. The Change site address screen warns you if
   it does not match the address you opened the admin on.
4. Open **System → Change site address**. Enter the old address and the new
   one, and press **Find matches**.
5. Check the counts, leave **Back up the database first** ticked, and press
   **Change**.

## What it does

**Find matches** only counts. Nothing is written until you press the second
button. You'll see something like "Posts — 38 records, 143 addresses" for each
part of the site that has a match.

| Where | What is changed |
| --- | --- |
| Posts, pages, products | Content, excerpts, featured images, canonical URLs, schema data |
| Builder layouts | Published layouts, drafts, saved sections and layout history |
| Categories and tags | Descriptions and images |
| Menus | Custom links |
| SEO | Per-page overrides and redirect destinations |
| Settings and theme options | Logo links, footer links and the like |
| Comments | Links people left in comments |

How addresses are matched:

- **Any scheme.** `http://staging.example.com`, `https://staging.example.com`
  and `//staging.example.com` are all changed to the new address, so a move is
  also a chance to fix mixed http/https links.
- **Only that site.** `staging.example.com.au` and `staging.example.community`
  are left alone.
- **Subfolders.** If the site lived in one, include it in the old address, for
  example `http://localhost/radius`.
- **http to https on the same domain** also works. Enter the same domain with
  each scheme.

Encrypted settings, such as API keys, are never read or changed. Orders,
payment records, logs and sessions are history and are left as they are.

## Undoing it

With the backup option ticked, a database backup is written before anything
changes. Download it from [Updates & backups](/system/updates) and import it
with phpMyAdmin or `mysql` to put everything back.

::: warning Run it once
Moving into a subfolder of the same domain (from `https://example.com` to
`https://example.com/shop`) and then running it again would change
`/shop` to `/shop/shop`. Always check the counts on the preview before you
press the button.
:::
