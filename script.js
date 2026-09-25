// --- DATABASE CONFIGURATION LINK ---
const SUPABASE_URL = "https://zuafgczkmaaxvdmvymrx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1YWZnY3prbWFheHZkbXZ5bXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyODAyMzEsImV4cCI6MjEwNTg1NjIzMX0.WF5wP6-1SjGw8sRUTI6Ngm0E23PNpeESZgqJwmG0qU8";

const db = (window.supabase && typeof window.supabase.createClient === 'function')
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            storage: window.localStorage,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    })
    : null;

if (!db) console.error("Critical: window.supabase is not initialized.");

// DOM Elements - Auth & Nav
const authPanel = document.getElementById('auth-panel');
const postPanel = document.getElementById('post-panel');
const authForm = document.getElementById('authForm');
const authHeader = document.getElementById('auth-header');
const authUsernameGroup = document.getElementById('username-field-group');
const authUsernameInput = document.getElementById('auth-username');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authToggleBtn = document.getElementById('auth-toggle-btn');
const currentUserTag = document.getElementById('current-user-tag');
const logoutBtn = document.getElementById('logout-btn');

// DOM Elements - Header Nav & Profile Bar
const openProfileBtn = document.getElementById('open-profile-btn');
const headerAvatarImg = document.getElementById('header-avatar-img');
const headerAvatarFallback = document.getElementById('header-avatar-fallback');
const postBarAvatar = document.getElementById('post-bar-avatar');

// DOM Elements - Profile Modal & Password Fields
const profileModal = document.getElementById('profile-modal');
const closeProfileBtn = document.getElementById('close-profile-btn');
const profilePreviewAvatar = document.getElementById('profile-preview-avatar');
const profileAvatarFile = document.getElementById('profile-avatar-file');
const currentPasswordInput = document.getElementById('current-password-input');
const newPasswordInput = document.getElementById('new-password-input');
const confirmPasswordInput = document.getElementById('confirm-password-input');
const updatePasswordBtn = document.getElementById('update-password-btn');

