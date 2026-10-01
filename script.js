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
const MANDATORY_THREADS = ["Welcome & Security", "Update Thread"];

// Helper to safely bind event listeners without throwing when elements don't exist
function safeAddListener(el, event, handler) {
    if (el) el.addEventListener(event, handler);
}

// DOM Elements - Auth & Nav
const authPanelWrapper = document.getElementById('auth-panel-wrapper');
const authPanel = document.getElementById('auth-panel');
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

// FAB Modal & Wrappers
const desktopFab = document.getElementById('desktop-fab');
const mobileFab = document.getElementById('mobile-fab');
const fabModalOverlay = document.getElementById('fab-post-modal');
const fabModalContainer = document.getElementById('fab-modal-container');
const closeFabModalBtn = document.getElementById('close-fab-modal-btn');
const threadSearchSelect = document.getElementById('thread-search-select');
const threadSuggestDropdown = document.getElementById('thread-suggest-dropdown');

// Header Nav & Profile Bar (Desktop)
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

// Mobile Bottom Navigation Elements
const mobileTabBar = document.getElementById('mobile-tab-bar');
const tabNavFeed = document.getElementById('tab-nav-feed');
const tabNavMessages = document.getElementById('tab-nav-messages');
const tabNavNotifs = document.getElementById('tab-nav-notifs');
const tabNavProfile = document.getElementById('tab-nav-profile');
const tabAvatarImg = document.getElementById('tab-avatar-img');
const tabAvatarFallback = document.getElementById('tab-avatar-fallback');
const mobileMsgBadge = document.getElementById('mobile-msg-badge');
const mobileActivityBadge = document.getElementById('mobile-activity-badge');

// Pinned Updates Ticker & Modal
const tickerBadge = document.getElementById('ticker-badge');
const tickerContent = document.getElementById('ticker-content');
const updatesModal = document.getElementById('updates-modal');
const closeUpdatesModalBtn = document.getElementById('close-updates-modal-btn');
const updatesModalFeed = document.getElementById('updates-modal-feed');

// Thread Sidebar & Discovery Elements
const joinedThreadsContainer = document.getElementById('joined-threads-container');
const sidebarNewThreadBtn = document.getElementById('sidebar-new-thread-btn');
const threadSearchInput = document.getElementById('thread-search-input');
const threadDiscoveryBox = document.getElementById('thread-discovery-box');
const postSortSelect = document.getElementById('post-sort-select');
const joinLeaveActiveThreadBtn = document.getElementById('join-leave-active-thread-btn');

// Forum & Active Thread Elements
const forumForm = document.getElementById('forumForm');
const textBox = document.getElementById('forum-post');
const honeypotField = document.getElementById('honeypot-field');
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

// Thread Creation Modal Elements
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

// Public User Profile Card Elements
const userProfileModal = document.getElementById('user-profile-modal');
const closeUserProfileBtn = document.getElementById('close-user-profile-btn');
const userCardPfp = document.getElementById('user-card-pfp');
const userCardUsername = document.getElementById('user-card-username');
const userCardScore = document.getElementById('user-card-score');
const userCardMsgBtn = document.getElementById('user-card-msg-btn');
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

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' fill='%2364748b' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4'/><path d='M12 14c-4.42 0-8 2.69-8 6v1h16v-1c0-3.31-3.58-6-8-6z'/></svg>";

// App State
let currentUser = null;
let currentUsername = null;
let currentAvatarUrl = null;
let isSignUpMode = false;
let userAvatarCache = new Map();
let usernameAvatarMap = new Map();
let notifPollInterval = null;

// Thread State (Synced to Cloud)
let allCloudThreads = []; 
let myJoinedThreadNames = new Set(MANDATORY_THREADS);
let activeThread = "Welcome & Security";
let currentFetchId = 0;

let threadMetaMap = JSON.parse(localStorage.getItem('forum_thread_metadata') || '{}');
if (!threadMetaMap["Welcome & Security"]) threadMetaMap["Welcome & Security"] = { owner: SITE_ADMIN_USERNAME, moderators: [], banned: [] };
if (!threadMetaMap["Update Thread"]) threadMetaMap["Update Thread"] = { owner: SITE_ADMIN_USERNAME, moderators: [], banned: [] };

// Voting & Cache
let userVotes = JSON.parse(localStorage.getItem('user_forum_votes') || '{}');
let userCommentVotes = JSON.parse(localStorage.getItem('user_forum_comment_votes') || '{}');
let cachedPosts = [];
let cachedUpdates = [];
let postCacheMap = new Map();

// Telemetry State
let pageLoadTime = null; 
let textWasPasted = false;
let keystrokeGaps = [];
let lastKeyTime = null;
let mouseMovementsRecorded = 0;
let timerInterval = null; 
let isTimerRunning = false; 

// Suspicion Ledger
let suspicionScore = 0;
let isSuspended = false;
let lastPostTimestamp = 0;

// --- NAVIGATION & ROUTING ---

function setMobileTabActive(tabName) {
    [tabNavFeed, tabNavMessages, tabNavNotifs, tabNavProfile].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    if (tabName === 'feed' && tabNavFeed) tabNavFeed.classList.add('active');
    else if (tabName === 'messages' && tabNavMessages) tabNavMessages.classList.add('active');
    else if (tabName === 'notifs' && tabNavNotifs) tabNavNotifs.classList.add('active');
    else if (tabName === 'profile' && tabNavProfile) tabNavProfile.classList.add('active');
}

