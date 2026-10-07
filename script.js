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
        },
        global: {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache'
            }
        }
    })
    : null;

if (!db) console.error("Critical: window.supabase is not initialized.");

// SITE SUPER ADMIN USERNAME
const SITE_ADMIN_USERNAME = "gemini";
const MANDATORY_THREADS = ["New User Discussion"];
const DEFAULT_THREADS = ["Welcome & Security", "Update Thread", "Trending"];

function safeAddListener(el, event, handler) {
    if (el) el.addEventListener(event, handler);
}

// Share Modal Elements
const shareModal = document.getElementById('share-modal');
const shareModalTitle = document.getElementById('share-modal-title');
const shareThreadBtn = document.getElementById('share-thread-btn');
const closeShareModalBtn = document.getElementById('close-share-modal-btn');
const nativeShareBtn = document.getElementById('native-share-btn');
const copyLinkBtn = document.getElementById('copy-link-btn');
const shareDmSelect = document.getElementById('share-dm-select');
const internalShareBtn = document.getElementById('internal-share-btn');

let currentShareType = 'post'; // 'post' or 'thread'
let currentShareTarget = null; // Stores either numeric post ID or thread string
let currentSharePostUrl = null;

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

// Security Whitepaper Elements
const openSecurityBtn = document.getElementById('open-security-btn');
const securityModal = document.getElementById('security-modal');
const closeSecurityModalBtn = document.getElementById('close-security-modal-btn');

// FAB Modal & Wrappers
const desktopFab = document.getElementById('desktop-fab');
const mobileFab = document.getElementById('mobile-fab');
const fabModalOverlay = document.getElementById('fab-post-modal');
const fabModalContainer = document.getElementById('fab-modal-container');
const closeFabModalBtn = document.getElementById('close-fab-modal-btn');
const threadSearchSelect = document.getElementById('thread-search-select');
const threadSuggestDropdown = document.getElementById('thread-suggest-dropdown');

// Header Nav & Settings Triggers
const openSettingsBtn = document.getElementById('open-settings-btn') || document.getElementById('open-profile-btn');
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
const tabNavSettings = document.getElementById('tab-nav-settings') || document.getElementById('tab-nav-profile');

// FIX: Declare missing DOM variables to prevent ReferenceError crashes
const mobileMsgBadge = document.getElementById('mobile-msg-badge');
const mobileActivityBadge = document.getElementById('mobile-activity-badge');
const tabAvatarImg = document.getElementById('tab-avatar-img');
const tabAvatarFallback = document.getElementById('tab-avatar-fallback');
// Pinned Updates Ticker & Modal
const tickerBadge = document.getElementById('ticker-badge');
const tickerContent = document.getElementById('ticker-content');
const updatesModal = document.getElementById('updates-modal');
const closeUpdatesModalBtn = document.getElementById('close-updates-modal-btn');
const updatesModalFeed = document.getElementById('updates-modal-feed');

// Security Whitepaper Listeners
safeAddListener(openSecurityBtn, 'click', () => {
    if (securityModal) securityModal.classList.remove('hidden');
});

safeAddListener(closeSecurityModalBtn, 'click', () => {
    if (securityModal) securityModal.classList.add('hidden');
});

// Allow closing by clicking the dark background overlay
safeAddListener(securityModal, 'click', (e) => {
    if (e.target === securityModal) {
        securityModal.classList.add('hidden');
    }
});

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
const permsUserList = document.getElementById('perms-user-list');

// Thread Delete Confirmation Modal Elements
const threadDeleteModal = document.getElementById('thread-delete-modal');
const closeThreadDeleteModalBtn = document.getElementById('close-thread-delete-modal-btn');
const cancelDeleteThreadBtn = document.getElementById('cancel-delete-thread-btn');
const finalDeleteThreadBtn = document.getElementById('final-delete-thread-btn');
const deleteThreadTargetName = document.getElementById('delete-thread-target-name');
const deleteThreadConfirmInput = document.getElementById('delete-thread-confirm-input');

// Settings Modal Elements
const profileModal = document.getElementById('profile-modal');
const closeProfileBtn = document.getElementById('close-profile-btn');
const tabBtnSettingsProfile = document.getElementById('tab-btn-settings-profile');
const tabBtnSettingsPrivacy = document.getElementById('tab-btn-settings-privacy');
const paneSettingsProfile = document.getElementById('pane-settings-profile');
const paneSettingsPrivacy = document.getElementById('pane-settings-privacy');
const privacyToggleChk = document.getElementById('privacy-toggle-chk');
const accountPrivacyDesc = document.getElementById('account-privacy-desc');

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
const userCardMsgBtn = document.getElementById('user-card-msg-btn');
const userCardAddFriendBtn = document.getElementById('user-card-add-friend-btn');
const unaddConfirmBox = document.getElementById('unadd-confirm-box');
const confirmUnaddBtn = document.getElementById('confirm-unadd-btn');
const cancelUnaddBtn = document.getElementById('cancel-unadd-btn');

// Profile History Tabs & Containers
const userHistoryTabPosts = document.getElementById('user-history-tab-posts');
const userHistoryTabComments = document.getElementById('user-history-tab-comments');
const userPostsContainer = document.getElementById('user-posts-container');
const userCommentsContainer = document.getElementById('user-comments-container');
const userHistoryPrivateNotice = document.getElementById('user-history-private-notice');
const userPostsCount = document.getElementById('user-posts-count');
const userCommentsCount = document.getElementById('user-comments-count');

let targetProfileUsername = null;
let targetProfileId = null;
let targetFriendshipRecord = null;
let targetProfileIsPrivate = false;

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
const msgRequestsHeader = document.getElementById('msg-requests-header');
const msgRequestsContainer = document.getElementById('msg-requests-container');
const friendsContainer = document.getElementById('friends-container');
const groupsContainer = document.getElementById('groups-container');
const chatHeader = document.getElementById('chat-header');
const chatMessages = document.getElementById('chat-messages');
const chatPendingBanner = document.getElementById('chat-pending-banner');

// DM Form Inputs
const dmForm = document.getElementById('dm-form');
const dmText = document.getElementById('dm-text');
const dmImageInput = document.getElementById('dm-image-input');
const dmSendBtn = document.getElementById('dm-send-btn');

// Group Creator Elements
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
let currentUserIsPrivate = false;
let isSignUpMode = false;
let myFriendsList = [];
let activeConversationId = null;
let activeConversationPartnerId = null;
let activeConversationPartnerUsername = null;
let activeConversationIsFriend = false;
let unreadCountsByConv = new Map();
let userAvatarCache = new Map();
let usernameAvatarMap = new Map();
let notifPollInterval = null;

// Thread State
let allCloudThreads = []; 
let myJoinedThreadNames = new Set(MANDATORY_THREADS);
let activeThread = localStorage.getItem('forum_active_thread') || "Welcome & Security";
let currentFetchId = 0;

let threadMetaMap = JSON.parse(localStorage.getItem('forum_thread_metadata') || '{}');
if (!threadMetaMap["Welcome & Security"]) threadMetaMap["Welcome & Security"] = { owner: SITE_ADMIN_USERNAME, moderators: [], banned: [] };
if (!threadMetaMap["Update Thread"]) threadMetaMap["Update Thread"] = { owner: SITE_ADMIN_USERNAME, moderators: [], banned: [] };
if (!threadMetaMap["New User Discussion"]) threadMetaMap["New User Discussion"] = { owner: SITE_ADMIN_USERNAME, moderators: [], banned: [] };
if (!threadMetaMap["Trending"]) threadMetaMap["Trending"] = { owner: SITE_ADMIN_USERNAME, moderators: [], banned: [] };

// Voting Cache
let userVotes = JSON.parse(localStorage.getItem('user_forum_votes') || '{}');
let userCommentVotes = JSON.parse(localStorage.getItem('user_forum_comment_votes') || '{}');
let cachedPosts = [];
let cachedUpdates = [];
let postCacheMap = new Map();
let threadFlairMap = new Map();

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

// IMAGE COMPRESSION MODULE
// --- GLOBAL IMAGE COMPRESSION UTILITY ---
async function compressImage(file, maxWidth = 1200, quality = 0.75) {
    // Exempt GIFs to preserve animation
    if (file.type === 'image/gif') return file;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) { reject(new Error('Canvas empty')); return; }
                    const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpeg", {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                }, 'image/jpeg', quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// Setup Tab Text
if (openSettingsBtn) {
    openSettingsBtn.title = "Settings";
    const headerFallback = openSettingsBtn.querySelector('#header-avatar-fallback');
    if (headerFallback) headerFallback.textContent = "⚙️";
}
if (tabNavSettings) {
    const textSpan = tabNavSettings.querySelector('span:last-child');
    if (textSpan) textSpan.textContent = "Settings";
    const iconSpan = tabNavSettings.querySelector('#tab-avatar-fallback');
    if (iconSpan) iconSpan.textContent = "⚙️";
}

// --- SETTINGS SUB-TABS (PROFILE & PRIVACY) ---

function switchSettingsTab(tab) {
    if (tab === 'profile') {
        if (paneSettingsProfile) paneSettingsProfile.classList.remove('hidden');
        if (paneSettingsPrivacy) paneSettingsPrivacy.classList.add('hidden');
        if (tabBtnSettingsProfile) {
            tabBtnSettingsProfile.style.background = "#0284c7";
            tabBtnSettingsProfile.style.borderColor = "#38bdf8";
            tabBtnSettingsProfile.style.color = "#ffffff";
        }
        if (tabBtnSettingsPrivacy) {
            tabBtnSettingsPrivacy.style.background = "#0f172a";
            tabBtnSettingsPrivacy.style.borderColor = "#334155";
            tabBtnSettingsPrivacy.style.color = "#94a3b8";
        }
    } else {
        if (paneSettingsProfile) paneSettingsProfile.classList.add('hidden');
        if (paneSettingsPrivacy) paneSettingsPrivacy.classList.remove('hidden');
        if (tabBtnSettingsPrivacy) {
            tabBtnSettingsPrivacy.style.background = "#0284c7";
            tabBtnSettingsPrivacy.style.borderColor = "#38bdf8";
            tabBtnSettingsPrivacy.style.color = "#ffffff";
        }
        if (tabBtnSettingsProfile) {
            tabBtnSettingsProfile.style.background = "#0f172a";
            tabBtnSettingsProfile.style.borderColor = "#334155";
            tabBtnSettingsProfile.style.color = "#94a3b8";
        }
    }
}

safeAddListener(tabBtnSettingsProfile, 'click', () => switchSettingsTab('profile'));
safeAddListener(tabBtnSettingsPrivacy, 'click', () => switchSettingsTab('privacy'));

function syncPrivacyDesc() {
    if (!accountPrivacyDesc) return;
    if (currentUserIsPrivate) {
        accountPrivacyDesc.textContent = "Private: Your forum post & comment history is hidden from other members.";
    } else {
        accountPrivacyDesc.textContent = "Public: Any human can view your forum post & comment history.";
    }
}

safeAddListener(privacyToggleChk, 'change', async () => {
    if (!currentUser || !db) return;
    const newIsPrivate = privacyToggleChk.checked;
    currentUserIsPrivate = newIsPrivate;
    syncPrivacyDesc();

    const { error } = await db.from('profiles').update({ is_private: newIsPrivate }).eq('id', currentUser.id);
    if (error) {
        alert(`Could not save privacy setting: ${error.message}`);
        privacyToggleChk.checked = !newIsPrivate;
        currentUserIsPrivate = !newIsPrivate;
        syncPrivacyDesc();
    }
});

// --- PUBLIC PROFILE HISTORY TABS (POSTS VS. COMMENTS) ---

function switchUserHistoryTab(tab) {
    if (tab === 'posts') {
        if (userPostsContainer) userPostsContainer.classList.remove('hidden');
        if (userCommentsContainer) userCommentsContainer.classList.add('hidden');
        if (userHistoryTabPosts) {
            userHistoryTabPosts.style.background = "#0284c7";
            userHistoryTabPosts.style.borderColor = "#38bdf8";
            userHistoryTabPosts.style.color = "#ffffff";
        }
        if (userHistoryTabComments) {
            userHistoryTabComments.style.background = "#0f172a";
            userHistoryTabComments.style.borderColor = "#334155";
            userHistoryTabComments.style.color = "#94a3b8";
        }
    } else {
        if (userPostsContainer) userPostsContainer.classList.add('hidden');
        if (userCommentsContainer) userCommentsContainer.classList.remove('hidden');
        if (userHistoryTabComments) {
            userHistoryTabComments.style.background = "#0284c7";
            userHistoryTabComments.style.borderColor = "#38bdf8";
            userHistoryTabComments.style.color = "#ffffff";
        }
        if (userHistoryTabPosts) {
            userHistoryTabPosts.style.background = "#0f172a";
            userHistoryTabPosts.style.borderColor = "#334155";
            userHistoryTabPosts.style.color = "#94a3b8";
        }
    }
}

safeAddListener(userHistoryTabPosts, 'click', () => switchUserHistoryTab('posts'));
safeAddListener(userHistoryTabComments, 'click', () => switchUserHistoryTab('comments'));

async function loadProfileUserActivity(username, isPrivate) {
    if (!userPostsContainer || !userCommentsContainer) return;

    if (isPrivate) {
        if (userHistoryPrivateNotice) userHistoryPrivateNotice.classList.remove('hidden');
        userPostsContainer.classList.add('hidden');
        userCommentsContainer.classList.add('hidden');
        if (userPostsCount) userPostsCount.textContent = '0';
        if (userCommentsCount) userCommentsCount.textContent = '0';
        return;
    }

    if (userHistoryPrivateNotice) userHistoryPrivateNotice.classList.add('hidden');
    switchUserHistoryTab('posts');

    userPostsContainer.innerHTML = '<div style="font-size:0.8rem; color:#64748b;">Loading posts...</div>';
    userCommentsContainer.innerHTML = '<div style="font-size:0.8rem; color:#64748b;">Loading comments...</div>';

    // 1. Fetch Posts
    const { data: posts } = await db
        .from('Posts')
        .select('*')
        .ilike('author', username)
        .order('id', { ascending: false })
        .limit(20);

    const postList = posts || [];
    if (userPostsCount) userPostsCount.textContent = postList.length;

    if (postList.length === 0) {
        userPostsContainer.innerHTML = '<div style="font-size:0.8rem; color:#64748b; font-style:italic; padding: 4px;">No posts yet.</div>';
    } else {
        userPostsContainer.innerHTML = '';
        postList.forEach(p => {
            const item = document.createElement('div');
            item.style.cssText = "background: #0f172a; border: 1px solid #334155; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: border-color 0.15s;";
            const d = p.created_at ? new Date(p.created_at).toLocaleDateString() : '';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #38bdf8; margin-bottom: 2px;">
                    <span>#${escapeHTML(p.thread)}</span>
                    <span style="color: #64748b;">${d}</span>
                </div>
                <div style="font-size: 0.82rem; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHTML(p.content || '[Attached Photo]')}
                </div>
            `;
            item.onmouseenter = () => { item.style.borderColor = '#38bdf8'; };
            item.onmouseleave = () => { item.style.borderColor = '#334155'; };
            item.onclick = () => {
                if (userProfileModal) userProfileModal.classList.add('hidden');
                navigateToPost(p.id);
            };
            userPostsContainer.appendChild(item);
        });
    }

    // 2. Fetch Comments
    const { data: comments } = await db
        .from('post_comments')
        .select('*')
        .ilike('author', username)
        .order('id', { ascending: false })
        .limit(20);

    const commentList = comments || [];
    if (userCommentsCount) userCommentsCount.textContent = commentList.length;

    if (commentList.length === 0) {
        userCommentsContainer.innerHTML = '<div style="font-size:0.8rem; color:#64748b; font-style:italic; padding: 4px;">No comments yet.</div>';
    } else {
        userCommentsContainer.innerHTML = '';
        commentList.forEach(c => {
            const item = document.createElement('div');
            item.style.cssText = "background: #0f172a; border: 1px solid #334155; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: border-color 0.15s;";
            const d = c.created_at ? new Date(c.created_at).toLocaleDateString() : '';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #38bdf8; margin-bottom: 2px;">
                    <span>💬 Reply</span>
                    <span style="color: #64748b;">${d}</span>
                </div>
                <div style="font-size: 0.82rem; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHTML(c.content || '')}
                </div>
            `;
            item.onmouseenter = () => { item.style.borderColor = '#38bdf8'; };
            item.onmouseleave = () => { item.style.borderColor = '#334155'; };
            item.onclick = () => {
                if (userProfileModal) userProfileModal.classList.add('hidden');
                navigateToPost(c.post_id);
            };
            userCommentsContainer.appendChild(item);
        });
    }
}

// --- DIRECT MODAL & VIEW OPENERS ---

function openMessagesModal() {
    if (!currentUser) { 
        alert("Please log in to view messages."); 
        setMobileTabActive('feed');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (document.getElementById('auth-email')) document.getElementById('auth-email').focus();
        return; 
    }
    if (dmModal) dmModal.classList.remove('hidden');
    
    // Hide floating telemetry HUD so it doesn't block the Send button
    const telemetryHud = document.getElementById('floating-telemetry');
    if (telemetryHud) telemetryHud.style.display = 'none';

    showSidebarViewOnMobile();
    refreshMessagingHub();
    setMobileTabActive('messages');
}