// DOM Elements - Delete Account Confirmation Modal
const openDeleteModalBtn = document.getElementById('open-delete-modal-btn');
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const closeDeleteModalBtn = document.getElementById('close-delete-modal-btn');
const deleteConfirmUserTag = document.getElementById('delete-confirm-user-tag');
const deleteUsernameInput = document.getElementById('delete-username-input');
const finalDeleteBtn = document.getElementById('final-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

// DOM Elements - Forum
const forumForm = document.getElementById('forumForm');
const textBox = document.getElementById('forum-post');
const honeypotField = document.getElementById('honeypot-field');
const topicSelect = document.getElementById('topic-select');
const forumFeed = document.getElementById('forum-feed');
const currentThreadTitle = document.getElementById('current-thread-title');

// DOM Elements - Telemetry Console
const statPaste = document.getElementById('stat-paste');
const statTimer = document.getElementById('stat-timer');
const statKeys = document.getElementById('stat-keys');
const statUniformity = document.getElementById('stat-uniformity');

// DOM Elements - Modal & Messaging
const openDmBtn = document.getElementById('open-dm-btn');
const closeDmBtn = document.getElementById('close-dm-btn');
const notifBadge = document.getElementById('notif-badge');
const clearAllNotifsBtn = document.getElementById('clear-all-notifs-btn');
const dmModal = document.getElementById('dm-modal');
const topModalBar = document.getElementById('top-modal-bar');
const sidebarPane = document.getElementById('sidebar-pane');
const chatPane = document.getElementById('chat-pane');
const backToListBtn = document.getElementById('back-to-list-btn');

const addFriendInput = document.getElementById('add-friend-input');
const addFriendBtn = document.getElementById('add-friend-btn');
const requestsHeader = document.getElementById('requests-header');
const requestsContainer = document.getElementById('requests-container');
const friendsContainer = document.getElementById('friends-container');
const groupsContainer = document.getElementById('groups-container');
const chatHeader = document.getElementById('chat-header');
const chatMessages = document.getElementById('chat-messages');

// Form & Photo Upload Inputs
const dmForm = document.getElementById('dm-form');
const dmText = document.getElementById('dm-text');
const dmImageInput = document.getElementById('dm-image-input');
const dmSendBtn = document.getElementById('dm-send-btn');

// Group Creator
const toggleGroupCreateBtn = document.getElementById('toggle-group-create-btn');
const groupCreatorBox = document.getElementById('group-creator-box');
const groupNameInput = document.getElementById('group-name-input');
const groupFriendsChecklist = document.getElementById('group-friends-checklist');
const createGroupConfirmBtn = document.getElementById('create-group-confirm-btn');
const cancelGroupBtn = document.getElementById('cancel-group-btn');

// Default fallback avatar SVG
const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' fill='%2394a3b8' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4'/><path d='M12 14c-4.42 0-8 2.69-8 6v1h16v-1c0-3.31-3.58-6-8-6z'/></svg>";

// App State
let currentUser = null;
let currentUsername = null;
let currentAvatarUrl = null;
let isSignUpMode = false;
let myFriendsList = [];
let activeConversationId = null;
let unreadCountsByConv = new Map();
let userAvatarCache = new Map(); // userId -> avatar_url
let dmInterval = null;
let notifPollInterval = null;

// Telemetry State
let pageLoadTime = null; 
let textWasPasted = false;
let keystrokeGaps = [];
let lastKeyTime = null;
let mouseMovementsRecorded = 0;
let timerInterval = null; 
let isTimerRunning = false; 

// --- SESSION & AUTHENTICATION ---

async function syncUserState(user) {
    if (user) {
        currentUser = user;
        const { data: profile } = await db
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', currentUser.id)
            .maybeSingle();

        currentUsername = profile?.username || currentUser.user_metadata?.username || "human";
        currentAvatarUrl = profile?.avatar_url || null;

        currentUserTag.textContent = `@${currentUsername}`;
        deleteConfirmUserTag.textContent = `@${currentUsername}`;
        renderUserAvatar(currentAvatarUrl);

        if (currentAvatarUrl) {
            userAvatarCache.set(currentUser.id, currentAvatarUrl);
        }

        authPanel.classList.add('hidden');
        postPanel.classList.remove('hidden');
        openDmBtn.classList.remove('hidden');
        openProfileBtn.classList.remove('hidden');

        checkNotifications();
        if (notifPollInterval) clearInterval(notifPollInterval);
        notifPollInterval = setInterval(checkNotifications, 4000);
    } else {
        currentUser = null;
        currentUsername = null;
        currentAvatarUrl = null;
        activeConversationId = null;
        if (dmInterval) clearInterval(dmInterval);
        if (notifPollInterval) clearInterval(notifPollInterval);

        postPanel.classList.add('hidden');
        openDmBtn.classList.add('hidden');
        openProfileBtn.classList.add('hidden');
        notifBadge.classList.add('hidden');
        dmModal.classList.add('hidden');
        profileModal.classList.add('hidden');
        deleteConfirmModal.classList.add('hidden');
        authPanel.classList.remove('hidden');
    }
}

function renderUserAvatar(url) {
    if (url) {
        headerAvatarImg.src = url;
        headerAvatarImg.classList.remove('hidden');
        headerAvatarFallback.classList.add('hidden');

        postBarAvatar.src = url;
        postBarAvatar.classList.remove('hidden');

        profilePreviewAvatar.src = url;
    } else {
        headerAvatarImg.classList.add('hidden');
        headerAvatarFallback.classList.remove('hidden');
        postBarAvatar.classList.add('hidden');
        profilePreviewAvatar.src = DEFAULT_AVATAR;
    }
}

if (db) {
    db.auth.getSession().then(({ data: { session } }) => {
        syncUserState(session?.user || null);
    });

    db.auth.onAuthStateChange((_event, session) => {
        syncUserState(session?.user || null);
    });
}

authToggleBtn.addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
        authHeader.textContent = "✨ Create Human Account";
        authUsernameGroup.classList.remove('hidden');
        authUsernameInput.required = true;
        authSubmitBtn.textContent = "Sign Up";
        authToggleBtn.textContent = "Already have an account? Log In";
    } else {
        authHeader.textContent = "🔑 Member Login";
        authUsernameGroup.classList.add('hidden');
        authUsernameInput.required = false;
        authSubmitBtn.textContent = "Log In";
        authToggleBtn.textContent = "Need an account? Sign Up";
    }
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;

    if (isSignUpMode) {
        const username = authUsernameInput.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (username.length < 3) {
            alert("Username must be at least 3 characters.");
            return;
        }

        const { data: existingUser } = await db
            .from('profiles')
            .select('username')
            .eq('username', username)
            .maybeSingle();

        if (existingUser) {
            alert("Username already taken. Please choose another.");
            return;
        }

        const { error } = await db.auth.signUp({
            email,
            password,
            options: { data: { username: username } }
        });

        if (error) {
            alert(`Sign up error: ${error.message}`);
            return;
        }

        alert("Account created successfully!");
        authForm.reset();
    } else {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) {
            alert(`Login error: ${error.message}`);
            return;
        }
        authForm.reset();
    }
});

logoutBtn.addEventListener('click', async () => {
    await db.auth.signOut();
});

// --- PROFILE SETTINGS CUSTOMIZATION ---