function openNotificationsModal() {
    if (!currentUser) { 
        alert("Please log in to view notifications."); 
        setMobileTabActive('feed');
        return; 
    }
    if (notificationsModal) notificationsModal.classList.remove('hidden');
    loadUserNotifications();
    if (db) {
        db.from('user_notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false)
            .then(() => {
                if (activityNotifBadge) activityNotifBadge.classList.add('hidden');
                if (mobileActivityBadge) mobileActivityBadge.classList.add('hidden');
            }).catch(() => {});
    }
    setMobileTabActive('notifs');
}

safeAddListener(tabNavFeed, 'click', () => {
    if (notificationsModal) notificationsModal.classList.add('hidden');
    if (userProfileModal) userProfileModal.classList.add('hidden');
    setMobileTabActive('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

safeAddListener(tabNavNotifs, 'click', openNotificationsModal);
safeAddListener(openNotifBtn, 'click', openNotificationsModal);

safeAddListener(closeNotificationsBtn, 'click', () => {
    if (notificationsModal) notificationsModal.classList.add('hidden');
    setMobileTabActive('feed');
});

safeAddListener(telemetryPill, 'click', () => {
    if (telemetryDrawer) telemetryDrawer.classList.toggle('hidden');
});

safeAddListener(closeHudBtn, 'click', (e) => {
    e.stopPropagation();
    if (telemetryDrawer) telemetryDrawer.classList.add('hidden');
});

// --- CAPTCHA CHALLENGE GATE ---

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
    if (captchaInput) captchaInput.value = "";
    if (captchaStatusMsg) captchaStatusMsg.textContent = "";
    if (captchaSuspensionModal) captchaSuspensionModal.classList.remove('hidden');

    if (currentUser && db) {
        db.from('profiles').update({ is_suspended: true, suspicion_score: suspicionScore }).eq('id', currentUser.id).catch(() => {});
    }
}

safeAddListener(refreshCaptchaBtn, 'click', () => {
    currentCaptchaSecret = generateCaptchaCode();
    drawCaptcha(currentCaptchaSecret);
    if (captchaInput) captchaInput.value = "";
    if (captchaStatusMsg) captchaStatusMsg.textContent = "";
});

safeAddListener(submitCaptchaBtn, 'click', async () => {
    const entered = (captchaInput ? captchaInput.value : "").trim().toUpperCase();
    if (entered === currentCaptchaSecret) {
        isSuspended = false;
        suspicionScore = 0;
        updateSuspicionUI();
        if (captchaSuspensionModal) captchaSuspensionModal.classList.add('hidden');

        if (currentUser && db) {
            await db.from('profiles').update({ is_suspended: false, suspicion_score: 0 }).eq('id', currentUser.id).catch(() => {});
        }
        alert("Verification successful! Your account is restored.");
    } else {
        if (captchaStatusMsg) captchaStatusMsg.textContent = "Incorrect code. Please try again.";
        currentCaptchaSecret = generateCaptchaCode();
        drawCaptcha(currentCaptchaSecret);
        if (captchaInput) captchaInput.value = "";
    }
});

function updateSuspicionUI() {
    if (!statSuspicion || !pillSuspicionTag) return;
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
    if (MANDATORY_THREADS.includes(threadName)) return false;
    const role = getThreadRole(threadName);
    return isSiteAdmin() || role === "Owner";
}

function canManagePermissions(threadName = activeThread) {
    if (!currentUsername) return false;
    if (threadName === "Welcome & Security") return isSiteAdmin();
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
        console.warn("Failed to dispatch notification:", e);
    }
}

async function loadUserNotifications() {
    if (!currentUser || !db || !notificationsList) return;

    try {
        const { data: notifs, error } = await db
            .from('user_notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('id', { ascending: false })
            .limit(40);

        if (error || !notifs || notifs.length === 0) {
            notificationsList.innerHTML = '<div class="no-posts">No notifications yet.</div>';
            if (activityNotifBadge) activityNotifBadge.classList.add('hidden');
            if (mobileActivityBadge) mobileActivityBadge.classList.add('hidden');
            return;
        }

        const unreadCount = notifs.filter(n => !n.is_read).length;
        if (unreadCount > 0) {
            const badgeText = unreadCount > 99 ? '99+' : unreadCount;
            if (activityNotifBadge) {
                activityNotifBadge.textContent = badgeText;
                activityNotifBadge.classList.remove('hidden');
            }
            if (mobileActivityBadge) {
                mobileActivityBadge.textContent = badgeText;
                mobileActivityBadge.classList.remove('hidden');
            }
        } else {
            if (activityNotifBadge) activityNotifBadge.classList.add('hidden');
            if (mobileActivityBadge) mobileActivityBadge.classList.add('hidden');
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
            
            if (['upvote_post', 'comment_reply', 'upvote_comment'].includes(n.type) && n.entity_id) {
                div.style.cursor = 'pointer';
                div.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('clickable-username')) {
                        navigateToPost(n.entity_id);
                    }
                });
            }

            const clickUser = div.querySelector('.clickable-username');
            if (clickUser) {
                clickUser.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.openUserProfileCard(n.actor_username);
                });
            }

            notificationsList.appendChild(div);
        });

    } catch (e) {
        console.warn("Error loading activity notifications:", e);
    }
}

safeAddListener(clearActivityNotifsBtn, 'click', async () => {
    if (!currentUser || !db) return;
    await db.from('user_notifications').delete().eq('user_id', currentUser.id);
    if (notificationsList) notificationsList.innerHTML = '<div class="no-posts">No notifications yet.</div>';
    if (activityNotifBadge) activityNotifBadge.classList.add('hidden');
    if (mobileActivityBadge) mobileActivityBadge.classList.add('hidden');
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
        console.warn("Error computing score:", e);
        return 0;
    }
}

