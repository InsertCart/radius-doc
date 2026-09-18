# Media storage & CDN

By default, every upload is stored in this site's own `storage/app/public`
folder and served by the web server. Under **System → Media storage** you can
serve the library from somewhere else instead: a CDN, an object-storage bucket,
or another server reached over FTP.

<ScreenList :screens="[
  { route: '/admin/cdn', name: 'Media storage', role: 'Administrator' },
  { route: '/admin/cdn/{provider}', name: 'Provider settings', role: 'Administrator' },
]" />

The screen is part of the **Media storage & CDN** module. It is admin-only,
because it holds bucket credentials and its buttons move every file on the site.

## Two kinds of provider

There are two kinds of provider. They can look alike, but they do different
things:

| | Files move? | Turning it off |
| --- | --- | --- |
| **CDN in front of this server** — Cloudflare, CloudFront, BunnyCDN, KeyCDN, Fastly | No. Only the address changes. | Instant. Nothing to undo. |
| **Object storage** — Amazon S3, DigitalOcean Spaces, Cloudflare R2, Google Cloud Storage, Wasabi, Backblaze B2, any S3-compatible service | Yes, uploaded to a bucket | Instant while a copy is kept here |
| **Custom FTP / FTPS** | Yes, uploaded to another server | Same as object storage |

::: tip Which one do you want?
If you only want images to load faster, use **CDN in front of this server**.
Point a pull zone (or a proxied Cloudflare DNS record) at your site and paste
its address in. The CDN fetches each file from your site the first time someone
asks for it, then serves its own copy. Nothing is uploaded, so nothing can go
missing.

Use object storage when disk space on your host is the problem, or when several
servers need to share one upload folder.
:::

Only one provider can be active at a time. You can fill in credentials for as
many as you like, though. Switching providers never throws saved credentials away.

## Setting one up

1. Open **System → Media storage** and choose **Set up** next to a provider.
2. Fill in the fields. Each provider's page explains where to find them in that
   provider's dashboard. Secrets are encrypted at rest and never shown again.
   A blank secret field keeps the value that is already saved.
3. Press **Test connection**. Radius writes a small text file, reads it back and
   deletes it, and tells you exactly what went wrong if it cannot.
4. Press **Use this provider**.

::: warning The bucket must allow public reads
Radius uploads without an access-control header. Modern S3 buckets reject one,
and R2 and Google Cloud Storage never supported them. Public access is
set on the bucket itself: a bucket policy on S3, a connected custom domain or
`r2.dev` address on R2, or `allUsers` as Storage Object Viewer on Google Cloud.
:::

### Provider notes

- **Amazon S3**: add a CloudFront domain in *CloudFront or custom domain* to serve
  through CloudFront. The bucket still receives the uploads.
- **DigitalOcean Spaces**: turn on the Space's built-in CDN and paste its
  `.cdn.digitaloceanspaces.com` address.
- **Cloudflare R2**: needs a public address. R2 buckets have none of their own.
- **Google Cloud Storage**: uses an **HMAC interoperability key** (it starts with
  `GOOG`), not a service-account JSON file.
- **Other S3-compatible**: covers MinIO, Linode, Vultr, Scaleway, Hetzner and
  others. If uploads fail with `NoSuchBucket`, switch the *Address style*
  setting.
- **FTP**: FTP only moves the files. The other server must publish that
  directory on the web itself, which is why a public address is required.
  Use FTPS wherever your host supports it.

No SDKs are required. S3-compatible providers are reached over plain HTTPS
using PHP's `curl` and `openssl`. FTP needs PHP's `ftp` extension, and the
screen tells you if it is missing.

## Keeping a copy on this server

Object storage and FTP providers have the option **Keep a copy of every file on
this server**. It is on by default.

- **On (mirroring):** uploads go to the provider *and* stay here. If the bucket
  is lost, your media is not. Switching back is one click.
- **Off (offloading):** files are deleted from this server once they reach the
  provider. This frees the disk space, but the bucket then holds the only copy,
  so back it up.

**Folder prefix** is optional. It stores everything under a sub-folder, so
several sites can share one bucket.

## Moving an existing library

Switching a provider on does not touch the files you already have. They keep
being served from this server until they are moved, so nothing breaks
in the meantime. New uploads go to the provider straight away.

The storage screen shows how many files are still waiting, with two buttons:

- **Upload _n_ file(s)** moves one batch (25 by default) to the provider
- **Bring _n_ file(s) back here** copies a batch of provider-only files back

Each press moves one batch, so the request always finishes, even on shared
hosting. Press the button again until nothing is left. For large
libraries, use the command line:

```bash
php artisan cms:cdn-sync            # upload everything still on this server
php artisan cms:cdn-sync --pull     # bring provider-only files back
php artisan cms:cdn-sync --limit=500
```

## Switching off safely

Radius **will not switch off or swap a provider** while it holds the only copy
of any file, because every one of those images would break. Bring the
files back first, then switch off. With mirroring on, this never comes up.

If an upload cannot reach the provider (the bucket is down, or the credentials
changed), the upload still succeeds. The file stays on this server, is served
from here, and the next sync picks it up. The reason is written to the log.

Turning off the **Media storage & CDN** module only hides this screen. Media
keeps being served from wherever it currently is. To stop using a provider,
switch the provider off.

## What is not covered

- **Theme CSS, JS and fonts** are served by your site either way. A pull CDN in
  front of your whole domain covers them too, with no settings needed.
- **Paid downloads** never go to a provider. They are served by a controller
  that checks the order first, and a public bucket would hand them to
  anyone who guessed the address.
- **Logos and images set under Settings** move to the provider once the
  *whole* library has been uploaded. Until then they are served from here.