openProfileBtn.addEventListener('click', () => {
    profileModal.classList.remove('hidden');
});

closeProfileBtn.addEventListener('click', () => {
    profileModal.classList.add('hidden');
});

profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) profileModal.classList.add('hidden');
});

// Avatar Upload
profileAvatarFile.addEventListener('change', async () => {
    const file = profileAvatarFile.files[0];
    if (!file || !currentUser) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `${currentUser.id}/avatar_${Date.now()}.${fileExt}`;

    const { error: uploadErr } = await db.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

    if (uploadErr) {
        alert(`Avatar upload failed: ${uploadErr.message}`);
        return;
    }

    const { data: publicData } = db.storage.from('avatars').getPublicUrl(filePath);
    const newAvatarUrl = publicData.publicUrl;

    const { error: updateErr } = await db
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', currentUser.id);

    if (updateErr) {
        alert(`Error updating profile: ${updateErr.message}`);
        return;
    }

    currentAvatarUrl = newAvatarUrl;
    userAvatarCache.set(currentUser.id, currentAvatarUrl);
    renderUserAvatar(currentAvatarUrl);
    alert("Avatar updated successfully!");
});

// Password Change
updatePasswordBtn.addEventListener('click', async () => {
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!currentPassword) {
        alert("Please enter your current password.");
        return;
    }
    if (!newPassword || newPassword.length < 6) {
        alert("New password must be at least 6 characters.");
        return;
    }
    if (newPassword !== confirmPassword) {
        alert("The new passwords do not match. Please re-enter them identically.");
        return;
    }

    updatePasswordBtn.disabled = true;
    updatePasswordBtn.textContent = 'Verifying...';

    const { error: authErr } = await db.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword
    });

    if (authErr) {
        updatePasswordBtn.disabled = false;
        updatePasswordBtn.textContent = 'Update Password';
        alert("Incorrect current password. Please try again.");
        return;
    }

    updatePasswordBtn.textContent = 'Updating...';

    const { error: updateErr } = await db.auth.updateUser({ password: newPassword });

    updatePasswordBtn.disabled = false;
    updatePasswordBtn.textContent = 'Update Password';

    if (updateErr) {
        alert(`Password change failed: ${updateErr.message}`);
    } else {
        alert("Password updated successfully!");
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
    }
});

// Account Deletion
openDeleteModalBtn.addEventListener('click', () => {
    deleteConfirmModal.classList.remove('hidden');
    deleteUsernameInput.value = '';
});

closeDeleteModalBtn.addEventListener('click', () => {
    deleteConfirmModal.classList.add('hidden');
});

cancelDeleteBtn.addEventListener('click', () => {
    deleteConfirmModal.classList.add('hidden');
});

deleteConfirmModal.addEventListener('click', (e) => {
    if (e.target === deleteConfirmModal) deleteConfirmModal.classList.add('hidden');
});

finalDeleteBtn.addEventListener('click', async () => {
    const entered = deleteUsernameInput.value.trim().toLowerCase().replace('@', '');
    const expected = currentUsername.toLowerCase().replace('@', '');

    if (entered !== expected) {
        alert(`Username does not match. Please enter "@${currentUsername}" to confirm deletion.`);
        return;
    }

    finalDeleteBtn.disabled = true;
    finalDeleteBtn.textContent = 'Deleting...';

    await db.from('profiles').delete().eq('id', currentUser.id);
    await db.auth.signOut();
    alert("Your account has been deleted.");
});

// --- NOTIFICATION ENGINE ---

async function checkNotifications() {
    if (!currentUser || !db) return;

    const { count: pendingReqs } = await db
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('friend_id', currentUser.id)
        .eq('status', 'pending');

    const { data: memberships } = await db
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

    let unreadTotal = 0;
    unreadCountsByConv.clear();

    if (memberships && memberships.length > 0) {
        const convIds = memberships.map(m => m.conversation_id);
        const { data: unreadMsgs } = await db
            .from('chat_messages')
            .select('conversation_id')
            .in('conversation_id', convIds)
            .neq('sender_id', currentUser.id)
            .eq('is_read', false);

        if (unreadMsgs) {
            unreadTotal = unreadMsgs.length;
            unreadMsgs.forEach(m => {
                const cur = unreadCountsByConv.get(m.conversation_id) || 0;
                unreadCountsByConv.set(m.conversation_id, cur + 1);
            });
        }
    }

    const total = (pendingReqs || 0) + unreadTotal;
    if (total > 0) {
        notifBadge.textContent = total > 99 ? '99+' : total;
        notifBadge.classList.remove('hidden');
    } else {
        notifBadge.classList.add('hidden');
    }

    if (!dmModal.classList.contains('hidden')) {
        updateSidebarBadges();
    }
}

