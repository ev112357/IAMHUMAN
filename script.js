// Favicon setup: ensure fallback link exists if missing
function setupFavicon() {
    try {
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/x-icon';
            link.href = '/favicon.ico?v=3';
            document.head.appendChild(link);
        }
    } catch (e) {}
}
setupFavicon();


// Supabase database connection and initialization
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


// --- PERSISTENT SHARED AUDIO ENGINE & SYNTHESIZER ---
let sharedAudioCtx = null;
function getSharedAudioContext() {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            sharedAudioCtx = new AudioCtx();
        }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
}


function unlockAudioEngine() {
    const ctx = getSharedAudioContext();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }
}
window.addEventListener('click', unlockAudioEngine, { passive: true });
window.addEventListener('touchstart', unlockAudioEngine, { passive: true });
window.addEventListener('keydown', unlockAudioEngine, { passive: true });


// --- ON-DEMAND PRIVACY MICROPHONE STREAM (ACTIVE ONLY DURING CALLS) ---
async function getMicrophoneStream() {
    const audioOpts = {
        echoCancellation: Boolean(userAudioSettings.echoCancellation),
        noiseSuppression: Boolean(userAudioSettings.noiseSuppression),
        autoGainControl: Boolean(userAudioSettings.autoGainControl)
    };
    if (userAudioSettings.highFidelity) {
        audioOpts.sampleRate = 48000;
        audioOpts.channelCount = 2;
    }
    return await navigator.mediaDevices.getUserMedia({
        audio: audioOpts,
        video: false
    });
}


function playTechChirp(type = 'info') {
    // Mute sound if user toggled sound off in settings (popups continue to show)
    if (typeof userNotifPrefs !== 'undefined' && userNotifPrefs && !userNotifPrefs.sounds) {
        return;
    }
    try {
        const ctx = getSharedAudioContext();
        if (!ctx) return;


        const play = () => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const now = ctx.currentTime;


            if (type === 'success') {
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
            } else if (type === 'error') {
                osc.frequency.setValueAtTime(329.63, now); // E4
                osc.frequency.exponentialRampToValueAtTime(220, now + 0.15); // A3
            } else if (type === 'pop') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(950, now);
                osc.frequency.exponentialRampToValueAtTime(280, now + 0.12);
            } else {
                osc.frequency.setValueAtTime(440, now); // A4
                osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
            }


            // Audible volume (0.28)
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);


            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(now + 0.19);
        };


        if (ctx.state === 'suspended') {
            ctx.resume().then(play).catch(play);
        } else {
            play();
        }
    } catch (e) {
        console.warn("Chirp notice:", e);
    }
}


function showToast({ title = 'Notification', message = '', type = 'info', icon = '◈', onClick = null, duration = 4000, force = false }) {
    if (!force && typeof userNotifPrefs !== 'undefined' && userNotifPrefs && !userNotifPrefs.allEnabled) return;


    let container = document.getElementById('tech-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'tech-toast-container';
        container.className = 'tech-toast-container';
        document.body.appendChild(container);
    }


    if (force || (typeof userNotifPrefs === 'undefined' || !userNotifPrefs || userNotifPrefs.sounds)) {
        playTechChirp(type);
    }
    if (navigator.vibrate) {
        try { navigator.vibrate(type === 'error' ? [80, 50, 80] : [60]); } catch (e) {}
    }


    const toast = document.createElement('div');
    toast.className = `tech-toast ${type === 'success' ? 'toast-success' : (type === 'error' ? 'toast-error' : '')}`;


    toast.innerHTML = `
        <span class="tech-toast-icon">${icon}</span>
        <div class="tech-toast-body">
            <div class="tech-toast-title">${escapeHTML(title)}</div>
            <div class="tech-toast-msg">${escapeHTML(message)}</div>
        </div>
        <div class="tech-toast-progress" style="animation-duration: ${duration}ms;"></div>
    `;


    const closeToast = () => {
        if (toast.classList.contains('closing')) return;
        toast.classList.add('closing');
        setTimeout(() => toast.remove(), 300);
    };


    if (onClick) {
        toast.addEventListener('click', (e) => {
            onClick(e);
            closeToast();
        });
    } else {
        toast.addEventListener('click', closeToast);
    }


    setTimeout(closeToast, duration);
    container.appendChild(toast);
}


// --- GLOBAL CYBERPUNK POPUP INTERCEPTOR (REPLACES GENERIC BROWSER ALERTS) ---
window.alert = function(msg) {
    if (!msg) return;
    const str = String(msg);
    let title = "System Notification";
    let icon = "✦";
    let type = "info";


    const lower = str.toLowerCase();
    if (lower.includes("error") || lower.includes("failed") || lower.includes("blocked") || lower.includes("denied") || lower.includes("must be") || lower.includes("please") || lower.includes("security check") || lower.includes("invalid") || lower.includes("already taken") || lower.includes("incorrect")) {
        type = "error";
        icon = "▵";
        title = "Security Clearance Alert";
        if (lower.includes("security check") || lower.includes("captcha") || lower.includes("turnstile")) {
            title = "Perimeter Verification";
            icon = "◈";
        } else if (lower.includes("username") || lower.includes("password") || lower.includes("login") || lower.includes("sign up")) {
            title = "Authentication Gate";
            icon = "◈";
        } else if (lower.includes("call") || lower.includes("microphone") || lower.includes("audio")) {
            title = "Comms Protocol";
            icon = "◈";
        }
    } else if (lower.includes("success") || lower.includes("copied") || lower.includes("updated") || lower.includes("welcome")) {
        type = "success";
        icon = "✓";
        title = "Confirmed";
    }


    showToast({
        title: title,
        message: str,
        type: type,
        icon: icon,
        duration: 4500,
        force: true
    });
};
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


// Settings Notification Tab Elements
const tabBtnSettingsNotifs = document.getElementById('tab-btn-settings-notifs');
const paneSettingsNotifs = document.getElementById('pane-settings-notifs');
const notifMasterToggleChk = document.getElementById('notif-master-toggle-chk');
const granularNotifOptions = document.getElementById('granular-notif-options');
const notifToggleMessages = document.getElementById('notif-toggle-messages');
const notifToggleCalls = document.getElementById('notif-toggle-calls');
const notifToggleUpvotes = document.getElementById('notif-toggle-upvotes');
const notifToggleReplies = document.getElementById('notif-toggle-replies');
const notifToggleSounds = document.getElementById('notif-toggle-sounds');


// Notification Preferences
let userNotifPrefs = {
    allEnabled: true,
    messages: true,
    calls: true,
    upvotes: true,
    replies: true,
    sounds: true
};


function getNotifPrefsKey() {
    return currentUser ? `user_notif_prefs_${currentUser.id}` : 'user_notif_prefs_guest';
}


function loadNotificationPreferences() {
    try {
        const saved = localStorage.getItem(getNotifPrefsKey());
        if (saved) {
            userNotifPrefs = { ...userNotifPrefs, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.warn("Notice loading notification preferences:", e);
    }
    syncNotificationSettingsUI();
}


function saveNotificationPreferences() {
    try {
        localStorage.setItem(getNotifPrefsKey(), JSON.stringify(userNotifPrefs));
    } catch (e) {}
}


function syncNotificationSettingsUI() {
    if (notifMasterToggleChk) notifMasterToggleChk.checked = userNotifPrefs.allEnabled;
    if (granularNotifOptions) {
        granularNotifOptions.style.opacity = userNotifPrefs.allEnabled ? '1' : '0.4';
        granularNotifOptions.style.pointerEvents = userNotifPrefs.allEnabled ? 'auto' : 'none';
    }
    if (notifToggleMessages) notifToggleMessages.checked = userNotifPrefs.messages;
    if (notifToggleCalls) notifToggleCalls.checked = userNotifPrefs.calls;
    if (notifToggleUpvotes) notifToggleUpvotes.checked = userNotifPrefs.upvotes;
    if (notifToggleReplies) notifToggleReplies.checked = userNotifPrefs.replies;
    if (notifToggleSounds) notifToggleSounds.checked = userNotifPrefs.sounds;
}




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


// --- 1-ON-1 AUDIO CALL DOM ELEMENTS ---
const startCallBtn = document.getElementById('start-call-btn');
const activeCallBar = document.getElementById('active-call-bar');
const callPulseIndicator = document.getElementById('call-pulse-indicator');
const callStatusText = document.getElementById('call-status-text');
const callDurationText = document.getElementById('call-duration-text');
const callMuteBtn = document.getElementById('call-mute-btn');
const callHangupBtn = document.getElementById('call-hangup-btn');
const incomingCallPopout = document.getElementById('incoming-call-popout') || document.getElementById('incoming-call-modal');
const incomingCallModal = incomingCallPopout;
const incomingCallerName = document.getElementById('incoming-caller-name');
const acceptCallBtn = document.getElementById('accept-call-btn');
const declineCallBtn = document.getElementById('decline-call-btn');
const remoteAudioEl = document.getElementById('remote-audio');
const callAmbientBackdrop = document.getElementById('call-ambient-backdrop');


// --- 1-ON-1 AUDIO CALL STATE ---
let activeCall = null; // { peerConnection, localStream, conversationId, partnerId, partnerUsername, isCaller, callChannel, callTimerInterval, callStartTime }
let isMicMuted = false;
let incomingCallData = null; // { callerId, callerUsername, conversationId }
let userCallSignalingChannel = null;
const recentlyDeclinedCalls = new Map();
let ringtoneAudioCtx = null;
let ringtoneInterval = null;
let queuedIceCandidates = [];




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
let currentUserDbRole = null;
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
    if (headerFallback) headerFallback.textContent = "⚙";
}
if (tabNavSettings) {
    const textSpan = tabNavSettings.querySelector('span:last-child');
    if (textSpan) textSpan.textContent = "Settings";
    const iconSpan = tabNavSettings.querySelector('#tab-avatar-fallback');
    if (iconSpan) iconSpan.textContent = "⚙";
}




// --- SETTINGS SUB-TABS (PROFILE & PRIVACY) ---




const tabBtnSettingsAudio = document.getElementById('tab-btn-settings-audio');
const paneSettingsAudio = document.getElementById('pane-settings-audio');
const micTestToggleBtn = document.getElementById('mic-test-toggle-btn');
const micMeterFill = document.getElementById('mic-meter-fill');
const audioOptEcho = document.getElementById('audio-opt-echo');
const audioOptNoise = document.getElementById('audio-opt-noise');
const audioOptGain = document.getElementById('audio-opt-gain');
const audioOptHifi = document.getElementById('audio-opt-hifi');
const audioOptDeafen = document.getElementById('audio-opt-deafen');


let userAudioSettings = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    highFidelity: false,
    deafen: false
};


function loadAudioSettings() {
    try {
        const saved = localStorage.getItem('tg_audio_settings');
        if (saved) userAudioSettings = { ...userAudioSettings, ...JSON.parse(saved) };
    } catch (e) {}
    if (audioOptEcho) audioOptEcho.checked = userAudioSettings.echoCancellation;
    if (audioOptNoise) audioOptNoise.checked = userAudioSettings.noiseSuppression;
    if (audioOptGain) audioOptGain.checked = userAudioSettings.autoGainControl;
    if (audioOptHifi) audioOptHifi.checked = userAudioSettings.highFidelity;
    if (audioOptDeafen) audioOptDeafen.checked = userAudioSettings.deafen;
}


function saveAudioSettings() {
    try {
        localStorage.setItem('tg_audio_settings', JSON.stringify(userAudioSettings));
    } catch (e) {}
}


function switchSettingsTab(tab) {
    const tabs = ['profile', 'audio', 'notifs', 'privacy'];
    const panes = { profile: paneSettingsProfile, audio: paneSettingsAudio, notifs: paneSettingsNotifs, privacy: paneSettingsPrivacy };
    const buttons = { profile: tabBtnSettingsProfile, audio: tabBtnSettingsAudio, notifs: tabBtnSettingsNotifs, privacy: tabBtnSettingsPrivacy };


    tabs.forEach(t => {
        if (panes[t]) {
            if (t === tab) panes[t].classList.remove('hidden');
            else panes[t].classList.add('hidden');
        }
        if (buttons[t]) {
            if (t === tab) {
                buttons[t].style.background = "#0284c7";
                buttons[t].style.borderColor = "#38bdf8";
                buttons[t].style.color = "#ffffff";
            } else {
                buttons[t].style.background = "#0f172a";
                buttons[t].style.borderColor = "#334155";
                buttons[t].style.color = "#94a3b8";
            }
        }
    });


    if (tab === 'notifs') {
        syncNotificationSettingsUI();
    }
}


safeAddListener(tabBtnSettingsProfile, 'click', () => switchSettingsTab('profile'));
safeAddListener(tabBtnSettingsAudio, 'click', () => { switchSettingsTab('audio'); loadAudioSettings(); });
safeAddListener(tabBtnSettingsNotifs, 'click', () => switchSettingsTab('notifs'));
safeAddListener(tabBtnSettingsPrivacy, 'click', () => switchSettingsTab('privacy'));


// Audio & Calling technical toggles listeners
safeAddListener(audioOptEcho, 'change', () => { userAudioSettings.echoCancellation = audioOptEcho.checked; saveAudioSettings(); });
safeAddListener(audioOptNoise, 'change', () => { userAudioSettings.noiseSuppression = audioOptNoise.checked; saveAudioSettings(); });
safeAddListener(audioOptGain, 'change', () => { userAudioSettings.autoGainControl = audioOptGain.checked; saveAudioSettings(); });
safeAddListener(audioOptHifi, 'change', () => { userAudioSettings.highFidelity = audioOptHifi.checked; saveAudioSettings(); });
safeAddListener(audioOptDeafen, 'change', () => {
    userAudioSettings.deafen = audioOptDeafen.checked;
    saveAudioSettings();
    if (remoteAudioEl) remoteAudioEl.muted = userAudioSettings.deafen;
    showToast({
        title: "Audio Setting",
        message: userAudioSettings.deafen ? "Global deafen enabled (all incoming audio muted)." : "Global deafen disabled.",
        type: userAudioSettings.deafen ? "info" : "success",
        icon: userAudioSettings.deafen ? "◇" : "◈",
        force: true
    });
});


// Live Mic Meter Test
let isTestingMic = false;
let micTestStream = null;
let micTestInterval = null;


safeAddListener(micTestToggleBtn, 'click', async () => {
    if (isTestingMic) {
        // Stop Test
        isTestingMic = false;
        if (micTestInterval) clearInterval(micTestInterval);
        if (micTestStream) {
            try { micTestStream.getTracks().forEach(t => t.stop()); } catch (e) {}
            micTestStream = null;
        }
        if (micTestToggleBtn) {
            micTestToggleBtn.textContent = "Start Test";
            micTestToggleBtn.style.color = "#10b981";
            micTestToggleBtn.style.borderColor = "#10b981";
        }
        if (micMeterFill) micMeterFill.style.width = "0%";
    } else {
        // Start Test
        try {
            micTestStream = await getMicrophoneStream();
            isTestingMic = true;
            if (micTestToggleBtn) {
                micTestToggleBtn.textContent = "Stop Test";
                micTestToggleBtn.style.color = "#ef4444";
                micTestToggleBtn.style.borderColor = "#ef4444";
            }
            const ctx = getSharedAudioContext();
            if (ctx) {
                const src = ctx.createMediaStreamSource(micTestStream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                src.connect(analyser);
                const dataArr = new Uint8Array(analyser.frequencyBinCount);
                micTestInterval = setInterval(() => {
                    if (!isTestingMic) return;
                    analyser.getByteFrequencyData(dataArr);
                    let sum = 0;
                    for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
                    const avg = sum / dataArr.length;
                    const pct = Math.min(100, Math.round(avg * 2.8));
                    if (micMeterFill) micMeterFill.style.width = pct + "%";
                }, 60);
            }
        } catch (err) {
            alert("Could not access microphone for test: " + err.message);
        }
    }
});


// Notification Toggle Listeners
safeAddListener(notifMasterToggleChk, 'change', () => {
    userNotifPrefs.allEnabled = notifMasterToggleChk.checked;
    saveNotificationPreferences();
    syncNotificationSettingsUI();
    showToast({
        title: "Notifications",
        message: userNotifPrefs.allEnabled ? "All notifications enabled." : "Notifications muted entirely.",
        type: userNotifPrefs.allEnabled ? "success" : "info",
        icon: userNotifPrefs.allEnabled ? "◈" : "◇",
        force: true
    });
});


safeAddListener(notifToggleMessages, 'change', () => {
    userNotifPrefs.messages = notifToggleMessages.checked;
    saveNotificationPreferences();
});


safeAddListener(notifToggleCalls, 'change', () => {
    userNotifPrefs.calls = notifToggleCalls.checked;
    saveNotificationPreferences();
});


safeAddListener(notifToggleUpvotes, 'change', () => {
    userNotifPrefs.upvotes = notifToggleUpvotes.checked;
    saveNotificationPreferences();
});


safeAddListener(notifToggleReplies, 'change', () => {
    userNotifPrefs.replies = notifToggleReplies.checked;
    saveNotificationPreferences();
});


safeAddListener(notifToggleSounds, 'change', () => {
    userNotifPrefs.sounds = notifToggleSounds.checked;
    saveNotificationPreferences();
    showToast({
        title: "Audio Preferences",
        message: userNotifPrefs.sounds 
            ? "Notification sounds and call ringtones enabled." 
            : "All sounds muted. Sleek popups and alerts remain active.",
        type: userNotifPrefs.sounds ? "success" : "info",
        icon: userNotifPrefs.sounds ? "◈" : "◇",
        force: true
    });
});






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
                    <span>Reply</span>
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
    loadNotificationPreferences();
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
            showToast({ title: "Verification Passed", message: "Suspicion reset. Your account is restored.", type: "success", icon: "◈" });
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
    if (!username && !currentUser) return false;
    if (currentUser && currentUser.email && currentUser.email.toLowerCase() === 'evan.ottawakerrs@gmail.com') return true;
    if (currentUserDbRole && ['admin', 'site_admin', 'superadmin', 'owner'].includes(currentUserDbRole.toLowerCase())) return true;
    const clean = (username || '').toLowerCase().replace('@', '');
    if (clean === SITE_ADMIN_USERNAME.toLowerCase()) return true;
    return false;
}




