# Environment variables

`.env` sits in the project root, one level above `public/`. It holds the things
that must not live in the database: the database password itself, the key that
signs every session cookie, and high-value API keys.

::: danger .env is the most sensitive file on your server
Anyone who reads it can forge session cookies, decrypt your payment gateway
credentials and connect to your database. Verify it is unreachable with
**System → System → Check exposure**.
:::

Most day-to-day configuration is **not** here — it is in the database, editable
under [Settings](/settings/). This page covers what is not.

After editing `.env`, clear the caches: **System → Maintenance**, or
`php artisan optimize:clear`.

## Application

| Variable | Default | Notes |
| --- | --- | --- |
| `APP_NAME` | `Radius` | Used in emails and page titles |
| `APP_ENV` | `production` | `local` enables development behaviour |
| `APP_KEY` | generated | See the warning below |
| `APP_DEBUG` | `false` | **Never `true` on a live site** |
| `APP_URL` | your domain | Used to build absolute URLs in emails |
| `APP_LOCALE` | `en` | |
| `TRUSTED_PROXIES` | — | Set when behind Cloudflare or a load balancer |

::: danger APP_KEY decrypts your gateway credentials
It also signs every session cookie. Regenerating it signs everybody out **and
makes every encrypted value unreadable** — payment gateway credentials,
two-factor secrets, recovery codes. After a deliberate `key:generate` you must
re-enter every gateway's credentials and every admin must re-enrol their second
factor.

Back up `.env` before touching it. Never commit it.
:::

The key is generated on **your** server at first run, never shipped. A key baked
into a download would be identical on every site that installed it, and anyone
holding it could forge session cookies for all of them.

## Database

| Variable | Default | Notes |
| --- | --- | --- |
| `DB_CONNECTION` | `mysql` | |
| `DB_HOST` | `127.0.0.1` | |
| `DB_PORT` | `3306` | |
| `DB_DATABASE` | — | |
| `DB_USERNAME` | — | |
| `DB_PASSWORD` | — | |

## Radius-specific

| Variable | Default | Notes |
| --- | --- | --- |
| `CMS_ADMIN_PREFIX` | `admin` | Moves the admin panel off the predictable path |
| `CMS_MEDIA_DISK` | `public` | Where uploads go |
| `CMS_DOWNLOADS_DISK` | `private` | Where paid files go — **keep it private** |
| `CMS_DOWNLOADS_MAX_KB` | `262144` | 256 MB default limit for sold files |
| `CMS_UPDATE_URL` | GitHub releases endpoint | Unset to disable update checks |
| `CMS_UPDATE_CHECK_HOURS` | `24` | How often to check |
| `CMS_UPDATE_REQUIRE_CHECKSUM` | `true` | **Leave this alone** |
| `CMS_UPDATE_REQUIRE_HTTPS` | `true` | **Leave this alone** |

::: warning The two update switches are load-bearing
A release archive becomes program code running on your server. Turning off the
checksum requirement means installing a download nobody verified; turning off
the HTTPS requirement means fetching it over a channel anybody on the path can
rewrite. They exist for testing a local manifest, not for production.
:::

After changing `CMS_ADMIN_PREFIX`, clear the route cache or the old path keeps
working and the new one 404s.

## Sessions, cache and queue

| Variable | Default | Notes |
| --- | --- | --- |
| `SESSION_DRIVER` | `file` | The installer needs a session before a database exists |
| `SESSION_LIFETIME` | `120` | Minutes |
| `SESSION_ENCRYPT` | `false` | |
| `CACHE_STORE` | `file` | |
| `QUEUE_CONNECTION` | `sync` | `sync` runs jobs immediately, in-request |
| `FILESYSTEM_DISK` | `local` | |

`sync` is the right default for shared hosting, where nothing is going to run a
queue worker. It means a slow email send happens inside the request that
triggered it.

## Mail

SMTP settings are normally set in [Settings → Email](/settings/#email). These
exist for the providers whose keys should not sit in a database backup:

| Variable | For |
| --- | --- |
| `MAIL_MAILER` | Overrides the provider chosen in Settings |
| `RESEND_KEY` | Resend |
| `POSTMARK_TOKEN` | Postmark |
| `AWS_ACCESS_KEY_ID` | Amazon SES |
| `AWS_SECRET_ACCESS_KEY` | Amazon SES |
| `AWS_DEFAULT_REGION` | Amazon SES — `us-east-1` by default |

Each provider also needs its Composer package. See
[Settings → Email](/settings/#api-key-providers-read-from-env).

## Firebase

| Variable | Notes |
| --- | --- |
| `FIREBASE_CREDENTIALS` | Path to your service-account JSON |

Defaults to `storage/app/firebase/service-account.json` if unset. The public web
config goes in [Settings → Firebase](/settings/#firebase); only the
service-account file belongs here.

## S3 and object storage

| Variable | Notes |
| --- | --- |
| `AWS_BUCKET` | |
| `AWS_USE_PATH_STYLE_ENDPOINT` | `true` for MinIO and some S3-compatible hosts |

::: danger If you move downloads to S3, keep the bucket private
`CMS_DOWNLOADS_DISK` pointing at a public bucket undoes every access check on
paid files. See [Digital products](/shop/digital-products#moving-storage-elsewhere).
:::

## A minimal production `.env`

```ini
APP_NAME="My Site"
APP_ENV=production
APP_KEY=base64:...        # generated, do not copy from another site
APP_DEBUG=false
APP_URL=https://example.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mysite
DB_USERNAME=mysite
DB_PASSWORD=...

CMS_ADMIN_PREFIX=my-private-path
```

Everything else can stay at its default.

::: warning Never copy APP_KEY between sites
Two sites sharing a key means a session cookie from one is valid on the other.
Each install generates its own.
:::