function updateSidebarBadges() {
    document.querySelectorAll('[data-conv-id]').forEach(el => {
        const cId = el.getAttribute('data-conv-id');
        const badge = el.querySelector('.conv-badge');
        const count = unreadCountsByConv.get(cId) || 0;

        if (badge) {
            if (count > 0 && cId !== activeConversationId) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    });
}

// Clear all notifications across all active conversations
clearAllNotifsBtn.addEventListener('click', async () => {
    if (!currentUser) return;

    const { data: memberships } = await db
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

    if (memberships && memberships.length > 0) {
        const convIds = memberships.map(m => m.conversation_id);
        await db
            .from('chat_messages')
            .update({ is_read: true })
            .in('conversation_id', convIds)
            .neq('sender_id', currentUser.id)
            .eq('is_read', false);
    }

    unreadCountsByConv.clear();
    notifBadge.classList.add('hidden');
    updateSidebarBadges();
});

// --- MODAL CONTROLS & MOBILE VIEW TOGGLING ---

openDmBtn.addEventListener('click', () => {
    dmModal.classList.remove('hidden');
    showSidebarViewOnMobile();
    refreshMessagingHub();
});

closeDmBtn.addEventListener('click', () => {
    dmModal.classList.add('hidden');
    if (dmInterval) clearInterval(dmInterval);
    checkNotifications();
});

dmModal.addEventListener('click', (e) => {
    if (e.target === dmModal) {
        dmModal.classList.add('hidden');
        if (dmInterval) clearInterval(dmInterval);
        checkNotifications();
    }
});

function showSidebarViewOnMobile() {
    sidebarPane.classList.remove('mobile-hidden');
    chatPane.classList.add('mobile-hidden');
    topModalBar.classList.remove('hidden');
}

function showChatViewOnMobile() {
    sidebarPane.classList.add('mobile-hidden');
    chatPane.classList.remove('mobile-hidden');
    topModalBar.classList.add('hidden');
}

backToListBtn.addEventListener('click', () => {
    if (dmInterval) clearInterval(dmInterval);
    activeConversationId = null;
    showSidebarViewOnMobile();
    refreshMessagingHub();
});

// --- MESSAGING & CONVERSATION HUB ---

async function refreshMessagingHub() {
    await loadFriendRequests();
    await loadFriends();
    await loadConversations();
    updateSidebarBadges();
}

async function loadFriendRequests() {
    if (!currentUser) return;

    const { data: requests, error } = await db
        .from('friendships')
        .select('id, user_id')
        .eq('friend_id', currentUser.id)
        .eq('status', 'pending');

    if (error || !requests || requests.length === 0) {
        requestsHeader.classList.add('hidden');
        requestsContainer.innerHTML = '';
        return;
    }

    const requesterIds = requests.map(r => r.user_id);
    const { data: profiles } = await db
        .from('profiles')
        .select('id, username')
        .in('id', requesterIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p.username]));

    requestsHeader.classList.remove('hidden');
    requestsContainer.innerHTML = '';

    requests.forEach(req => {
        const username = profileMap.get(req.user_id) || 'unknown';
        const item = document.createElement('div');
        item.className = 'req-item';
        item.innerHTML = `
            <span>@${escapeHTML(username)}</span>
            <div class="req-actions">
                <button class="btn-accept" title="Accept">✓</button>
                <button class="btn-deny" title="Deny">✕</button>
            </div>
        `;

        item.querySelector('.btn-accept').addEventListener('click', () => handleRequest(req.id, true));
        item.querySelector('.btn-deny').addEventListener('click', () => handleRequest(req.id, false));
        requestsContainer.appendChild(item);
    });
}

async function handleRequest(requestId, accept) {
    if (accept) {
        const { error } = await db
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', requestId);

        if (error) alert(`Error accepting request: ${error.message}`);
    } else {
        const { error } = await db
            .from('friendships')
            .delete()
            .eq('id', requestId);

        if (error) alert(`Error declining request: ${error.message}`);
    }
    refreshMessagingHub();
    checkNotifications();
}