function openNotificationsModal() {
    if (!currentUser) { 
        alert("Please log in to view notifications."); 
        setMobileTabActive('feed');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (document.getElementById('auth-email')) document.getElementById('auth-email').focus();
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

function openSettingsModal() {
    if (!currentUser) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (authEmailInput) authEmailInput.focus();
        setMobileTabActive('feed');
        return;
    }

    // Refresh avatar preview in settings
    const avatarPreview = document.getElementById('profile-preview-avatar');
    if (avatarPreview) {
        avatarPreview.src = currentAvatarUrl || DEFAULT_AVATAR;
    }

    if (privacyToggleChk) {
        privacyToggleChk.checked = currentUserIsPrivate;
    }
    syncPrivacyDesc();
    switchSettingsTab('profile');
    if (typeof loadUserInvites === 'function') loadUserInvites(); // Sync active invites
    
    if (notificationsModal) notificationsModal.classList.add('hidden');
    if (userProfileModal) userProfileModal.classList.add('hidden');
    if (profileModal) profileModal.classList.remove('hidden');
    
    setMobileTabActive('profile');
}

function closeMessagesModal() {
    if (dmModal) dmModal.classList.add('hidden');
    if (window.chatSubscription && db) {
        db.removeChannel(window.chatSubscription);
        window.chatSubscription = null;
    }
    activeConversationId = null;
    activeConversationPartnerId = null;
    activeConversationPartnerUsername = null;

    // Restore floating telemetry HUD
    const telemetryHud = document.getElementById('floating-telemetry');
    if (telemetryHud) telemetryHud.style.display = 'flex';

    showSidebarViewOnMobile();
    setMobileTabActive('feed');
    checkNotifications();
}

function setMobileTabActive(tabName) {
    [tabNavFeed, tabNavMessages, tabNavNotifs, tabNavSettings].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    if (tabName === 'feed' && tabNavFeed) tabNavFeed.classList.add('active');
    else if (tabName === 'messages' && tabNavMessages) tabNavMessages.classList.add('active');
    else if (tabName === 'notifs' && tabNavNotifs) tabNavNotifs.classList.add('active');
    else if (tabName === 'profile' && tabNavSettings) tabNavSettings.classList.add('active');
}

safeAddListener(tabNavFeed, 'click', () => {
    closeMessagesModal();
    if (notificationsModal) notificationsModal.classList.add('hidden');
    if (profileModal) profileModal.classList.add('hidden');
    if (userProfileModal) userProfileModal.classList.add('hidden');
    setMobileTabActive('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

safeAddListener(tabNavMessages, 'click', openMessagesModal);
safeAddListener(tabNavNotifs, 'click', openNotificationsModal);
safeAddListener(tabNavSettings, 'click', openSettingsModal);

safeAddListener(openDmBtn, 'click', openMessagesModal);
safeAddListener(openNotifBtn, 'click', openNotificationsModal);
safeAddListener(openSettingsBtn, 'click', openSettingsModal);

// Close button on messaging modal
safeAddListener(closeDmBtn, 'click', (e) => {
    e.stopPropagation();
    closeMessagesModal();
});

// Click background backdrop to close messaging modal
safeAddListener(dmModal, 'click', (e) => {
    if (e.target === dmModal) {
        closeMessagesModal();
    }
});

safeAddListener(closeNotificationsBtn, 'click', () => {
    if (notificationsModal) notificationsModal.classList.add('hidden');
    setMobileTabActive('feed');
});
safeAddListener(closeProfileBtn, 'click', () => {
    if (profileModal) profileModal.classList.add('hidden');
    setMobileTabActive('feed');
});

safeAddListener(chatHeader, 'click', () => {
    if (activeConversationPartnerUsername) {
        window.openUserProfileCard(activeConversationPartnerUsername);
    }
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
    suspicionScore = Math.max(5, suspicionScore);

    // 1. Immediately dismiss posting & messaging modals
    closeFabModal();
    if (dmModal) dmModal.classList.add('hidden');

    // 2. Generate and display the CAPTCHA challenge on top of everything
    currentCaptchaSecret = generateCaptchaCode();
    drawCaptcha(currentCaptchaSecret);
    if (captchaInput) {
        captchaInput.value = "";
        setTimeout(() => captchaInput.focus(), 150);
    }
    if (captchaStatusMsg) {
        captchaStatusMsg.textContent = "Your account is temporarily suspended (5/5 Risk). Solve the code to restore posting.";
    }
    if (captchaSuspensionModal) {
        captchaSuspensionModal.classList.remove('hidden');
        captchaSuspensionModal.style.display = "flex";
    }

    // 3. Persist suspension lock to Supabase securely
    if (currentUser && db) {
        (async () => {
            try {
                await db.from('profiles').update({ 
                    is_suspended: true, 
                    suspicion_score: suspicionScore 
                }).eq('id', currentUser.id);
            } catch (err) {
                console.warn("Suspension update notice:", err);
            }
        })();
    }
}

safeAddListener(submitCaptchaBtn, 'click', async () => {
    const entered = (captchaInput ? captchaInput.value : "").trim().toUpperCase();
    
    if (entered === currentCaptchaSecret && currentCaptchaSecret !== "") {
        submitCaptchaBtn.disabled = true;
        submitCaptchaBtn.textContent = "Verifying...";

        try {
            isSuspended = false;
            suspicionScore = 0;
            updateSuspicionUI();

            if (currentUser && db) {
                await db.from('profiles').update({ 
                    is_suspended: false, 
                    suspicion_score: 0 
                }).eq('id', currentUser.id);
            }

            if (captchaSuspensionModal) {
                captchaSuspensionModal.classList.add('hidden');
                captchaSuspensionModal.style.display = "none";
            }
            
            resetTelemetryConsole();
            alert("Verification successful! Your account is restored.");
        } catch (err) {
            console.warn("Notice updating profile on verify:", err);
            // Even if the DB write takes time or warns, unblock the user locally
            if (captchaSuspensionModal) {
                captchaSuspensionModal.classList.add('hidden');
                captchaSuspensionModal.style.display = "none";
            }
        } finally {
            submitCaptchaBtn.disabled = false;
            submitCaptchaBtn.textContent = "Verify";
        }
    } else {
        if (captchaStatusMsg) captchaStatusMsg.textContent = "Incorrect code. Please try again.";
        currentCaptchaSecret = generateCaptchaCode();
        drawCaptcha(currentCaptchaSecret);
        if (captchaInput) {
            captchaInput.value = "";
            captchaInput.focus();
        }
    }
});

function updateSuspicionUI() {
    if (statSuspicion) statSuspicion.textContent = `${suspicionScore} / 5`;
    if (pillSuspicionTag) {
        pillSuspicionTag.textContent = `${suspicionScore}/5 Risk`;
        if (suspicionScore === 0) {
            pillSuspicionTag.style.color = "#22c55e";
        } else if (suspicionScore < 5) {
            pillSuspicionTag.style.color = "#eab308";
        } else {
            pillSuspicionTag.style.color = "#ef4444";
        }
    }

    if (statSuspicion) {
        if (suspicionScore === 0) statSuspicion.className = "badge badge-green";
        else if (suspicionScore < 5) statSuspicion.className = "badge badge-yellow";
        else statSuspicion.className = "badge badge-red";
    }

    // Immediately trigger CAPTCHA the instant the 5-point threshold is met
    if (suspicionScore >= 5 && !isSuspended) {
        triggerSuspensionGate();
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
    if (MANDATORY_THREADS.includes(threadName) || DEFAULT_THREADS.includes(threadName) || threadName === "Trending") return false;
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

        // FIX: Expose hidden database blocks so notifications don't silently fail
        if (error) {
            console.error("Notifications Blocked:", error.message);
            alert(`Database blocked loading notifications: ${error.message}`);
            return;
        }

        if (!notifs || notifs.length === 0) {
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
            
            const timeAgo = n.created_at 
                ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : 'New';
            
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
            } else if (n.type === 'direct_message' && n.entity_id) {
                div.style.cursor = 'pointer';
                div.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('clickable-username')) {
                        navigateToConversation(n.entity_id);
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

async function updateProfileFriendButtonUI() {
    if (unaddConfirmBox) unaddConfirmBox.classList.add('hidden');
    targetFriendshipRecord = null;

    const isOwnProfile = !currentUser || !targetProfileId || targetProfileUsername === currentUsername.toLowerCase().replace('@', '');

    if (isOwnProfile) {
        if (userCardAddFriendBtn) userCardAddFriendBtn.classList.add('hidden');
        if (userCardMsgBtn) userCardMsgBtn.classList.add('hidden');
        return;
    }

    if (userCardAddFriendBtn) userCardAddFriendBtn.classList.remove('hidden');
    if (userCardMsgBtn) userCardMsgBtn.classList.remove('hidden');

    try {
        const { data: friendship } = await db
            .from('friendships')
            .select('*')
            .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${targetProfileId}),and(user_id.eq.${targetProfileId},friend_id.eq.${currentUser.id})`)
            .maybeSingle();

        targetFriendshipRecord = friendship;

        if (userCardAddFriendBtn) {
            if (friendship && friendship.status === 'accepted') {
                userCardAddFriendBtn.innerHTML = `✓ Friends`;
                userCardAddFriendBtn.className = 'btn-friend-state btn-friend-added';
                userCardAddFriendBtn.title = "Click to remove friend";
            } else if (friendship && friendship.status === 'pending') {
                if (friendship.user_id === currentUser.id) {
                    // Outgoing pending request: can be clicked to rescind
                    userCardAddFriendBtn.innerHTML = `⏳ Pending`;
                    userCardAddFriendBtn.className = 'btn-friend-state secondary';
                    userCardAddFriendBtn.title = "Click to cancel request";
                } else {
                    // Incoming pending request: can be clicked to accept
                    userCardAddFriendBtn.innerHTML = `📬 Accept`;
                    userCardAddFriendBtn.className = 'btn-friend-state';
                    userCardAddFriendBtn.title = "Accept friend request";
                }
            } else {
                userCardAddFriendBtn.innerHTML = `➕ Add Friend`;
                userCardAddFriendBtn.className = 'btn-friend-state';
                userCardAddFriendBtn.title = "Send friend request";
            }
        }
    } catch (e) {
        if (userCardAddFriendBtn) {
            userCardAddFriendBtn.innerHTML = `➕ Add Friend`;
            userCardAddFriendBtn.className = 'btn-friend-state';
        }
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
            .select('id, username, avatar_url, is_private')
            .ilike('username', cleanUser)
            .maybeSingle();

        if (profile) {
            targetProfileId = profile.id;
            targetProfileIsPrivate = Boolean(profile.is_private);
            if (profile.avatar_url && userCardPfp) {
                userCardPfp.src = profile.avatar_url;
                usernameAvatarMap.set(cleanUser, profile.avatar_url);
            }
        } else {
            targetProfileId = null;
            targetProfileIsPrivate = false;
        }
    } catch (e) {
        console.warn("Profile load err:", e);
        targetProfileIsPrivate = false;
    }

    await updateProfileFriendButtonUI();
    userProfileModal.classList.remove('hidden');

    const score = await calculateUserScore(cleanUser);
    if (userCardScore) userCardScore.textContent = score > 0 ? `+${score}` : `${score}`;

    await loadProfileUserActivity(cleanUser, targetProfileIsPrivate);
};

safeAddListener(closeUserProfileBtn, 'click', () => {
    if (userProfileModal) userProfileModal.classList.add('hidden');
});

safeAddListener(userCardMsgBtn, 'click', async () => {
    if (!currentUser) {
        alert("Please log in to send direct messages.");
        if (userProfileModal) userProfileModal.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (document.getElementById('auth-email')) document.getElementById('auth-email').focus();
        return;
    }
    if (!targetProfileId || !targetProfileUsername) return;

    if (userProfileModal) userProfileModal.classList.add('hidden');
    if (dmModal) dmModal.classList.remove('hidden');

    const telemetryHud = document.getElementById('floating-telemetry');
    if (telemetryHud) telemetryHud.style.display = 'none';

    showChatViewOnMobile();
    setMobileTabActive('messages');

    await startOrOpenDirectChat({
        id: targetProfileId,
        username: targetProfileUsername
    });
});

safeAddListener(userCardAddFriendBtn, 'click', async () => {
    if (!currentUser) {
        alert("Please log in to manage friends.");
        if (userProfileModal) userProfileModal.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (document.getElementById('auth-email')) document.getElementById('auth-email').focus();
        return;
    }

    // 1. If already friends, toggle the unadd confirmation dialog
    if (targetFriendshipRecord && targetFriendshipRecord.status === 'accepted') {
        if (unaddConfirmBox) unaddConfirmBox.classList.toggle('hidden');
        return;
    }

    // 2. If a request is already pending
    if (targetFriendshipRecord && targetFriendshipRecord.status === 'pending') {
        if (targetFriendshipRecord.user_id !== currentUser.id) {
            // Incoming: Accept the friend request
            await handleRequest(targetFriendshipRecord.id, true);
            await updateProfileFriendButtonUI();
        } else {
            // Outgoing: Rescind/cancel the pending friend request
            userCardAddFriendBtn.disabled = true;
            userCardAddFriendBtn.textContent = 'Canceling...';

            const { error: delErr } = await db
                .from('friendships')
                .delete()
                .eq('id', targetFriendshipRecord.id);

            userCardAddFriendBtn.disabled = false;

            if (delErr) {
                alert(`Could not rescind request: ${delErr.message}`);
                await updateProfileFriendButtonUI();
                return;
            }

            targetFriendshipRecord = null;
            await updateProfileFriendButtonUI();
            refreshMessagingHub();
        }
        return;
    }

    if (!targetProfileId) return;

    // 3. Send new friend request
    userCardAddFriendBtn.disabled = true;
    userCardAddFriendBtn.innerHTML = `⏳ Pending`;

    const { data: newReq, error: insertErr } = await db
        .from('friendships')
        .insert([{ 
            user_id: currentUser.id, 
            friend_id: targetProfileId, 
            status: 'pending' 
        }])
        .select()
        .single();

    userCardAddFriendBtn.disabled = false;

    if (insertErr) {
        alert(`Could not send request: ${insertErr.message}`);
        await updateProfileFriendButtonUI();
        return;
    }

    targetFriendshipRecord = newReq;
    await updateProfileFriendButtonUI();
    alert("friend request sent");

    await sendNotification(
        targetProfileId,
        'friend_request',
        null,
        'sent you a friend request.'
    );

    refreshMessagingHub();
});

safeAddListener(confirmUnaddBtn, 'click', async () => {
    if (!targetFriendshipRecord) return;
    confirmUnaddBtn.disabled = true;
    const { error } = await db.from('friendships').delete().eq('id', targetFriendshipRecord.id);
    confirmUnaddBtn.disabled = false;

    if (error) {
        alert(`Error removing friend: ${error.message}`);
        return;
    }

    alert(`@${targetProfileUsername} has been removed from your friends.`);
    if (unaddConfirmBox) unaddConfirmBox.classList.add('hidden');
    await updateProfileFriendButtonUI();
    refreshMessagingHub();
});

safeAddListener(cancelUnaddBtn, 'click', () => {
    if (unaddConfirmBox) unaddConfirmBox.classList.add('hidden');
});

// --- SESSION & AUTHENTICATION ---

async function syncUserState(user) {
    if (user) {
        currentUser = user;
        currentUsername = user.user_metadata?.username || user.email?.split('@')[0] || "human";

        // LINK DEVICE TO ONESIGNAL (Capacitor & Web compatible)
        try {
            if (window.Capacitor?.Plugins?.OneSignal) {
                window.Capacitor.Plugins.OneSignal.login({ externalId: currentUser.id });
            } else if (window.OneSignal?.login) {
                window.OneSignal.login(currentUser.id);
            } else if (window.plugins?.OneSignal?.login) {
                window.plugins.OneSignal.login(currentUser.id);
            }
        } catch (e) {
            console.warn("OneSignal login notice:", e);
        }

        if (currentUserTag) currentUserTag.textContent = `@${currentUsername}`;
        if (deleteConfirmUserTag) deleteConfirmUserTag.textContent = `@${currentUsername}`;
        
        if (authPanelWrapper) authPanelWrapper.classList.add('hidden');
        if (openNotifBtn) openNotifBtn.classList.remove('hidden');
        if (openDmBtn) openDmBtn.classList.remove('hidden');
        if (openSettingsBtn) openSettingsBtn.classList.remove('hidden');

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
                    if (deleteConfirmUserTag) deleteConfirmUserTag.textContent = `@${currentUsername}`;
                }
                if (profile.avatar_url) {
                    currentAvatarUrl = profile.avatar_url;
                    userAvatarCache.set(currentUser.id, currentAvatarUrl);
                    usernameAvatarMap.set(currentUsername.toLowerCase(), currentAvatarUrl);
                    renderUserAvatar(currentAvatarUrl);
                }
                currentUserIsPrivate = Boolean(profile.is_private);
                if (privacyToggleChk) {
                    privacyToggleChk.checked = currentUserIsPrivate;
                }
                syncPrivacyDesc();

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
        checkNotifications();
        loadUserNotifications();
        if (notifPollInterval) clearInterval(notifPollInterval);
        notifPollInterval = setInterval(() => {
            checkNotifications();
            loadUserNotifications();
        }, 5000);
    } else {
        currentUser = null;
        currentUsername = null;
        currentAvatarUrl = null;
        activeConversationId = null;
        currentUserIsPrivate = false;
        suspicionScore = 0;
        updateSuspicionUI();

        // UNLINK DEVICE ON LOGOUT (Capacitor & Web compatible)
        try {
            if (window.Capacitor?.Plugins?.OneSignal) {
                window.Capacitor.Plugins.OneSignal.logout();
            } else if (window.OneSignal?.logout) {
                window.OneSignal.logout();
            } else if (window.plugins?.OneSignal?.logout) {
                window.plugins.OneSignal.logout();
            }
        } catch (e) {
            console.warn("OneSignal logout notice:", e);
        }

        if (window.chatSubscription && db) {
            db.removeChannel(window.chatSubscription);
            window.chatSubscription = null;
        }
        if (notifPollInterval) clearInterval(notifPollInterval);

        if (openNotifBtn) openNotifBtn.classList.add('hidden');
        if (openDmBtn) openDmBtn.classList.add('hidden');
        if (openSettingsBtn) openSettingsBtn.classList.add('hidden');
        if (notifBadge) notifBadge.classList.add('hidden');
        if (activityNotifBadge) activityNotifBadge.classList.add('hidden');
        if (mobileMsgBadge) mobileMsgBadge.classList.add('hidden');
        if (mobileActivityBadge) mobileActivityBadge.classList.add('hidden');
        if (dmModal) dmModal.classList.add('hidden');
        if (notificationsModal) notificationsModal.classList.add('hidden');
        if (profileModal) profileModal.classList.add('hidden');
        if (deleteConfirmModal) deleteConfirmModal.classList.add('hidden');
        if (permsModal) permsModal.classList.add('hidden');
        if (threadDeleteModal) threadDeleteModal.classList.add('hidden');
        if (linkModal) linkModal.classList.add('hidden');
        if (userProfileModal) userProfileModal.classList.add('hidden');
        if (captchaSuspensionModal) captchaSuspensionModal.classList.add('hidden');
        if (authPanelWrapper) authPanelWrapper.classList.remove('hidden');

        await syncCloudThreads();
    }

    updateThreadControlsUI();
    loadForumPosts();
}

function renderUserAvatar(url) {
    const avatarEl = document.getElementById('profile-preview-avatar') || profilePreviewAvatar;
    const finalUrl = url || DEFAULT_AVATAR;

    if (avatarEl) {
        avatarEl.src = finalUrl;
        avatarEl.style.display = "block";
    }

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

let hasBooted = false;

if (db) {
    db.auth.getSession().then(async ({ data: { session } }) => {
        await syncUserState(session?.user || null);
        
        // Only run the deep link check once after the initial user state is settled
        if (!hasBooted) {
            hasBooted = true;
            initLiveUserCount();
            loadProminentUpdates();

            const urlParams = new URLSearchParams(window.location.search);
            const targetPostId = urlParams.get('post');
            const targetThreadName = urlParams.get('thread');

            if (targetPostId) {
                await navigateToPost(targetPostId);
                window.history.replaceState({}, document.title, window.location.pathname);
            } else if (targetThreadName) {
                const decodedThread = decodeURIComponent(targetThreadName);
                const matchedThread = allCloudThreads.find(t => t.name.toLowerCase() === decodedThread.toLowerCase());
                activeThread = matchedThread ? matchedThread.name : decodedThread;
                localStorage.setItem('forum_active_thread', activeThread);
                await loadForumPosts();
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }).catch(e => console.warn("Session check error:", e));

    db.auth.onAuthStateChange(async (_event, session) => {
        if (hasBooted) {
            await syncUserState(session?.user || null);
        }
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
    
    // Grab the Cloudflare Turnstile token from the hidden input it generates
    const captchaToken = document.querySelector('[name="cf-turnstile-response"]')?.value;

    if (!captchaToken) {
        alert("Please complete the security check.");
        if (window.turnstile) turnstile.reset(); // ADD THIS LINE
        return;
    }

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
            if (window.turnstile) turnstile.reset();
            return;
        }

        // --- NEW: Web of Trust Invite Check ---
        const inviteCodeInput = document.getElementById('auth-invite-code');
        const inviteCode = inviteCodeInput ? inviteCodeInput.value.trim() : "";
        if (!inviteCode) {
            alert("A Golden Invite Code is required to join Turing's Gate.");
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = "Sign Up";
            if (window.turnstile) turnstile.reset();
            return;
        }

        const { data: inviteData, error: inviteErr } = await db
            .from('invitations')
            .select('id, status')
            .eq('code', inviteCode)
            .eq('status', 'pending')
            .maybeSingle();

        if (inviteErr || !inviteData) {
            alert("Invalid or already claimed invite code.");
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = "Sign Up";
            if (window.turnstile) turnstile.reset();
            return;
        }

        const { error } = await db.auth.signUp({
            email,
            password,
            options: { 
                data: { username: username },
                captchaToken: captchaToken // Supabase backend validates this
            }
        });

        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = "Sign Up";

        if (error) {
            alert(`Sign up error: ${error.message}`);
            if (window.turnstile) turnstile.reset(); 
            return;
        }

        // Mark invite as claimed securely from the client side
        if (inviteCode) {
            await db.from('invitations')
                .update({ status: 'claimed' })
                .eq('code', inviteCode);
        }

        alert("Account created successfully! Welcome to the network.");
        authForm.reset();
        if (window.turnstile) turnstile.reset();
    } else {
        const { error } = await db.auth.signInWithPassword({ 
            email, 
            password, 
            options: { captchaToken: captchaToken } // Supabase backend validates this
        });
        
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = "Log In";

        if (error) {
            alert(`Login error: ${error.message}`);
            if (window.turnstile) turnstile.reset();
            return;
        }
        authForm.reset();
        if (window.turnstile) turnstile.reset();
    }
});
    
safeAddListener(logoutBtn, 'click', async () => {
    if (db) await db.auth.signOut();
    setMobileTabActive('feed');
});

// --- PROFILE SETTINGS PASSWORD & AVATAR LOGIC ---

safeAddListener(profileAvatarFile, 'change', async () => {
    const rawFile = profileAvatarFile.files[0];
    if (!rawFile || !currentUser) return;
    
    // Compress avatars heavily (max width 400px, 80% quality)
    const file = await compressImage(rawFile, 400, 0.8);

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
    if (currentUsername) usernameAvatarMap.set(currentUsername.toLowerCase(), currentAvatarUrl);
    renderUserAvatar(currentAvatarUrl);
    renderCurrentFeed();
    alert("Avatar updated successfully!");
});

safeAddListener(updatePasswordBtn, 'click', async () => {
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

safeAddListener(openDeleteModalBtn, 'click', () => {
    if (deleteConfirmModal) deleteConfirmModal.classList.remove('hidden');
    if (deleteUsernameInput) deleteUsernameInput.value = '';
});
safeAddListener(closeDeleteModalBtn, 'click', () => { if (deleteConfirmModal) deleteConfirmModal.classList.add('hidden'); });
safeAddListener(cancelDeleteBtn, 'click', () => { if (deleteConfirmModal) deleteConfirmModal.classList.add('hidden'); });
safeAddListener(document.getElementById('settings-logout-btn'), 'click', async () => {
    if (db) await db.auth.signOut();
    if (profileModal) profileModal.classList.add('hidden');
    setMobileTabActive('feed');
});
safeAddListener(finalDeleteBtn, 'click', async () => {
    const entered = (deleteUsernameInput ? deleteUsernameInput.value : "").trim().toLowerCase().replace('@', '');
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

// --- CLOUD THREADS & MEMBERSHIP SYNC ---
async function syncCloudThreads() {
    if (!db) return;

    const { data: threads, error: threadErr } = await db
        .from('forum_threads')
        .select('*')
        .order('id', { ascending: true });

    // Ensure core threads are always present, even if DB is empty
    const coreThreads = [
        { name: "Welcome & Security", owner_username: "gemini" },
        { name: "Update Thread", owner_username: "gemini" },
        { name: "New User Discussion", owner_username: "gemini" },
        { name: "Trending", owner_username: "gemini" }
    ];

    let mergedThreads = [];
    if (!threadErr && threads && threads.length > 0) {
        mergedThreads = [...threads];
        coreThreads.forEach(def => {
            if (!mergedThreads.find(t => t.name === def.name)) {
                mergedThreads.push(def);
            }
        });
    } else {
        mergedThreads = coreThreads;
    }

    allCloudThreads = mergedThreads;
    
    if (currentUser) {
        // Guarantee Trending is always in the sidebar alongside mandatory threads
        myJoinedThreadNames = new Set([...MANDATORY_THREADS, "Trending"]);
        
        const { data: memberships, error: memErr } = await db
            .from('forum_thread_members')
            .select('thread_name')
            .eq('user_id', currentUser.id);

        if (memErr) console.error("Threads Blocked:", memErr.message);
        
        const dbJoinedNames = (memberships || []).map(m => m.thread_name);
        dbJoinedNames.forEach(name => myJoinedThreadNames.add(name));
        
        // Migration / Auto-Join for Default Threads (v2 includes Trending)
        const autoJoinFlag = `has_auto_joined_defaults_v2_${currentUser.id}`;
        if (!localStorage.getItem(autoJoinFlag)) {
            const toInsert = DEFAULT_THREADS
                .filter(t => !dbJoinedNames.includes(t))
                .map(t => ({ user_id: currentUser.id, thread_name: t }));
            
            if (toInsert.length > 0) {
                await db.from('forum_thread_members').insert(toInsert);
                toInsert.forEach(m => myJoinedThreadNames.add(m.thread_name));
            }
            localStorage.setItem(autoJoinFlag, 'true');
        }
    } else {
        // For logged out guests, show both mandatory and defaults
        myJoinedThreadNames = new Set([...MANDATORY_THREADS, ...DEFAULT_THREADS]);
    }

    // Fallback: If localStorage saved a thread that was deleted, reset gracefully to Welcome
    if (allCloudThreads.length > 0 && !allCloudThreads.some(t => t.name.toLowerCase() === activeThread.toLowerCase())) {
        activeThread = "Welcome & Security";
        localStorage.setItem('forum_active_thread', activeThread);
    }

    renderJoinedThreadsSidebar();
    updateThreadControlsUI();
}

function saveSidebarThreadOrder() {
    if (!joinedThreadsContainer) return;
    const items = Array.from(joinedThreadsContainer.querySelectorAll('.thread-nav-btn'));
    const order = items.map(el => el.getAttribute('data-thread')).filter(Boolean);
    const storageKey = currentUser ? `forum_thread_order_${currentUser.id}` : 'forum_thread_order_guest';
    localStorage.setItem(storageKey, JSON.stringify(order));
}

function renderJoinedThreadsSidebar() {
    if (!joinedThreadsContainer) return;
    joinedThreadsContainer.innerHTML = '';

    const storageKey = currentUser ? `forum_thread_order_${currentUser.id}` : 'forum_thread_order_guest';
    const savedOrder = JSON.parse(localStorage.getItem(storageKey) || '[]');
    let joinedList = Array.from(myJoinedThreadNames);

    if (joinedList.length === 0) {
        joinedThreadsContainer.innerHTML = '<div class="no-posts" style="padding: 6px; font-size: 0.8rem;">No threads joined.</div>';
        return;
    }

    // Sort according to custom user preference
    joinedList.sort((a, b) => {
        const idxA = savedOrder.indexOf(a);
        const idxB = savedOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
    });

    joinedList.forEach(tName => {
        const item = document.createElement('div');
        item.className = `thread-nav-btn ${tName === activeThread ? 'active' : ''}`;
        item.setAttribute('data-thread', tName);
        item.setAttribute('draggable', 'true');

        const isMandatory = MANDATORY_THREADS.includes(tName) || tName === "Trending";
        const icon = tName === "Welcome & Security" ? "🛡️" : (tName === "Update Thread" ? "📢" : (tName === "Trending" ? "⚡" : "💬"));

        item.innerHTML = `
            <div class="thread-nav-content">
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${icon} ${escapeHTML(tName)}</span>${isMandatory ? '<span style="font-size: 0.68rem; opacity: 0.7; margin-left: 6px;">Default</span>' : ''}
            </div>
            <span class="thread-drag-handle" title="Drag to reorder">⋮⋮</span>
        `;

        // Click to switch active thread
        const contentArea = item.querySelector('.thread-nav-content');
        if (contentArea) {
            contentArea.addEventListener('click', async () => {
                if (activeThread === tName) return;
                activeThread = tName;
                localStorage.setItem('forum_active_thread', activeThread);

                cachedPosts = [];
                postCacheMap.clear();
                if (forumFeed) forumFeed.innerHTML = '<div class="no-posts">Loading posts...</div>';

                renderJoinedThreadsSidebar();
                updateThreadControlsUI();

                await loadForumPosts();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // --- DESKTOP DRAG & DROP ---
        item.addEventListener('dragstart', (e) => {
            item.classList.add('is-dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', tName);
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('is-dragging');
            saveSidebarThreadOrder();
        });

        // --- MOBILE TOUCH DRAG & DROP ---
        const handle = item.querySelector('.thread-drag-handle');
        if (handle) {
            handle.addEventListener('touchstart', (e) => {
                item.classList.add('is-dragging');
            }, { passive: true });

            handle.addEventListener('touchmove', (e) => {
                e.preventDefault(); // Stop screen scrolling while dragging
                const touch = e.touches[0];
                
                // Compare touch position directly against sibling items for fluid mobile swapping
                const siblings = [...joinedThreadsContainer.querySelectorAll('.thread-nav-btn:not(.is-dragging)')];
                const overSibling = siblings.find(sib => {
                    const rect = sib.getBoundingClientRect();
                    return touch.clientY >= rect.top && touch.clientY <= rect.bottom;
                });

                if (overSibling) {
                    const rect = overSibling.getBoundingClientRect();
                    const isAfter = touch.clientY > rect.top + rect.height / 2;
                    joinedThreadsContainer.insertBefore(item, isAfter ? overSibling.nextSibling : overSibling);
                }
            }, { passive: false });

            handle.addEventListener('touchend', () => {
                item.classList.remove('is-dragging');
                saveSidebarThreadOrder();
            });
        }

        joinedThreadsContainer.appendChild(item);
    });

    // Sidebar Container Dragover for Desktop
    joinedThreadsContainer.ondragover = (e) => {
        e.preventDefault();
        const draggingEl = joinedThreadsContainer.querySelector('.is-dragging');
        if (!draggingEl) return;

        const siblings = [...joinedThreadsContainer.querySelectorAll('.thread-nav-btn:not(.is-dragging)')];
        const nextSibling = siblings.find(sibling => {
            const box = sibling.getBoundingClientRect();
            return e.clientY <= box.top + box.height / 2;
        });

        joinedThreadsContainer.insertBefore(draggingEl, nextSibling || null);
    };
}

// --- THREAD DISCOVERY ---

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
        const isMandatory = MANDATORY_THREADS.includes(t.name) || t.name === "Trending";

        const row = document.createElement('div');
        row.className = 'discovery-item';

        const label = document.createElement('span');
        label.style.fontWeight = '600';
        label.style.color = '#38bdf8';
        label.style.cursor = 'pointer';
        label.style.textDecoration = 'underline';
        label.style.textUnderlineOffset = '2px';
        label.title = 'Click to view thread';
        label.textContent = t.name;

        // Allow anyone (guests included) to click the name to view the thread
        label.addEventListener('click', async () => {
            activeThread = t.name;
            localStorage.setItem('forum_active_thread', activeThread);
            threadSearchInput.value = '';
            threadDiscoveryBox.classList.add('hidden');
            
            cachedPosts = [];
            postCacheMap.clear();
            if (forumFeed) forumFeed.innerHTML = '<div class="no-posts">Loading posts...</div>';

            renderJoinedThreadsSidebar();
            updateThreadControlsUI();
            await loadForumPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        const actionBtn = document.createElement('button');
        actionBtn.type = 'button';
        actionBtn.className = `btn-join-toggle ${isJoined ? 'secondary' : ''}`;
        actionBtn.textContent = isMandatory ? 'Default' : (isJoined ? 'Joined ✓' : '+ Join');
        actionBtn.disabled = isMandatory;

        actionBtn.addEventListener('click', async () => {
            if (!currentUser) {
                alert("Please log in to join or leave threads.");
                window.scrollTo({ top: 0, behavior: 'smooth' });
                if (document.getElementById('auth-email')) document.getElementById('auth-email').focus();
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
    if (MANDATORY_THREADS.includes(tName) || tName === "Trending") return;

    if (myJoinedThreadNames.has(tName)) {
        await db.from('forum_thread_members')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('thread_name', tName);

        myJoinedThreadNames.delete(tName);
        if (activeThread === tName) {
            activeThread = "Welcome & Security";
            localStorage.setItem('forum_active_thread', activeThread);
        }
    } else {
        await db.from('forum_thread_members')
            .insert([{ user_id: currentUser.id, thread_name: tName }]);

        myJoinedThreadNames.add(tName);
        activeThread = tName;
        localStorage.setItem('forum_active_thread', activeThread);
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (document.getElementById('auth-email')) document.getElementById('auth-email').focus();
        return;
    }
    await toggleThreadMembership(activeThread);
});

// --- CREATE & DELETE THREADS ---

function openCreateThreadModal() {
    if (!currentUser) { 
        alert("Please log in to create a thread."); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (document.getElementById('auth-email')) document.getElementById('auth-email').focus();
        return; 
    }
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

    threadMetaMap[newName] = { owner: currentUsername, moderators: [], banned: [] };
    saveThreadMeta();

    newThreadTitleInput.value = '';
    if (threadModal) threadModal.classList.add('hidden');

    await syncCloudThreads();
    activeThread = newName;
    localStorage.setItem('forum_active_thread', activeThread);

    cachedPosts = [];
    postCacheMap.clear();
    if (forumFeed) forumFeed.innerHTML = '<div class="no-posts">Loading posts...</div>';

    renderJoinedThreadsSidebar();
    updateThreadControlsUI();
    await loadForumPosts();
});

safeAddListener(postSortSelect, 'change', () => { renderCurrentFeed(); });

// --- THREAD MEMBER COUNT LOADER ---
async function updateThreadMemberCount() {
    const countEl = document.getElementById('thread-member-count');
    if (!countEl || !db) return;

    try {
        if (MANDATORY_THREADS.includes(activeThread) || activeThread === "Trending") {
            // Mandatory threads include every registered account
            const { count, error } = await db
                .from('profiles')
                .select('*', { count: 'exact', head: true });
            if (!error && count !== null) {
                countEl.textContent = `${count.toLocaleString()} ${count === 1 ? 'member' : 'members'}`;
            }
        } else {
            // Standard threads count joined memberships
            const { count, error } = await db
                .from('forum_thread_members')
                .select('*', { count: 'exact', head: true })
                .eq('thread_name', activeThread);
            if (!error && count !== null) {
                countEl.textContent = `${count.toLocaleString()} ${count === 1 ? 'member' : 'members'}`;
            }
        }
    } catch (err) {
        console.warn("Could not load thread member count:", err);
    }
}

function updateThreadControlsUI() {
    if (currentThreadTitle) currentThreadTitle.textContent = activeThread;
    const role = getThreadRole(activeThread);
    if (currentUserThreadRole) {
        if (activeThread === 'Trending') {
            currentUserThreadRole.textContent = "Compiled Feed";
            currentUserThreadRole.className = 'thread-role-badge badge-purple';
        } else {
            currentUserThreadRole.textContent = role;
            currentUserThreadRole.className = 'thread-role-badge';
            if (role === 'Site Admin') currentUserThreadRole.classList.add('badge-purple');
            else if (role === 'Owner') currentUserThreadRole.classList.add('badge-yellow');
            else if (role === 'Moderator') currentUserThreadRole.classList.add('badge-green');
            else if (role === 'Banned') currentUserThreadRole.classList.add('badge-red');
            else currentUserThreadRole.classList.add('badge-blue');
        }
    }

    const isMandatory = MANDATORY_THREADS.includes(activeThread) || activeThread === "Trending";
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

    // Community Flair Button (Database Synced)
    let flairBtn = document.getElementById('set-flair-btn');
    const actionsBar = document.querySelector('.thread-actions-bar');
    // Community Banner Logic
    let bannerBtn = document.getElementById('set-banner-btn');
    if (!currentUser) {
        if (bannerBtn) bannerBtn.remove();
    } else if (actionsBar && (role === 'Owner' || role === 'Moderator' || role === 'Site Admin')) {
        if (!bannerBtn) {
            bannerBtn = document.createElement('button');
            bannerBtn.id = 'set-banner-btn';
            bannerBtn.type = 'button';
            bannerBtn.className = 'secondary btn-thread-action';
            bannerBtn.textContent = '🖼️ Set Banner';
            bannerBtn.onclick = () => document.getElementById('banner-upload-input').click();
            actionsBar.prepend(bannerBtn);
        }
    } else if (bannerBtn) {
        bannerBtn.remove();
    }
    if (!currentUser) {
        if (flairBtn) flairBtn.remove();
    } else if (actionsBar) {
        if (!flairBtn) {
            flairBtn = document.createElement('button');
            flairBtn.id = 'set-flair-btn';
            flairBtn.type = 'button';
            flairBtn.className = 'secondary btn-thread-action';
            flairBtn.textContent = '🏷️ Set Flair';
            flairBtn.onclick = async () => {
                const currentFlair = threadFlairMap.get(currentUsername.toLowerCase()) || '';
                const input = prompt(`Set your flair for "${activeThread}":\n(Leave blank to remove)`, currentFlair);
                if (input === null) return;

                const trimmed = input.trim().substring(0, 18);

                if (trimmed === '') {
                    await db
                        .from('user_thread_flairs')
                        .delete()
                        .eq('thread_name', activeThread)
                        .eq('username', currentUsername.toLowerCase());
                    threadFlairMap.delete(currentUsername.toLowerCase());
                } else {
                    const { error } = await db
                        .from('user_thread_flairs')
                        .upsert({
                            thread_name: activeThread,
                            username: currentUsername.toLowerCase(),
                            flair: trimmed
                        });

                    if (error) {
                        alert(`Could not save flair: ${error.message}`);
                        return;
                    }
                    threadFlairMap.set(currentUsername.toLowerCase(), trimmed);
                }

                renderCurrentFeed();
            };
            actionsBar.prepend(flairBtn);
        }
    }

    if (managePermsBtn) {
        if (canManagePermissions(activeThread)) managePermsBtn.classList.remove('hidden');
        else managePermsBtn.classList.add('hidden');
    }

    const manageChatBtn = document.getElementById('manage-chat-btn');
    if (manageChatBtn) {
        if (canManagePermissions(activeThread)) manageChatBtn.classList.remove('hidden');
        else manageChatBtn.classList.add('hidden');
    }

    // Evaluate Live Chat Schedule / Lock
    const tData = allCloudThreads.find(t => t.name === activeThread);
    const liveChatBtn = document.getElementById('open-live-chat-btn');
    if (liveChatBtn && tData) {
        window.currentLiveChatIsOpen = evaluateLiveChatStatus(tData);
        if (window.currentLiveChatIsOpen) {
            liveChatBtn.classList.remove('locked');
            liveChatBtn.innerHTML = `<div class="live-pulse"></div> Live Chat (<span id="live-viewers-badge">0</span>)`;
        } else {
            liveChatBtn.classList.add('locked');
            liveChatBtn.innerHTML = `🔒 Chat Closed`;
        }
    }

    if (deleteThreadBtn) {
        if (canDeleteThread(activeThread)) deleteThreadBtn.classList.remove('hidden');
        else deleteThreadBtn.classList.add('hidden');
    }
    
    // Update live member count for the active thread
    updateThreadMemberCount();

    // Renders the banner once UI and DB sync is complete
    if (typeof renderThreadBanner === 'function') {
        renderThreadBanner();
    }
}

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
    localStorage.setItem('forum_active_thread', activeThread);
    cachedPosts = [];
    postCacheMap.clear();
    if (forumFeed) forumFeed.innerHTML = '<div class="no-posts">Loading posts...</div>';
    await syncCloudThreads();
    await loadForumPosts();
});

// --- PERMISSIONS MANAGEMENT UI ---

safeAddListener(managePermsBtn, 'click', () => openPermissionsManager());
safeAddListener(closePermsModalBtn, 'click', () => { if (permsModal) permsModal.classList.add('hidden'); });
safeAddListener(permsModal, 'click', (e) => { if (e.target === permsModal) permsModal.classList.add('hidden'); });

function openPermissionsManager() {
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
        permsUserList.innerHTML = '<div class="no-posts" style="padding: 10px;">No members active in this thread yet.</div>';
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
        btnCol.style.cssText = "display: flex; gap: 6px;";

        if (canManagePermissions(activeThread) && role !== 'Owner' && role !== 'Site Admin') {
            if (role === 'Moderator') {
                const demoteBtn = document.createElement('button');
                demoteBtn.className = 'btn-perm secondary';
                demoteBtn.textContent = 'Demote Mod';
                demoteBtn.onclick = () => {
                    meta.moderators = (meta.moderators || []).filter(m => m.toLowerCase() !== cleanUser);
                    saveThreadMeta();
                    renderPermissionsUserList();
                    updateThreadControlsUI();
                };
                btnCol.appendChild(demoteBtn);
            } else {
                const promoteBtn = document.createElement('button');
                promoteBtn.className = 'btn-perm secondary';
                promoteBtn.textContent = 'Promote Mod';
                promoteBtn.onclick = () => {
                    if (!meta.moderators) meta.moderators = [];
                    if (!meta.moderators.map(m => m.toLowerCase()).includes(cleanUser)) {
                        meta.moderators.push(cleanUser);
                    }
                    meta.banned = (meta.banned || []).filter(b => b.toLowerCase() !== cleanUser);
                    saveThreadMeta();
                    renderPermissionsUserList();
                    updateThreadControlsUI();
                };
                btnCol.appendChild(promoteBtn);
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
                    updateThreadControlsUI();
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
                    updateThreadControlsUI();
                };
                btnCol.appendChild(banBtn);
            }
        }

        row.appendChild(nameCol);
        row.appendChild(btnCol);
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
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: underline;">${label}</a>`;
    });

    // UI UPGRADE: Rich Link Previews
    const withBareUrls = withMdLinks.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, (_match, space, href) => {
        try {
            const domain = new URL(href).hostname.replace('www.', '');
            return `${space}<a href="${href}" target="_blank" rel="noopener noreferrer" class="link-preview-card">
                <div class="link-icon">🔗</div>
                <div class="link-info">
                    <strong class="link-domain">${domain}</strong>
                    <span class="link-url">${href}</span>
                </div>
            </a>`;
        } catch (e) {
            return `${space}<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8;">${href}</a>`;
        }
    });

    // NEW: Parse T/Thread_Name formatting (replaces underscores with spaces)
    const withThreadLinks = withBareUrls.replace(/(^|\s)T\/([a-zA-Z0-9_.-]+)/g, (_match, space, threadRaw) => {
        const actualName = threadRaw.replace(/_/g, ' ');
        return `${space}<span class="clickable-thread" data-thread="${escapeHTML(actualName)}" title="Go to ${escapeHTML(actualName)}">T/${threadRaw}</span>`;
    });

    return withThreadLinks.replace(/\n/g, '<br>');
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

// --- MESSAGING & CHATS HUB ---

function showSidebarViewOnMobile() {
    if (window.innerWidth <= 768) {
        if (sidebarPane) sidebarPane.classList.remove('mobile-hidden');
        if (chatPane) chatPane.classList.add('mobile-hidden');
    } else {
        if (sidebarPane) sidebarPane.classList.remove('mobile-hidden');
        if (chatPane) chatPane.classList.remove('mobile-hidden');
    }
    if (topModalBar) topModalBar.classList.remove('hidden');
}

function showChatViewOnMobile() {
    if (window.innerWidth <= 768) {
        if (sidebarPane) sidebarPane.classList.add('mobile-hidden');
        if (chatPane) chatPane.classList.remove('mobile-hidden');
    } else {
        if (sidebarPane) sidebarPane.classList.remove('mobile-hidden');
        if (chatPane) chatPane.classList.remove('mobile-hidden');
    }
    if (topModalBar) topModalBar.classList.remove('hidden');
}

safeAddListener(backToListBtn, 'click', () => {
    if (window.chatSubscription && db) {
        db.removeChannel(window.chatSubscription);
        window.chatSubscription = null;
    }
    activeConversationId = null;
    activeConversationPartnerId = null;
    activeConversationPartnerUsername = null;
    showSidebarViewOnMobile();
    refreshMessagingHub();
});

async function refreshMessagingHub() {
    await Promise.all([
        loadFriendRequests(),
        loadFriends(),
        loadMessageRequests(),
        loadConversations()
    ]);
    updateSidebarBadges();
}

async function loadMessageRequests() {
    if (!currentUser || !db || !msgRequestsContainer) return;

    try {
        const { data: myMemberships } = await db
            .from('conversation_members')
            .select('conversation_id')
            .eq('user_id', currentUser.id);

        if (!myMemberships || myMemberships.length === 0) {
            if (msgRequestsHeader) msgRequestsHeader.classList.add('hidden');
            msgRequestsContainer.innerHTML = '';
            return;
        }

        const myConvIds = myMemberships.map(m => m.conversation_id);

        const { data: convs } = await db
            .from('conversations')
            .select('id')
            .in('id', myConvIds)
            .eq('is_group', false);

        if (!convs || convs.length === 0) {
            if (msgRequestsHeader) msgRequestsHeader.classList.add('hidden');
            msgRequestsContainer.innerHTML = '';
            return;
        }

        const oneOnOneIds = convs.map(c => c.id);

        const { data: otherMembers } = await db
            .from('conversation_members')
            .select('conversation_id, user_id')
            .in('conversation_id', oneOnOneIds)
            .neq('user_id', currentUser.id);

        if (!otherMembers || otherMembers.length === 0) {
            if (msgRequestsHeader) msgRequestsHeader.classList.add('hidden');
            msgRequestsContainer.innerHTML = '';
            return;
        }

        const { data: friendships } = await db
            .from('friendships')
            .select('user_id, friend_id')
            .eq('status', 'accepted')
            .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`);

        const acceptedFriendIds = new Set(
            (friendships || []).map(f => f.user_id === currentUser.id ? f.friend_id : f.user_id)
        );

        const nonFriendMembers = otherMembers.filter(m => !acceptedFriendIds.has(m.user_id));

        if (nonFriendMembers.length === 0) {
            if (msgRequestsHeader) msgRequestsHeader.classList.add('hidden');
            msgRequestsContainer.innerHTML = '';
            return;
        }

        const partnerIds = Array.from(new Set(nonFriendMembers.map(m => m.user_id)));
        const { data: profiles } = await db
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', partnerIds);

        const profileMap = new Map((profiles || []).map(p => [p.id, p]));

        const nonFriendConvIds = nonFriendMembers.map(m => m.conversation_id);
        const { data: msgs } = await db
            .from('chat_messages')
            .select('conversation_id')
            .in('conversation_id', nonFriendConvIds)
            .limit(100);

        const convsWithMessages = new Set((msgs || []).map(m => m.conversation_id));
        const activeRequests = nonFriendMembers.filter(m => convsWithMessages.has(m.conversation_id));

        if (activeRequests.length === 0) {
            if (msgRequestsHeader) msgRequestsHeader.classList.add('hidden');
            msgRequestsContainer.innerHTML = '';
            return;
        }

        if (msgRequestsHeader) msgRequestsHeader.classList.remove('hidden');
        msgRequestsContainer.innerHTML = '';

        activeRequests.forEach(req => {
            const partner = profileMap.get(req.user_id) || { id: req.user_id, username: 'user' };
            const div = document.createElement('div');
            div.className = `conv-item ${activeConversationId === req.conversation_id ? 'active' : ''}`;
            div.setAttribute('data-conv-id', req.conversation_id);

            const unreadCount = unreadCountsByConv.get(req.conversation_id) || 0;
            const badgeHtml = unreadCount > 0 
                ? `<span class="conv-badge">${unreadCount}</span>` 
                : `<span class="badge badge-yellow" style="font-size:0.65rem;">Request</span>`;

            div.innerHTML = `
                <div class="conv-item-label">
                    <span>💬 @${escapeHTML(partner.username)}</span>
                </div>
                ${badgeHtml}
            `;

            div.addEventListener('click', () => {
                selectConversation(req.conversation_id, `@${partner.username}`, partner.id, partner.username, false);
            });

            msgRequestsContainer.appendChild(div);
        });
    } catch (e) {
        console.warn("loadMessageRequests error:", e);
    }
}

async function loadFriendRequests() {
    if (!currentUser || !db || !requestsContainer) return;

    const { data: requests, error } = await db
        .from('friendships')
        .select('id, user_id')
        .eq('friend_id', currentUser.id)
        .eq('status', 'pending');

    if (error || !requests || requests.length === 0) {
        if (requestsHeader) requestsHeader.classList.add('hidden');
        requestsContainer.innerHTML = '';
        return;
    }

    const requesterIds = requests.map(r => r.user_id);
    const { data: profiles } = await db
        .from('profiles')
        .select('id, username')
        .in('id', requesterIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p.username]));

    if (requestsHeader) requestsHeader.classList.remove('hidden');
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
    if (!db) return;
    if (accept) {
        const { data: updatedReq, error } = await db
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', requestId)
            .select()
            .single();

        if (error) {
            alert(`Error accepting request: ${error.message}`);
        } else if (updatedReq) {
            await db
                .from('chat_messages')
                .update({ pending_approval: false })
                .or(`and(sender_id.eq.${updatedReq.user_id}),and(sender_id.eq.${updatedReq.friend_id})`)
                .eq('pending_approval', true);
        }
    } else {
        const { error } = await db.from('friendships').delete().eq('id', requestId);
        if (error) alert(`Error declining request: ${error.message}`);
    }
    refreshMessagingHub();
    checkNotifications();
}

async function loadFriends() {
    if (!currentUser || !db || !friendsContainer) return;

    const { data: friendships, error } = await db
        .from('friendships')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`);

    if (error) {
        console.warn("Error loading friends:", error);
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
        if (p.username && p.avatar_url) usernameAvatarMap.set(p.username.toLowerCase(), p.avatar_url);
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

    if (groupFriendsChecklist) {
        groupFriendsChecklist.innerHTML = '';
        myFriendsList.forEach(friend => {
            const item = document.createElement('label');
            item.style.fontSize = '0.82rem';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '6px';
            item.innerHTML = `
                <input type="checkbox" value="${friend.id}" class="group-friend-chk" style="width: auto; margin-bottom: 0;">
                <span>@${escapeHTML(friend.username)}</span>
            `;
            groupFriendsChecklist.appendChild(item);
        });
    }
}

safeAddListener(addFriendBtn, 'click', async () => {
    if (!db || !addFriendInput) return;
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
        if (existing.status === 'accepted') alert("You are already friends with this user.");
        else if (existing.user_id === currentUser.id) alert("Friend request already sent. Waiting for response.");
        else alert("This user has already sent you a request! Check incoming requests.");
        return;
    }

    const { error: insertErr } = await db.from('friendships').insert([{ 
        user_id: currentUser.id, 
        friend_id: targetProfile.id, 
        status: 'pending' 
    }]);

    if (insertErr) {
        alert(`Could not send request: ${insertErr.message}`);
        return;
    }

    await sendNotification(targetProfile.id, 'friend_request', null, 'sent you a friend request.');
    addFriendInput.value = '';
    alert("friend request sent");
    refreshMessagingHub();
});

async function loadConversations() {
    if (!currentUser || !db || !groupsContainer) return;

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

        div.addEventListener('click', () => selectConversation(conv.id, `Group: ${conv.name}`, null, null, true));
        groupsContainer.appendChild(div);
    });
}

async function startOrOpenDirectChat(friend) {
    if (!db || !currentUser || !friend?.id) return;

    try {
        // Check if accepted friends
        const { data: friendship } = await db
            .from('friendships')
            .select('status')
            .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${friend.id}),and(user_id.eq.${friend.id},friend_id.eq.${currentUser.id})`)
            .maybeSingle();

        const isFriend = friendship && friendship.status === 'accepted';

        // Check for an existing 1-on-1 conversation
        const { data: myMemberships } = await db
            .from('conversation_members')
            .select('conversation_id')
            .eq('user_id', currentUser.id);

        const myConvIds = (myMemberships || []).map(m => m.conversation_id);
        let existingConvId = null;

        if (myConvIds.length > 0) {
            const { data: sharedMemberships } = await db
                .from('conversation_members')
                .select('conversation_id')
                .in('conversation_id', myConvIds)
                .eq('user_id', friend.id);

            if (sharedMemberships && sharedMemberships.length > 0) {
                const sharedIds = sharedMemberships.map(s => s.conversation_id);
                const { data: conv } = await db
                    .from('conversations')
                    .select('id')
                    .in('id', sharedIds)
                    .eq('is_group', false)
                    .limit(1)
                    .maybeSingle();

                if (conv) existingConvId = conv.id;
            }
        }

        if (existingConvId) {
            selectConversation(existingConvId, `@${friend.username}`, friend.id, friend.username, isFriend);
            return;
        }

        // Create new conversation
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

        selectConversation(newConv.id, `@${friend.username}`, friend.id, friend.username, isFriend);
    } catch (err) {
        console.error("startOrOpenDirectChat error:", err);
        alert(`Could not start chat: ${err.message}`);
    }
}

safeAddListener(toggleGroupCreateBtn, 'click', () => {
    if (groupCreatorBox) groupCreatorBox.classList.toggle('hidden');
});
safeAddListener(cancelGroupBtn, 'click', () => {
    if (groupCreatorBox) groupCreatorBox.classList.add('hidden');
});

safeAddListener(createGroupConfirmBtn, 'click', async () => {
    if (!db || !groupNameInput) return;
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

    const { error: membersErr } = await db.from('conversation_members').insert(membersToInsert);

    if (membersErr) {
        alert(`Error adding group members: ${membersErr.message}`);
        return;
    }

    groupNameInput.value = '';
    if (groupCreatorBox) groupCreatorBox.classList.add('hidden');
    await loadConversations();
    selectConversation(newGroup.id, `Group: ${groupName}`, null, null, true);
});

function selectConversation(conversationId, title, partnerId = null, partnerUsername = null, isFriend = true) {
    if (!db) return;
    activeConversationId = conversationId;
    activeConversationPartnerId = partnerId;
    activeConversationPartnerUsername = partnerUsername;
    activeConversationIsFriend = isFriend;

    if (chatHeader) {
        if (partnerUsername) {
            chatHeader.innerHTML = `<span class="clickable-username" title="Click to view @${escapeHTML(partnerUsername)}'s profile">@${escapeHTML(partnerUsername)}</span>`;
        } else {
            chatHeader.textContent = title;
        }
    }

    if (dmText) dmText.disabled = false;
    if (dmImageInput) dmImageInput.disabled = false;
    if (dmSendBtn) dmSendBtn.disabled = false;

    if (chatPendingBanner) {
        if (!isFriend && partnerId) chatPendingBanner.classList.remove('hidden');
        else chatPendingBanner.classList.add('hidden');
    }

    showChatViewOnMobile();
    document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));

    const activeEl = document.querySelector(`[data-conv-id="${conversationId}"]`);
    if (activeEl) {
        activeEl.classList.add('active');
        const badge = activeEl.querySelector('.conv-badge');
        if (badge) badge.classList.add('hidden');
    }

    loadMessages(true);

    if (window.chatSubscription) {
        db.removeChannel(window.chatSubscription);
    }

    window.chatSubscription = db.channel(`chat_${activeConversationId}`)
        .on(
            'postgres_changes',
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'chat_messages', 
                filter: `conversation_id=eq.${activeConversationId}` 
            },
            (payload) => {
                const newMsg = payload?.new;
                if (!newMsg) {
                    loadMessages(true);
                    return;
                }
                const existing = document.getElementById(`msg-${newMsg.id}`);
                if (!existing) {
                    appendChatMessage(newMsg, false);
                }
                if (currentUser && newMsg.sender_id !== currentUser.id) {
                    db.from('chat_messages')
                        .update({ is_read: true })
                        .eq('id', newMsg.id)
                        .catch(() => {});
                }
            }
        )
        .subscribe();
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
    if (!db) return;
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

function createMessageElement(msg) {
    const isMine = currentUser && msg.sender_id === currentUser.id;
    const senderAvatar = userAvatarCache.get(msg.sender_id) || DEFAULT_AVATAR;
    const isPending = msg.pending_approval;
    const isOptimistic = Boolean(msg.is_optimistic);

    const row = document.createElement('div');
    row.className = `msg-row ${isMine ? 'mine' : 'theirs'}`;
    row.id = `msg-${msg.id}`;
    if (isOptimistic) row.style.opacity = '0.75';

    const avatarImgHtml = `<img src="${senderAvatar}" class="msg-avatar clickable-avatar" data-username="${escapeHTML(msg.sender_username)}" alt="pfp" title="@${escapeHTML(msg.sender_username)}">`;
    const authorHtml = !isMine ? `<div class="msg-author clickable-username" data-username="${escapeHTML(msg.sender_username)}">@${escapeHTML(msg.sender_username)}</div>` : '';
    const textHtml = msg.content ? `<div>${renderFormattedContent(msg.content)}</div>` : '';
    const imgHtml = msg.image_url ? `<a href="${msg.image_url}" target="_blank"><img src="${msg.image_url}" class="chat-img-thumb" alt="Uploaded photo" loading="lazy"></a>` : '';
    
    let pendingBadge = '';
    if (isOptimistic) {
        pendingBadge = `<span class="pending-tag" style="background:#475569; color:#94a3b8;">⏱ Sending...</span>`;
    } else if (isPending) {
        pendingBadge = isMine 
            ? `<span class="pending-tag">⏳ Pending Approval</span>` 
            : `<span class="pending-tag" style="background:#0369a1; color:#e0f2fe;">📩 Chat Request</span>`;
    }
    const bubbleHtml = `
        <div class="msg-bubble ${isMine ? 'msg-mine' : 'msg-theirs'} ${isPending ? 'pending-approval' : ''}">
            ${authorHtml}${textHtml}${imgHtml}${pendingBadge}
        </div>
    `;

    row.innerHTML = isMine ? (bubbleHtml + avatarImgHtml) : (avatarImgHtml + bubbleHtml);

    const attachedImg = row.querySelector('.chat-img-thumb');
    if (attachedImg) {
        attachedImg.onload = () => scrollToBottom(false);
    }

    row.querySelectorAll('.clickable-username, .clickable-avatar').forEach(clickable => {
        clickable.addEventListener('click', (e) => {
            const u = e.currentTarget.getAttribute('data-username');
            if (u) window.openUserProfileCard(u);
        });
    });

    return row;
}

function appendChatMessage(msg, forceScroll = true) {
    if (!chatMessages) return;

    // Remove empty notice if present
    const emptyNotice = chatMessages.querySelector('.no-posts');
    if (emptyNotice) emptyNotice.remove();

    // Check if element with this ID already exists
    const existing = document.getElementById(`msg-${msg.id}`);
    if (existing) return;

    const row = createMessageElement(msg);
    chatMessages.appendChild(row);
    scrollToBottom(forceScroll);

    if (msg.sender_id && !userAvatarCache.has(msg.sender_id)) {
        ensureAvatarsCached([msg.sender_id]).then(() => {
            const avatar = userAvatarCache.get(msg.sender_id);
            if (avatar) {
                const img = row.querySelector('.msg-avatar');
                if (img) img.src = avatar;
            }
        }).catch(() => {});
    }
}

async function loadMessages(forceScroll = false) {
    if (!currentUser || !activeConversationId || !db || !chatMessages) return;

    // Fetch latest 50 messages for optimal initial load time
    const { data: messages, error } = await db
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('id', { ascending: false })
        .limit(50);

    if (error) {
        console.warn("Error loading chat messages:", error);
        return;
    }

    const visibleMessages = (messages || []).reverse();

    const currentMsgCount = chatMessages.querySelectorAll('.msg-bubble').length;
    if (!forceScroll && visibleMessages.length === currentMsgCount) return;

    // Check for pending messages
    const pendingFromPartner = visibleMessages.filter(m => m.pending_approval && m.sender_id !== currentUser.id);
    const pendingFromMe = visibleMessages.filter(m => m.pending_approval && m.sender_id === currentUser.id);

    // Update banner for chat request approval
    if (chatPendingBanner) {
        if (!activeConversationIsFriend && pendingFromPartner.length > 0) {
            chatPendingBanner.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%; flex-wrap:wrap; gap:8px;">
                    <span>📬 @${escapeHTML(activeConversationPartnerUsername || 'User')} sent you a message request.</span>
                    <div style="display:flex; gap:6px;">
                        <button type="button" id="accept-chat-request-btn" style="background:#16a34a; color:#ffffff; border:none; padding:5px 12px; border-radius:6px; font-size:0.78rem; font-weight:700; cursor:pointer;">✓ Accept</button>
                        <button type="button" id="deny-chat-request-btn" style="background:#dc2626; color:#ffffff; border:none; padding:5px 12px; border-radius:6px; font-size:0.78rem; font-weight:700; cursor:pointer;">✕ Decline</button>
                    </div>
                </div>
            `;
            chatPendingBanner.classList.remove('hidden');

            const acceptBtn = document.getElementById('accept-chat-request-btn');
            if (acceptBtn) {
                acceptBtn.onclick = async () => {
                    acceptBtn.disabled = true;
                    acceptBtn.textContent = 'Accepting...';
                    await db
                        .from('chat_messages')
                        .update({ pending_approval: false })
                        .eq('conversation_id', activeConversationId);
                    chatPendingBanner.classList.add('hidden');
                    loadMessages(true);
                    refreshMessagingHub();
                };
            }

            const denyBtn = document.getElementById('deny-chat-request-btn');
            if (denyBtn) {
                denyBtn.onclick = async () => {
                    if (!confirm("Decline and delete this message request?")) return;
                    denyBtn.disabled = true;
                    await db.from('chat_messages').delete().eq('conversation_id', activeConversationId);
                    chatPendingBanner.classList.add('hidden');
                    activeConversationId = null;
                    showSidebarViewOnMobile();
                    refreshMessagingHub();
                };
            }
        } else if (!activeConversationIsFriend && pendingFromMe.length > 0) {
            chatPendingBanner.innerHTML = `<span>⏳ Message request sent. Messages remain pending until @${escapeHTML(activeConversationPartnerUsername || 'recipient')} accepts.</span>`;
            chatPendingBanner.classList.remove('hidden');
        } else {
            chatPendingBanner.classList.add('hidden');
        }
    }

    chatMessages.innerHTML = '';
    if (!visibleMessages || visibleMessages.length === 0) {
        chatMessages.innerHTML = '<div class="no-posts">No messages in this chat yet. Start the conversation!</div>';
        return;
    }

    const senderIds = Array.from(new Set(visibleMessages.map(m => m.sender_id)));
    await ensureAvatarsCached(senderIds);

    const fragment = document.createDocumentFragment();
    visibleMessages.forEach(msg => {
        fragment.appendChild(createMessageElement(msg));
    });
    chatMessages.appendChild(fragment);

    scrollToBottom(forceScroll);

    db.from('chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', activeConversationId)
        .neq('sender_id', currentUser.id)
        .eq('is_read', false)
        .catch(() => {});

    unreadCountsByConv.delete(activeConversationId);
    checkNotifications();
}

safeAddListener(dmImageInput, 'change', () => {
    const file = dmImageInput.files[0];
    const label = document.querySelector('.upload-photo-label');
    if (!label) return;
    if (file) {
        label.style.borderColor = '#16a34a';
        label.title = `Attached: ${file.name}`;
    } else {
        label.style.borderColor = '#475569';
        label.title = 'Attach Photo';
    }
});

safeAddListener(dmForm, 'submit', async (e) => {
    e.preventDefault();
    if (!db) return;
    if (isSuspended) {
        triggerSuspensionGate();
        return;
    }

    const messageText = dmText.value.trim();
    const rawFile = dmImageInput.files[0];

    if (!messageText && !rawFile) return;
    if (!activeConversationId) return;

    // Reset input fields immediately for instant response
    dmText.value = '';
    dmImageInput.value = '';
    const label = document.querySelector('.upload-photo-label');
    if (label) {
        label.style.borderColor = '#475569';
        label.title = 'Attach Photo';
    }

    // Check if the chat was already approved previously
    let isPendingApproval = false;
    if (activeConversationPartnerId && !activeConversationIsFriend) {
        const { data: approvedMsg } = await db
            .from('chat_messages')
            .select('id')
            .eq('conversation_id', activeConversationId)
            .eq('pending_approval', false)
            .limit(1);

        isPendingApproval = !approvedMsg || approvedMsg.length === 0;
    }

    // Instant Optimistic UI append
    const tempId = 'temp_' + Date.now();
    let localPreviewUrl = null;
    if (rawFile) {
        localPreviewUrl = URL.createObjectURL(rawFile);
    }

    const optimisticMsg = {
        id: tempId,
        conversation_id: activeConversationId,
        sender_id: currentUser.id,
        sender_username: currentUsername,
        content: messageText || '',
        image_url: localPreviewUrl,
        pending_approval: isPendingApproval,
        is_optimistic: true
    };
    appendChatMessage(optimisticMsg, true);

    dmSendBtn.disabled = true;
    dmSendBtn.textContent = '...';

    try {
        let uploadedImageUrl = null;
        if (rawFile) {
            const file = await compressImage(rawFile, 1200, 0.75);
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
            const filePath = `${activeConversationId}/${fileName}`;

            const { error: uploadError } = await db.storage
                .from('chat-images')
                .upload(filePath, file);

            if (uploadError) {
                alert(`Photo upload failed: ${uploadError.message}`);
                const tempEl = document.getElementById(`msg-${tempId}`);
                if (tempEl) tempEl.remove();
                return;
            }

            const { data: publicUrlData } = db.storage.from('chat-images').getPublicUrl(filePath);
            uploadedImageUrl = publicUrlData.publicUrl;
        }

        // If recipient replies to incoming pending chat, auto-approve
        if (activeConversationPartnerId) {
            await db
                .from('chat_messages')
                .update({ pending_approval: false })
                .eq('conversation_id', activeConversationId)
                .neq('sender_id', currentUser.id)
                .eq('pending_approval', true);
        }

        const { data: insertedMsg, error } = await db
            .from('chat_messages')
            .insert([{
                conversation_id: activeConversationId,
                sender_id: currentUser.id,
                sender_username: currentUsername,
                content: messageText || '',
                image_url: uploadedImageUrl,
                pending_approval: isPendingApproval
            }])
            .select()
            .single();

        if (error) {
            alert(`Error sending message: ${error.message}`);
            const tempEl = document.getElementById(`msg-${tempId}`);
            if (tempEl) tempEl.remove();
            return;
        }

        // Confirm optimistic bubble with real server ID
        const tempEl = document.getElementById(`msg-${tempId}`);
        if (tempEl && insertedMsg) {
            tempEl.id = `msg-${insertedMsg.id}`;
            tempEl.style.opacity = '1';
            const pendingTag = tempEl.querySelector('.pending-tag');
            if (pendingTag) {
                if (!insertedMsg.pending_approval) {
                    pendingTag.remove();
                } else {
                    pendingTag.textContent = '⏳ Pending Approval';
                    pendingTag.style.background = '#334155';
                    pendingTag.style.color = '#cbd5e1';
                }
            }
            if (uploadedImageUrl) {
                const img = tempEl.querySelector('.chat-img-thumb');
                if (img) img.src = uploadedImageUrl;
            }
        }

        // Background notification dispatching
        if (isPendingApproval && activeConversationPartnerId) {
            db.from('friendships').insert([{
                user_id: currentUser.id,
                friend_id: activeConversationPartnerId,
                status: 'pending'
            }]).then(() => {
                sendNotification(
                    activeConversationPartnerId,
                    'friend_request',
                    null,
                    'sent you a friend request and a pending message.'
                );
            }).catch(() => {});
        } else {
            let recipientIds = [];
            if (activeConversationPartnerId) {
                recipientIds.push(activeConversationPartnerId);
            } else {
                const { data: members } = await db
                    .from('conversation_members')
                    .select('user_id')
                    .eq('conversation_id', activeConversationId)
                    .neq('user_id', currentUser.id);

                if (members && members.length > 0) {
                    recipientIds = members.map(m => m.user_id);
                }
            }

            if (recipientIds.length > 0) {
                let snippet = 'sent a photo.';
                if (messageText) {
                    const cleanText = messageText.length > 50 ? `${messageText.substring(0, 47)}...` : messageText;
                    snippet = `: "${cleanText}"`;
                }

                const notifsToInsert = recipientIds.map(rId => ({
                    user_id: rId,
                    actor_username: currentUsername,
                    type: 'direct_message',
                    entity_id: String(activeConversationId),
                    message: snippet,
                    is_read: false
                }));

                db.from('user_notifications').insert(notifsToInsert).catch(err => {
                    const fallbackNotifs = notifsToInsert.map(n => ({ ...n, entity_id: null }));
                    db.from('user_notifications').insert(fallbackNotifs).catch(() => {});
                });
            }
        }
    } catch (err) {
        console.warn("Message sending error:", err);
    } finally {
        dmSendBtn.disabled = false;
        dmSendBtn.textContent = 'Send';
    }
});

// --- NOTIFICATION BADGES ---

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
                .eq('is_read', false)
                .eq('pending_approval', false);

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
            const badgeText = total > 99 ? '99+' : total;
            if (notifBadge) { notifBadge.textContent = badgeText; notifBadge.classList.remove('hidden'); }
            if (mobileMsgBadge) { mobileMsgBadge.textContent = badgeText; mobileMsgBadge.classList.remove('hidden'); }
        } else {
            if (notifBadge) notifBadge.classList.add('hidden');
            if (mobileMsgBadge) mobileMsgBadge.classList.add('hidden');
        }

        if (dmModal && !dmModal.classList.contains('hidden')) {
            updateSidebarBadges();
        }
    } catch (e) {
        console.warn("Notif check notice:", e);
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

safeAddListener(clearAllNotifsBtn, 'click', async () => {
    if (!currentUser || !db) return;
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
    if (notifBadge) notifBadge.classList.add('hidden');
    if (mobileMsgBadge) mobileMsgBadge.classList.add('hidden');
    updateSidebarBadges();
});

// --- VOTING & FEED ENGINE ---

function getPostScore(post) {
    const dbLikes = Number(post.likes || 0);
    const dbDislikes = Number(post.dislikes || 0);
    return dbLikes - dbDislikes;
}

async function handleVote(postId, direction) {
    if (!currentUser) {
        alert("You must be logged in to like or dislike posts.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (document.getElementById('auth-email')) document.getElementById('auth-email').focus();
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

    // Only apply the 7-day cutoff filter when not on the compiled Trending thread
    if (sortMode === 'trending' && activeThread !== 'Trending') {
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

        // Ensure the Trending feed orders by highest score first by default
        if (activeThread === 'Trending' && (sortMode === 'top' || sortMode === 'trending')) {
            if (scoreB !== scoreA) return scoreB - scoreA;
            return Number(b.id) - Number(a.id);
        }

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
        content: `### Welcome to Turing's Gate: The Verified Human Community

Turing's Gate is built to protect organic human discussions from automated AI crawlers, spambots, and synthetic farm networks through passive client-side telemetry, cryptographic perimeter defense, and an accountable Web of Trust.

<div class="welcome-diagram">
    <div class="diagram-step">
        <span class="diagram-badge">1. Cryptographic Perimeter Guard</span>
        <span>Account creation and logins are safeguarded by Cloudflare Turnstile, ensuring only cryptographically verified human browsers can interact with our database APIs.</span>
    </div>
    <div class="diagram-step">
        <span class="diagram-badge">2. Telemetry Cadence</span>
        <span>In-app keystroke intervals and micro-pauses are evaluated in real time. Mechanical, zero-variance cadence raises suspicion scores.</span>
    </div>
    <div class="diagram-step">
        <span class="diagram-badge">3. Web of Trust (3 Lifetime Invites)</span>
        <span>Network expansion is strictly capped: every verified account receives exactly three lifetime invites. You are mutually accountable for the accounts you introduce—if an invitee deploys automated scripts or spams, your Human Score is penalized.</span>
    </div>
    <div class="diagram-step">
        <span class="diagram-badge">4. Accessibility-Safe Risk Ledger</span>
        <span>Speech-to-text, screen readers, and assistive copy-paste are never hard-blocked. Instead, actions gently accumulate suspicion points only if burst-spam behaviors are sustained.</span>
    </div>
    <div class="diagram-step">
        <span class="diagram-badge">5. Verification Escrow</span>
        <span>Reaching a threshold temporarily suspends account posting until an interactive visual verification challenge is completed.</span>
    </div>
    <div class="diagram-step">
        <span class="diagram-badge">6. Verified Direct Messaging</span>
        <span>1-on-1 private messaging remains safely quarantined until recipient approval, stopping automated spam inboxes cold.</span>
    </div>
</div>

Explore topics, participate in discussions, and enjoy an authenticated bot-free community!`
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
    const userCanEdit = post.author && currentUsername && post.author.toLowerCase() === currentUsername.toLowerCase();
    const userCanPin = (postAuthorRole === 'Site Admin' || postAuthorRole === 'Owner' || postAuthorRole === 'Moderator');

    let actionButtonsHtml = `
        <div class="post-admin-actions">
            <button type="button" class="btn-post-action toggle-comments-btn" data-post-id="${post.id}">💬 <span id="comment-count-${post.id}">...</span></button>
            <button type="button" class="btn-post-action btn-share-post" data-post-id="${post.id}">📤 Share <span id="share-count-${post.id}" style="margin-left:4px; opacity:0.8;">${post.shares || 0}</span></button>
            ${userCanEdit ? `<button type="button" class="btn-post-action btn-edit-post" data-post-id="${post.id}">✏️ Edit</button>` : ''}
            ${userCanPin ? `<button type="button" class="btn-post-action btn-pin-post" data-post-id="${post.id}">${post.is_pinned ? '📌 Unpin' : '📌 Pin'}</button>` : ''}
            ${userCanDelete ? `<button type="button" class="btn-post-action danger-text btn-delete-post" data-post-id="${post.id}">🗑 Delete</button>` : ''}
        </div>
    `;

    const photoHtml = post.image_url ? `<a href="${post.image_url}" target="_blank" rel="noopener noreferrer"><img src="${post.image_url}" class="post-img-thumb" alt="Post photo" loading="lazy"></a>` : '';
    const cleanAuthor = (post.author || 'anonymous').toLowerCase().replace('@', '');
    const authorAvatar = usernameAvatarMap.get(cleanAuthor) || DEFAULT_AVATAR;
    const renderedBody = post.is_pinned && !post.poll_options ? post.content : renderFormattedContent(post.content || '');

    // Construct Poll UI
    let pollHtml = '';
    if (post.poll_options && Array.isArray(post.poll_options)) {
        const votes = post.poll_votes || {};
        const totalVotes = Object.keys(votes).length;
        const hasVoted = currentUsername && votes[currentUsername.toLowerCase()] !== undefined;
        const isExpired = post.poll_expires_at && new Date(post.poll_expires_at) < new Date();
        const showResults = hasVoted || isExpired;

        // Tally votes
        const tallies = post.poll_options.map(() => 0);
        Object.values(votes).forEach(optIndex => {
            if(tallies[optIndex] !== undefined) tallies[optIndex]++;
        });
        const maxVotes = Math.max(...tallies, 0);

        pollHtml += `<div class="poll-container" id="poll-${post.id}">`;
        
        post.poll_options.forEach((opt, idx) => {
            if (showResults) {
                const pct = totalVotes > 0 ? Math.round((tallies[idx] / totalVotes) * 100) : 0;
                const isWinner = tallies[idx] === maxVotes && totalVotes > 0;
                pollHtml += `
                    <div class="poll-result-bar-wrap">
                        <div class="poll-result-fill ${isWinner ? 'winner' : ''}" style="width: ${pct}%;"></div>
                        <div class="poll-result-text">
                            <span>${escapeHTML(opt)} ${votes[currentUsername?.toLowerCase()] === idx ? ' ✓' : ''}</span>
                            <span>${pct}%</span>
                        </div>
                    </div>
                `;
            } else {
                pollHtml += `<button type="button" class="poll-option-btn vote-poll-btn" data-post-id="${post.id}" data-opt-idx="${idx}">${escapeHTML(opt)}</button>`;
            }
        });
        pollHtml += `<div class="poll-meta">${totalVotes} votes • ${isExpired ? 'Final Results' : 'Poll Open'}</div></div>`;
    }

    // Display globally synced flair
    const authorFlair = threadFlairMap.get(cleanAuthor);
    const userFlairBadge = authorFlair 
        ? `<span class="badge" style="font-size:0.65rem; background: #1e293b; border: 1px solid #475569; color: #94a3b8; margin-left: 4px;">${escapeHTML(authorFlair)}</span>` 
        : '';

    const titleHtml = post.title ? `<div class="post-title-text">${escapeHTML(post.title)}</div>` : '';

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
                    <span>By: <strong class="post-author clickable-username" data-username="${escapeHTML(cleanAuthor)}">@${escapeHTML(cleanAuthor)}</strong></span>${activeThread === 'Trending' && post.thread ? `<span class="clickable-thread" data-thread="${escapeHTML(post.thread)}" style="font-size: 0.72rem; color: #38bdf8; background: #0f172a; padding: 1px 6px; border-radius: 4px; border: 1px solid #334155;">#${escapeHTML(post.thread)}</span>` : ''}
                    ${roleBadge}${userFlairBadge}
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                    <span>${dateFormatted}</span>${post.is_edited ? `<span class="edited-badge view-edit-history" data-post-id="${post.id}">Edited 🕒</span>` : ''}
                </div>
            </div>
            ${titleHtml}
            <div class="post-content" id="post-text-${post.id}">${renderedBody}</div>${pollHtml}
            ${photoHtml}${actionButtonsHtml}
            
            <div id="comments-section-${post.id}" class="comments-section hidden" style="margin-top: 12px; border-top: 1px solid #334155; padding-top: 12px;">
                <div id="comments-list-${post.id}" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; max-height: 200px; overflow-y: auto;"></div>
                <div style="display: flex; gap: 6px;">
                    <input type="text" id="comment-input-${post.id}" placeholder="Write a reply..." style="margin-bottom: 0; padding: 8px; font-size: 0.85rem; flex: 1;" autocomplete="off">
                    <button type="button" class="submit-comment-btn" data-post-id="${post.id}" data-author-username="${escapeHTML(cleanAuthor)}" style="width: auto; padding: 0 12px; font-size: 0.85rem;">Reply</button>
                </div>
            </div>
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

    const commentsBtn = item.querySelector('.toggle-comments-btn');
    if (commentsBtn) {
        commentsBtn.addEventListener('click', () => {
            const section = item.querySelector(`#comments-section-${post.id}`);
            section.classList.toggle('hidden');
            if (!section.classList.contains('hidden')) {
                loadCommentsForPost(post.id);
            }
        });
    }

    const shareBtn = item.querySelector('.btn-share-post');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            openShareModal(post.id);
        });
    }

    const submitCommentBtn = item.querySelector('.submit-comment-btn');
        if (submitCommentBtn) {
            submitCommentBtn.addEventListener('click', (e) => {
                const input = item.querySelector(`#comment-input-${post.id}`);
                const authorUsername = e.currentTarget.getAttribute('data-author-username');
                submitComment(post.id, authorUsername, input.value);
                input.value = '';
            });
        }

        // Fetch comment count asynchronously for the button
        if (db && post.id !== 'welcome-seed') {
            db.from('post_comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id)
                .then(({ count, error }) => {
                    if (!error && count !== null) {
                        const countSpan = item.querySelector(`#comment-count-${post.id}`);
                        if (countSpan) {
                            countSpan.textContent = count === 1 ? '1 Comment' : `${count} Comments`;
                        }
                    }
                });
        } else if (post.id === 'welcome-seed') {
            const countSpan = item.querySelector(`#comment-count-${post.id}`);
            if (countSpan) countSpan.textContent = '0 Comments';
        }
    const editBtn = item.querySelector('.btn-edit-post');
        if (editBtn) {
            editBtn.addEventListener('click', () => openPostEditModal(post));
        }
        
        const historyBtn = item.querySelector('.view-edit-history');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => loadEditHistory(post.id));
        }
    item.querySelectorAll('.vote-poll-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pId = e.currentTarget.getAttribute('data-post-id');
            const oIdx = e.currentTarget.getAttribute('data-opt-idx');
            submitPollVote(pId, oIdx);
        });
    });

    const pinBtn = item.querySelector('.btn-pin-post');
    if (pinBtn) {
        pinBtn.addEventListener('click', () => togglePinPost(post));
    }


        return item;
    }

