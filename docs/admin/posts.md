# Posts, categories & comments

The blog. This is an **optional module** — switch it off under
[System → Modules](/system/modules) and every route, menu entry and widget
belonging to it disappears.

<ScreenList :screens="[
  { route: '/admin/posts', name: 'Post list' },
  { route: '/admin/posts/create', name: 'New post' },
  { route: '/admin/posts/{id}/edit', name: 'Edit post' },
  { route: '/admin/categories', name: 'Categories' },
  { route: '/admin/comments', name: 'Comment moderation' },
]" />

## Posts

<Screenshot
  src="content/posts-list.png"
  screen="/admin/posts"
  wide
  alt="The post list showing title, author, categories, status, date and comment count" />

The editor is the same one [Pages](/admin/pages) use, with three additions:

| Field | Notes |
| --- | --- |
| **Categories** | Many per post. Shared with the shop — see below |
| **Tags** | Free text; typing a new one creates it |
| **Published at** | A future date schedules the post |

<Screenshot
  src="content/post-edit.png"
  screen="/admin/posts/create"
  wide
  tall
  alt="The post editor with the content area and the sidebar panels for status, categories, tags and featured image" />

### Scheduling

Set **Published at** to a future date and the post stays invisible until then.

::: warning Scheduling needs the cron entry
A scheduled post publishes when Laravel's scheduler runs. Without the cron
entry from [Requirements](/guide/requirements#checking-the-cron-entry), the post
sits there until you publish it by hand.
:::

### The excerpt

Used in listings, in the RSS feed, and as the meta description when you have not
written one. Left empty, it is generated from the opening of the post — which is
usually worse than writing one.

## Categories

<Screenshot
  src="content/categories.png"
  screen="/admin/categories"
  alt="The category list with name, slug, type, parent and post count columns" />

Categories are **shared between the blog and the shop**, which is why the
section stays available while either module is on. Each category is marked as
belonging to posts, products, or both, so your shop categories do not pollute
your blog archive.

Categories nest. A child category produces
`/blog/category/parent/child` style URLs and inherits nothing else from its
parent.

<Screenshot
  src="content/category-edit.png"
  screen="/admin/categories/create"
  alt="The category editor with name, slug, description, parent, type and image fields" />

## Tags

Tags have no admin screen of their own — they are created inline from the post
editor and cleaned up automatically when nothing references them any more.

Tags are flat, blog-only, and produce `/blog/tag/{slug}` archives.

## Comments

<Screenshot
  src="content/comments.png"
  screen="/admin/comments"
  wide
  alt="The comment moderation queue, showing author, comment body, the post it belongs to, and approve or delete actions" />

Comments arrive unapproved and are invisible until you approve one. The queue
filters by pending, approved and all.

| Action | Effect |
| --- | --- |
| **Approve** | The comment appears publicly, immediately |
| **Edit** | Fix a typo or trim something; the edit is not marked publicly |
| **Delete** | Permanent, with no trash |

Front-end comment submission is rate limited to ten per minute per visitor, so a
script cannot flood the queue.

::: tip Turning comments off entirely
There is no site-wide switch — set **Allow comments** to off per post, or leave
the form out of your theme. If you never want them, the blog module's comment
routes can be avoided altogether by not rendering the form.
:::

## The public blog

With the module on, these routes exist:

| Route | Shows |
| --- | --- |
| `/blog` | The post index, paginated by the **Items per page** setting |
| `/blog/{slug}` | A single post |
| `/blog/category/{slug}` | Posts in a category |
| `/blog/tag/{slug}` | Posts with a tag |

<Screenshot
  src="storefront/blog-index.png"
  screen="/blog"
  wide
  alt="The public blog index rendered by the default theme" />

<Screenshot
  src="storefront/blog-post.png"
  screen="/blog/{slug}"
  wide
  tall
  alt="A single blog post on the public site, with its comment form below the content" />