async function loadFriends() {
    if (!currentUser) return;

    const { data: friendships, error } = await db
        .from('friendships')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`);

    if (error) {
        console.error("Error loading friends:", error);
        return;
    }

    const friendIds = friendships.map(f => f.user_id === currentUser.id ? f.friend_id : f.user_id);

    if (friendIds.length === 0) {
        friendsContainer.innerHTML = '<div class="no-posts" style="padding: 6px; font-size: 0.8rem;">No friends yet. Add one above!</div>';
        myFriendsList = [];
        return;
    }

    const { data: profiles } = await db
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', friendIds);

    myFriendsList = profiles || [];
    myFriendsList.forEach(p => {
        if (p.avatar_url) userAvatarCache.set(p.id, p.avatar_url);
    });

    const { data: myMemberships } = await db
        .from('conversation_members')
        .select('conversation_id, user_id')
        .in('user_id', [currentUser.id, ...friendIds]);

    const userConvMap = new Map();
    (myMemberships || []).forEach(m => {
        if (!userConvMap.has(m.user_id)) userConvMap.set(m.user_id, new Set());
        userConvMap.get(m.user_id).add(m.conversation_id);
    });

    const myConvs = userConvMap.get(currentUser.id) || new Set();

    friendsContainer.innerHTML = '';
    myFriendsList.forEach(friend => {
        const theirConvs = userConvMap.get(friend.id) || new Set();
        let directConvId = null;
        for (let cId of theirConvs) {
            if (myConvs.has(cId)) {
                directConvId = cId;
                break;
            }
        }

        const div = document.createElement('div');
        div.className = 'conv-item';
        div.id = `friend-item-${friend.id}`;
        if (directConvId) div.setAttribute('data-conv-id', directConvId);

        const unreadCount = directConvId ? (unreadCountsByConv.get(directConvId) || 0) : 0;
        const badgeHidden = unreadCount === 0 ? 'hidden' : '';

        div.innerHTML = `
            <div class="conv-item-label">
                <span>@${escapeHTML(friend.username)}</span>
            </div>
            <span class="conv-badge ${badgeHidden}">${unreadCount}</span>
        `;

        div.addEventListener('click', () => startOrOpenDirectChat(friend));
        friendsContainer.appendChild(div);
    });

    groupFriendsChecklist.innerHTML = '';
    myFriendsList.forEach(friend => {
        const item = document.createElement('label');
        item.className = 'checkbox-item';
        item.innerHTML = `
            <input type="checkbox" value="${friend.id}" class="group-friend-chk">
            <span>@${escapeHTML(friend.username)}</span>
        `;
        groupFriendsChecklist.appendChild(item);
    });
}

addFriendBtn.addEventListener('click', async () => {
    const targetUsername = addFriendInput.value.trim().toLowerCase().replace('@', '');
    if (!targetUsername) return;

    if (targetUsername === currentUsername) {
        alert("You cannot add yourself as a friend.");
        return;
    }

    const { data: targetProfile, error: profileErr } = await db
        .from('profiles')
        .select('id, username')
        .eq('username', targetUsername)
        .maybeSingle();

    if (profileErr || !targetProfile) {
        alert("User not found.");
        return;
    }

    const { data: existing } = await db
        .from('friendships')
        .select('id, status, user_id')
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${targetProfile.id}),and(user_id.eq.${targetProfile.id},friend_id.eq.${currentUser.id})`)
        .maybeSingle();

    if (existing) {
        if (existing.status === 'accepted') {
            alert("You are already friends with this user.");
        } else if (existing.user_id === currentUser.id) {
            alert("Friend request already sent. Waiting for response.");
        } else {
            alert("This user has already sent you a request! Check incoming requests.");
        }
        return;
    }

    const { error: insertErr } = await db
        .from('friendships')
        .insert([{ 
            user_id: currentUser.id, 
            friend_id: targetProfile.id,
            status: 'pending'
        }]);

    if (insertErr) {
        alert(`Could not send request: ${insertErr.message}`);
        return;
    }

    addFriendInput.value = '';
    alert(`Friend request sent to @${targetProfile.username}!`);
    refreshMessagingHub();
});

async function loadConversations() {
    if (!currentUser) return;

    const { data: memberships } = await db
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

    if (!memberships || memberships.length === 0) {
        groupsContainer.innerHTML = '<div class="no-posts" style="padding: 6px; font-size: 0.8rem;">No groups yet</div>';
        return;
    }

    const convIds = memberships.map(m => m.conversation_id);

    const { data: convs } = await db
        .from('conversations')
        .select('*')
        .in('id', convIds)
        .eq('is_group', true);

    groupsContainer.innerHTML = '';
    if (!convs || convs.length === 0) {
        groupsContainer.innerHTML = '<div class="no-posts" style="padding: 6px; font-size: 0.8rem;">No groups yet</div>';
        return;
    }

    convs.forEach(conv => {
        const div = document.createElement('div');
        div.className = `conv-item ${activeConversationId === conv.id ? 'active' : ''}`;
        div.setAttribute('data-conv-id', conv.id);

        const unreadCount = unreadCountsByConv.get(conv.id) || 0;
        const badgeHidden = unreadCount === 0 ? 'hidden' : '';

        div.innerHTML = `
            <div class="conv-item-label">
                <span>💬 ${escapeHTML(conv.name)}</span>
            </div>
            <span class="conv-badge ${badgeHidden}">${unreadCount}</span>
        `;

        div.addEventListener('click', () => selectConversation(conv.id, `Group: ${conv.name}`));
        groupsContainer.appendChild(div);
    });
}