function getThreadRole(threadName = activeThread, username = currentUsername) {
    if (!username && !currentUser) return "Guest";
    const cleanUser = (username || currentUsername || '').toLowerCase().replace('@', '');
    if (isSiteAdmin(cleanUser)) return "Site Admin";


    // 1. Authoritative check against cloud threads from DB
    if (Array.isArray(allCloudThreads) && allCloudThreads.length > 0) {
        const cloudThread = allCloudThreads.find(t => t.name && t.name.toLowerCase() === (threadName || '').toLowerCase());
        if (cloudThread) {
            // Check created_by UUID directly
            if (currentUser && cloudThread.created_by && cloudThread.created_by === currentUser.id) return "Owner";
            const cloudOwner = (cloudThread.owner_username || cloudThread.owner || '').toLowerCase().replace('@', '');
            if (cloudOwner && cloudOwner === cleanUser) return "Owner";
            const cloudMods = (cloudThread.moderators || []).map(m => String(m).toLowerCase().replace('@', ''));
            if (cloudMods.includes(cleanUser)) return "Moderator";
            const cloudBanned = (cloudThread.banned || []).map(b => String(b).toLowerCase().replace('@', ''));
            if (cloudBanned.includes(cleanUser)) return "Banned";
        }
    }


    // 2. Local metadata fallback
    const meta = threadMetaMap[threadName] || { owner: '', moderators: [], banned: [] };
    const metaOwner = (meta.owner || '').toLowerCase().replace('@', '');
    if (metaOwner && metaOwner === cleanUser) return "Owner";
    const metaMods = (meta.moderators || []).map(m => String(m).toLowerCase().replace('@', ''));
    if (metaMods.includes(cleanUser)) return "Moderator";
    const metaBanned = (meta.banned || []).map(b => String(b).toLowerCase().replace('@', ''));
    if (metaBanned.includes(cleanUser)) return "Banned";


    if (currentUserDbRole && currentUserDbRole.toLowerCase() === 'moderator') return "Moderator";


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
    if (!currentUsername && !currentUser) return false;
    if (isSiteAdmin()) return true;
    const role = getThreadRole(threadName);
    return role === "Owner" || role === "Moderator" || role === "Site Admin";
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
                    <strong class="clickable-username" data-username="escapeHTML(n.actorusername)">@{escapeHTML(n.actor_username)}</strong>
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
                userCardAddFriendBtn.innerHTML = `✓ Peer Connected`;
                userCardAddFriendBtn.className = 'btn-friend-state btn-friend-added';
                userCardAddFriendBtn.title = "Click to remove friend";
            } else if (friendship && friendship.status === 'pending') {
                if (friendship.user_id === currentUser.id) {
                    // Outgoing pending request: can be clicked to rescind
                    userCardAddFriendBtn.innerHTML = `◈ Pending`;
                    userCardAddFriendBtn.className = 'btn-friend-state secondary';
                    userCardAddFriendBtn.title = "Click to cancel request";
                } else {
                    // Incoming pending request: can be clicked to accept
                    userCardAddFriendBtn.innerHTML = `✓ Accept`;
                    userCardAddFriendBtn.className = 'btn-friend-state';
                    userCardAddFriendBtn.title = "Accept friend request";
                }
            } else {
                userCardAddFriendBtn.innerHTML = `+ Add Peer`;
                userCardAddFriendBtn.className = 'btn-friend-state';
                userCardAddFriendBtn.title = "Send friend request";
            }
        }
    } catch (e) {
        if (userCardAddFriendBtn) {
            userCardAddFriendBtn.innerHTML = `+ Add Peer`;
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
    userCardAddFriendBtn.innerHTML = `◈ Pending`;




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
    showToast({ title: "Friend Request", message: "Request dispatched to @" + targetProfileUsername, type: "success", icon: "➕" });




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
                currentUserDbRole = profile.role || (profile.is_admin ? 'admin' : null);
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
        loadNotificationPreferences();
        initUserCallSignaling();
        initRealtimeActivityNotifications();
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


        if (userCallSignalingChannel && db) {
            try { db.removeChannel(userCallSignalingChannel); } catch (e) {}
            userCallSignalingChannel = null;
        }
        if (userNotifRealtimeChannel && db) {
            try { db.removeChannel(userNotifRealtimeChannel); } catch (e) {}
            userNotifRealtimeChannel = null;
        }
        cleanupCall();




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
        if (typeof triggerGuestDisclaimer === 'function') triggerGuestDisclaimer();




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
        authHeader.textContent = "Create Human Account";
        authUsernameGroup.classList.remove('hidden');
        authUsernameInput.required = true;
        authSubmitBtn.textContent = "Sign Up";
        authToggleBtn.textContent = "Already have an account? Log In";
    } else {
        authHeader.textContent = "Member Terminal";
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




        // Mark invite as claimed and log chain-of-custody lineage
        if (inviteCode) {
            try {
                const { data: { user: newUser } } = await db.auth.getUser().catch(() => ({ data: {} }));
                const claimPayload = {
                    status: 'claimed',
                    claimed_by_id: newUser ? newUser.id : null,
                    claimed_by_username: username,
                    claimed_at: new Date().toISOString()
                };
                const { error: claimErr } = await db.from('invitations').update(claimPayload).eq('code', inviteCode);
                if (claimErr) {
                    // Fallback if schema migration hasn't been applied yet
                    await db.from('invitations').update({ status: 'claimed' }).eq('code', inviteCode);
                }
            } catch (e) {
                console.warn("Chain-of-custody claim logging notice:", e);
            }
        }




        showToast({ title: "Welcome Voyager", message: "Verified human account created successfully!", type: "success", icon: "◈" });
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
    showToast({ title: "Avatar Updated", message: "Your new avatar has been synchronized.", type: "success", icon: "◈" });
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
        showToast({ title: "Security Hub", message: "Your password was changed successfully.", type: "success", icon: "◈" });
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


    // Synchronize cloud thread ownership & moderation into metadata cache
    (mergedThreads || []).forEach(t => {
        if (t.name) {
            if (!threadMetaMap[t.name]) threadMetaMap[t.name] = { owner: '', moderators: [], banned: [] };
            if (t.owner_username) threadMetaMap[t.name].owner = t.owner_username;
            if (t.moderators && Array.isArray(t.moderators)) threadMetaMap[t.name].moderators = t.moderators;
        }
    });
    try { localStorage.setItem('forum_thread_metadata', JSON.stringify(threadMetaMap)); } catch (e) {}
    
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
        const icon = tName === "Welcome & Security" 
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:5px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' 
            : (tName === "Update Thread" 
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:5px;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' 
                : (tName === "Trending" 
                    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:5px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' 
                    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:5px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'));




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
    // Community Banner Permissions (Strictly Owner, Moderator, or Site Admin)
    const isBannerAuthorized = Boolean(currentUser && (role === 'Owner' || role === 'Moderator' || role === 'Site Admin'));
    const tData = allCloudThreads.find(t => t.name === activeThread);
    const hasActiveBanner = Boolean(tData && tData.banner_url);


    let bannerBtn = document.getElementById('set-banner-btn');
    let removeBannerBtn = document.getElementById('remove-banner-btn');


    if (!isBannerAuthorized) {
        if (bannerBtn) bannerBtn.remove();
        if (removeBannerBtn) removeBannerBtn.remove();
    } else if (actionsBar) {
        // Set Banner Button
        if (!bannerBtn) {
            bannerBtn = document.createElement('button');
            bannerBtn.id = 'set-banner-btn';
            bannerBtn.type = 'button';
            bannerBtn.className = 'secondary btn-thread-action desktop-only-btn';
            bannerBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>Set Banner</span>';
            bannerBtn.onclick = () => document.getElementById('banner-upload-input').click();
            actionsBar.prepend(bannerBtn);
        }
        // Remove Banner Button (Only visible when a banner is currently set)
        if (hasActiveBanner) {
            if (!removeBannerBtn) {
                removeBannerBtn = document.createElement('button');
                removeBannerBtn.id = 'remove-banner-btn';
                removeBannerBtn.type = 'button';
                removeBannerBtn.className = 'danger btn-thread-action desktop-only-btn';
                removeBannerBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg><span>Remove Banner</span>';
                removeBannerBtn.onclick = removeCurrentThreadBanner;
                actionsBar.prepend(removeBannerBtn);
            }
        } else if (removeBannerBtn) {
            removeBannerBtn.remove();
        }
    }
    if (!currentUser) {
        if (flairBtn) flairBtn.remove();
    } else if (actionsBar) {
        if (!flairBtn) {
            flairBtn = document.createElement('button');
            flairBtn.id = 'set-flair-btn';
            flairBtn.type = 'button';
            flairBtn.className = 'secondary btn-thread-action desktop-only-btn';
            flairBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg><span>Set Flair</span>';
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




    // Voice Stage Count
    const vCountBadge = document.getElementById('voice-stage-count');
    if (vCountBadge) {
        if (typeof getActiveVoiceStageCount === 'function') {
            vCountBadge.textContent = getActiveVoiceStageCount(activeThread);
        } else {
            vCountBadge.textContent = '0';
        }
    }


    // Evaluate Live Chat Schedule / Lock
    const liveChatBtn = document.getElementById('open-live-chat-btn');
    if (liveChatBtn && tData) {
        window.currentLiveChatIsOpen = evaluateLiveChatStatus(tData);
        if (window.currentLiveChatIsOpen) {
            liveChatBtn.classList.remove('locked');
            liveChatBtn.innerHTML = `<div class="live-pulse"></div> Live Chat (<span id="live-viewers-badge">0</span>)`;
        } else {
            liveChatBtn.classList.add('locked');
            liveChatBtn.innerHTML = `◈ Chat Locked`;
        }
    }




    if (deleteThreadBtn) {
        if (canDeleteThread(activeThread)) deleteThreadBtn.classList.remove('hidden');
        else deleteThreadBtn.classList.add('hidden');
    }


    // --- POPULATE THREAD OPTIONS MODAL (FOR MOBILE COMPACT POPUP & DESKTOP) ---
    const optSetBanner = document.getElementById('opt-set-banner-btn');
    const optManagePerms = document.getElementById('opt-manage-perms-btn');
    const optManageChat = document.getElementById('opt-manage-chat-btn');
    const optSetFlair = document.getElementById('opt-set-flair-btn');
    const optJoinLeave = document.getElementById('opt-join-leave-btn');
    const optJoinLeaveText = document.getElementById('opt-join-leave-text');
    const optDeleteThread = document.getElementById('opt-delete-thread-btn');
    const optThreadTitle = document.getElementById('thread-options-modal-title');


    if (optThreadTitle) optThreadTitle.textContent = activeThread;


    const isModOrOwner = (role === 'Owner' || role === 'Moderator' || role === 'Site Admin');


    const optRemoveBanner = document.getElementById('opt-remove-banner-btn');
    if (optSetBanner) {
        if (currentUser && isModOrOwner) optSetBanner.classList.remove('hidden');
        else optSetBanner.classList.add('hidden');
    }
    if (optRemoveBanner) {
        if (currentUser && isModOrOwner && hasActiveBanner) optRemoveBanner.classList.remove('hidden');
        else optRemoveBanner.classList.add('hidden');
    }


    if (optManagePerms) {
        if (canManagePermissions(activeThread)) optManagePerms.classList.remove('hidden');
        else optManagePerms.classList.add('hidden');
    }


    if (optManageChat) {
        if (canManagePermissions(activeThread)) optManageChat.classList.remove('hidden');
        else optManageChat.classList.add('hidden');
    }


    if (optSetFlair) {
        if (currentUser) optSetFlair.classList.remove('hidden');
        else optSetFlair.classList.add('hidden');
    }


    if (optJoinLeave) {
        if (!isMandatory && currentUser) {
            optJoinLeave.classList.remove('hidden');
            if (optJoinLeaveText) optJoinLeaveText.textContent = isJoined ? 'Leave Community Thread' : '+ Join Community Thread';
        } else {
            optJoinLeave.classList.add('hidden');
        }
    }


    if (optDeleteThread) {
        if (canDeleteThread(activeThread)) optDeleteThread.classList.remove('hidden');
        else optDeleteThread.classList.add('hidden');
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
                <div class="link-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
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
        return `${space}<span class="clickable-thread" data-thread="${escapeHTML(actualName)}" title="Go to #${escapeHTML(actualName)}">#${threadRaw}</span>`;
    });




    return withThreadLinks.replace(/\n/g, '<br>');
}




// --- PHOTO ATTACHMENTS ---




safeAddListener(postImageFile, 'change', () => {
    const file = postImageFile.files[0];
    if (file) {
        selectedPostPhotoFile = file;
        if (postPhotoFilename) postPhotoFilename.textContent = `◈ file.name({(file.size / 1024).toFixed(0)} KB)`;
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
                    <span>@${escapeHTML(partner.username)}</span>
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
            <span class="clickable-username" data-username="escapeHTML(username)">@{escapeHTML(username)}</span>
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
                .or(`and(sender_id.eq.${updatedReq.user_id},friend_id.eq.${updatedReq.friend_id}),and(sender_id.eq.${updatedReq.friend_id},friend_id.eq.${updatedReq.user_id})`)
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
    showToast({ title: "Friend Request", message: "Request dispatched to @" + targetProfileUsername, type: "success", icon: "➕" });
    refreshMessagingHub();
});




async function loadConversations() {
    if (!currentUser || !db || !groupsContainer) return;


    try {
        const { data: memberships, error: memErr } = await db
            .from('conversation_members')
            .select('conversation_id')
            .eq('user_id', currentUser.id);


        if (memErr) {
            console.error("loadConversations memberships error:", memErr);
        }


        if (!memberships || memberships.length === 0) {
            groupsContainer.innerHTML = '<div class="no-posts" style="padding: 6px; font-size: 0.8rem;">No groups yet</div>';
            return;
        }


        const convIds = memberships.map(m => m.conversation_id);
        const { data: convs, error: convErr } = await db
            .from('conversations')
            .select('*')
            .in('id', convIds);


        if (convErr) {
            console.error("loadConversations convs error:", convErr);
        }


        groupsContainer.innerHTML = '';
        // Match any conversation flagged as a group OR possessing a group name
        const groupConvs = (convs || []).filter(c => c.is_group === true || (c.name && c.name.trim() !== ''));


        if (groupConvs.length === 0) {
            groupsContainer.innerHTML = '<div class="no-posts" style="padding: 6px; font-size: 0.8rem;">No groups yet</div>';
            return;
        }


        groupConvs.forEach(conv => {
            const div = document.createElement('div');
            div.className = `conv-item ${activeConversationId === conv.id ? 'active' : ''}`;
            div.setAttribute('data-conv-id', conv.id);


            const unreadCount = unreadCountsByConv.get(conv.id) || 0;
            const badgeHidden = unreadCount === 0 ? 'hidden' : '';
            const gTitle = conv.name || 'Group Chat';


            div.innerHTML = `
                <div class="conv-item-label">
                    <span>${escapeHTML(gTitle)}</span>
                </div>
                <span class="conv-badge ${badgeHidden}">${unreadCount}</span>
            `;


            div.addEventListener('click', () => selectConversation(conv.id, `Group: ${gTitle}`, null, null, true));
            groupsContainer.appendChild(div);
        });
    } catch (err) {
        console.error("loadConversations error:", err);
    }
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




    if (startCallBtn) {
        startCallBtn.classList.remove('hidden');
        if (partnerId) {
            startCallBtn.title = "Start 1-on-1 Voice Call";
            startCallBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
        } else {
            startCallBtn.title = "Start Group Voice Call";
            startCallBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/></svg>`;
        }
    }


    if (chatHeader) {
        if (partnerUsername) {
            chatHeader.innerHTML = `<span class="clickable-username" title="Click to view @escapeHTML(partnerUsername)'sprofile">@{escapeHTML(partnerUsername)}</span>`;
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


    unreadCountsByConv.delete(conversationId);
    let currentUnreadTotal = 0;
    unreadCountsByConv.forEach(c => currentUnreadTotal += c);
    if (currentUnreadTotal === 0) {
        if (notifBadge) { notifBadge.textContent = '0'; notifBadge.classList.add('hidden'); }
        if (mobileMsgBadge) { mobileMsgBadge.textContent = '0'; mobileMsgBadge.classList.add('hidden'); }
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




    const avatarImgHtml = `<img src="senderAvatar"class="msg-avatarclickable-avatar"data-username="{escapeHTML(msg.sender_username)}" alt="pfp" title="@${escapeHTML(msg.sender_username)}">`;
    const authorHtml = !isMine ? `<div class="msg-author clickable-username" data-username="escapeHTML(msg.senderusername)">@{escapeHTML(msg.sender_username)}</div>` : '';
    const textHtml = msg.content ? `<div>${renderFormattedContent(msg.content)}</div>` : '';
    const imgHtml = msg.image_url ? `<a href="${msg.image_url}" target="_blank" rel="noopener noreferrer"><img src="${msg.image_url}" class="chat-img-thumb" alt="Uploaded photo"></a>` : '';
    
    let pendingBadge = '';
    if (isOptimistic) {
        pendingBadge = `<span class="pending-tag" style="background:#475569; color:#94a3b8;">Sending...</span>`;
    } else if (isPending) {
        pendingBadge = isMine 
            ? `<span class="pending-tag">Pending Approval</span>` 
            : `<span class="pending-tag" style="background:#0369a1; color:#e0f2fe;">Chat Request</span>`;
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
                    <span>◈ @${escapeHTML(activeConversationPartnerUsername || 'User')} sent you a message request.</span>
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
            chatPendingBanner.innerHTML = `<span>◈ Message request sent. Messages remain pending until @${escapeHTML(activeConversationPartnerUsername || 'recipient')} accepts.</span>`;
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




    // Await database updates so checkNotifications doesn't see old unread states
    try {
        await db.from('chat_messages')
            .update({ is_read: true })
            .eq('conversation_id', activeConversationId)
            .neq('sender_id', currentUser.id)
            .eq('is_read', false);


        await db.from('user_notifications')
            .update({ is_read: true })
            .eq('user_id', currentUser.id)
            .eq('entity_id', String(activeConversationId));
    } catch (e) {}


    unreadCountsByConv.delete(activeConversationId);


    // Immediately calculate remaining unread count in memory and update icon badges
    let remainingUnreadTotal = 0;
    unreadCountsByConv.forEach((cnt, cId) => {
        if (cId !== activeConversationId) remainingUnreadTotal += cnt;
    });


    if (remainingUnreadTotal === 0) {
        if (notifBadge) { notifBadge.textContent = '0'; notifBadge.classList.add('hidden'); }
        if (mobileMsgBadge) { mobileMsgBadge.textContent = '0'; mobileMsgBadge.classList.add('hidden'); }
    } else {
        const badgeStr = remainingUnreadTotal > 99 ? '99+' : String(remainingUnreadTotal);
        if (notifBadge) { notifBadge.textContent = badgeStr; notifBadge.classList.remove('hidden'); }
        if (mobileMsgBadge) { mobileMsgBadge.textContent = badgeStr; mobileMsgBadge.classList.remove('hidden'); }
    }


    await checkNotifications();
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
                    pendingTag.textContent = 'Pending Approval';
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




let lastUnreadMessageTotal = -1;


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
                .select('conversation_id, sender_username, content')
                .in('conversation_id', convIds)
                .neq('sender_id', currentUser.id)
                .eq('is_read', false)
                .eq('pending_approval', false);




            if (unreadMsgs) {
                unreadTotal = 0;
                unreadMsgs.forEach(m => {
                    // Do not count messages as unread if the chat modal is open and active on this conversation
                    if (dmModal && !dmModal.classList.contains('hidden') && activeConversationId === m.conversation_id) {
                        return;
                    }
                    unreadTotal++;
                    const cur = unreadCountsByConv.get(m.conversation_id) || 0;
                    unreadCountsByConv.set(m.conversation_id, cur + 1);
                });
            }
        }




        const total = (pendingReqs || 0) + unreadTotal;
        if (lastUnreadMessageTotal !== -1 && total > lastUnreadMessageTotal) {
            if (userNotifPrefs.allEnabled && userNotifPrefs.messages) {
                showToast({
                    title: "Incoming Transmission",
                    message: "You have a new direct message or request.",
                    type: "info",
                    icon: "✉",
                    onClick: () => {
                        openMessagesModal();
                    }
                });
            }
        }
        lastUnreadMessageTotal = total;


        // Check for incoming call notification in database fallback
        if (!activeCall) {
            const { data: callNotifs } = await db
                .from('user_notifications')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('type', 'incoming_call')
                .eq('is_read', false)
                .order('id', { ascending: false })
                .limit(5);


            if (callNotifs && callNotifs.length > 0) {
                callNotifs.forEach(notif => {
                    const notifAge = Date.now() - new Date(notif.created_at || Date.now()).getTime();
                    if (notifAge > 35000) {
                        // Purge old incoming_call records so they never trigger ghost notifications
                        db.from('user_notifications').delete().eq('id', notif.id).catch(() => {});
                    } else if (!activeCall) {
                        triggerIncomingCallUI({
                            callerId: notif.actor_id || null,
                            callerUsername: notif.actor_username,
                            conversationId: notif.entity_id,
                            offer: null
                        });
                    }
                });
            }
        }


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
    
    try {
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
                .eq('is_read', false);
        }


        // Clear any ghost/pending friend requests
        await db
            .from('friendships')
            .delete()
            .eq('friend_id', currentUser.id)
            .eq('status', 'pending');


        // Clear all database notification items and call alerts
        await db
            .from('user_notifications')
            .update({ is_read: true })
            .eq('user_id', currentUser.id);


    } catch (e) {
        console.warn("Notice clearing ghost notifications:", e);
    }


    unreadCountsByConv.clear();
    lastUnreadMessageTotal = 0;
    if (notifBadge) { notifBadge.textContent = '0'; notifBadge.classList.add('hidden'); }
    if (mobileMsgBadge) { mobileMsgBadge.textContent = '0'; mobileMsgBadge.classList.add('hidden'); }
    updateSidebarBadges();
    
    showToast({
        title: "Badges Cleared",
        message: "All unread messages and ghost notifications have been cleared.",
        type: "success",
        icon: "✓",
        force: true
    });
    refreshMessagingHub();
});


// Also allow clicking directly on the notif badge to clear any ghost indicator
if (notifBadge) {
    notifBadge.style.cursor = 'pointer';
    notifBadge.title = 'Click to clear badge';
    notifBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        if (clearAllNotifsBtn) clearAllNotifsBtn.click();
    });
}
if (mobileMsgBadge) {
    mobileMsgBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        if (clearAllNotifsBtn) clearAllNotifsBtn.click();
    });
}




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


    if (error) {
        console.error("Failed to save vote to database:", error);
    } else if (newVote === 1 && post.author) {
        const cleanAuthor = post.author.toLowerCase().replace('@', '');
        if (currentUser && currentUsername && cleanAuthor !== currentUsername.toLowerCase().replace('@', '')) {
            db.from('profiles').select('id').ilike('username', cleanAuthor).maybeSingle()
                .then(({ data: authorProfile }) => {
                    if (authorProfile && authorProfile.id) {
                        sendNotification(
                            authorProfile.id,
                            'upvote_post',
                            String(postId),
                            'liked your post in #' + (post.thread || 'forum') + '.'
                        );
                    }
                }).catch(() => {});
        }
    }
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
            <button type="button" class="btn-post-action toggle-comments-btn" data-post-id="${post.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>Comments (<span id="comment-count-${post.id}">...</span>)</span>
            </button>
            <button type="button" class="btn-post-action btn-share-post" data-post-id="${post.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                <span>Share <span id="share-count-post.id"style="margin-left:4px;opacity:0.8;">{post.shares || 0}</span></span>
            </button>
            ${userCanEdit ? `
            <button type="button" class="btn-post-action btn-edit-post" data-post-id="${post.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                <span>Edit</span>
            </button>` : ''}
            ${userCanPin ? `
            <button type="button" class="btn-post-action btn-pin-post" data-post-id="${post.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-2l-2-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v7l-2 3v2z"/></svg>
                <span>${post.is_pinned ? 'Unpin' : 'Pin'}</span>
            </button>` : ''}
            ${userCanDelete ? `
            <button type="button" class="btn-post-action danger-text btn-delete-post" data-post-id="${post.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                <span>Delete</span>
            </button>` : ''}
        </div>
    `;




    const photoHtml = post.image_url ? `<a href="${post.image_url}" target="_blank" rel="noopener noreferrer"><img src="${post.image_url}" class="post-img-thumb" alt="Post photo"></a>` : '';
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
                pollHtml += `<button type="button" class="poll-option-btn vote-poll-btn" data-post-id="${post.id}" data-opt-idx="${idx}">${escapeHTML(opt.text)} (${opt.votes || 0})</button>`;
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
            <button class="vote-btn ${myVote === 1 ? 'upvoted' : ''}" data-post-id="${post.id}" data-dir="1" title="Like">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <span class="vote-score">${score}</span>
            <button class="vote-btn ${myVote === -1 ? 'downvoted' : ''}" data-post-id="${post.id}" data-dir="-1" title="Dislike">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
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
            <img src="avatar"style="width:24px;height:24px;border-radius:50%;object-fit:cover;cursor:pointer;"class="clickable-username"data-username="{escapeHTML(cleanAuthor)}">
            <div style="flex: 1;">
                <div style="color: #38bdf8; font-weight: 600; margin-bottom: 2px;" class="clickable-username" data-username="escapeHTML(cleanAuthor)">@{escapeHTML(cleanAuthor)}</div>
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


    showToast({
        title: "Reply Transmitted",
        message: "Your comment was published to the thread.",
        type: "success",
        icon: "◈",
        duration: 3500,
        force: true
    });


    loadCommentsForPost(postId);




    // Notify post author
    if (postAuthorUsername && postAuthorUsername.toLowerCase().replace('@', '') !== currentUsername.toLowerCase().replace('@', '')) {
        db.from('profiles').select('id').ilike('username', postAuthorUsername.toLowerCase().replace('@', '')).maybeSingle()
            .then(({ data: profile }) => {
                if (profile?.id) {
                    sendNotification(profile.id, 'comment_reply', postId, 'replied to your post.');
                }
            }).catch(() => {});
    }


    // If this is a nested sub-reply, also notify parent comment author
    if (parentId) {
        db.from('post_comments').select('author').eq('id', parentId).maybeSingle()
            .then(({ data: parentComment }) => {
                const parentAuthor = parentComment?.author?.toLowerCase().replace('@', '');
                if (parentAuthor && parentAuthor !== currentUsername.toLowerCase().replace('@', '') && parentAuthor !== postAuthorUsername.toLowerCase().replace('@', '')) {
                    db.from('profiles').select('id').ilike('username', parentAuthor).maybeSingle()
                        .then(({ data: pProfile }) => {
                            if (pProfile?.id) {
                                sendNotification(pProfile.id, 'comment_reply', postId, 'replied to your comment.');
                            }
                        }).catch(() => {});
                }
            }).catch(() => {});
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
        const fallbackMsg = '<span class="ticker-item">◈ System online — Awaiting network transmissions...</span>';
        tickerContent.innerHTML = fallbackMsg + fallbackMsg;
        return;
    }




    cachedUpdates = updates;
    const items = updates.map(u => {
        const date = u.created_at ? new Date(u.created_at).toLocaleDateString() : '';
        return `<span class="ticker-item" data-id="${u.id}">◈ [${date}] <strong>@${escapeHTML(u.author)}:</strong> ${escapeHTML(u.content)}</span>`;
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




    if (shareModalTitle) shareModalTitle.textContent = 'Share Post';
    await populateShareConversations();
    if (shareModal) shareModal.classList.remove('hidden');
}




// Opens modal to share an entire thread
async function openShareThreadModal(threadName) {
    currentShareType = 'thread';
    currentShareTarget = threadName;
    currentSharePostUrl = `${window.location.origin}${window.location.pathname}?thread=${encodeURIComponent(threadName)}`;




    if (shareModalTitle) shareModalTitle.textContent = `Share Thread: #${threadName}`;
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
        copyLinkBtn.textContent = '✓ Link Copied!';
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
            div.innerHTML = `<strong>escapeHTML(tName)</strong><spanstyle="font-size:0.75rem;color:#64748b;float:right;">{isJoined ? 'Joined ✓' : ''}</span>`;
            
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


        showToast({
            title: "Transmission Broadcast",
            message: `Your post is live in #${targetThread}.`,
            type: "success",
            icon: "✦",
            duration: 4500,
            force: true
        });


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
    if (bannerBtn) { bannerBtn.disabled = true; bannerBtn.textContent = 'Uploading...'; }




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
        if (bannerBtn) { bannerBtn.disabled = false; bannerBtn.textContent = 'Set Banner'; }
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








// --- WEB OF TRUST: RED PEARL TRUST CHAMBER & TRACEABILITY LEDGER ---
// 3 Red Pearl keys are allocated per 30-day incubation cycle.
// Vouching creates an immutable lineage ledger so malicious automated bots can be traced
// directly back to the verified inviter who vouched for them.


let incubatorCountdownInterval = null;


function formatCountdown(ms) {
    if (ms <= 0) return "Ready";
    const totalSecs = Math.floor(ms / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (days > 0) {
        return `${days}d ${hours}h ${mins}m ${secs}s`;
    }
    return `${hours}h ${mins}m ${secs}s`;
}


async function loadUserInvites() {
    const grid = document.getElementById('pearl-incubator-grid');
    const adminOverdriveContainer = document.getElementById('admin-overdrive-container');
    const adminLedgerFilterRow = document.getElementById('admin-ledger-filter-row');
    
    if (!currentUser || !db) return;


    if (incubatorCountdownInterval) {
        clearInterval(incubatorCountdownInterval);
        incubatorCountdownInterval = null;
    }


    const isAdmin = isSiteAdmin();
    if (adminOverdriveContainer) {
        if (isAdmin) adminOverdriveContainer.classList.remove('hidden');
        else adminOverdriveContainer.classList.add('hidden');
    }
    if (adminLedgerFilterRow) {
        if (isAdmin) adminLedgerFilterRow.classList.remove('hidden');
        else adminLedgerFilterRow.classList.add('hidden');
    }


    // Fetch user invites (or all invites if admin, for ledger)
    const { data: invites, error } = await db.from('invitations')
        .select('*')
        .eq('inviter_id', currentUser.id)
        .order('created_at', { ascending: false });


    if (error) {
        console.warn("Could not load invitations:", error.message);
        return;
    }


    const allUserInvites = invites || [];
    const REGEN_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in ms


    // Determine the state of the 3 incubator slots (0, 1, 2)
    const slotData = [null, null, null];
    const assignedBySlot = new Map();
    allUserInvites.forEach(inv => {
        if (inv.slot_index !== null && inv.slot_index !== undefined && inv.slot_index >= 0 && inv.slot_index < 3) {
            if (!assignedBySlot.has(inv.slot_index)) {
                assignedBySlot.set(inv.slot_index, inv);
            }
        }
    });


    const unslotted = allUserInvites.filter(inv => inv.slot_index === null || inv.slot_index === undefined || inv.slot_index < 0 || inv.slot_index > 2);
    let unslottedIdx = 0;
    for (let s = 0; s < 3; s++) {
        if (assignedBySlot.has(s)) {
            slotData[s] = assignedBySlot.get(s);
        } else if (unslottedIdx < unslotted.length) {
            slotData[s] = unslotted[unslottedIdx++];
        }
    }


    // Render the 3 Biomechanical Pods
    if (grid) {
        grid.innerHTML = '';
        const now = Date.now();


        slotData.forEach((inv, slotIndex) => {
            const podEl = document.createElement('div');
            podEl.className = 'pearl-pod';
            podEl.dataset.slot = slotIndex;


            let isReady = true;
            let msRemaining = 0;
            let regenTarget = 0;


            if (inv) {
                const createdTime = new Date(inv.created_at).getTime();
                regenTarget = inv.regenerates_at ? new Date(inv.regenerates_at).getTime() : (createdTime + REGEN_DURATION);
                msRemaining = regenTarget - now;
                if (msRemaining > 0) {
                    isReady = false;
                }
            }


            if (isReady) {
                // Pod is in READY state: luminous red pearl ready for genetic extraction
                podEl.classList.add('state-ready');
                podEl.innerHTML = `
                    <div class="pod-badge-bar">
                        <span>POD 0${slotIndex + 1}</span>
                        <span class="pod-status-badge pod-status-ready">READY</span>
                    </div>
                    <div class="pod-chamber">
                        <div class="red-pearl" title="Red Pearl Ready — Click to extract key"></div>
                    </div>
                    <div class="pod-info">
                        <div style="font-size: 0.72rem; color: #cbd5e1; font-weight: 600;">Red Pearl Invite</div>
                        <button type="button" class="btn-pod-action" style="background: linear-gradient(135deg, #ff2a5f, #b3002b); color: #fff; border: 1px solid #ff2a5f; cursor: pointer;">
                            Extract Key
                        </button>
                    </div>
                `;


                const extractBtn = podEl.querySelector('.btn-pod-action');
                const pearlEl = podEl.querySelector('.red-pearl');


                const handleExtract = async () => {
                    extractBtn.disabled = true;
                    extractBtn.textContent = 'Synthesizing...';


                    if (pearlEl) {
                        pearlEl.classList.add('popping');
                    }
                    playTechChirp('pop');


                    setTimeout(async () => {
                        const newCode = 'TG-' + Math.random().toString(16).substr(2, 8).toUpperCase();
                        const regenIso = new Date(Date.now() + REGEN_DURATION).toISOString();


                        const fullPayload = {
                            inviter_id: currentUser.id,
                            inviter_username: currentUsername,
                            code: newCode,
                            slot_index: slotIndex,
                            regenerates_at: regenIso,
                            status: 'pending'
                        };


                        let { error: insertErr } = await db.from('invitations').insert([fullPayload]);
                        if (insertErr) {
                            const { error: fallbackErr } = await db.from('invitations').insert([{
                                inviter_id: currentUser.id,
                                code: newCode,
                                status: 'pending'
                            }]);
                            if (fallbackErr) {
                                alert("Could not generate invite: " + fallbackErr.message);
                                extractBtn.disabled = false;
                                return;
                            }
                        }


                        try {
                            await navigator.clipboard.writeText(newCode);
                        } catch (e) {}


                        showToast({
                            title: `Invite Key Minted: ${newCode}`,
                            message: `Copied to clipboard. Pod 0${slotIndex + 1} entered 30-day incubation cycle.`,
                            type: 'success',
                            icon: '◈',
                            duration: 5000
                        });


                        await loadUserInvites();
                    }, 460);
                };


                extractBtn.addEventListener('click', handleExtract);
                pearlEl.addEventListener('click', handleExtract);


            } else {
                // Pod is in INCUBATING state
                podEl.classList.add('state-incubating');
                const isClaimed = inv.status === 'claimed';
                const percentDone = Math.min(100, Math.max(1, Math.floor(((REGEN_DURATION - msRemaining) / REGEN_DURATION) * 100)));


                podEl.innerHTML = `
                    <div class="pod-badge-bar">
                        <span>POD 0${slotIndex + 1}</span>
                        <span class="pod-status-badge pod-status-incubating">${isClaimed ? 'CLAIMED' : 'ACTIVE'}</span>
                    </div>
                    <div class="pod-chamber">
                        <div class="bio-chamber-active">
                            <div class="bio-particles"></div>
                            <div class="nano-nucleus"></div>
                        </div>
                    </div>
                    <div class="pod-info">
                        <div class="pod-code-label" title="escapeHTML(inv.code)">{escapeHTML(inv.code)}</div>
                        <div class="pod-timer-text" data-regen="regenTarget">{formatCountdown(msRemaining)}</div>
                        <div class="pod-progress-bar-wrap">
                            <div class="pod-progress-bar-fill" style="width: ${percentDone}%;"></div>
                        </div>
                        <button type="button" class="btn-pod-action secondary ${isClaimed ? 'disabled' : ''}" style="margin-top: 3px; font-size: 0.72rem; height: 28px; cursor: ${isClaimed ? 'default' : 'pointer'};">
                            ${isClaimed ? `Claimed by @${escapeHTML(inv.claimed_by_username || 'human')}` : 'Copy Key'}
                        </button>
                    </div>
                `;


                if (!isClaimed) {
                    const copyBtn = podEl.querySelector('.btn-pod-action');
                    copyBtn.addEventListener('click', () => {
                        navigator.clipboard.writeText(inv.code);
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => copyBtn.textContent = 'Copy Key', 2000);
                    });
                }
            }


            grid.appendChild(podEl);
        });


        // Start live ticker to update countdown strings every second
        incubatorCountdownInterval = setInterval(() => {
            const timerEls = grid.querySelectorAll('.pod-timer-text');
            const nowTime = Date.now();
            let anyActive = false;


            timerEls.forEach(timerEl => {
                const target = parseInt(timerEl.dataset.regen, 10);
                if (target) {
                    const diff = target - nowTime;
                    if (diff <= 0) {
                        timerEl.textContent = 'Regenerated!';
                        if (!timerEl.dataset.reloaded) {
                            timerEl.dataset.reloaded = 'true';
                            setTimeout(() => loadUserInvites(), 1000);
                        }
                    } else {
                        anyActive = true;
                        timerEl.textContent = formatCountdown(diff);
                        const podFill = timerEl.parentElement.querySelector('.pod-progress-bar-fill');
                        if (podFill) {
                            const pct = Math.min(100, Math.max(1, Math.floor(((REGEN_DURATION - diff) / REGEN_DURATION) * 100)));
                            podFill.style.width = pct + '%';
                        }
                    }
                }
            });


            if (!anyActive && incubatorCountdownInterval) {
                clearInterval(incubatorCountdownInterval);
                incubatorCountdownInterval = null;
            }
        }, 1000);
    }


    // Render Lineage Ledger
    await renderInviteLedger(allUserInvites, isAdmin);
}


async function renderInviteLedger(userInvites, isAdmin) {
    const ledgerList = document.getElementById('invite-ledger-list');
    const ledgerCountBadge = document.getElementById('ledger-count-badge');
    if (!ledgerList) return;


    let displayList = userInvites;


    // If site admin, fetch all recent system invites so admin can trace any lineage
    if (isAdmin) {
        const { data: allSystemInvites } = await db.from('invitations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
        if (allSystemInvites && allSystemInvites.length > 0) {
            displayList = allSystemInvites;
        }
    }


    if (ledgerCountBadge) {
        ledgerCountBadge.textContent = `${displayList.length} ${isAdmin ? 'Total System' : 'Vouched'}`;
    }


    ledgerList.innerHTML = '';
    if (displayList.length === 0) {
        ledgerList.innerHTML = '<div style="font-size: 0.75rem; color: #64748b; padding: 8px; text-align: center;">No cryptographic lineage records found.</div>';
        return;
    }


    const filterInput = document.getElementById('ledger-search-input');
    const filterQuery = (filterInput ? filterInput.value.trim().toLowerCase() : '');


    const filtered = displayList.filter(inv => {
        if (!filterQuery) return true;
        const c = (inv.code || '').toLowerCase();
        const by = (inv.inviter_username || '').toLowerCase();
        const to = (inv.claimed_by_username || '').toLowerCase();
        return c.includes(filterQuery) || by.includes(filterQuery) || to.includes(filterQuery);
    });


    filtered.forEach(inv => {
        const row = document.createElement('div');
        row.className = 'ledger-row';
        if (inv.is_bot_flagged) row.classList.add('is-tainted');


        const isClaimed = inv.status === 'claimed';
        const createdDate = inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'N/A';
        const claimedDate = inv.claimed_at ? new Date(inv.claimed_at).toLocaleDateString() : '';


        row.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="ledger-code">${escapeHTML(inv.code)}</span>
                    ${inv.is_bot_flagged ? '<span class="badge badge-red" style="font-size: 0.65rem;">▵ BOT FLAGGED</span>' : (isClaimed ? '<span class="badge badge-green" style="font-size: 0.65rem;">✓ VERIFIED</span>' : '<span class="badge badge-blue" style="font-size: 0.65rem;">PENDING</span>')}
                </div>
                <span class="ledger-meta">Issued: createdDateby<strong>@{escapeHTML(inv.inviter_username || (inv.inviter_id === currentUser.id ? currentUsername : 'inviter'))}</strong></span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                <span style="font-size: 0.72rem; color: ${isClaimed ? '#38bdf8' : '#94a3b8'};">
                    ${isClaimed ? `Claimed by: <strong>@${escapeHTML(inv.claimed_by_username || 'human')}</strong> (${claimedDate})` : 'Awaiting Redemption'}
                </span>
                ${isAdmin ? `
                    <button type="button" class="btn-flag-bot" style="width: auto; padding: 2px 6px; font-size: 0.65rem; background: transparent; border: 1px solid ${inv.is_bot_flagged ? '#10b981' : '#ef4444'}; color: ${inv.is_bot_flagged ? '#10b981' : '#ef4444'}; border-radius: 4px; cursor: pointer;">
                        ${inv.is_bot_flagged ? 'Clear Bot Flag' : 'Flag Lineage as Bot'}
                    </button>
                ` : ''}
            </div>
        `;


        if (isAdmin) {
            const flagBtn = row.querySelector('.btn-flag-bot');
            if (flagBtn) {
                flagBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const newFlag = !inv.is_bot_flagged;
                    const { error: flagErr } = await db.from('invitations')
                        .update({ is_bot_flagged: newFlag, flagged_reason: newFlag ? 'Flagged by Site Administrator' : null })
                        .eq('id', inv.id);
                    if (flagErr) {
                        alert(`Could not update ledger: ${flagErr.message}`);
                    } else {
                        showToast({
                            title: newFlag ? 'Lineage Flagged' : 'Flag Cleared',
                            message: `Code ${inv.code} is now marked ${newFlag ? 'TAINTED BOT' : 'CLEAN'}.`,
                            type: newFlag ? 'error' : 'success',
                            icon: '◈'
                        });
                        await loadUserInvites();
                    }
                });
            }
        }


        ledgerList.appendChild(row);
    });
}


// Setup Admin Quantum Overdrive Listener
safeAddListener(document.getElementById('admin-overdrive-btn'), 'click', async () => {
    if (!currentUser || !db || !isSiteAdmin()) return;
    const btn = document.getElementById('admin-overdrive-btn');
    btn.disabled = true;
    btn.textContent = 'Minting Key...';


    const newCode = 'TG-ADM-' + Math.random().toString(16).substr(2, 6).toUpperCase();
    const { error } = await db.from('invitations').insert([{
        inviter_id: currentUser.id,
        inviter_username: currentUsername,
        code: newCode,
        slot_index: -1,
        status: 'pending'
    }]);


    btn.disabled = false;
    btn.textContent = '✦ Quantum Core (Infinite)';


    if (error) {
        alert("Admin mint error: " + error.message);
        return;
    }


    try {
        await navigator.clipboard.writeText(newCode);
    } catch (e) {}


    showToast({
        title: "✦ Quantum Key Minted",
        message: `Admin code ${newCode} copied to clipboard!`,
        type: "success",
        icon: "✦",
        duration: 5000
    });


    await loadUserInvites();
});


// Ledger Accordion Toggle & Live Search
safeAddListener(document.getElementById('toggle-invite-ledger-btn'), 'click', () => {
    const content = document.getElementById('invite-ledger-content');
    const chevron = document.getElementById('ledger-chevron');
    if (!content) return;
    const isHidden = content.classList.contains('hidden');
    if (isHidden) {
        content.classList.remove('hidden');
        if (chevron) chevron.textContent = '▲ Hide';
    } else {
        content.classList.add('hidden');
        if (chevron) chevron.textContent = '▼ Show';
    }
});


const ledgerSearchInput = document.getElementById('ledger-search-input');
if (ledgerSearchInput) {
    ledgerSearchInput.addEventListener('input', () => {
        loadUserInvites();
    });
}




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


    // Initialize & Sync Built-in Voice Stage
    openVoiceStageInsideLiveChat(activeThread);
    
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


    // If not connected to voice stage, clean up room channel subscription to save bandwidth
    if (!voiceStageIsConnected && voiceStageChannel) {
        try { db.removeChannel(voiceStageChannel); } catch (e) {}
        voiceStageChannel = null;
        voiceStageParticipants.clear();
    }
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
        const currentStr = `hrStr.padStart(2,'0'):{minStr.padStart(2, '0')}`;




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




// =========================================================================
// --- 1-ON-1 WEBRTC AUDIO CALLING SYSTEM ---
// =========================================================================


function triggerIncomingCallUI(data) {
    if (!data || !data.callerId || data.callerId === currentUser?.id) return;
    if (activeCall) return;


    if (!userNotifPrefs.allEnabled || !userNotifPrefs.calls) {
        return;
    }


    // Ignore if this call was explicitly declined within the last 45 seconds
    const lastDeclined = Math.max(
        recentlyDeclinedCalls.get(data.conversationId) || 0,
        recentlyDeclinedCalls.get(data.callerId) || 0
    );
    if (Date.now() - lastDeclined < 45000) {
        return;
    }


    incomingCallData = data;
    if (incomingCallerName) {
        if (data.isGroup && data.groupName) {
            incomingCallerName.textContent = `data.groupName(@{data.callerUsername || 'User'})`;
        } else {
            incomingCallerName.textContent = `@${data.callerUsername || 'User'}`;
        }
    }
    playRingtoneSound();
    if (navigator.vibrate) {
        try { navigator.vibrate([400, 200, 400, 200, 600]); } catch (e) {}
    }
    if (callAmbientBackdrop) {
        callAmbientBackdrop.classList.remove('hidden');
    }
    if (incomingCallPopout) {
        incomingCallPopout.classList.remove('hidden');
    }
}


function playRingtoneSound() {
    stopRingtoneSound();
    // Mute ringtone sound if user turned off sounds in settings (visual popouts & aura remain active)
    if (typeof userNotifPrefs !== 'undefined' && userNotifPrefs && !userNotifPrefs.sounds) {
        return;
    }
    try {
        const ctx = getSharedAudioContext();
        if (!ctx) return;


        const playTone = () => {
            if (!ctx || ctx.state === 'closed') return;
            const now = ctx.currentTime;
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();


            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(440, now);
            osc2.frequency.setValueAtTime(480, now);


            // High-visibility audible ring volume (0.30)
            gain.gain.setValueAtTime(0.30, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);


            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);


            osc1.start();
            osc2.start();
            osc1.stop(now + 1.2);
            osc2.stop(now + 1.2);
        };


        if (ctx.state === 'suspended') {
            ctx.resume().then(playTone).catch(playTone);
        } else {
            playTone();
        }
        ringtoneInterval = setInterval(() => {
            if (ctx.state === 'suspended') ctx.resume().then(playTone).catch(playTone);
            else playTone();
        }, 3000);
    } catch (e) {
        console.warn("Ringtone audio notice:", e);
    }
}


function stopRingtoneSound() {
    if (ringtoneInterval) {
        clearInterval(ringtoneInterval);
        ringtoneInterval = null;
    }
    if (ringtoneAudioCtx) {
        try { ringtoneAudioCtx.close(); } catch (e) {}
        ringtoneAudioCtx = null;
    }
}


function showActiveCallBar(status, isConnecting = true) {
    if (!activeCallBar) return;
    if (callStatusText) callStatusText.textContent = status;
    if (callPulseIndicator) {
        if (isConnecting) {
            callPulseIndicator.className = 'call-pulse-dot connecting';
            activeCallBar.className = 'active-call-bar connecting';
        } else {
            callPulseIndicator.className = 'call-pulse-dot';
            activeCallBar.className = 'active-call-bar';
        }
    }
    if (callDurationText) {
        if (isConnecting) callDurationText.classList.add('hidden');
        else callDurationText.classList.remove('hidden');
    }
    activeCallBar.classList.remove('hidden');
}


function setCallConnectedState() {
    if (!activeCall) return;
    stopRingtoneSound();
    showActiveCallBar(`In call with @${activeCall.partnerUsername}`, false);


    if (callDurationText) {
        callDurationText.classList.remove('hidden');
        callDurationText.textContent = "00:00";
    }


    if (activeCall.callTimerInterval) clearInterval(activeCall.callTimerInterval);
    activeCall.callStartTime = Date.now();
    activeCall.callTimerInterval = setInterval(() => {
        if (!activeCall || !activeCall.callStartTime) return;
        const elapsed = Math.floor((Date.now() - activeCall.callStartTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        if (callDurationText) callDurationText.textContent = `${mins}:${secs}`;
    }, 1000);
}


function cleanupCall(statusNotice = null) {
    stopRingtoneSound();
    if (callAmbientBackdrop) {
        callAmbientBackdrop.classList.add('hidden');
    }
    queuedIceCandidates = [];




    if (activeCall) {
        if (activeCall.dialingInterval) {
            clearInterval(activeCall.dialingInterval);
            activeCall.dialingInterval = null;
        }
        if (activeCall.callTimerInterval) {
            clearInterval(activeCall.callTimerInterval);
        }
        if (activeCall.localStream) {
            // Completely stop all audio tracks so the hardware microphone shuts down and recording dot disappears
            try {
                activeCall.localStream.getTracks().forEach(t => {
                    try { t.stop(); } catch (e) {}
                });
            } catch (e) {}
            activeCall.localStream = null;
        }
        if (activeCall.peerConnection) {
            try { activeCall.peerConnection.close(); } catch (e) {}
        }
        if (activeCall.callChannel && db) {
            try { db.removeChannel(activeCall.callChannel); } catch (e) {}
        }
        activeCall = null;
    }




    if (remoteAudioEl) {
        remoteAudioEl.srcObject = null;
    }




    isMicMuted = false;
    if (callMuteBtn) {
        callMuteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
        callMuteBtn.className = 'call-ctrl-btn secondary';
    }




    if (statusNotice && callStatusText) {
        callStatusText.textContent = statusNotice;
        setTimeout(() => {
            if (!activeCall && activeCallBar) activeCallBar.classList.add('hidden');
        }, 2000);
    } else if (activeCallBar) {
        activeCallBar.classList.add('hidden');
    }
}




function setupCallChannelListeners(callChan, pc) {
    callChan
        .on('broadcast', { event: 'incoming_call' }, (payload) => {
            const data = payload?.payload;
            if (!data || !data.callerId || data.callerId === currentUser?.id) return;
            if (!activeCall) {
                triggerIncomingCallUI(data);
            }
        })
        .on('broadcast', { event: 'webrtc_offer' }, async (payload) => {
            const data = payload?.payload;
            if (!data || !data.offer || data.from === currentUser?.id) return;
            try {
                if (!activeCall || !activeCall.peerConnection) return;
                const sdpInit = data.offer.sdp ? { type: data.offer.type || 'offer', sdp: data.offer.sdp } : data.offer;
                await pc.setRemoteDescription(new RTCSessionDescription(sdpInit));
                while (queuedIceCandidates.length > 0) {
                    const c = queuedIceCandidates.shift();
                    await pc.addIceCandidate(new RTCIceCandidate(c));
                }
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                const answerPayload = { answer: { type: answer.type, sdp: answer.sdp }, from: currentUser.id };
                callChan.send({ type: 'broadcast', event: 'webrtc_answer', payload: answerPayload });
                if (activeCall?.partnerId && db) {
                    try {
                        const callerSig = db.channel(`user_call_sig_${activeCall.partnerId}`);
                        callerSig.subscribe((st) => {
                            if (st === 'SUBSCRIBED') {
                                callerSig.send({ type: 'broadcast', event: 'webrtc_answer', payload: answerPayload });
                            }
                        });
                    } catch(e) {}
                }
            } catch (err) {
                console.error("Error handling webrtc_offer:", err);
            }
        })
        .on('broadcast', { event: 'webrtc_answer' }, async (payload) => {
            const data = payload?.payload;
            if (!data || !data.answer || data.from === currentUser?.id) return;
            if (activeCall?.dialingInterval) {
                clearInterval(activeCall.dialingInterval);
                activeCall.dialingInterval = null;
            }
            stopRingtoneSound();
            try {
                if (!activeCall || !activeCall.peerConnection) return;
                const sdpInit = data.answer.sdp ? { type: data.answer.type || 'answer', sdp: data.answer.sdp } : data.answer;
                await pc.setRemoteDescription(new RTCSessionDescription(sdpInit));
                while (queuedIceCandidates.length > 0) {
                    const c = queuedIceCandidates.shift();
                    await pc.addIceCandidate(new RTCIceCandidate(c));
                }
                if (activeCall.localIceCandidates && activeCall.localIceCandidates.length > 0) {
                    activeCall.localIceCandidates.forEach(cand => {
                        callChan.send({ type: 'broadcast', event: 'webrtc_ice', payload: { candidate: cand, from: currentUser.id } });
                    });
                }
            } catch (err) {
                console.error("Error handling webrtc_answer:", err);
            }
        })
        .on('broadcast', { event: 'webrtc_ice' }, async (payload) => {
            const data = payload?.payload;
            if (!data || !data.candidate || data.from === currentUser?.id) return;
            try {
                if (!activeCall || !activeCall.peerConnection) return;
                if (pc.remoteDescription && pc.remoteDescription.type) {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } else {
                    queuedIceCandidates.push(data.candidate);
                }
            } catch (err) {
                console.warn("Notice adding ICE candidate:", err);
            }
        })
        .on('broadcast', { event: 'receiver_ready' }, async (payload) => {
            const data = payload?.payload;
            if (activeCall && activeCall.isCaller && activeCall.peerConnection) {
                if (activeCall.peerConnection.localDescription) {
                    callChan.send({
                        type: 'broadcast',
                        event: 'webrtc_offer',
                        payload: { offer: activeCall.peerConnection.localDescription, from: currentUser.id }
                    });
                }
            }
        })
        .on('broadcast', { event: 'call_declined' }, () => {
            stopRingtoneSound();
            cleanupCall("Call Declined");
        })
        .on('broadcast', { event: 'call_busy' }, (payload) => {
            const data = payload?.payload;
            if (data?.from === currentUser?.id || !activeCall?.isCaller) return;
            stopRingtoneSound();
            cleanupCall("User is Busy");
        })
        .on('broadcast', { event: 'call_ended' }, () => {
            cleanupCall("Call Ended");
        });
}




async function startAudioCall() {
    if (!currentUser || !activeConversationId) {
        alert("Please select a conversation to start a call.");
        return;
    }
    const isGroupCall = !activeConversationPartnerId;
    if (activeCall) {
        alert("You are already on an audio call.");
        return;
    }




    try {
        const stream = await getMicrophoneStream();




        const rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };




        const pc = new RTCPeerConnection(rtcConfig);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));




        pc.ontrack = (event) => {
            if (remoteAudioEl && event.streams[0]) {
                remoteAudioEl.srcObject = event.streams[0];
                remoteAudioEl.play().catch(e => console.warn("Remote audio play notice:", e));
            }
        };




        const targetConvId = activeConversationId;
        const targetPartnerId = activeConversationPartnerId;
        const targetPartnerUsername = activeConversationPartnerUsername || 'User';




        const callChan = db.channel(`call_room_${targetConvId}`);




        activeCall = {
            peerConnection: pc,
            localStream: stream,
            conversationId: targetConvId,
            partnerId: targetPartnerId,
            partnerUsername: targetPartnerUsername,
            isCaller: true,
            callChannel: callChan,
            callStartTime: null,
            callTimerInterval: null,
            localIceCandidates: []
        };




        pc.onicecandidate = (event) => {
            if (event.candidate) {
                if (activeCall?.localIceCandidates) {
                    activeCall.localIceCandidates.push(event.candidate);
                }
                if (callChan) {
                    callChan.send({
                        type: 'broadcast',
                        event: 'webrtc_ice',
                        payload: { candidate: event.candidate, from: currentUser.id }
                    });
                }
            }
        };




        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                setCallConnectedState();
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                cleanupCall("Call Disconnected");
            }
        };




        setupCallChannelListeners(callChan, pc);




        // Pre-create offer before broadcasting so it is bundled directly in the invitation
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);




        const plainOffer = { type: offer.type, sdp: offer.sdp };
        const callPayload = {
            isGroup: isGroupCall,
            groupName: isGroupCall ? (chatHeader ? chatHeader.textContent : "Group Chat") : null,
            callerId: currentUser.id,
            callerUsername: currentUsername,
            callerAvatar: currentAvatarUrl,
            conversationId: targetConvId,
            offer: plainOffer
        };




        if (isGroupCall) {
            // Group Calling: Query all members of conversation
            const { data: members } = await db
                .from('conversation_members')
                .select('user_id')
                .eq('conversation_id', targetConvId)
                .neq('user_id', currentUser.id);




            const sendGroupSignals = () => {
                if (!activeCall || !activeCall.isCaller) return;
                try {
                    callChan.send({ type: 'broadcast', event: 'incoming_call', payload: callPayload });
                    callChan.send({ type: 'broadcast', event: 'webrtc_offer', payload: { offer: plainOffer, from: currentUser.id } });
                } catch (e) {}




                (members || []).forEach(m => {
                    try {
                        const mChan = db.channel(`user_call_sig_${m.user_id}`);
                        mChan.subscribe((st) => {
                            if (st === 'SUBSCRIBED') {
                                mChan.send({ type: 'broadcast', event: 'incoming_call', payload: callPayload });
                            }
                        });
                    } catch (e) {}
                });
            };




            await callChan.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    sendGroupSignals();
                    setTimeout(sendGroupSignals, 400);
                }
            });




            // Notify group members in database
            (members || []).forEach(m => {
                sendNotification(m.user_id, 'incoming_call', targetConvId, 'started a group call in ' + (callPayload.groupName || 'Chat'));
            });




            showActiveCallBar(`Group Call Active (Dialing members...)`, true);
            playRingtoneSound();




        } else {
            // 1-on-1 Calling
            const partnerSig = db.channel(`user_call_sig_${targetPartnerId}`, {
                config: { broadcast: { self: false } }
            });




            const sendCallSignals = () => {
                if (!activeCall || !activeCall.isCaller) return;
                try {
                    partnerSig.send({ type: 'broadcast', event: 'incoming_call', payload: callPayload });
                } catch (e) {}




                try {
                    callChan.send({ type: 'broadcast', event: 'incoming_call', payload: callPayload });
                    callChan.send({ type: 'broadcast', event: 'webrtc_offer', payload: { offer: plainOffer, from: currentUser.id } });
                } catch (e) {}
            };




            partnerSig.subscribe((sigStatus) => {
                if (sigStatus === 'SUBSCRIBED') {
                    sendCallSignals();
                    setTimeout(sendCallSignals, 350);
                    setTimeout(sendCallSignals, 1000);
                }
            });




            await callChan.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    sendCallSignals();
                }
            });




            // Layer 2: Repeated Dialing Pulses (every 2.5s for up to 35s)
            let dialCount = 0;
            activeCall.dialingInterval = setInterval(() => {
                if (!activeCall || !activeCall.isCaller || dialCount > 14) {
                    if (activeCall && activeCall.dialingInterval) {
                        clearInterval(activeCall.dialingInterval);
                        activeCall.dialingInterval = null;
                    }
                    if (dialCount > 14 && (!pc.connectionState || pc.connectionState !== 'connected')) {
                        cleanupCall("No Answer");
                    }
                    return;
                }
                dialCount++;
                sendCallSignals();
            }, 2500);




            // Layer 3: Database Signal Dispatch via user_notifications fallback
            sendNotification(targetPartnerId, 'incoming_call', targetConvId, 'is calling you...');




            showActiveCallBar(`Calling @${targetPartnerUsername}...`, true);
            playRingtoneSound();
        }




    } catch (err) {
        console.error("Audio call error:", err);
        alert("Could not access microphone: " + (err.message || err.name));
        cleanupCall();
    }
}




async function answerAudioCall() {
    if (!incomingCallData || !currentUser) return;
    stopRingtoneSound();
    if (incomingCallPopout) incomingCallPopout.classList.add('hidden');
    if (callAmbientBackdrop) callAmbientBackdrop.classList.add('hidden');




    const data = incomingCallData;
    incomingCallData = null;




    if (db && currentUser) {
        db.from('user_notifications')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('type', 'incoming_call')
            .catch(() => {});
    }




    try {
        const stream = await getMicrophoneStream();




        const rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };




        const pc = new RTCPeerConnection(rtcConfig);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));




        pc.ontrack = (event) => {
            if (remoteAudioEl && event.streams[0]) {
                remoteAudioEl.srcObject = event.streams[0];
                remoteAudioEl.play().catch(e => console.warn("Remote audio play notice:", e));
            }
        };




        const callChan = db.channel(`call_room_${data.conversationId}`);




        activeCall = {
            peerConnection: pc,
            localStream: stream,
            conversationId: data.conversationId,
            partnerId: data.callerId,
            partnerUsername: data.callerUsername || 'User',
            isCaller: false,
            callChannel: callChan,
            callStartTime: null,
            callTimerInterval: null,
            localIceCandidates: []
        };




        pc.onicecandidate = (event) => {
            if (event.candidate) {
                if (activeCall?.localIceCandidates) {
                    activeCall.localIceCandidates.push(event.candidate);
                }
                if (callChan) {
                    callChan.send({
                        type: 'broadcast',
                        event: 'webrtc_ice',
                        payload: { candidate: event.candidate, from: currentUser.id }
                    });
                }
                if (data.callerId && db) {
                    try {
                        const callerSig = db.channel(`user_call_sig_${data.callerId}`);
                        callerSig.subscribe((st) => {
                            if (st === 'SUBSCRIBED') {
                                callerSig.send({ type: 'broadcast', event: 'webrtc_ice', payload: { candidate: event.candidate, from: currentUser.id } });
                            }
                        });
                    } catch(e) {}
                }
            }
        };




        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                setCallConnectedState();
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                cleanupCall("Call Disconnected");
            }
        };




        setupCallChannelListeners(callChan, pc);




        // Robust offer processing
        const offerData = data && data.offer;
        const hasValidOffer = offerData && (offerData.sdp || typeof offerData === 'object');




        if (hasValidOffer) {
            try {
                const sdpInit = offerData.sdp ? { type: offerData.type || 'offer', sdp: offerData.sdp } : offerData;
                await pc.setRemoteDescription(new RTCSessionDescription(sdpInit));
                
                while (queuedIceCandidates.length > 0) {
                    const c = queuedIceCandidates.shift();
                    await pc.addIceCandidate(new RTCIceCandidate(c));
                }
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                const answerPayload = { answer: { type: answer.type, sdp: answer.sdp }, from: currentUser.id };
                const sendAnswer = () => {
                    callChan.send({ type: 'broadcast', event: 'webrtc_answer', payload: answerPayload });
                    if (data.callerId && db) {
                        try {
                            const callerSig = db.channel(`user_call_sig_${data.callerId}`);
                            callerSig.subscribe((st) => {
                                if (st === 'SUBSCRIBED') {
                                    callerSig.send({ type: 'broadcast', event: 'webrtc_answer', payload: answerPayload });
                                }
                            });
                        } catch(e) {}
                    }
                };
                await callChan.subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        sendAnswer();
                        setTimeout(sendAnswer, 300);
                    }
                });
            } catch (err) {
                console.error("Error setting up bundled offer:", err);
            }
        } else {
            await callChan.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    callChan.send({
                        type: 'broadcast',
                        event: 'receiver_ready',
                        payload: { from: currentUser.id }
                    });
                }
            });
        }




        if (data.isGroup) {
            showActiveCallBar(`Connecting to ${data.groupName || 'Group Call'}...`, true);
        } else {
            showActiveCallBar(`Connecting to @${data.callerUsername}...`, true);
        }




        // Open direct messages modal and select active conversation
        if (dmModal && dmModal.classList.contains('hidden')) {
            openMessagesModal();
        }
        if (data.isGroup) {
            selectConversation(data.conversationId, data.groupName || 'Group Chat', null, null, true);
        } else {
            selectConversation(data.conversationId, `@${data.callerUsername}`, data.callerId, data.callerUsername, true);
        }




    } catch (err) {
        console.error("Answer call error:", err);
        showToast({
            title: "Microphone Access Required",
            message: "Please allow microphone access to answer the voice call.",
            type: "error",
            icon: "🎤",
            force: true
        });
        cleanupCall();
    }
}




function declineAudioCall() {
    stopRingtoneSound();
    if (callAmbientBackdrop) callAmbientBackdrop.classList.add('hidden');
    if (incomingCallPopout) incomingCallPopout.classList.add('hidden');




    if (incomingCallData) {
        const convId = incomingCallData.conversationId;
        const callerId = incomingCallData.callerId;




        if (convId) recentlyDeclinedCalls.set(convId, Date.now());
        if (callerId) recentlyDeclinedCalls.set(callerId, Date.now());




        if (db) {
            try {
                const roomChan = db.channel(`call_room_${convId}`);
                roomChan.subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        roomChan.send({
                            type: 'broadcast',
                            event: 'call_declined',
                            payload: { from: currentUser?.id, conversationId: convId }
                        });
                    }
                });
            } catch (e) {}




            if (callerId) {
                try {
                    const callerSig = db.channel(`user_call_sig_${callerId}`);
                    callerSig.subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                            callerSig.send({
                                type: 'broadcast',
                                event: 'call_declined',
                                payload: { from: currentUser?.id, conversationId: convId }
                            });
                        }
                    });
                } catch (e) {}
            }
        }
    }




    if (db && currentUser) {
        db.from('user_notifications')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('type', 'incoming_call')
            .catch(() => {});
    }




    incomingCallData = null;
}




function toggleCallMute() {
    if (!activeCall || !activeCall.localStream) return;
    const tracks = activeCall.localStream.getAudioTracks();
    if (tracks.length === 0) return;




    isMicMuted = !isMicMuted;
    tracks[0].enabled = !isMicMuted;




    if (callMuteBtn) {
        callMuteBtn.innerHTML = isMicMuted ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
        callMuteBtn.title = isMicMuted ? 'Unmute Mic' : 'Mute Mic';
        if (isMicMuted) callMuteBtn.className = 'call-ctrl-btn muted';
        else callMuteBtn.className = 'call-ctrl-btn secondary';
    }
}




function endCurrentAudioCall() {
    if (activeCall) {
        if (activeCall.callChannel) {
            try {
                activeCall.callChannel.send({
                    type: 'broadcast',
                    event: 'call_ended',
                    payload: { from: currentUser?.id }
                });
            } catch (e) {}
        }
        if (activeCall.partnerId && db) {
            try {
                const partnerSig = db.channel(`user_call_sig_${activeCall.partnerId}`);
                partnerSig.subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        partnerSig.send({
                            type: 'broadcast',
                            event: 'cancel_call',
                            payload: { callerId: currentUser?.id }
                        });
                    }
                });
            } catch (e) {}
        }
    }
    cleanupCall("Call Ended");
}




function initUserCallSignaling() {
    if (!db || !currentUser) return;
    if (userCallSignalingChannel) {
        try { db.removeChannel(userCallSignalingChannel); } catch (e) {}
    }




    userCallSignalingChannel = db.channel(`user_call_sig_${currentUser.id}`)
        .on('broadcast', { event: 'incoming_call' }, (payload) => {
            const data = payload?.payload;
            if (!data || !data.callerId) return;




            if (activeCall) {
                if (activeCall.conversationId === data.conversationId || activeCall.partnerId === data.callerId) return;
                const returnChan = db.channel(`call_room_${data.conversationId}`);
                returnChan.subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        returnChan.send({
                            type: 'broadcast',
                            event: 'call_busy',
                            payload: { from: currentUser.id }
                        });
                    }
                });
                return;
            }




            if (!userNotifPrefs.allEnabled || !userNotifPrefs.calls) {
                // If user has disabled call notifications, auto decline/busy
                const returnChan = db.channel(`call_room_${data.conversationId}`);
                returnChan.subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        returnChan.send({ type: 'broadcast', event: 'call_declined', payload: { from: currentUser?.id } });
                    }
                });
                return;
            }




            triggerIncomingCallUI(data);
        })
        .on('broadcast', { event: 'cancel_call' }, (payload) => {
            const data = payload?.payload;
            if (incomingCallData && incomingCallData.callerId === data?.callerId) {
                stopRingtoneSound();
                incomingCallData = null;
                if (callAmbientBackdrop) callAmbientBackdrop.classList.add('hidden');
                if (incomingCallPopout) incomingCallPopout.classList.add('hidden');
            }
        })
        .on('broadcast', { event: 'call_declined' }, (payload) => {
            if (activeCall && activeCall.isCaller) {
                stopRingtoneSound();
                cleanupCall("Call Declined");
            }
        })
        .on('broadcast', { event: 'webrtc_answer' }, async (payload) => {
            const data = payload?.payload;
            if (!data || !data.answer || data.from === currentUser?.id) return;
            if (activeCall?.dialingInterval) {
                clearInterval(activeCall.dialingInterval);
                activeCall.dialingInterval = null;
            }
            stopRingtoneSound();
            try {
                if (!activeCall || !activeCall.peerConnection) return;
                const sdpInit = data.answer.sdp ? { type: data.answer.type || 'answer', sdp: data.answer.sdp } : data.answer;
                await activeCall.peerConnection.setRemoteDescription(new RTCSessionDescription(sdpInit));
                while (queuedIceCandidates.length > 0) {
                    const c = queuedIceCandidates.shift();
                    await activeCall.peerConnection.addIceCandidate(new RTCIceCandidate(c));
                }
                if (activeCall.localIceCandidates && activeCall.localIceCandidates.length > 0) {
                    activeCall.localIceCandidates.forEach(cand => {
                        if (activeCall?.callChannel) {
                            activeCall.callChannel.send({ type: 'broadcast', event: 'webrtc_ice', payload: { candidate: cand, from: currentUser.id } });
                        }
                    });
                }
            } catch (err) {
                console.error("Error handling webrtc_answer in user channel:", err);
            }
        })
        .on('broadcast', { event: 'webrtc_ice' }, async (payload) => {
            const data = payload?.payload;
            if (!data || !data.candidate || data.from === currentUser?.id) return;
            try {
                if (!activeCall || !activeCall.peerConnection) return;
                if (activeCall.peerConnection.remoteDescription && activeCall.peerConnection.remoteDescription.type) {
                    await activeCall.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                } else {
                    queuedIceCandidates.push(data.candidate);
                }
            } catch (err) {
                console.warn("Notice adding ICE candidate in user channel:", err);
            }
        })
        .on('broadcast', { event: 'voice_stage_invite' }, (payload) => {
            const data = payload?.payload;
            if (!data || !data.threadName) return;
            playTechChirp();
            showToast({
                title: "🎙️ Voice Stage Invite",
                message: `@${data.inviterUsername || 'Moderator'} invited you to join the Voice Stage in "${data.threadName}"!`,
                type: "info",
                icon: "🎙️",
                duration: 9000,
                onClick: () => {
                    navigateToThread(data.threadName);
                    setTimeout(() => openVoiceForumModal(data.threadName), 350);
                }
            });
        })
        .subscribe();
}
safeAddListener(startCallBtn, 'click', startAudioCall);
safeAddListener(acceptCallBtn, 'click', answerAudioCall);
safeAddListener(declineCallBtn, 'click', declineAudioCall);
safeAddListener(callMuteBtn, 'click', toggleCallMute);
safeAddListener(callHangupBtn, 'click', endCurrentAudioCall);




let userNotifRealtimeChannel = null;


function initRealtimeActivityNotifications() {
    if (!db || !currentUser) return;
    if (userNotifRealtimeChannel) {
        try { db.removeChannel(userNotifRealtimeChannel); } catch (e) {}
    }


    userNotifRealtimeChannel = db.channel(`user_realtime_notifs_${currentUser.id}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'user_notifications',
                filter: `user_id=eq.${currentUser.id}`
            },
            (payload) => {
                const notif = payload?.new;
                if (!notif) return;


                // 1. Update notification counters
                checkNotifications();
                loadUserNotifications();


                // 2. Map notification icons & vibes
                let icon = '🔔';
                let toastType = 'info';
                if (notif.type === 'upvote_post') { icon = '⚡'; toastType = 'success'; }
                else if (notif.type === 'comment_reply') { icon = '💬'; toastType = 'info'; }
                else if (notif.type === 'direct_message') { icon = '✉️'; toastType = 'info'; }
                else if (notif.type === 'friend_request') { icon = '➕'; toastType = 'success'; }
                else if (notif.type === 'voice_stage_invite') { icon = '🎙️'; toastType = 'info'; }


                // 3. Trigger Techno Toast
                if (!userNotifPrefs.allEnabled) return;
                if (notif.type === 'upvote_post' && !userNotifPrefs.upvotes) return;
                if (notif.type === 'comment_reply' && !userNotifPrefs.replies) return;
                if (notif.type === 'direct_message' && !userNotifPrefs.messages) return;


                showToast({
                    title: `@${notif.actor_username}`,
                    message: notif.message,
                    type: toastType,
                    icon: icon,
                    onClick: () => {
                        if (['upvote_post', 'comment_reply', 'upvote_comment'].includes(notif.type) && notif.entity_id) {
                            navigateToPost(notif.entity_id);
                        } else if (notif.type === 'direct_message' && notif.entity_id) {
                            navigateToConversation(notif.entity_id);
                        } else if (notif.type === 'voice_stage_invite' && notif.entity_id) {
                            navigateToThread(notif.entity_id);
                            setTimeout(() => openVoiceForumModal(notif.entity_id), 350);
                        }
                    }
                });
            }
        )
        .subscribe();
}




// =============================================================================
// DISCORD-STYLE LIVE CHAT VOICE FORUM (ZERO-COST WEBRTC AUDIO MESH / S2F)
// =============================================================================


async function navigateToThread(tName) {
    if (!tName) return;
    activeThread = tName;
    try { localStorage.setItem('forum_active_thread', activeThread); } catch(e) {}
    cachedPosts = [];
    if (typeof postCacheMap !== 'undefined' && postCacheMap) postCacheMap.clear();
    if (forumFeed) forumFeed.innerHTML = '<div class="no-posts">Loading posts...</div>';
    if (typeof renderJoinedThreadsSidebar === 'function') renderJoinedThreadsSidebar();
    if (typeof updateThreadControlsUI === 'function') updateThreadControlsUI();
    if (typeof loadForumPosts === 'function') await loadForumPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


const openVoiceStageBtn = document.getElementById('open-voice-stage-btn');
const voiceStageCountBadge = document.getElementById('voice-stage-count');
const voiceForumModal = document.getElementById('live-chat-modal');
const closeVoiceForumBtn = document.getElementById('close-voice-forum-btn');
const voiceStageThreadTitle = document.getElementById('voice-stage-thread-title');
const voiceStageStatusDesc = document.getElementById('voice-stage-status-desc');
const voiceStagePrivacyBadge = document.getElementById('voice-stage-privacy-badge');
const voiceStageModBar = document.getElementById('voice-stage-mod-bar');
const toggleVoiceStagePrivacyBtn = document.getElementById('toggle-voice-stage-privacy-btn');
const openVoiceInviteModalBtn = document.getElementById('open-voice-invite-modal-btn');
const voiceStageMuteAllBtn = document.getElementById('voice-stage-mute-all-btn');
const voiceSpeakersCount = document.getElementById('voice-speakers-count');
const voiceStageConnectionStatus = document.getElementById('voice-stage-connection-status');
const voiceStageGrid = document.getElementById('voice-stage-grid');
const voiceStageEmptyMsg = document.getElementById('voice-stage-empty-msg');
const voiceStageConnectBtn = document.getElementById('voice-stage-connect-btn');
const voiceStageMuteBtn = document.getElementById('voice-stage-mute-btn');
const voiceStageDeafenBtn = document.getElementById('voice-stage-deafen-btn');
const voiceStageSettingsBtn = document.getElementById('voice-stage-settings-btn');
const voiceStageDisconnectBtn = document.getElementById('voice-stage-disconnect-btn');


const voiceInviteModal = document.getElementById('voice-invite-modal');
const closeVoiceInviteBtn = document.getElementById('close-voice-invite-btn');
const voiceInviteUsernameInput = document.getElementById('voice-invite-username-input');
const sendVoiceInviteBtn = document.getElementById('send-voice-invite-btn');


let activeVoiceStageThread = null;
let voiceStageChannel = null;
let voiceStagePrivacy = 'open'; // 'open' | 'invite_only'
let voiceStageIsConnected = false;
let voiceStageIsMuted = false;
let voiceStageIsDeafened = false;
let voiceStageLocalStream = null;
let voiceStageAnalyser = null;
let voiceStageSpeakingInterval = null;
let lastSpeakingState = false;


const voiceStagePeers = new Map(); // peerId -> { pc, audioEl, queuedCandidates }
const voiceStageParticipants = new Map(); // userId -> participant Object
const voiceStageInvitedUserIds = new Set();


function sanitizeThreadChannel(name) {
    return 'voice_stage_' + encodeURIComponent(name || 'General').replace(/[^a-zA-Z0-9_-]/g, '_');
}


function getActiveVoiceStageCount(tName) {
    if (activeVoiceStageThread === tName && voiceStageParticipants.size > 0) {
        let count = 0;
        voiceStageParticipants.forEach(p => { if (p.is_connected) count++; });
        return count;
    }
    return 0;
}


function updateVoiceStagePrivacyUI() {
    if (voiceStagePrivacyBadge) {
        if (voiceStagePrivacy === 'invite_only') {
            voiceStagePrivacyBadge.textContent = "◈ Invite Only";
            voiceStagePrivacyBadge.className = "badge badge-yellow";
        } else {
            voiceStagePrivacyBadge.textContent = "◈ Open Stage";
            voiceStagePrivacyBadge.className = "badge badge-green";
        }
    }
    if (toggleVoiceStagePrivacyBtn) {
        toggleVoiceStagePrivacyBtn.textContent = voiceStagePrivacy === 'invite_only' ? "Make Open Stage" : "Make Invite Only";
    }
}


function openVoiceForumModal(threadName) {
    if (!currentUser) {
        alert("Please log in to join the voice stage.");
        return;
    }


    const targetThread = threadName || activeThread || 'General';


    if (voiceStageIsConnected && activeVoiceStageThread !== targetThread) {
        if (!confirm(`You are currently on the voice stage in "${activeVoiceStageThread}". Would you like to leave that stage and join "${targetThread}"?`)) {
            return;
        }
        disconnectFromVoiceStage();
    }


    activeVoiceStageThread = targetThread;


    if (voiceStageThreadTitle) {
        voiceStageThreadTitle.textContent = activeVoiceStageThread;
    }


    const role = getThreadRole(activeVoiceStageThread);
    const isModOrOwner = (role === 'Owner' || role === 'Site Admin' || role === 'Moderator');


    if (voiceStageModBar) {
        if (isModOrOwner) voiceStageModBar.classList.remove('hidden');
        else voiceStageModBar.classList.add('hidden');
    }


    updateVoiceStagePrivacyUI();


    if (voiceForumModal) {
        voiceForumModal.classList.remove('hidden');
    }


    // Hide floating telemetry to ensure crisp clean view
    const telemetryHud = document.getElementById('floating-telemetry');
    if (telemetryHud) telemetryHud.style.display = 'none';


    // Subscribe to room presence if not subscribed yet
    initVoiceStageRoomChannel(activeVoiceStageThread);
}


function closeVoiceForumModal() {
    if (voiceForumModal) {
        voiceForumModal.classList.add('hidden');
    }


    const telemetryHud = document.getElementById('floating-telemetry');
    if (telemetryHud) telemetryHud.style.display = 'flex';


    // If not connected, clean up channel subscription to save bandwidth
    if (!voiceStageIsConnected && voiceStageChannel) {
        try { db.removeChannel(voiceStageChannel); } catch (e) {}
        voiceStageChannel = null;
        voiceStageParticipants.clear();
    }
}


function initVoiceStageRoomChannel(threadName) {
    const chanName = sanitizeThreadChannel(threadName);


    if (voiceStageChannel) {
        if (voiceStageChannel.topic === chanName) {
            renderVoiceStageGrid();
            return;
        }
        try { db.removeChannel(voiceStageChannel); } catch (e) {}
        voiceStageChannel = null;
    }


    voiceStageParticipants.clear();
    renderVoiceStageGrid();


    voiceStageChannel = db.channel(chanName, {
        config: { presence: { key: currentUser.id } }
    });


    voiceStageChannel
        .on('presence', { event: 'sync' }, () => {
            const state = voiceStageChannel.presenceState();
            voiceStageParticipants.clear();
            let count = 0;
            for (const key in state) {
                const presences = state[key];
                if (presences && presences.length > 0) {
                    const p = presences[presences.length - 1];
                    voiceStageParticipants.set(p.user_id, p);
                    if (p.is_connected) count++;
                }
            }
            if (voiceSpeakersCount) voiceSpeakersCount.textContent = count;
            if (voiceStageCountBadge && activeThread === activeVoiceStageThread) {
                voiceStageCountBadge.textContent = count;
            }
            renderVoiceStageGrid();


            if (voiceStageIsConnected && voiceStageLocalStream) {
                syncMeshPeerConnections();
            }
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
            (newPresences || []).forEach(p => {
                voiceStageParticipants.set(p.user_id, p);
            });
            renderVoiceStageGrid();
            if (voiceStageIsConnected && voiceStageLocalStream) {
                syncMeshPeerConnections();
            }
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
            (leftPresences || []).forEach(p => {
                voiceStageParticipants.delete(p.user_id);
                closeStagePeer(p.user_id);
            });
            renderVoiceStageGrid();
        })
        .on('broadcast', { event: 'stage_webrtc_offer' }, async ({ payload }) => {
            if (!payload || payload.to !== currentUser.id || !voiceStageIsConnected) return;
            handleStageRemoteOffer(payload.from, payload.offer);
        })
        .on('broadcast', { event: 'stage_webrtc_answer' }, async ({ payload }) => {
            if (!payload || payload.to !== currentUser.id || !voiceStageIsConnected) return;
            handleStageRemoteAnswer(payload.from, payload.answer);
        })
        .on('broadcast', { event: 'stage_webrtc_ice' }, async ({ payload }) => {
            if (!payload || payload.to !== currentUser.id || !voiceStageIsConnected) return;
            handleStageRemoteIce(payload.from, payload.candidate);
        })
        .on('broadcast', { event: 'speaker_volume' }, ({ payload }) => {
            if (!payload || !payload.userId) return;
            const p = voiceStageParticipants.get(payload.userId);
            if (p) p.is_speaking = !!payload.speaking;
            const card = document.getElementById(`voice-participant-${payload.userId}`);
            if (card) {
                if (payload.speaking) card.classList.add('is-speaking');
                else card.classList.remove('is-speaking');
            }
        })
        .on('broadcast', { event: 'stage_privacy_mode' }, ({ payload }) => {
            if (!payload || !payload.mode) return;
            voiceStagePrivacy = payload.mode;
            updateVoiceStagePrivacyUI();
            showToast({
                title: "Stage Privacy Changed",
                message: `Voice Stage is now payload.mode==='inviteonly'?'InviteOnly':'OpentoEveryone'(by@{payload.moderatorUsername || 'Mod'}).`,
                type: "info",
                icon: payload.mode === 'invite_only' ? "🔒" : "🔓"
            });
        })
        .on('broadcast', { event: 'mod_command' }, ({ payload }) => {
            if (!payload) return;
            if (payload.action === 'mute' && payload.targetUserId === currentUser.id) {
                toggleVoiceStageMute(true);
                showToast({
                    title: "Muted by Moderator",
                    message: `@${payload.moderatorUsername || 'A moderator'} muted your microphone.`,
                    type: "warning",
                    icon: "🔇",
                    force: true
                });
            } else if (payload.action === 'kick' && payload.targetUserId === currentUser.id) {
                disconnectFromVoiceStage();
                closeVoiceForumModal();
                showToast({
                    title: "Removed from Stage",
                    message: `@${payload.moderatorUsername || 'A moderator'} removed you from the voice stage.`,
                    type: "error",
                    icon: "👢",
                    force: true
                });
            } else if (payload.action === 'mute_all') {
                const role = getThreadRole(activeVoiceStageThread);
                const isMod = (role === 'Owner' || role === 'Site Admin' || role === 'Moderator');
                if (!isMod && voiceStageIsConnected) {
                    toggleVoiceStageMute(true);
                    showToast({
                        title: "Stage Muted",
                        message: `@${payload.moderatorUsername || 'A moderator'} muted all stage speakers.`,
                        type: "warning",
                        icon: "🔇"
                    });
                }
            }
        })
        .on('broadcast', { event: 'stage_invite_added' }, ({ payload }) => {
            if (payload && payload.targetUserId) {
                voiceStageInvitedUserIds.add(payload.targetUserId);
            }
        })
        .subscribe();
}


async function connectToVoiceStage() {
    if (!currentUser) return;


    const role = getThreadRole(activeVoiceStageThread);
    const isModOrOwner = (role === 'Owner' || role === 'Site Admin' || role === 'Moderator');


    if (voiceStagePrivacy === 'invite_only' && !isModOrOwner && !voiceStageInvitedUserIds.has(currentUser.id)) {
        showToast({
            title: "Invite Only Stage",
            message: "This voice stage is currently invite-only. A thread moderator or owner must invite you to speak.",
            type: "warning",
            icon: "🔒"
        });
        return;
    }


    if (voiceStageConnectionStatus) {
        voiceStageConnectionStatus.textContent = "Connecting...";
        voiceStageConnectionStatus.style.color = "#38bdf8";
    }


    try {
        const stream = await getMicrophoneStream();
        voiceStageLocalStream = stream;
        voiceStageIsConnected = true;
        voiceStageIsMuted = false;


        // Set up speaking audio analyser
        const ctx = getSharedAudioContext();
        if (ctx) {
            try {
                if (ctx.state === 'suspended') await ctx.resume();
                const source = ctx.createMediaStreamSource(stream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                voiceStageAnalyser = analyser;


                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                if (voiceStageSpeakingInterval) clearInterval(voiceStageSpeakingInterval);


                voiceStageSpeakingInterval = setInterval(() => {
                    if (!voiceStageIsConnected || voiceStageIsMuted || !voiceStageAnalyser) return;
                    voiceStageAnalyser.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                    const avg = sum / dataArray.length;
                    const isSpeakingNow = avg > 14;


                    if (isSpeakingNow !== lastSpeakingState) {
                        lastSpeakingState = isSpeakingNow;
                        const selfCard = document.getElementById(`voice-participant-${currentUser.id}`);
                        if (selfCard) {
                            if (isSpeakingNow) selfCard.classList.add('is-speaking');
                            else selfCard.classList.remove('is-speaking');
                        }
                        if (voiceStageChannel) {
                            voiceStageChannel.send({
                                type: 'broadcast',
                                event: 'speaker_volume',
                                payload: { userId: currentUser.id, speaking: isSpeakingNow }
                            });
                        }
                    }
                }, 120);
            } catch (err) {
                console.warn("Could not start stage audio analyser:", err);
            }
        }


        // Track self in presence
        if (voiceStageChannel) {
            await voiceStageChannel.track({
                user_id: currentUser.id,
                username: currentUsername,
                avatar_url: currentAvatarUrl,
                role: role,
                is_muted: false,
                is_deafened: voiceStageIsDeafened,
                is_connected: true
            });
        }


        // Update UI Controls
        if (voiceStageConnectBtn) voiceStageConnectBtn.classList.add('hidden');
        if (voiceStageMuteBtn) {
            voiceStageMuteBtn.classList.remove('hidden');
            voiceStageMuteBtn.innerHTML = "Mute Mic";
            voiceStageMuteBtn.style.color = "";
        }
        if (voiceStageDisconnectBtn) voiceStageDisconnectBtn.classList.remove('hidden');


        if (voiceStageConnectionStatus) {
            voiceStageConnectionStatus.textContent = userAudioSettings.highFidelity ? "Connected (Hi-Fi 48kHz)" : "Connected (Mesh Active)";
            voiceStageConnectionStatus.style.color = "#10b981";
        }


        playTechChirp();


        showToast({
            title: "Voice Stage Joined",
            message: `Connected to Voice Stage in "${activeVoiceStageThread}".`,
            type: "success",
            icon: "🎙️"
        });


        // Trigger mesh sync
        syncMeshPeerConnections();


    } catch (err) {
        console.error("Voice stage connection error:", err);
        alert("Could not access microphone: " + (err.message || err.name));
        disconnectFromVoiceStage();
    }
}


function disconnectFromVoiceStage() {
    if (voiceStageSpeakingInterval) {
        clearInterval(voiceStageSpeakingInterval);
        voiceStageSpeakingInterval = null;
    }
    voiceStageAnalyser = null;
    lastSpeakingState = false;


    // Hardware microphone release
    if (voiceStageLocalStream) {
        voiceStageLocalStream.getTracks().forEach(track => {
            try { track.stop(); } catch (e) {}
        });
        voiceStageLocalStream = null;
    }


    // Close all WebRTC mesh peer connections
    voiceStagePeers.forEach(({ pc, audioEl }) => {
        try { pc.close(); } catch(e) {}
        try { audioEl.remove(); } catch(e) {}
    });
    voiceStagePeers.clear();


    voiceStageIsConnected = false;
    voiceStageIsMuted = false;


    // Untrack presence
    if (voiceStageChannel) {
        try { voiceStageChannel.untrack(); } catch(e) {}
    }


    if (voiceStageConnectBtn) voiceStageConnectBtn.classList.remove('hidden');
    if (voiceStageMuteBtn) voiceStageMuteBtn.classList.add('hidden');
    if (voiceStageDisconnectBtn) voiceStageDisconnectBtn.classList.add('hidden');


    if (voiceStageConnectionStatus) {
        voiceStageConnectionStatus.textContent = "Ready";
        voiceStageConnectionStatus.style.color = "#10b981";
    }


    renderVoiceStageGrid();


    showToast({
        title: "Voice Stage",
        message: "Disconnected from voice stage.",
        type: "info",
        icon: "🔴"
    });
}


function toggleVoiceStageMute(forceMute) {
    if (!voiceStageIsConnected || !voiceStageLocalStream) return;


    if (typeof forceMute === 'boolean') {
        voiceStageIsMuted = forceMute;
    } else {
        voiceStageIsMuted = !voiceStageIsMuted;
    }


    voiceStageLocalStream.getAudioTracks().forEach(t => {
        t.enabled = !voiceStageIsMuted;
    });


    if (voiceStageMuteBtn) {
        voiceStageMuteBtn.innerHTML = voiceStageIsMuted ? "Unmute Mic" : "Mute Mic";
        voiceStageMuteBtn.style.color = voiceStageIsMuted ? "#f87171" : "";
    }


    const selfCard = document.getElementById(`voice-participant-${currentUser.id}`);
    if (selfCard) {
        const ind = selfCard.querySelector('.voice-speaking-indicator');
        if (ind) ind.textContent = voiceStageIsMuted ? '🔇' : '🎤';
        if (voiceStageIsMuted) selfCard.classList.remove('is-speaking');
    }


    if (voiceStageChannel) {
        voiceStageChannel.track({
            user_id: currentUser.id,
            username: currentUsername,
            avatar_url: currentAvatarUrl,
            role: getThreadRole(activeVoiceStageThread),
            is_muted: voiceStageIsMuted,
            is_deafened: voiceStageIsDeafened,
            is_connected: true
        });
    }


    showToast({
        title: "Voice Stage",
        message: voiceStageIsMuted ? "Microphone muted." : "Microphone unmuted.",
        type: voiceStageIsMuted ? "warning" : "success",
        icon: voiceStageIsMuted ? "🔇" : "🎤"
    });
}


function toggleVoiceStageDeafen() {
    voiceStageIsDeafened = !voiceStageIsDeafened;


    if (voiceStageDeafenBtn) {
        voiceStageDeafenBtn.innerHTML = voiceStageIsDeafened ? "Deafened" : "Deafen";
        voiceStageDeafenBtn.style.color = voiceStageIsDeafened ? "#f87171" : "";
    }


    voiceStagePeers.forEach(({ audioEl }) => {
        if (audioEl) audioEl.muted = voiceStageIsDeafened || userAudioSettings.deafen;
    });


    if (voiceStageChannel && voiceStageIsConnected) {
        voiceStageChannel.track({
            user_id: currentUser.id,
            username: currentUsername,
            avatar_url: currentAvatarUrl,
            role: getThreadRole(activeVoiceStageThread),
            is_muted: voiceStageIsMuted,
            is_deafened: voiceStageIsDeafened,
            is_connected: true
        });
    }


    showToast({
        title: "Stage Audio",
        message: voiceStageIsDeafened ? "Deafened (all incoming audio muted)." : "Undeafened.",
        type: voiceStageIsDeafened ? "info" : "success",
        icon: voiceStageIsDeafened ? "🔇" : "🎧"
    });
}


function toggleVoiceStagePrivacy() {
    const role = getThreadRole(activeVoiceStageThread);
    const isMod = (role === 'Owner' || role === 'Site Admin' || role === 'Moderator');
    if (!isMod) {
        alert("Only thread moderators or owners can change stage privacy.");
        return;
    }


    voiceStagePrivacy = (voiceStagePrivacy === 'open' ? 'invite_only' : 'open');
    updateVoiceStagePrivacyUI();


    if (voiceStageChannel) {
        voiceStageChannel.send({
            type: 'broadcast',
            event: 'stage_privacy_mode',
            payload: {
                mode: voiceStagePrivacy,
                moderatorUsername: currentUsername
            }
        });
    }


    showToast({
        title: "Stage Privacy Changed",
        message: `Stage is now ${voiceStagePrivacy === 'invite_only' ? 'Invite Only' : 'Open to Everyone'}.`,
        type: "success",
        icon: voiceStagePrivacy === 'invite_only' ? "🔒" : "🔓"
    });
}


function muteParticipant(targetUserId, targetUsername) {
    const role = getThreadRole(activeVoiceStageThread);
    const isMod = (role === 'Owner' || role === 'Site Admin' || role === 'Moderator');
    if (!isMod) {
        alert("You must be a moderator to mute participants.");
        return;
    }
    if (voiceStageChannel) {
        voiceStageChannel.send({
            type: 'broadcast',
            event: 'mod_command',
            payload: {
                action: 'mute',
                targetUserId,
                moderatorUsername: currentUsername
            }
        });
    }
    showToast({
        title: "Participant Muted",
        message: `Mute signal sent to @${targetUsername || 'User'}.`,
        type: "info",
        icon: "🔇"
    });
}


function kickParticipant(targetUserId, targetUsername) {
    const role = getThreadRole(activeVoiceStageThread);
    const isMod = (role === 'Owner' || role === 'Site Admin' || role === 'Moderator');
    if (!isMod) {
        alert("You must be a moderator to kick participants.");
        return;
    }
    if (voiceStageChannel) {
        voiceStageChannel.send({
            type: 'broadcast',
            event: 'mod_command',
            payload: {
                action: 'kick',
                targetUserId,
                moderatorUsername: currentUsername
            }
        });
    }
    showToast({
        title: "Participant Kicked",
        message: `Removed @${targetUsername || 'User'} from the voice stage.`,
        type: "warning",
        icon: "👢"
    });
}


function muteAllStageParticipants() {
    const role = getThreadRole(activeVoiceStageThread);
    const isMod = (role === 'Owner' || role === 'Site Admin' || role === 'Moderator');
    if (!isMod) {
        alert("You must be a moderator to mute all participants.");
        return;
    }
    if (voiceStageChannel) {
        voiceStageChannel.send({
            type: 'broadcast',
            event: 'mod_command',
            payload: {
                action: 'mute_all',
                moderatorUsername: currentUsername
            }
        });
    }
    showToast({
        title: "Stage Muted",
        message: "Muted all non-moderator participants on stage.",
        type: "warning",
        icon: "🔇"
    });
}


async function sendVoiceStageInvite() {
    if (!voiceInviteUsernameInput) return;
    const rawVal = voiceInviteUsernameInput.value.trim();
    if (!rawVal) {
        alert("Please enter a username to invite.");
        return;
    }
    const cleanUser = rawVal.replace('@', '').toLowerCase();


    if (cleanUser === currentUsername.toLowerCase().replace('@', '')) {
        alert("You cannot invite yourself to the voice stage.");
        return;
    }


    if (sendVoiceInviteBtn) {
        sendVoiceInviteBtn.disabled = true;
        sendVoiceInviteBtn.textContent = "Dispatching...";
    }


    try {
        const { data: userRow, error } = await db
            .from('profiles')
            .select('id, username')
            .ilike('username', cleanUser)
            .single();


        if (error || !userRow) {
            showToast({
                title: "User Not Found",
                message: `Could not locate verified user @${cleanUser}`,
                type: "error",
                icon: "⚠️"
            });
            return;
        }


        voiceStageInvitedUserIds.add(userRow.id);


        if (voiceStageChannel) {
            voiceStageChannel.send({
                type: 'broadcast',
                event: 'stage_invite_added',
                payload: { targetUserId: userRow.id, threadName: activeVoiceStageThread }
            });
        }


        const targetSig = db.channel(`user_call_sig_${userRow.id}`);
        targetSig.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                targetSig.send({
                    type: 'broadcast',
                    event: 'voice_stage_invite',
                    payload: {
                        threadName: activeVoiceStageThread,
                        inviterUsername: currentUsername
                    }
                });
            }
        });


        await db.from('user_notifications').insert([{
            user_id: userRow.id,
            actor_username: currentUsername,
            type: 'voice_stage_invite',
            entity_id: activeVoiceStageThread,
            message: `invited you to the live Voice Stage in "${activeVoiceStageThread}"`
        }]).catch(() => {});


        voiceInviteUsernameInput.value = '';
        if (voiceInviteModal) voiceInviteModal.classList.add('hidden');


        showToast({
            title: "Invite Dispatched",
            message: `Invitation successfully sent to @${userRow.username}!`,
            type: "success",
            icon: "✉️"
        });


    } catch (err) {
        console.error("Voice invite dispatch error:", err);
        alert("Failed to send invite: " + err.message);
    } finally {
        if (sendVoiceInviteBtn) {
            sendVoiceInviteBtn.disabled = false;
            sendVoiceInviteBtn.textContent = "Dispatch Voice Invite";
        }
    }
}


// WebRTC Peer Mesh Peering
function syncMeshPeerConnections() {
    if (!voiceStageIsConnected || !voiceStageLocalStream) return;


    voiceStageParticipants.forEach(p => {
        if (p.user_id !== currentUser.id && p.is_connected) {
            if (!voiceStagePeers.has(p.user_id)) {
                // Deterministic offer creation: higher user ID creates offer
                if (currentUser.id > p.user_id) {
                    createStagePeerConnection(p.user_id, true);
                }
            }
        }
    });
}


async function createStagePeerConnection(peerId, isInitiator) {
    if (voiceStagePeers.has(peerId)) {
        return voiceStagePeers.get(peerId).pc;
    }


    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };


    const pc = new RTCPeerConnection(rtcConfig);


    if (voiceStageLocalStream) {
        voiceStageLocalStream.getTracks().forEach(track => {
            pc.addTrack(track, voiceStageLocalStream);
        });
    }


    let audioEl = document.getElementById(`voice-peer-audio-${peerId}`);
    if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.id = `voice-peer-audio-${peerId}`;
        audioEl.autoplay = true;
        audioEl.style.display = 'none';
        document.body.appendChild(audioEl);
    }
    audioEl.muted = voiceStageIsDeafened || userAudioSettings.deafen;


    pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
            audioEl.srcObject = event.streams[0];
            audioEl.play().catch(e => console.warn("Stage peer audio play error:", e));
        }
    };


    pc.onicecandidate = (event) => {
        if (event.candidate && voiceStageChannel) {
            voiceStageChannel.send({
                type: 'broadcast',
                event: 'stage_webrtc_ice',
                payload: { from: currentUser.id, to: peerId, candidate: event.candidate }
            });
        }
    };


    pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
            closeStagePeer(peerId);
        }
    };


    voiceStagePeers.set(peerId, { pc, audioEl, queuedCandidates: [] });


    if (isInitiator) {
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            if (voiceStageChannel) {
                voiceStageChannel.send({
                    type: 'broadcast',
                    event: 'stage_webrtc_offer',
                    payload: { from: currentUser.id, to: peerId, offer: { type: offer.type, sdp: offer.sdp } }
                });
            }
        } catch (err) {
            console.error(`Failed to create offer for stage peer ${peerId}:`, err);
        }
    }


    return pc;
}


async function handleStageRemoteOffer(fromUserId, offerData) {
    if (!voiceStageIsConnected || !voiceStageLocalStream) return;


    closeStagePeer(fromUserId);


    const pc = await createStagePeerConnection(fromUserId, false);
    const peerObj = voiceStagePeers.get(fromUserId);


    try {
        await pc.setRemoteDescription(new RTCSessionDescription(offerData));
        if (peerObj && peerObj.queuedCandidates) {
            while (peerObj.queuedCandidates.length > 0) {
                const c = peerObj.queuedCandidates.shift();
                await pc.addIceCandidate(new RTCIceCandidate(c));
            }
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);


        if (voiceStageChannel) {
            voiceStageChannel.send({
                type: 'broadcast',
                event: 'stage_webrtc_answer',
                payload: { from: currentUser.id, to: fromUserId, answer: { type: answer.type, sdp: answer.sdp } }
            });
        }
    } catch (err) {
        console.error(`Error handling stage offer from ${fromUserId}:`, err);
    }
}


async function handleStageRemoteAnswer(fromUserId, answerData) {
    const peerObj = voiceStagePeers.get(fromUserId);
    if (!peerObj || !peerObj.pc) return;
    try {
        await peerObj.pc.setRemoteDescription(new RTCSessionDescription(answerData));
        if (peerObj.queuedCandidates) {
            while (peerObj.queuedCandidates.length > 0) {
                const c = peerObj.queuedCandidates.shift();
                await peerObj.pc.addIceCandidate(new RTCIceCandidate(c));
            }
        }
    } catch (err) {
        console.error(`Error handling stage answer from ${fromUserId}:`, err);
    }
}


async function handleStageRemoteIce(fromUserId, candidate) {
    const peerObj = voiceStagePeers.get(fromUserId);
    if (!peerObj || !peerObj.pc) return;
    if (peerObj.pc.remoteDescription && peerObj.pc.remoteDescription.type) {
        try {
            await peerObj.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.error(`Error adding ICE candidate from ${fromUserId}:`, err);
        }
    } else {
        if (!peerObj.queuedCandidates) peerObj.queuedCandidates = [];
        peerObj.queuedCandidates.push(candidate);
    }
}


function closeStagePeer(peerId) {
    if (voiceStagePeers.has(peerId)) {
        const { pc, audioEl } = voiceStagePeers.get(peerId);
        try { pc.close(); } catch(e) {}
        try { audioEl.remove(); } catch(e) {}
        voiceStagePeers.delete(peerId);
    }
}


function renderVoiceStageGrid() {
    if (!voiceStageGrid) return;


    const participants = Array.from(voiceStageParticipants.values());
    if (participants.length === 0) {
        voiceStageGrid.innerHTML = '';
        if (voiceStageEmptyMsg) voiceStageEmptyMsg.classList.remove('hidden');
        return;
    }


    if (voiceStageEmptyMsg) voiceStageEmptyMsg.classList.add('hidden');


    const role = getThreadRole(activeVoiceStageThread);
    const isCurrentMod = (role === 'Owner' || role === 'Site Admin' || role === 'Moderator');


    voiceStageGrid.innerHTML = participants.map(p => {
        const isSelf = currentUser && p.user_id === currentUser.id;
        const pRole = p.role || 'Member';
        let roleBadgeClass = 'badge-blue';
        if (pRole === 'Owner') roleBadgeClass = 'badge-yellow';
        else if (pRole === 'Site Admin') roleBadgeClass = 'badge-purple';
        else if (pRole === 'Moderator') roleBadgeClass = 'badge-green';


        const isSpeaking = p.is_speaking;
        const isMuted = p.is_muted;
        const isDeafened = p.is_deafened;
        const micIcon = isMuted ? '🔇' : (isSpeaking ? '🟢' : '🎤');


        const showModActions = isCurrentMod && !isSelf;


        return `
            <div id="voice-participant-${escapeHTML(p.user_id)}" class="voice-participant-card isSpeaking?'is-speaking':''"data-userid="{escapeHTML(p.user_id)}">
                ${showModActions ? `
                    <div style="position: absolute; top: 4px; right: 4px; display: flex; gap: 2px; z-index: 10;">
                        <button type="button" class="voice-card-mute-btn" data-userid="escapeHTML(p.userid)"data-username="{escapeHTML(p.username || 'User')}" title="Mute Participant" style="background: rgba(30,41,59,0.8); border: 1px solid #334155; border-radius: 4px; color: #f87171; font-size: 0.72rem; padding: 2px 5px; cursor: pointer;">🔇</button>
                        <button type="button" class="voice-card-kick-btn" data-userid="escapeHTML(p.userid)"data-username="{escapeHTML(p.username || 'User')}" title="Kick from Stage" style="background: rgba(30,41,59,0.8); border: 1px solid #334155; border-radius: 4px; color: #ef4444; font-size: 0.72rem; padding: 2px 5px; cursor: pointer;">👢</button>
                    </div>
                ` : ''}
                <div class="voice-participant-avatar-wrap">
                    <img src="${p.avatar_url || DEFAULT_AVATAR}" class="voice-participant-avatar" alt="${escapeHTML(p.username || 'User')}">
                    <div class="voice-speaking-indicator" title="${isMuted ? 'Muted' : (isDeafened ? 'Deafened' : 'Active')}">${micIcon}</div>
                </div>
                <div class="voice-participant-name" title="@${escapeHTML(p.username || 'User')}">@${escapeHTML(p.username || 'User')}${isSelf ? ' (You)' : ''}</div>
                <div class="voice-participant-role badge ${roleBadgeClass}" style="font-size: 0.65rem; padding: 2px 6px;">${escapeHTML(pRole)}</div>
            </div>
        `;
    }).join('');


    voiceStageGrid.querySelectorAll('.voice-card-mute-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-userid');
            const targetName = btn.getAttribute('data-username');
            muteParticipant(targetId, targetName);
        });
    });


    voiceStageGrid.querySelectorAll('.voice-card-kick-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-userid');
            const targetName = btn.getAttribute('data-username');
            kickParticipant(targetId, targetName);
        });
    });
}


