# Random Refactor Starter

This is a browser-first starter scaffold for your app refactor.

## What changed from the giant single-file version

- HTML, CSS, and JS are split into modules.
- Search updates only search state and search UI.
- Feed rendering is separate from notifications, profile, and settings.
- Settings are private and do **not** include a password hint field.
- Public search does **not** use email matching.
- Drafts are stored separately from posts.
- API calls live in one place with a local fallback so the scaffold still runs without Supabase.

## Folder structure

```text
random-refactor-starter/
  index.html
  css/
    base.css
    layout.css
    components.css
    themes.css
  js/
    app.js
    api.js
    auth.js
    config.js
    notifications.js
    posts.js
    profile.js
    render.js
    router.js
    search.js
    settings.js
    state.js
    utils.js
```

## How to use it

1. Open `index.html` in a local server.
2. If you want Supabase, set:
   - `window.RANDOM_SUPABASE_URL`
   - `window.RANDOM_SUPABASE_ANON_KEY`
3. Start migrating your old logic module by module.

## Suggested migration order

1. Move your existing CSS into the new css files.
2. Move storage and Supabase reads/writes into `api.js`.
3. Migrate auth forms into `auth.js`.
4. Migrate post creation and feed rendering into `posts.js`.
5. Migrate search into `search.js` without any full-page rerender on input.
6. Migrate notifications, profile, and settings last.

## Recommended Supabase tables

- `profiles`
- `posts`
- `notifications`
- `bookmarks`
- `follows`

## Important cleanup items from your current code

- remove full-feed rerender on search input
- remove public email search
- remove `passwordHint`
- stop redefining base functions later in the file
- move image storage to URLs / Supabase Storage instead of base64
