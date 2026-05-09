<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Random — Chat Style</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
:root {
  --app-bg: #202123; --panel: #2b2d31; --panel-2: #343541; --panel-3: #3f4047;
  --border: #4a4b53; --text: #ececf1; --muted: #a9acb6; --soft: #8e93a1;
  --accent: #10a37f; --accent-hover: #14b88e; --pill: #40414f; --danger: #ef4444;
  --content-bg: #2f3037; --shadow: 0 14px 36px rgba(0,0,0,0.22);
  --radius-xl: 18px; --radius-lg: 14px; --radius-md: 12px;
}
* { margin:0; padding:0; box-sizing:border-box; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif; }
html,body { background:var(--app-bg); color:var(--text); min-height:100vh; }
::-webkit-scrollbar { width:8px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:#565869; border-radius:999px; }

.topbar {
  height:72px; background:#202123; border-bottom:1px solid #2f3138; display:flex; align-items:center; justify-content:space-between;
  padding:0 18px; gap:16px; position:sticky; top:0; z-index:50; max-width:1225px; margin:0 auto; width:100%;
}
.brand { font-size:24px; font-weight:700; color:var(--text); letter-spacing:-0.02em; cursor:pointer; }
.search-box { flex:1; max-width:600px; margin:0 auto; position:relative; }
.search-box input { width:100%; height:48px; border-radius:999px; background:#2a2b32; border:1px solid #3a3b44; color:var(--text); padding:0 18px; font-size:15px; outline:none; }
.search-box input::placeholder { color:var(--muted); }
.search-dropdown { position:absolute; top:calc(100% + 10px); left:0; right:0; background:#1f1f1f; border:1px solid #343541; border-radius:18px; box-shadow:0 18px 44px rgba(0,0,0,0.28); padding:10px; display:none; z-index:60; max-height:420px; overflow-y:auto; }
.search-dropdown.active { display:block; }
.search-dropdown-section + .search-dropdown-section { margin-top:8px; padding-top:8px; border-top:1px solid #444654; }
.search-dropdown-title { font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af; padding:6px 10px; font-weight:700; }
.search-dropdown-item { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:12px; border-radius:14px; cursor:pointer; transition:0.18s ease; color:#f3f4f6; }
.search-dropdown-item:hover, .search-dropdown-item.active { background:#40414f; }
.search-dropdown-main { min-width:0; display:flex; flex-direction:column; gap:4px; }
.search-dropdown-name { font-size:15px; font-weight:700; color:#f9fafb; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.search-dropdown-sub { font-size:13px; color:#9ca3af; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.search-dropdown-pill { font-size:12px; font-weight:700; color:#111827; background:#d1d5db; border-radius:999px; padding:6px 10px; flex-shrink:0; }

.top-actions { display:flex; align-items:center; gap:10px; }
.login-btn, .register-btn, .logout-btn, .post-btn, .action-btn, .reply-submit-btn, .save-btn, .follow-btn, .submit-btn, .secondary-submit-btn, .search-open-btn, .draft-chip-btn {
  border-radius:12px; border:1px solid transparent; padding:10px 16px; font-size:15px; font-weight:700; cursor:pointer; transition:background .18s ease, transform .18s ease;
}
.login-btn, .secondary-submit-btn { background:var(--pill); color:var(--text); border:1px solid var(--border); }
.register-btn, .logout-btn, .submit-btn, .post-btn, .action-btn, .reply-submit-btn, .save-btn, .follow-btn, .search-open-btn { background:var(--accent); color:#fff; }
.register-btn:hover, .logout-btn:hover, .submit-btn:hover, .post-btn:hover, .action-btn:hover, .reply-submit-btn:hover, .save-btn:hover, .follow-btn:hover, .search-open-btn:hover { background:var(--accent-hover); transform:translateY(-1px); }
.login-btn:hover { background:#4a4b57; border-color:#5b5e6d; }
.logout-btn { display:none; align-items:center; justify-content:center; min-height:44px; }
.logout-btn.visible { display:inline-flex; }

.notifications-anchor { position:relative; display:none; align-items:center; }
.notifications-anchor.visible { display:inline-flex; }
.icon-bell-btn { position:relative; width:42px; height:42px; border-radius:999px; border:1px solid #3a3b44; background:#2a2b32; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0; }
.icon-bell-btn svg { width:20px; height:20px; stroke:currentColor; fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.icon-bell-badge { position:absolute; top:-4px; right:-4px; min-width:18px; height:18px; padding:0 5px; border-radius:999px; background:#ef4444; color:#fff; font-size:11px; display:none; align-items:center; justify-content:center; font-weight:700; }
.icon-bell-badge.visible { display:flex; }

.layout { display:grid; grid-template-columns:275px 600px 350px; justify-content:center; min-height:calc(100vh - 72px); background:var(--app-bg); }
.sidebar { background:#17181c; border-right:1px solid #2b2d31; padding:20px 14px; position:sticky; top:72px; height:calc(100vh - 72px); overflow-y:auto; }
.nav-item { color:var(--text); font-size:15px; font-weight:600; border-radius:12px; padding:14px; margin-bottom:8px; cursor:pointer; transition:0.2s ease; border:1px solid transparent; user-select:none; }
.nav-item:hover, .nav-item.active { background:#2a2b32; border-color:#343541; }
.post-btn { width:100%; margin-top:10px; font-size:15px; padding:14px; border:none; }

.main-content { background:var(--content-bg); padding:0; min-width:0; }
.main-content .page { width:600px; max-width:600px; margin:0 auto; border-left:1px solid #2f3138; border-right:1px solid #2f3138; min-height:calc(100vh - 72px); display:none; padding-bottom:40px; }
.main-content .page.active { display:block; }

.page-title { font-size:28px; font-weight:700; margin-bottom:6px; letter-spacing:-0.03em; padding:24px 20px 0; color:var(--text); }
.page-subtitle { font-size:15px; color:var(--muted); margin-bottom:20px; padding:0 20px; }

.feed-grid { display:flex; flex-direction:column; gap:0; }
.card { background:var(--panel-2); border:1px solid var(--border); padding:16px; color:var(--text); width:100%; border-radius:0; border-left:none; border-right:none; border-top:none; margin:0; }
.card:first-child { border-top:1px solid var(--border); }
.hero-card { background:var(--panel-2); border:1px solid var(--border); border-radius:var(--radius-xl); padding:20px; margin:20px; }
.hero-card h2 { font-size:22px; margin-bottom:8px; color:var(--text); }
.hero-card p, .card p, .profile-bio, .notification-text, .muted { font-size:15px; line-height:1.5; color:var(--muted); word-break:break-word; white-space:pre-wrap; }

.post-header { display:flex; gap:12px; align-items:flex-start; }
.avatar { width:48px; height:48px; border-radius:50%; background:#565869; color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:18px; flex-shrink:0; overflow:hidden; cursor:pointer; }
.avatar img { width:100%; height:100%; object-fit:cover; display:block; }
.post-name { font-size:15px; font-weight:700; color:var(--text); }
.post-handle, .post-meta { font-size:13px; color:var(--muted); margin-top:2px; }
.post-content { margin-top:10px; line-height:1.6; color:#e2e5ec; white-space:pre-wrap; word-break:break-word; font-size:15px; }
.post-image { width:100%; max-height:300px; object-fit:cover; border-radius:14px; margin:12px 0; border:1px solid var(--border); background:#2f3138; }
.post-meta { font-size:13px; color:var(--muted); margin-top:8px; }

.post-actions { display:flex; align-items:center; justify-content:space-between; gap:6px; margin-top:12px; padding:8px 0 0; border-top:1px solid var(--border); }
.post-actions-left, .post-actions-right { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
.action-icon-btn { min-width:44px; display:inline-flex; align-items:center; justify-content:center; gap:8px; background:var(--pill); color:var(--text); border:1px solid var(--border); padding:9px 12px; border-radius:999px; cursor:pointer; font-size:13px; font-weight:700; transition:.18s ease; }
.action-icon-btn:hover { background:#4a4b57; border-color:#5b5e6d; }
.action-icon-btn:disabled { opacity:0.55; cursor:not-allowed; }
.action-icon { width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; }
.action-icon svg { width:20px; height:20px; stroke:currentColor; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.action-count { font-size:13px; font-weight:700; line-height:1; min-width:10px; }

.reply-box { margin-top:14px; border-top:1px solid var(--border); padding-top:14px; }
.reply-box.collapsed { display:none; }
.reply-title { font-size:14px; font-weight:700; color:var(--text); margin-bottom:10px; }
.reply-list { display:flex; flex-direction:column; gap:10px; margin-bottom:12px; }
.reply-item { background:#383944; border:1px solid #4a4b53; border-radius:14px; padding:12px; }
.reply-author { font-size:13px; font-weight:700; color:var(--text); margin-bottom:4px; }
.reply-text { font-size:14px; color:#e2e5ec; white-space:pre-wrap; word-break:break-word; }
.reply-time { margin-top:6px; font-size:12px; color:var(--muted); }
.reply-form { display:flex; flex-direction:column; gap:10px; }
.reply-form textarea, .form-group input, .form-group textarea, .form-group select {
  width:100%; background:#2a2b32; color:var(--text); border:1px solid #45475a; border-radius:12px; padding:12px 14px; font-size:14px; outline:none; resize:vertical;
}
.reply-form textarea { min-height:80px; }
input::placeholder, textarea::placeholder { color:var(--soft); }
.reply-submit-btn { align-self:flex-end; padding:10px 18px; border:none; }
.reply-item-actions { margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; }
.reply-inline-btn { background:#d0d0d0; color:#222; border:none; border-radius:10px; padding:6px 10px; cursor:pointer; font-size:12px; font-weight:700; }

.post-card-shell { position:relative; }
.post-menu { position:absolute; right:18px; top:74px; min-width:230px; background:#f4f4f4; border:1px solid #cccccc; border-radius:16px; box-shadow:0 16px 40px rgba(0,0,0,0.16); padding:8px; display:none; z-index:30; }
.post-menu.active { display:block; }
.post-menu-item { width:100%; border:none; background:transparent; text-align:left; padding:12px 14px; border-radius:12px; cursor:pointer; font-size:14px; font-weight:700; color:#2b2b2b; display:flex; justify-content:space-between; align-items:center; gap:10px; }
.post-menu-item:hover { background:#e7e7e7; }
.post-menu-item.danger { color:#b42318; }
.post-menu-item small { display:block; color:#666; font-size:11px; font-weight:500; margin-top:4px; }
.post-menu-item[disabled] { opacity:0.55; cursor:not-allowed; }

.tag-suggestions { display:none; position:absolute; left:0; right:0; top:calc(100% + 8px); background:#f3f3f3; border:1px solid #c7c7c7; border-radius:14px; box-shadow:0 10px 28px rgba(0,0,0,0.08); z-index:25; max-height:220px; overflow-y:auto; }
.tag-suggestions.active { display:block; }
.tag-suggestion-item { padding:10px 14px; cursor:pointer; border-bottom:1px solid #dddddd; display:flex; justify-content:space-between; gap:10px; align-items:center; }
.tag-suggestion-item:last-child { border-bottom:none; }
.tag-suggestion-item:hover { background:#e7e7e7; }
.tag-suggestion-label { font-weight:700; color:#1f1f1f; }
.tag-suggestion-meta { font-size:12px; color:#666; }

.composer-wrap { position:relative; }
.composer-top-row { display:flex; gap:14px; align-items:flex-start; }
.composer-textarea { flex:1; background:transparent; border:none; color:var(--text); font-size:16px; resize:none; outline:none; min-height:120px; }
.composer-tools-bar { display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:12px; border-top:1px solid var(--border); }
.composer-tool-btn { border:1px solid var(--border); background:var(--pill); color:var(--text); border-radius:999px; padding:8px 14px; font-weight:700; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:8px; }
.composer-tool-btn:hover { background:#4a4b57; }
.composer-tool-btn svg { width:18px; height:18px; stroke:currentColor; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }

.drafts-wrap { display:grid; gap:10px; margin:8px 0 12px; }
.draft-item { border:1px solid #d7dbe2; background:#fbfbfc; border-radius:16px; padding:12px 14px; display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
.draft-item-main { flex:1; min-width:0; }
.draft-item-title { font-weight:700; margin-bottom:4px; color:#1f1f1f; }
.draft-item-preview { color:#5b6470; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.draft-item-actions { display:flex; gap:8px; flex-wrap:wrap; }
.draft-chip-btn { border:1px solid #d3d7de; background:#fff; border-radius:999px; padding:7px 10px; cursor:pointer; font-size:12px; font-weight:700; color:#222; }

.poll-box { margin-top:14px; border:1px solid #cfd4dc; border-radius:18px; padding:14px; background:#f4f5f7; }
.poll-title { font-weight:700; margin-bottom:10px; font-size:15px; color:#1f1f1f; }
.poll-options { display:grid; gap:10px; }
.poll-option-btn { width:100%; text-align:left; border:1px solid #d1d6de; background:#ffffff; border-radius:999px; padding:12px 14px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:12px; transition:0.2s ease; }
.poll-option-btn:hover { transform:translateY(-1px); background:#f9fafb; }
.poll-option-btn.selected { border-color:#7a8797; background:#edf2f8; }
.poll-option-btn:disabled { opacity:1; cursor:default; }
.poll-option-label { font-weight:600; color:#1f1f1f; }
.poll-option-meta { font-size:13px; color:#606b79; white-space:nowrap; }
.poll-footer { margin-top:10px; font-size:13px; color:#1f1f1f; }

.right-sidebar { background:#17181c; border-left:1px solid #2b2d31; padding:20px 14px; position:sticky; top:72px; height:calc(100vh - 72px); overflow-y:auto; }
.right-sidebar-card { border:1px solid #343541; border-radius:18px; background:#202123; padding:18px; margin-bottom:16px; }
.right-sidebar-title { font-size:18px; font-weight:700; color:var(--text); margin-bottom:12px; }
.right-sidebar-subtitle { color:#b9bcc5; font-size:13px; margin-top:4px; }
.right-sidebar-tabs { display:flex; gap:10px; margin-bottom:14px; }
.right-sidebar-tab { flex:1; border:none; border-radius:12px; padding:11px 12px; background:#1f2028; color:#f1f1f1; font-size:14px; font-weight:700; cursor:pointer; }
.right-sidebar-tab.active { background:#343541; }
.trending-item { padding:10px 0; border-bottom:1px solid #2b2d31; cursor:pointer; }
.trending-item:last-child { border-bottom:none; }
.trending-category { font-size:12px; color:var(--muted); margin-bottom:2px; }
.trending-topic { font-size:14px; font-weight:700; color:var(--text); margin-bottom:2px; }
.trending-count { font-size:12px; color:var(--muted); }
.following-rail-item { display:flex; gap:12px; align-items:flex-start; padding:12px; border-radius:14px; cursor:pointer; transition:background 0.2s ease; }
.following-rail-item:hover { background:rgba(0,0,0,0.06); }
.following-rail-body { min-width:0; flex:1; }
.following-rail-name-row { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
.following-rail-name { font-weight:700; color:#f1f1f1; }
.following-rail-preview { color:#b9bcc5; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.following-rail-time { color:#b9bcc5; font-size:12px; margin-top:6px; }
.rail-blue-dot { width:10px; height:10px; border-radius:999px; background:#2563eb; flex:0 0 10px; }
.right-sidebar-empty { color:#b9bcc5; font-size:13px; text-align:center; padding:20px 0; }

.profile-header { background:var(--panel-2); border:1px solid var(--border); border-radius:18px; padding:20px; margin:20px; }
.profile-banner { height:140px; background:linear-gradient(135deg, #2f3037 0%, #202123 100%); border-radius:14px; margin:-20px -20px 20px; border-bottom:1px solid rgba(255,255,255,0.06); }
.profile-top-row { display:flex; justify-content:space-between; align-items:flex-end; gap:18px; flex-wrap:wrap; margin-top:-40px; position:relative; }
.profile-avatar-xl { width:100px; height:100px; font-size:32px; border:4px solid var(--panel-2); box-shadow:0 10px 30px rgba(0,0,0,0.24); }
.profile-name-row { display:flex; align-items:center; gap:8px; margin-top:12px; }
.profile-name { font-size:20px; font-weight:700; color:var(--text); }
.profile-handle { font-size:14px; color:var(--muted); }
.profile-bio { margin-top:10px; }
.profile-stats { display:flex; gap:20px; margin-top:16px; }
.profile-stat { display:flex; gap:6px; align-items:center; font-size:14px; color:var(--muted); }
.profile-stat strong { color:var(--text); font-weight:700; }
.profile-action-row { display:flex; gap:10px; margin-top:16px; }
.profile-cta { background:var(--accent); color:#fff; border:none; border-radius:999px; padding:11px 16px; font-size:14px; font-weight:700; cursor:pointer; }
.profile-cta:hover { background:var(--accent-hover); }
.profile-secondary-btn { background:rgba(255,255,255,0.04); color:var(--text); border:1px solid var(--border); border-radius:999px; padding:11px 16px; font-size:14px; font-weight:700; cursor:pointer; }
.profile-secondary-btn:hover { background:rgba(255,255,255,0.08); border-color:#5b5e6d; }
.profile-meta-row { display:flex; flex-wrap:wrap; gap:10px; margin-top:12px; }
.profile-meta-pill { display:inline-flex; align-items:center; gap:8px; padding:9px 12px; border-radius:999px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); color:var(--text); font-size:13px; font-weight:600; }
.profile-badge { display:inline-flex; align-items:center; gap:8px; padding:9px 12px; border-radius:999px; background:rgba(16,163,127,0.18); border-color:rgba(16,163,127,0.28); color:var(--text); font-size:13px; font-weight:600; }
.profile-list { display:flex; flex-direction:column; gap:10px; color:var(--muted); font-size:14px; }
.profile-list strong { color:var(--text); display:block; margin-bottom:2px; }
.profile-link-list { display:flex; flex-wrap:wrap; gap:10px; margin-top:10px; }
.profile-link-chip { display:inline-flex; align-items:center; gap:8px; padding:10px 12px; border-radius:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.07); color:var(--text); font-size:13px; font-weight:700; text-decoration:none; }
.display-name-wrap { display:inline-flex; align-items:center; flex-wrap:wrap; }
.verified-badge { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:999px; margin-left:6px; font-size:11px; vertical-align:middle; background:#1d9bf0; color:#fff; }
.preverified-badge { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:999px; margin-left:6px; font-size:11px; vertical-align:middle; background:#64748b; color:#fff; }

.settings-grid { display:grid; grid-template-columns:260px minmax(0,1fr); gap:20px; padding:20px; }
.settings-sidebar-panel { position:sticky; top:90px; }
.settings-nav-item { width:100%; border:1px solid var(--border); background:var(--panel); border-radius:14px; padding:14px 16px; font-size:15px; font-weight:700; color:var(--text); cursor:pointer; text-align:left; margin-bottom:8px; transition:.18s ease; }
.settings-nav-item:hover { background:#3a3b44; }
.settings-nav-item.active { background:var(--accent); color:#fff; border-color:var(--accent); }
.settings-panel { background:var(--panel-2); border:1px solid var(--border); border-radius:18px; padding:20px; }
.settings-panel h3 { font-size:22px; margin-bottom:16px; color:var(--text); }
.settings-option { background:var(--panel); border:1px solid var(--border); border-radius:16px; padding:16px; margin-bottom:14px; }
.settings-option h4 { font-size:16px; margin-bottom:6px; color:var(--text); }
.settings-option small { display:block; color:var(--muted); font-size:13px; margin-top:6px; }
.settings-kicker { color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.08em; font-weight:700; margin-bottom:10px; }
.settings-select-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.settings-section-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.settings-helper { margin-top:8px; color:var(--muted); font-size:13px; }
.inline-toggle-row { display:flex; gap:10px; flex-wrap:wrap; margin-top:10px; }
.toggle-chip { display:inline-flex; align-items:center; gap:8px; background:#efefef; border:1px solid #c8c8c8; border-radius:999px; padding:8px 12px; font-size:14px; color:#333; }
.toggle-chip input { width:auto; transform:scale(1.05); }
.accent-chip-row { display:flex; flex-wrap:wrap; gap:10px; margin-top:10px; }
.accent-chip { width:34px; height:34px; border-radius:999px; border:2px solid rgba(255,255,255,0.14); cursor:pointer; position:relative; }
.accent-chip.active::after { content:''; position:absolute; inset:7px; border-radius:999px; border:2px solid rgba(255,255,255,0.92); }
.appearance-preview { border:1px solid var(--border); border-radius:18px; padding:14px; background:rgba(255,255,255,0.04); margin-top:10px; }
.appearance-preview-bar { height:9px; width:42%; border-radius:999px; background:var(--accent); margin-bottom:12px; }
.appearance-preview-card { border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:12px; background:rgba(255,255,255,0.03); }

.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); display:none; align-items:center; justify-content:center; z-index:1000; padding:20px; }
.modal-overlay.active { display:flex; }
.modal { width:100%; max-width:460px; background:#202123; border-radius:18px; padding:24px; box-shadow:var(--shadow); position:relative; border:1px solid var(--border); }
.modal h2 { font-size:24px; margin-bottom:10px; color:var(--text); }
.modal p { color:var(--muted); margin-bottom:20px; font-size:14px; }
.close-btn { position:absolute; top:14px; right:16px; background:none; border:none; font-size:24px; color:var(--muted); cursor:pointer; }
.form-group { margin-bottom:14px; }
.form-group label { display:block; margin-bottom:8px; font-size:14px; font-weight:600; color:var(--text); }
.form-group input, .form-group textarea, .form-group select { width:100%; background:#2a2b32; color:var(--text); border:1px solid #45475a; border-radius:12px; padding:12px 14px; font-size:14px; outline:none; }
.form-group input { height:46px; }
.form-group textarea { min-height:100px; resize:vertical; }
.submit-btn { width:100%; height:48px; border:none; border-radius:12px; font-size:16px; font-weight:700; cursor:pointer; margin-top:8px; background:var(--accent); color:#fff; }
.submit-btn:hover { background:var(--accent-hover); }
.switch-text { text-align:center; margin-top:16px; font-size:14px; color:var(--muted); }
.switch-text button { background:none; border:none; color:#7db4ff; font-weight:700; cursor:pointer; margin-left:4px; }
.status-text { font-size:14px; color:var(--muted); margin-top:10px; min-height:20px; }
.status-text.error { color:var(--danger); }
.status-text.success { color:var(--accent); }
.login-helper-row { display:flex; justify-content:flex-end; margin:-4px 0 12px; }
.forgot-password-btn { background:none; border:none; color:#7db4ff; font-size:13px; font-weight:700; cursor:pointer; padding:0; }
.forgot-password-btn:hover { text-decoration:underline; }
.post-modal { max-width:560px; }

.empty-message { text-align:center; padding:60px 20px; color:var(--muted); font-size:15px; }
.notification-item { display:flex; gap:12px; align-items:flex-start; padding:12px; border-radius:12px; background:#383944; border:1px solid #4a4b53; margin-bottom:12px; }
.notification-avatar { width:38px; height:38px; border-radius:999px; background:#565869; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex-shrink:0; }
.notification-text { color:var(--text); font-size:14px; line-height:1.4; }
.notification-time { color:var(--muted); font-size:12px; margin-top:4px; }

.chip-row { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:18px; padding:0 20px; }
.chip { background:var(--pill); color:var(--text); font-weight:700; padding:10px 14px; border-radius:999px; border:1px solid var(--border); cursor:pointer; font-size:13px; }
.chip.active { background:var(--accent); color:#fff; border-color:var(--accent); }
.chip:hover { background:#4a4b57; }

.hashtag-link { color:#7db4ff; font-weight:700; cursor:pointer; text-decoration:none; }
.hashtag-link:hover { text-decoration:underline; }
.mention-link { color:#d1d5db; font-weight:700; cursor:pointer; text-decoration:none; }
.mention-link:hover { text-decoration:underline; }

.people-results-grid, .hashtag-results-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-bottom:18px; padding:0 20px; }
.person-result-card, .hashtag-result-card { background:var(--panel-2); border:1px solid var(--border); border-radius:18px; padding:16px; }
.person-result-card { display:flex; align-items:center; gap:14px; }
.person-result-body { min-width:0; flex:1; }
.person-result-name { font-size:16px; font-weight:700; color:#f9fafb; margin-bottom:4px; }
.person-result-handle { font-size:13px; color:#9ca3af; }
.hashtag-result-card { cursor:pointer; transition:0.18s ease; }
.hashtag-result-card:hover { transform:translateY(-1px); border-color:#7b8195; }
.hashtag-result-name { font-size:16px; font-weight:700; color:#f9fafb; margin-bottom:4px; }
.hashtag-result-meta { font-size:13px; color:#9ca3af; }

.search-page-meta { background:var(--panel-2); border:1px solid var(--border); color:#e5e7eb; border-radius:18px; padding:16px 18px; margin:0 20px 18px; }

.post-jump-highlight { box-shadow:0 0 0 2px rgba(37,99,235,0.55), 0 0 0 8px rgba(37,99,235,0.12); transition:box-shadow .25s ease; }

.hidden { display:none !important; }

@media(max-width:1280px) {
  .layout { grid-template-columns:88px 600px 320px; }
  .brand { display:none; }
  .sidebar .nav-item { text-align:center; padding-left:8px; padding-right:8px; font-size:13px; }
  .sidebar .post-btn { padding-left:8px; padding-right:8px; font-size:13px; }
}
@media(max-width:1024px) {
  .layout { grid-template-columns:88px 600px; }
  .right-sidebar { display:none; }
}
@media(max-width:700px) {
  .layout { grid-template-columns:1fr; }
  .sidebar { position:static; height:auto; border-right:none; border-bottom:1px solid #2b2d31; display:flex; flex-wrap:wrap; gap:8px; padding:10px; }
  .sidebar .nav-item { margin-bottom:0; flex:1; min-width:100px; text-align:center; }
  .sidebar .post-btn { width:auto; margin-top:0; }
  .main-content .page { width:100%; max-width:100%; border-left:none; border-right:none; }
  .topbar { gap:12px; }
  .search-box { order:3; width:100%; max-width:100%; margin:8px 0 0; }
  .settings-grid { grid-template-columns:1fr; }
  .settings-sidebar-panel { position:static; }
  .people-results-grid, .hashtag-results-grid { grid-template-columns:1fr; }
}
</style>
<base target="_blank">
</head>
<body class="theme-dark">
<script>
  window.RANDOM_SUPABASE_URL = "https://stjupyawilpcojibfldp.supabase.co";
  window.RANDOM_SUPABASE_ANON_KEY = "sb_publishable_n9clw1rkeiAQRKffFI5bWg_QyQZe8jz";
</script>

<!-- Topbar -->
<header class="topbar">
  <div class="brand" onclick="showPage('home')">Random</div>
  <div class="search-box">
    <input type="text" id="globalSearch" placeholder="Search people, posts, or #hashtags" autocomplete="off" />
    <div id="globalSearchDropdown" class="search-dropdown"></div>
  </div>
  <div class="top-actions">
    <button class="login-btn" id="loginOpenBtn">Login</button>
    <button class="register-btn" id="registerOpenBtn">Register</button>
    <div class="notifications-anchor" id="notificationsAnchor">
      <button class="icon-bell-btn" id="notificationsBellBtn" aria-label="Notifications">
        <svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
      </button>
      <div class="icon-bell-badge" id="notificationsBellBadge">0</div>
      <div class="notifications-dropdown" id="notificationsDropdown">
        <div class="notifications-dropdown-header">Notifications</div>
        <div id="notificationsDropdownList"></div>
      </div>
    </div>
    <button class="logout-btn" id="logoutBtn">Logout</button>
  </div>
</header>

<!-- Layout -->
<div class="layout">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="nav-item active" data-page="home">🏠 Home</div>
    <div class="nav-item" data-page="explore">🔍 Explore</div>
    <div class="nav-item" data-page="following">👥 Following</div>
    <div class="nav-item" data-page="profile">👤 Profile</div>
    <div class="nav-item" data-page="notifications">🔔 Notifications</div>
    <div class="nav-item" data-page="settings">⚙️ Settings</div>
    <button class="post-btn" id="postBtn">Post</button>
  </aside>

  <!-- Main Content -->
  <main class="main-content">
    <!-- Home Page -->
    <div class="page active" id="home">
      <div class="page-title">Home</div>
      <div class="page-subtitle">Your personal feed</div>
      <div class="feed-grid" id="postsContainer"></div>
    </div>

    <!-- Explore Page -->
    <div class="page" id="explore">
      <div class="page-title">Explore</div>
      <div class="page-subtitle">Discover new posts and people</div>
      <div class="chip-row">
        <button class="chip active" onclick="setExploreFilter('all',this)">All</button>
        <button class="chip" onclick="setExploreFilter('trending',this)">Trending</button>
        <button class="chip" onclick="setExploreFilter('technology',this)">Technology</button>
        <button class="chip" onclick="setExploreFilter('news',this)">News</button>
        <button class="chip" onclick="setExploreFilter('entertainment',this)">Entertainment</button>
      </div>
      <div class="search-page-meta" id="exploreSearchMeta" style="display:none;"></div>
      <div class="people-results-grid" id="peopleSearchContainer" style="display:none;"></div>
      <div class="hashtag-results-grid" id="hashtagSearchContainer" style="display:none;"></div>
      <div class="feed-grid" id="exploreContainer"></div>
    </div>

    <!-- Following Page -->
    <div class="page" id="following">
      <div class="page-title">Following</div>
      <div class="page-subtitle">Posts from people you follow</div>
      <div class="feed-grid" id="followingContainer">
        <div class="empty-message">Follow people to see their posts here</div>
      </div>
    </div>

    <!-- Profile Page -->
    <div class="page" id="profile">
      <div class="profile-header">
        <div class="profile-banner"></div>
        <div class="profile-top-row">
          <div class="avatar profile-avatar-xl" id="profileAvatar">?</div>
          <div class="profile-action-row">
            <button class="profile-cta" onclick="editProfile()">Edit Profile</button>
            <button class="profile-secondary-btn" onclick="openSettingsPageFromProfile()">Settings</button>
          </div>
        </div>
        <div class="profile-name-row">
          <div class="profile-name" id="profileName">Guest User</div>
        </div>
        <div class="profile-handle" id="profileHandle">@guest</div>
        <div class="profile-bio" id="profileBio">Welcome to Random! Sign in to customize your profile.</div>
        <div class="profile-headline" id="profileHeadline" style="font-size:15px;color:var(--muted);margin-top:8px;"></div>
        <div class="profile-meta-row" id="profileMetaRow"></div>
        <div class="profile-badge" id="profileBadge" style="display:inline-flex;margin-top:10px;"></div>
        <div class="profile-stats">
          <div class="profile-stat"><strong id="profilePostCount">0</strong> Posts</div>
          <div class="profile-stat"><strong id="profileFollowingCount">0</strong> Following</div>
          <div class="profile-stat"><strong id="profileFollowerCount">0</strong> Followers</div>
          <div class="profile-stat"><strong id="profilePinnedCount">0</strong> Pinned</div>
        </div>
      </div>
      <div style="padding:0 20px;">
        <div class="profile-panel" style="background:var(--panel-2);border:1px solid var(--border);border-radius:20px;padding:18px;margin-bottom:16px;">
          <h3 style="font-size:18px;margin-bottom:10px;color:var(--text);">About</h3>
          <div class="profile-list" id="profileAboutList"></div>
        </div>
        <div class="profile-panel" style="background:var(--panel-2);border:1px solid var(--border);border-radius:20px;padding:18px;margin-bottom:16px;">
          <h3 style="font-size:18px;margin-bottom:10px;color:var(--text);">Links</h3>
          <div class="profile-link-list" id="profileLinks"></div>
        </div>
      </div>
      <div class="feed-grid" id="profileContent"></div>
    </div>

    <!-- Notifications Page -->
    <div class="page" id="notifications">
      <div class="page-title">Notifications</div>
      <div class="page-subtitle">Your recent activity</div>
      <div class="feed-grid" id="notificationsContainer">
        <div class="empty-message">No notifications yet</div>
      </div>
    </div>

    <!-- Settings Page -->
    <div class="page" id="settings">
      <div class="page-title">Settings</div>
      <div class="settings-grid">
        <div class="settings-sidebar-panel">
          <input type="text" id="settingsSearch" class="settings-search" placeholder="Search settings..." oninput="filterSettingsMenu()" />
          <div class="settings-nav-list">
            <div class="settings-nav-item active" data-settings-section="account" onclick="setSettingsSection('account',this)">Account</div>
            <div class="settings-nav-item" data-settings-section="appearance" onclick="setSettingsSection('appearance',this)">Appearance</div>
            <div class="settings-nav-item" data-settings-section="security" onclick="setSettingsSection('security',this)">Security</div>
            <div class="settings-nav-item" data-settings-section="privacy" onclick="setSettingsSection('privacy',this)">Privacy</div>
            <div class="settings-nav-item" data-settings-section="notifications" onclick="setSettingsSection('notifications',this)">Notifications</div>
            <div class="settings-nav-item" data-settings-section="creator" onclick="setSettingsSection('creator',this)">Creator Tools</div>
            <div class="settings-nav-item" data-settings-section="accessibility" onclick="setSettingsSection('accessibility',this)">Accessibility</div>
          </div>
        </div>
        <div id="settingsDetailPanel"><div class="status-text" id="settingsStatus"></div></div>
      </div>
    </div>
  </main>

  <!-- Right Sidebar -->
  <aside class="right-sidebar">
    <div class="right-sidebar-card">
      <div class="right-sidebar-title">Trending</div>
      <div id="trendingList">
        <div class="trending-item">
          <div class="trending-category">Technology · Trending</div>
          <div class="trending-topic">#WebDev</div>
          <div class="trending-count">12.5K posts</div>
        </div>
        <div class="trending-item">
          <div class="trending-category">Entertainment · Trending</div>
          <div class="trending-topic">#RandomChat</div>
          <div class="trending-count">8.2K posts</div>
        </div>
        <div class="trending-item">
          <div class="trending-category">News · Trending</div>
          <div class="trending-topic">#Supabase</div>
          <div class="trending-count">5.1K posts</div>
        </div>
      </div>
    </div>

    <div class="right-sidebar-card">
      <div class="right-sidebar-title">Who to follow</div>
      <div id="whoToFollow">
        <div class="trending-item" style="display:flex;align-items:center;gap:10px;">
          <div class="avatar" style="width:36px;height:36px;font-size:14px;">A</div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:14px;">Alice</div>
            <div style="font-size:12px;color:var(--muted);">@alice</div>
          </div>
          <button class="follow-btn" style="padding:6px 12px;font-size:12px;" onclick="alert('Login to follow')">Follow</button>
        </div>
        <div class="trending-item" style="display:flex;align-items:center;gap:10px;">
          <div class="avatar" style="width:36px;height:36px;font-size:14px;">B</div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:14px;">Bob</div>
            <div style="font-size:12px;color:var(--muted);">@bob</div>
          </div>
          <button class="follow-btn" style="padding:6px 12px;font-size:12px;" onclick="alert('Login to follow')">Follow</button>
        </div>
      </div>
    </div>

    <div class="right-sidebar-card">
      <div class="right-sidebar-header" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;">
        <div>
          <div class="right-sidebar-title">Following</div>
          <div class="right-sidebar-subtitle">New posts from people you follow</div>
        </div>
      </div>
      <div class="right-sidebar-tabs">
        <button class="right-sidebar-tab active" onclick="setFollowingRailTab('all',this)">All</button>
        <button class="right-sidebar-tab" onclick="setFollowingRailTab('new',this)">New</button>
      </div>
      <div id="followingRightRail">
        <div class="right-sidebar-empty">Login to see who you follow and when they post.</div>
      </div>
    </div>
  </aside>
</div>

<!-- Login Modal -->
<div class="modal-overlay" id="loginModal">
  <div class="modal">
    <button class="close-btn" onclick="closeModal('loginModal')">&times;</button>
    <h2>Welcome back</h2>
    <p>Sign in to your Random account</p>
    <form id="loginForm">
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="loginEmail" placeholder="you@example.com" required />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="loginPassword" placeholder="••••••••" required />
      </div>
      <div class="login-helper-row">
        <button type="button" class="forgot-password-btn" id="forgotPasswordBtn">Forgot password?</button>
      </div>
      <button type="submit" class="submit-btn">Sign In</button>
      <div class="status-text" id="loginStatus"></div>
    </form>
    <div class="switch-text">
      Don't have an account? <button type="button" onclick="switchModal('loginModal','registerModal')">Sign up</button>
    </div>
  </div>
</div>

<!-- Register Modal -->
<div class="modal-overlay" id="registerModal">
  <div class="modal">
    <button class="close-btn" onclick="closeModal('registerModal')">&times;</button>
    <h2>Create account</h2>
    <p>Join the Random community today</p>
    <form id="registerForm">
      <div class="form-group">
        <label>Username</label>
        <input type="text" id="registerUsername" placeholder="Your username" required />
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="registerEmail" placeholder="you@example.com" required />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="registerPassword" placeholder="Min 6 characters" required />
      </div>
      <div class="form-group">
        <label>Confirm Password</label>
        <input type="password" id="registerConfirmPassword" placeholder="Repeat password" required />
      </div>
      <button type="submit" class="submit-btn">Sign Up</button>
      <div class="status-text" id="registerStatus"></div>
    </form>
    <div class="switch-text">
      Already have an account? <button type="button" onclick="switchModal('registerModal','loginModal')">Sign in</button>
    </div>
  </div>
</div>

<!-- Post Modal -->
<div class="modal-overlay" id="postModal">
  <div class="modal post-modal">
    <button class="close-btn" onclick="closeModal('postModal')">&times;</button>
    <h2 id="postModalTitle">Create Post</h2>
    <form id="postForm">
      <div class="composer-wrap">
        <div class="composer-top-row">
          <div class="avatar" id="composerAvatar">?</div>
          <textarea class="composer-textarea" id="postContent" placeholder="What's happening?"></textarea>
        </div>
        <div id="postTagSuggestions" class="tag-suggestions"></div>
        <div class="drafts-wrap" id="draftsWrap"></div>
        <div class="composer-tools-bar">
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="composer-tool-btn" onclick="document.getElementById('postImage').click()">📷 Image</button>
            <button type="button" class="composer-tool-btn" onclick="insertPollTemplate()">📊 Poll</button>
            <button type="button" class="composer-tool-btn" onclick="saveComposerDraft()">💾 Save Draft</button>
            <button type="button" class="composer-tool-btn" id="notifyFollowersBtn" onclick="toggleNotifyFollowers()">🔔 Notify followers</button>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <select id="postReplyPermission" style="background:#2a2b32;color:var(--text);border:1px solid #45475a;border-radius:12px;padding:8px 12px;font-size:13px;">
              <option value="everyone">Everyone can reply</option>
              <option value="following">People you follow</option>
              <option value="mentioned">Only mentioned</option>
            </select>
            <button type="submit" class="post-btn" id="postSubmitBtn">Publish Post</button>
          </div>
        </div>
        <input type="file" id="postImage" accept="image/*,video/*" class="hidden" />
      </div>
      <div class="status-text" id="postStatus"></div>
    </form>
  </div>
</div>

<script>

// ========================
// Missing helpers / stubs expected by the pasted logic
// ========================
function getComposerMediaPayload(file, opts) {
  return new Promise(async (resolve) => {
    let imageUrl = opts && opts.imageUrl ? opts.imageUrl : '';
    let mediaType = opts && opts.mediaType ? opts.mediaType : '';
    let expiresAt = opts && opts.expiresAt ? opts.expiresAt : null;
    let mediaDurationSeconds = opts && opts.mediaDurationSeconds ? opts.mediaDurationSeconds : null;
    if (file) {
      const dataUrl = await fileToBase64(file);
      imageUrl = dataUrl;
      mediaType = file.type && file.type.startsWith('video') ? 'video' : 'image';
      if (mediaType === 'video') {
        expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h expiry for demo
      }
    }
    resolve({ imageUrl, mediaType, expiresAt, mediaDurationSeconds });
  });
}

function renderPostMedia(post) {
  if (!post || !post.imageUrl) return '';
  if (post.mediaType === 'video') {
    return `<video src="${post.imageUrl}" class="post-image" controls preload="metadata" style="max-height:300px;width:100%;border-radius:14px;margin:12px 0;border:1px solid var(--border);background:#2f3138;"></video>`;
  }
  return `<img class="post-image" src="${post.imageUrl}" alt="Post image">`;
}

function getVideoExpiryText(post) {
  if (!post || post.mediaType !== 'video' || !post.expiresAt) return '';
  const remaining = Math.max(0, Math.floor((post.expiresAt - Date.now()) / 1000));
  if (remaining <= 0) return ' · Expired';
  const hrs = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  return ` · Expires in ${hrs}h ${mins}m`;
}



    let currentUser = null;
    let editingPostId = null;
    let editingPostImageUrl = "";
    let editingPostMediaType = "";
    let editingPostExpiresAt = null;
    let editingPostMediaDurationSeconds = null;
    let exploreFilter = "all";
    let viewedProfileId = null;
    let activeSettingsSection = "account";
    let replyOpenState = {};
    let composerNotifyFollowers = true;

    const seededExploreTopics = []

    const BACKEND_CONFIG = {
      supabaseUrl: window.RANDOM_SUPABASE_URL || '',
      supabaseAnonKey: window.RANDOM_SUPABASE_ANON_KEY || ''
    };

    const hasBackend = Boolean(BACKEND_CONFIG.supabaseUrl && BACKEND_CONFIG.supabaseAnonKey && window.supabase);
    const supabaseClient = hasBackend ? window.supabase.createClient(BACKEND_CONFIG.supabaseUrl, BACKEND_CONFIG.supabaseAnonKey) : null;
    let backendReady = false;

    function getUsers() {
      return JSON.parse(localStorage.getItem("random_users")) || [];
    }

    function stripUserForBackend(user) {
      if (!user) return user;
      const safeUser = { ...user };
      delete safeUser.password;
      delete safeUser.localPassword;
      return safeUser;
    }

    async function pushUsersToBackend(users) {
      if (!supabaseClient || !backendReady) return;
      const payload = users.map(user => ({
        id: String(user.id),
        auth_user_id: user.authUserId || null,
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        avatar_url: user.avatarUrl || '',
        following: user.following || [],
        notifications: user.notifications || [],
        bookmarks: user.bookmarks || [],
        settings: user.settings || getUserSettingsData(user),
        profile_data: stripUserForBackend(user),
        updated_at: new Date().toISOString()
      }));
      if (!payload.length) return;
      const { error } = await supabaseClient.from('profiles').upsert(payload, { onConflict: 'id' });
      if (error) console.error('profiles upsert failed', error);
    }

    function saveUsers(users) {
      localStorage.setItem("random_users", JSON.stringify(users));
      pushUsersToBackend(users);
    }

    function getPosts() {
      const posts = JSON.parse(localStorage.getItem("random_posts")) || [];
      return pruneExpiredVideoPosts(posts).filter(post => !post.system);
    }

    async function pushPostsToBackend(posts) {
      if (!supabaseClient || !backendReady) return;
      const payload = posts.filter(post => !post.system).map(post => ({
        id: String(post.id),
        user_id: String(post.userId),
        content: post.content || '',
        image_url: post.imageUrl || '',
        hashtags: post.hashtags || [],
        category: post.category || 'general',
        created_at_ms: Number(post.createdAt) || Date.now(),
        updated_at: new Date().toISOString(),
        post_data: post
      }));
      if (!payload.length) return;
      const { error } = await supabaseClient.from('posts').upsert(payload, { onConflict: 'id' });
      if (error) console.error('posts upsert failed', error);
    }

    async function deletePostsFromBackend(postIds) {
      if (!supabaseClient || !backendReady || !Array.isArray(postIds) || !postIds.length) return;
      const ids = postIds.map(id => String(id));
      const { error } = await supabaseClient.from('posts').delete().in('id', ids);
      if (error) console.error('posts delete failed', error);
    }

    function pruneExpiredVideoPosts(posts, persist = true) {
      const list = Array.isArray(posts) ? [...posts] : [];
      const now = Date.now();
      const expiredIds = list
        .filter(post => post && post.mediaType === 'video' && Number(post.expiresAt || 0) > 0 && Number(post.expiresAt) <= now)
        .map(post => post.id);
      if (!expiredIds.length) return list;
      const filtered = list.filter(post => !expiredIds.includes(post.id));
      if (persist) {
        localStorage.setItem('random_posts', JSON.stringify(filtered));
        deletePostsFromBackend(expiredIds);
      }
      return filtered;
    }

    function savePosts(posts) {
      const cleaned = pruneExpiredVideoPosts(posts, false);
      localStorage.setItem("random_posts", JSON.stringify(cleaned));
      pushPostsToBackend(cleaned);
    }

    function getCurrentUser() {
      return JSON.parse(localStorage.getItem("random_current_user"));
    }

    function saveCurrentUser(user) {
      localStorage.setItem("random_current_user", JSON.stringify(user));
    }

    async function signOutBackend() {
      if (!supabaseClient) return;
      await supabaseClient.auth.signOut();
    }

    function clearCurrentUser() {
      localStorage.removeItem("random_current_user");
      signOutBackend();
    }

    async function loadBackendState() {
      if (!supabaseClient) return;
      const [{ data: profileRows, error: usersError }, { data: postRows, error: postsError }] = await Promise.all([
        supabaseClient.from('profiles').select('*').order('updated_at', { ascending: false }),
        supabaseClient.from('posts').select('*').order('created_at_ms', { ascending: false })
      ]);
      if (usersError) console.error(usersError);
      if (postsError) console.error(postsError);
      if (Array.isArray(profileRows)) {
        const users = profileRows.map(row => {
          const base = row.profile_data || {};
          return {
            ...base,
            id: Number(row.id) || row.id,
            authUserId: row.auth_user_id || base.authUserId || null,
            username: row.username || base.username || '',
            email: row.email || base.email || '',
            bio: row.bio || base.bio || '',
            avatarUrl: row.avatar_url || base.avatarUrl || '',
            following: row.following || base.following || [],
            notifications: row.notifications || base.notifications || [],
            bookmarks: row.bookmarks || base.bookmarks || [],
            settings: row.settings || base.settings || getUserSettingsData(base)
          };
        });
        localStorage.setItem('random_users', JSON.stringify(users));
      }
      if (Array.isArray(postRows)) {
        const posts = postRows.map(row => ({ ...(row.post_data || {}), id: Number(row.id) || row.id, userId: Number(row.user_id) || row.user_id, imageUrl: row.image_url || (row.post_data || {}).imageUrl || '', mediaType: (row.post_data || {}).mediaType || ((row.image_url || '').startsWith('data:video') ? 'video' : ((row.image_url || (row.post_data || {}).imageUrl) ? 'image' : '')), expiresAt: (row.post_data || {}).expiresAt || null, mediaDurationSeconds: (row.post_data || {}).mediaDurationSeconds || null, hashtags: row.hashtags || (row.post_data || {}).hashtags || [], category: row.category || (row.post_data || {}).category || 'general', createdAt: Number(row.created_at_ms) || (row.post_data || {}).createdAt || Date.now() }));
        localStorage.setItem('random_posts', JSON.stringify(posts));
      }
      backendReady = true;
    }

    async function restoreBackendSession() {
      if (!supabaseClient) return;
      const { data, error } = await supabaseClient.auth.getUser();
      if (error || !data || !data.user) return;
      const authId = data.user.id;
      const users = getUsers();
      const match = users.find(user => user.authUserId === authId || user.email === data.user.email);
      if (match) {
        match.authUserId = authId;
        saveUsers(users);
        currentUser = { id: match.id, username: match.username, email: match.email, bio: match.bio || '', following: match.following || [], notifications: match.notifications || [], avatarUrl: match.avatarUrl || '', settings: match.settings || getUserSettingsData(match), authUserId: authId };
        saveCurrentUser(currentUser);
      }
    }

    function makeId() {
      return Date.now() + Math.floor(Math.random() * 100000);
    }

    function getUserRecord(userId) {
      return getUsers().find(user => user.id === userId) || null;
    }

    function syncCurrentUser() {
      if (!currentUser) return;
      const fresh = getUserRecord(currentUser.id);
      if (fresh) {
        currentUser = {
          id: fresh.id,
          username: fresh.username,
          email: fresh.email,
          bio: fresh.bio || "",
          following: fresh.following || [],
          notifications: fresh.notifications || [],
          avatarUrl: fresh.avatarUrl || "",
          bookmarks: fresh.bookmarks || [],
          settings: fresh.settings || getUserSettingsData(fresh),
          authUserId: fresh.authUserId || currentUser.authUserId || null
        };
        saveCurrentUser(currentUser);
      }
    }

    function updateUserRecord(userId, updater) {
      const users = getUsers();
      const index = users.findIndex(user => user.id === userId);
      if (index === -1) return null;
      users[index] = updater({ ...users[index] });
      saveUsers(users);
      return users[index];
    }

    function addNotification(userId, text, type = 'general') {
      updateUserRecord(userId, user => {
        const prefs = getUserSettingsData(user);
        if ((type === 'post' && !prefs.notifyPosts) || (type === 'follow' && !prefs.notifyFollows) || (type === 'reply' && !prefs.notifyReplies) || (type === 'like' && !prefs.notifyReplies)) {
          return user;
        }
        if (!Array.isArray(user.notifications)) user.notifications = [];
        user.notifications.unshift({ id: makeId(), text, createdAt: Date.now(), type });
        user.notifications = user.notifications.slice(0, 40);
        return user;
      });
    }

    function showPage(pageId, clickedItem) {
      if (pageId === "profile" && currentUser) {
        viewedProfileId = currentUser.id;
      }
      document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
      document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
      const targetPage = document.getElementById(pageId);
      if (targetPage) targetPage.classList.add("active");
      if (clickedItem) clickedItem.classList.add("active");
      renderAll();
    }

    function openModal(id) {
      document.getElementById(id).classList.add("active");
    }

    function closeModal(id) {
      document.getElementById(id).classList.remove("active");
      clearStatusMessages();
    }

    function switchModal(closeId, openId) {
      closeModal(closeId);
      openModal(openId);
    }

    function clearStatusMessages() {
      document.getElementById("loginStatus").textContent = "";
      document.getElementById("registerStatus").textContent = "";
      document.getElementById("postStatus").textContent = "";
      document.getElementById("settingsStatus").textContent = "";
    }

    function setStatus(id, text, isError = false) {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = text;
      el.style.color = isError ? "#b00020" : "#2d5a2d";
    }

    function escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text || "";
      return div.innerHTML;
    }

    function escapeAttribute(text) {
      return escapeHtml(text).replace(/'/g, '&#39;');
    }

    function formatTime(value) {
      return new Date(value).toLocaleString();
    }

    function initials(name) {
      return (name || "G").trim().charAt(0).toUpperCase();
    }

    function getProfileByUserId(userId) {
      if (!userId) return null;
      return getUsers().find(user => user.id === userId) || null;
    }

    function getPostAuthorProfile(post) {
      if (!post || !post.userId) return null;
      return getProfileByUserId(post.userId);
    }

    function renderAvatar(profile, fallbackName, className = "avatar") {
      if (profile && profile.avatarUrl) {
        return `<div class="${className}"><img src="${profile.avatarUrl}" alt="${escapeHtml(fallbackName || "User")}"></div>`;
      }
      return `<div class="${className}">${escapeHtml(initials(fallbackName || "User"))}</div>`;
    }

    function openUserProfile(userId) {
      if (!userId) return;
      viewedProfileId = userId;
      document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
      document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
      document.getElementById("profile").classList.add("active");
      const profileButton = document.querySelector('.nav-item[data-page="profile"]');
      if (profileButton) profileButton.classList.add("active");
      renderAll();
    }

    function updateNotificationBell() {
      const bellBtn = document.getElementById("notificationsBellBtn");
      const badge = document.getElementById("notificationsBellBadge");
      if (!bellBtn || !badge) return;
      if (!currentUser) {
        bellBtn.style.display = "none";
        badge.style.display = "none";
        return;
      }
      syncCurrentUser();
      const notificationCount = Array.isArray(currentUser.notifications) ? currentUser.notifications.length : 0;
      bellBtn.style.display = "inline-flex";
      badge.textContent = notificationCount > 99 ? "99+" : String(notificationCount);
      badge.style.display = notificationCount ? "inline-flex" : "none";
    }

    function openNotificationsPage() {
      const notificationsTab = document.querySelector('.nav-item[data-page="notifications"]');
      showPage('notifications', notificationsTab);
    }

    function openSettingsPageFromProfile() {
      const settingsTab = document.querySelector('.nav-item[data-page="settings"]');
      showPage('settings', settingsTab || null);
    }

    function updateAccountUI(user) {
      const loginBtn = document.getElementById("loginOpenBtn");
      const registerBtn = document.getElementById("registerOpenBtn");
      const logoutBtn = document.getElementById("logoutBtn");
      const bellBtn = document.getElementById("notificationsBellBtn");
      if (user) {
        loginBtn.style.display = "none";
        registerBtn.style.display = "none";
        logoutBtn.style.display = "inline-block";
        if (bellBtn) bellBtn.style.display = "inline-flex";
      } else {
        loginBtn.style.display = "inline-block";
        registerBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
        if (bellBtn) bellBtn.style.display = "none";
      }
      updateNotificationBell();
    }

    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        if (!file) return resolve("");
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    function extractHashtags(text) {
      const matches = String(text || '').match(/#[A-Za-z0-9_]+/g) || [];
      return [...new Set(matches.map(tag => tag.toLowerCase()))];
    }

    function getNormalizedUsernameMap() {
      const map = {};
      getUsers().forEach(user => {
        const key = String(user.username || '').trim().toLowerCase();
        if (key) map[key] = user;
      });
      return map;
    }

    function extractMentionedUsers(text) {
      const usernameMap = getNormalizedUsernameMap();
      const results = [];
      const seen = new Set();
      const matches = String(text || '').match(/[@#][A-Za-z0-9_]+/g) || [];
      matches.forEach(token => {
        const key = token.slice(1).toLowerCase();
        const user = usernameMap[key];
        if (user && !seen.has(user.id)) {
          seen.add(user.id);
          results.push({ userId: user.id, username: user.username, token });
        }
      });
      return results;
    }

    function parsePollFromContent(text) {
      const raw = String(text || '');
      const lines = raw.split(/\r?\n/);
      const pollLineIndex = lines.findIndex(line => /^\s*[📊]?\s*poll\s*$/i.test(line.trim()));
      if (pollLineIndex === -1) return null;
      const options = [];
      for (let i = pollLineIndex + 1; i < lines.length; i += 1) {
        const line = lines[i].trim();
        if (!line) continue;
        const match = line.match(/^option\s*\d+\s*:\s*(.+)$/i);
        if (!match) continue;
        const value = match[1].trim();
        if (value) options.push(value.slice(0, 80));
      }
      if (options.length < 2) return null;
      return {
        question: 'Poll',
        options: options.slice(0, 4).map((label, index) => ({ id: index + 1, label, votes: 0 })),
        votesByUser: {}
      };
    }

    function getPollVoteCount(poll) {
      if (!poll || !Array.isArray(poll.options)) return 0;
      return poll.options.reduce((sum, option) => sum + (Number(option.votes) || 0), 0);
    }

    function buildPollHtml(post) {
      const poll = post && post.poll;
      if (!poll || !Array.isArray(poll.options) || poll.options.length < 2) return '';
      const totalVotes = getPollVoteCount(poll);
      const selectedOptionId = currentUser && poll.votesByUser ? poll.votesByUser[currentUser.id] : null;
      const canVote = Boolean(currentUser);
      const optionsHtml = poll.options.map(option => {
        const optionVotes = Number(option.votes) || 0;
        const percent = totalVotes ? Math.round((optionVotes / totalVotes) * 100) : 0;
        const selected = selectedOptionId === option.id;
        const meta = totalVotes ? `${optionVotes} vote${optionVotes === 1 ? '' : 's'} · ${percent}%` : '0 votes';
        return `<button type="button" class="poll-option-btn ${selected ? 'selected' : ''}" onclick="voteOnPoll(${post.id}, ${option.id})" ${canVote ? '' : 'disabled'}>
          <span class="poll-option-label">${escapeHtml(option.label)}</span>
          <span class="poll-option-meta">${meta}</span>
        </button>`;
      }).join('');
      return `<div class="poll-box">
        <div class="poll-title">Poll</div>
        <div class="poll-options">${optionsHtml}</div>
        <div class="poll-footer">${canVote ? (selectedOptionId ? 'You voted in this poll.' : 'Vote on this poll.') : 'Login to vote.'} · ${totalVotes} total vote${totalVotes === 1 ? '' : 's'}</div>
      </div>`;
    }

    function voteOnPoll(postId, optionId) {
      if (!currentUser) {
        alert('Please login first.');
        return;
      }
      const posts = getPosts();
      const post = posts.find(item => item.id === postId);
      if (!post || !post.poll || !Array.isArray(post.poll.options)) return;
      if (!post.poll.votesByUser) post.poll.votesByUser = {};
      const previousOptionId = post.poll.votesByUser[currentUser.id];
      if (previousOptionId === optionId) return;
      if (previousOptionId) {
        const previousOption = post.poll.options.find(option => option.id === previousOptionId);
        if (previousOption) previousOption.votes = Math.max(0, (Number(previousOption.votes) || 0) - 1);
      }
      const nextOption = post.poll.options.find(option => option.id === optionId);
      if (!nextOption) return;
      nextOption.votes = (Number(nextOption.votes) || 0) + 1;
      post.poll.votesByUser[currentUser.id] = optionId;
      savePosts(posts);
      if (post.userId && post.userId !== currentUser.id) {
        addNotification(post.userId, `${currentUser.username || 'Someone'} voted in your poll.`, 'post');
      }
      renderAll();
    }

    function notifyMentionedUsers(text, actorName, typeLabel, excludeUserIds = []) {
      const exclude = new Set(excludeUserIds.filter(Boolean));
      extractMentionedUsers(text).forEach(mention => {
        if (exclude.has(mention.userId)) return;
        addNotification(mention.userId, `${actorName} mentioned you in ${typeLabel}.`, 'reply');
      });
    }


    function normalizeTag(tag) {
      const raw = String(tag || '').trim().toLowerCase().replace(/\s+/g, '');
      if (!raw) return '';
      return raw.startsWith('#') ? raw : `#${raw}`;
    }

    function getTagStats() {
      const counts = new Map();
      getPosts().forEach(post => {
        (Array.isArray(post.hashtags) ? post.hashtags : []).forEach(tag => {
          const normalized = normalizeTag(tag);
          if (!normalized) return;
          counts.set(normalized, (counts.get(normalized) || 0) + 1);
        });
      });
      return Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return a.value.localeCompare(b.value);
        });
    }

    function searchUsers(rawQuery) {
      const query = String(rawQuery || '').trim().toLowerCase().replace(/^[@#]/, '');
      if (!query) return [];
      return getUsers().filter(user => {
        const username = String(user.username || '').toLowerCase();
        const bio = String(user.bio || '').toLowerCase();
        return username.includes(query) || bio.includes(query);
      }).slice(0, 8);
    }

    function searchTags(rawQuery) {
      const query = String(rawQuery || '').trim().toLowerCase();
      const normalized = normalizeTag(query);
      const rawNoPrefix = query.replace(/^#/, '');
      return getTagStats().filter(item => {
        return !rawNoPrefix || item.value.includes(normalized) || item.value.slice(1).includes(rawNoPrefix);
      }).slice(0, 8);
    }

    function collectGlobalSearchResults(rawQuery) {
      const query = String(rawQuery || '').trim();
      const lower = query.toLowerCase();
      const startsWithTag = lower.startsWith('#');
      const startsWithUser = lower.startsWith('@');

      const users = searchUsers(query);
      const tags = searchTags(query);
      const posts = getPosts()
        .filter(post => canUserSeePost(post, currentUser))
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
        .filter(post => {
          if (!lower) return false;
          const content = String(post.content || '').toLowerCase();
          const author = String(post.authorName || getPostAuthorProfile(post)?.username || '').toLowerCase();
          const tagsText = (Array.isArray(post.hashtags) ? post.hashtags.join(' ') : '').toLowerCase();
          return content.includes(lower) || author.includes(lower.replace(/^@/, '')) || tagsText.includes(lower.replace(/^#/, ''));
        })
        .slice(0, startsWithTag ? 4 : 5);

      return {
        query,
        startsWithTag,
        startsWithUser,
        users: startsWithTag ? [] : users,
        tags,
        posts
      };
    }

    function hideGlobalSearchDropdown() {
      const dropdown = document.getElementById('globalSearchDropdown');
      if (!dropdown) return;
      dropdown.classList.remove('active');
      dropdown.innerHTML = '';
      dropdown.dataset.activeIndex = '-1';
    }

    function showSearchHashtag(tag) {
      const search = document.getElementById('globalSearch');
      if (search) search.value = normalizeTag(tag);
      const exploreButton = document.querySelector('.nav-item[data-page="explore"]');
      showPage('explore', exploreButton);
      renderAll();
    }

    function handleSearchSelection(type, value) {
      hideGlobalSearchDropdown();
      if (type === 'user') {
        openUserProfile(Number(value));
        return;
      }
      if (type === 'tag') {
        showSearchHashtag(value);
        return;
      }
      if (type === 'post') {
        goToPostAndHighlight(Number(value));
      }
    }

    function renderGlobalSearchDropdown() {
      const search = document.getElementById('globalSearch');
      const dropdown = document.getElementById('globalSearchDropdown');
      if (!search || !dropdown) return;
      const results = collectGlobalSearchResults(search.value);
      if (!results.query) {
        hideGlobalSearchDropdown();
        return;
      }
      const sections = [];
      if (results.users.length) {
        sections.push(`
          <div class="search-dropdown-section">
            <div class="search-dropdown-title">People</div>
            ${results.users.map(user => `
              <div class="search-dropdown-item" data-type="user" data-value="${user.id}" onclick="handleSearchSelection('user', '${user.id}')">
                <div class="search-dropdown-main">
                  <div class="search-dropdown-name">${escapeHtml(user.username || 'User')}</div>
                  <div class="search-dropdown-sub">@${escapeHtml(String(user.username || 'user').replace(/\s+/g, '').toLowerCase())}${user.bio ? ` · ${escapeHtml(user.bio)}` : ''}</div>
                </div>
                <span class="search-dropdown-pill">Profile</span>
              </div>
            `).join('')}
          </div>`);
      }
      if (results.tags.length) {
        sections.push(`
          <div class="search-dropdown-section">
            <div class="search-dropdown-title">Hashtags</div>
            ${results.tags.map(item => `
              <div class="search-dropdown-item" data-type="tag" data-value="${escapeAttribute(item.value)}" onclick="handleSearchSelection('tag', '${escapeAttribute(item.value)}')">
                <div class="search-dropdown-main">
                  <div class="search-dropdown-name">${escapeHtml(item.value)}</div>
                  <div class="search-dropdown-sub">${item.count} post${item.count === 1 ? '' : 's'}</div>
                </div>
                <span class="search-dropdown-pill">Tag</span>
              </div>
            `).join('')}
          </div>`);
      }
      if (results.posts.length) {
        sections.push(`
          <div class="search-dropdown-section">
            <div class="search-dropdown-title">Posts</div>
            ${results.posts.map(post => {
              const author = getPostAuthorProfile(post)?.username || post.authorName || 'User';
              return `
                <div class="search-dropdown-item" data-type="post" data-value="${post.id}" onclick="handleSearchSelection('post', '${post.id}')">
                  <div class="search-dropdown-main">
                    <div class="search-dropdown-name">${escapeHtml(author)}</div>
                    <div class="search-dropdown-sub">${escapeHtml(String(post.content || '').slice(0, 80) || 'Open post')}</div>
                  </div>
                  <span class="search-dropdown-pill">Post</span>
                </div>`;
            }).join('')}
          </div>`);
      }

      if (!sections.length) {
        dropdown.innerHTML = `<div class="search-dropdown-section"><div class="search-dropdown-item"><div class="search-dropdown-main"><div class="search-dropdown-name">No matches yet</div><div class="search-dropdown-sub">Try another name, post text, or #hashtag.</div></div></div></div>`;
      } else {
        dropdown.innerHTML = sections.join('');
      }
      dropdown.classList.add('active');
      dropdown.dataset.activeIndex = '-1';
    }

    function moveSearchDropdownSelection(direction) {
      const dropdown = document.getElementById('globalSearchDropdown');
      if (!dropdown || !dropdown.classList.contains('active')) return;
      const items = Array.from(dropdown.querySelectorAll('.search-dropdown-item[data-type]'));
      if (!items.length) return;
      let index = Number(dropdown.dataset.activeIndex || -1);
      index += direction;
      if (index < 0) index = items.length - 1;
      if (index >= items.length) index = 0;
      dropdown.dataset.activeIndex = String(index);
      items.forEach((item, itemIndex) => item.classList.toggle('active', itemIndex === index));
      const activeItem = items[index];
      if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });
    }

    function activateSelectedSearchDropdownItem() {
      const dropdown = document.getElementById('globalSearchDropdown');
      if (!dropdown || !dropdown.classList.contains('active')) return false;
      const items = Array.from(dropdown.querySelectorAll('.search-dropdown-item[data-type]'));
      if (!items.length) return false;
      let index = Number(dropdown.dataset.activeIndex || -1);
      if (index < 0) index = 0;
      const item = items[index];
      if (!item) return false;
      item.click();
      return true;
    }

    function renderSearchPanels(query) {
      const meta = document.getElementById('exploreSearchMeta');
      const peopleContainer = document.getElementById('peopleSearchContainer');
      const hashtagContainer = document.getElementById('hashtagSearchContainer');
      if (!meta || !peopleContainer || !hashtagContainer) return;

      const text = String(query || '').trim();
      if (!text) {
        meta.style.display = 'none';
        peopleContainer.style.display = 'none';
        hashtagContainer.style.display = 'none';
        peopleContainer.innerHTML = '';
        hashtagContainer.innerHTML = '';
        return;
      }

      const matchedUsers = searchUsers(text);
      const matchedTags = searchTags(text);

      meta.style.display = 'block';
      meta.innerHTML = `<strong>Search results for ${escapeHtml(text)}</strong><div class="page-subtitle" style="margin-top:8px;">People, hashtags, and posts update together as you type.</div>`;

      if (matchedUsers.length) {
        peopleContainer.style.display = 'grid';
        peopleContainer.innerHTML = matchedUsers.map(user => {
          const isSelf = currentUser && currentUser.id === user.id;
          const following = currentUser && Array.isArray(currentUser.following) ? currentUser.following.includes(user.id) : false;
          return `
            <div class="person-result-card">
              ${renderAvatar(user, user.username || 'User', 'avatar')}
              <div class="person-result-body">
                <div class="person-result-name">${escapeHtml(user.username || 'User')}</div>
                <div class="person-result-handle">@${escapeHtml(String(user.username || 'user').replace(/\s+/g, '').toLowerCase())}</div>
              </div>
              <div class="person-result-actions">
                ${!isSelf && currentUser ? `<button class="search-open-btn" onclick="toggleFollow(${user.id})">${following ? 'Following' : 'Follow'}</button>` : ''}
                <button class="search-open-btn" onclick="openUserProfile(${user.id})">Open</button>
              </div>
            </div>
          `;
        }).join('');
      } else {
        peopleContainer.style.display = 'none';
        peopleContainer.innerHTML = '';
      }

      if (matchedTags.length) {
        hashtagContainer.style.display = 'grid';
        hashtagContainer.innerHTML = matchedTags.map(item => `
          <div class="hashtag-result-card" onclick="showSearchHashtag('${escapeAttribute(item.value)}')">
            <div class="hashtag-result-name">${escapeHtml(item.value)}</div>
            <div class="hashtag-result-meta">${item.count} post${item.count === 1 ? '' : 's'} using this tag</div>
          </div>
        `).join('');
      } else {
        hashtagContainer.style.display = 'none';
        hashtagContainer.innerHTML = '';
      }
    }

    function collectTagSuggestions(prefix = '') {
      const cleanPrefix = String(prefix || '').toLowerCase();
      const posts = getPosts();
      const tagCounts = new Map();
      posts.forEach(post => {
        (Array.isArray(post.hashtags) ? post.hashtags : []).forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });
      const tagItems = Array.from(tagCounts.entries()).map(([value, count]) => ({
        value,
        display: value,
        type: 'tag',
        meta: `${count} post${count === 1 ? '' : 's'}`
      }));
      const userItems = getUsers().map(user => ({
        value: `#${String(user.username || '').trim().toLowerCase()}`,
        display: `#${user.username || ''}`,
        type: 'user',
        meta: 'user mention'
      })).filter(item => item.value !== '#');
      return [...tagItems, ...userItems]
        .filter(item => (item.value || '').startsWith('#' + cleanPrefix))
        .sort((a, b) => a.value.localeCompare(b.value))
        .slice(0, 8);
    }

    function getActiveHashToken(textarea) {
      if (!textarea) return null;
      const value = textarea.value || '';
      const pos = textarea.selectionStart || 0;
      const uptoCursor = value.slice(0, pos);
      const match = uptoCursor.match(/(^|\s)(#[A-Za-z0-9_]*)$/);
      if (!match) return null;
      const token = match[2] || '';
      return { token, prefix: token.slice(1).toLowerCase(), start: pos - token.length, end: pos };
    }

    function hideTagSuggestions(targetId) {
      const box = document.getElementById(targetId);
      if (!box) return;
      box.classList.remove('active');
      box.innerHTML = '';
    }

    function applySuggestionToTextarea(textareaId, rawValue, suggestionsId) {
      const textarea = document.getElementById(textareaId);
      if (!textarea) return;
      const tokenInfo = getActiveHashToken(textarea);
      if (!tokenInfo) return;
      const before = textarea.value.slice(0, tokenInfo.start);
      const after = textarea.value.slice(tokenInfo.end);
      textarea.value = `${before}${rawValue} ${after}`;
      const nextPos = (before + rawValue + ' ').length;
      textarea.focus();
      textarea.setSelectionRange(nextPos, nextPos);
      hideTagSuggestions(suggestionsId);
    }

    function updateTagSuggestions(textareaId, suggestionsId) {
      const textarea = document.getElementById(textareaId);
      const box = document.getElementById(suggestionsId);
      if (!textarea || !box) return;
      const tokenInfo = getActiveHashToken(textarea);
      if (!tokenInfo || !tokenInfo.token.startsWith('#')) {
        hideTagSuggestions(suggestionsId);
        return;
      }
      const suggestions = collectTagSuggestions(tokenInfo.prefix);
      if (!suggestions.length) {
        hideTagSuggestions(suggestionsId);
        return;
      }
      box.innerHTML = suggestions.map(item => {
        const raw = escapeAttribute(item.display || item.value || '');
        return `
          <div class="tag-suggestion-item" onclick="applySuggestionToTextarea('${textareaId}', '${raw}', '${suggestionsId}')">
            <span class="tag-suggestion-label">${escapeHtml(item.display || item.value || '')}</span>
            <span class="tag-suggestion-meta">${escapeHtml(item.meta || '')}</span>
          </div>`;
      }).join('');
      box.classList.add('active');
    }

    function bindComposerSuggestions(textareaId, suggestionsId) {
      const textarea = document.getElementById(textareaId);
      if (!textarea || textarea.dataset.suggestionsBound === '1') return;
      textarea.dataset.suggestionsBound = '1';
      ['input', 'click', 'keyup'].forEach(eventName => {
        textarea.addEventListener(eventName, () => updateTagSuggestions(textareaId, suggestionsId));
      });
      textarea.addEventListener('blur', () => {
        setTimeout(() => hideTagSuggestions(suggestionsId), 150);
      });
    }

    function getPostCategory(content) {
      const tags = extractHashtags(content);
      if (tags.includes('#news')) return 'news';
      if (tags.includes('#sports')) return 'sports';
      if (tags.includes('#entertainment') || tags.includes('#music') || tags.includes('#movies')) return 'entertainment';
      return 'trending';
    }

    function renderRichText(text) {
      const value = String(text || '');
      const usernameMap = getNormalizedUsernameMap();
      return value.split(/([@#][A-Za-z0-9_]+)/g).map(part => {
        if (/^[@#][A-Za-z0-9_]+$/.test(part)) {
          const key = part.slice(1).toLowerCase();
          const matchedUser = usernameMap[key];
          if (matchedUser) {
            return `<span class="mention-link" onclick="openUserProfile(${matchedUser.id})">${escapeHtml(part)}</span>`;
          }
          if (part.startsWith('#')) {
            const safeTag = part.toLowerCase();
            return `<span class="hashtag-link" onclick="searchHashtag('${safeTag}')">${escapeHtml(part)}</span>`;
          }
        }
        return escapeHtml(part);
      }).join('');
    }

    function searchHashtag(tag) {
      showSearchHashtag(tag);
    }

    function getUserSettingsData(user) {
      return user?.settings || {
        phone: '',
        location: '',
        website: '',
        passwordHint: '',
        birthday: '',
        gender: '',
        language: '',
        accountEmail: '',
        facebook: '',
        youtube: '',
        twitch: '',
        kick: '',
        pronouns: '',
        status: '',
        tagline: '',
        occupation: '',
        creatorCategory: '',
        profileAccent: 'green',
        profileLayout: 'modern',
        accountPrivate: false,
        allowMessages: false,
        allowTagging: true,
        showSensitive: false,
        linkVisibility: true,
        notifyPosts: false,
        notifyFollows: false,
        notifyReplies: false,
        notifyMentions: true,
        notifyMarketing: false,
        creatorMode: false,
        autoPlayMedia: true,
        compactMode: false,
        highContrast: false,
        reduceMotion: false,
        largerText: false,
        theme: 'system'
      };
    }

    function buildSettingsDetailHtml() {
      const settings = getUserSettingsData(currentUser);
      const usernameValue = currentUser?.username || '';
      const bioValue = currentUser?.bio || '';
      const phoneValue = settings.phone || '';
      const locationValue = settings.location || '';
      const websiteValue = settings.website || '';
      const passwordHintValue = settings.passwordHint || '';
      const languageValue = settings.language || '';
      const birthdayValue = settings.birthday || '';
      const genderValue = settings.gender || '';
      const emailValue = settings.accountEmail || '';
      const facebookValue = settings.facebook || '';
      const youtubeValue = settings.youtube || '';
      const twitchValue = settings.twitch || '';
      const kickValue = settings.kick || '';
      const pronounsValue = settings.pronouns || '';
      const statusValue = settings.status || '';
      const taglineValue = settings.tagline || '';
      const occupationValue = settings.occupation || '';
      const creatorCategoryValue = settings.creatorCategory || '';
      const accentValue = settings.profileAccent || 'green';
      const compactValue = !!settings.compactMode;
      const reduceMotionValue = !!settings.reduceMotion;
      const highContrastValue = !!settings.highContrast;
      const largerTextValue = !!settings.largerText;

      const accentChip = (value, color) => `<button type="button" class="accent-chip ${accentValue === value ? 'active' : ''}" style="background:${color};" onclick="selectAccentChip('${value}', this)"></button>`;

      const sections = {
        account: {
          title: 'Account Info',
          subtitle: 'Modernize your public profile with extra details, links, and creator identity.',
          body: `
            <div class="settings-card-list">
              <div class="settings-option">
                <div class="settings-kicker">Profile</div>
                <h4>Public identity</h4>
                <div class="settings-select-grid">
                  <div>
                    <label for="settingsDisplayName">Display name</label>
                    <input id="settingsDisplayName" type="text" placeholder="Your display name" value="${escapeAttribute(usernameValue)}" />
                  </div>
                  <div>
                    <label for="settingsUsername">Username</label>
                    <input id="settingsUsername" type="text" placeholder="Username" value="${escapeAttribute(usernameValue)}" />
                  </div>
                </div>
                <label for="settingsBio" style="margin-top:14px; display:block;">Bio</label>
                <textarea id="settingsBio" placeholder="Tell people about yourself">${escapeHtml(bioValue)}</textarea>
                <div class="settings-select-grid" style="margin-top:14px;">
                  <div>
                    <label for="settingsPronouns">Pronouns</label>
                    <input id="settingsPronouns" type="text" placeholder="e.g. he/him" value="${escapeAttribute(pronounsValue)}" />
                  </div>
                  <div>
                    <label for="settingsStatus">Status</label>
                    <input id="settingsStatusText" type="text" placeholder="What are you up to?" value="${escapeAttribute(statusValue)}" />
                  </div>
                </div>
                <label for="settingsTagline" style="margin-top:14px; display:block;">Headline / tagline</label>
                <input id="settingsTagline" type="text" placeholder="Short line under your bio" value="${escapeAttribute(taglineValue)}" />
                <label for="settingsOccupation" style="margin-top:14px; display:block;">Role or occupation</label>
                <input id="settingsOccupation" type="text" placeholder="Creator, Designer, Developer..." value="${escapeAttribute(occupationValue)}" />
                <label for="settingsAvatarUpload" style="margin-top:14px; display:block;">Profile photo</label>
                <input id="settingsAvatarUpload" type="file" accept="image/*" />
              </div>

              <div class="settings-option">
                <div class="settings-kicker">Contact</div>
                <h4>Account information</h4>
                <div class="settings-section-grid">
                  <div>
                    <label for="settingsPhone">Phone Number</label>
                    <input id="settingsPhone" type="text" value="${escapeAttribute(phoneValue)}" />
                  </div>
                  <div>
                    <label for="settingsEmail">Email</label>
                    <input id="settingsEmail" type="text" value="${escapeAttribute(emailValue)}" />
                  </div>
                  <div>
                    <label for="settingsBirthday">Birthday</label>
                    <input id="settingsBirthday" type="text" value="${escapeAttribute(birthdayValue)}" />
                  </div>
                  <div>
                    <label for="settingsGender">Gender</label>
                    <select id="settingsGender">
                      <option value="" ${genderValue === '' ? 'selected' : ''}>Prefer not to say</option>
                      <option value="Male" ${genderValue === 'Male' ? 'selected' : ''}>Male</option>
                      <option value="Female" ${genderValue === 'Female' ? 'selected' : ''}>Female</option>
                      <option value="Non-binary" ${genderValue === 'Non-binary' ? 'selected' : ''}>Non-binary</option>
                    </select>
                  </div>
                  <div>
                    <label for="settingsLanguage">Language</label>
                    <select id="settingsLanguage">
                      <option value="" ${languageValue === '' ? 'selected' : ''}>Select language</option>
                      <option value="English" ${languageValue === 'English' ? 'selected' : ''}>English</option>
                      <option value="Spanish" ${languageValue === 'Spanish' ? 'selected' : ''}>Spanish</option>
                    </select>
                  </div>
                  <div>
                    <label for="settingsLocation">Location</label>
                    <input id="settingsLocation" type="text" value="${escapeAttribute(locationValue)}" />
                  </div>
                </div>
                <label for="settingsWebsite" style="margin-top:14px; display:block;">Website</label>
                <input id="settingsWebsite" type="text" placeholder="https://your-site.com" value="${escapeAttribute(websiteValue)}" />
              </div>

              <div class="settings-option">
                <div class="settings-kicker">Links</div>
                <h4>Social networks</h4>
                <div class="settings-section-grid">
                  <div><label for="settingsFacebook">Facebook</label><input id="settingsFacebook" type="text" placeholder="Facebook profile or link" value="${escapeAttribute(facebookValue)}" /></div>
                  <div><label for="settingsYoutube">YouTube</label><input id="settingsYoutube" type="text" placeholder="YouTube channel or link" value="${escapeAttribute(youtubeValue)}" /></div>
                  <div><label for="settingsTwitch">Twitch</label><input id="settingsTwitch" type="text" placeholder="Twitch username or link" value="${escapeAttribute(twitchValue)}" /></div>
                  <div><label for="settingsKick">Kick</label><input id="settingsKick" type="text" placeholder="Kick username or link" value="${escapeAttribute(kickValue)}" /></div>
                </div>
                <small>These appear as highlight chips on the profile when filled in.</small>
              </div>
              <button class="save-btn" onclick="saveSettings()">Save account settings</button>
            </div>`
        },
        appearance: {
          title: 'Appearance',
          subtitle: 'Give the site and your profile a stronger identity with theme, accent, and layout controls.',
          body: `
            <div class="settings-card-list">
              <div class="settings-option">
                <div class="settings-kicker">Theme</div>
                <h4>Look and feel</h4>
                <div class="settings-select-grid">
                  <div>
                    <label for="settingsTheme">Theme mode</label>
                    <select id="settingsTheme">
                      <option value="system" ${settings.theme === 'system' ? 'selected' : ''}>System</option>
                      <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                      <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                    </select>
                  </div>
                  <div>
                    <label for="settingsProfileLayout">Profile style</label>
                    <select id="settingsProfileLayout">
                      <option value="modern" ${settings.profileLayout === 'modern' ? 'selected' : ''}>Modern card</option>
                      <option value="clean" ${settings.profileLayout === 'clean' ? 'selected' : ''}>Clean minimal</option>
                    </select>
                  </div>
                </div>
                <div class="settings-helper">Accent color</div>
                <div class="accent-chip-row" id="accentChipRow">
                  ${accentChip('green', '#10a37f')}
                  ${accentChip('blue', '#3b82f6')}
                  ${accentChip('purple', '#8b5cf6')}
                  ${accentChip('pink', '#ec4899')}
                  ${accentChip('orange', '#f97316')}
                </div>
                <input id="settingsProfileAccent" type="hidden" value="${escapeAttribute(accentValue)}" />
                <div class="inline-toggle-row" style="margin-top:14px;">
                  <label class="toggle-chip"><input id="settingsCompactMode" type="checkbox" ${compactValue ? 'checked' : ''}> Compact cards</label>
                  <label class="toggle-chip"><input id="settingsAutoplayMedia" type="checkbox" ${settings.autoPlayMedia ? 'checked' : ''}> Auto-play media</label>
                </div>
                <div class="appearance-preview">
                  <div class="appearance-preview-bar"></div>
                  <div class="appearance-preview-card">
                    <strong>Preview</strong>
                    <p class="muted" style="margin-top:8px;">This updates the site theme, button accent, and profile polish.</p>
                  </div>
                </div>
              </div>
              <button class="save-btn" onclick="saveSettings()">Save appearance settings</button>
            </div>`
        },
        security: {
          title: 'Security',
          subtitle: 'Keep your account organized while you are still using the browser-based demo system.',
          body: `
            <div class="settings-card-list">
              <div class="settings-option">
                <div class="settings-kicker">Security</div>
                <h4>Local account reminder</h4>
                <label for="settingsPasswordHint">Password reminder hint</label>
                <input id="settingsPasswordHint" type="text" placeholder="Enter a private reminder" value="${escapeAttribute(passwordHintValue)}" />
                <small>This website still uses local browser storage for demo mode, so this is only a local hint.</small>
              </div>
              <div class="settings-option">
                <div class="settings-kicker">Sessions</div>
                <h4>Login activity</h4>
                <p class="muted">Signed in on this browser. Add a backend later if you want real session history and password reset.</p>
              </div>
              <button class="save-btn" onclick="saveSettings()">Save security settings</button>
            </div>`
        },
        privacy: {
          title: 'Privacy & Content',
          subtitle: 'Control what people can do around your profile and how open your account feels.',
          body: `
            <div class="settings-card-list">
              <div class="settings-option">
                <div class="settings-kicker">Audience</div>
                <h4>Profile controls</h4>
                <div class="inline-toggle-row">
                  <label class="toggle-chip"><input id="settingsPrivateAccount" type="checkbox" ${settings.accountPrivate ? 'checked' : ''}> Private account</label>
                  <label class="toggle-chip"><input id="settingsAllowMessages" type="checkbox" ${settings.allowMessages ? 'checked' : ''}> Allow messages</label>
                  <label class="toggle-chip"><input id="settingsAllowTagging" type="checkbox" ${settings.allowTagging ? 'checked' : ''}> Allow tagging</label>
                  <label class="toggle-chip"><input id="settingsShowSensitive" type="checkbox" ${settings.showSensitive ? 'checked' : ''}> Show sensitive media</label>
                  <label class="toggle-chip"><input id="settingsLinkVisibility" type="checkbox" ${settings.linkVisibility ? 'checked' : ''}> Show links publicly</label>
                </div>
              </div>
              <button class="save-btn" onclick="saveSettings()">Save privacy settings</button>
            </div>`
        },
        notifications: {
          title: 'Notifications',
          subtitle: 'Choose what alerts matter most when people interact with you or your content.',
          body: `
            <div class="settings-card-list">
              <div class="settings-option">
                <div class="settings-kicker">Alerts</div>
                <h4>Push activity</h4>
                <div class="inline-toggle-row">
                  <label class="toggle-chip"><input id="settingsNotifyPosts" type="checkbox" ${settings.notifyPosts ? 'checked' : ''}> New posts from following</label>
                  <label class="toggle-chip"><input id="settingsNotifyFollows" type="checkbox" ${settings.notifyFollows ? 'checked' : ''}> New followers</label>
                  <label class="toggle-chip"><input id="settingsNotifyReplies" type="checkbox" ${settings.notifyReplies ? 'checked' : ''}> Replies and likes</label>
                  <label class="toggle-chip"><input id="settingsNotifyMentions" type="checkbox" ${settings.notifyMentions ? 'checked' : ''}> Mentions</label>
                  <label class="toggle-chip"><input id="settingsNotifyMarketing" type="checkbox" ${settings.notifyMarketing ? 'checked' : ''}> Product updates</label>
                </div>
              </div>
              <button class="save-btn" onclick="saveSettings()">Save notification settings</button>
            </div>`
        },
        creator: {
          title: 'Creator Tools',
          subtitle: 'Set up your profile for streaming, posting, and showcasing what you do.',
          body: `
            <div class="settings-card-list">
              <div class="settings-option">
                <div class="settings-kicker">Creator mode</div>
                <h4>Profile spotlight</h4>
                <div class="inline-toggle-row">
                  <label class="toggle-chip"><input id="settingsCreatorMode" type="checkbox" ${settings.creatorMode ? 'checked' : ''}> Enable creator mode</label>
                </div>
                <label for="settingsCreatorCategory" style="margin-top:14px; display:block;">Creator category</label>
                <input id="settingsCreatorCategory" type="text" placeholder="Streamer, artist, editor, builder..." value="${escapeAttribute(creatorCategoryValue)}" />
                <small>When creator mode is on, your profile shows a creator badge and category highlight.</small>
              </div>
              <button class="save-btn" onclick="saveSettings()">Save creator settings</button>
            </div>`
        },
        accessibility: {
          title: 'Accessibility',
          subtitle: 'Make the site easier to read and more comfortable to use over time.',
          body: `
            <div class="settings-card-list">
              <div class="settings-option">
                <div class="settings-kicker">Accessibility</div>
                <h4>Reading and motion</h4>
                <div class="inline-toggle-row">
                  <label class="toggle-chip"><input id="settingsReduceMotion" type="checkbox" ${reduceMotionValue ? 'checked' : ''}> Reduce motion</label>
                  <label class="toggle-chip"><input id="settingsHighContrast" type="checkbox" ${highContrastValue ? 'checked' : ''}> High contrast</label>
                  <label class="toggle-chip"><input id="settingsLargerText" type="checkbox" ${largerTextValue ? 'checked' : ''}> Larger text</label>
                </div>
              </div>
              <button class="save-btn" onclick="saveSettings()">Save accessibility settings</button>
            </div>`
        }
      };
      const section = sections[activeSettingsSection] || sections.account;
      return `
        <div class="settings-detail-header">
          <h3>${section.title}</h3>
          <p class="muted">${section.subtitle}</p>
        </div>
        ${section.body}`;
    }

    function renderSettingsDetails() {
      const panel = document.getElementById('settingsDetailPanel');
      if (!panel) return;
      if (!currentUser) {
        panel.innerHTML = `
          <div class="settings-detail-header">
            <h3>Settings</h3>
            <p class="muted">Login to manage your account, privacy, notifications, and profile.</p>
          </div>
          <div class="settings-card-list">
            <div class="settings-option">
              <h4>You're not signed in</h4>
              <p class="muted">Sign in first so your account information can load here.</p>
            </div>
          </div>`;
        return;
      }
      panel.innerHTML = buildSettingsDetailHtml();
    }

    function selectAccentChip(value, clickedButton) {
      const hidden = document.getElementById('settingsProfileAccent');
      if (hidden) hidden.value = value;
      document.querySelectorAll('.accent-chip').forEach(chip => chip.classList.remove('active'));
      if (clickedButton) clickedButton.classList.add('active');
    }

    function setSettingsSection(section, clickedButton) {
      activeSettingsSection = section;
      document.querySelectorAll('.settings-nav-item').forEach(item => item.classList.remove('active'));
      if (clickedButton) clickedButton.classList.add('active');
      else {
        const target = document.querySelector(`.settings-nav-item[data-settings-section="${section}"]`);
        if (target) target.classList.add('active');
      }
      renderSettingsDetails();
    }

    function filterSettingsMenu() {
      const query = document.getElementById('settingsSearch').value.trim().toLowerCase();
      const items = Array.from(document.querySelectorAll('.settings-nav-item'));
      let firstVisible = null;
      items.forEach(item => {
        const match = item.textContent.toLowerCase().includes(query);
        item.style.display = match ? '' : 'none';
        if (match && !firstVisible) firstVisible = item;
      });
      const active = document.querySelector('.settings-nav-item.active');
      if (active && active.style.display === 'none' && firstVisible) {
        setSettingsSection(firstVisible.dataset.settingsSection, firstVisible);
      }
    }

    function getFollowersOfUser(userId) {
      return getUsers().filter(user => Array.isArray(user.following) && user.following.includes(userId));
    }

    function iconSvg(name) {
      const icons = {
        comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5c0 1.93-1.57 3.5-3.5 3.5H9l-4 3v-3.5C3.34 17 2 15.66 2 14V7.5C2 5.57 3.57 4 5.5 4h11C18.43 4 20 5.57 20 7.5z"/></svg>',
        repost: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11a2 2 0 0 1 2 2v5"/><path d="M17 4l3 3-3 3"/><path d="M17 17H6a2 2 0 0 1-2-2v-5"/><path d="M7 20l-3-3 3-3"/></svg>',
        like: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5l-1.1-.96C5.3 14.62 2 11.66 2 8.02 2 5.6 3.9 4 6.2 4c1.64 0 3.22.79 4.2 2.03C11.38 4.79 12.96 4 14.6 4 16.9 4 18.8 5.6 18.8 8.02c0 3.64-3.3 6.6-8.9 11.52z"/></svg>',
        views: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.4-5.5 10-5.5S22 12 22 12s-3.4 5.5-10 5.5S2 12 2 12z"/><circle cx="12" cy="12" r="3.3"/></svg>',
        bookmark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h12v17l-6-3.8-6 3.8z"/></svg>',
        share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c1.4-4.6 5.5-7.5 12-7.5h2"/><path d="M13 5l7 6-7 6"/></svg>',
        more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>'
      };
      return icons[name] || '';
    }

    function buildActionButton(iconName, countText, title, onClick, extraClass = '', disabled = false) {
      return `<button class="action-btn action-icon-btn ${extraClass}" title="${escapeHtml(title)}" onclick="${onClick}" ${disabled ? 'disabled' : ''}><span class="action-icon">${iconSvg(iconName)}</span>${countText !== '' ? `<span class="action-count">${escapeHtml(String(countText))}</span>` : ''}</button>`;
    }

    function buildReplyHtml(reply, postId) {
      const replyTarget = '@' + String(reply.authorName || 'user').replace(/\s+/g, '').toLowerCase();
      return `
        <div class="reply-item">
          <div class="reply-author">${escapeHtml(reply.authorName || "User")}</div>
          <div class="reply-text">${renderRichText(reply.text || "")}</div>
          <div class="reply-time">${escapeHtml(reply.createdAtText || "")}</div>
          ${currentUser ? `<div class="reply-item-actions"><button class="reply-inline-btn" onclick="replyToReply(${postId}, '${replyTarget}')">Reply back</button></div>` : ''}
        </div>
      `;
    }

    function buildPostCard(post, mode = "feed") {
      const isOwner = currentUser && currentUser.id === post.userId;
      const likeCount = post.likes || 0;
      const replies = Array.isArray(post.replies) ? post.replies : [];
      const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
      const alreadyLiked = currentUser ? likedBy.includes(currentUser.id) : false;
      const following = currentUser && Array.isArray(currentUser.following) ? currentUser.following.includes(post.userId) : false;
      const repliesOpen = !!replyOpenState[post.id];
      const replyHtml = replies.length ? replies.map(reply => buildReplyHtml(reply, post.id)).join("") : `<div class="reply-item"><div class="reply-text">No replies yet.</div></div>`;
      const likeDisabled = isOwner || alreadyLiked ? "disabled" : "";
      const followButton = !post.system && currentUser && !isOwner ? `<button class="follow-btn" onclick="toggleFollow(${post.userId})">${following ? "Following" : "Follow"}</button>` : "";
      const authorProfile = getPostAuthorProfile(post);
      const displayName = authorProfile?.username || post.authorName || "Unknown user";
      const handle = authorProfile?.username ? "@" + authorProfile.username.replace(/\s+/g, '').toLowerCase() : (post.userId ? "@" + (post.authorName || 'user').replace(/\s+/g, '').toLowerCase() : (post.category || 'system'));
      return `
        <div class="post-card-shell" id="post-card-${post.id}">
        <div class="post-header">
          ${post.userId ? `<div class="clickable-user" onclick="openUserProfile(${post.userId})">${renderAvatar(authorProfile, displayName, "avatar")}</div>` : renderAvatar(authorProfile, displayName, "avatar")}
          <div style="flex:1; min-width:0;">
            <div class="post-name ${post.userId ? 'clickable-user' : ''}" ${post.userId ? `onclick="openUserProfile(${post.userId})"` : ''}>${escapeHtml(displayName)}</div>
            <div class="post-handle">${escapeHtml(handle)} · ${formatTime(post.createdAt || Date.now())}</div>
          </div>
          ${followButton}
        </div>
        <div class="post-content">${renderRichText(post.content)}</div>
        ${post.imageUrl ? `<img class="post-image" src="${post.imageUrl}" alt="Post image">` : ""}
        <div class="post-meta">${post.category ? `${escapeHtml(post.category)}` : "Post"}${post.hashtags?.length ? ` · ${post.hashtags.map(tag => escapeHtml(tag)).join(' ')}` : ''}</div>
        ${post.system ? "" : `
        <div class="post-actions">
          <div class="post-actions-left">
            ${buildActionButton('comment', replies.length, repliesOpen ? 'Hide replies' : 'Open replies', `toggleReplies(${post.id})`, 'secondary-btn')}
            ${buildActionButton('repost', post.reposts || 0, isOwner ? 'Repost your post' : 'Repost', `repostPost(${post.id})`, 'secondary-btn', !currentUser)}
            ${buildActionButton('like', likeCount, isOwner ? 'Your post' : alreadyLiked ? 'Liked' : 'Like', `likePost(${post.id})`, 'like-btn', Boolean(likeDisabled))}
            ${buildActionButton('views', post.views || 0, 'Views', 'return false;', 'secondary-btn', true)}
            ${buildActionButton('bookmark', Array.isArray(post.bookmarkedBy) ? post.bookmarkedBy.length : 0, 'Save post', `bookmarkPost(${post.id})`, 'secondary-btn', !currentUser)}
            ${buildActionButton('share', '', 'Share post', `sharePost(${post.id})`, 'secondary-btn')}
          </div>
          <div class="post-actions-right">
            ${buildActionButton('more', '', 'More', `togglePostMenu(${post.id})`, 'secondary-btn')}
          </div>
        </div>
        <div id="postMenu-${post.id}" class="post-menu">
          <button class="post-menu-item" type="button" onclick="menuBookmarkPost(${post.id})">
            <span>Bookmark<small>Save this post for later</small></span>
            <span>${Array.isArray(post.bookmarkedBy) ? post.bookmarkedBy.length : 0}</span>
          </button>
          <button class="post-menu-item" type="button" onclick="togglePinToProfile(${post.id})" ${isOwner ? '' : 'disabled'}>
            <span>${post.pinnedToProfile ? 'Unpin from profile' : 'Pin to profile'}<small>Keep it at the top of your profile</small></span>
          </button>
          <button class="post-menu-item" type="button" onclick="showPostAnalytics(${post.id})" ${isOwner ? '' : 'disabled'}>
            <span>Post Analytics<small>Views, likes, replies, reposts, bookmarks</small></span>
          </button>
          <button class="post-menu-item" type="button" onclick="setWhoCanReply(${post.id})" ${isOwner ? '' : 'disabled'}>
            <span>Who can reply?<small>${escapeHtml(post.replyPermissionLabel || 'Everyone can reply')}</small></span>
          </button>
          <button class="post-menu-item" type="button" onclick="editPost(${post.id})" ${isOwner ? '' : 'disabled'}>
            <span>Edit<small>Make changes to this post</small></span>
          </button>
          <button class="post-menu-item danger" type="button" onclick="deletePost(${post.id})" ${isOwner ? '' : 'disabled'}>
            <span>Delete<small>Remove this post</small></span>
          </button>
        </div>
        <div class="reply-box ${repliesOpen ? '' : 'collapsed'}">
          <div class="reply-title">Replies</div>
          <div class="reply-list">${replyHtml}</div>
          ${currentUser ? `
            <div class="reply-form">
              <div class="composer-wrap">
                <textarea id="replyInput-${post.id}" placeholder="Write a reply..."></textarea>
                <div id="replySuggestions-${post.id}" class="tag-suggestions"></div>
              </div>
              <button type="button" class="reply-submit-btn" onclick="submitReply(${post.id})">Reply</button>
            </div>` : `<div class="reply-item"><div class="reply-text">Login to reply.</div></div>`}
        </div>
        </div>`}
      `;
    }

    function renderFeed(containerId, posts, emptyText) {
      const container = document.getElementById(containerId);
      container.innerHTML = "";
      if (!posts.length) {
        container.innerHTML = `<div class="empty-message">${emptyText}</div>`;
        return;
      }
      posts.forEach(post => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = buildPostCard(post);
        container.appendChild(card);
      });
    }

    function canUserSeePost(post, viewer) {
      if (!post) return false;
      const visibility = (post.visibility || post.audience || 'public').toLowerCase();
      if (!post.userId) return true;
      if (visibility === 'private' || visibility === 'onlyme') {
        return Boolean(viewer && viewer.id === post.userId);
      }
      if (visibility === 'followers' || visibility === 'following') {
        if (!viewer) return false;
        if (viewer.id === post.userId) return true;
        const followingIds = Array.isArray(viewer.following) ? viewer.following : [];
        return followingIds.includes(post.userId);
      }
      return true;
    }

    function getFilteredPosts() {
      const query = document.getElementById("globalSearch").value.trim().toLowerCase();
      const posts = getPosts()
        .filter(post => canUserSeePost(post, currentUser))
        .sort((a, b) => b.createdAt - a.createdAt);
      if (!query) return posts;
      const cleanUserQuery = query.replace(/^@/, '');
      const cleanTagQuery = query.replace(/^#/, '');
      return posts.filter(post => {
        const authorProfile = getPostAuthorProfile(post);
        return (post.content || '').toLowerCase().includes(query) ||
          (post.authorName || '').toLowerCase().includes(cleanUserQuery) ||
          (authorProfile?.username || '').toLowerCase().includes(cleanUserQuery) ||
          (Array.isArray(post.hashtags) ? post.hashtags.join(' ') : '').toLowerCase().includes(cleanTagQuery);
      });
    }

    function loadPosts() {
      const posts = getFilteredPosts();
      renderFeed("postsContainer", posts, "No posts yet. Click the Post button to create your first post.");
      loadFollowing();
      loadExplore();
      loadProfile();
      loadNotifications();
    }

    function loadFollowing() {
      const posts = getPosts().sort((a, b) => b.createdAt - a.createdAt);
      const followingIds = currentUser && Array.isArray(currentUser.following) ? currentUser.following : [];
      const followingPosts = posts.filter(post => followingIds.includes(post.userId));
      renderFeed("followingContainer", followingPosts, currentUser ? "Follow some people and their posts will show up here." : "Login to see your following feed.");
    }

    function setExploreFilter(filter, button) {
      exploreFilter = filter;
      document.querySelectorAll('.chip-row .chip').forEach(chip => chip.classList.remove('active'));
      button.classList.add('active');
      loadExplore();
    }

    function loadExplore() {
      const query = document.getElementById('globalSearch')?.value.trim().toLowerCase() || '';
      renderSearchPanels(query);
      const userPosts = getFilteredPosts().map(post => ({ ...post, category: post.category || 'trending' }));
      let explorePosts = [...seededExploreTopics, ...userPosts]
        .filter(post => canUserSeePost(post, currentUser))
        .sort((a, b) => b.createdAt - a.createdAt);
      if (exploreFilter !== 'all') {
        explorePosts = explorePosts.filter(post => (post.category || '').toLowerCase() === exploreFilter);
      }
      renderFeed('exploreContainer', explorePosts, query ? 'No matching posts for this search yet.' : 'Nothing to explore yet.');
    }

    function loadNotifications() {
      const container = document.getElementById('notificationsContainer');
      if (!currentUser) {
        container.innerHTML = `<div class="empty-message">Login to see notifications.</div>`;
        return;
      }
      syncCurrentUser();
      const notifications = Array.isArray(currentUser.notifications) ? currentUser.notifications : [];
      if (!notifications.length) {
        container.innerHTML = `<div class="empty-message">No notifications yet.</div>`;
        return;
      }
      container.innerHTML = notifications.map(item => `
        <div class="notification-item" style="margin-bottom: 12px;">
          <div class="notification-avatar">${escapeHtml(initials(item.text))}</div>
          <div>
            <div class="notification-text">${escapeHtml(item.text)}</div>
            <div class="notification-time">${formatTime(item.createdAt)}</div>
          </div>
        </div>
      `).join('');
    }

    function safeExternalLink(value) {
      const raw = String(value || '').trim();
      if (!raw) return '';
      return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    }

    function buildProfileMeta(activeProfile) {
      const settings = getUserSettingsData(activeProfile);
      const items = [];
      if (settings.pronouns) items.push(`<span class="profile-meta-pill">${escapeHtml(settings.pronouns)}</span>`);
      if (settings.location) items.push(`<span class="profile-meta-pill">📍 ${escapeHtml(settings.location)}</span>`);
      if (settings.occupation) items.push(`<span class="profile-meta-pill">💼 ${escapeHtml(settings.occupation)}</span>`);
      if (settings.creatorMode && settings.creatorCategory) items.push(`<span class="profile-meta-pill">🎥 ${escapeHtml(settings.creatorCategory)}</span>`);
      if (!items.length) items.push(`<span class="profile-meta-pill">Customize more profile details in settings</span>`);
      return items.join('');
    }

    function buildProfileAbout(activeProfile, profilePosts) {
      const settings = getUserSettingsData(activeProfile);
      const rows = [];
      rows.push(`<div><strong>Status</strong>${escapeHtml(settings.status || 'No status set yet.')}</div>`);
      rows.push(`<div><strong>About</strong>${escapeHtml(activeProfile?.bio || 'Add a bio in settings to tell people what you do.')}</div>`);
      rows.push(`<div><strong>Profile vibe</strong>${escapeHtml(settings.profileLayout === 'clean' ? 'Clean minimal' : 'Modern creator card')}</div>`);
      rows.push(`<div><strong>Activity</strong>${profilePosts.length ? `Posted ${profilePosts.length} time${profilePosts.length === 1 ? '' : 's'} so far.` : 'No posts yet.'}</div>`);
      return rows.join('');
    }

    function buildProfileLinks(activeProfile) {
      const settings = getUserSettingsData(activeProfile);
      const links = [];
      if (settings.linkVisibility !== false && settings.website) links.push(`<a class="profile-link-chip" href="${escapeAttribute(safeExternalLink(settings.website))}" target="_blank" rel="noopener noreferrer">🌐 Website</a>`);
      if (settings.linkVisibility !== false && settings.youtube) links.push(`<a class="profile-link-chip" href="${escapeAttribute(safeExternalLink(settings.youtube))}" target="_blank" rel="noopener noreferrer">▶ YouTube</a>`);
      if (settings.linkVisibility !== false && settings.twitch) links.push(`<a class="profile-link-chip" href="${escapeAttribute(safeExternalLink(settings.twitch))}" target="_blank" rel="noopener noreferrer">🟣 Twitch</a>`);
      if (settings.linkVisibility !== false && settings.kick) links.push(`<a class="profile-link-chip" href="${escapeAttribute(safeExternalLink(settings.kick))}" target="_blank" rel="noopener noreferrer">🟢 Kick</a>`);
      if (settings.linkVisibility !== false && settings.facebook) links.push(`<a class="profile-link-chip" href="${escapeAttribute(safeExternalLink(settings.facebook))}" target="_blank" rel="noopener noreferrer">📘 Facebook</a>`);
      if (!links.length) links.push('<div class="profile-link-chip">No public links yet</div>');
      return links.join('');
    }

    function loadProfile() {
      const users = getUsers();
      const posts = getPosts().sort((a, b) => b.createdAt - a.createdAt);
      const activeProfile = viewedProfileId ? getProfileByUserId(viewedProfileId) : (currentUser ? getProfileByUserId(currentUser.id) : null);
      const profileName = activeProfile?.username || 'Guest';
      const settings = getUserSettingsData(activeProfile);
      const profileHandle = '@' + (profileName || 'guest').replace(/\s+/g, '').toLowerCase();
      const profileBio = activeProfile?.bio || 'Add a bio in settings.';
      const profilePosts = activeProfile ? posts.filter(post => post.userId === activeProfile.id) : [];
      const pinnedCount = profilePosts.filter(post => post.pinnedToProfile).length;
      const followingCount = Array.isArray(activeProfile?.following) ? activeProfile.following.length : 0;
      const followerCount = activeProfile ? users.filter(user => Array.isArray(user.following) && user.following.includes(activeProfile.id)).length : 0;
      const badgeText = settings.creatorMode ? (settings.creatorCategory || 'Creator mode') : (profilePosts.length >= 5 ? 'Active profile' : 'New here');
      const headline = settings.tagline || settings.status || 'Customize your tagline, status, and creator style in settings.';

      const avatarEl = document.getElementById('profileAvatar');
      avatarEl.innerHTML = activeProfile?.avatarUrl
        ? `<img src="${activeProfile.avatarUrl}" alt="${escapeHtml(profileName)}">`
        : escapeHtml(initials(profileName));
      document.getElementById('profileName').textContent = profileName;
      document.getElementById('profileHandle').textContent = profileHandle;
      document.getElementById('profileBio').textContent = profileBio;
      document.getElementById('profileHeadline').textContent = headline;
      document.getElementById('profileBadge').textContent = badgeText;
      document.getElementById('profilePostCount').textContent = profilePosts.length;
      document.getElementById('profileFollowingCount').textContent = followingCount;
      document.getElementById('profileFollowerCount').textContent = followerCount;
      document.getElementById('profilePinnedCount').textContent = pinnedCount;
      document.getElementById('profileMetaRow').innerHTML = buildProfileMeta(activeProfile);
      document.getElementById('profileAboutList').innerHTML = buildProfileAbout(activeProfile, profilePosts);
      document.getElementById('profileLinks').innerHTML = buildProfileLinks(activeProfile);
      renderFeed('profileContent', profilePosts, activeProfile ? 'No posts yet.' : 'Login to view your profile.');
      loadSettings();
    }

    function loadSettings() {
      renderSettingsDetails();
    }

    function resolveTheme(themeSetting) {
      if (themeSetting === 'dark' || themeSetting === 'light') return themeSetting;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function getAccentPalette(name) {
      const palette = {
        green: { accent: '#10a37f', hover: '#14b88e' },
        blue: { accent: '#3b82f6', hover: '#60a5fa' },
        purple: { accent: '#8b5cf6', hover: '#a78bfa' },
        pink: { accent: '#ec4899', hover: '#f472b6' },
        orange: { accent: '#f97316', hover: '#fb923c' }
      };
      return palette[name] || palette.green;
    }

    function applyAppearancePreferences() {
      const settings = getUserSettingsData(currentUser);
      const palette = getAccentPalette(settings.profileAccent || 'green');
      document.documentElement.style.setProperty('--accent', palette.accent);
      document.documentElement.style.setProperty('--accent-hover', palette.hover);
      document.body.classList.toggle('compact-mode', !!settings.compactMode);
      document.body.classList.toggle('reduce-motion', !!settings.reduceMotion);
      document.body.classList.toggle('high-contrast', !!settings.highContrast);
      document.body.classList.toggle('larger-text', !!settings.largerText);
    }

    function applyTheme() {
      const themeSetting = currentUser?.settings?.theme || 'system';
      const resolved = resolveTheme(themeSetting);
      document.body.classList.remove('theme-dark', 'theme-light');
      document.body.classList.add(`theme-${resolved}`);
      applyAppearancePreferences();
    }


    async function saveSettings() {
      if (!currentUser) {
        setStatus('settingsStatus', 'Please login first.', true);
        return;
      }
      const displayName = document.getElementById('settingsDisplayName')?.value.trim() || currentUser.username || '';
      const username = document.getElementById('settingsUsername')?.value.trim() || displayName;
      const bio = document.getElementById('settingsBio')?.value.trim() || currentUser.bio || '';
      const avatarFile = document.getElementById('settingsAvatarUpload')?.files?.[0];
      if (!username) {
        setStatus('settingsStatus', 'Username is required.', true);
        return;
      }
      let avatarUrl = currentUser?.avatarUrl || '';
      if (avatarFile) avatarUrl = await fileToBase64(avatarFile);

      const existingSettings = getUserSettingsData(currentUser);
      const nextSettings = {
        ...existingSettings,
        phone: document.getElementById('settingsPhone')?.value.trim() ?? existingSettings.phone,
        location: document.getElementById('settingsLocation')?.value.trim() ?? existingSettings.location,
        website: document.getElementById('settingsWebsite')?.value.trim() ?? existingSettings.website,
        passwordHint: document.getElementById('settingsPasswordHint')?.value.trim() ?? existingSettings.passwordHint,
        birthday: document.getElementById('settingsBirthday')?.value.trim() ?? existingSettings.birthday,
        gender: document.getElementById('settingsGender')?.value ?? existingSettings.gender,
        language: document.getElementById('settingsLanguage')?.value || existingSettings.language,
        accountEmail: document.getElementById('settingsEmail')?.value.trim() ?? existingSettings.accountEmail,
        facebook: document.getElementById('settingsFacebook')?.value.trim() ?? existingSettings.facebook,
        youtube: document.getElementById('settingsYoutube')?.value.trim() ?? existingSettings.youtube,
        twitch: document.getElementById('settingsTwitch')?.value.trim() ?? existingSettings.twitch,
        kick: document.getElementById('settingsKick')?.value.trim() ?? existingSettings.kick,
        pronouns: document.getElementById('settingsPronouns')?.value.trim() ?? existingSettings.pronouns,
        status: document.getElementById('settingsStatusText')?.value.trim() ?? existingSettings.status,
        tagline: document.getElementById('settingsTagline')?.value.trim() ?? existingSettings.tagline,
        occupation: document.getElementById('settingsOccupation')?.value.trim() ?? existingSettings.occupation,
        creatorCategory: document.getElementById('settingsCreatorCategory')?.value.trim() ?? existingSettings.creatorCategory,
        profileAccent: document.getElementById('settingsProfileAccent')?.value || existingSettings.profileAccent || 'green',
        profileLayout: document.getElementById('settingsProfileLayout')?.value || existingSettings.profileLayout || 'modern',
        accountPrivate: document.getElementById('settingsPrivateAccount')?.checked ?? existingSettings.accountPrivate,
        allowMessages: document.getElementById('settingsAllowMessages')?.checked ?? existingSettings.allowMessages,
        allowTagging: document.getElementById('settingsAllowTagging')?.checked ?? existingSettings.allowTagging,
        linkVisibility: document.getElementById('settingsLinkVisibility')?.checked ?? existingSettings.linkVisibility,
        showSensitive: document.getElementById('settingsShowSensitive')?.checked ?? existingSettings.showSensitive,
        notifyPosts: document.getElementById('settingsNotifyPosts')?.checked ?? existingSettings.notifyPosts,
        notifyFollows: document.getElementById('settingsNotifyFollows')?.checked ?? existingSettings.notifyFollows,
        notifyReplies: document.getElementById('settingsNotifyReplies')?.checked ?? existingSettings.notifyReplies,
        notifyMentions: document.getElementById('settingsNotifyMentions')?.checked ?? existingSettings.notifyMentions,
        notifyMarketing: document.getElementById('settingsNotifyMarketing')?.checked ?? existingSettings.notifyMarketing,
        creatorMode: document.getElementById('settingsCreatorMode')?.checked ?? existingSettings.creatorMode,
        autoPlayMedia: document.getElementById('settingsAutoplayMedia')?.checked ?? existingSettings.autoPlayMedia,
        compactMode: document.getElementById('settingsCompactMode')?.checked ?? existingSettings.compactMode,
        highContrast: document.getElementById('settingsHighContrast')?.checked ?? existingSettings.highContrast,
        reduceMotion: document.getElementById('settingsReduceMotion')?.checked ?? existingSettings.reduceMotion,
        largerText: document.getElementById('settingsLargerText')?.checked ?? existingSettings.largerText,
        theme: document.getElementById('settingsTheme')?.value || existingSettings.theme || 'system'
      };

      const updated = updateUserRecord(currentUser.id, user => {
        user.username = username || displayName || user.username;
        user.bio = bio;
        user.avatarUrl = avatarUrl;
        user.settings = nextSettings;
        if (!Array.isArray(user.following)) user.following = [];
        if (!Array.isArray(user.notifications)) user.notifications = [];
        return user;
      });
      currentUser = {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        bio: updated.bio || '',
        following: updated.following || [],
        notifications: updated.notifications || [],
        avatarUrl: updated.avatarUrl || '',
        settings: updated.settings || nextSettings
      };
      saveCurrentUser(currentUser);
      const posts = getPosts();
      posts.forEach(post => {
        if (post.userId === currentUser.id) post.authorName = currentUser.username;
        if (Array.isArray(post.replies)) {
          post.replies.forEach(reply => {
            if (reply.authorId === currentUser.id) reply.authorName = currentUser.username;
          });
        }
      });
      savePosts(posts);
      setStatus('settingsStatus', 'Settings saved. Your profile look has been updated.');
      renderAll();
      renderSettingsDetails();
    }

    function toggleReplies(postId) {
      replyOpenState[postId] = !replyOpenState[postId];
      renderAll();
    }

    function replyToReply(postId, replyTarget) {
      replyOpenState[postId] = true;
      renderAll();
      const input = document.getElementById(`replyInput-${postId}`);
      if (!input) return;
      const prefix = String(replyTarget || '').trim();
      input.value = `${prefix} `.trim() + ' ';
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      updateTagSuggestions(`replyInput-${postId}`, `replySuggestions-${postId}`);
    }

    function toggleFollow(targetUserId) {
      if (!currentUser) {
        alert('Please login first.');
        return;
      }
      if (currentUser.id === targetUserId) return;
      const target = getUserRecord(targetUserId);
      const updated = updateUserRecord(currentUser.id, user => {
        if (!Array.isArray(user.following)) user.following = [];
        const exists = user.following.includes(targetUserId);
        user.following = exists ? user.following.filter(id => id !== targetUserId) : [...user.following, targetUserId];
        return user;
      });
      const nowFollowing = updated.following.includes(targetUserId);
      currentUser = {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        bio: updated.bio || '',
        following: updated.following || [],
        notifications: updated.notifications || [],
        avatarUrl: updated.avatarUrl || '',
        settings: updated.settings || getUserSettingsData(updated)
      };
      saveCurrentUser(currentUser);
      if (nowFollowing && target) {
        addNotification(targetUserId, `${currentUser.username} started following you.`, 'follow');
      }
      renderAll();
    }

    function repostPost(id) {
      if (!currentUser) {
        alert('Login to repost.');
        return;
      }
      const posts = getPosts();
      const post = posts.find(item => item.id === id);
      if (!post) return;
      if (!Array.isArray(post.repostedBy)) post.repostedBy = [];
      if (post.repostedBy.includes(currentUser.id)) {
        alert('You already reposted this post.');
        return;
      }
      post.repostedBy.push(currentUser.id);
      post.reposts = (post.reposts || 0) + 1;
      savePosts(posts);
      if (post.userId && post.userId !== currentUser.id) addNotification(post.userId, `${currentUser.username} reposted your post.`, 'post');
      renderAll();
    }

    function bookmarkPost(id) {
      if (!currentUser) {
        alert('Login to save posts.');
        return;
      }
      const posts = getPosts();
      const post = posts.find(item => item.id === id);
      if (!post) return;
      if (!Array.isArray(post.bookmarkedBy)) post.bookmarkedBy = [];
      const alreadySaved = post.bookmarkedBy.includes(currentUser.id);
      post.bookmarkedBy = alreadySaved ? post.bookmarkedBy.filter(userId => userId !== currentUser.id) : [...post.bookmarkedBy, currentUser.id];
      savePosts(posts);
      renderAll();
    }

    function sharePost(id) {
      const post = getPosts().find(item => item.id === id);
      if (!post) return;
      const author = getPostAuthorProfile(post)?.username || post.authorName || 'user';
      const shareText = `${author}: ${post.content || ''}`.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(() => {
          alert('Post copied.');
        }).catch(() => {
          alert(shareText);
        });
      } else {
        alert(shareText);
      }
    }

    function closeAllPostMenus() {
      document.querySelectorAll('.post-menu.active').forEach(menu => menu.classList.remove('active'));
    }

    function togglePostMenu(id) {
      const menu = document.getElementById(`postMenu-${id}`);
      if (!menu) return;
      const shouldOpen = !menu.classList.contains('active');
      closeAllPostMenus();
      if (shouldOpen) menu.classList.add('active');
    }

    function menuBookmarkPost(id) {
      bookmarkPost(id);
      closeAllPostMenus();
    }

    function togglePinToProfile(id) {
      if (!currentUser) return;
      const posts = getPosts();
      const post = posts.find(p => p.id === id && p.userId === currentUser.id);
      if (!post) return;
      posts.forEach(p => {
        if (p.userId === currentUser.id && p.id !== id) p.pinnedToProfile = false;
      });
      post.pinnedToProfile = !post.pinnedToProfile;
      savePosts(posts);
      closeAllPostMenus();
      renderAll();
    }

    function showPostAnalytics(id) {
      const post = getPosts().find(item => item.id === id);
      if (!post) return;
      alert(`Post Analytics

Views: ${post.views || 0}
Likes: ${post.likes || 0}
Replies: ${Array.isArray(post.replies) ? post.replies.length : 0}
Reposts: ${post.reposts || 0}
Bookmarks: ${Array.isArray(post.bookmarkedBy) ? post.bookmarkedBy.length : 0}`);
      closeAllPostMenus();
    }

    function setWhoCanReply(id) {
      if (!currentUser) return;
      const posts = getPosts();
      const post = posts.find(p => p.id === id && p.userId === currentUser.id);
      if (!post) return;
      const options = ['everyone', 'following', 'mentioned'];
      const current = post.replyPermission || 'everyone';
      const answer = prompt('Who can reply? Type: everyone, following, or mentioned', current);
      if (!answer) return;
      const value = answer.trim().toLowerCase();
      if (!options.includes(value)) {
        alert('Use everyone, following, or mentioned.');
        return;
      }
      post.replyPermission = value;
      post.replyPermissionLabel = value === 'everyone' ? 'Everyone can reply' : value === 'following' ? 'People you follow can reply' : 'Only mentioned people can reply';
      savePosts(posts);
      closeAllPostMenus();
      renderAll();
    }

    function likePost(id) {
      if (!currentUser) {
        alert('Please login first.');
        return;
      }
      const posts = getPosts();
      const post = posts.find(p => p.id === id);
      if (!post) return;
      if (post.userId === currentUser.id) {
        alert("You can't like your own post.");
        return;
      }
      if (!Array.isArray(post.likedBy)) post.likedBy = [];
      if (post.likedBy.includes(currentUser.id)) return;
      post.likedBy.push(currentUser.id);
      post.likes = (post.likes || 0) + 1;
      savePosts(posts);
      if (post.userId) addNotification(post.userId, `${currentUser.username} liked your post.`, 'like');
      renderAll();
    }

    function submitReply(postId) {
      if (!currentUser) {
        alert('Please login first.');
        return;
      }
      const input = document.getElementById(`replyInput-${postId}`);
      if (!input) return;
      const text = input.value.trim();
      if (!text) {
        alert('Write a reply first.');
        return;
      }
      const posts = getPosts();
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const replyPermission = post.replyPermission || 'everyone';
      const followingIds = Array.isArray(currentUser.following) ? currentUser.following : [];
      const isMentioned = (post.content || '').toLowerCase().includes('@' + (currentUser.username || '').toLowerCase()) || (post.content || '').toLowerCase().includes('#' + (currentUser.username || '').toLowerCase());
      if (replyPermission === 'following' && !followingIds.includes(post.userId) && currentUser.id !== post.userId) {
        alert('Only people the author follows can reply to this post.');
        return;
      }
      if (replyPermission === 'mentioned' && !isMentioned && currentUser.id !== post.userId) {
        alert('Only mentioned people can reply to this post.');
        return;
      }
      if (!Array.isArray(post.replies)) post.replies = [];
      post.replies.push({
        authorId: currentUser.id,
        authorName: currentUser.username || currentUser.email || 'User',
        text,
        createdAtText: new Date().toLocaleString()
      });
      savePosts(posts);
      if (post.userId) addNotification(post.userId, `${currentUser.username} replied to your post.`, 'reply');
      notifyMentionedUsers(text, currentUser.username || 'Someone', 'a reply', [currentUser.id, post.userId]);
      replyOpenState[postId] = true;
      renderAll();
    }

    function deletePost(id) {
      if (!currentUser) {
        alert('You need to be logged in.');
        return;
      }
      const posts = getPosts();
      const target = posts.find(post => post.id === id && post.userId === currentUser.id);
      if (!target) {
        alert('You can only delete your own post.');
        return;
      }
      const confirmed = confirm('Are you sure you want to delete this post everywhere?');
      if (!confirmed) return;
      const remainingPosts = posts.filter(post => post.id !== id);
      savePosts(remainingPosts);
      deletePostsFromBackend([id]);
      replyOpenState[id] = false;
      closeAllPostMenus();
      renderAll();
    }

    function editPost(id) {
      if (!currentUser) {
        alert('You need to be logged in.');
        return;
      }
      const posts = getPosts();
      const post = posts.find(p => p.id === id && p.userId === currentUser.id);
      if (!post) return;
      editingPostId = post.id;
      editingPostImageUrl = post.imageUrl || '';
      editingPostMediaType = post.mediaType || (post.imageUrl ? 'image' : '');
      editingPostExpiresAt = post.expiresAt || null;
      editingPostMediaDurationSeconds = post.mediaDurationSeconds || null;
      document.getElementById('postModalTitle').textContent = 'Edit Post';
      document.getElementById('postSubmitBtn').textContent = 'Save Changes';
      document.getElementById('postContent').value = post.content || '';
      document.getElementById('postImage').value = '';
      composerNotifyFollowers = true;
      syncNotifyFollowersButton();
      openModal('postModal');
    }

    function openCreatePostModal() {
      if (!currentUser) {
        alert('Please login first.');
        openModal('loginModal');
        return;
      }
      editingPostId = null;
      editingPostImageUrl = '';
      editingPostMediaType = '';
      editingPostExpiresAt = null;
      editingPostMediaDurationSeconds = null;
      document.getElementById('postModalTitle').textContent = 'Create Post';
      document.getElementById('postSubmitBtn').textContent = 'Publish Post';
      document.getElementById('postContent').value = '';
      document.getElementById('postImage').value = '';
      composerNotifyFollowers = true;
      syncNotifyFollowersButton();
      openModal('postModal');
    }

    function renderAll() {
      syncCurrentUser();
      applyTheme();
      updateAccountUI(currentUser);
      loadPosts();
      bindComposerSuggestions('postContent', 'postTagSuggestions');
      getPosts().forEach(post => bindComposerSuggestions(`replyInput-${post.id}`, `replySuggestions-${post.id}`));
    }

    const globalSearchInput = document.getElementById('globalSearch');
    let globalSearchDebounce = null;
    if (globalSearchInput) {
      globalSearchInput.addEventListener('input', () => {
        renderGlobalSearchDropdown();
        window.clearTimeout(globalSearchDebounce);
        globalSearchDebounce = window.setTimeout(() => {
          loadPosts();
        }, 120);
      });
      globalSearchInput.addEventListener('focus', renderGlobalSearchDropdown);
      globalSearchInput.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          moveSearchDropdownSelection(1);
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          moveSearchDropdownSelection(-1);
          return;
        }
        if (event.key === 'Enter') {
          if (activateSelectedSearchDropdownItem()) {
            event.preventDefault();
            return;
          }
          const exploreButton = document.querySelector('.nav-item[data-page="explore"]');
          showPage('explore', exploreButton);
          loadPosts();
          return;
        }
        if (event.key === 'Escape') {
          hideGlobalSearchDropdown();
        }
      });
      globalSearchInput.addEventListener('blur', function() {
        setTimeout(hideGlobalSearchDropdown, 120);
      });
    }

    document.addEventListener('click', function(event) {
      if (!event.target.closest('.composer-wrap')) {
        document.querySelectorAll('.tag-suggestions').forEach(box => box.classList.remove('active'));
      }
      if (!event.target.closest('.search-box')) {
        hideGlobalSearchDropdown();
      }
    });


    document.getElementById('registerForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      clearStatusMessages();
      const username = document.getElementById('registerUsername').value.trim();
      const email = document.getElementById('registerEmail').value.trim().toLowerCase();
      const password = document.getElementById('registerPassword').value;
      const confirmPassword = document.getElementById('registerConfirmPassword').value;
      if (password !== confirmPassword) {
        setStatus('registerStatus', 'Passwords do not match.', true);
        return;
      }
      const users = getUsers();
      if (users.some(user => user.email === email)) {
        setStatus('registerStatus', 'Email already exists.', true);
        return;
      }
      try {
        let authUserId = null;
        let useLocalAuth = !supabaseClient;
        if (supabaseClient) {
          try {
            const { data, error } = await supabaseClient.auth.signUp({ email, password });
            if (error) throw error;
            authUserId = data.user ? data.user.id : null;
          } catch (authError) {
            const message = String(authError?.message || '');
            if (/already|exists|registered/i.test(message)) throw authError;
            console.warn('Supabase signup unavailable, using local account mode instead.', authError);
            useLocalAuth = true;
          }
        }
        const newUser = {
          id: makeId(),
          authUserId,
          username,
          email,
          bio: '',
          following: [],
          notifications: [],
          avatarUrl: '',
          localPassword: useLocalAuth ? password : ''
        };
        users.push(newUser);
        saveUsers(users);
        currentUser = { id: newUser.id, username: newUser.username, email: newUser.email, bio: '', following: [], notifications: [], avatarUrl: '', settings: getUserSettingsData(newUser), authUserId };
        saveCurrentUser(currentUser);
        updateAccountUI(currentUser);
        closeModal('registerModal');
        renderAll();
      } catch (error) {
        console.error(error);
        setStatus('registerStatus', error.message || 'Could not create account.', true);
      }
    });

    document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      clearStatusMessages();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;
      try {
        const loginFromLocal = () => {
          const users = getUsers();
          const user = users.find(u => u.email === email && (u.localPassword === password || u.password === password));
          if (!user) throw new Error('Invalid email or password.');
          currentUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            bio: user.bio || '',
            following: user.following || [],
            notifications: user.notifications || [],
            avatarUrl: user.avatarUrl || '',
            settings: user.settings || getUserSettingsData(user),
            authUserId: user.authUserId || null
          };
        };

        if (supabaseClient) {
          try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            const authId = data.user ? data.user.id : null;
            await loadBackendState();
            const users = getUsers();
            let user = users.find(u => u.authUserId === authId || u.email === email);
            if (user && !user.authUserId) {
              user.authUserId = authId;
              saveUsers(users);
            }
            if (!user) throw new Error('Account profile not found.');
            currentUser = {
              id: user.id,
              username: user.username,
              email: user.email,
              bio: user.bio || '',
              following: user.following || [],
              notifications: user.notifications || [],
              avatarUrl: user.avatarUrl || '',
              settings: user.settings || getUserSettingsData(user),
              authUserId: user.authUserId || authId
            };
          } catch (authError) {
            console.warn('Supabase login unavailable, trying local account mode.', authError);
            loginFromLocal();
          }
        } else {
          loginFromLocal();
        }
        saveCurrentUser(currentUser);
        updateAccountUI(currentUser);
        closeModal('loginModal');
        renderAll();
      } catch (error) {
        console.error(error);
        setStatus('loginStatus', error.message || 'Invalid email or password.', true);
      }
    });

    document.getElementById('forgotPasswordBtn').addEventListener('click', async function() {
      clearStatusMessages();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      if (!email) {
        setStatus('loginStatus', 'Enter your email first, then tap Forgot password.', true);
        return;
      }
      if (!supabaseClient) {
        setStatus('loginStatus', 'Password reset needs Supabase auth to be configured first.', true);
        return;
      }
      try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.href
        });
        if (error) throw error;
        setStatus('loginStatus', 'Password reset email sent. Check your inbox and spam folder.');
      } catch (error) {
        console.error(error);
        setStatus('loginStatus', error.message || 'Could not send password reset email.', true);
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', function() {
      currentUser = null;
      clearCurrentUser();
      updateAccountUI(null);
      renderAll();
    });

    document.getElementById('postForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      clearStatusMessages();
      if (!currentUser) {
        setStatus('postStatus', 'Please login first.', true);
        return;
      }
      const content = document.getElementById('postContent').value.trim();
      const imageFile = document.getElementById('postImage').files[0];
      const hashtags = extractHashtags(content);
      const category = getPostCategory(content);
      if (!content) {
        setStatus('postStatus', 'Please write something.', true);
        return;
      }
      try {
        setStatus('postStatus', 'Saving post...');
        let imageUrl = editingPostImageUrl;
        if (imageFile) imageUrl = await fileToBase64(imageFile);
        const posts = getPosts();
        if (editingPostId) {
          const post = posts.find(p => p.id === editingPostId && p.userId === currentUser.id);
          if (post) {
            post.content = content;
            post.imageUrl = imageUrl;
            post.hashtags = hashtags;
            post.category = category;
            post.edited = true;
          }
        } else {
          const newPost = {
            id: makeId(),
            content,
            imageUrl,
            likes: 0,
            likedBy: [],
            replies: [],
            userId: currentUser.id,
            authorName: currentUser.username || currentUser.email || 'User',
            authorEmail: currentUser.email || '',
            category,
            hashtags,
            createdAt: Date.now()
          };
          posts.push(newPost);
          if (composerNotifyFollowers) {
            getFollowersOfUser(currentUser.id).forEach(follower => addNotification(follower.id, `${currentUser.username} posted something new.`, 'post'));
          }
          notifyMentionedUsers(content, currentUser.username || 'Someone', 'a post', [currentUser.id]);
        }
        savePosts(posts);
        document.getElementById('postContent').value = '';
        document.getElementById('postImage').value = '';
        editingPostId = null;
        editingPostImageUrl = '';
        closeModal('postModal');
        renderAll();
        const homeButton = document.querySelector('.nav-item[data-page="home"]');
        showPage('home', homeButton);
      } catch (error) {
        console.error(error);
        setStatus('postStatus', 'Could not save post.', true);
      }
    });

    window.addEventListener('click', function(e) {
      ['loginModal', 'registerModal', 'postModal'].forEach(id => {
        const modal = document.getElementById(id);
        if (e.target === modal) closeModal(id);
      });
    });

    window.addEventListener('storage', function(e) {
      if (["random_posts", "random_users", "random_current_user"].includes(e.key)) {
        currentUser = getCurrentUser();
        renderAll();
      }
    });

    currentUser = getCurrentUser();

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.post-actions-right') && !event.target.closest('.post-menu')) {
        closeAllPostMenus();
      }
    });

    let composerDraftId = null;

    function getUserFollowersCount(userId) {
      return getFollowersOfUser(userId).length;
    }

    function getVerificationLevelByUserId(userId) {
      const followers = getUserFollowersCount(userId);
      if (followers >= 100000) return 'verified';
      if (followers >= 1000) return 'preverified';
      return '';
    }

    function getVerificationBadgeHtml(userId) {
      const level = getVerificationLevelByUserId(userId);
      if (level === 'verified') return '<span class="verified-badge" title="Verified">✓</span>';
      if (level === 'preverified') return '<span class="preverified-badge" title="Pre-verified">✓</span>';
      return '';
    }

    function getDraftStorageKey() {
      return currentUser ? `random_drafts_${currentUser.id}` : 'random_drafts_guest';
    }

    function getDrafts() {
      if (!currentUser) return [];
      return JSON.parse(localStorage.getItem(getDraftStorageKey())) || [];
    }

    function saveDrafts(drafts) {
      if (!currentUser) return;
      localStorage.setItem(getDraftStorageKey(), JSON.stringify(drafts.slice(0, 25)));
    }

    function triggerPostMediaPicker() {
      document.getElementById('postImage')?.click();
    }

    function insertComposerToken(token) {
      const textarea = document.getElementById('postContent');
      if (!textarea) return;
      const start = textarea.selectionStart ?? textarea.value.length;
      const end = textarea.selectionEnd ?? textarea.value.length;
      textarea.value = textarea.value.slice(0, start) + token + textarea.value.slice(end);
      const nextPos = start + token.length;
      textarea.focus();
      textarea.setSelectionRange(nextPos, nextPos);
      updateTagSuggestions('postContent', 'postTagSuggestions');
    }

    function syncNotifyFollowersButton() {
      const btn = document.getElementById('notifyFollowersBtn');
      if (!btn) return;
      btn.classList.toggle('active', composerNotifyFollowers);
      btn.setAttribute('aria-pressed', composerNotifyFollowers ? 'true' : 'false');
    }

    function toggleNotifyFollowers() {
      composerNotifyFollowers = !composerNotifyFollowers;
      syncNotifyFollowersButton();
    }

    function insertPollTemplate() {
      insertComposerToken('\n📊 Poll\nOption 1:\nOption 2:\n');
    }

    function loadDraftsList() {
      const wrap = document.getElementById('draftsWrap');
      if (!wrap) return;
      if (!currentUser) { wrap.innerHTML = ''; return; }
      const drafts = getDrafts();
      if (!drafts.length) {
        wrap.innerHTML = '<div class="muted" style="padding:4px 2px;">No drafts yet.</div>';
        return;
      }
      wrap.innerHTML = drafts.map(draft => `
        <div class="draft-item">
          <div class="draft-item-main">
            <div class="draft-item-title">Draft</div>
            <div class="draft-item-preview">${escapeHtml((draft.content || '').slice(0, 120) || 'Empty draft')}</div>
          </div>
          <div class="draft-item-actions">
            <button type="button" class="draft-chip-btn" onclick="loadDraftIntoComposer(${draft.id})">Open</button>
            <button type="button" class="draft-chip-btn" onclick="deleteComposerDraft(${draft.id})">Delete</button>
          </div>
        </div>
      `).join('');
    }

    async function saveComposerDraft() {
      if (!currentUser) {
        setStatus('postStatus', 'Login first to save drafts.', true);
        return;
      }
      const content = document.getElementById('postContent')?.value.trim() || '';
      const mediaFile = document.getElementById('postImage')?.files?.[0];
      const replyPermission = document.getElementById('postReplyPermission')?.value || 'everyone';
      const media = await getComposerMediaPayload(mediaFile, {
        imageUrl: editingPostImageUrl || '',
        mediaType: editingPostMediaType || '',
        expiresAt: editingPostExpiresAt,
        mediaDurationSeconds: editingPostMediaDurationSeconds
      });
      const drafts = getDrafts();
      const payload = {
        id: composerDraftId || makeId(),
        content,
        imageUrl: media.imageUrl,
        mediaType: media.mediaType,
        expiresAt: media.expiresAt,
        mediaDurationSeconds: media.mediaDurationSeconds,
        replyPermission,
        notifyFollowers: composerNotifyFollowers,
        updatedAt: Date.now()
      };
      const idx = drafts.findIndex(d => d.id === payload.id);
      if (idx >= 0) drafts[idx] = payload; else drafts.unshift(payload);
      composerDraftId = payload.id;
      editingPostImageUrl = media.imageUrl;
      editingPostMediaType = media.mediaType;
      editingPostExpiresAt = media.expiresAt;
      editingPostMediaDurationSeconds = media.mediaDurationSeconds;
      saveDrafts(drafts.sort((a,b)=>b.updatedAt-a.updatedAt));
      loadDraftsList();
      setStatus('postStatus', 'Draft saved.');
    }

    function loadDraftIntoComposer(id) {
      const draft = getDrafts().find(d => d.id === id);
      if (!draft) return;
      composerDraftId = draft.id;
      editingPostId = null;
      editingPostImageUrl = draft.imageUrl || '';
      editingPostMediaType = draft.mediaType || (draft.imageUrl ? 'image' : '');
      editingPostExpiresAt = draft.expiresAt || null;
      editingPostMediaDurationSeconds = draft.mediaDurationSeconds || null;
      document.getElementById('postModalTitle').textContent = 'Draft';
      document.getElementById('postSubmitBtn').textContent = 'Publish Post';
      document.getElementById('postContent').value = draft.content || '';
      document.getElementById('postReplyPermission').value = draft.replyPermission || 'everyone';
      document.getElementById('postImage').value = '';
      composerNotifyFollowers = draft.notifyFollowers !== false;
      syncNotifyFollowersButton();
      openModal('postModal');
      loadDraftsList();
    }

    function deleteComposerDraft(id) {
      saveDrafts(getDrafts().filter(d => d.id !== id));
      if (composerDraftId === id) composerDraftId = null;
      loadDraftsList();
    }

    function clearComposerState() {
      composerDraftId = null;
      editingPostId = null;
      editingPostImageUrl = '';
      editingPostMediaType = '';
      editingPostExpiresAt = null;
      editingPostMediaDurationSeconds = null;
      document.getElementById('postModalTitle').textContent = 'Create Post';
      document.getElementById('postSubmitBtn').textContent = 'Publish Post';
      document.getElementById('postContent').value = '';
      document.getElementById('postImage').value = '';
      document.getElementById('postReplyPermission').value = 'everyone';
      composerNotifyFollowers = true;
      syncNotifyFollowersButton();
      loadDraftsList();
    }

    const _origOpenCreatePostModal = openCreatePostModal;
    openCreatePostModal = function() {
      if (!currentUser) {
        alert('Please login first.');
        openModal('loginModal');
        return;
      }
      clearComposerState();
      openModal('postModal');
    };

    const _origEditPost = editPost;
    editPost = function(id) {
      if (!currentUser) {
        alert('You need to be logged in.');
        return;
      }
      const posts = getPosts();
      const post = posts.find(p => p.id === id && p.userId === currentUser.id);
      if (!post) return;
      composerDraftId = null;
      editingPostId = post.id;
      editingPostImageUrl = post.imageUrl || '';
      editingPostMediaType = post.mediaType || (post.imageUrl ? 'image' : '');
      editingPostExpiresAt = post.expiresAt || null;
      editingPostMediaDurationSeconds = post.mediaDurationSeconds || null;
      document.getElementById('postModalTitle').textContent = 'Edit Post';
      document.getElementById('postSubmitBtn').textContent = 'Save Changes';
      document.getElementById('postContent').value = post.content || '';
      document.getElementById('postReplyPermission').value = post.replyPermission || 'everyone';
      document.getElementById('postImage').value = '';
      composerNotifyFollowers = true;
      syncNotifyFollowersButton();
      loadDraftsList();
      openModal('postModal');
    };

    setWhoCanReply = function(id) {
      if (!currentUser) return;
      const posts = getPosts();
      const post = posts.find(p => p.id === id && p.userId === currentUser.id);
      if (!post) return;
      const current = post.replyPermission || 'everyone';
      const next = current === 'everyone' ? 'following' : current === 'following' ? 'mentioned' : 'everyone';
      post.replyPermission = next;
      post.replyPermissionLabel = next === 'everyone' ? 'Everyone can reply' : next === 'following' ? 'People you follow can reply' : 'Only mentioned people can reply';
      savePosts(posts);
      closeAllPostMenus();
      renderAll();
    };

    buildPostCard = function(post, mode = 'feed') {
      const isOwner = currentUser && currentUser.id === post.userId;
      const likeCount = post.likes || 0;
      const replies = Array.isArray(post.replies) ? post.replies : [];
      const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
      const alreadyLiked = currentUser ? likedBy.includes(currentUser.id) : false;
      const following = currentUser && Array.isArray(currentUser.following) ? currentUser.following.includes(post.userId) : false;
      const repliesOpen = !!replyOpenState[post.id];
      const replyHtml = replies.length ? replies.map(reply => buildReplyHtml(reply, post.id)).join('') : `<div class="reply-item"><div class="reply-text">No replies yet.</div></div>`;
      const likeDisabled = isOwner || alreadyLiked ? 'disabled' : '';
      const followButton = !post.system && currentUser && !isOwner ? `<button class="follow-btn" onclick="toggleFollow(${post.userId})">${following ? 'Following' : 'Follow'}</button>` : '';
      const authorProfile = getPostAuthorProfile(post);
      const displayName = authorProfile?.username || post.authorName || 'Unknown user';
      const handle = authorProfile?.username ? '@' + authorProfile.username.replace(/\s+/g, '').toLowerCase() : (post.userId ? '@' + (post.authorName || 'user').replace(/\s+/g, '').toLowerCase() : (post.category || 'system'));
      const verification = post.userId ? getVerificationBadgeHtml(post.userId) : '';
      return `
        <div class="post-card-shell" id="post-card-${post.id}">
        <div class="post-header">
          ${post.userId ? `<div class="clickable-user" onclick="openUserProfile(${post.userId})">${renderAvatar(authorProfile, displayName, 'avatar')}</div>` : renderAvatar(authorProfile, displayName, 'avatar')}
          <div style="flex:1; min-width:0;">
            <div class="post-name ${post.userId ? 'clickable-user' : ''}" ${post.userId ? `onclick="openUserProfile(${post.userId})"` : ''}><span class="display-name-wrap">${escapeHtml(displayName)}${verification}</span></div>
            <div class="post-handle">${escapeHtml(handle)} · ${formatTime(post.createdAt || Date.now())}</div>
          </div>
          ${followButton}
        </div>
        <div class="post-content">${renderRichText(post.content)}</div>
        ${renderPostMedia(post)}
        ${buildPollHtml(post)}
        <div class="post-meta">${post.category ? `${escapeHtml(post.category)}` : 'Post'}${post.hashtags?.length ? ` · ${post.hashtags.map(tag => escapeHtml(tag)).join(' ')}` : ''}${getVideoExpiryText(post)}</div>
        ${post.system ? '' : `
        <div class="post-actions">
          <div class="post-actions-left">
            ${buildActionButton('comment', replies.length, repliesOpen ? 'Hide replies' : 'Open replies', `toggleReplies(${post.id})`, 'secondary-btn')}
            ${buildActionButton('repost', post.reposts || 0, isOwner ? 'Repost your post' : 'Repost', `repostPost(${post.id})`, 'secondary-btn', !currentUser)}
            ${buildActionButton('like', likeCount, isOwner ? 'Your post' : alreadyLiked ? 'Liked' : 'Like', `likePost(${post.id})`, 'like-btn', Boolean(likeDisabled))}
            ${buildActionButton('views', post.views || 0, 'Views', 'return false;', 'secondary-btn', true)}
            ${buildActionButton('bookmark', Array.isArray(post.bookmarkedBy) ? post.bookmarkedBy.length : 0, 'Save post', `bookmarkPost(${post.id})`, 'secondary-btn', !currentUser)}
            ${buildActionButton('share', '', 'Share post', `sharePost(${post.id})`, 'secondary-btn')}
          </div>
          <div class="post-actions-right">
            ${buildActionButton('more', '', 'More', `togglePostMenu(${post.id})`, 'secondary-btn')}
          </div>
        </div>
        <div id="postMenu-${post.id}" class="post-menu">
          <button class="post-menu-item" type="button" onclick="menuBookmarkPost(${post.id})"><span>Bookmark<small>Save this post for later</small></span><span>${Array.isArray(post.bookmarkedBy) ? post.bookmarkedBy.length : 0}</span></button>
          <button class="post-menu-item" type="button" onclick="togglePinToProfile(${post.id})" ${isOwner ? '' : 'disabled'}><span>${post.pinnedToProfile ? 'Unpin from profile' : 'Pin to profile'}<small>Keep it at the top of your profile</small></span></button>
          <button class="post-menu-item" type="button" onclick="showPostAnalytics(${post.id})" ${isOwner ? '' : 'disabled'}><span>Post Analytics<small>Views, likes, replies, reposts, bookmarks</small></span></button>
          <button class="post-menu-item" type="button" onclick="setWhoCanReply(${post.id})" ${isOwner ? '' : 'disabled'}><span>Who can reply?<small>${escapeHtml(post.replyPermissionLabel || 'Everyone can reply')}</small></span></button>
          <button class="post-menu-item" type="button" onclick="editPost(${post.id})" ${isOwner ? '' : 'disabled'}><span>Edit<small>Make changes to this post</small></span></button>
          <button class="post-menu-item danger" type="button" onclick="deletePost(${post.id})" ${isOwner ? '' : 'disabled'}><span>Delete<small>Remove this post</small></span></button>
        </div>
        <div class="reply-box ${repliesOpen ? '' : 'collapsed'}">
          <div class="reply-title">Replies</div>
          <div class="reply-list">${replyHtml}</div>
          ${currentUser ? `<div class="reply-form"><div class="composer-wrap"><textarea id="replyInput-${post.id}" placeholder="Write a reply..."></textarea><div id="replySuggestions-${post.id}" class="tag-suggestions"></div></div><button type="button" class="reply-submit-btn" onclick="submitReply(${post.id})">Reply</button></div>` : `<div class="reply-item"><div class="reply-text">Login to reply.</div></div>`}
        </div>
        </div>`}
      `;
    };

    loadProfile = function() {
      const users = getUsers();
      const posts = getPosts().sort((a, b) => (b.pinnedToProfile === true) - (a.pinnedToProfile === true) || b.createdAt - a.createdAt);
      const activeProfile = viewedProfileId ? getProfileByUserId(viewedProfileId) : (currentUser ? getProfileByUserId(currentUser.id) : null);
      const profileName = activeProfile?.username || 'Guest';
      const profileHandle = '@' + (profileName || 'guest').replace(/\s+/g, '').toLowerCase();
      const profileBio = activeProfile?.bio || 'Add a bio in settings.';
      const profilePosts = activeProfile ? posts.filter(post => post.userId === activeProfile.id) : [];
      const followingCount = Array.isArray(activeProfile?.following) ? activeProfile.following.length : 0;
      const followerCount = activeProfile ? users.filter(user => Array.isArray(user.following) && user.following.includes(activeProfile.id)).length : 0;
      const avatarEl = document.getElementById('profileAvatar');
      avatarEl.innerHTML = activeProfile?.avatarUrl ? `<img src="${activeProfile.avatarUrl}" alt="${escapeHtml(profileName)}">` : escapeHtml(initials(profileName));
      document.getElementById('profileName').innerHTML = `<span class="display-name-wrap">${escapeHtml(profileName)}${activeProfile ? getVerificationBadgeHtml(activeProfile.id) : ''}</span>`;
      document.getElementById('profileHandle').textContent = profileHandle;
      document.getElementById('profileBio').textContent = profileBio;
      document.getElementById('profilePostCount').textContent = profilePosts.length;
      document.getElementById('profileFollowingCount').textContent = followingCount;
      document.getElementById('profileFollowerCount').textContent = followerCount;
      renderFeed('profileContent', profilePosts, activeProfile ? 'No posts yet.' : 'Login to view your profile.');
      loadSettings();
    };

    const originalRenderAll = renderAll;
    renderAll = function() {
      syncCurrentUser();
      applyTheme();
      updateAccountUI(currentUser);
      loadPosts();
      bindComposerSuggestions('postContent', 'postTagSuggestions');
      getPosts().forEach(post => bindComposerSuggestions(`replyInput-${post.id}`, `replySuggestions-${post.id}`));
      loadDraftsList();
      syncNotifyFollowersButton();
    };

    document.getElementById('postForm').addEventListener('submit', async function(e) {
      if (e.__enhancedHandled) return;
      e.__enhancedHandled = true;
      e.preventDefault();
      e.stopImmediatePropagation();
      clearStatusMessages();
      if (!currentUser) {
        setStatus('postStatus', 'Please login first.', true);
        return;
      }
      const content = document.getElementById('postContent').value.trim();
      const mediaFile = document.getElementById('postImage').files[0];
      const hashtags = extractHashtags(content);
      const category = getPostCategory(content);
      const pollData = parsePollFromContent(content);
      const replyPermission = document.getElementById('postReplyPermission').value || 'everyone';
      const shouldNotifyFollowers = composerNotifyFollowers;
      const replyPermissionLabel = replyPermission === 'everyone' ? 'Everyone can reply' : replyPermission === 'following' ? 'People you follow can reply' : 'Only mentioned people can reply';
      if (!content) {
        setStatus('postStatus', 'Please write something.', true);
        return;
      }
      try {
        setStatus('postStatus', editingPostId ? 'Saving changes...' : 'Saving post...');
        const media = await getComposerMediaPayload(mediaFile, {
          imageUrl: editingPostImageUrl,
          mediaType: editingPostMediaType,
          expiresAt: editingPostExpiresAt,
          mediaDurationSeconds: editingPostMediaDurationSeconds
        });
        const posts = getPosts();
        if (editingPostId) {
          const post = posts.find(p => p.id === editingPostId && p.userId === currentUser.id);
          if (post) {
            post.content = content;
            post.imageUrl = media.imageUrl;
            post.mediaType = media.mediaType;
            post.expiresAt = media.expiresAt;
            post.mediaDurationSeconds = media.mediaDurationSeconds;
            post.hashtags = hashtags;
            post.category = category;
            post.replyPermission = replyPermission;
            post.replyPermissionLabel = replyPermissionLabel;
            if (pollData) {
              const existingVotes = post.poll && post.poll.votesByUser ? post.poll.votesByUser : {};
              post.poll = {
                question: pollData.question,
                votesByUser: existingVotes,
                options: pollData.options.map(option => {
                  const existingOption = post.poll && Array.isArray(post.poll.options) ? post.poll.options.find(item => item.label === option.label) : null;
                  return {
                    id: option.id,
                    label: option.label,
                    votes: existingOption ? Number(existingOption.votes) || 0 : 0
                  };
                })
              };
            } else {
              delete post.poll;
            }
            post.edited = true;
          }
        } else {
          const newPost = {
            id: makeId(), content, imageUrl: media.imageUrl, mediaType: media.mediaType, expiresAt: media.expiresAt, mediaDurationSeconds: media.mediaDurationSeconds, likes: 0, likedBy: [], replies: [], userId: currentUser.id,
            authorName: currentUser.username || currentUser.email || 'User', authorEmail: currentUser.email || '',
            category, hashtags, createdAt: Date.now(), replyPermission, replyPermissionLabel,
            poll: pollData ? { question: pollData.question, options: pollData.options, votesByUser: {} } : null
          };
          posts.push(newPost);
          if (composerNotifyFollowers) {
            getFollowersOfUser(currentUser.id).forEach(follower => addNotification(follower.id, `${currentUser.username} posted something new.`, 'post'));
          }
          notifyMentionedUsers(content, currentUser.username || 'Someone', 'a post', [currentUser.id]);
        }
        savePosts(posts);
        if (composerDraftId) deleteComposerDraft(composerDraftId);
        clearComposerState();
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) searchInput.value = '';
        const searchDropdown = document.getElementById('globalSearchDropdown');
        if (searchDropdown) {
          searchDropdown.classList.remove('active');
          searchDropdown.innerHTML = '';
        }
        closeModal('postModal');
        renderAll();
        const homeButton = document.querySelector('.nav-item[data-page="home"]');
        showPage('home', homeButton);
      } catch (error) {
        console.error(error);
        setStatus('postStatus', error?.message || 'Could not save post.', true);
      }
    }, true);

    if (window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      if (media.addEventListener) media.addEventListener('change', () => applyTheme());
      else if (media.addListener) media.addListener(() => applyTheme());
    }

    function seedLocalDemoState() {
      if (supabaseClient) return;
      if (getUsers().length || getPosts().length) return;
      const now = Date.now();
      const demoUsers = [
        {
          id: 101,
          username: 'Avery',
          email: 'avery@example.com',
          bio: 'Building cozy UI ideas and game concepts.',
          following: [102, 103],
          notifications: [],
          avatarUrl: '',
          localPassword: 'demo1234',
          settings: getUserSettingsData(null)
        },
        {
          id: 102,
          username: 'Mika',
          email: 'mika@example.com',
          bio: 'Posting art, updates, and community polls.',
          following: [101],
          notifications: [],
          avatarUrl: '',
          localPassword: 'demo1234',
          settings: getUserSettingsData(null)
        },
        {
          id: 103,
          username: 'Jules',
          email: 'jules@example.com',
          bio: 'Frontend tweaks and launch notes.',
          following: [101],
          notifications: [],
          avatarUrl: '',
          localPassword: 'demo1234',
          settings: getUserSettingsData(null)
        }
      ];
      const demoPosts = [
        {
          id: 1001,
          userId: 102,
          authorName: 'Mika',
          content: 'Welcome to Random. This demo feed is here so the site looks alive the first time you open it. #welcome #demo',
          imageUrl: '',
          hashtags: ['#welcome', '#demo'],
          category: 'trending',
          createdAt: now - 1000 * 60 * 25,
          likes: [],
          replies: []
        },
        {
          id: 1002,
          userId: 103,
          authorName: 'Jules',
          content: 'Small quality-of-life fixes matter: faster search, safer local auth fallback, and cleaner defaults. #devlog',
          imageUrl: '',
          hashtags: ['#devlog'],
          category: 'technology',
          createdAt: now - 1000 * 60 * 10,
          likes: [],
          replies: []
        }
      ];
      localStorage.setItem('random_users', JSON.stringify(demoUsers));
      localStorage.setItem('random_posts', JSON.stringify(demoPosts));
    }

    async function bootApp() {
      try {
        if (supabaseClient) {
          await loadBackendState();
          await restoreBackendSession();
        } else {
          backendReady = true;
          seedLocalDemoState();
        }
      } catch (error) {
        console.error('Boot failed', error);
        backendReady = false;
        seedLocalDemoState();
      }
      renderAll();
    }

    bootApp();

    let followingRailTab = 'all';

    function getFollowingSeenStorageKey() {
      return currentUser ? `random_seen_following_posts_${currentUser.id}` : 'random_seen_following_posts_guest';
    }

    function getSeenFollowingPosts() {
      try {
        return JSON.parse(localStorage.getItem(getFollowingSeenStorageKey())) || {};
      } catch (error) {
        return {};
      }
    }

    function saveSeenFollowingPosts(map) {
      localStorage.setItem(getFollowingSeenStorageKey(), JSON.stringify(map || {}));
    }

    function markFollowingPostsSeen(userId, timestamp) {
      if (!userId) return;
      const seenMap = getSeenFollowingPosts();
      seenMap[userId] = Number(timestamp || Date.now());
      saveSeenFollowingPosts(seenMap);
    }

    function getPostPreviewText(post) {
      if (!post) return 'posted something new';
      const text = String(post.content || '').trim();
      if (text) return text.split('\n')[0].trim().slice(0, 72);
      if (post.poll) return 'posted a poll';
      if (post.mediaType === 'video') return 'posted a video';
      if (post.imageUrl) return 'posted media';
      return 'posted something new';
    }

    function getLatestPostByUser(userId) {
      return getPosts()
        .filter(post => post.userId === userId)
        .filter(post => canUserSeePost(post, currentUser))
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))[0] || null;
    }

    function getFollowingRailItems() {
      if (!currentUser || !Array.isArray(currentUser.following)) return [];
      const seenMap = getSeenFollowingPosts();
      return currentUser.following
        .map(userId => {
          const user = getUserRecord(userId);
          const latestPost = getLatestPostByUser(userId);
          if (!user || !latestPost) return null;
          const seenTimestamp = Number(seenMap[userId] || 0);
          return {
            user,
            latestPost,
            isNew: Number(latestPost.createdAt || 0) > seenTimestamp
          };
        })
        .filter(Boolean)
        .sort((a, b) => Number(b.latestPost.createdAt || 0) - Number(a.latestPost.createdAt || 0));
    }

    function setFollowingRailTab(tab, button) {
      followingRailTab = tab === 'new' ? 'new' : 'all';
      document.querySelectorAll('.right-sidebar-tab').forEach(item => item.classList.remove('active'));
      if (button) button.classList.add('active');
      renderFollowingRightRail();
    }

    function openFollowingUserFromRail(userId) {
      const latestPost = getLatestPostByUser(userId);
      if (latestPost) markFollowingPostsSeen(userId, latestPost.createdAt);
      renderFollowingRightRail();
      openUserProfile(userId);
    }

    function renderFollowingRightRail() {
      const rail = document.getElementById('followingRightRail');
      if (!rail) return;
      if (!currentUser) {
        rail.innerHTML = '<div class="right-sidebar-empty">Login to see who you follow and when they post.</div>';
        return;
      }
      let items = getFollowingRailItems();
      if (followingRailTab === 'new') items = items.filter(item => item.isNew);
      if (!items.length) {
        rail.innerHTML = `<div class="right-sidebar-empty">${followingRailTab === 'new' ? 'No new posts from people you follow right now.' : 'Follow some people and their newest posts will show here.'}</div>`;
        return;
      }
      rail.innerHTML = items.map(item => `
        <div class="following-rail-item" onclick="openFollowingUserFromRail(${item.user.id})">
          ${typeof renderAvatar === 'function' ? renderAvatar(item.user, item.user.username || 'User', 'avatar') : `<div class="notifications-dropdown-avatar">${escapeHtml(initials(item.user.username || 'U'))}</div>`}
          <div class="following-rail-body">
            <div class="following-rail-name-row">
              <div class="following-rail-name">${escapeHtml(item.user.username || 'User')}</div>
              ${item.isNew ? '<span class="rail-blue-dot"></span>' : ''}
            </div>
            <div class="following-rail-preview">${escapeHtml(getPostPreviewText(item.latestPost))}</div>
            <div class="following-rail-time">${escapeHtml(formatTime(item.latestPost.createdAt))}</div>
          </div>
        </div>
      `).join('');
    }

    function parseNotificationActorName(text) {
      const str = String(text || '').trim();
      if (!str) return '';
      if (str.includes(':')) return str.split(':')[0].trim();
      const followMatch = str.match(/^(.+?)\s+started following you\.?$/i);
      if (followMatch) return followMatch[1].trim();
      const likeMatch = str.match(/^(.+?)\s+liked/i);
      if (likeMatch) return likeMatch[1].trim();
      const replyMatch = str.match(/^(.+?)\s+replied/i);
      if (replyMatch) return replyMatch[1].trim();
      const postMatch = str.match(/^(.+?)\s+posted something new\.?$/i);
      if (postMatch) return postMatch[1].trim();
      return '';
    }

    function findUserByUsernameLoose(name) {
      const target = String(name || '').trim().toLowerCase();
      if (!target) return null;
      return getUsers().find(user => String(user.username || '').trim().toLowerCase() === target) || null;
    }

    function findBestPostForNotification(item) {
      const actorName = parseNotificationActorName(item && item.text);
      const actorUser = findUserByUsernameLoose(actorName);
      if (!actorUser) return null;
      const allPosts = getPosts()
        .filter(post => post.userId === actorUser.id)
        .filter(post => canUserSeePost(post, currentUser))
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      return allPosts[0] || null;
    }

    function goToPostAndHighlight(postId) {
      const homeButton = document.querySelector('.nav-item[data-page="home"]');
      const search = document.getElementById('globalSearch');
      if (search) search.value = '';
      if (homeButton) showPage('home', homeButton);
      renderAll();
      setTimeout(() => {
        const target = document.getElementById(`post-card-${postId}`);
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('post-jump-highlight');
        setTimeout(() => target.classList.remove('post-jump-highlight'), 1800);
      }, 80);
    }

    function handleDropdownNotificationClick(notificationId) {
      if (!currentUser) return;
      syncCurrentUser();
      const notifications = Array.isArray(currentUser.notifications) ? currentUser.notifications : [];
      const item = notifications.find(entry => String(entry.id) === String(notificationId));
      if (!item) return;
      closeNotificationsDropdown();
      const targetPost = findBestPostForNotification(item);
      if (targetPost) {
        goToPostAndHighlight(targetPost.id);
        return;
      }
      const actorName = parseNotificationActorName(item.text);
      const actorUser = findUserByUsernameLoose(actorName);
      if (actorUser) {
        openUserProfile(actorUser.id);
        return;
      }
      openNotificationsPage();
    }

    function renderNotificationAvatar(actorUser, actorName) {
      if (actorUser && actorUser.avatarUrl) {
        return `<div class="notifications-dropdown-avatar"><img src="${actorUser.avatarUrl}" alt="${escapeHtml(actorName || 'User')}"></div>`;
      }
      return `<div class="notifications-dropdown-avatar">${escapeHtml(initials(actorName || 'N'))}</div>`;
    }

    function buildNotificationLabel(item) {
      const text = String(item && item.text || '').trim();
      if (!text) return 'New notification';
      return text;
    }

    function renderNotificationsDropdown() {
      const list = document.getElementById('notificationsDropdownList');
      const dropdown = document.getElementById('notificationsDropdown');
      if (!list || !dropdown) return;
      if (!currentUser) {
        list.innerHTML = '<div class="notifications-dropdown-empty">Login to see notifications.</div>';
        return;
      }
      syncCurrentUser();
      const notifications = Array.isArray(currentUser.notifications) ? currentUser.notifications : [];
      if (!notifications.length) {
        list.innerHTML = '<div class="notifications-dropdown-empty">No notifications yet.</div>';
        return;
      }
      list.innerHTML = notifications.map(item => {
        const actorName = parseNotificationActorName(item.text) || 'Notification';
        const actorUser = findUserByUsernameLoose(actorName);
        return `
          <div class="notifications-dropdown-item" onclick="handleDropdownNotificationClick(${item.id})">
            ${renderNotificationAvatar(actorUser, actorName)}
            <div>
              <div class="notifications-dropdown-text">${escapeHtml(buildNotificationLabel(item))}</div>
              <div class="notifications-dropdown-time">${escapeHtml(formatTime(item.createdAt))}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    function toggleNotificationsDropdown(event) {
      if (event) event.stopPropagation();
      const dropdown = document.getElementById('notificationsDropdown');
      if (!dropdown) return;
      const willOpen = !dropdown.classList.contains('active');
      closeNotificationsDropdown();
      if (willOpen) {
        renderNotificationsDropdown();
        dropdown.classList.add('active');
      }
    }

    function closeNotificationsDropdown() {
      const dropdown = document.getElementById('notificationsDropdown');
      if (dropdown) dropdown.classList.remove('active');
    }

    const _baseBuildPostCard = buildPostCard;
    buildPostCard = function(post, mode = 'feed') {
      const html = _baseBuildPostCard(post, mode);
      if (typeof html !== 'string') return html;
      return html.replace('<div class="post-card-shell" id="post-card-${post.id}">', `<div class="post-card-shell" id="post-card-${post.id}" data-post-id="${post.id}">`);
    };

    const _baseOpenNotificationsPage = openNotificationsPage;
    openNotificationsPage = function() {
      const notificationsTab = document.querySelector('.nav-item[data-page="notifications"]');
      if (notificationsTab) {
        showPage('notifications', notificationsTab);
      }
    };

    const _baseShowPage = showPage;
    showPage = function(pageId, clickedItem) {
      _baseShowPage(pageId, clickedItem);
      if (pageId === 'following' && currentUser && Array.isArray(currentUser.following)) {
        currentUser.following.forEach(userId => {
          const latestPost = getLatestPostByUser(userId);
          if (latestPost) markFollowingPostsSeen(userId, latestPost.createdAt);
        });
        renderFollowingRightRail();
      }
      closeNotificationsDropdown();
    };

    const _baseUpdateAccountUI = updateAccountUI;
    updateAccountUI = function(user) {
      _baseUpdateAccountUI(user);
      const anchor = document.querySelector('.notifications-anchor');
      if (anchor) anchor.style.display = user ? 'inline-flex' : 'none';
    };

    const _baseRenderAll = renderAll;
    renderAll = function() {
      _baseRenderAll();
      updateNotificationBell();
      renderFollowingRightRail();
      renderNotificationsDropdown();
    };

    document.addEventListener('click', function(event) {
      const dropdown = document.getElementById('notificationsDropdown');
      const bell = document.getElementById('notificationsBellBtn');
      if (!dropdown || !bell) return;
      if (!dropdown.contains(event.target) && !bell.contains(event.target)) {
        closeNotificationsDropdown();
      }
    });

    document.querySelectorAll('.sidebar .nav-item[data-page]').forEach(function(item) {
      item.addEventListener('click', function(event) {
        event.preventDefault();
        const pageId = item.getAttribute('data-page');
        if (pageId) showPage(pageId, item);
      });
    });

    document.addEventListener('DOMContentLoaded', function() {
      const bellButton = document.getElementById('notificationsBellBtn');
      if (bellButton) {
        bellButton.addEventListener('click', toggleNotificationsDropdown);
      }
    });

  


// ========================
// Wire up topbar buttons
// ========================
document.addEventListener('DOMContentLoaded', function() {
  const loginOpenBtn = document.getElementById('loginOpenBtn');
  const registerOpenBtn = document.getElementById('registerOpenBtn');
  const postBtn = document.getElementById('postBtn');

  if (loginOpenBtn) {
    loginOpenBtn.addEventListener('click', function() { openModal('loginModal'); });
  }
  if (registerOpenBtn) {
    registerOpenBtn.addEventListener('click', function() { openModal('registerModal'); });
  }
  if (postBtn) {
    postBtn.addEventListener('click', function() { 
      if (typeof openCreatePostModal === 'function') openCreatePostModal();
      else openModal('postModal'); 
    });
  }

  // Wire nav items
  document.querySelectorAll('.nav-item[data-page]').forEach(function(item) {
    item.addEventListener('click', function(event) {
      event.preventDefault();
      const pageId = item.getAttribute('data-page');
      if (pageId) showPage(pageId, item);
    });
  });

  // Modal outside click
  window.addEventListener('click', function(e) {
    ['loginModal', 'registerModal', 'postModal'].forEach(function(id) {
      const modal = document.getElementById(id);
      if (e.target === modal) closeModal(id);
    });
  });
});

</script>
</body>
</html>