// Stage Event Listeners
safeAddListener(openVoiceStageBtn, 'click', () => openVoiceForumModal(activeThread));
safeAddListener(closeVoiceForumBtn, 'click', closeVoiceForumModal);
safeAddListener(voiceForumModal, 'click', (e) => {
    if (e.target === voiceForumModal) closeVoiceForumModal();
});


safeAddListener(voiceStageConnectBtn, 'click', connectToVoiceStage);
safeAddListener(voiceStageDisconnectBtn, 'click', disconnectFromVoiceStage);
safeAddListener(voiceStageMuteBtn, 'click', () => toggleVoiceStageMute());
safeAddListener(voiceStageDeafenBtn, 'click', toggleVoiceStageDeafen);
safeAddListener(toggleVoiceStagePrivacyBtn, 'click', toggleVoiceStagePrivacy);
safeAddListener(voiceStageMuteAllBtn, 'click', muteAllStageParticipants);


safeAddListener(voiceStageSettingsBtn, 'click', () => {
    openSettingsModal();
    switchSettingsTab('audio');
});


safeAddListener(openVoiceInviteModalBtn, 'click', () => {
    if (voiceInviteModal) {
        if (voiceInviteUsernameInput) voiceInviteUsernameInput.value = '';
        voiceInviteModal.classList.remove('hidden');
        setTimeout(() => { if (voiceInviteUsernameInput) voiceInviteUsernameInput.focus(); }, 100);
    }
});
safeAddListener(closeVoiceInviteBtn, 'click', () => {
    if (voiceInviteModal) voiceInviteModal.classList.add('hidden');
});
safeAddListener(voiceInviteModal, 'click', (e) => {
    if (e.target === voiceInviteModal) voiceInviteModal.classList.add('hidden');
});
safeAddListener(sendVoiceInviteBtn, 'click', sendVoiceStageInvite);






