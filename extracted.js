
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
          if (shouldNotifyFollowers) {
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
          if (shouldNotifyFollowers) {
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

  