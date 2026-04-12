# Migration Checklist

## Phase 1
- [ ] Split the old single HTML file
- [ ] Move CSS into dedicated files
- [ ] Keep the old UI visually stable while moving code

## Phase 2
- [ ] Move all Supabase calls into `api.js`
- [ ] Stop storing posts and profiles as the main source of truth in localStorage
- [ ] Keep localStorage only for cache, drafts, and theme

## Phase 3
- [ ] Replace `renderAll()` with targeted renderers
- [ ] Feed updates only feed
- [ ] Search updates only search
- [ ] Notifications update only notifications

## Phase 4
- [ ] Replace inline `onclick` handlers
- [ ] Use `addEventListener`
- [ ] Prefer DOM nodes or narrowly scoped template rendering

## Phase 5
- [ ] Remove public email-based search
- [ ] Remove `passwordHint`
- [ ] Separate public profile fields from private settings

## Phase 6
- [ ] Move image uploads to Supabase Storage
- [ ] Save URLs instead of base64 blobs