window.openUserProfileCard = async function(username) {
    if (!username || !userProfileModal) return;
    const cleanUser = username.toLowerCase().replace('@', '');
    targetProfileUsername = cleanUser;

    if (userCardUsername) userCardUsername.textContent = `@${cleanUser}`;
    if (userCardScore) userCardScore.textContent = '...';
    if (userCardPfp) userCardPfp.src = DEFAULT_AVATAR;

    try {
        const { data: profile } = await db
            .from('profiles')
            .select('id, username, avatar_url')
            .ilike('username', cleanUser)
            .maybeSingle();

        if (profile) {
            targetProfileId = profile.id;
            if (profile.avatar_url && userCardPfp) {
                userCardPfp.src = profile.avatar_url;
                usernameAvatarMap.set(cleanUser, profile.avatar_url);
            }
        } else {
            targetProfileId = null;
        }
    } catch (e) {
        console.warn("Profile load err:", e);
    }

    userProfileModal.classList.remove('hidden');
    const score = await calculateUserScore(cleanUser);
    if (userCardScore) userCardScore.textContent = score > 0 ? `+${score}` : `${score}`;
};

safeAddListener(closeUserProfileBtn, 'click', () => {
    if (userProfileModal) userProfileModal.classList.add('hidden');
});

// --- SESSION & AUTHENTICATION ---

async function syncUserState(user) {
    if (user) {
        currentUser = user;
        currentUsername = user.user_metadata?.username || user.email?.split('@')[0] || "human";
        if (currentUserTag) currentUserTag.textContent = `@${currentUsername}`;
        
        if (authPanelWrapper) authPanelWrapper.classList.add('hidden');
        if (openNotifBtn) openNotifBtn.classList.remove('hidden');
        if (openProfileBtn) openProfileBtn.classList.remove('hidden');

        try {
            const { data: profile } = await db
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (profile) {
                if (profile.username) {
                    currentUsername = profile.username;
                    if (currentUserTag) currentUserTag.textContent = `@${currentUsername}`;
                }
                if (profile.avatar_url) {
                    currentAvatarUrl = profile.avatar_url;
                    userAvatarCache.set(currentUser.id, currentAvatarUrl);
                    usernameAvatarMap.set(currentUsername.toLowerCase(), currentAvatarUrl);
                    renderUserAvatar(currentAvatarUrl);
                }
                if (profile.suspicion_score != null) {
                    suspicionScore = profile.suspicion_score;
                    updateSuspicionUI();
                }
                if (profile.is_suspended) {
                    triggerSuspensionGate();
                }
            }
        } catch (err) {
            console.warn("Profile synchronization notice:", err);
        }

        renderUserAvatar(currentAvatarUrl);
        await syncCloudThreads();
        loadUserNotifications();
        if (notifPollInterval) clearInterval(notifPollInterval);
        notifPollInterval = setInterval(loadUserNotifications, 5000);
    } else {
        currentUser = null;
        currentUsername = null;
        currentAvatarUrl = null;
        suspicionScore = 0;
        updateSuspicionUI();
        if (notifPollInterval) clearInterval(notifPollInterval);

        if (openNotifBtn) openNotifBtn.classList.add('hidden');
        if (openProfileBtn) openProfileBtn.classList.add('hidden');
        if (activityNotifBadge) activityNotifBadge.classList.add('hidden');
        if (mobileActivityBadge) mobileActivityBadge.classList.add('hidden');
        if (notificationsModal) notificationsModal.classList.add('hidden');
        if (userProfileModal) userProfileModal.classList.add('hidden');
        if (captchaSuspensionModal) captchaSuspensionModal.classList.add('hidden');
        if (authPanelWrapper) authPanelWrapper.classList.remove('hidden');

        await syncCloudThreads();
    }

    updateThreadControlsUI();
    loadForumPosts();
}

function renderUserAvatar(url) {
    if (url) {
        if (headerAvatarImg) { headerAvatarImg.src = url; headerAvatarImg.classList.remove('hidden'); }
        if (headerAvatarFallback) headerAvatarFallback.classList.add('hidden');
        if (postBarAvatar) { postBarAvatar.src = url; postBarAvatar.classList.remove('hidden'); }
        if (tabAvatarImg) { tabAvatarImg.src = url; tabAvatarImg.classList.remove('hidden'); }
        if (tabAvatarFallback) tabAvatarFallback.classList.add('hidden');
    } else {
        if (headerAvatarImg) headerAvatarImg.classList.add('hidden');
        if (headerAvatarFallback) headerAvatarFallback.classList.remove('hidden');
        if (postBarAvatar) postBarAvatar.classList.add('hidden');
        if (tabAvatarImg) tabAvatarImg.classList.add('hidden');
        if (tabAvatarFallback) tabAvatarFallback.classList.remove('hidden');
    }
}

if (db) {
    db.auth.getSession().then(({ data: { session } }) => {
        syncUserState(session?.user || null);
    }).catch(e => console.warn("Session check error:", e));

    db.auth.onAuthStateChange((_event, session) => {
        syncUserState(session?.user || null);
    });
}

