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

// SITE SUPER ADMIN USERNAME
const SITE_ADMIN_USERNAME = "gemini";

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

// Notifications Tab Elements
const openNotifBtn = document.getElementById('open-notif-btn');
const activityNotifBadge = document.getElementById('activity-notif-badge');
const notificationsModal = document.getElementById('notifications-modal');
const closeNotificationsBtn = document.getElementById('close-notifications-btn');
const clearActivityNotifsBtn = document.getElementById('clear-activity-notifs-btn');
const notificationsList = document.getElementById('notifications-list');

// Pinned Updates Ticker & Modal
const tickerBadge = document.getElementById('ticker-badge');
const tickerContent = document.getElementById('ticker-content');
const updatesModal = document.getElementById('updates-modal');
const closeUpdatesModalBtn = document.getElementById('close-updates-modal-btn');
const updatesModalFeed = document.getElementById('updates-modal-feed');

// Forum & Threads
const forumForm = document.getElementById('forumForm');
const textBox = document.getElementById('forum-post');
const honeypotField = document.getElementById('honeypot-field');
const topicSelect = document.getElementById('topic-select');
const forumFeed = document.getElementById('forum-feed');
const currentThreadTitle = document.getElementById('current-thread-title');
const currentUserThreadRole = document.getElementById('current-user-thread-role');
const managePermsBtn = document.getElementById('manage-perms-btn');
const deleteThreadBtn = document.getElementById('delete-thread-btn');

// Photo Attachment in Posts
const postImageFile = document.getElementById('post-image-file');
const postPhotoPreviewBar = document.getElementById('post-photo-preview-bar');
const postPhotoFilename = document.getElementById('post-photo-filename');
const removePostPhotoBtn = document.getElementById('remove-post-photo-btn');
let selectedPostPhotoFile = null;

// Safe Link Insertion Modal
const openLinkModalBtn = document.getElementById('open-link-modal-btn');
const linkModal = document.getElementById('link-modal');
const closeLinkModalBtn = document.getElementById('close-link-modal-btn');
const insertLinkForm = document.getElementById('insertLinkForm');
const linkUrlInput = document.getElementById('link-url-input');
const linkTextInput = document.getElementById('link-text-input');

// Thread Management & Filter Elements
const threadSearchInput = document.getElementById('thread-search-input');
const threadChipsContainer = document.getElementById('thread-chips-container');
const postSortSelect = document.getElementById('post-sort-select');
const openNewThreadModalBtn = document.getElementById('open-new-thread-modal-btn');
const triggerCreateThreadBtn = document.getElementById('trigger-create-thread-btn');
const threadModal = document.getElementById('thread-modal');
const closeThreadModalBtn = document.getElementById('close-thread-modal-btn');
const createThreadForm = document.getElementById('createThreadForm');
const newThreadTitleInput = document.getElementById('new-thread-title');

// Thread Permissions Modal Elements
const permsModal = document.getElementById('perms-modal');
const closePermsModalBtn = document.getElementById('close-perms-modal-btn');
const permsThreadName = document.getElementById('perms-thread-name');
const permUserLookup = document.getElementById('perm-user-lookup');
const permUserAddBtn = document.getElementById('perm-user-add-btn');
const permsUserList = document.getElementById('perms-user-list');

// Thread Delete Confirmation Modal Elements
const threadDeleteModal = document.getElementById('thread-delete-modal');
const closeThreadDeleteModalBtn = document.getElementById('close-thread-delete-modal-btn');
const cancelDeleteThreadBtn = document.getElementById('cancel-delete-thread-btn');
const finalDeleteThreadBtn = document.getElementById('final-delete-thread-btn');
const deleteThreadTargetName = document.getElementById('delete-thread-target-name');
const deleteThreadConfirmInput = document.getElementById('delete-thread-confirm-input');

// Profile & Account Deletion Elements
const profileModal = document.getElementById('profile-modal');
const closeProfileBtn = document.getElementById('close-profile-btn');
const profilePreviewAvatar = document.getElementById('profile-preview-avatar');
const profileAvatarFile = document.getElementById('profile-avatar-file');
const currentPasswordInput = document.getElementById('current-password-input');
const newPasswordInput = document.getElementById('new-password-input');
const confirmPasswordInput = document.getElementById('confirm-password-input');
const updatePasswordBtn = document.getElementById('update-password-btn');

const openDeleteModalBtn = document.getElementById('open-delete-modal-btn');
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const closeDeleteModalBtn = document.getElementById('close-delete-modal-btn');
const deleteConfirmUserTag = document.getElementById('delete-confirm-user-tag');
const deleteUsernameInput = document.getElementById('delete-username-input');
const finalDeleteBtn = document.getElementById('final-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

// Public User Profile Card Elements
const userProfileModal = document.getElementById('user-profile-modal');
const closeUserProfileBtn = document.getElementById('close-user-profile-btn');
const userCardPfp = document.getElementById('user-card-pfp');
const userCardUsername = document.getElementById('user-card-username');
const userCardScore = document.getElementById('user-card-score');
const userCardAddFriendBtn = document.getElementById('user-card-add-friend-btn');
const unaddConfirmBox = document.getElementById('unadd-confirm-box');
const confirmUnaddBtn = document.getElementById('confirm-unadd-btn');
const cancelUnaddBtn = document.getElementById('cancel-unadd-btn');

let targetProfileUsername = null;
let targetProfileId = null;
let targetFriendshipRecord = null;

// Floating Telemetry HUD Elements
const telemetryPill = document.getElementById('telemetry-pill');
const telemetryDrawer = document.getElementById('telemetry-drawer');
const closeHudBtn = document.getElementById('close-hud-btn');
const pillSuspicionTag = document.getElementById('pill-suspicion-tag');
const statPaste = document.getElementById('stat-paste');
const statTimer = document.getElementById('stat-timer');
const statKeys = document.getElementById('stat-keys');
const statSuspicion = document.getElementById('stat-suspicion');

// CAPTCHA Suspension Modal Elements
const captchaSuspensionModal = document.getElementById('captcha-suspension-modal');
const captchaCanvas = document.getElementById('captchaCanvas');
const captchaInput = document.getElementById('captcha-input');
const submitCaptchaBtn = document.getElementById('submit-captcha-btn');
const refreshCaptchaBtn = document.getElementById('refresh-captcha-btn');
const captchaStatusMsg = document.getElementById('captcha-status-msg');
let currentCaptchaSecret = "";

// Direct Messages & Groups Elements
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

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' fill='%2364748b' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4'/><path d='M12 14c-4.42 0-8 2.69-8 6v1h16v-1c0-3.31-3.58-6-8-6z'/></svg>";

// App State
let currentUser = null;
let currentUsername = null;
let currentAvatarUrl = null;
let isSignUpMode = false;
let myFriendsList = [];
let activeConversationId = null;
let unreadCountsByConv = new Map();
let userAvatarCache = new Map();
let dmInterval = null;
let notifPollInterval = null;

// Thread & Permissions State
const DEFAULT_THREADS = ["Update Thread", "Text Thread #2", "Text Thread #3"];
let availableThreads = [...DEFAULT_THREADS];
let activeThread = "Text Thread #2";

let threadMetaMap = JSON.parse(localStorage.getItem('forum_thread_metadata') || '{}');
if (!threadMetaMap["Update Thread"]) threadMetaMap["Update Thread"] = { owner: SITE_ADMIN_USERNAME, moderators: [], banned: [] };
if (!threadMetaMap["Text Thread #2"]) threadMetaMap["Text Thread #2"] = { owner: SITE_ADMIN_USERNAME, moderators: [], banned: [] };
if (!threadMetaMap["Text Thread #3"]) threadMetaMap["Text Thread #3"] = { owner: SITE_ADMIN_USERNAME, moderators: [], banned: [] };

// Voting and score cache
let userVotes = JSON.parse(localStorage.getItem('user_forum_votes') || '{}');
let scoreOffsets = JSON.parse(localStorage.getItem('forum_score_offsets') || '{}');
let userCommentVotes = JSON.parse(localStorage.getItem('user_forum_comment_votes') || '{}');
let cachedPosts = [];
let cachedUpdates = [];
let postCacheMap = new Map();

// Telemetry & Rate-Limiting State
let pageLoadTime = null; 
let textWasPasted = false;
let keystrokeGaps = [];
let lastKeyTime = null;
let mouseMovementsRecorded = 0;
let timerInterval = null; 
let isTimerRunning = false; 

// Suspicion & Account Risk Ledger
let suspicionScore = 0;
let isSuspended = false;
let lastPostTimestamp = 0;

// --- FLOATING HUD TOGGLES ---

telemetryPill.addEventListener('click', () => {
    telemetryDrawer.classList.toggle('hidden');
});

closeHudBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    telemetryDrawer.classList.add('hidden');
});

