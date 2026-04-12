# Random website fixed build

This is a GitHub-ready single-page build of the site.

## What was fixed
- Search no longer triggers a full app re-render on every keystroke.
- Local/demo auth works again: accounts created without Supabase can log back in.
- Public people search no longer matches private email addresses.
- Local-only password fields are stripped before backend sync.
- When no backend is configured, the app seeds a tiny demo feed so the first load is not empty.

## Deploy on GitHub Pages
1. Upload the contents of this folder to your repo root.
2. Make sure `index.html` stays in the root.
3. Enable GitHub Pages in your repo settings.

## Demo login when no backend is configured
- `avery@example.com` / `demo1234`
- `mika@example.com` / `demo1234`
- `jules@example.com` / `demo1234`

If you keep your Supabase config in the file, the app will use that instead of demo mode.