safeAddListener(authToggleBtn, 'click', () => {
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

safeAddListener(authForm, 'submit', async (e) => {
    e.preventDefault();
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;

    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = isSignUpMode ? "Signing up..." : "Logging in...";

    if (isSignUpMode) {
        const username = authUsernameInput.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (username.length < 3) {
            alert("Username must be at least 3 characters.");
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = "Sign Up";
            return;
        }

        const { data: existingUser } = await db
            .from('profiles')
            .select('username')
            .eq('username', username)
            .maybeSingle();

        if (existingUser) {
            alert("Username already taken. Please choose another.");
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = "Sign Up";
            return;
        }

        const { error } = await db.auth.signUp({
            email,
            password,
            options: { data: { username: username } }
        });

        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = "Sign Up";

        if (error) {
            alert(`Sign up error: ${error.message}`);
            return;
        }

        alert("Account created successfully!");
        authForm.reset();
    } else {
        const { error } = await db.auth.signInWithPassword({ email, password });
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = "Log In";

        if (error) {
            alert(`Login error: ${error.message}`);
            return;
        }
        authForm.reset();
    }
});

safeAddListener(logoutBtn, 'click', async () => {
    if (db) await db.auth.signOut();
    setMobileTabActive('feed');
});

// --- CLOUD THREADS & MEMBERSHIP SYNC ---

async function syncCloudThreads() {
    if (!db) return;

    const { data: threads, error: threadErr } = await db
        .from('forum_threads')
        .select('*')
        .order('id', { ascending: true });

    if (!threadErr && threads && threads.length > 0) {
        allCloudThreads = threads;
    } else {
        allCloudThreads = [
            { name: "Welcome & Security", owner_username: "gemini" },
            { name: "Update Thread", owner_username: "gemini" }
        ];
    }

    myJoinedThreadNames = new Set(MANDATORY_THREADS);

    if (currentUser) {
        const { data: memberships } = await db
            .from('forum_thread_members')
            .select('thread_name')
            .eq('user_id', currentUser.id);

        (memberships || []).forEach(m => myJoinedThreadNames.add(m.thread_name));
    }

    renderJoinedThreadsSidebar();
    updateThreadControlsUI();
}

function renderJoinedThreadsSidebar() {
    if (!joinedThreadsContainer) return;
    joinedThreadsContainer.innerHTML = '';

    const joinedList = Array.from(myJoinedThreadNames);
    if (joinedList.length === 0) {
        joinedThreadsContainer.innerHTML = '<div class="no-posts" style="padding: 6px; font-size: 0.8rem;">No threads joined.</div>';
        return;
    }

    joinedList.forEach(tName => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `thread-nav-btn ${tName === activeThread ? 'active' : ''}`;
        
        const isMandatory = MANDATORY_THREADS.includes(tName);
        const icon = tName === "Welcome & Security" ? "🛡️" : (tName === "Update Thread" ? "📢" : "💬");

        btn.innerHTML = `
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${icon} ${escapeHTML(tName)}</span>
            ${isMandatory ? '<span style="font-size: 0.68rem; opacity: 0.7;">Default</span>' : ''}
        `;

        btn.addEventListener('click', async () => {
            if (activeThread === tName) return;
            activeThread = tName;
            
            cachedPosts = [];
            postCacheMap.clear();
            if (forumFeed) forumFeed.innerHTML = '<div class="no-posts">Loading posts...</div>';

            renderJoinedThreadsSidebar();
            updateThreadControlsUI();
            
            await loadForumPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        joinedThreadsContainer.appendChild(btn);
    });
}

// --- THREAD SEARCH & DISCOVERY ---

function fuzzyMatch(str, pattern) {
    const s = str.toLowerCase();
    const p = pattern.toLowerCase().trim();
    if (!p) return true;
    if (s.includes(p)) return true;

    let pIdx = 0;
    for (let char of s) {
        if (char === p[pIdx]) pIdx++;
        if (pIdx === p.length) return true;
    }
    return false;
}

safeAddListener(threadSearchInput, 'input', () => {
    if (!threadDiscoveryBox) return;
    const q = threadSearchInput.value.trim();
    if (!q) {
        threadDiscoveryBox.classList.add('hidden');
        threadDiscoveryBox.innerHTML = '';
        return;
    }

    const matches = allCloudThreads.filter(t => fuzzyMatch(t.name, q));
    threadDiscoveryBox.innerHTML = '';

    if (matches.length === 0) {
        threadDiscoveryBox.innerHTML = `<div style="font-size:0.8rem; color:#94a3b8; padding:4px;">No matching threads found. Click "+ New" in the sidebar to create one!</div>`;
        threadDiscoveryBox.classList.remove('hidden');
        return;
    }

    matches.forEach(t => {
        const isJoined = myJoinedThreadNames.has(t.name);
        const isMandatory = MANDATORY_THREADS.includes(t.name);

        const row = document.createElement('div');
        row.className = 'discovery-item';

        const label = document.createElement('span');
        label.style.fontWeight = '600';
        label.style.color = '#e2e8f0';
        label.textContent = t.name;

        const actionBtn = document.createElement('button');
        actionBtn.type = 'button';
        actionBtn.className = `btn-join-toggle ${isJoined ? 'secondary' : ''}`;
        actionBtn.textContent = isMandatory ? 'Default' : (isJoined ? 'Joined ✓' : '+ Join');
        actionBtn.disabled = isMandatory;

        actionBtn.addEventListener('click', async () => {
            if (!currentUser) {
                alert("Please log in to join or leave threads.");
                return;
            }
            await toggleThreadMembership(t.name);
        });

        row.appendChild(label);
        row.appendChild(actionBtn);
        threadDiscoveryBox.appendChild(row);
    });

    threadDiscoveryBox.classList.remove('hidden');
});

async function toggleThreadMembership(tName) {
    if (!currentUser || !db) return;
    if (MANDATORY_THREADS.includes(tName)) return;

    if (myJoinedThreadNames.has(tName)) {
        await db.from('forum_thread_members')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('thread_name', tName);

        myJoinedThreadNames.delete(tName);
        if (activeThread === tName) activeThread = "Welcome & Security";
    } else {
        await db.from('forum_thread_members')
            .insert([{ user_id: currentUser.id, thread_name: tName }]);

        myJoinedThreadNames.add(tName);
        activeThread = tName;
    }

    cachedPosts = [];
    postCacheMap.clear();
    if (forumFeed) forumFeed.innerHTML = '<div class="no-posts">Loading posts...</div>';

    renderJoinedThreadsSidebar();
    updateThreadControlsUI();
    await loadForumPosts();
    if (threadSearchInput) threadSearchInput.dispatchEvent(new Event('input'));
}

safeAddListener(joinLeaveActiveThreadBtn, 'click', async () => {
    if (!currentUser) {
        alert("Please log in to manage your threads.");
        return;
    }
    await toggleThreadMembership(activeThread);
});

// --- THREAD CREATION & SYNC ---

function openCreateThreadModal() {
    if (!currentUser) { alert("Please log in to create a thread."); return; }
    if (threadModal) threadModal.classList.remove('hidden');
}

safeAddListener(sidebarNewThreadBtn, 'click', openCreateThreadModal);
safeAddListener(closeThreadModalBtn, 'click', () => { if (threadModal) threadModal.classList.add('hidden'); });

safeAddListener(createThreadForm, 'submit', async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUsername) {
        alert("You must be logged in to create a thread.");
        return;
    }

    const newName = newThreadTitleInput.value.trim();
    if (!newName) return;

    if (allCloudThreads.some(t => t.name.toLowerCase() === newName.toLowerCase())) {
        alert("A thread with this name already exists.");
        return;
    }

    const submitBtn = document.getElementById('create-thread-submit-btn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creating...'; }

    const isPrivateChk = document.getElementById('new-thread-private-chk');
    const isPrivate = isPrivateChk ? isPrivateChk.checked : false;

    const { error } = await db
        .from('forum_threads')
        .insert([{
            name: newName,
            created_by: currentUser.id,
            owner_username: currentUsername,
            is_private: isPrivate
        }]);

    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create & Join Thread'; }

    if (error) {
        alert(`Could not create thread: ${error.message}`);
        return;
    }

    await db.from('forum_thread_members').insert([{
        user_id: currentUser.id,
        thread_name: newName
    }]);

    threadMetaMap[newName] = {
        owner: currentUsername,
        moderators: [],
        banned: []
    };
    saveThreadMeta();

    newThreadTitleInput.value = '';
    if (threadModal) threadModal.classList.add('hidden');

    await syncCloudThreads();
    activeThread = newName;

    cachedPosts = [];
    postCacheMap.clear();
    if (forumFeed) forumFeed.innerHTML = '<div class="no-posts">Loading posts...</div>';

    renderJoinedThreadsSidebar();
    updateThreadControlsUI();
    await loadForumPosts();
});

safeAddListener(postSortSelect, 'change', () => {
    renderCurrentFeed();
});

function updateThreadControlsUI() {
    if (currentThreadTitle) currentThreadTitle.textContent = activeThread;
    const role = getThreadRole(activeThread);
    if (currentUserThreadRole) {
        currentUserThreadRole.textContent = role;
        currentUserThreadRole.className = 'thread-role-badge';
        if (role === 'Site Admin') currentUserThreadRole.classList.add('badge-purple');
        else if (role === 'Owner') currentUserThreadRole.classList.add('badge-yellow');
        else if (role === 'Moderator') currentUserThreadRole.classList.add('badge-green');
        else if (role === 'Banned') currentUserThreadRole.classList.add('badge-red');
        else currentUserThreadRole.classList.add('badge-blue');
    }

    const isMandatory = MANDATORY_THREADS.includes(activeThread);
    const isJoined = myJoinedThreadNames.has(activeThread);

    if (joinLeaveActiveThreadBtn) {
        if (!isMandatory && currentUser) {
            joinLeaveActiveThreadBtn.classList.remove('hidden');
            joinLeaveActiveThreadBtn.textContent = isJoined ? 'Leave Thread' : '+ Join Thread';
            joinLeaveActiveThreadBtn.className = isJoined ? 'secondary btn-thread-action' : 'btn-thread-action';
        } else {
            joinLeaveActiveThreadBtn.classList.add('hidden');
        }
    }

    if (managePermsBtn) {
        if (canManagePermissions(activeThread)) managePermsBtn.classList.remove('hidden');
        else managePermsBtn.classList.add('hidden');
    }

    if (deleteThreadBtn) {
        if (canDeleteThread(activeThread)) deleteThreadBtn.classList.remove('hidden');
        else deleteThreadBtn.classList.add('hidden');
    }
}

// --- THREAD DELETION ---

safeAddListener(deleteThreadBtn, 'click', () => {
    if (!canDeleteThread(activeThread)) {
        alert("You do not have permission to delete this thread.");
        return;
    }
    if (deleteThreadTargetName) deleteThreadTargetName.textContent = activeThread;
    if (deleteThreadConfirmInput) deleteThreadConfirmInput.value = '';
    if (threadDeleteModal) threadDeleteModal.classList.remove('hidden');
});

safeAddListener(closeThreadDeleteModalBtn, 'click', () => { if (threadDeleteModal) threadDeleteModal.classList.add('hidden'); });
safeAddListener(cancelDeleteThreadBtn, 'click', () => { if (threadDeleteModal) threadDeleteModal.classList.add('hidden'); });

safeAddListener(finalDeleteThreadBtn, 'click', async () => {
    const inputVal = deleteThreadConfirmInput ? deleteThreadConfirmInput.value.trim() : '';
    if (inputVal !== activeThread) {
        alert(`Confirmation failed. You must type "${activeThread}" exactly to delete this thread.`);
        return;
    }

    finalDeleteThreadBtn.disabled = true;
    finalDeleteThreadBtn.textContent = 'Deleting...';

    if (db) {
        await db.from('Posts').delete().eq('thread', activeThread);
        await db.from('forum_threads').delete().eq('name', activeThread);
    }

    delete threadMetaMap[activeThread];
    saveThreadMeta();

    if (threadDeleteModal) threadDeleteModal.classList.add('hidden');
    finalDeleteThreadBtn.disabled = false;
    finalDeleteThreadBtn.textContent = 'Confirm Delete';

    alert(`Thread "${inputVal}" has been permanently removed.`);

    activeThread = "Welcome & Security";
    cachedPosts = [];
    postCacheMap.clear();
    if (forumFeed) forumFeed.innerHTML = '<div class="no-posts">Loading posts...</div>';
    await syncCloudThreads();
    await loadForumPosts();
});

// --- PERMISSIONS MANAGEMENT UI ---

safeAddListener(managePermsBtn, 'click', () => openPermissionsManager());
safeAddListener(closePermsModalBtn, 'click', () => { if (permsModal) permsModal.classList.add('hidden'); });

async function openPermissionsManager() {
    if (permsThreadName) permsThreadName.textContent = activeThread;
    renderPermissionsUserList();
    if (permsModal) permsModal.classList.remove('hidden');
}

function renderPermissionsUserList() {
    if (!permsUserList) return;
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
        const row = document.createElement('div');
        row.className = 'perm-user-row';
        row.innerHTML = `<span class="perm-user-name">@${escapeHTML(cleanUser)} (${role})</span>`;
        permsUserList.appendChild(row);
    });
}