// --- CAPTCHA GENERATOR & ESCALATION GATE ---

function generateCaptchaCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function drawCaptcha(code) {
    if (!captchaCanvas) return;
    const ctx = captchaCanvas.getContext('2d');
    ctx.clearRect(0, 0, captchaCanvas.width, captchaCanvas.height);
    
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, captchaCanvas.width, captchaCanvas.height);

    for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.2 + Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(Math.random() * captchaCanvas.width, Math.random() * captchaCanvas.height);
        ctx.lineTo(Math.random() * captchaCanvas.width, Math.random() * captchaCanvas.height);
        ctx.stroke();
    }

    ctx.font = "bold 32px monospace";
    for (let i = 0; i < code.length; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#38bdf8" : "#f8fafc";
        ctx.save();
        ctx.translate(25 + i * 36, 45);
        ctx.rotate((Math.random() - 0.5) * 0.4);
        ctx.fillText(code[i], 0, 0);
        ctx.restore();
    }
}

function triggerSuspensionGate() {
    isSuspended = true;
    currentCaptchaSecret = generateCaptchaCode();
    drawCaptcha(currentCaptchaSecret);
    captchaInput.value = "";
    captchaStatusMsg.textContent = "";
    captchaSuspensionModal.classList.remove('hidden');

    if (currentUser && db) {
        db.from('profiles').update({ is_suspended: true, suspicion_score: suspicionScore }).eq('id', currentUser.id);
    }
}

refreshCaptchaBtn.addEventListener('click', () => {
    currentCaptchaSecret = generateCaptchaCode();
    drawCaptcha(currentCaptchaSecret);
    captchaInput.value = "";
    captchaStatusMsg.textContent = "";
});

submitCaptchaBtn.addEventListener('click', async () => {
    const entered = captchaInput.value.trim().toUpperCase();
    if (entered === currentCaptchaSecret) {
        isSuspended = false;
        suspicionScore = 0;
        updateSuspicionUI();
        captchaSuspensionModal.classList.add('hidden');

        if (currentUser && db) {
            await db.from('profiles').update({ is_suspended: false, suspicion_score: 0 }).eq('id', currentUser.id);
        }
        alert("Verification successful! Your account is restored.");
    } else {
        captchaStatusMsg.textContent = "Incorrect code. Please try again.";
        currentCaptchaSecret = generateCaptchaCode();
        drawCaptcha(currentCaptchaSecret);
        captchaInput.value = "";
    }
});

function updateSuspicionUI() {
    statSuspicion.textContent = `${suspicionScore} / 3`;
    pillSuspicionTag.textContent = `${suspicionScore}/3 Risk`;

    if (suspicionScore === 0) {
        statSuspicion.className = "badge badge-green";
        pillSuspicionTag.style.color = "#22c55e";
    } else if (suspicionScore < 3) {
        statSuspicion.className = "badge badge-yellow";
        pillSuspicionTag.style.color = "#eab308";
    } else {
        statSuspicion.className = "badge badge-red";
        pillSuspicionTag.style.color = "#ef4444";
    }
}

// --- PERMISSIONS HELPERS ---

function isSiteAdmin(username = currentUsername) {
    if (!username) return false;
    return username.toLowerCase().replace('@', '') === SITE_ADMIN_USERNAME.toLowerCase();
}

function getThreadRole(threadName = activeThread, username = currentUsername) {
    if (!username) return "Guest";
    const cleanUser = username.toLowerCase().replace('@', '');
    if (cleanUser === SITE_ADMIN_USERNAME.toLowerCase()) return "Site Admin";

    const meta = threadMetaMap[threadName] || { owner: '', moderators: [], banned: [] };
    if (meta.owner && meta.owner.toLowerCase() === cleanUser) return "Owner";
    if (meta.moderators && meta.moderators.map(m => m.toLowerCase()).includes(cleanUser)) return "Moderator";
    if (meta.banned && meta.banned.map(b => b.toLowerCase()).includes(cleanUser)) return "Banned";
    return "Member";
}

function canDeletePost(post) {
    if (!currentUsername) return false;
    const cleanUser = currentUsername.toLowerCase().replace('@', '');
    if (isSiteAdmin(cleanUser)) return true;

    if (post.author && post.author.toLowerCase().replace('@', '') === cleanUser) return true;

    const role = getThreadRole(post.thread, cleanUser);
    return role === "Owner" || role === "Moderator";
}

function canDeleteThread(threadName = activeThread) {
    if (!currentUsername) return false;
    if (threadName === "Update Thread") return isSiteAdmin();
    const role = getThreadRole(threadName);
    return isSiteAdmin() || role === "Owner";
}

function canManagePermissions(threadName = activeThread) {
    if (!currentUsername) return false;
    const role = getThreadRole(threadName);
    return isSiteAdmin() || role === "Owner";
}

function canRevokePosting(threadName = activeThread) {
    if (!currentUsername) return false;
    const role = getThreadRole(threadName);
    return isSiteAdmin() || role === "Owner" || role === "Moderator";
}

function isUserBannedFromThread(threadName = activeThread, username = currentUsername) {
    if (!username) return false;
    if (isSiteAdmin(username)) return false;
    const meta = threadMetaMap[threadName];
    if (!meta || !meta.banned) return false;
    return meta.banned.map(u => u.toLowerCase()).includes(username.toLowerCase().replace('@', ''));
}

function saveThreadMeta() {
    localStorage.setItem('forum_thread_metadata', JSON.stringify(threadMetaMap));
}

// --- NOTIFICATIONS DISPATCHER & MANAGER ---

async function sendNotification(targetUserId, type, entityId, message) {
    if (!db || !currentUser || !targetUserId || targetUserId === currentUser.id) return;
    try {
        await db.from('user_notifications').insert([{
            user_id: targetUserId,
            actor_username: currentUsername,
            type: type,
            entity_id: entityId || null,
            message: message,
            is_read: false
        }]);
    } catch (e) {
        console.error("Failed to dispatch notification:", e);
    }
}