async function deletePostById(postId) {
    if (!currentUser) return;
    if (db) {
        await db.from('Posts').delete().eq('id', postId);
        await db.from('post_comments').delete().eq('post_id', postId);
    }
    cachedPosts = cachedPosts.filter(p => String(p.id) !== String(postId));
    postCacheMap.delete(Number(postId));
    renderCurrentFeed();
    loadProminentUpdates();
}

async function loadCommentsForPost(postId) {
    const listEl = document.getElementById(`comments-list-${postId}`);
    if (!listEl || !db) return;
    
    listEl.innerHTML = '<span style="font-size:0.8rem; color:#64748b;">Loading replies...</span>';
    
    const { data: comments, error } = await db
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('id', { ascending: true });

    if (error || !comments || comments.length === 0) {
        listEl.innerHTML = '<span style="font-size:0.8rem; color:#64748b; font-style:italic;">No replies yet.</span>';
        return;
    }

    listEl.innerHTML = '';

    // Group comments by parent to create a hierarchy tree
    const topLevelComments = comments.filter(c => !c.parent_id);
    const repliesByParent = {};
    comments.forEach(c => {
        if (c.parent_id) {
            if (!repliesByParent[c.parent_id]) repliesByParent[c.parent_id] = [];
            repliesByParent[c.parent_id].push(c);
        }
    });

    // Recursive render function for nested replies
    const renderCommentNode = (c, isReply = false) => {
        const cleanAuthor = (c.author || 'anonymous').toLowerCase().replace('@', '');
        const avatar = usernameAvatarMap.get(cleanAuthor) || DEFAULT_AVATAR;

        const wrap = document.createElement('div');
        // Indent and add left border if it's a reply
        wrap.style.cssText = `display: flex; flex-direction: column; gap: 6px; ${isReply ? 'margin-left: 24px; border-left: 2px solid #334155; padding-left: 10px; margin-top: 6px;' : 'background: #0f172a; padding: 8px; border-radius: 6px;'}`;

        const commentBody = document.createElement('div');
        commentBody.style.cssText = "display: flex; gap: 8px; font-size: 0.85rem;";
        commentBody.innerHTML = `
            <img src="${avatar}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; cursor: pointer;" class="clickable-username" data-username="${escapeHTML(cleanAuthor)}">
            <div style="flex: 1;">
                <div style="color: #38bdf8; font-weight: 600; margin-bottom: 2px;" class="clickable-username" data-username="${escapeHTML(cleanAuthor)}">@${escapeHTML(cleanAuthor)}</div>
                <div style="color: #e2e8f0; line-height: 1.3;">${escapeHTML(c.content)}</div>
                <div style="margin-top: 4px;">
                    <button type="button" class="btn-reply-toggle" style="background:none; border:none; color:#64748b; font-size:0.75rem; cursor:pointer; padding:0; width:auto; text-decoration:underline;">Reply</button>
                </div>
                <div class="reply-input-wrap hidden" style="display: flex; gap: 6px; margin-top: 6px;">
                    <input type="text" class="sub-reply-input" placeholder="Reply to @${escapeHTML(cleanAuthor)}..." style="margin-bottom: 0; padding: 6px; font-size: 0.8rem; flex: 1; background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 6px;" autocomplete="off">
                    <button type="button" class="submit-sub-reply-btn" style="width: auto; padding: 0 10px; font-size: 0.8rem;">Send</button>
                </div>
            </div>
        `;

        wrap.appendChild(commentBody);

        commentBody.querySelectorAll('.clickable-username').forEach(clickable => {
            clickable.addEventListener('click', (e) => {
                const u = e.currentTarget.getAttribute('data-username');
                if (u) window.openUserProfileCard(u);
            });
        });

        const replyToggle = commentBody.querySelector('.btn-reply-toggle');
        const replyWrap = commentBody.querySelector('.reply-input-wrap');
        if (replyToggle && replyWrap) {
            replyToggle.addEventListener('click', () => {
                if (!currentUser) {
                    alert("Please log in to reply.");
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    if (document.getElementById('auth-email')) document.getElementById('auth-email').focus();
                    return;
                }
                replyWrap.classList.toggle('hidden');
                if (!replyWrap.classList.contains('hidden')) replyWrap.querySelector('input').focus();
            });
        }

        const submitSubReplyBtn = commentBody.querySelector('.submit-sub-reply-btn');
        const subReplyInput = commentBody.querySelector('.sub-reply-input');
        if (submitSubReplyBtn && subReplyInput) {
            const handleSubReply = () => {
                submitComment(postId, cleanAuthor, subReplyInput.value, c.id);
                subReplyInput.value = '';
                replyWrap.classList.add('hidden');
            };
            submitSubReplyBtn.addEventListener('click', handleSubReply);
            subReplyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleSubReply(); }
            });
        }

        // Recursively call and append any child replies directly under this wrapper
        const children = repliesByParent[c.id] || [];
        if (children.length > 0) {
            const childContainer = document.createElement('div');
            childContainer.style.cssText = "display: flex; flex-direction: column; gap: 6px;";
            children.forEach(child => {
                childContainer.appendChild(renderCommentNode(child, true));
            });
            wrap.appendChild(childContainer);
        }

        return wrap;
    };

    topLevelComments.forEach(c => {
        listEl.appendChild(renderCommentNode(c, false));
    });
}