// --- LINK INSERTION ---

safeAddListener(openLinkModalBtn, 'click', () => {
    if (linkUrlInput) linkUrlInput.value = '';
    if (linkTextInput) linkTextInput.value = '';
    if (linkModal) linkModal.classList.remove('hidden');
});

safeAddListener(closeLinkModalBtn, 'click', () => { if (linkModal) linkModal.classList.add('hidden'); });

safeAddListener(insertLinkForm, 'submit', (e) => {
    e.preventDefault();
    let url = linkUrlInput ? linkUrlInput.value.trim() : '';
    const text = linkTextInput ? linkTextInput.value.trim() : '';

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
    if (linkModal) linkModal.classList.add('hidden');
    textBox.focus();
});

function renderFormattedContent(text) {
    if (!text) return '';
    const escaped = escapeHTML(text);

    const withMdLinks = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_match, label, href) => {
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });

    const withBareUrls = withMdLinks.replace(/(^|[^">])(https?:\/\/[^\s<]+)/g, (_match, prefix, href) => {
        return `${prefix}<a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a>`;
    });

    return withBareUrls.replace(/\n/g, '<br>');
}

// --- PHOTO ATTACHMENTS ---

safeAddListener(postImageFile, 'change', () => {
    const file = postImageFile.files[0];
    if (file) {
        selectedPostPhotoFile = file;
        if (postPhotoFilename) postPhotoFilename.textContent = `📷 ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
        if (postPhotoPreviewBar) postPhotoPreviewBar.classList.remove('hidden');
    }
});

safeAddListener(removePostPhotoBtn, 'click', () => {
    selectedPostPhotoFile = null;
    if (postImageFile) postImageFile.value = '';
    if (postPhotoPreviewBar) postPhotoPreviewBar.classList.add('hidden');
});

// --- VOTING & POST RENDERING ---

function getPostScore(post) {
    const dbLikes = Number(post.likes || 0);
    const dbDislikes = Number(post.dislikes || 0);
    return dbLikes - dbDislikes;
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
    if (!post) return;
    
    const currentVote = userVotes[postId] || 0;
    let newVote = currentVote === direction ? 0 : direction;

    userVotes[postId] = newVote;
    localStorage.setItem('user_forum_votes', JSON.stringify(userVotes));

    let newLikes = Number(post.likes || 0);
    let newDislikes = Number(post.dislikes || 0);

    if (currentVote === 1) newLikes = Math.max(0, newLikes - 1);
    if (currentVote === -1) newDislikes = Math.max(0, newDislikes - 1);
    
    if (newVote === 1) newLikes += 1;
    if (newVote === -1) newDislikes += 1;

    post.likes = newLikes;
    post.dislikes = newDislikes;
    renderCurrentFeed();

    const { error } = await db
        .from('Posts')
        .update({ likes: newLikes, dislikes: newDislikes })
        .eq('id', postId);

    if (error) console.error("Failed to save vote to database:", error);
}

function sortPosts(posts) {
    const sortMode = postSortSelect ? postSortSelect.value : 'top';
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    let filtered = [...posts];

    if (sortMode === 'trending') {
        filtered = filtered.filter(p => {
            if (p.is_pinned) return true;
            if (!p.created_at) return true;
            const postAge = now - new Date(p.created_at).getTime();
            return postAge <= sevenDaysMs;
        });
    }

    return filtered.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;

        const scoreA = getPostScore(a);
        const scoreB = getPostScore(b);

        if (sortMode === 'top' || sortMode === 'trending') {
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

function getWelcomeSecurityPost() {
    return {
        id: 'welcome-seed',
        is_pinned: true,
        author: 'gemini',
        thread: 'Welcome & Security',
        created_at: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        content: `### Welcome to Turing's Gate: The Verified Human Community\n\nExplore topics, participate in discussions, and enjoy an authenticated bot-free community!`
    };
}

function createPostCardElement(post) {
    const item = document.createElement('div');
    item.className = `post-item ${post.is_pinned ? 'pinned-post' : ''}`;
    item.id = `post-${post.id}`;
    
    const dateFormatted = post.created_at ? new Date(post.created_at).toLocaleString() : 'Just now';
    const score = getPostScore(post);
    const myVote = userVotes[post.id] || 0;
    const postAuthorRole = getThreadRole(post.thread, post.author);

    let roleBadge = '';
    if (post.is_pinned) roleBadge = `<span class="badge badge-yellow" style="font-size:0.65rem;">PINNED GUIDE</span>`;
    else if (postAuthorRole === 'Site Admin') roleBadge = `<span class="badge badge-purple" style="font-size:0.65rem;">ADMIN</span>`;
    else if (postAuthorRole === 'Owner') roleBadge = `<span class="badge badge-yellow" style="font-size:0.65rem;">OWNER</span>`;
    else if (postAuthorRole === 'Moderator') roleBadge = `<span class="badge badge-green" style="font-size:0.65rem;">MOD</span>`;

    const userCanDelete = canDeletePost(post) && !post.is_pinned;

    let actionButtonsHtml = '';
    if (userCanDelete) {
        actionButtonsHtml = `<div class="post-admin-actions"><button type="button" class="btn-post-action danger-text btn-delete-post" data-post-id="${post.id}">🗑️ Delete Post</button></div>`;
    }

    const photoHtml = post.image_url ? `<a href="${post.image_url}" target="_blank" rel="noopener noreferrer"><img src="${post.image_url}" class="post-img-thumb" alt="Post photo" loading="lazy"></a>` : '';
    const cleanAuthor = (post.author || 'anonymous').toLowerCase().replace('@', '');
    const authorAvatar = usernameAvatarMap.get(cleanAuthor) || DEFAULT_AVATAR;
    const renderedBody = post.is_pinned ? post.content : renderFormattedContent(post.content || '');

    item.innerHTML = `
        <div class="vote-box">
            <button class="vote-btn ${myVote === 1 ? 'upvoted' : ''}" data-post-id="${post.id}" data-dir="1" title="Like">▲</button>
            <span class="vote-score">${score}</span>
            <button class="vote-btn ${myVote === -1 ? 'downvoted' : ''}" data-post-id="${post.id}" data-dir="-1" title="Dislike">▼</button>
        </div>
        <div class="post-body">
            <div class="post-meta">
                <div class="post-author-wrap">
                    <img src="${authorAvatar}" class="post-author-avatar" data-username="${escapeHTML(cleanAuthor)}" alt="pfp">
                    <span>By: <strong class="post-author clickable-username" data-username="${escapeHTML(cleanAuthor)}">@${escapeHTML(cleanAuthor)}</strong></span>
                    ${roleBadge}
                </div>
                <span>${dateFormatted}</span>
            </div>
            <div class="post-content">${renderedBody}</div>
            ${photoHtml}
            ${actionButtonsHtml}
        </div>
    `;

    item.querySelectorAll('.clickable-username, .post-author-avatar').forEach(clickable => {
        clickable.addEventListener('click', (e) => {
            const u = e.currentTarget.getAttribute('data-username');
            if (u) window.openUserProfileCard(u);
        });
    });

    item.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pId = e.currentTarget.getAttribute('data-post-id');
            const dir = parseInt(e.currentTarget.getAttribute('data-dir'), 10);
            handleVote(pId, dir);
        });
    });

    const deleteBtn = item.querySelector('.btn-delete-post');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!confirm("Are you sure you want to delete this post?")) return;
            await deletePostById(post.id);
        });
    }

    return item;
}