async function loadUserNotifications() {
    if (!currentUser || !db) return;

    try {
        const { data: notifs, error } = await db
            .from('user_notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('id', { ascending: false })
            .limit(40);

        if (error || !notifs || notifs.length === 0) {
            notificationsList.innerHTML = '<div class="no-posts">No notifications yet.</div>';
            activityNotifBadge.classList.add('hidden');
            return;
        }

        const unreadCount = notifs.filter(n => !n.is_read).length;
        if (unreadCount > 0) {
            activityNotifBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            activityNotifBadge.classList.remove('hidden');
        } else {
            activityNotifBadge.classList.add('hidden');
        }

        notificationsList.innerHTML = '';
        notifs.forEach(n => {
            const div = document.createElement('div');
            div.className = `notif-item ${!n.is_read ? 'unread' : ''}`;
            const timeAgo = new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            div.innerHTML = `
                <div class="notif-text">
                    <strong class="clickable-username" data-username="${escapeHTML(n.actor_username)}">@${escapeHTML(n.actor_username)}</strong>
                    ${escapeHTML(n.message)}
                </div>
                <div class="notif-time">${timeAgo}</div>
            `;

            div.querySelector('.clickable-username').addEventListener('click', (e) => {
                e.stopPropagation();
                window.openUserProfileCard(n.actor_username);
            });

            notificationsList.appendChild(div);
        });

    } catch (e) {
        console.error("Error loading activity notifications:", e);
    }
}

openNotifBtn.addEventListener('click', () => {
    notificationsModal.classList.remove('hidden');
    loadUserNotifications();
    
    if (currentUser && db) {
        db.from('user_notifications')
            .update({ is_read: true })
            .eq('user_id', currentUser.id)
            .eq('is_read', false)
            .then(() => {
                activityNotifBadge.classList.add('hidden');
            });
    }
});

closeNotificationsBtn.addEventListener('click', () => notificationsModal.classList.add('hidden'));
notificationsModal.addEventListener('click', (e) => {
    if (e.target === notificationsModal) notificationsModal.classList.add('hidden');
});

clearActivityNotifsBtn.addEventListener('click', async () => {
    if (!currentUser || !db) return;
    await db.from('user_notifications').delete().eq('user_id', currentUser.id);
    notificationsList.innerHTML = '<div class="no-posts">No notifications yet.</div>';
    activityNotifBadge.classList.add('hidden');
});

// --- USER SCORE & PUBLIC PROFILE LOGIC ---

async function calculateUserScore(username) {
    if (!username || !db) return 0;
    const cleanUser = username.toLowerCase().replace('@', '');

    try {
        const { data: posts } = await db
            .from('Posts')
            .select('likes, dislikes')
            .ilike('author', cleanUser);

        let total = 0;
        (posts || []).forEach(p => {
            total += (Number(p.likes || 0) - Number(p.dislikes || 0));
        });

        const { data: comments } = await db
            .from('post_comments')
            .select('likes, dislikes')
            .ilike('author', cleanUser);

        (comments || []).forEach(c => {
            total += (Number(c.likes || 0) - Number(c.dislikes || 0));
        });

        return total;
    } catch (e) {
        console.error("Error computing score:", e);
        return 0;
    }
}

async function updateProfileFriendButtonUI() {
    unaddConfirmBox.classList.add('hidden');
    targetFriendshipRecord = null;

    if (!currentUser || !targetProfileId || targetProfileUsername === currentUsername.toLowerCase().replace('@', '')) {
        userCardAddFriendBtn.classList.add('hidden');
        return;
    }

    userCardAddFriendBtn.classList.remove('hidden');

    const { data: friendship } = await db
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${targetProfileId}),and(user_id.eq.${targetProfileId},friend_id.eq.${currentUser.id})`)
        .maybeSingle();

    targetFriendshipRecord = friendship;

    if (friendship && friendship.status === 'accepted') {
        userCardAddFriendBtn.innerHTML = `✓ Friends`;
        userCardAddFriendBtn.className = 'btn-friend-state btn-friend-added';
    } else if (friendship && friendship.status === 'pending') {
        if (friendship.user_id === currentUser.id) {
            userCardAddFriendBtn.innerHTML = `⏳ Request Sent`;
            userCardAddFriendBtn.className = 'btn-friend-state secondary';
        } else {
            userCardAddFriendBtn.innerHTML = `📬 Accept Request`;
            userCardAddFriendBtn.className = 'btn-friend-state';
        }
    } else {
        userCardAddFriendBtn.innerHTML = `➕ Add Friend`;
        userCardAddFriendBtn.className = 'btn-friend-state';
    }
}

window.openUserProfileCard = async function(username) {
    if (!username) return;
    const cleanUser = username.toLowerCase().replace('@', '');
    targetProfileUsername = cleanUser;

    userCardUsername.textContent = `@${cleanUser}`;
    userCardScore.textContent = '...';
    userCardPfp.src = DEFAULT_AVATAR;

    try {
        const { data: profile } = await db
            .from('profiles')
            .select('id, avatar_url')
            .ilike('username', cleanUser)
            .maybeSingle();

        if (profile) {
            targetProfileId = profile.id;
            if (profile.avatar_url) userCardPfp.src = profile.avatar_url;
        } else {
            targetProfileId = null;
        }
    } catch (e) {
        console.error("Profile load err:", e);
    }

    await updateProfileFriendButtonUI();
    userProfileModal.classList.remove('hidden');

    const score = await calculateUserScore(cleanUser);
    userCardScore.textContent = score > 0 ? `+${score}` : `${score}`;
};

closeUserProfileBtn.addEventListener('click', () => userProfileModal.classList.add('hidden'));
userProfileModal.addEventListener('click', (e) => {
    if (e.target === userProfileModal) userProfileModal.classList.add('hidden');
});

userCardAddFriendBtn.addEventListener('click', async () => {
    if (!currentUser) {
        alert("Please log in to manage friends.");
        return;
    }

    if (targetFriendshipRecord && targetFriendshipRecord.status === 'accepted') {
        unaddConfirmBox.classList.toggle('hidden');
        return;
    }

    if (targetFriendshipRecord && targetFriendshipRecord.status === 'pending') {
        if (targetFriendshipRecord.user_id !== currentUser.id) {
            await handleRequest(targetFriendshipRecord.id, true);
            await updateProfileFriendButtonUI();
        }
        return;
    }

    if (!targetProfileId) return;

    const { error: insertErr } = await db
        .from('friendships')
        .insert([{ 
            user_id: currentUser.id, 
            friend_id: targetProfileId, 
            status: 'pending' 
        }]);

    if (insertErr) {
        alert(`Could not send request: ${insertErr.message}`);
        return;
    }

    await sendNotification(
        targetProfileId,
        'friend_request',
        null,
        'sent you a friend request.'
    );

    alert(`Friend request sent to @${targetProfileUsername}!`);
    await updateProfileFriendButtonUI();
    refreshMessagingHub();
});

confirmUnaddBtn.addEventListener('click', async () => {
    if (!targetFriendshipRecord) return;

    confirmUnaddBtn.disabled = true;
    const { error } = await db
        .from('friendships')
        .delete()
        .eq('id', targetFriendshipRecord.id);

    confirmUnaddBtn.disabled = false;

    if (error) {
        alert(`Error removing friend: ${error.message}`);
        return;
    }

    alert(`@${targetProfileUsername} has been removed from your friends.`);
    unaddConfirmBox.classList.add('hidden');
    await updateProfileFriendButtonUI();
    refreshMessagingHub();
});

cancelUnaddBtn.addEventListener('click', () => {
    unaddConfirmBox.classList.add('hidden');
});

// --- SESSION & AUTHENTICATION ---

async function syncUserState(user) {
    if (user) {
        currentUser = user;
        const { data: profile } = await db
            .from('profiles')
            .select('username, avatar_url, is_suspended, suspicion_score')
            .eq('id', currentUser.id)
            .maybeSingle();

        currentUsername = profile?.username || currentUser.user_metadata?.username || "human";
        currentAvatarUrl = profile?.avatar_url || null;
        suspicionScore = profile?.suspicion_score || 0;
        updateSuspicionUI();

        if (profile?.is_suspended) {
            triggerSuspensionGate();
        }

        currentUserTag.textContent = `@${currentUsername}`;
        deleteConfirmUserTag.textContent = `@${currentUsername}`;
        renderUserAvatar(currentAvatarUrl);

        if (currentAvatarUrl) {
            userAvatarCache.set(currentUser.id, currentAvatarUrl);
        }

        authPanel.classList.add('hidden');
        postPanel.classList.remove('hidden');
        openNotifBtn.classList.remove('hidden');
        openDmBtn.classList.remove('hidden');
        openProfileBtn.classList.remove('hidden');
        syncThreadDropdown();
        checkNotifications();
        loadUserNotifications();
        if (notifPollInterval) clearInterval(notifPollInterval);
        notifPollInterval = setInterval(() => {
            checkNotifications();
            loadUserNotifications();
        }, 4000);
    } else {
        currentUser = null;
        currentUsername = null;
        currentAvatarUrl = null;
        activeConversationId = null;
        suspicionScore = 0;
        updateSuspicionUI();
        if (dmInterval) clearInterval(dmInterval);
        if (notifPollInterval) clearInterval(notifPollInterval);

        postPanel.classList.add('hidden');
        openNotifBtn.classList.add('hidden');
        openDmBtn.classList.add('hidden');
        openProfileBtn.classList.add('hidden');
        notifBadge.classList.add('hidden');
        activityNotifBadge.classList.add('hidden');
        dmModal.classList.add('hidden');
        notificationsModal.classList.add('hidden');
        profileModal.classList.add('hidden');
        deleteConfirmModal.classList.add('hidden');
        permsModal.classList.add('hidden');
        threadDeleteModal.classList.add('hidden');
        linkModal.classList.add('hidden');
        userProfileModal.classList.add('hidden');
        captchaSuspensionModal.classList.add('hidden');
        authPanel.classList.remove('hidden');
        syncThreadDropdown();
    }

    updateThreadControlsUI();
    renderCurrentFeed();
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

openProfileBtn.addEventListener('click', () => profileModal.classList.remove('hidden'));
closeProfileBtn.addEventListener('click', () => profileModal.classList.add('hidden'));
profileModal.addEventListener('click', (e) => { if (e.target === profileModal) profileModal.classList.add('hidden'); });

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
        alert("The new passwords do not match.");
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

openDeleteModalBtn.addEventListener('click', () => {
    deleteConfirmModal.classList.remove('hidden');
    deleteUsernameInput.value = '';
});
closeDeleteModalBtn.addEventListener('click', () => deleteConfirmModal.classList.add('hidden'));
cancelDeleteBtn.addEventListener('click', () => deleteConfirmModal.classList.add('hidden'));
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

// --- THREAD SEARCH, SELECTION & UI SYNC ---

function loadSavedThreads() {
    const stored = localStorage.getItem('custom_forum_threads');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            parsed.forEach(t => {
                if (!availableThreads.includes(t)) availableThreads.push(t);
            });
        } catch (e) {
            console.error("Error reading stored threads", e);
        }
    }
    syncThreadDropdown();
    renderThreadChips();
}

function syncThreadDropdown() {
    topicSelect.innerHTML = '';
    
    availableThreads.forEach(t => {
        if (t === "Update Thread" && !isSiteAdmin()) {
            return;
        }

        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        topicSelect.appendChild(opt);
    });

    if (topicSelect.querySelector(`option[value="${activeThread}"]`)) {
        topicSelect.value = activeThread;
    } else if (topicSelect.options.length > 0) {
        topicSelect.selectedIndex = 0;
    }
}

function renderThreadChips(filterQuery = '') {
    threadChipsContainer.innerHTML = '';
    const query = filterQuery.toLowerCase().trim();
    
    const nonUpdateThreads = availableThreads.filter(t => t !== "Update Thread");
    const matching = nonUpdateThreads.filter(t => t.toLowerCase().includes(query));

    if (matching.length === 0) {
        threadChipsContainer.innerHTML = '<span style="font-size: 0.8rem; color: #64748b; padding: 4px 8px;">No matching threads found.</span>';
        return;
    }

    matching.forEach(threadName => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `thread-chip ${threadName === activeThread ? 'active' : ''}`;
        chip.textContent = threadName;
        chip.addEventListener('click', () => {
            activeThread = threadName;
            topicSelect.value = threadName;
            renderThreadChips(threadSearchInput.value);
            updateThreadControlsUI();
            loadForumPosts();
        });
        threadChipsContainer.appendChild(chip);
    });
}

function updateThreadControlsUI() {
    currentThreadTitle.textContent = activeThread;
    const role = getThreadRole(activeThread);
    currentUserThreadRole.textContent = role;

    currentUserThreadRole.className = 'thread-role-badge';
    if (role === 'Site Admin') currentUserThreadRole.classList.add('badge-purple');
    else if (role === 'Owner') currentUserThreadRole.classList.add('badge-yellow');
    else if (role === 'Moderator') currentUserThreadRole.classList.add('badge-green');
    else if (role === 'Banned') currentUserThreadRole.classList.add('badge-red');
    else currentUserThreadRole.classList.add('badge-blue');

    if (canManagePermissions(activeThread)) {
        managePermsBtn.classList.remove('hidden');
    } else {
        managePermsBtn.classList.add('hidden');
    }

    if (canDeleteThread(activeThread) && activeThread !== "Update Thread") {
        deleteThreadBtn.classList.remove('hidden');
    } else {
        deleteThreadBtn.classList.add('hidden');
    }
}

threadSearchInput.addEventListener('input', (e) => {
    renderThreadChips(e.target.value);
});

openNewThreadModalBtn.addEventListener('click', () => {
    if (!currentUser) { alert("Please log in to create a thread."); return; }
    threadModal.classList.remove('hidden');
});
triggerCreateThreadBtn.addEventListener('click', () => {
    if (!currentUser) { alert("Please log in to create a thread."); return; }
    threadModal.classList.remove('hidden');
});
closeThreadModalBtn.addEventListener('click', () => threadModal.classList.add('hidden'));
threadModal.addEventListener('click', (e) => {
    if (e.target === threadModal) threadModal.classList.add('hidden');
});

createThreadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentUsername) {
        alert("You must be logged in to create a thread.");
        return;
    }

    const newName = newThreadTitleInput.value.trim();
    if (!newName) return;

    if (availableThreads.some(t => t.toLowerCase() === newName.toLowerCase())) {
        alert("A thread with this name already exists.");
        return;
    }

    availableThreads.push(newName);
    
    threadMetaMap[newName] = {
        owner: currentUsername,
        moderators: [],
        banned: []
    };
    saveThreadMeta();

    const customList = availableThreads.filter(t => !DEFAULT_THREADS.includes(t));
    localStorage.setItem('custom_forum_threads', JSON.stringify(customList));

    syncThreadDropdown();
    activeThread = newName;
    topicSelect.value = newName;
    newThreadTitleInput.value = '';
    threadModal.classList.add('hidden');
    renderThreadChips(threadSearchInput.value);
    updateThreadControlsUI();
    loadForumPosts();
});

topicSelect.addEventListener('change', () => {
    activeThread = topicSelect.value;
    renderThreadChips(threadSearchInput.value);
    updateThreadControlsUI();
    loadForumPosts();
});

postSortSelect.addEventListener('change', () => {
    loadForumPosts();
});

// --- THREAD DELETION MODAL ---

deleteThreadBtn.addEventListener('click', () => {
    if (!canDeleteThread(activeThread)) {
        alert("You do not have permission to delete this thread.");
        return;
    }
    deleteThreadTargetName.textContent = activeThread;
    deleteThreadConfirmInput.value = '';
    threadDeleteModal.classList.remove('hidden');
});

closeThreadDeleteModalBtn.addEventListener('click', () => threadDeleteModal.classList.add('hidden'));
cancelDeleteThreadBtn.addEventListener('click', () => threadDeleteModal.classList.add('hidden'));
threadDeleteModal.addEventListener('click', (e) => {
    if (e.target === threadDeleteModal) threadDeleteModal.classList.add('hidden');
});

finalDeleteThreadBtn.addEventListener('click', async () => {
    const inputVal = deleteThreadConfirmInput.value.trim();
    if (inputVal !== activeThread) {
        alert(`Confirmation failed. You must type "${activeThread}" exactly to delete this thread.`);
        return;
    }

    finalDeleteThreadBtn.disabled = true;
    finalDeleteThreadBtn.textContent = 'Deleting...';

    if (db) {
        const { error } = await db.from('Posts').delete().eq('thread', activeThread);
        if (error) console.error("Error purging thread posts:", error);
    }

    delete threadMetaMap[activeThread];
    saveThreadMeta();

    availableThreads = availableThreads.filter(t => t !== activeThread);
    const customList = availableThreads.filter(t => !DEFAULT_THREADS.includes(t));
    localStorage.setItem('custom_forum_threads', JSON.stringify(customList));

    threadDeleteModal.classList.add('hidden');
    finalDeleteThreadBtn.disabled = false;
    finalDeleteThreadBtn.textContent = 'Confirm Delete';

    alert(`Thread "${inputVal}" has been permanently removed.`);

    activeThread = "Text Thread #2";
    syncThreadDropdown();
    renderThreadChips();
    updateThreadControlsUI();
    loadForumPosts();
});

// --- PERMISSIONS MANAGEMENT UI ---

managePermsBtn.addEventListener('click', () => openPermissionsManager());
closePermsModalBtn.addEventListener('click', () => permsModal.classList.add('hidden'));
permsModal.addEventListener('click', (e) => { if (e.target === permsModal) permsModal.classList.add('hidden'); });

function openPermissionsManager() {
    permsThreadName.textContent = activeThread;
    renderPermissionsUserList();
    permsModal.classList.remove('hidden');
}

function renderPermissionsUserList() {
    const meta = threadMetaMap[activeThread] || { owner: '', moderators: [], banned: [] };
    permsUserList.innerHTML = '';

    const trackedUsers = new Set();
    if (meta.owner) trackedUsers.add(meta.owner);
    (meta.moderators || []).forEach(u => trackedUsers.add(u));
    (meta.banned || []).forEach(u => trackedUsers.add(u));
    cachedPosts.forEach(p => { if (p.author) trackedUsers.add(p.author); });

    if (trackedUsers.size === 0) {
        permsUserList.innerHTML = '<div class="no-posts" style="padding: 10px;">No members active in this thread yet. Add a user above.</div>';
        return;
    }

    trackedUsers.forEach(uname => {
        const cleanUser = uname.toLowerCase().replace('@', '');
        const role = getThreadRole(activeThread, cleanUser);
        const isBanned = (meta.banned || []).map(u => u.toLowerCase()).includes(cleanUser);

        const row = document.createElement('div');
        row.className = 'perm-user-row';

        let badgeClass = 'badge-blue';
        if (role === 'Site Admin') badgeClass = 'badge-purple';
        else if (role === 'Owner') badgeClass = 'badge-yellow';
        else if (role === 'Moderator') badgeClass = 'badge-green';
        else if (role === 'Banned') badgeClass = 'badge-red';

        const nameCol = document.createElement('div');
        nameCol.className = 'perm-user-name';
        nameCol.innerHTML = `<span class="clickable-username" data-username="${escapeHTML(cleanUser)}">@${escapeHTML(cleanUser)}</span> <span class="badge ${badgeClass}">${role}</span>`;

        nameCol.querySelector('.clickable-username').addEventListener('click', () => {
            window.openUserProfileCard(cleanUser);
        });

        const btnCol = document.createElement('div');
        btnCol.className = 'perm-user-buttons';

        if (isSiteAdmin()) {
            if (role !== 'Owner') {
                const makeOwnerBtn = document.createElement('button');
                makeOwnerBtn.className = 'btn-perm secondary';
                makeOwnerBtn.textContent = 'Make Owner';
                makeOwnerBtn.onclick = () => {
                    meta.owner = cleanUser;
                    meta.moderators = (meta.moderators || []).filter(m => m.toLowerCase() !== cleanUser);
                    meta.banned = (meta.banned || []).filter(b => b.toLowerCase() !== cleanUser);
                    saveThreadMeta();
                    renderPermissionsUserList();
                    updateThreadControlsUI();
                };
                btnCol.appendChild(makeOwnerBtn);
            }
        }

        if (canManagePermissions(activeThread) && role !== 'Owner' && role !== 'Site Admin') {
            if (role === 'Moderator') {
                const demoteModBtn = document.createElement('button');
                demoteModBtn.className = 'btn-perm secondary';
                demoteModBtn.textContent = 'Demote Mod';
                demoteModBtn.onclick = () => {
                    meta.moderators = (meta.moderators || []).filter(m => m.toLowerCase() !== cleanUser);
                    saveThreadMeta();
                    renderPermissionsUserList();
                };
                btnCol.appendChild(demoteModBtn);
            } else {
                const promoteModBtn = document.createElement('button');
                promoteModBtn.className = 'btn-perm secondary';
                promoteModBtn.textContent = 'Promote Mod';
                promoteModBtn.onclick = () => {
                    if (!meta.moderators) meta.moderators = [];
                    if (!meta.moderators.map(m => m.toLowerCase()).includes(cleanUser)) {
                        meta.moderators.push(cleanUser);
                    }
                    meta.banned = (meta.banned || []).filter(b => b.toLowerCase() !== cleanUser);
                    saveThreadMeta();
                    renderPermissionsUserList();
                };
                btnCol.appendChild(promoteModBtn);
            }
        }

        if (canRevokePosting(activeThread) && role !== 'Owner' && role !== 'Site Admin') {
            if (isBanned) {
                const unbanBtn = document.createElement('button');
                unbanBtn.className = 'btn-perm secondary';
                unbanBtn.textContent = 'Allow Posting';
                unbanBtn.onclick = () => {
                    meta.banned = (meta.banned || []).filter(b => b.toLowerCase() !== cleanUser);
                    saveThreadMeta();
                    renderPermissionsUserList();
                };
                btnCol.appendChild(unbanBtn);
            } else {
                const banBtn = document.createElement('button');
                banBtn.className = 'btn-perm danger';
                banBtn.textContent = 'Revoke Access';
                banBtn.onclick = () => {
                    if (!meta.banned) meta.banned = [];
                    if (!meta.banned.map(b => b.toLowerCase()).includes(cleanUser)) {
                        meta.banned.push(cleanUser);
                    }
                    meta.moderators = (meta.moderators || []).filter(m => m.toLowerCase() !== cleanUser);
                    saveThreadMeta();
                    renderPermissionsUserList();
                };
                btnCol.appendChild(banBtn);
            }
        }

        row.appendChild(nameCol);
        row.appendChild(btnCol);
        permsUserList.appendChild(row);
    });
}

permUserAddBtn.addEventListener('click', () => {
    const raw = permUserLookup.value.trim().toLowerCase().replace('@', '');
    if (!raw) return;
    const meta = threadMetaMap[activeThread] || { owner: '', moderators: [], banned: [] };
    if (!meta.moderators) meta.moderators = [];
    threadMetaMap[activeThread] = meta;
    permUserLookup.value = '';
    renderPermissionsUserList();
});

// --- SAFE LINK INSERTION MODAL ---

openLinkModalBtn.addEventListener('click', () => {
    linkUrlInput.value = '';
    linkTextInput.value = '';
    linkModal.classList.remove('hidden');
});

closeLinkModalBtn.addEventListener('click', () => linkModal.classList.add('hidden'));
linkModal.addEventListener('click', (e) => { if (e.target === linkModal) linkModal.classList.add('hidden'); });

insertLinkForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let url = linkUrlInput.value.trim();
    const text = linkTextInput.value.trim();

    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    const formattedLink = text ? `[${text}](${url})` : url;

    const curVal = textBox.value;
    const cursorPos = textBox.selectionStart || curVal.length;
    const prefix = curVal.slice(0, cursorPos);
    const suffix = curVal.slice(cursorPos);
    
    textBox.value = `${prefix}${prefix.length > 0 && !prefix.endsWith(' ') ? ' ' : ''}${formattedLink} ${suffix}`;
    linkModal.classList.add('hidden');
    textBox.focus();
});

function renderFormattedContent(text) {
    if (!text) return '';
    const escaped = escapeHTML(text);

    const withMdLinks = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, label, href) => {
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });

    const withBareUrls = withMdLinks.replace(/(^|[^">])(https?:\/\/[^\s<]+)/g, (match, prefix, href) => {
        return `${prefix}<a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a>`;
    });

    return withBareUrls.replace(/\n/g, '<br>');
}

// --- PHOTO ATTACHMENT IN FORUM POSTS ---

postImageFile.addEventListener('change', () => {
    const file = postImageFile.files[0];
    if (file) {
        selectedPostPhotoFile = file;
        postPhotoFilename.textContent = `📷 ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
        postPhotoPreviewBar.classList.remove('hidden');
    }
});