// =============================================================================
// GUEST / NON-SIGNED IN USER DISCLAIMER SYSTEM
// Alerts every guest visitor that an invite ticket is required to post or interact.
// =============================================================================
function triggerGuestDisclaimer() {
    // If logged in, do not show
    if (currentUser) return;


    const modal = document.getElementById('guest-disclaimer-modal');
    if (!modal) return;


    // Check if dismissed during current browser session
    if (sessionStorage.getItem('tg_guest_disclaimer_dismissed_session') === 'true') {
        return;
    }


    setTimeout(() => {
        if (!currentUser && modal) {
            modal.classList.remove('hidden');
        }
    }, 600);
}


function initGuestDisclaimer() {
    const modal = document.getElementById('guest-disclaimer-modal');
    const closeBtn = document.getElementById('close-guest-disclaimer-btn');
    const ackBtn = document.getElementById('acknowledge-guest-disclaimer-btn');
    const loginBtn = document.getElementById('guest-disclaimer-login-btn');


    if (!modal) return;


    const dismissModal = () => {
        modal.classList.add('hidden');
        try {
            sessionStorage.setItem('tg_guest_disclaimer_dismissed_session', 'true');
        } catch (e) {}
    };


    safeAddListener(closeBtn, 'click', dismissModal);
    safeAddListener(ackBtn, 'click', dismissModal);


    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            dismissModal();
        }
    });


    safeAddListener(loginBtn, 'click', () => {
        dismissModal();
        const authWrapper = document.getElementById('auth-panel-wrapper');
        if (authWrapper) {
            authWrapper.classList.remove('hidden');
            authWrapper.scrollIntoView({ behavior: 'smooth' });
        }
        const userInp = document.getElementById('auth-username');
        if (userInp) userInp.focus();
    });


    triggerGuestDisclaimer();
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGuestDisclaimer);
} else {
    initGuestDisclaimer();
}