async function startOrOpenDirectChat(friend) {
    const { data: myConvs } = await db
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

    const { data: theirConvs } = await db
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', friend.id);

    const myIds = new Set((myConvs || []).map(c => c.conversation_id));
    const common = (theirConvs || []).filter(c => myIds.has(c.conversation_id));

    let existing1on1Id = null;
    if (common.length > 0) {
        const { data: convMatches } = await db
            .from('conversations')
            .select('id')
            .in('id', common.map(c => c.conversation_id))
            .eq('is_group', false)
            .maybeSingle();

        if (convMatches) existing1on1Id = convMatches.id;
    }

    if (existing1on1Id) {
        selectConversation(existing1on1Id, `@${friend.username}`);
    } else {
        const { data: newConv, error: convErr } = await db
            .from('conversations')
            .insert([{ is_group: false, created_by: currentUser.id }])
            .select()
            .single();

        if (convErr) {
            alert(`Error creating chat: ${convErr.message}`);
            return;
        }

        await db.from('conversation_members').insert([
            { conversation_id: newConv.id, user_id: currentUser.id },
            { conversation_id: newConv.id, user_id: friend.id }
        ]);

        selectConversation(newConv.id, `@${friend.username}`);
    }
}

// Group Chat Creation
toggleGroupCreateBtn.addEventListener('click', () => {
    groupCreatorBox.classList.toggle('hidden');
});

cancelGroupBtn.addEventListener('click', () => {
    groupCreatorBox.classList.add('hidden');
});

createGroupConfirmBtn.addEventListener('click', async () => {
    const groupName = groupNameInput.value.trim();
    if (!groupName) {
        alert("Please provide a group name.");
        return;
    }

    const checkedBoxes = document.querySelectorAll('.group-friend-chk:checked');
    const selectedFriendIds = Array.from(checkedBoxes).map(b => b.value);

    if (selectedFriendIds.length === 0) {
        alert("Please select at least one friend to add.");
        return;
    }

    const { data: newGroup, error: groupErr } = await db
        .from('conversations')
        .insert([{
            name: groupName,
            is_group: true,
            created_by: currentUser.id
        }])
        .select()
        .single();

    if (groupErr) {
        alert(`Error creating group: ${groupErr.message}`);
        return;
    }

    const membersToInsert = [
        { conversation_id: newGroup.id, user_id: currentUser.id },
        ...selectedFriendIds.map(fId => ({ conversation_id: newGroup.id, user_id: fId }))
    ];

    const { error: membersErr } = await db
        .from('conversation_members')
        .insert(membersToInsert);

    if (membersErr) {
        alert(`Error adding group members: ${membersErr.message}`);
        return;
    }

    groupNameInput.value = '';
    groupCreatorBox.classList.add('hidden');
    await loadConversations();
    selectConversation(newGroup.id, `Group: ${groupName}`);
});

function selectConversation(conversationId, title) {
    activeConversationId = conversationId;
    chatHeader.textContent = title;
    dmText.disabled = false;
    dmImageInput.disabled = false;
    dmSendBtn.disabled = false;

    showChatViewOnMobile();

    document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));

    const activeEl = document.querySelector(`[data-conv-id="${conversationId}"]`);
    if (activeEl) {
        activeEl.classList.add('active');
        const badge = activeEl.querySelector('.conv-badge');
        if (badge) badge.classList.add('hidden');
    }

    loadMessages(true);

    if (dmInterval) clearInterval(dmInterval);
    dmInterval = setInterval(() => loadMessages(false), 3000);
}

function scrollToBottom(force = false) {
    if (!chatMessages) return;
    const isNearBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 120;
    
    if (force || isNearBottom) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }
}

// Fetch avatars of senders dynamically
async function ensureAvatarsCached(userIds) {
    const missing = userIds.filter(id => !userAvatarCache.has(id));
    if (missing.length === 0) return;

    const { data: profiles } = await db
        .from('profiles')
        .select('id, avatar_url')
        .in('id', missing);

    (profiles || []).forEach(p => {
        userAvatarCache.set(p.id, p.avatar_url || null);
    });
}