removePostPhotoBtn.addEventListener('click', () => {
    selectedPostPhotoFile = null;
    postImageFile.value = '';
    postPhotoPreviewBar.classList.add('hidden');
});

// --- LIKES, DISLIKES & VOTING ENGINE ---

function getPostScore(post) {
    const dbLikes = Number(post.likes || 0);
    const dbDislikes = Number(post.dislikes || 0);
    const baseScore = dbLikes - dbDislikes;
    const localDelta = scoreOffsets[post.id] || 0;
    return baseScore + localDelta;
}

async function handleVote(postId, direction) {
    if (!currentUser) {
        alert("You must be logged in to like or dislike posts.");
        return;
    }
    if (isSuspended) {
        triggerSuspensionGate();
        return;
    }

    const post = postCacheMap.get(Number(postId));
    const currentVote = userVotes[postId] || 0;
    let newVote = 0;
    let deltaChange = 0;

    if (currentVote === direction) {
        newVote = 0;
        deltaChange = -direction;
    } else {
        newVote = direction;
        deltaChange = direction - currentVote;
    }

    userVotes[postId] = newVote;
    scoreOffsets[postId] = (scoreOffsets[postId] || 0) + deltaChange;

    localStorage.setItem('user_forum_votes', JSON.stringify(userVotes));
    localStorage.setItem('forum_score_offsets', JSON.stringify(scoreOffsets));

    renderCurrentFeed();

    if (post && post.author && newVote === 1 && post.author.toLowerCase() !== currentUsername.toLowerCase()) {
        const { data: targetProfile } = await db
            .from('profiles')
            .select('id')
            .ilike('username', post.author)
            .maybeSingle();

        if (targetProfile) {
            await sendNotification(
                targetProfile.id,
                'upvote_post',
                postId,
                `upvoted your post in "${post.thread}".`
            );
        }
    }
}

