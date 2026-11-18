---
title: "Build a Radius CMS plugin"
description: "Develop and package a Radius CMS plugin with registration, routes and integrations that extend the application."
---

# Building a plugin

A plugin is a Laravel service provider in a folder, with a `plugin.json` that
tells Radius about it. It can add routes, admin screens, middleware, views,
database tables and public files. It is installed and removed independently of
the CMS. For the owner's side of this, see [Plugins](/system/plugins).

## Start from a working plugin

```bash
php artisan cms:plugin make my-plugin --name="My Plugin" --author="You"
php artisan cms:plugin enable my-plugin
```

This creates `plugins/my-plugin` with a manifest, a service provider, an admin
route, and a settings screen linked from the sidebar. It works as soon as
it's switched on, so you can build from there.

## Layout

```
plugins/my-plugin/
├── plugin.json
├── src/
│   └── MyPluginServiceProvider.php
├── routes/
│   ├── web.php               optional
│   └── admin.php             optional
├── resources/views/          optional
├── database/migrations/      optional
└── assets/                   optional, published to public/plugins/my-plugin
```

The folder name must match the `slug` in `plugin.json`.

## plugin.json

```json
{
    "name": "My Plugin",
    "slug": "my-plugin",
    "version": "1.0.0",
    "description": "One sentence for the Plugins screen.",
    "author": "You",
    "author_url": "https://example.com",
    "requires": "1.3.0",
    "namespace": "RadiusPlugins\\MyPlugin",
    "provider": "RadiusPlugins\\MyPlugin\\MyPluginServiceProvider",
    "settings_route": "admin.my-plugin.settings"
}
```

| Field | Required | |
| --- | --- | --- |
| `name`, `version` | Yes | Shown on the Plugins screen |
| `slug` | Yes | Lowercase letters, numbers and single hyphens. Must match the folder |
| `namespace` | Yes | Must sit under `RadiusPlugins\`. `src/` is autoloaded as this namespace (PSR-4) |
| `provider` | Yes | A class inside `namespace` that extends `App\Cms\Plugins\PluginServiceProvider` |
| `requires` | No | The lowest Radius version the plugin runs on. It is refused on anything older |
| `settings_route` | No | A named route. The Plugins screen links to it as **Settings** while the plugin is on |

A plugin can't declare classes outside its own namespace. This stops it from
replacing one of Radius's own classes.

## The service provider

```php
namespace RadiusPlugins\MyPlugin;

use App\Cms\Plugins\PluginServiceProvider;

class MyPluginServiceProvider extends PluginServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(MyService::class);
    }

    public function boot(): void
    {
        $this->loadPluginViews();      // view('my-plugin::settings')
        $this->loadWebRoutes();        // routes/web.php on the 'web' stack
        $this->loadAdminRoutes();      // routes/admin.php under /admin, admins only

        $this->hooks()->addAdminLink('Appearance', 'My plugin', 'admin.my-plugin.settings', 'admin.my-plugin.*');
    }

    public function activated(): void {}     // after switch-on and migrations
    public function deactivated(): void {}   // after switch-off; data is kept
    public function uninstalling(): void {}  // before tables are rolled back and files deleted
}
```

Enabled plugins are registered while Radius registers its own services, so
their routes load **before** the catch-all page route. A plugin route can't be
hidden by a page with the same slug. It can, however, override a core route
with the same path.

The three lifecycle methods run on a provider that hasn't been registered in
that request. Don't rely on anything set up in `register()` or `boot()` there.

### Helpers

| Method | |
| --- | --- |
| `loadWebRoutes($file = 'routes/web.php')` | Public routes, with the `web` and `installed` middleware |
| `loadAdminRoutes($file = 'routes/admin.php', $adminOnly = true)` | Under the admin prefix and `admin.` route names. Requires sign-in, staff role and two-factor. Administrators only unless `$adminOnly` is false |
| `loadPluginViews()` | `resources/views` under the `<slug>::` namespace |
| `pluginPath($sub)` | An absolute path inside the plugin |
| `plugin()` | The plugin's `App\Models\Plugin` row |
| `hooks()` | The hook registry, below |

### Settings

Each plugin has a JSON `config` column on its own row. When the plugin is
uninstalled, the row and its settings are deleted too.

```php
plugins()->find('my-plugin')->setting('api_key');
plugins()->saveConfig('my-plugin', ['api_key' => '…']);
```

### Public files

Anything in `assets/` is copied to `public/plugins/<slug>/` when the plugin is
switched on. PHP, scripts and dotfiles are never copied. Link to them with:

```blade
<link rel="stylesheet" href="{{ plugin_asset('my-plugin', 'css/app.css') }}">
```

### Migrations

Migrations in `database/migrations` run when the plugin is switched on, and
again when an enabled plugin is updated. Uninstalling rolls them all back.

## Hooks

Core views mark places where plugins can add output. Register a callback that
returns HTML:

```php
$this->hooks()->listen('admin.themes.actions', function (\App\Models\Theme $theme) {
    return view('my-plugin::theme-button', compact('theme'))->render();
}, priority: 10);
```

| Hook | Arguments | Where |
| --- | --- | --- |
| `admin.themes.actions` | `$theme` | Under each theme card on *Appearance → Themes* |
| `admin.themes.sidebar` | — | The right-hand column of the Themes screen |
| `admin.plugins.card` | `$plugin` | Under each plugin on the Plugins screen |

A callback that throws an error is logged and skipped. The page still renders.

Public pages have no hooks, because themes come from different authors and
can't all be relied on to include one. To change front-end output, use a
middleware on the response, the way Theme Preview adds its demo bar.

### Admin views and CSS

Admin screens can extend `admin.layout` and use the `x-admin.*` and `x-form.*`
components. The admin stylesheet is compiled from Radius's own views, though,
so **a Tailwind class that no core view uses won't be styled** on your screen.
Stick to classes the core admin already uses, or ship your own stylesheet in
`assets/`.

## Packaging and publishing

```bash
php artisan cms:plugin package my-plugin
```

This validates `plugin.json` with the same rules an upload goes through. It
then writes `storage/app/private/plugin-packages/my-plugin-<version>.zip` with
forward-slash paths and prints its SHA-256. Upload that file on any Radius
site.

`cms:release` never includes `plugins/`, and the Radius repository ignores
everything in it. A plugin you develop inside a Radius checkout doesn't end up
in the CMS download or its git history. Keep each plugin in its own
repository.

### Listing it in the plugin directory

`package` also prints the plugin's entry for the directory catalogue. Pass the
address the ZIP will be served from:

```bash
php artisan cms:plugin package my-plugin --url=https://www.example.com/marketplace/my-plugin
```

Add the printed entry to `items` in the catalogue file (`modules.json`),
upload the ZIP to that address, and every Radius site will see it under
*Browse plugins*. The catalogue uses the same format as the
[theme directory](/appearance/theme-directory), plus two fields for paid
plugins:

| Field | |
| --- | --- |
| `price`, `currency` | For example `29` and `USD`. A price above 0 makes it a paid listing |
| `purchase_url` | Where it's bought. Paid plugins are never downloaded by the CMS; buyers upload the ZIP they bought |

The `sha256` must match the ZIP exactly. Sites refuse a download that doesn't
match, and every time you rebuild the ZIP, its checksum changes.