async function loadMessages(forceScroll = false) {
    if (!currentUser || !activeConversationId) return;

    const { data: messages, error } = await db
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('id', { ascending: true });

    if (error) {
        console.error("Error loading chat messages:", error);
        return;
    }

    const currentMsgCount = chatMessages.querySelectorAll('.msg-bubble').length;
    if (!forceScroll && messages && messages.length === currentMsgCount) {
        return;
    }

    chatMessages.innerHTML = '';
    if (!messages || messages.length === 0) {
        chatMessages.innerHTML = '<div class="no-posts">No messages in this chat yet. Start the conversation!</div>';
        return;
    }

    // Cache any senders' avatars
    const senderIds = Array.from(new Set(messages.map(m => m.sender_id)));
    await ensureAvatarsCached(senderIds);

    messages.forEach(msg => {
        const isMine = msg.sender_id === currentUser.id;
        const senderAvatar = userAvatarCache.get(msg.sender_id) || DEFAULT_AVATAR;

        const row = document.createElement('div');
        row.className = `msg-row ${isMine ? 'mine' : 'theirs'}`;

        const avatarImgHtml = `<img src="${senderAvatar}" class="msg-avatar" alt="pfp" title="@${escapeHTML(msg.sender_username)}">`;
        const authorHtml = !isMine ? `<div class="msg-author">@${escapeHTML(msg.sender_username)}</div>` : '';
        const textHtml = msg.content ? `<div>${escapeHTML(msg.content)}</div>` : '';
        const imgHtml = msg.image_url ? `<a href="${msg.image_url}" target="_blank"><img src="${msg.image_url}" class="chat-img-thumb" alt="Uploaded photo" loading="lazy"></a>` : '';

        const bubbleHtml = `
            <div class="msg-bubble ${isMine ? 'msg-mine' : 'msg-theirs'}">
                ${authorHtml}${textHtml}${imgHtml}
            </div>
        `;

        // Position PFP to the left of incoming messages, right of outgoing messages
        row.innerHTML = isMine ? (bubbleHtml + avatarImgHtml) : (avatarImgHtml + bubbleHtml);

        const attachedImg = row.querySelector('.chat-img-thumb');
        if (attachedImg) {
            attachedImg.onload = () => scrollToBottom(forceScroll);
        }

        chatMessages.appendChild(row);
    });

    scrollToBottom(forceScroll);

    await db
        .from('chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', activeConversationId)
        .neq('sender_id', currentUser.id)
        .eq('is_read', false);

    unreadCountsByConv.delete(activeConversationId);
    checkNotifications();
}

dmImageInput.addEventListener('change', () => {
    const file = dmImageInput.files[0];
    const label = document.querySelector('.upload-photo-label');
    if (file) {
        label.style.borderColor = '#16a34a';
        label.title = `Attached: ${file.name}`;
    } else {
        label.style.borderColor = '#475569';
        label.title = 'Attach Photo';
    }
});

dmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = dmText.value.trim();
    const file = dmImageInput.files[0];

    if (!content && !file) return;
    if (!activeConversationId) return;

    dmSendBtn.disabled = true;
    dmSendBtn.textContent = '...';

    let uploadedImageUrl = null;

    if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
        const filePath = `${activeConversationId}/${fileName}`;

        const { error: uploadError } = await db.storage
            .from('chat-images')
            .upload(filePath, file);

        if (uploadError) {
            alert(`Photo upload failed: ${uploadError.message}`);
            dmSendBtn.disabled = false;
            dmSendBtn.textContent = 'Send';
            return;
        }

        const { data: publicUrlData } = db.storage
            .from('chat-images')
            .getPublicUrl(filePath);

        uploadedImageUrl = publicUrlData.publicUrl;
    }

    const { error } = await db
        .from('chat_messages')
        .insert([{
            conversation_id: activeConversationId,
            sender_id: currentUser.id,
            sender_username: currentUsername,
            content: content || '',
            image_url: uploadedImageUrl
        }]);

    dmSendBtn.disabled = false;
    dmSendBtn.textContent = 'Send';

    if (error) {
        alert(`Error sending message: ${error.message}`);
        return;
    }

    dmText.value = '';
    dmImageInput.value = '';
    const label = document.querySelector('.upload-photo-label');
    label.style.borderColor = '#475569';
    label.title = 'Attach Photo';

    loadMessages(true);
});

// --- TELEMETRY ---

function startCompositionTimer() {
    if (timerInterval) clearInterval(timerInterval);
    pageLoadTime = Date.now();
    isTimerRunning = true;
    
    timerInterval = setInterval(() => {
        const elapsed = (Date.now() - pageLoadTime) / 1000;
        statTimer.textContent = `${elapsed.toFixed(1)}s`;
    }, 100);
}

window.addEventListener('mousemove', () => { mouseMovementsRecorded++; });
window.addEventListener('touchstart', () => { mouseMovementsRecorded++; });

