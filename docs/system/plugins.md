# Plugins

Plugins are add-ons you install separately from Radius. Modules ship inside
every release and can only be switched on or off. A plugin comes from outside
the release: you install it, switch it on, and can later uninstall it
completely.

<ScreenList :screens="[
  { route: '/admin/plugins', name: 'Plugins', role: 'Administrator' },
]" />

::: warning A plugin is code
A plugin is PHP code, and it runs with the same access as Radius itself. It
can read the database, send email and change any page. Installing one is the
same as deploying code to your server, so only install plugins from people you
trust. For the same reason, only administrators can see the Plugins screen.
:::

## Installing a plugin

You can install a plugin in any of three ways:

- **From the plugin directory.** Go to *System → Browse plugins*. Free plugins
  install in one click. Paid plugins show their price and a **Buy** button that
  links to where they're sold. After buying, upload the ZIP.
- **Upload it.** Go to *System → Plugins* and upload the plugin's `.zip` file.
- **Copy it onto the server.** Put the plugin's folder in `plugins/`, for
  example `plugins/my-plugin/`. The next time you open the Plugins screen,
  it appears in the list.

A new plugin is always **off** when it arrives. None of its code runs until
you switch it on.

A plugin installed from the directory shows **Update to …** on the Plugins
screen when a newer version is published, and the sidebar shows a badge.
To update any other plugin, upload the newer ZIP and tick **Replace an
installed copy**.
If the plugin is on, Radius runs its new database migrations straight away.

### What an upload checks

Before anything is written to `plugins/`, Radius checks that:

- no file in the archive would land outside the plugin's own folder
- server configuration files (`.htaccess`, `.user.ini`) and other dotfiles
  are left out
- the archive isn't a zip bomb (there are limits on file count and unpacked
  size)
- `plugin.json` is valid, the plugin's code lives under its own namespace, and
  it supports your version of Radius

These checks make sure the files land where they should. They can't tell you
whether the plugin itself is trustworthy.

A directory download must also match the SHA-256 checksum the directory
publishes, and must come over `https://`. Neither check can be switched off
for plugins.

To turn uploads off, set `CMS_PLUGIN_UPLOADS=false` in `.env`. The upload
form and the plugin directory both disappear, and plugins can only be installed
by copying them onto the server.

## The plugin directory

*Browse plugins* reads a catalogue file, by default
`https://www.insertcart.com/marketplace/modules.json`. To use your own, set
`CMS_PLUGIN_MARKETPLACE_URL`. `CMS_MARKETPLACE_ENABLED=false` turns off both
the theme and plugin directories.

Browsing sends nothing about your site. Updates are checked only for plugins
that were installed from the directory.

## Switching on, off and uninstalling

| Action | What happens |
| --- | --- |
| **Switch on** | Runs the plugin's migrations, publishes its public files to `public/plugins/<slug>`, then loads it on every request |
| **Switch off** | Stops loading it. Its settings and data are kept, so switching it back on restores everything |
| **Uninstall** | Only possible once it is off. Runs the plugin's own clean-up, rolls back its tables, and deletes its folder and settings |

## Updates never touch plugins

A Radius update doesn't write to `plugins/` or `public/plugins/`, and plugins
aren't included in the Radius download. Each plugin is installed and updated
on its own.

## When a plugin breaks the site

If a plugin fails to load (missing files, or an error while it starts up),
Radius skips it, logs the error, and carries on. If a plugin is loading but
something it does breaks the admin panel, you have two ways back in.

**From the command line**, switch it off:

```bash
php artisan cms:plugin disable <slug>
```

**Or in `.env`**, set:

```ini
CMS_PLUGINS_SAFE_MODE=true
```

Safe mode loads no plugins at all, whatever the Plugins screen says. Sign in,
switch off or uninstall the plugin that caused the problem, then remove the
line.

## See also

- [Theme Preview](/appearance/theme-preview), a plugin for live theme demos
- [Building a plugin](/developers/plugins)
- [`cms:plugin`](/reference/cli#cms-plugin)