function openVoiceStageInsideLiveChat(threadName) {
    const targetThread = threadName || activeThread || 'General';


    if (voiceStageIsConnected && activeVoiceStageThread !== targetThread) {
        if (!confirm(`You are currently on the voice stage in "${activeVoiceStageThread}". Would you like to leave that stage and join "${targetThread}"?`)) {
            return;
        }
        disconnectFromVoiceStage();
    }


    activeVoiceStageThread = targetThread;


    const role = getThreadRole(activeVoiceStageThread);
    const isModOrOwner = (role === 'Owner' || role === 'Site Admin' || role === 'Moderator');


    if (voiceStageModBar) {
        if (isModOrOwner) voiceStageModBar.classList.remove('hidden');
        else voiceStageModBar.classList.add('hidden');
    }


    updateVoiceStagePrivacyUI();
    initVoiceStageRoomChannel(activeVoiceStageThread);
}






// =============================================================================
// THREAD OPTIONS MODAL EVENT LISTENERS
// =============================================================================
const threadOptionsModal = document.getElementById('thread-options-modal');
const openThreadOptionsBtn = document.getElementById('open-thread-options-btn');
const closeThreadOptionsBtn = document.getElementById('close-thread-options-btn');


function openThreadOptionsModal() {
    if (threadOptionsModal) {
        if (typeof updateThreadControlsUI === 'function') updateThreadControlsUI();
        threadOptionsModal.classList.remove('hidden');
    }
}