async function handleCommentVote(commentId, direction, commentAuthor) {
    if (!currentUser) {
        alert("You must be logged in to vote on comments.");
        return;
    }
    if (isSuspended) {
        triggerSuspensionGate();
        return;
    }

    const currentVote = userCommentVotes[commentId] || 0;
    let newVote = currentVote === direction ? 0 : direction;
    let delta = newVote - currentVote;

    userCommentVotes[commentId] = newVote;
    localStorage.setItem('user_forum_comment_votes', JSON.stringify(userCommentVotes));

    if (delta !== 0) {
        const { data: c } = await db.from('post_comments').select('likes, dislikes').eq('id', commentId).maybeSingle();
        if (c) {
            if (direction === 1) {
                await db.from('post_comments').update({ likes: Math.max(0, (c.likes || 0) + delta) }).eq('id', commentId);
            } else {
                await db.from('post_comments').update({ dislikes: Math.max(0, (c.dislikes || 0) + delta) }).eq('id', commentId);
            }
        }
    }

    if (newVote === 1 && commentAuthor && commentAuthor.toLowerCase() !== currentUsername.toLowerCase()) {
        const { data: targetProfile } = await db
            .from('profiles')
            .select('id')
            .ilike('username', commentAuthor)
            .maybeSingle();

        if (targetProfile) {
            await sendNotification(
                targetProfile.id,
                'upvote_comment',
                commentId,
                `upvoted your comment.`
            );
        }
    }
}