async function deletePostById(postId) {
    if (!currentUser) return;
    if (db) {
        await db.from('Posts').delete().eq('id', postId);
    }
    cachedPosts = cachedPosts.filter(p => String(p.id) !== String(postId));
    postCacheMap.delete(Number(postId));
    renderCurrentFeed();
    loadProminentUpdates();
}

function renderCurrentFeed() {
    if (!forumFeed) return;
    const sorted = sortPosts(cachedPosts);
    if (!sorted || sorted.length === 0) {
        forumFeed.innerHTML = `<div class="no-posts">No posts found for "${escapeHTML(activeThread)}".</div>`;
        return;
    }

    forumFeed.innerHTML = '';
    sorted.forEach(post => {
        forumFeed.appendChild(createPostCardElement(post));
    });
}

async function loadForumPosts() {
    updateThreadControlsUI();
    if (!db || !forumFeed) return;

    const thisFetchId = ++currentFetchId;
    const requestedThread = activeThread;

    forumFeed.innerHTML = '<div class="no-posts">Loading posts...</div>';
    cachedPosts = [];
    postCacheMap.clear();

    const { data: posts, error } = await db
        .from('Posts')
        .select('*')
        .eq('thread', requestedThread);

    if (thisFetchId !== currentFetchId || activeThread !== requestedThread) return;

    if (error) {
        forumFeed.innerHTML = `<div class="no-posts" style="color: #f87171;">Error loading posts: ${escapeHTML(error.message)}</div>`;
        return;
    }

    if (requestedThread === "Welcome & Security") {
        const welcomePost = getWelcomeSecurityPost();
        cachedPosts = posts && posts.length > 0 ? [welcomePost, ...posts] : [welcomePost];
    } else {
        cachedPosts = posts || [];
    }

    cachedPosts.forEach(p => postCacheMap.set(p.id, p));
    renderCurrentFeed();
}