function closeThreadOptionsModal() {
    if (threadOptionsModal) {
        threadOptionsModal.classList.add('hidden');
    }
}


safeAddListener(openThreadOptionsBtn, 'click', openThreadOptionsModal);
safeAddListener(closeThreadOptionsBtn, 'click', closeThreadOptionsModal);
safeAddListener(threadOptionsModal, 'click', (e) => {
    if (e.target === threadOptionsModal) closeThreadOptionsModal();
});


safeAddListener(document.getElementById('opt-set-banner-btn'), 'click', () => {
    closeThreadOptionsModal();
    const input = document.getElementById('banner-upload-input');
    if (input) input.click();
});


safeAddListener(document.getElementById('opt-manage-perms-btn'), 'click', () => {
    closeThreadOptionsModal();
    if (typeof openPermissionsManager === 'function') openPermissionsManager();
});


safeAddListener(document.getElementById('opt-manage-chat-btn'), 'click', () => {
    closeThreadOptionsModal();
    const chatBtn = document.getElementById('manage-chat-btn');
    if (chatBtn) chatBtn.click();
});


safeAddListener(document.getElementById('opt-set-flair-btn'), 'click', async () => {
    closeThreadOptionsModal();
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
});


safeAddListener(document.getElementById('opt-share-thread-btn'), 'click', () => {
    closeThreadOptionsModal();
    const shareBtn = document.getElementById('share-thread-btn');
    if (shareBtn) shareBtn.click();
});