function sortPosts(posts) {
    const sortMode = postSortSelect.value;
    return [...posts].sort((a, b) => {
        const scoreA = getPostScore(a);
        const scoreB = getPostScore(b);

        if (sortMode === 'top') {
            if (scoreB !== scoreA) return scoreB - scoreA;
            return Number(b.id) - Number(a.id);
        } else if (sortMode === 'newest') {
            return Number(b.id) - Number(a.id);
        } else if (sortMode === 'oldest') {
            return Number(a.id) - Number(b.id);
        }
        return 0;
    });
}

// --- POST CREATION & MODERATION UI ---

function createPostCardElement(post) {
    const item = document.createElement('div');
    item.className = 'post-item';
    
    const dateFormatted = post.created_at ? new Date(post.created_at).toLocaleString() : 'Just now';
    const score = getPostScore(post);
    const myVote = userVotes[post.id] || 0;
    const postAuthorRole = getThreadRole(post.thread, post.author);

    let roleBadge = '';
    if (postAuthorRole === 'Site Admin') roleBadge = `<span class="badge badge-purple" style="font-size:0.65rem;">ADMIN</span>`;
    else if (postAuthorRole === 'Owner') roleBadge = `<span class="badge badge-yellow" style="font-size:0.65rem;">OWNER</span>`;
    else if (postAuthorRole === 'Moderator') roleBadge = `<span class="badge badge-green" style="font-size:0.65rem;">MOD</span>`;

    const userCanDelete = canDeletePost(post);
    const userCanRevoke = canRevokePosting(post.thread) && postAuthorRole !== 'Owner' && postAuthorRole !== 'Site Admin';

    let actionButtonsHtml = '';
    if (userCanDelete || userCanRevoke) {
        actionButtonsHtml = `<div class="post-admin-actions">`;
        if (userCanDelete) {
            actionButtonsHtml += `<button type="button" class="btn-post-action danger-text btn-delete-post" data-post-id="${post.id}">🗑️ Delete Post</button>`;
        }
        if (userCanRevoke && post.author && post.author !== currentUsername) {
            actionButtonsHtml += `<button type="button" class="btn-post-action danger-text btn-revoke-author" data-author="${post.author}">🚫 Revoke Access</button>`;
        }
        actionButtonsHtml += `</div>`;
    }

    const photoHtml = post.image_url ? `<a href="${post.image_url}" target="_blank" rel="noopener noreferrer"><img src="${post.image_url}" class="post-img-thumb" alt="Post photo" loading="lazy"></a>` : '';

    item.innerHTML = `
        <div class="vote-box">
            <button class="vote-btn ${myVote === 1 ? 'upvoted' : ''}" data-post-id="${post.id}" data-dir="1" title="Like">▲</button>
            <span class="vote-score">${score}</span>
            <button class="vote-btn ${myVote === -1 ? 'downvoted' : ''}" data-post-id="${post.id}" data-dir="-1" title="Dislike">▼</button>
        </div>
        <div class="post-body">
            <div class="post-meta">
                <div class="post-author-wrap">
                    <span>By: <strong class="post-author clickable-username" data-username="${escapeHTML(post.author || 'anonymous')}">@${escapeHTML(post.author || 'anonymous')}</strong></span>
                    ${roleBadge}
                </div>
                <span>${dateFormatted}</span>
            </div>
            <div class="post-content">${renderFormattedContent(post.content || '')}</div>
            ${photoHtml}
            ${actionButtonsHtml}

            <!-- Comment Toggle Button -->
            <button type="button" class="btn-toggle-comments" data-post-id="${post.id}">
                💬 Comments <span class="comment-count" data-post-id="${post.id}">(0)</span>
            </button>

            <!-- Comments Drawer -->
            <div class="post-comments-container hidden" id="comments-container-${post.id}">
                <div class="comments-list" id="comments-list-${post.id}">
                    <div style="font-size:0.8rem; color:#64748b;">Loading comments...</div>
                </div>
                <form class="comment-form" data-post-id="${post.id}">
                    <input type="text" placeholder="Write a reply..." required autocomplete="off">
                    <button type="submit">Reply</button>
                </form>
            </div>
        </div>
    `;

    item.querySelector('.clickable-username').addEventListener('click', (e) => {
        window.openUserProfileCard(e.currentTarget.getAttribute('data-username'));
    });

    item.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pId = e.currentTarget.getAttribute('data-post-id');
            const dir = parseInt(e.currentTarget.getAttribute('data-dir'), 10);
            handleVote(pId, dir);
        });
    });

    const toggleBtn = item.querySelector('.btn-toggle-comments');
    const container = item.querySelector(`#comments-container-${post.id}`);
    toggleBtn.addEventListener('click', () => {
        container.classList.toggle('hidden');
        if (!container.classList.contains('hidden')) {
            loadPostComments(post.id, post);
        }
    });

    fetchCommentCount(post.id, item.querySelector(`.comment-count[data-post-id="${post.id}"]`));

    const commentForm = item.querySelector('.comment-form');
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("You must be logged in to comment.");
            return;
        }
        if (isSuspended) {
            triggerSuspensionGate();
            return;
        }

        const input = commentForm.querySelector('input');
        const text = input.value.trim();
        if (!text) return;

        const { error } = await db.from('post_comments').insert([{
            post_id: post.id,
            author: currentUsername,
            user_id: currentUser.id,
            content: text
        }]);

        if (error) {
            alert(`Comment failed: ${error.message}`);
            return;
        }

        if (post.author && post.author.toLowerCase() !== currentUsername.toLowerCase()) {
            const { data: authorProfile } = await db
                .from('profiles')
                .select('id')
                .ilike('username', post.author)
                .maybeSingle();

            if (authorProfile) {
                await sendNotification(
                    authorProfile.id,
                    'comment_reply',
                    post.id,
                    `replied to your post: "${text.substring(0, 36)}..."`
                );
            }
        }

        input.value = '';
        await loadPostComments(post.id, post);
        fetchCommentCount(post.id, item.querySelector(`.comment-count[data-post-id="${post.id}"]`));
    });

    const deleteBtn = item.querySelector('.btn-delete-post');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!confirm("Are you sure you want to delete this post?")) return;
            await deletePostById(post.id);
        });
    }

    const revokeBtn = item.querySelector('.btn-revoke-author');
    if (revokeBtn) {
        revokeBtn.addEventListener('click', () => {
            const target = revokeBtn.getAttribute('data-author');
            if (!confirm(`Revoke posting privileges from @${target} in "${post.thread}"?`)) return;
            const meta = threadMetaMap[post.thread] || { owner: '', moderators: [], banned: [] };
            if (!meta.banned) meta.banned = [];
            if (!meta.banned.includes(target)) meta.banned.push(target);
            saveThreadMeta();
            alert(`@${target} has had their posting access revoked in this thread.`);
            renderCurrentFeed();
        });
    }

    return item;
}