// --- TICKER & ANNOUNCEMENTS ---

async function loadProminentUpdates() {
    if (!db || !tickerContent) return;

    const { data: updates, error } = await db
        .from('Posts')
        .select('*')
        .eq('thread', 'Update Thread')
        .order('id', { ascending: false })
        .limit(3);

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
}

// --- TELEMETRY ---

function startCompositionTimer() {
    if (timerInterval) clearInterval(timerInterval);
    pageLoadTime = Date.now();
    isTimerRunning = true;
    
    timerInterval = setInterval(() => {
        const elapsed = (Date.now() - pageLoadTime) / 1000;
        if (statTimer) statTimer.textContent = `${elapsed.toFixed(1)}s`;
    }, 100);
}

window.addEventListener('mousemove', () => { mouseMovementsRecorded++; });
window.addEventListener('touchstart', () => { mouseMovementsRecorded++; });

if (textBox) {
    textBox.addEventListener('paste', () => {
        textWasPasted = true;
        if (statPaste) {
            statPaste.textContent = "TRUE";
            statPaste.className = "badge badge-yellow";
        }
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
        if (statKeys) statKeys.textContent = `${textBox.value.length + 1} keys`;
    });
}

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
    if (textBox) textBox.value = '';
    selectedPostPhotoFile = null;
    if (postImageFile) postImageFile.value = '';
    if (postPhotoPreviewBar) postPhotoPreviewBar.classList.add('hidden');
    if (statPaste) { statPaste.textContent = "FALSE"; statPaste.className = "badge badge-green"; }
    if (statTimer) statTimer.textContent = "0.0s"; 
    if (statKeys) statKeys.textContent = "0 keys";
}