safeAddListener(document.getElementById('opt-join-leave-btn'), 'click', () => {
    closeThreadOptionsModal();
    const joinLeaveBtn = document.getElementById('join-leave-active-thread-btn');
    if (joinLeaveBtn) joinLeaveBtn.click();
});


safeAddListener(document.getElementById('opt-delete-thread-btn'), 'click', () => {
    closeThreadOptionsModal();
    const delBtn = document.getElementById('delete-thread-btn');
    if (delBtn) delBtn.click();
});






// Viewport scroll progress indicator with smooth requestAnimationFrame syncing
let scrollProgressRaf = null;
function updateScrollProgress() {
    if (scrollProgressRaf) return;
    scrollProgressRaf = requestAnimationFrame(() => {
        scrollProgressRaf = null;
        const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const totalHeight = (document.documentElement.scrollHeight || document.body.scrollHeight || 0);
        const winHeight = window.innerHeight || document.documentElement.clientHeight || 1;
        const docHeight = totalHeight - winHeight;
        const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        const bar = document.getElementById('cyber-scroll-tracker');
        if (bar) {
            const clamped = Math.min(100, Math.max(0, percent));
            bar.style.width = `${clamped}%`;
        }
    });
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('touchmove', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress, { passive: true });
window.addEventListener('load', updateScrollProgress, { passive: true });
document.addEventListener('DOMContentLoaded', updateScrollProgress, { passive: true });

if (window.ResizeObserver && document.body) {
    try {
        const bodyObserver = new ResizeObserver(() => updateScrollProgress());
        bodyObserver.observe(document.body);
    } catch (e) {}
}




// Background koi simulation: graceful, top-down Japanese koi swimming through deep midnight water.
// Refined motion model:
// - travelling-wave body kinematics with fixed segment lengths
// - low-frequency irregular gait changes instead of repetitive sine motion
// - smooth, delayed steering and small propulsion bursts
// - independently flexing caudal membrane/rays
// - multi-lane wake that expands, curls and dissipates as it travels away
// - frame-rate-independent timing

function initBioluminescentSea() {
    const canvas = document.getElementById('bioluminescent-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const TAU = Math.PI * 2;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const lerp = (a, b, t) => a + (b - a) * t;

    const smoothstep = (edge0, edge1, x) => {
        const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    };

    const angleDifference = (target, current) => {
        let diff = target - current;
        while (diff < -Math.PI) diff += TAU;
        while (diff > Math.PI) diff -= TAU;
        return diff;
    };

    const smoothToward = (current, target, response, dt) => {
        return current + (target - current) * (1 - Math.exp(-response * dt));
    };

    const resizeCanvas = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    class TrueKoi {
        constructor(w, h, scale = 1.0) {
            this.w = w;
            this.h = h;
            this.scale = scale;

            this.x = Math.random() * w;
            this.y = Math.random() * h;

            // Each fish has its own quiet "personality".
            this.cruiseSpeed =
                (28 + Math.random() * 7) *
                (1.03 - (scale - 1) * 0.07);

            this.speed = this.cruiseSpeed;
            this.speedTarget = this.cruiseSpeed;

            this.angle = Math.random() * TAU;
            this.turnVelocity = 0;
            this.turnTarget = 0;

            // Irregular wandering is made from slowly changing targets,
            // rather than frame-to-frame random steering.
            this.wanderTarget = 0;
            this.wander = 0;
            this.behaviorTimer = 1.8 + Math.random() * 3.6;

            // Occasional small propulsion accents.
            this.burst = 0;
            this.burstTarget = 0;
            this.burstTimer = 3.0 + Math.random() * 7.0;

            // Gait.
            this.swimPhase = Math.random() * TAU;
            this.swimRate = 1.90 + Math.random() * 0.26;
            this.swimRateTarget = this.swimRate;

            this.phaseLag = 0.30 + Math.random() * 0.035;

            this.bodyBend = 0.24 + Math.random() * 0.045;
            this.bodyBendTarget = this.bodyBend;

            this.harmonic = 0.022 + Math.random() * 0.020;
            this.asymmetry =
                (Math.random() - 0.5) *
                0.045;

            this.waveOffset = Math.random() * TAU;
            this.waveOffset2 = Math.random() * TAU;

            // A slow, non-repeating gait drift.
            this.gaitDrift = Math.random() * TAU;
            this.gaitDriftRate =
                0.16 + Math.random() * 0.07;

            // More spine stations produce a smoother anatomical curve.
            this.numVertebrae = 16;
            this.segDist = 3.75 * scale;
            this.tailBaseIndex = this.numVertebrae - 2;

            this.bodyWidths = [
                3.6 * scale,
                5.3 * scale,
                8.4 * scale,
                10.4 * scale,
                11.2 * scale,
                11.4 * scale,
                10.9 * scale,
                9.8 * scale,
                8.5 * scale,
                7.1 * scale,
                5.9 * scale,
                4.8 * scale,
                3.8 * scale,
                3.0 * scale,
                2.25 * scale,
                0.85 * scale
            ];

            this.spine = [];
            this.buildSpine();

            // Flowing wake lanes. Five lanes read as a soft water trail,
            // rather than three rigid glowing ropes.
            this.wakeLanes = [-1.0, -0.5, 0, 0.5, 1.0];
            this.wakeParticles = [];
            this.wakeClock = 0;
            this.maxWakeAge = 2.7;
        }

        buildSpine() {
            this.spine.length = this.numVertebrae;

            this.spine[0] = {
                x: this.x,
                y: this.y
            };

            // Slow gait modulation changes the body stroke over many cycles.
            const gaitNoise =
                Math.sin(this.gaitDrift) * 0.018 +
                Math.sin(this.gaitDrift * 0.43 + this.waveOffset) * 0.012;

            const bendAmount =
                clamp(
                    this.bodyBend +
                    gaitNoise,
                    0.16,
                    0.33
                );

            for (let i = 1; i < this.numVertebrae; i++) {
                const p = i / (this.numVertebrae - 1);

                // Head remains comparatively rigid; the caudal half carries
                // most of the bending.
                const gain =
                    Math.pow(
                        smoothstep(0.02, 0.95, p),
                        1.45
                    );

                // Travelling wave.
                const phase =
                    this.swimPhase -
                    i * this.phaseLag;

                let bend =
                    bendAmount *
                    gain *
                    Math.sin(phase);

                // Weak second harmonic breaks the mathematically perfect wave.
                bend +=
                    this.harmonic *
                    Math.pow(p, 1.9) *
                    Math.sin(
                        phase * 1.91 -
                        i * 0.23 +
                        this.waveOffset
                    );

                // Very low-frequency asymmetry makes each side of a stroke
                // slightly different without looking jittery.
                bend +=
                    this.asymmetry *
                    Math.pow(p, 1.65) *
                    Math.sin(
                        this.swimPhase * 0.46 +
                        i * 0.19 +
                        this.waveOffset2
                    );

                // The tail follows a turn after the head does.
                const bodyTravelTime =
                    (i * this.segDist) /
                    Math.max(this.speed, 1);

                const steeringLag =
                    clamp(
                        this.turnVelocity *
                        bodyTravelTime *
                        0.92,
                        -0.50,
                        0.50
                    );

                // During a brief propulsion burst the caudal half bends
                // a little more, while the head remains calm.
                const burstBend =
                    this.burst *
                    0.045 *
                    Math.pow(p, 2.1) *
                    Math.sin(
                        phase - 0.75
                    );

                const localAngle =
                    this.angle +
                    bend +
                    burstBend -
                    steeringLag;

                this.spine[i] = {
                    x:
                        this.spine[i - 1].x -
                        Math.cos(localAngle) *
                        this.segDist,

                    y:
                        this.spine[i - 1].y -
                        Math.sin(localAngle) *
                        this.segDist
                };
            }
        }

        chooseBehavior() {
            // Wander target stays small enough that fish remain graceful.
            this.wanderTarget =
                clamp(
                    this.wanderTarget +
                    (Math.random() - 0.5) * 0.28,
                    -0.34,
                    0.34
                );

            this.speedTarget =
                this.cruiseSpeed *
                (0.93 + Math.random() * 0.12);

            this.swimRateTarget =
                1.84 + Math.random() * 0.34;

            this.bodyBendTarget =
                0.215 + Math.random() * 0.075;

            this.behaviorTimer =
                1.6 + Math.random() * 4.8;
        }

        chooseBurst() {
            // Bursts are infrequent and short. Most frames remain relaxed.
            if (Math.random() < 0.28) {
                this.burstTarget =
                    0.50 + Math.random() * 0.50;

                this.burstTimer =
                    0.35 + Math.random() * 0.60;
            } else {
                this.burstTarget = 0;
                this.burstTimer =
                    3.5 + Math.random() * 8.0;
            }
        }

        updateBehavior(dt) {
            this.behaviorTimer -= dt;

            if (this.behaviorTimer <= 0) {
                this.chooseBehavior();
            }

            this.burstTimer -= dt;

            if (this.burstTimer <= 0) {
                this.chooseBurst();
            }

            this.wander =
                smoothToward(
                    this.wander,
                    this.wanderTarget,
                    0.55,
                    dt
                );

            this.speed =
                smoothToward(
                    this.speed,
                    this.speedTarget *
                    (1 + 0.085 * this.burst),
                    0.70,
                    dt
                );

            this.swimRate =
                smoothToward(
                    this.swimRate,
                    this.swimRateTarget +
                    0.16 * this.burst,
                    0.50,
                    dt
                );

            this.bodyBend =
                smoothToward(
                    this.bodyBend,
                    this.bodyBendTarget +
                    0.045 * this.burst,
                    0.45,
                    dt
                );

            this.burst =
                smoothToward(
                    this.burst,
                    this.burstTarget,
                    3.2,
                    dt
                );

            this.gaitDrift +=
                this.gaitDriftRate * dt;

            // Turn command is composed of a slow wander plus a tiny,
            // filtered sinusoidal drift. This avoids mechanical arcs.
            const drift =
                0.035 *
                Math.sin(
                    this.gaitDrift +
                    this.waveOffset
                ) +
                0.018 *
                Math.sin(
                    this.gaitDrift * 0.47 +
                    this.waveOffset2
                );

            const desiredTurn =
                clamp(
                    this.wander + drift,
                    -0.39,
                    0.39
                );

            this.turnTarget =
                smoothToward(
                    this.turnTarget,
                    desiredTurn,
                    1.0,
                    dt
                );

            this.turnVelocity =
                smoothToward(
                    this.turnVelocity,
                    this.turnTarget,
                    1.7,
                    dt
                );

            this.turnVelocity =
                clamp(
                    this.turnVelocity,
                    -0.42,
                    0.42
                );
        }

        update(w, h, dt) {
            this.w = w;
            this.h = h;

            this.updateBehavior(dt);

            this.swimPhase +=
                this.swimRate * dt;

            // Move the head. Propulsion is strongest around the middle of
            // the stroke and intentionally mild overall.
            const propulsion =
                1 +
                0.018 *
                Math.sin(
                    this.swimPhase - 1.15
                ) +
                0.022 * this.burst;

            this.angle +=
                this.turnVelocity * dt;

            this.x +=
                Math.cos(this.angle) *
                this.speed *
                propulsion *
                dt;

            this.y +=
                Math.sin(this.angle) *
                this.speed *
                propulsion *
                dt;

            // Screen wrapping without dragging a wake across the entire page.
            const pad = 170;

            let wrapped = false;
            let shiftX = 0;
            let shiftY = 0;

            if (this.x < -pad) {
                shiftX = w + pad * 2;
                wrapped = true;
            } else if (this.x > w + pad) {
                shiftX = -(w + pad * 2);
                wrapped = true;
            }

            if (this.y < -pad) {
                shiftY = h + pad * 2;
                wrapped = true;
            } else if (this.y > h + pad) {
                shiftY = -(h + pad * 2);
                wrapped = true;
            }

            if (wrapped) {
                this.x += shiftX;
                this.y += shiftY;

                this.wakeParticles.length = 0;
            }

            this.buildSpine();
            this.updateWake(dt);
        }

        getBodyAngle(index) {
            const last = this.numVertebrae - 1;

            const prev =
                this.spine[
                    Math.max(0, index - 1)
                ];

            const next =
                this.spine[
                    Math.min(last, index + 1)
                ];

            return Math.atan2(
                next.y - prev.y,
                next.x - prev.x
            );
        }

        spawnWakeParticle(lane) {
            const tailIndex =
                this.spine.length - 1;

            const tail =
                this.spine[tailIndex];

            const previous =
                this.spine[tailIndex - 1];

            // The tail-to-body tangent is the water's forward reference.
            // Wake advection below travels in the opposite direction, away
            // from the fish rather than back toward its body.
            const heading =
                Math.atan2(
                    previous.y - tail.y,
                    previous.x - tail.x
                );

            const normalX =
                -Math.sin(heading);

            const normalY =
                Math.cos(heading);

            // A lane starts close to the tail, then the current evolves
            // naturally in the water.
            const initialSpread =
                lane *
                (3.2 +
                Math.abs(lane) *
                2.5) *
                this.scale;

            this.wakeParticles.push({
                x:
                    tail.x +
                    normalX *
                    initialSpread,

                y:
                    tail.y +
                    normalY *
                    initialSpread,

                heading:
                    heading +
                    lane *
                    0.025,

                lane,
                age: 0,

                // Each strand gets its own quiet phase so the wake never
                // looks like five identical copies of one line.
                phase:
                    Math.random() * TAU,

                energy:
                    0.82 +
                    Math.random() * 0.18
            });
        }

        updateWake(dt) {
            this.wakeClock += dt;

            const wakeInterval = 0.048;

            while (this.wakeClock >= wakeInterval) {
                this.wakeClock -= wakeInterval;

                for (const lane of this.wakeLanes) {
                    this.spawnWakeParticle(
                        lane
                    );
                }
            }

            for (const particle of this.wakeParticles) {
                particle.age += dt;

                const t =
                    clamp(
                        particle.age /
                        this.maxWakeAge,
                        0,
                        1
                    );

                const spread =
                    Math.pow(t, 1.28);

                // Wake drifts backward relative to the fish.
                // It slows and disperses with age.
                const reverseSpeed =
                    this.speed *
                    (0.19 +
                    0.10 * (1 - t));

                // Slowly curving flow field.
                const curl =
                    (
                        0.15 +
                        0.52 * spread
                    ) *
                    Math.sin(
                        particle.phase +
                        particle.age * 1.55 +
                        particle.lane * 1.7
                    );

                const normalX =
                    -Math.sin(
                        particle.heading
                    );

                const normalY =
                    Math.cos(
                        particle.heading
                    );

                particle.heading +=
                    curl *
                    0.48 *
                    dt;

                const forwardX =
                    Math.cos(
                        particle.heading
                    );

                const forwardY =
                    Math.sin(
                        particle.heading
                    );

                // Persistent lane separation plus growing lateral diffusion.
                const lateralFlow =
                    (
                        particle.lane *
                        2.6 *
                        this.scale +
                        Math.sin(
                            particle.phase +
                            particle.age * 1.9
                        ) *
                        (1.0 +
                        7.0 * spread) *
                        this.scale
                    );

                particle.x +=
                    -forwardX *
                    reverseSpeed *
                    dt +
                    normalX *
                    lateralFlow *
                    0.42 *
                    dt;

                particle.y +=
                    -forwardY *
                    reverseSpeed *
                    dt +
                    normalY *
                    lateralFlow *
                    0.42 *
                    dt;

                particle.energy =
                    (
                        1 - t
                    ) *
                    (
                        0.82 +
                        0.18 *
                        Math.cos(
                            particle.age *
                            1.8 +
                            particle.phase
                        )
                    );
            }

            this.wakeParticles =
                this.wakeParticles.filter(
                    particle =>
                        particle.age <
                        this.maxWakeAge
                );
        }

        drawWake(ctx) {
            if (this.wakeParticles.length < 8) {
                return;
            }

            // One stream per lane. Particles are already maintained
            // in insertion order, so no per-frame sorting is necessary.
            for (const lane of this.wakeLanes) {
                const stream =
                    this.wakeParticles
                        .filter(
                            p =>
                                p.lane === lane
                        );

                if (stream.length < 2) {
                    continue;
                }

                // Older wake is farther away and more diffuse.
                ctx.beginPath();

                let started = false;

                for (let i = 0; i < stream.length; i++) {
                    const p = stream[i];

                    const fade =
                        clamp(
                            1 -
                            p.age /
                            this.maxWakeAge,
                            0,
                            1
                        );

                    const x = p.x;
                    const y = p.y;

                    if (!started) {
                        ctx.moveTo(x, y);
                        started = true;
                    } else {
                        const previous =
                            stream[i - 1];

                        const midX =
                            (previous.x + x) *
                            0.5;

                        const midY =
                            (previous.y + y) *
                            0.5;

                        ctx.quadraticCurveTo(
                            previous.x,
                            previous.y,
                            midX,
                            midY
                        );
                    }

                    // Stop wildly displaced numerical outliers.
                    if (
                        i > 0 &&
                        Math.hypot(
                            x - stream[i - 1].x,
                            y - stream[i - 1].y
                        ) > 38
                    ) {
                        break;
                    }

                    if (fade < 0.02) {
                        break;
                    }
                }

                const newest =
                    stream[stream.length - 1];

                const laneStrength =
                    lane === 0
                        ? 1
                        : 0.55;

                const fade =
                    newest
                        ? clamp(
                            1 -
                            newest.age /
                            this.maxWakeAge,
                            0,
                            1
                        )
                        : 0;

                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // Broad diffuse wash.
                ctx.strokeStyle =
                    'rgba(0, 240, 255, ' +
                    (
                        0.065 *
                        laneStrength *
                        fade
                    ) +
                    ')';

                ctx.lineWidth =
                    (
                        5.0 +
                        10.0 *
                        (1 - fade)
                    ) *
                    this.scale *
                    (lane === 0
                        ? 0.95
                        : 0.72);

                ctx.stroke();

                // Thin glowing core that disappears faster than the wash.
                ctx.beginPath();

                started = false;

                for (let i = 0; i < stream.length; i++) {
                    const p = stream[i];

                    if (!started) {
                        ctx.moveTo(
                            p.x,
                            p.y
                        );
                        started = true;
                    } else {
                        const previous =
                            stream[i - 1];

                        const midX =
                            (previous.x + p.x) *
                            0.5;

                        const midY =
                            (previous.y + p.y) *
                            0.5;

                        ctx.quadraticCurveTo(
                            previous.x,
                            previous.y,
                            midX,
                            midY
                        );
                    }
                }

                ctx.strokeStyle =
                    'rgba(56, 189, 248, ' +
                    (
                        0.20 *
                        laneStrength *
                        fade *
                        fade
                    ) +
                    ')';

                ctx.lineWidth =
                    0.82 *
                    this.scale *
                    (lane === 0
                        ? 1
                        : 0.75);

                ctx.stroke();
            }
        }

        getTailGeometry() {
            const root =
                this.spine[
                    this.tailBaseIndex
                ];

            const previous =
                this.spine[
                    this.tailBaseIndex - 1
                ];

            const next =
                this.spine[
                    this.tailBaseIndex + 1
                ];

            const tailAngle =
                Math.atan2(
                    next.y - previous.y,
                    next.x - previous.x
                );

            const forwardX =
                Math.cos(tailAngle);

            const forwardY =
                Math.sin(tailAngle);

            const sideX =
                -forwardY;

            const sideY =
                forwardX;

            const tailLength =
                31 *
                this.scale;

            const tailSpread =
                15.5 *
                this.scale;

            const points = [];

            for (let i = 0; i < 15; i++) {
                const u =
                    -1 +
                    (i / 14) * 2;

                const absU =
                    Math.abs(u);

                // Central notch plus gently tapered upper/lower edges.
                const radial =
                    tailLength *
                    (
                        0.79 +
                        0.21 *
                        Math.pow(
                            absU,
                            1.35
                        )
                    );

                const lateral =
                    u *
                    tailSpread *
                    (
                        0.92 +
                        0.08 *
                        Math.pow(
                            absU,
                            0.7
                        )
                    );

                const edgeWeight =
                    0.26 +
                    0.74 *
                    Math.pow(
                        absU,
                        0.9
                    );

                // Fin membrane lags the body and folds slightly more
                // at the free edges.
                let flex =
                    (
                        0.105 +
                        0.06 * this.burst
                    ) *
                    edgeWeight *
                    Math.sin(
                        this.swimPhase -
                        2.25 -
                        absU * 0.28
                    );

                flex +=
                    0.026 *
                    edgeWeight *
                    Math.sin(
                        this.swimPhase *
                        2.03 +
                        u * 2.3 +
                        this.waveOffset
                    );

                // Different parts of the two lobes are very slightly
                // asynchronous.
                flex +=
                    this.asymmetry *
                    0.55 *
                    Math.sin(
                        this.swimPhase * 0.76 +
                        u * 1.4 +
                        this.waveOffset2
                    );

                const cosFlex =
                    Math.cos(flex);

                const sinFlex =
                    Math.sin(flex);

                const localX =
                    forwardX * radial +
                    sideX * lateral;

                const localY =
                    forwardY * radial +
                    sideY * lateral;

                points.push({
                    x:
                        root.x +
                        localX * cosFlex -
                        localY * sinFlex,

                    y:
                        root.y +
                        localX * sinFlex +
                        localY * cosFlex,

                    u,
                    edgeWeight
                });
            }

            return {
                root,
                tailAngle,
                forwardX,
                forwardY,
                sideX,
                sideY,
                points,
                tailLength,
                tailSpread
            };
        }

        drawTail(ctx) {
            const geometry =
                this.getTailGeometry();

            const root =
                geometry.root;

            const points =
                geometry.points;

            if (points.length < 3) {
                return;
            }

            ctx.beginPath();

            ctx.moveTo(
                root.x,
                root.y
            );

            for (let i = 0; i < points.length - 1; i++) {
                const current = points[i];
                const next = points[i + 1];

                const midX =
                    (current.x + next.x) * 0.5;

                const midY =
                    (current.y + next.y) * 0.5;

                ctx.quadraticCurveTo(
                    current.x,
                    current.y,
                    midX,
                    midY
                );
            }

            const finalPoint =
                points[points.length - 1];

            ctx.lineTo(
                finalPoint.x,
                finalPoint.y
            );

            // Curved lower edge returns to the root.
            const center =
                points[7];

            ctx.quadraticCurveTo(
                center.x * 0.48 +
                root.x * 0.52,

                center.y * 0.48 +
                root.y * 0.52,

                root.x,
                root.y
            );

            ctx.closePath();

            ctx.fillStyle =
                'rgba(0, 240, 255, 0.18)';

            ctx.fill();

            ctx.strokeStyle =
                'rgba(56, 189, 248, 0.68)';

            ctx.lineWidth =
                1.05 *
                this.scale;

            ctx.stroke();

            // Fin rays now bow with the membrane instead of radiating
            // as rigid straight spokes.
            for (let i = 0; i < points.length; i++) {
                const p = points[i];

                const t =
                    0.72 +
                    0.12 *
                    p.edgeWeight;

                const endX =
                    root.x +
                    (p.x - root.x) *
                    t;

                const endY =
                    root.y +
                    (p.y - root.y) *
                    t;

                const bow =
                    Math.sin(
                        this.swimPhase -
                        2.6 +
                        i * 0.18
                    ) *
                    (0.8 +
                    1.3 * p.edgeWeight) *
                    this.scale;

                const controlX =
                    root.x +
                    (endX - root.x) *
                    0.55 -
                    geometry.sideX *
                    bow;

                const controlY =
                    root.y +
                    (endY - root.y) *
                    0.55 -
                    geometry.sideY *
                    bow;

                ctx.beginPath();

                ctx.moveTo(
                    root.x,
                    root.y
                );

                ctx.quadraticCurveTo(
                    controlX,
                    controlY,
                    endX,
                    endY
                );

                ctx.strokeStyle =
                    'rgba(0, 240, 255, 0.24)';

                ctx.lineWidth =
                    0.62 *
                    this.scale;

                ctx.stroke();
            }

            // Fine central vane.
            const centerPoint =
                points[7];

            ctx.beginPath();

            ctx.moveTo(
                root.x,
                root.y
            );

            ctx.quadraticCurveTo(
                root.x +
                geometry.forwardX *
                geometry.tailLength *
                0.60,

                root.y +
                geometry.forwardY *
                geometry.tailLength *
                0.60,

                centerPoint.x,
                centerPoint.y
            );

            ctx.strokeStyle =
                'rgba(56, 189, 248, 0.31)';

            ctx.lineWidth =
                0.65 *
                this.scale;

            ctx.stroke();
        }

        drawPectoralFins(ctx) {
            const anchorIndex = 3;

            const anchor =
                this.spine[
                    anchorIndex
                ];

            const bodyAngle =
                this.getBodyAngle(
                    anchorIndex
                );

            const finLength =
                20.5 *
                this.scale;

            for (
                let side = -1;
                side <= 1;
                side += 2
            ) {
                // Fins stabilize the fish with small, slow counter-motion.
                const phaseOffset =
                    side < 0 ? 0.35 : 1.05;

                const stroke =
                    0.105 *
                    Math.sin(
                        this.swimPhase *
                        0.63 +
                        phaseOffset
                    ) +
                    0.035 *
                    Math.sin(
                        this.swimPhase *
                        1.18 +
                        side * 0.5
                    );

                const finAngle =
                    bodyAngle +
                    side *
                    (Math.PI * 0.51) +
                    side * 0.12 +
                    stroke;

                const tipX =
                    anchor.x +
                    Math.cos(finAngle) *
                    finLength;

                const tipY =
                    anchor.y +
                    Math.sin(finAngle) *
                    finLength;

                const controlX =
                    anchor.x +
                    Math.cos(
                        finAngle -
                        side * 0.32
                    ) *
                    (13 *
                    this.scale);

                const controlY =
                    anchor.y +
                    Math.sin(
                        finAngle -
                        side * 0.32
                    ) *
                    (13 *
                    this.scale);

                const rearX =
                    anchor.x -
                    Math.cos(bodyAngle) *
                    (6.0 *
                    this.scale);

                const rearY =
                    anchor.y -
                    Math.sin(bodyAngle) *
                    (6.0 *
                    this.scale);

                ctx.beginPath();
                ctx.moveTo(
                    anchor.x,
                    anchor.y
                );

                ctx.quadraticCurveTo(
                    controlX,
                    controlY,
                    tipX,
                    tipY
                );

                ctx.quadraticCurveTo(
                    rearX,
                    rearY,
                    anchor.x,
                    anchor.y
                );

                ctx.fillStyle =
                    'rgba(0, 240, 255, 0.20)';

                ctx.fill();

                ctx.strokeStyle =
                    'rgba(56, 189, 248, 0.63)';

                ctx.lineWidth =
                    1.0 *
                    this.scale;

                ctx.stroke();
            }
        }

        drawPelvicFins(ctx) {
            const anchorIndex = 7;

            const anchor =
                this.spine[
                    anchorIndex
                ];

            const bodyAngle =
                this.getBodyAngle(
                    anchorIndex
                );

            const finLength =
                10.5 *
                this.scale;

            for (
                let side = -1;
                side <= 1;
                side += 2
            ) {
                const finAngle =
                    bodyAngle +
                    side *
                    (Math.PI * 0.72) +
                    0.06 *
                    Math.sin(
                        this.swimPhase *
                        0.58 +
                        side
                    );

                const tipX =
                    anchor.x +
                    Math.cos(finAngle) *
                    finLength;

                const tipY =
                    anchor.y +
                    Math.sin(finAngle) *
                    finLength;

                ctx.beginPath();

                ctx.moveTo(
                    anchor.x,
                    anchor.y
                );

                ctx.quadraticCurveTo(
                    anchor.x +
                    Math.cos(
                        finAngle -
                        side * 0.24
                    ) *
                    (6.5 *
                    this.scale),

                    anchor.y +
                    Math.sin(
                        finAngle -
                        side * 0.24
                    ) *
                    (6.5 *
                    this.scale),

                    tipX,
                    tipY
                );

                ctx.lineTo(
                    anchor.x -
                    Math.cos(bodyAngle) *
                    (4.1 *
                    this.scale),

                    anchor.y -
                    Math.sin(bodyAngle) *
                    (4.1 *
                    this.scale)
                );

                ctx.closePath();

                ctx.fillStyle =
                    'rgba(0, 240, 255, 0.13)';

                ctx.fill();

                ctx.strokeStyle =
                    'rgba(56, 189, 248, 0.44)';

                ctx.lineWidth =
                    0.80 *
                    this.scale;

                ctx.stroke();
            }
        }

        drawBody(ctx) {
            const leftSide = [];
            const rightSide = [];

            const last =
                this.numVertebrae - 1;

            for (let i = 0; i < this.numVertebrae; i++) {
                let tx;
                let ty;

                if (i === 0) {
                    tx =
                        this.spine[1].x -
                        this.spine[0].x;

                    ty =
                        this.spine[1].y -
                        this.spine[0].y;
                } else if (i === last) {
                    tx =
                        this.spine[last].x -
                        this.spine[last - 1].x;

                    ty =
                        this.spine[last].y -
                        this.spine[last - 1].y;
                } else {
                    tx =
                        this.spine[i + 1].x -
                        this.spine[i - 1].x;

                    ty =
                        this.spine[i + 1].y -
                        this.spine[i - 1].y;
                }

                const length =
                    Math.hypot(tx, ty) || 1;

                const perpX =
                    -ty / length;

                const perpY =
                    tx / length;

                const width =
                    this.bodyWidths[i];

                leftSide.push({
                    x:
                        this.spine[i].x +
                        perpX * width,

                    y:
                        this.spine[i].y +
                        perpY * width
                });

                rightSide.push({
                    x:
                        this.spine[i].x -
                        perpX * width,

                    y:
                        this.spine[i].y -
                        perpY * width
                });
            }

            const snout =
                this.spine[0];

            const tailAnchor =
                this.spine[last];

            ctx.beginPath();

            ctx.moveTo(
                snout.x,
                snout.y
            );

            for (let i = 0; i < leftSide.length - 1; i++) {
                const a = leftSide[i];
                const b = leftSide[i + 1];

                const midX =
                    (a.x + b.x) * 0.5;

                const midY =
                    (a.y + b.y) * 0.5;

                ctx.quadraticCurveTo(
                    a.x,
                    a.y,
                    midX,
                    midY
                );
            }

            ctx.quadraticCurveTo(
                leftSide[last].x,
                leftSide[last].y,
                tailAnchor.x,
                tailAnchor.y
            );

            for (let i = rightSide.length - 1; i > 0; i--) {
                const a = rightSide[i];
                const b = rightSide[i - 1];

                const midX =
                    (a.x + b.x) * 0.5;

                const midY =
                    (a.y + b.y) * 0.5;

                ctx.quadraticCurveTo(
                    a.x,
                    a.y,
                    midX,
                    midY
                );
            }

            ctx.quadraticCurveTo(
                rightSide[0].x,
                rightSide[0].y,
                snout.x,
                snout.y
            );

            ctx.closePath();

            const gradient =
                ctx.createLinearGradient(
                    this.spine[0].x,
                    this.spine[0].y,
                    this.spine[last].x,
                    this.spine[last].y
                );

            gradient.addColorStop(0, '#061a2e');
            gradient.addColorStop(0.3, '#0c2e4e');
            gradient.addColorStop(0.7, '#072038');
            gradient.addColorStop(1, '#030f1c');

            ctx.fillStyle =
                gradient;

            ctx.fill();

            ctx.strokeStyle =
                'rgba(0, 240, 255, 0.72)';

            ctx.lineWidth =
                1.30 *
                this.scale;

            ctx.stroke();
        }

        drawMarkings(ctx) {
            ctx.beginPath();

            ctx.moveTo(
                this.spine[1].x,
                this.spine[1].y
            );

            for (let i = 2; i <= 10; i++) {
                ctx.lineTo(
                    this.spine[i].x,
                    this.spine[i].y
                );
            }

            ctx.strokeStyle =
                'rgba(0, 240, 255, 0.40)';

            ctx.lineWidth =
                1.25 *
                this.scale;

            ctx.stroke();

            const drawPatch =
                (index, radius, alpha) => {
                    const point =
                        this.spine[index];

                    ctx.beginPath();

                    ctx.arc(
                        point.x,
                        point.y,
                        radius * this.scale,
                        0,
                        TAU
                    );

                    ctx.fillStyle =
                        'rgba(56, 189, 248, ' +
                        alpha +
                        ')';

                    ctx.fill();
                };

            drawPatch(3, 5.0, 0.27);
            drawPatch(5, 6.3, 0.30);
            drawPatch(8, 4.2, 0.23);
        }

        drawEyes(ctx) {
            const eyeIndex = 1;

            const eyePoint =
                this.spine[eyeIndex];

            const dx =
                this.spine[0].x -
                this.spine[2].x;

            const dy =
                this.spine[0].y -
                this.spine[2].y;

            const len =
                Math.hypot(dx, dy) || 1;

            const forwardX = dx / len;
            const forwardY = dy / len;

            const perpX =
                -forwardY;

            const perpY =
                forwardX;

            const distance =
                this.bodyWidths[eyeIndex] *
                0.84;

            for (
                let side = -1;
                side <= 1;
                side += 2
            ) {
                const eyeX =
                    eyePoint.x +
                    perpX *
                    side *
                    distance +
                    forwardX *
                    (1.25 *
                    this.scale);

                const eyeY =
                    eyePoint.y +
                    perpY *
                    side *
                    distance +
                    forwardY *
                    (1.25 *
                    this.scale);

                ctx.beginPath();

                ctx.arc(
                    eyeX,
                    eyeY,
                    4.7 *
                    this.scale,
                    0,
                    TAU
                );

                ctx.fillStyle =
                    'rgba(255, 42, 95, 0.23)';

                ctx.fill();

                ctx.beginPath();

                ctx.arc(
                    eyeX,
                    eyeY,
                    2.4 *
                    this.scale,
                    0,
                    TAU
                );

                ctx.fillStyle =
                    'rgba(255, 20, 75, 0.84)';

                ctx.fill();

                ctx.beginPath();

                ctx.arc(
                    eyeX,
                    eyeY,
                    1.25 *
                    this.scale,
                    0,
                    TAU
                );

                ctx.fillStyle =
                    '#ff0055';

                ctx.fill();

                ctx.beginPath();

                ctx.arc(
                    eyeX -
                    0.4 *
                    this.scale,

                    eyeY -
                    0.4 *
                    this.scale,

                    0.48 *
                    this.scale,

                    0,
                    TAU
                );

                ctx.fillStyle =
                    '#ffffff';

                ctx.fill();
            }
        }

        draw(ctx) {
            ctx.save();

            // Water disturbance sits behind the fish.
            this.drawWake(ctx);

            // Flexible fins and body.
            this.drawTail(ctx);
            this.drawPectoralFins(ctx);
            this.drawPelvicFins(ctx);
            this.drawBody(ctx);
            this.drawMarkings(ctx);
            this.drawEyes(ctx);

            ctx.restore();
        }
    }

    const koiSchool = [
        new TrueKoi(width, height, 1.30),
        new TrueKoi(width, height, 1.15),
        new TrueKoi(width, height, 1.00),
        new TrueKoi(width, height, 0.90),
        new TrueKoi(width, height, 0.80),
        new TrueKoi(width, height, 1.05)
    ];

    let isRunning = !document.hidden;
    let lastTime = performance.now();

    document.addEventListener(
        'visibilitychange',
        () => {
            isRunning = !document.hidden;
            lastTime = performance.now();

            if (isRunning) {
                requestAnimationFrame(renderSea);
            }
        }
    );

    function renderSea(now) {
        if (!isRunning) return;

        // Clamp giant gaps after sleeping / tab switching.
        const dt =
            Math.min(
                Math.max(
                    (now - lastTime) / 1000,
                    0
                ),
                0.033
            );

        lastTime = now;

        ctx.clearRect(
            0,
            0,
            width,
            height
        );

        for (const koi of koiSchool) {
            koi.update(
                width,
                height,
                dt
            );

            koi.draw(ctx);
        }

        requestAnimationFrame(renderSea);
    }

    requestAnimationFrame(renderSea);
}

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initBioluminescentSea
    );
} else {
    initBioluminescentSea();
}

// Remove banner from current active thread (moderator action)
async function removeCurrentThreadBanner() {
    if (!confirm(`Are you sure you want to remove the banner for "${activeThread}"?`)) return;
    const tData = allCloudThreads.find(t => t.name === activeThread);
    if (tData && tData.id && db) {
        const { error } = await db.from('forum_threads').update({ banner_url: null }).eq('id', tData.id);
        if (error) {
            await db.from('threads').update({ banner_url: null }).eq('id', tData.id).catch(() => {});
        }
        tData.banner_url = null;
    }
    renderThreadBanner();
    updateThreadControlsUI();
    showToast({ title: "Banner Removed", message: `Banner removed from "${activeThread}".`, type: "info", icon: "◈" });
}


safeAddListener(document.getElementById('opt-remove-banner-btn'), 'click', () => {
    closeThreadOptionsModal();
    removeCurrentThreadBanner();
});