async function fetchCommentCount(postId, countElement) {
    if (!db || !countElement) return;
    try {
        const { count } = await db
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        countElement.textContent = `(${count || 0})`;
    } catch (e) {
        countElement.textContent = `(0)`;
    }
}

async function loadPostComments(postId, post) {
    const listEl = document.getElementById(`comments-list-${postId}`);
    if (!listEl || !db) return;

    try {
        const { data: comments, error } = await db
            .from('post_comments')
            .select('*')
            .eq('post_id', postId)
            .order('id', { ascending: true });

        if (error || !comments || comments.length === 0) {
            listEl.innerHTML = '<div style="font-size: 0.8rem; color: #64748b;">No comments yet. Start the conversation!</div>';
            return;
        }

        listEl.innerHTML = '';
        comments.forEach(c => {
            const myVote = userCommentVotes[c.id] || 0;
            const commentScore = (Number(c.likes || 0) - Number(c.dislikes || 0));

            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <div class="comment-vote-box">
                    <button class="comment-vote-btn ${myVote === 1 ? 'upvoted' : ''}" data-dir="1">▲</button>
                    <span class="comment-vote-score">${commentScore}</span>
                    <button class="comment-vote-btn ${myVote === -1 ? 'downvoted' : ''}" data-dir="-1">▼</button>
                </div>
                <div class="comment-body">
                    <div class="comment-meta">
                        <span class="clickable-username" data-username="${escapeHTML(c.author)}">@${escapeHTML(c.author)}</span>
                        <span>${new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="comment-content">${renderFormattedContent(c.content)}</div>
                </div>
            `;

            div.querySelector('.clickable-username').addEventListener('click', (e) => {
                window.openUserProfileCard(e.currentTarget.getAttribute('data-username'));
            });

            div.querySelectorAll('.comment-vote-btn').forEach(b => {
                b.addEventListener('click', async (e) => {
                    const dir = parseInt(e.currentTarget.getAttribute('data-dir'), 10);
                    await handleCommentVote(c.id, dir, c.author);
                    await loadPostComments(postId, post);
                });
            });

            listEl.appendChild(div);
        });
    } catch (e) {
        listEl.innerHTML = '<div style="font-size: 0.8rem; color: #ef4444;">Could not load comments.</div>';
    }
}

async function deletePostById(postId) {
    if (db) {
        const { error } = await db.from('Posts').delete().eq('id', postId);
        if (error) {
            alert(`Error deleting post: ${error.message}`);
            return;
        }
    }
    cachedPosts = cachedPosts.filter(p => String(p.id) !== String(postId));
    renderCurrentFeed();
    loadProminentUpdates();
}

function renderCurrentFeed() {
    const sorted = sortPosts(cachedPosts);
    if (!sorted || sorted.length === 0) {
        forumFeed.innerHTML = `<div class="no-posts">No human content posted inside "${escapeHTML(activeThread)}" yet...</div>`;
        return;
    }

    forumFeed.innerHTML = '';
    sorted.forEach(post => {
        forumFeed.appendChild(createPostCardElement(post));
    });
}

// --- FORUM RETRIEVAL ---

async function loadForumPosts() {
    updateThreadControlsUI();
    if (!db) return;

    const { data: posts, error } = await db
        .from('Posts')
        .select('*')
        .eq('thread', activeThread);

    if (error) {
        console.error("Cloud Retrieval Error:", error);
        forumFeed.innerHTML = `<div class="no-posts" style="color: #f87171;">Error loading posts: ${escapeHTML(error.message)}</div>`;
        return;
    }

    cachedPosts = posts || [];
    cachedPosts.forEach(p => postCacheMap.set(p.id, p));
    renderCurrentFeed();
}

// --- PINNED UPDATES TICKER & MODAL ---

async function loadProminentUpdates() {
    if (!db) return;

    const { data: updates, error } = await db
        .from('Posts')
        .select('*')
        .eq('thread', 'Update Thread')
        .order('id', { ascending: false });

    if (error || !updates || updates.length === 0) {
        tickerContent.innerHTML = `<span class="ticker-item">No official updates posted yet.</span>`;
        return;
    }

    cachedUpdates = updates;

    const items = updates.map(u => {
        const date = u.created_at ? new Date(u.created_at).toLocaleDateString() : '';
        return `<span class="ticker-item" data-id="${u.id}">📢 [${date}] <strong>@${escapeHTML(u.author)}:</strong> ${escapeHTML(u.content).substring(0, 100)}...</span>`;
    }).join('');

    tickerContent.innerHTML = items + items;

    tickerBadge.onclick = () => openUpdatesDrawer();
    tickerContent.onclick = () => openUpdatesDrawer();
}

function openUpdatesDrawer() {
    updatesModalFeed.innerHTML = '';
    if (cachedUpdates.length === 0) {
        updatesModalFeed.innerHTML = '<div class="no-posts">No pinned updates yet.</div>';
    } else {
        cachedUpdates.forEach(update => {
            updatesModalFeed.appendChild(createPostCardElement(update));
        });
    }
    updatesModal.classList.remove('hidden');
}

closeUpdatesModalBtn.addEventListener('click', () => updatesModal.classList.add('hidden'));
updatesModal.addEventListener('click', (e) => { if (e.target === updatesModal) updatesModal.classList.add('hidden'); });

// --- NOTIFICATION ENGINE (Direct Messages) ---

async function checkNotifications() {
    if (!currentUser || !db) return;

    try {
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
    } catch (e) {
        console.error("Notif check error:", e);
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

// --- MESSAGING & CHATS HUB ---

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
            <span class="clickable-username" data-username="${escapeHTML(username)}">@${escapeHTML(username)}</span>
            <div class="req-actions">
                <button class="btn-accept" title="Accept">✓</button>
                <button class="btn-deny" title="Deny">✕</button>
            </div>
        `;

        item.querySelector('.clickable-username').addEventListener('click', () => {
            window.openUserProfileCard(username);
        });

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
                <span class="clickable-username" data-username="${escapeHTML(friend.username)}">@${escapeHTML(friend.username)}</span>
            </div>
            <span class="conv-badge ${badgeHidden}">${unreadCount}</span>
        `;

        div.querySelector('.clickable-username').addEventListener('click', (e) => {
            e.stopPropagation();
            window.openUserProfileCard(friend.username);
        });

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

    if (targetUsername === currentUsername.toLowerCase()) {
        alert("You cannot add yourself as a friend.");
        return;
    }

    const { data: targetProfile, error: profileErr } = await db
        .from('profiles')
        .select('id, username')
        .ilike('username', targetUsername)
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

    await sendNotification(
        targetProfile.id,
        'friend_request',
        null,
        'sent you a friend request.'
    );

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

toggleGroupCreateBtn.addEventListener('click', () => groupCreatorBox.classList.toggle('hidden'));
cancelGroupBtn.addEventListener('click', () => groupCreatorBox.classList.add('hidden'));

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

    const senderIds = Array.from(new Set(messages.map(m => m.sender_id)));
    await ensureAvatarsCached(senderIds);

    messages.forEach(msg => {
        const isMine = msg.sender_id === currentUser.id;
        const senderAvatar = userAvatarCache.get(msg.sender_id) || DEFAULT_AVATAR;

        const row = document.createElement('div');
        row.className = `msg-row ${isMine ? 'mine' : 'theirs'}`;

        const avatarImgHtml = `<img src="${senderAvatar}" class="msg-avatar clickable-avatar" data-username="${escapeHTML(msg.sender_username)}" alt="pfp" title="@${escapeHTML(msg.sender_username)}">`;
        const authorHtml = !isMine ? `<div class="msg-author clickable-username" data-username="${escapeHTML(msg.sender_username)}">@${escapeHTML(msg.sender_username)}</div>` : '';
        const textHtml = msg.content ? `<div>${renderFormattedContent(msg.content)}</div>` : '';
        const imgHtml = msg.image_url ? `<a href="${msg.image_url}" target="_blank"><img src="${msg.image_url}" class="chat-img-thumb" alt="Uploaded photo" loading="lazy"></a>` : '';

        const bubbleHtml = `
            <div class="msg-bubble ${isMine ? 'msg-mine' : 'msg-theirs'}">
                ${authorHtml}${textHtml}${imgHtml}
            </div>
        `;

        row.innerHTML = isMine ? (bubbleHtml + avatarImgHtml) : (avatarImgHtml + bubbleHtml);

        const attachedImg = row.querySelector('.chat-img-thumb');
        if (attachedImg) {
            attachedImg.onload = () => scrollToBottom(forceScroll);
        }

        row.querySelectorAll('.clickable-username, .clickable-avatar').forEach(clickable => {
            clickable.addEventListener('click', (e) => {
                const u = e.currentTarget.getAttribute('data-username');
                if (u) window.openUserProfileCard(u);
            });
        });

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
    if (isSuspended) {
        triggerSuspensionGate();
        return;
    }

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
    statPaste.className = "badge badge-yellow";
    if (!isTimerRunning) startCompositionTimer();
});

textBox.addEventListener('keydown', (e) => {
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

    if (!isTimerRunning) startCompositionTimer();
    
    const currentTime = Date.now();
    
    if (lastKeyTime !== null) {
        const gap = currentTime - lastKeyTime;
        if (keystrokeGaps.length < 50) keystrokeGaps.push(gap);
    }
    
    lastKeyTime = currentTime;
    statKeys.textContent = `${textBox.value.length + 1} keys`;
});

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
    selectedPostPhotoFile = null;
    postImageFile.value = '';
    postPhotoPreviewBar.classList.add('hidden');
    statPaste.textContent = "FALSE";
    statPaste.className = "badge badge-green";
    statTimer.textContent = "0.0s"; 
    statKeys.textContent = "0 keys";
}

// --- FORUM SUBMISSION WITH RISK SCORING & CAPTCHA ESCALATION ---

forumForm.addEventListener('submit', async (event) => {
    event.preventDefault(); 
    
    if (!currentUsername) {
        alert("You must be logged in to post.");
        return;
    }

    if (isSuspended) {
        triggerSuspensionGate();
        return;
    }

    const targetThread = topicSelect.value;

    if (isUserBannedFromThread(targetThread, currentUsername)) {
        alert(`Posting Permission Denied: Your access to post in "${targetThread}" has been revoked.`);
        return;
    }

    if (targetThread === "Update Thread" && !isSiteAdmin()) {
        alert("Permission Denied: Only @gemini can publish to the Official Updates section.");
        return;
    }

    let behaviorPoints = 0;

    // 1. Honeypot check
    if (honeypotField.value !== "") {
        behaviorPoints += 5;
    }

    // 2. Paste scoring
    if (textWasPasted) {
        behaviorPoints += 1;
    }

    // 3. Impossibly fast timing
    const totalTimeElapsed = pageLoadTime ? (Date.now() - pageLoadTime) / 1000 : 0;
    if (totalTimeElapsed < 1.5 && textBox.value.length > 50) {
        behaviorPoints += 1;
    }

    // 4. Rate-limit burst detection
    const now = Date.now();
    if (lastPostTimestamp > 0 && (now - lastPostTimestamp) < 15000) {
        behaviorPoints += 2;
    }

    // 5. Cadence uniformity
    if (keystrokeGaps.length > 5) {
        let perfectIntervals = 0;
        for (let i = 2; i < keystrokeGaps.length; i++) {
            if (keystrokeGaps[i] === keystrokeGaps[i - 1]) perfectIntervals++;
        }
        const uniformityRatio = perfectIntervals / (keystrokeGaps.length - 2);
        if (uniformityRatio > 0.75) {
            behaviorPoints += 1;
        }
    }

    if (behaviorPoints > 0) {
        suspicionScore += behaviorPoints;
        updateSuspicionUI();

        if (currentUser && db) {
            db.from('profiles').update({ suspicion_score: suspicionScore }).eq('id', currentUser.id);
        }

        if (suspicionScore >= 3) {
            triggerSuspensionGate();
            return;
        }
    }

    if (textBox.value.trim().length < 2 && !selectedPostPhotoFile) {
        alert("Please enter a message or attach a photo.");
        return;
    }

    const submitBtn = document.getElementById('forum-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing...';

    let postImageUrl = null;

    if (selectedPostPhotoFile) {
        const fileExt = selectedPostPhotoFile.name.split('.').pop();
        const filePath = `forum_posts/${currentUser.id}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await db.storage
            .from('chat-images')
            .upload(filePath, selectedPostPhotoFile);

        if (uploadError) {
            console.error("Post image upload failed:", uploadError);
        } else {
            const { data: publicUrlData } = db.storage
                .from('chat-images')
                .getPublicUrl(filePath);
            postImageUrl = publicUrlData.publicUrl;
        }
    }

    const { error } = await db
        .from('Posts')
        .insert([{ 
            thread: targetThread, 
            author: currentUsername, 
            content: textBox.value,
            image_url: postImageUrl
        }]);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Publish to Forum';

    if (error) {
        alert(`Database Error: ${error.message}`);
        console.error("Supabase Insert Error:", error);
        return;
    }

    lastPostTimestamp = Date.now();

    if (targetThread === "Update Thread") {
        await loadProminentUpdates();
    } else {
        activeThread = targetThread;
        renderThreadChips(threadSearchInput.value);
        await loadForumPosts();
    }

    resetTelemetryConsole();
});

// Boot Application
loadSavedThreads();
loadProminentUpdates();
loadForumPosts();