async function submitComment(postId, postAuthorUsername, content, parentId = null) {
    if (!currentUser) {
        alert("Please log in to comment.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (document.getElementById('auth-email')) document.getElementById('auth-email').focus();
        return;
    }
    if (isSuspended) {
        triggerSuspensionGate();
        return;
    }
    if (!content.trim()) return;

    const { error } = await db.from('post_comments').insert([{
        post_id: postId,
        author: currentUsername,
        content: content.trim(),
        parent_id: parentId
    }]);

    if (error) {
        alert(`Error posting comment: ${error.message}`);
        return;
    }

    // Immediately update the comment count button text on screen
    const countSpan = document.getElementById(`comment-count-${postId}`);
    if (countSpan) {
        const currentCount = parseInt(countSpan.textContent) || 0;
        const newCount = currentCount + 1;
        countSpan.textContent = newCount === 1 ? '1 Comment' : `${newCount} Comments`;
    }

    loadCommentsForPost(postId);

    if (postAuthorUsername && postAuthorUsername !== currentUsername.toLowerCase()) {
        const { data: profile } = await db.from('profiles').select('id').ilike('username', postAuthorUsername).maybeSingle();
        if (profile) {
            sendNotification(profile.id, 'comment_reply', postId, 'replied to your post.');
        }
    }
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
    if (typeof syncLiveThread === 'function') syncLiveThread(activeThread); // Join Realtime Chat Room
    if (!db || !forumFeed) return;

    const thisFetchId = ++currentFetchId;
    const requestedThread = activeThread;

    // UI UPGRADE: Skeleton Loaders
    forumFeed.innerHTML = Array(4).fill(`
        <div class="post-item skeleton-pulse" style="border: 1px solid #334155; opacity: 0.7;">
            <div style="width:40px; height:60px; background:#1e293b; border-radius:8px;"></div>
            <div style="flex:1;">
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <div style="width:26px; height:26px; border-radius:50%; background:#1e293b;"></div>
                    <div style="height:14px; width:120px; background:#1e293b; border-radius:4px; margin-top:5px;"></div>
                </div>
                <div style="height:12px; width:100%; background:#1e293b; border-radius:4px; margin-bottom:6px;"></div>
                <div style="height:12px; width:80%; background:#1e293b; border-radius:4px;"></div>
            </div>
        </div>
    `).join('');
    
    cachedPosts = [];
    postCacheMap.clear();

    let posts = [];
    let error = null;

    if (requestedThread === "Trending") {
        // Automatically compile recent posts (last 7 days) from all communities
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const trendRes = await db
            .from('Posts')
            .select('*')
            .gte('created_at', sevenDaysAgo)
            .order('id', { ascending: false })
            .limit(100);

        posts = trendRes.data || [];
        error = trendRes.error;

        // Fallback: If no posts exist in the last 7 days, retrieve all-time latest posts so the feed is never blank
        if (!error && posts.length === 0) {
            const fallbackRes = await db
                .from('Posts')
                .select('*')
                .order('id', { ascending: false })
                .limit(50);
            posts = fallbackRes.data || [];
            error = fallbackRes.error;
        }
    } else {
        const res = await db
            .from('Posts')
            .select('*')
            .eq('thread', requestedThread);
        posts = res.data;
        error = res.error;
    }

    if (thisFetchId !== currentFetchId || activeThread !== requestedThread) return;

    if (error) {
        forumFeed.innerHTML = `<div class="no-posts" style="color: #f87171;">Error loading posts: ${escapeHTML(error.message)}</div>`;
        return;
    }

    // BUG FIX: Fetch missing avatars for authors directly before rendering the feed
    if (posts && posts.length > 0) {
        const uniqueAuthors = Array.from(new Set(posts.map(p => (p.author || 'anonymous').toLowerCase().replace('@', ''))));
        const { data: authorProfiles } = await db.from('profiles').select('username, avatar_url').in('username', uniqueAuthors);
        (authorProfiles || []).forEach(profile => {
            if (profile.avatar_url) usernameAvatarMap.set(profile.username.toLowerCase(), profile.avatar_url);
        });
    }

    if (requestedThread === "Welcome & Security") {
        const welcomePost = getWelcomeSecurityPost();
        cachedPosts = posts && posts.length > 0 ? [welcomePost, ...posts] : [welcomePost];
    } else {
        cachedPosts = posts || [];
    }

    cachedPosts.forEach(p => postCacheMap.set(p.id, p));

    // Fetch globally synced community flairs
    threadFlairMap.clear();
    const { data: flairs } = await db
        .from('user_thread_flairs')
        .select('username, flair')
        .eq('thread_name', requestedThread);

    (flairs || []).forEach(f => {
        threadFlairMap.set(f.username.toLowerCase(), f.flair);
    });
    
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
        if (!telemetryDrawer || !telemetryDrawer.classList.contains('hidden')) {
            const elapsed = (Date.now() - pageLoadTime) / 1000;
            if (statTimer) statTimer.textContent = `${elapsed.toFixed(1)}s`;
        }
    }, 250);
}