async function navigateToPost(postId) {
    if (!db) return;
    const { data: post } = await db.from('Posts').select('thread').eq('id', postId).maybeSingle();
    if (!post) {
        alert("This post may have been deleted.");
        return;
    }

    if (notificationsModal) notificationsModal.classList.add('hidden');
    if (activeThread !== post.thread) {
        activeThread = post.thread;
        await loadForumPosts();
    }

    const targetEl = document.getElementById(`post-${postId}`);
    if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.style.boxShadow = '0 0 0 2px #38bdf8, 0 0 20px rgba(56, 189, 248, 0.5)';
        setTimeout(() => { targetEl.style.boxShadow = 'none'; }, 2000);
    }
}

// --- FAB POST MODAL LOGIC ---

function openFabModal(e) {
    if (!currentUser) { 
        alert("Please log in to post."); 
        if (authEmailInput) authEmailInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return; 
    }
    
    if (fabModalContainer && e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const originXPercent = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
        const originYPercent = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
        fabModalContainer.style.transformOrigin = `${originXPercent}% ${originYPercent}%`;
    }
    
    if (fabModalOverlay) {
        fabModalOverlay.classList.remove('hidden');
        requestAnimationFrame(() => fabModalOverlay.classList.add('active'));
    }

    if (threadSearchSelect) threadSearchSelect.value = activeThread;
    if (threadSuggestDropdown) threadSuggestDropdown.classList.add('hidden');
}

safeAddListener(desktopFab, 'click', openFabModal);
safeAddListener(mobileFab, 'click', openFabModal);

safeAddListener(closeFabModalBtn, 'click', () => {
    if (fabModalOverlay) {
        fabModalOverlay.classList.remove('active');
        setTimeout(() => fabModalOverlay.classList.add('hidden'), 300);
    }
});

// Community Search in FAB Modal
safeAddListener(threadSearchSelect, 'input', () => {
    if (!threadSuggestDropdown) return;
    const q = threadSearchSelect.value.trim().toLowerCase();
    threadSuggestDropdown.innerHTML = '';
    
    if (!q) {
        threadSuggestDropdown.classList.add('hidden');
        return;
    }

    const joined = Array.from(myJoinedThreadNames).filter(t => t.toLowerCase().includes(q));
    const others = allCloudThreads.map(t => t.name).filter(t => !myJoinedThreadNames.has(t) && t.toLowerCase().includes(q));
    const combined = [...joined, ...others].slice(0, 8); 

    if (combined.length === 0) {
        threadSuggestDropdown.innerHTML = '<div style="padding: 10px; font-size: 0.85rem; color: #94a3b8;">No matching communities found.</div>';
    } else {
        combined.forEach(tName => {
            const isJoined = myJoinedThreadNames.has(tName);
            const div = document.createElement('div');
            div.className = 'suggest-item';
            div.innerHTML = `<strong>${escapeHTML(tName)}</strong> <span style="font-size: 0.75rem; color: #64748b; float: right;">${isJoined ? 'Joined ✓' : ''}</span>`;
            
            div.addEventListener('click', () => {
                threadSearchSelect.value = tName;
                threadSuggestDropdown.classList.add('hidden');
            });
            threadSuggestDropdown.appendChild(div);
        });
    }
    threadSuggestDropdown.classList.remove('hidden');
});

document.addEventListener('click', (e) => {
    if (threadSearchSelect && threadSuggestDropdown) {
        if (!threadSearchSelect.contains(e.target) && !threadSuggestDropdown.contains(e.target)) {
            threadSuggestDropdown.classList.add('hidden');
        }
    }
});

// Post Submission
safeAddListener(forumForm, 'submit', async (event) => {
    event.preventDefault(); 
    
    if (!currentUsername) {
        alert("You must be logged in to post.");
        return;
    }

    if (isSuspended) {
        triggerSuspensionGate();
        return;
    }

    const targetThread = threadSearchSelect ? threadSearchSelect.value.trim() : activeThread;
    if (!targetThread) {
        alert("Please select a community to post in.");
        return;
    }
    
    if (!allCloudThreads.some(t => t.name.toLowerCase() === targetThread.toLowerCase())) {
        alert("Community not found. Please choose an existing thread or create a new one from the sidebar.");
        return;
    }

    if (isUserBannedFromThread(targetThread, currentUsername)) {
        alert(`Posting Permission Denied: Your access to post in "${targetThread}" has been revoked.`);
        return;
    }

    if ((targetThread === "Update Thread" || targetThread === "Welcome & Security") && !isSiteAdmin()) {
        alert(`Permission Denied: Only @gemini can publish to the official "${targetThread}" section.`);
        return;
    }

    if (textBox.value.trim().length < 2 && !selectedPostPhotoFile) {
        alert("Please enter a message or attach a photo.");
        return;
    }

    const submitBtn = document.getElementById('forum-submit-btn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Publishing...'; }

    let postImageUrl = null;
    if (selectedPostPhotoFile) {
        const fileExt = selectedPostPhotoFile.name.split('.').pop();
        const filePath = `forum_posts/${currentUser.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await db.storage.from('chat-images').upload(filePath, selectedPostPhotoFile);

        if (!uploadError) {
            const { data: publicUrlData } = db.storage.from('chat-images').getPublicUrl(filePath);
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

    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Publish Post'; }

    if (error) {
        alert(`Database Error: ${error.message}`);
        return;
    }

    lastPostTimestamp = Date.now();

    if (targetThread === "Update Thread") {
        await loadProminentUpdates();
    } else {
        activeThread = targetThread;
        await loadForumPosts();
    }

    resetTelemetryConsole();
    if (fabModalOverlay) {
        fabModalOverlay.classList.remove('active');
        setTimeout(() => fabModalOverlay.classList.add('hidden'), 300);
    }
});

// Boot Application
syncCloudThreads();
loadProminentUpdates();
loadForumPosts();