textBox.addEventListener('paste', () => {
    textWasPasted = true;
    statPaste.textContent = "TRUE";
    statPaste.className = "badge badge-red";
    if (!isTimerRunning) startCompositionTimer();
});

textBox.addEventListener('keydown', (e) => {
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

    if (!isTimerRunning) startCompositionTimer();
    
    const currentTime = Date.now();
    
    if (lastKeyTime !== null) {
        const gap = currentTime - lastKeyTime;
        if (keystrokeGaps.length < 50) keystrokeGaps.push(gap);
        
        if (keystrokeGaps.length > 3) {
            let perfectIntervals = 0;
            for (let i = 2; i < keystrokeGaps.length; i++) {
                if (keystrokeGaps[i] === keystrokeGaps[i - 1]) perfectIntervals++;
            }
            const uniformityRatio = perfectIntervals / (keystrokeGaps.length - 2);
            statUniformity.textContent = `${(uniformityRatio * 100).toFixed(0)}%`;
        }
    }
    
    lastKeyTime = currentTime;
    statKeys.textContent = `${textBox.value.length + 1} keys`;
});

// --- FORUM FEED ---

async function loadForumPosts() {
    const selectedThread = topicSelect.value;
    currentThreadTitle.textContent = selectedThread;
    
    if (!db) return;

    const { data: posts, error } = await db
        .from('Posts')
        .select('*')
        .eq('thread', selectedThread)
        .order('id', { ascending: false });

    if (error) {
        console.error("Cloud Retrieval Error:", error);
        forumFeed.innerHTML = `<div class="no-posts" style="color: #f87171;">Error loading posts: ${escapeHTML(error.message)}</div>`;
        return;
    }
    
    if (!posts || posts.length === 0) {
        forumFeed.innerHTML = `<div class="no-posts">No human content posted inside "${escapeHTML(selectedThread)}" yet...</div>`;
        return;
    }
    
    forumFeed.innerHTML = '';
    posts.forEach(post => {
        const item = document.createElement('div');
        item.className = 'post-item';
        
        const dateFormatted = post.created_at ? new Date(post.created_at).toLocaleString() : 'Just now';
        
        item.innerHTML = `
            <div class="post-meta">
                <span>By: <span class="post-author">@${escapeHTML(post.author || 'anonymous')}</span></span>
                <span>${dateFormatted}</span>
            </div>
            <div class="post-content">${escapeHTML(post.content || '')}</div>
        `;
        forumFeed.appendChild(item);
    });
}

topicSelect.addEventListener('change', loadForumPosts);

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

function resetTelemetryConsole() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    pageLoadTime = null;
    isTimerRunning = false; 
    textWasPasted = false;
    keystrokeGaps = [];
    mouseMovementsRecorded = 0;
    lastKeyTime = null;
    textBox.value = '';
    statPaste.textContent = "FALSE";
    statPaste.className = "badge badge-green";
    statTimer.textContent = "0.0s"; 
    statKeys.textContent = "0 keys";
    statUniformity.textContent = "0%";
}

loadForumPosts();

// --- FORUM SUBMISSION ---

forumForm.addEventListener('submit', async (event) => {
    event.preventDefault(); 
    
    if (!currentUsername) {
        alert("You must be logged in to post.");
        return;
    }

    if (honeypotField.value !== "") {
        alert("Submission Blocked: Honeypot triggered.");
        return;
    }

    const totalTimeElapsed = pageLoadTime ? (Date.now() - pageLoadTime) / 1000 : 0;
    if (textWasPasted) { alert("Submission Blocked: Paste detected."); return; }
    if (totalTimeElapsed < 3) { alert("Submission Blocked: Impossibly fast post time."); return; }
    if (mouseMovementsRecorded === 0) { alert("Submission Blocked: No interaction track detected."); return; }
    if (textBox.value.trim().length < 5) { alert("Submission Blocked: Type a longer message."); return; }

    let perfectIntervals = 0;
    for (let i = 2; i < keystrokeGaps.length; i++) {
        if (keystrokeGaps[i] === keystrokeGaps[i - 1]) perfectIntervals++;
    }
    const uniformityRatio = keystrokeGaps.length > 2 ? (perfectIntervals / (keystrokeGaps.length - 2)) : 0;
    if (uniformityRatio > 0.60) { alert("Submission Blocked: Automation detected."); return; }

    const { error } = await db
        .from('Posts')
        .insert([{ 
            thread: topicSelect.value, 
            author: currentUsername, 
            content: textBox.value 
        }]);

    if (error) {
        alert(`Database Error: ${error.message}`);
        console.error("Supabase Insert Error:", error);
        return;
    }

    await loadForumPosts();
    resetTelemetryConsole();
});