let lastMouseMoveSample = 0;
window.addEventListener('mousemove', () => {
    const now = Date.now();
    if (now - lastMouseMoveSample > 100) {
        mouseMovementsRecorded++;
        lastMouseMoveSample = now;
    }
}, { passive: true });

window.addEventListener('touchstart', () => {
    mouseMovementsRecorded++;
}, { passive: true });

if (textBox) {
    textBox.addEventListener('focus', () => {
        if (!isTimerRunning) startCompositionTimer();
    });

    textBox.addEventListener('paste', () => {
        textWasPasted = true;
        if (statPaste) {
            statPaste.textContent = "TRUE";
            statPaste.className = "badge badge-yellow";
        }
        if (!isTimerRunning) startCompositionTimer();
        if (statKeys) {
            setTimeout(() => {
                statKeys.textContent = `${textBox.value.length} keys`;
            }, 0);
        }
    });

    textBox.addEventListener('keydown', (e) => {
        if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;
        if (!isTimerRunning) startCompositionTimer();
        
        const currentTime = Date.now();
        if (lastKeyTime !== null) {
            const gap = currentTime - lastKeyTime;
            if (keystrokeGaps.length < 100) keystrokeGaps.push(gap);
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
    const titleInput = document.getElementById('post-title-input');
    if (titleInput) titleInput.value = '';
    selectedPostPhotoFile = null;
    if (postImageFile) postImageFile.value = '';
    if (postPhotoPreviewBar) postPhotoPreviewBar.classList.add('hidden');
    if (statPaste) { statPaste.textContent = "FALSE"; statPaste.className = "badge badge-green"; }
    if (statTimer) statTimer.textContent = "0.0s"; 
    if (statKeys) statKeys.textContent = "0 keys";
    
    // Clear Poll Form
    const pollBuilder = document.getElementById('poll-builder-container');
    if (pollBuilder) {
        pollBuilder.classList.add('hidden');
        const list = document.getElementById('poll-options-list');
        if (list) {
            list.innerHTML = `
                <input type="text" class="poll-option-input" placeholder="Option 1" autocomplete="off" style="margin-bottom: 0; padding: 8px; font-size: 0.85rem;">
                <input type="text" class="poll-option-input" placeholder="Option 2" autocomplete="off" style="margin-bottom: 0; padding: 8px; font-size: 0.85rem;">
            `;
        }
    }
}

async function navigateToConversation(convId) {
    if (!currentUser || !db) return;
    if (notificationsModal) notificationsModal.classList.add('hidden');
    openMessagesModal();

    try {
        const { data: conv } = await db
            .from('conversations')
            .select('*')
            .eq('id', convId)
            .maybeSingle();

        if (!conv) return;

        if (conv.is_group) {
            selectConversation(conv.id, `Group: ${conv.name}`, null, null, true);
        } else {
            const { data: member } = await db
                .from('conversation_members')
                .select('user_id')
                .eq('conversation_id', convId)
                .neq('user_id', currentUser.id)
                .maybeSingle();

            let partnerId = member ? member.user_id : null;
            let partnerUsername = 'Chat';

            if (partnerId) {
                const { data: profile } = await db
                    .from('profiles')
                    .select('username')
                    .eq('id', partnerId)
                    .maybeSingle();
                if (profile?.username) partnerUsername = profile.username;
            }

            // Check true friendship status
            let isFriend = false;
            if (partnerId) {
                const { data: fr } = await db
                    .from('friendships')
                    .select('status')
                    .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${partnerId}),and(user_id.eq.${partnerId},friend_id.eq.${currentUser.id})`)
                    .eq('status', 'accepted')
                    .maybeSingle();
                isFriend = Boolean(fr);
            }

            selectConversation(conv.id, `@${partnerUsername}`, partnerId, partnerUsername, isFriend);
        }
    } catch (err) {
        console.warn("Could not open chat from notification:", err);
    }
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
        localStorage.setItem('forum_active_thread', activeThread);
        await loadForumPosts();
    }

    // Polls the DOM until the feed finishes rendering the post, then scrolls
    let attempts = 0;
    const scrollInterval = setInterval(() => {
        const targetEl = document.getElementById(`post-${postId}`);
        if (targetEl) {
            clearInterval(scrollInterval);
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetEl.style.boxShadow = '0 0 0 2px #38bdf8, 0 0 20px rgba(56, 189, 248, 0.5)';
            setTimeout(() => { targetEl.style.boxShadow = 'none'; }, 2000);
        } else if (attempts > 20) { 
            clearInterval(scrollInterval); // Give up after 2 seconds
        }
        attempts++;
    }, 100);
}


// --- SHARING LOGIC ---

async function incrementShareCount(postId) {
    if (!postId || isNaN(postId)) return;
    const post = postCacheMap.get(Number(postId));
    if (!post) return;

    post.shares = (Number(post.shares) || 0) + 1;
    const countSpan = document.getElementById(`share-count-${postId}`);
    if (countSpan) countSpan.textContent = post.shares;

    if (db) {
        await db.from('Posts').update({ shares: post.shares }).eq('id', postId);
    }
}

safeAddListener(closeShareModalBtn, 'click', () => { if (shareModal) shareModal.classList.add('hidden'); });
safeAddListener(shareModal, 'click', (e) => { if (e.target === shareModal) shareModal.classList.add('hidden'); });

async function populateShareConversations() {
    if (!shareDmSelect) return;
    shareDmSelect.innerHTML = '<option value="">Select a friend or group...</option>';
    if (internalShareBtn) internalShareBtn.disabled = true;

    if (currentUser && db) {
        const { data: memberships } = await db.from('conversation_members')
            .select('conversation_id')
            .eq('user_id', currentUser.id);

        if (memberships && memberships.length > 0) {
            const convIds = memberships.map(m => m.conversation_id);
            const { data: convs } = await db.from('conversations').select('id, name, is_group').in('id', convIds);
            const { data: allMembers } = await db.from('conversation_members').select('conversation_id, user_id').in('conversation_id', convIds).neq('user_id', currentUser.id);

            const partnerIds = Array.from(new Set((allMembers || []).map(m => m.user_id)));
            const { data: profiles } = partnerIds.length > 0 
                ? await db.from('profiles').select('id, username').in('id', partnerIds) 
                : { data: [] };

            (convs || []).forEach(conv => {
                let displayName = '';
                if (conv.is_group) {
                    displayName = `Group: ${conv.name}`;
                } else {
                    const partnerMem = (allMembers || []).find(m => m.conversation_id === conv.id);
                    const pProfile = partnerMem ? (profiles || []).find(p => p.id === partnerMem.user_id) : null;
                    displayName = pProfile ? `@${pProfile.username}` : 'Direct Message';
                }

                const option = document.createElement('option');
                option.value = conv.id;
                option.textContent = displayName;
                shareDmSelect.appendChild(option);
            });
            shareDmSelect.disabled = false;
        }
    } else {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "Log in to share via DM";
        shareDmSelect.appendChild(option);
        shareDmSelect.disabled = true;
    }
}

// Opens modal to share an individual post
async function openShareModal(postId) {
    currentShareType = 'post';
    currentShareTarget = postId;
    currentSharePostUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;

    if (shareModalTitle) shareModalTitle.textContent = '📤 Share Post';
    await populateShareConversations();
    if (shareModal) shareModal.classList.remove('hidden');
}

// Opens modal to share an entire thread
async function openShareThreadModal(threadName) {
    currentShareType = 'thread';
    currentShareTarget = threadName;
    currentSharePostUrl = `${window.location.origin}${window.location.pathname}?thread=${encodeURIComponent(threadName)}`;

    if (shareModalTitle) shareModalTitle.textContent = `📤 Share Thread: #${threadName}`;
    await populateShareConversations();
    if (shareModal) shareModal.classList.remove('hidden');
}

safeAddListener(shareThreadBtn, 'click', () => {
    openShareThreadModal(activeThread);
});

// 1. Native OS Sharing
safeAddListener(nativeShareBtn, 'click', async () => {
    if (navigator.share) {
        try {
            const shareText = currentShareType === 'thread'
                ? `Check out the #${currentShareTarget} thread on Turing's Gate!`
                : "Check out this post on Turing's Gate!";

            await navigator.share({
                title: "Turing's Gate",
                text: shareText,
                url: currentSharePostUrl
            });

            if (currentShareType === 'post') {
                await incrementShareCount(currentShareTarget);
            }
            if (shareModal) shareModal.classList.add('hidden');
        } catch (err) {
            console.log("Native share cancelled or failed", err);
        }
    } else {
        alert("Your device doesn't support the native share menu. Please copy the link instead.");
    }
});

// 2. Clipboard Copy
safeAddListener(copyLinkBtn, 'click', async () => {
    try {
        await navigator.clipboard.writeText(currentSharePostUrl);
        if (currentShareType === 'post') {
            await incrementShareCount(currentShareTarget);
        }
        const originalText = copyLinkBtn.textContent;
        copyLinkBtn.textContent = '✅ Link Copied!';
        setTimeout(() => { 
            copyLinkBtn.textContent = originalText; 
            if (shareModal) shareModal.classList.add('hidden'); 
        }, 1500);
    } catch (err) {
        alert("Failed to copy link.");
    }
});

safeAddListener(shareDmSelect, 'change', () => {
    if (internalShareBtn) internalShareBtn.disabled = !shareDmSelect.value;
});

// 3. Send via Internal DM
safeAddListener(internalShareBtn, 'click', async () => {
    const selectedConvId = shareDmSelect.value;
    if (!selectedConvId || !currentShareTarget || !currentUser) return;

    internalShareBtn.disabled = true;
    internalShareBtn.textContent = 'Sending...';

    const formattedLink = currentShareType === 'thread'
        ? `Check out the #${currentShareTarget} community: [Open Thread](${currentSharePostUrl})`
        : `Check out this post: [View Post](${currentSharePostUrl})`;

    const { error } = await db.from('chat_messages').insert([{
        conversation_id: selectedConvId,
        sender_id: currentUser.id,
        sender_username: currentUsername,
        content: formattedLink,
        pending_approval: false
    }]);

    if (error) {
        alert(`Error sharing: ${error.message}`);
        internalShareBtn.disabled = false;
        internalShareBtn.textContent = 'Send Message';
        return;
    }

    await db.from('chat_messages')
        .update({ is_read: false })
        .eq('conversation_id', selectedConvId)
        .neq('sender_id', currentUser.id);

    if (currentShareType === 'post') {
        await incrementShareCount(currentShareTarget);
    }

    alert(currentShareType === 'thread' ? "Thread shared in your messages!" : "Post shared in your messages!");
    if (shareModal) shareModal.classList.add('hidden');
    internalShareBtn.textContent = 'Send Message';
});

// --- FAB POST MODAL LOGIC & CLOSE FIX ---

function openFabModal(e) {
    if (!currentUser) { 
        alert("Please log in to post."); 
        if (authEmailInput) authEmailInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return; 
    }

    if (isSuspended) {
        triggerSuspensionGate();
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
        fabModalOverlay.classList.add('active');
    }

    // Default to activeThread unless on Trending (which cannot be posted to directly)
    if (threadSearchSelect) {
        threadSearchSelect.value = activeThread === 'Trending' ? 'New User Discussion' : activeThread;
    }
    if (threadSuggestDropdown) threadSuggestDropdown.classList.add('hidden');
}

function closeFabModal() {
    if (fabModalOverlay) {
        fabModalOverlay.classList.remove('active');
        fabModalOverlay.classList.add('hidden');
    }
}

safeAddListener(desktopFab, 'click', openFabModal);
safeAddListener(mobileFab, 'click', openFabModal);

safeAddListener(closeFabModalBtn, 'click', (e) => {
    e.stopPropagation();
    closeFabModal();
});

safeAddListener(fabModalOverlay, 'click', (e) => {
    if (e.target === fabModalOverlay) {
        closeFabModal();
    }
});

// Community Search Dropdown Logic
safeAddListener(threadSearchSelect, 'input', () => {
    if (!threadSuggestDropdown) return;
    const q = threadSearchSelect.value.trim().toLowerCase();
    threadSuggestDropdown.innerHTML = '';
    
    if (!q) {
        threadSuggestDropdown.classList.add('hidden');
        return;
    }

    // Filter out Trending so users cannot target it when creating a post
    const joined = Array.from(myJoinedThreadNames).filter(t => t !== 'Trending' && t.toLowerCase().includes(q));
    const others = allCloudThreads.map(t => t.name).filter(t => t !== 'Trending' && !myJoinedThreadNames.has(t) && t.toLowerCase().includes(q));
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
// Post Submission (Robust Paste Handling & Flag Reset)
safeAddListener(forumForm, 'submit', async (event) => {
    event.preventDefault(); 

    if (!currentUser || !currentUsername) {
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

    if (targetThread === "Trending") {
        alert("The #Trending feed is compiled automatically from top-rated posts. Please select a specific community to publish your post.");
        return;
    }

    if ((targetThread === "Update Thread" || targetThread === "Welcome & Security") && !isSiteAdmin()) {
        alert(`Permission Denied: Only @gemini can publish to the official "${targetThread}" section.`);
        return;
    }

    // Capture title & body text safely before any processing
    const postTitleInput = document.getElementById('post-title-input');
    const postTitle = postTitleInput ? postTitleInput.value.trim() : "";
    const postContent = textBox ? textBox.value.trim() : "";

    let pollOptionsJSON = null;
    let pollExpiresAt = null;

    const pollBuilder = document.getElementById('poll-builder-container');
    if (pollBuilder && !pollBuilder.classList.contains('hidden')) {
        const inputs = Array.from(document.querySelectorAll('.poll-option-input')).map(i => i.value.trim()).filter(v => v);
        if (inputs.length < 2) {
            alert("A poll requires at least 2 options.");
            return;
        }
        pollOptionsJSON = inputs;
        const days = parseInt(document.getElementById('poll-duration-select').value, 10);
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + days);
        pollExpiresAt = expDate.toISOString();
    }

    if (postContent.length < 2 && !selectedPostPhotoFile && !pollOptionsJSON && !postTitle) {
        alert("Please enter a message, attach a photo, or create a poll.");
        return;
    }

    // --- TELEMETRY EVALUATION ---
    let behaviorPoints = 0;
    const totalTimeElapsed = pageLoadTime ? (Date.now() - pageLoadTime) / 1000 : 0;

    // 1. Bot Trap / Honeypot field filled
    if (honeypotField && honeypotField.value.trim() !== "") {
        behaviorPoints += 5;
    }

    // 2. Clipboard Paste (+1 point only, exempted from superhuman speed check)
    if (textWasPasted) {
        behaviorPoints += 1;
    } else if (totalTimeElapsed > 0 && totalTimeElapsed < 0.5 && postContent.length > 60) {
        // 3. Superhuman speed check (>60 characters in under 0.5s without pasting)
        behaviorPoints += 1;
    }

    // 4. Rapid burst posting (<4 seconds between forum posts)
    const now = Date.now();
    if (lastPostTimestamp > 0 && (now - lastPostTimestamp) < 4000) {
        behaviorPoints += 1;
    }

    // Update suspicion score
    if (behaviorPoints > 0) {
        suspicionScore = Math.min(5, suspicionScore + behaviorPoints);
        updateSuspicionUI();

        if (currentUser && db) {
            try {
                await db.from('profiles').update({ suspicion_score: suspicionScore }).eq('id', currentUser.id);
            } catch (err) {
                console.warn("Suspicion update error:", err);
            }
        }

        // Suspend and halt ONLY if threshold (5) is reached
        if (suspicionScore >= 5) {
            resetTelemetryConsole(); 
            triggerSuspensionGate();
            return;
        }
    }

    const submitBtn = document.getElementById('forum-submit-btn');
    if (submitBtn) { 
        submitBtn.disabled = true; 
        submitBtn.textContent = 'Publishing...'; 
    }

    let postImageUrl = null;
    try {
        if (selectedPostPhotoFile) {
            const compressedPhoto = await compressImage(selectedPostPhotoFile, 1200, 0.75);
            const fileExt = compressedPhoto.name.split('.').pop() || (compressedPhoto.type === 'image/gif' ? 'gif' : 'jpeg');
            const filePath = `forum_posts/${currentUser.id}_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await db.storage.from('chat-images').upload(filePath, compressedPhoto);

            if (!uploadError) {
                const { data: publicUrlData } = db.storage.from('chat-images').getPublicUrl(filePath);
                postImageUrl = publicUrlData.publicUrl;
            }
        }

        // Build payload with optional title
        const insertPayload = { 
            thread: targetThread, 
            author: currentUsername, 
            content: postContent,
            image_url: postImageUrl,
            poll_options: pollOptionsJSON,
            poll_expires_at: pollExpiresAt
        };
        if (postTitle) insertPayload.title = postTitle;

        // Insert into database with fallback in case 'title' column has not yet been added in Supabase
        let { error } = await db.from('Posts').insert([insertPayload]);
        if (error && error.message && error.message.toLowerCase().includes('title')) {
            delete insertPayload.title;
            insertPayload.content = postTitle ? `### ${postTitle}\n\n${postContent}` : postContent;
            const retry = await db.from('Posts').insert([insertPayload]);
            error = retry.error;
        }
        
        if (error) {
            alert(`Database Error: ${error.message}`);
            return;
        }

        lastPostTimestamp = Date.now();

        if (targetThread === "Update Thread") {
            await loadProminentUpdates();
        } else {
            activeThread = targetThread;
            localStorage.setItem('forum_active_thread', activeThread);
            await loadForumPosts();
        }

        closeFabModal();
    } catch (err) {
        alert(`An error occurred while posting: ${err.message}`);
    } finally {
        // ALWAYS reset telemetry flags so textWasPasted is reset to FALSE
        resetTelemetryConsole();

        if (submitBtn) { 
            submitBtn.disabled = false; 
            submitBtn.textContent = 'Publish Post'; 
        }
    }
});

// --- THREAD LINK NAVIGATION (T/Thread_Name) ---
document.addEventListener('click', async (e) => {
    const threadLink = e.target.closest('.clickable-thread');
    if (threadLink) {
        const targetThread = threadLink.getAttribute('data-thread');
        if (!targetThread) return;

        // 1. Close active modals if clicked from a DM, Profile, or Fab modal
        if (typeof closeMessagesModal === 'function') closeMessagesModal();
        if (typeof closeFabModal === 'function') closeFabModal();
        if (dmModal) dmModal.classList.add('hidden');
        if (userProfileModal) userProfileModal.classList.add('hidden');

        // 2. Switch thread directly if not already active
        if (activeThread !== targetThread) {
            activeThread = targetThread;
            localStorage.setItem('forum_active_thread', activeThread);
            cachedPosts = [];
            postCacheMap.clear();
            if (forumFeed) forumFeed.innerHTML = '<div class="no-posts">Loading posts...</div>';

            renderJoinedThreadsSidebar();
            updateThreadControlsUI();
            await loadForumPosts();
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// --- THREAD BANNER LOGIC ---
function renderThreadBanner() {
    const container = document.getElementById('thread-banner-container');
    const img = document.getElementById('thread-banner-img');
    if (!container || !img) return;

    const threadData = allCloudThreads.find(t => t.name === activeThread);
    
    if (threadData && threadData.banner_url) {
        if (img.src !== threadData.banner_url) {
            img.src = threadData.banner_url;
        }
        container.style.display = 'block'; // Force visible
    } else {
        container.style.display = 'none'; // Force hide
        img.src = '';
    }
}

safeAddListener(document.getElementById('banner-upload-input'), 'change', async (e) => {
    const rawFile = e.target.files[0];
    if (!rawFile || !currentUser) return;

    const bannerBtn = document.getElementById('set-banner-btn');
    if (bannerBtn) { bannerBtn.disabled = true; bannerBtn.textContent = '⏳ Uploading...'; }

    try {
        // Compress banner, skips if GIF
        const file = await compressImage(rawFile, 1920, 0.80);
        
        const fileExt = file.name.split('.').pop() || (file.type === 'image/gif' ? 'gif' : 'jpeg');
        const safeThreadName = activeThread.replace(/[^a-zA-Z0-9]/g, '_');
        const filePath = `banners/${safeThreadName}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await db.storage
            .from('chat-images')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = db.storage.from('chat-images').getPublicUrl(filePath);
        const bannerUrl = publicUrlData.publicUrl;

        // Force select() so we know if a row was actually updated
        const { error: updateError, data: updateData } = await db
            .from('forum_threads')
            .update({ banner_url: bannerUrl })
            .eq('name', activeThread)
            .select();

        if (updateError) throw updateError;

        // If the DB returned 0 updated rows, the thread didn't exist in the DB yet. Insert it.
        if (!updateData || updateData.length === 0) {
            const { error: insertErr } = await db.from('forum_threads').insert([{
                name: activeThread,
                banner_url: bannerUrl,
                created_by: currentUser.id,
                owner_username: SITE_ADMIN_USERNAME,
                is_private: false
            }]);
            
            if (insertErr) throw new Error("Database blocked row creation: " + insertErr.message);
        }

        // UPDATE LOCAL MEMORY DIRECTLY AND PERMANENTLY
        let localThreadIndex = allCloudThreads.findIndex(t => t.name === activeThread);
        if (localThreadIndex !== -1) {
            allCloudThreads[localThreadIndex].banner_url = bannerUrl;
        } else {
            allCloudThreads.push({ name: activeThread, banner_url: bannerUrl });
        }

        renderThreadBanner();
        alert('Community banner updated successfully!');
        
        // Silently sync the cloud in the background WITHOUT wiping memory
        db.from('forum_threads').select('*').order('id', { ascending: true })
            .then(({ data }) => {
                if (data && data.length > 0) {
                    const defaults = [
                        { name: "Welcome & Security", owner_username: "gemini" },
                        { name: "Update Thread", owner_username: "gemini" },
                        { name: "New User Discussion", owner_username: "gemini" }
                    ];
                    let freshMerge = [...data];
                    defaults.forEach(def => {
                        if (!freshMerge.find(t => t.name === def.name)) freshMerge.push(def);
                    });
                    allCloudThreads = freshMerge;
                }
            });

    } catch (err) {
        alert(`Error uploading banner: ${err.message}`);
    } finally {
        if (bannerBtn) { bannerBtn.disabled = false; bannerBtn.textContent = '🖼️️ Set Banner'; }
        e.target.value = ''; // Reset file input
    }
});


// --- LIVE USER COUNT TRACKER ---
async function initLiveUserCount() {
    if (!db) return;
    const countEl = document.getElementById('live-user-count');
    if (!countEl) return;

    const updateCount = async () => {
        // { head: true } asks Supabase only for the count number, saving massive bandwidth
        const { count, error } = await db.from('profiles').select('*', { count: 'exact', head: true });
        if (!error && count !== null) {
            countEl.textContent = count.toLocaleString() + ' Members';
        }
    };

    // 1. Initial fetch on page load
    await updateCount();

    // 2. Subscribe to real-time additions or deletions in the profiles table
    db.channel('live-user-count')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, updateCount)
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'profiles' }, updateCount)
        .subscribe();
}


// --- WEB OF TRUST: INVITES LOGIC ---
async function loadUserInvites() {
    const container = document.getElementById('invites-container');
    const btn = document.getElementById('generate-invite-btn');
    if (!container || !btn || !currentUser || !db) return;

    const { data: invites, error } = await db.from('invitations')
        .select('*')
        .eq('inviter_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn("Could not load invitations:", error.message);
        return;
    }

    container.innerHTML = '';
    const allGeneratedInvites = invites || [];
    
    // Quota counts EVERY invite ever generated (including hidden ones)
    const totalLifetimeCreated = allGeneratedInvites.length;
    const remainingQuota = Math.max(0, 3 - totalLifetimeCreated);
    const isAdmin = isSiteAdmin();

    if (!isAdmin && totalLifetimeCreated >= 3) {
        btn.style.display = 'none';
    } else {
        btn.style.display = 'block';
        if (isAdmin) {
            btn.textContent = `+ Generate Invite Link (Unlimited Admin)`;
        } else {
            btn.textContent = `+ Generate Invite Link (${remainingQuota} remaining)`;
        }
    }

    // Only render invites that have not been cleared by the user
    const visibleInvites = allGeneratedInvites.filter(inv => !inv.is_hidden);

    if (visibleInvites.length === 0) {
        container.innerHTML = '<div style="font-size:0.8rem; color:#64748b;">No active codes displayed.</div>';
        return;
    }

    visibleInvites.forEach(inv => {
        const div = document.createElement('div');
        div.className = 'invite-code-box';
        const isClaimed = inv.status === 'claimed';

        div.innerHTML = `
            <span style="opacity: ${isClaimed ? '0.5' : '1'}; text-decoration: ${isClaimed ? 'line-through' : 'none'}; font-weight: 600;">${escapeHTML(inv.code)}</span>
            <div style="display: flex; gap: 6px; align-items: center;">
                <button type="button" class="btn-copy-invite" ${isClaimed ? 'disabled style="background:#334155; color:#94a3b8; cursor:default;"' : ''}>
                    ${isClaimed ? 'Claimed' : 'Copy'}
                </button>
                <button type="button" class="btn-clear-invite" title="Clear code from display">
                    ✕
                </button>
            </div>
        `;
        
        // Copy link action for unclaimed invites
        if (!isClaimed) {
            const copyBtn = div.querySelector('.btn-copy-invite');
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(inv.code);
                copyBtn.textContent = 'Copied!';
                setTimeout(() => copyBtn.textContent = 'Copy', 2000);
            });
        }

        // Soft-delete action: hides code from dashboard without refunding quota
        const clearBtn = div.querySelector('.btn-clear-invite');
        clearBtn.addEventListener('click', async () => {
            if (!confirm("Remove this code from your list? (Note: your 3-invite quota will not be refunded)")) return;

            clearBtn.disabled = true;
            clearBtn.textContent = '...';

            const { error: updateErr } = await db
                .from('invitations')
                .update({ is_hidden: true })
                .eq('id', inv.id);

            if (updateErr) {
                alert(`Could not clear code: ${updateErr.message}`);
                clearBtn.disabled = false;
                clearBtn.textContent = '✕';
                return;
            }

            await loadUserInvites();
        });

        container.appendChild(div);
    });
}

safeAddListener(document.getElementById('generate-invite-btn'), 'click', async () => {
    if (!currentUser || !db) return;
    const btn = document.getElementById('generate-invite-btn');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    // Generate a random 8-character hex code
    const newCode = 'TG-' + Math.random().toString(16).substr(2, 8).toUpperCase();

    const { error } = await db.from('invitations').insert([{
        inviter_id: currentUser.id,
        code: newCode,
        status: 'pending'
    }]);

    if (error) {
        alert("Could not generate invite: " + error.message);
    }
    
    btn.disabled = false;
    await loadUserInvites();
});


// --- SYNCHRONOUS LIVE EVENTS LOGIC ---
let liveThreadSubscription = null;
const liveChatModal = document.getElementById('live-chat-modal');
const liveChatInput = document.getElementById('live-chat-input');
const liveChatHistory = document.getElementById('live-chat-history');

safeAddListener(document.getElementById('open-live-chat-btn'), 'click', () => {
    if (!currentUser) {
        alert("Please log in to join the live chat.");
        return;
    }
    
    const role = getThreadRole(activeThread);
    const canBypassLock = (role === 'Owner' || role === 'Site Admin');

    const chatForm = document.getElementById('live-chat-form');
    const lockedMsg = document.getElementById('live-chat-locked-msg');

    // If chat is locked AND the user isn't an admin/owner, hide the form and show the lock
    if (!window.currentLiveChatIsOpen && !canBypassLock) {
        if (chatForm) chatForm.classList.add('hidden');
        if (lockedMsg) lockedMsg.classList.remove('hidden');
    } else {
        // Otherwise, show the typing bar
        if (chatForm) chatForm.classList.remove('hidden');
        if (lockedMsg) lockedMsg.classList.add('hidden');
    }

    document.getElementById('live-chat-thread-name').textContent = activeThread;
    
    // Hide floating telemetry so it never blocks the Send button or input
    const telemetryHud = document.getElementById('floating-telemetry');
    if (telemetryHud) telemetryHud.style.display = 'none';

    liveChatModal.classList.remove('hidden');
    
    // Only auto-focus on desktop to avoid triggering the mobile keyboard on modal open
    if ((window.currentLiveChatIsOpen || canBypassLock) && window.innerWidth > 768) {
        setTimeout(() => { if (liveChatInput) liveChatInput.focus(); }, 100);
    }
    
    scrollToBottomLiveChat();
});

function closeLiveChatModal() {
    if (liveChatModal) liveChatModal.classList.add('hidden');
    // Restore floating telemetry monitor
    const telemetryHud = document.getElementById('floating-telemetry');
    if (telemetryHud) telemetryHud.style.display = 'flex';
}

safeAddListener(document.getElementById('close-live-chat-btn'), 'click', closeLiveChatModal);

// Close by tapping the dark backdrop overlay
safeAddListener(liveChatModal, 'click', (e) => {
    if (e.target === liveChatModal) {
        closeLiveChatModal();
    }
});

function scrollToBottomLiveChat() {
    if (liveChatHistory) {
        liveChatHistory.scrollTop = liveChatHistory.scrollHeight;
    }
}

function renderLiveChatBubble(username, avatarUrl, message) {
    if (!liveChatHistory) return;
    const isMine = username === currentUsername;
    const div = document.createElement('div');
    div.style.cssText = `display: flex; gap: 8px; margin-bottom: 6px; align-items: flex-start; justify-content: ${isMine ? 'flex-end' : 'flex-start'};`;
    
    const avatarHtml = `<img src="${avatarUrl || DEFAULT_AVATAR}" style="width:24px; height:24px; border-radius:50%; object-fit:cover;">`;
    const bubbleHtml = `
        <div style="background: ${isMine ? '#10b981' : '#1e293b'}; color: ${isMine ? '#0f172a' : '#e2e8f0'}; padding: 6px 10px; border-radius: 8px; font-size: 0.85rem; max-width: 85%; word-wrap: break-word;">
            ${!isMine ? `<div style="font-size:0.7rem; font-weight:bold; color:#38bdf8; margin-bottom:2px;">@${escapeHTML(username)}</div>` : ''}
            ${escapeHTML(message)}
        </div>
    `;

    div.innerHTML = isMine ? bubbleHtml + avatarHtml : avatarHtml + bubbleHtml;
    liveChatHistory.appendChild(div);
    scrollToBottomLiveChat();
}

async function syncLiveThread(threadName) {
    if (!db) return;
    
    // Cleanup old subscription to prevent dual-broadcasting
    if (liveThreadSubscription) {
        await liveThreadSubscription.unsubscribe();
        db.removeChannel(liveThreadSubscription);
    }
    
    const safeName = threadName.replace(/[^a-zA-Z0-9]/g, '_');
    const userIdentifier = currentUsername || 'guest_' + Math.floor(Math.random() * 10000);

    liveThreadSubscription = db.channel(`live_watercooler_${safeName}`, {
        config: {
            presence: { key: userIdentifier },
            broadcast: { self: true } // receive our own messages back to render them
        }
    });

    liveThreadSubscription
        .on('presence', { event: 'sync' }, () => {
            const state = liveThreadSubscription.presenceState();
            const count = Object.keys(state).length;
            const badge = document.getElementById('live-viewers-badge');
            const modalBadge = document.getElementById('live-chat-viewer-count');
            if (badge) badge.textContent = count;
            if (modalBadge) modalBadge.textContent = count;
        })
        .on('broadcast', { event: 'chat_msg' }, (payload) => {
            renderLiveChatBubble(payload.payload.username, payload.payload.avatar, payload.payload.text);
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && currentUser) {
                await liveThreadSubscription.track({ online_at: new Date().toISOString() });
            }
        });
        
    // Clear ephemeral history visually when switching threads
    if (liveChatHistory) {
        liveChatHistory.innerHTML = '<div class="no-posts" style="font-size: 0.8rem;">Welcome to the ephemeral live chat. Messages are not saved.</div>';
    }
}

safeAddListener(document.getElementById('live-chat-form'), 'submit', (e) => {
    e.preventDefault();
    const text = liveChatInput.value.trim();
    if (!text || !liveThreadSubscription || !currentUser) return;

    const role = getThreadRole(activeThread);
    if (!window.currentLiveChatIsOpen && role !== 'Owner' && role !== 'Site Admin') {
        alert("Chat is currently locked. Message blocked.");
        return;
    }

    // Send payload via Supabase Realtime (No database row gets written)
    liveThreadSubscription.send({
        type: 'broadcast',
        event: 'chat_msg',
        payload: {
            username: currentUsername,
            avatar: currentAvatarUrl,
            text: text
        }
    });

    liveChatInput.value = '';
});
// --- POST EDITING & HISTORY ENGINE ---
const postEditModal = document.getElementById('post-edit-modal');
const editPostIdInput = document.getElementById('edit-post-id');
const editPostTextInput = document.getElementById('edit-post-text');

function openPostEditModal(post) {
    if (!currentUser) return;
    editPostIdInput.value = post.id;
    // Strip markdown formatting like `<br>` back to standard newlines for the editor
    editPostTextInput.value = (post.content || '').replace(/<br>/g, '\n'); 
    postEditModal.classList.remove('hidden');
}

safeAddListener(document.getElementById('close-post-edit-btn'), 'click', () => {
    postEditModal.classList.add('hidden');
});

safeAddListener(document.getElementById('post-edit-form'), 'submit', async (e) => {
    e.preventDefault();
    if (!currentUser || !db) return;
    
    const submitBtn = document.getElementById('submit-edit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    const postId = Number(editPostIdInput.value);
    const newContent = editPostTextInput.value.trim();
    const post = postCacheMap.get(postId);

    if (post && newContent !== post.content) {
        // Log to history table
        await db.from('post_edits').insert([{
            post_id: postId,
            old_content: post.content,
            new_content: newContent
        }]);

        // Update main post
        const { error } = await db.from('Posts').update({
            content: newContent,
            is_edited: true
        }).eq('id', postId);

        if (!error) {
            post.content = newContent;
            post.is_edited = true;
            renderCurrentFeed();
        } else {
            alert("Error editing post: " + error.message);
        }
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Changes';
    postEditModal.classList.add('hidden');
});

async function loadEditHistory(postId) {
    const historyModal = document.getElementById('edit-history-modal');
    const historyList = document.getElementById('edit-history-list');
    if (!db || !historyModal || !historyList) return;

    historyModal.classList.remove('hidden');
    historyList.innerHTML = '<div class="no-posts">Loading history...</div>';

    const { data: edits, error } = await db.from('post_edits')
        .select('*')
        .eq('post_id', postId)
        .order('edited_at', { ascending: false });

    if (error || !edits || edits.length === 0) {
        historyList.innerHTML = '<div class="no-posts">No edit history found.</div>';
        return;
    }

    historyList.innerHTML = '';
    edits.forEach(edit => {
        const d = new Date(edit.edited_at).toLocaleString();
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <span class="history-time">Prior to ${d}</span>
            <div>${renderFormattedContent(edit.old_content)}</div>
        `;
        historyList.appendChild(item);
    });
}

safeAddListener(document.getElementById('close-edit-history-btn'), 'click', () => {
    document.getElementById('edit-history-modal').classList.add('hidden');
});

// --- LIVE CHAT SCHEDULING LOGIC ---
const chatConfigModal = document.getElementById('chat-config-modal');
const scheduleCheckbox = document.getElementById('chat-schedule-enable-chk');
const scheduleOptionsBox = document.getElementById('schedule-options');

function evaluateLiveChatStatus(threadData) {
    if (!threadData) return true;
    if (threadData.live_chat_locked) return false;
    
    const sched = threadData.live_chat_schedule;
    if (!sched || !sched.enabled) return true;

    try {
        // Evaluate current time against target timezone
        const options = { timeZone: sched.timezone || 'America/New_York', hour12: false, weekday: 'short', hour: 'numeric', minute: 'numeric' };
        const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(new Date());
        
        const day = parts.find(p => p.type === 'weekday').value;
        const hrStr = parts.find(p => p.type === 'hour').value;
        const minStr = parts.find(p => p.type === 'minute').value;
        
        // Pad single digits (e.g. 9:00 -> 09:00) for string comparison
        const currentStr = `${hrStr.padStart(2, '0')}:${minStr.padStart(2, '0')}`;

        if (!sched.days.includes(day)) return false;
        if (currentStr >= sched.startTime && currentStr <= sched.endTime) return true;
        return false;
    } catch (e) {
        console.warn("Schedule evaluation error", e);
        return true; // fail open
    }
}


// Configuration Modal UI
safeAddListener(scheduleCheckbox, 'change', (e) => {
    scheduleOptionsBox.style.opacity = e.target.checked ? '1' : '0.5';
    scheduleOptionsBox.style.pointerEvents = e.target.checked ? 'auto' : 'none';
});

safeAddListener(document.getElementById('manage-chat-btn'), 'click', () => {
    const tData = allCloudThreads.find(t => t.name === activeThread);
    if (!tData) return;

    document.getElementById('chat-manual-lock-chk').checked = !!tData.live_chat_locked;
    
    const sched = tData.live_chat_schedule || { enabled: false, days: [], startTime: "19:00", endTime: "20:00", timezone: "America/Toronto" };
    scheduleCheckbox.checked = sched.enabled;
    scheduleCheckbox.dispatchEvent(new Event('change'));

    document.querySelectorAll('.sched-day').forEach(chk => {
        chk.checked = sched.days.includes(chk.value);
    });
    
    document.getElementById('chat-sched-start').value = sched.startTime || "19:00";
    document.getElementById('chat-sched-end').value = sched.endTime || "20:00";
    document.getElementById('chat-sched-tz').value = sched.timezone || "America/Toronto";

    chatConfigModal.classList.remove('hidden');
});

safeAddListener(document.getElementById('close-chat-config-btn'), 'click', () => {
    chatConfigModal.classList.add('hidden');
});

safeAddListener(document.getElementById('chat-config-form'), 'submit', async (e) => {
    e.preventDefault();
    if (!db || !currentUser) return;

    const btn = document.getElementById('save-chat-settings-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const isLocked = document.getElementById('chat-manual-lock-chk').checked;
    const schedEnabled = scheduleCheckbox.checked;
    
    const selectedDays = Array.from(document.querySelectorAll('.sched-day:checked')).map(chk => chk.value);
    const scheduleJSON = {
        enabled: schedEnabled,
        days: selectedDays,
        startTime: document.getElementById('chat-sched-start').value,
        endTime: document.getElementById('chat-sched-end').value,
        timezone: document.getElementById('chat-sched-tz').value
    };

    const { error } = await db.from('forum_threads').update({
        live_chat_locked: isLocked,
        live_chat_schedule: scheduleJSON
    }).eq('name', activeThread);

    if (!error) {
        // Update local memory so we don't have to fully re-fetch
        let localThread = allCloudThreads.find(t => t.name === activeThread);
        if (localThread) {
            localThread.live_chat_locked = isLocked;
            localThread.live_chat_schedule = scheduleJSON;
        }
        updateThreadControlsUI(); // Instantly update the button color
        chatConfigModal.classList.add('hidden');
    } else {
        alert("Failed to update chat settings: " + error.message);
    }

    btn.disabled = false;
    btn.textContent = 'Save Settings';
});

// --- POLL & PINNING ENGINE ---

document.addEventListener('click', (e) => {
    // Toggle the UI for building a poll
    if (e.target.id === 'toggle-poll-btn') {
        const pollBuilder = document.getElementById('poll-builder-container');
        if (pollBuilder) pollBuilder.classList.toggle('hidden');
    }
    
    // Add additional option to the poll builder
    if (e.target.id === 'add-poll-option-btn') {
        const list = document.getElementById('poll-options-list');
        if (list && list.children.length >= 6) {
            alert("Maximum 6 options allowed.");
            return;
        }
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'poll-option-input';
        input.placeholder = `Option ${list.children.length + 1}`;
        input.autocomplete = 'off';
        input.style.cssText = 'margin-bottom: 0; padding: 8px; font-size: 0.85rem; margin-top: 8px;';
        list.appendChild(input);
    }
});

async function togglePinPost(post) {
    if (!currentUser || !db) return;
    const newPinState = !post.is_pinned;
    
    const { error } = await db.from('Posts').update({ is_pinned: newPinState }).eq('id', post.id);
    if (error) {
        alert("Error updating pin: " + error.message);
        return;
    }
    
    post.is_pinned = newPinState;
    renderCurrentFeed();
}

async function submitPollVote(postId, optIdx) {
    if (!currentUser || !currentUsername || !db) {
        alert("Please log in to vote.");
        return;
    }
    const post = postCacheMap.get(Number(postId));
    if (!post) return;

    // Grab current votes or init fresh
    const votes = post.poll_votes || {};
    if (votes[currentUsername.toLowerCase()] !== undefined) {
        return; // Security: User already voted
    }
    
    // Record their vote
    votes[currentUsername.toLowerCase()] = Number(optIdx);

    const { error } = await db.from('Posts').update({ poll_votes: votes }).eq('id', postId);
    if (error) {
        alert("Failed to record vote: " + error.message);
        return;
    }

    // Refresh UI instantly
    post.poll_votes = votes;
    renderCurrentFeed();
}
