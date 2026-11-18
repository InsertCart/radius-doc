import { defineConfig } from 'vitepress'

// The version documented here. Bump it when you tag a Radius release, so
// readers can tell which release these pages describe.
const RADIUS_VERSION = '1.3.4'
const SITE_URL = 'https://radiusdoc.insertcart.com'

export default defineConfig({
  title: 'Radius CMS',
  description:
    'Documentation for Radius — a modular, self-hosted CMS and eCommerce platform built on Laravel 12.',
  lang: 'en-GB',

  // Set to the subdomain root. Keep '/' for radiusdoc.insertcart.com; change to
  // '/radius/' only if you ever serve from a GitHub project subpath instead.
  base: '/',

  // Fail the build on a broken internal link rather than shipping one.
  ignoreDeadLinks: false,

  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ['public/**'],

  transformHead({ pageData }) {
    if (pageData.relativePath === '404.md') {
      return [['meta', { name: 'robots', content: 'noindex' }]]
    }
  },

  transformPageData(pageData) {
    const head = (pageData.frontmatter.head ??= [])
    const path = pageData.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
    const url = new URL(path, `${SITE_URL}/`).href
    const title = pageData.frontmatter.titleTemplate === false
      ? pageData.title
      : `${pageData.title} | Radius CMS`

    head.push(
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: pageData.description }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:image', content: `${SITE_URL}/radius-logo.png` }],
      ['meta', { property: 'og:image:alt', content: 'Radius CMS' }],
      ['meta', { name: 'twitter:card', content: 'summary' }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: pageData.description }],
      ['meta', { name: 'twitter:image', content: `${SITE_URL}/radius-logo.png` }],
    )
  },

  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
      },
    ],
    ['link', { rel: 'icon', href: '/favicon.ico', sizes: 'any' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'theme-color', content: '#0F1316' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Radius documentation' }],
  ],

  sitemap: {
    hostname: SITE_URL,
  },

  markdown: {
    lineNumbers: false,
    // Renders ::: tip / warning / danger blocks used throughout these pages.
    container: {
      tipLabel: 'Tip',
      warningLabel: 'Careful',
      dangerLabel: 'Do not do this',
      infoLabel: 'Note',
    },
  },

  themeConfig: {
    logo: { light: '/radius-logo.png', dark: '/radius-logo-light.png' },
    siteTitle: 'Radius',

    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Admin', link: '/admin/dashboard' },
      { text: 'Builder', link: '/builder/' },
      { text: 'Shop', link: '/shop/' },
      { text: 'Developers', link: '/developers/project-layout' },
      {
        text: `v${RADIUS_VERSION}`,
        items: [
          { text: 'Changelog', link: 'https://github.com/InsertCart/radius/releases' },
          { text: 'Updating Radius', link: '/system/updates' },
          { text: 'Report an issue', link: 'https://github.com/InsertCart/radius/issues' },
        ],
      },
    ],

    // One sidebar for the whole site: readers of a self-hosted product tend to
    // arrive from a search result and then browse sideways, so hiding the rest
    // of the tree behind a section costs more than it saves.
    sidebar: [
      {
        text: 'Getting started',
        collapsed: false,
        items: [
          { text: 'What Radius is', link: '/guide/introduction' },
          { text: 'Requirements', link: '/guide/requirements' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'First steps', link: '/guide/first-steps' },
        ],
      },
      {
        text: 'Using the admin panel',
        collapsed: false,
        items: [
          { text: 'The dashboard', link: '/admin/dashboard' },
          { text: 'Pages', link: '/admin/pages' },
          { text: 'Posts, categories & comments', link: '/admin/posts' },
          { text: 'Menus', link: '/admin/menus' },
          { text: 'Site search', link: '/admin/search' },
          { text: 'Media library', link: '/admin/media' },
          { text: 'Users & roles', link: '/admin/users' },
          { text: 'Contact forms & newsletter', link: '/admin/marketing' },
        ],
      },
      {
        text: 'Visual builder',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/builder/' },
          { text: 'Widgets', link: '/builder/widgets' },
          { text: 'Theme regions', link: '/builder/regions' },
          { text: 'Building a widget', link: '/builder/custom-widgets' },
        ],
      },
      {
        text: 'Shop',
        collapsed: false,
        items: [
          { text: 'Products & stock', link: '/shop/' },
          { text: 'Digital products', link: '/shop/digital-products' },
          { text: 'Checkout & addresses', link: '/shop/checkout' },
          { text: 'Orders & coupons', link: '/shop/orders' },
          { text: 'Payment gateways', link: '/shop/payments' },
        ],
      },
      {
        text: 'Appearance',
        collapsed: false,
        items: [
          { text: 'Themes', link: '/appearance/themes' },
          { text: 'Theme directory', link: '/appearance/theme-directory' },
          { text: 'Theme preview & demos', link: '/appearance/theme-preview' },
          { text: 'Building a theme', link: '/appearance/theme-development' },
          { text: 'Branding', link: '/appearance/branding' },
        ],
      },
      {
        text: 'Settings',
        collapsed: false,
        items: [{ text: 'All settings screens', link: '/settings/' }],
      },
      {
        text: 'System',
        collapsed: false,
        items: [
          { text: 'Modules', link: '/system/modules' },
          { text: 'Plugins', link: '/system/plugins' },
          { text: 'Media storage & CDN', link: '/system/media-storage' },
          { text: 'Mobile API', link: '/system/mobile-api' },
          { text: 'Import & export', link: '/system/import-export' },
          { text: 'Change site address', link: '/system/site-address' },
          { text: 'System health', link: '/system/health' },
          { text: 'Updates & backups', link: '/system/updates' },
          { text: 'Security', link: '/system/security' },
        ],
      },
      {
        text: 'Reference',
        collapsed: false,
        items: [
          { text: 'Artisan commands', link: '/reference/cli' },
          { text: 'Environment variables', link: '/reference/env' },
        ],
      },
      {
        text: 'Developers',
        collapsed: false,
        items: [
          { text: 'Project layout', link: '/developers/project-layout' },
          { text: 'Local development', link: '/developers/local-setup' },
          { text: 'Search internals', link: '/developers/search' },
          { text: 'Mobile API reference', link: '/developers/mobile-api' },
          { text: 'Building a plugin', link: '/developers/plugins' },
          { text: 'Cutting a release', link: '/developers/releases' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/InsertCart/radius' },
    ],

    editLink: {
      pattern: 'https://github.com/InsertCart/radius-doc/edit/main/docs/:path',
      text: 'Suggest a change to this page',
    },

    search: {
      // Local index: no account, no third-party service, built at deploy time.
      provider: 'local',
      options: {
        detailedView: true,
      },
    },

    outline: { level: [2, 3], label: 'On this page' },

    docFooter: { prev: 'Previous', next: 'Next' },

    lastUpdatedText: 'Last updated',

    footer: {
      message:
        'Radius is open source under the MIT licence. Security issues go to the address in SECURITY.md, not the public issue tracker.',
      copyright: 'Radius — a self-hosted CMS and eCommerce platform.',
    },
  },
})
