# Project layout

Radius is one Laravel 12 application. The CMS lives in `app/Cms/`, kept apart
from Laravel's own skeleton so it is obvious which code is the product.

## The tree

```
app/
├── Cms/                    the CMS itself, kept apart from Laravel's skeleton
│   ├── Settings/           database-backed settings with caching
│   ├── Modules/            the module on/off switchboard
│   ├── Themes/             theme discovery, activation and the ZIP installer
│   ├── Payments/           gateway contract, result object and drivers
│   ├── Sms/                SMS drivers and the one-time-code flow
│   ├── Firebase/           FCM push and client config
│   ├── Seo/                meta, schema.org and sitemap generation
│   ├── Shop/               cart and order services
│   ├── Builder/            the visual editor's engine
│   │   └── Blocks/         one class per widget
│   ├── Media/              uploads and thumbnails
│   └── Support/            helpers, 2FA, admin navigation
├── Http/Controllers/
│   ├── Admin/              the admin panel
│   ├── Front/              the storefront
│   ├── Auth/               sign-in, registration, two-factor
│   └── Installer/          the setup wizard
└── Models/

public/
├── images/                 default logos, dark ink and white
├── favicon/                default icon set and the web manifest
└── favicon-light/          the same icons for browsers in dark mode

config/
├── cms.php                 modules, themes, media, security, brand assets
├── settings.php            every admin setting, declared once
├── payments.php            gateway definitions and endpoints
├── updates.php             the updater's path allowlist and backup policy
└── builder.php             registered widgets, breakpoints, design tokens

routes/
├── web.php                 public routes, wrapped in module checks
├── admin.php               the admin panel
├── auth.php                sign-in, registration, account area
├── installer.php           the setup wizard
└── pages.php               the catch-all page route, loaded last

themes/
├── default/                the bundled starter theme
└── storefront/             the bundled shop theme
```

## Declared once, generated everywhere

The pattern worth knowing before you extend anything: each extension point is
**one array entry plus one class**, and the interface is generated from the
declaration.

| To add | You write |
| --- | --- |
| A **setting** | One array entry in `config/settings.php` — the admin form is generated from it |
| A **payment gateway** | One driver class, one entry in `config/payments.php` |
| A **builder widget** | One block class, one Blade view, one entry in `config/builder.php` |
| A **module** | One entry in `config/cms.php`, then `php artisan cms:sync` |

So there is no admin form to write for a new setting, and no editor panel to
write for a new widget.

## Where the catch-all lives

`routes/pages.php` holds the catch-all page route and is **loaded after every
other route file**, so it can never shadow one of them. A page whose slug is
`shop` does not break `/shop`.

## The module middleware

Module-owned admin sections are wrapped in `module:<slug>` as well as being
hidden from the navigation:

```php
Route::middleware('module:shop')->group(function () {
    Route::resource('products', ProductController::class);
});
```

Hiding a link is presentation; the middleware is the actual control. A disabled
module cannot be reached by typing a URL.

Public routes go further — they are wrapped in a plain `if`, so the route is
never registered at all:

```php
if (modules()->enabled('shop')) {
    Route::prefix('shop')->group(function () { /* ... */ });
}
```

That is what "a disabled module costs nothing" means literally: no route
matching, no controller resolution, no view lookups.

## Key classes

| Class | Does |
| --- | --- |
| `Cms\Settings\SettingsRepository` | Reads and writes settings, with caching |
| `Cms\Modules\*` | The module switchboard; backs `modules()` |
| `Cms\Support\HtmlSanitizer` | The editor content allowlist |
| `Cms\Media\MediaService` | Upload validation, re-encoding, thumbnails |
| `Cms\Media\SvgSanitizer` | Strips scripts and entities from SVG uploads |
| `Cms\Builder\LayoutRenderer` | Turns a layout tree into HTML |
| `Cms\Builder\Blocks\Block` | The base class every widget extends |
| `Cms\Builder\Control` | The control builder used in `controls()` |
| `Cms\Payments\PaymentManager` | Resolves and drives gateways |
| `Cms\Payments\Drivers\AbstractGateway` | The base class for a gateway driver |
| `Cms\Seo\SeoManager` | Backs `seo()`; resolves per-model overrides |
| `Cms\Seo\SitemapGenerator` | Builds `sitemap.xml` and `robots.txt` |

## Conventions

- **Gateways talk REST, not vendor SDKs.** That keeps `vendor/` small, avoids
  six sets of transitive dependencies fighting each other, and means a host only
  needs `curl` and `openssl`.
- **Money is integers** in the currency's minor unit, everywhere, with no
  exceptions.
- **Sanitise on the way in, escape on the way out.** Editor content passes the
  allowlist on save *and* is escaped in views.
- **Config is the source of truth** for what exists; the database records what
  is switched on.

## Adding a payment gateway

One driver extending `AbstractGateway`:

```php
namespace App\Cms\Payments\Drivers;

class MyGateway extends AbstractGateway
{
    public function key(): string { return 'mygateway'; }

    public function charge(Order $order): PaymentResult { /* ... */ }

    public function verify(Order $order, array $payload): PaymentResult { /* ... */ }

    public function refund(Order $order, int $amount): PaymentResult { /* ... */ }
}
```

Then an entry in `config/payments.php` declaring its credential fields, and
`php artisan cms:sync` to register it.

::: danger `verify()` must call the provider's API
A redirect back from a gateway proves nothing — the customer controls it. A
`verify()` that trusts its `$payload` is a way to get paid orders for free.
Always ask the provider directly what state the payment is in.
:::

## Where your changes survive an update

| Location | Survives? |
| --- | --- |
| `themes/your-theme/` | Yes — the allowlist never touches non-bundled themes |
| `.env` | Yes |
| `storage/` | Yes |
| Settings in the database | Yes |
| `app/`, `resources/`, `routes/`, `config/` | **No** — these are replaced |

An edited shipped file is detected by checksum and **skipped with a report**
rather than overwritten, which saves you once. It is not a strategy: keep
customisations in version control and prefer the extension points above to
editing shipped code.

See [Updates](/system/updates#what-an-update-touches).
