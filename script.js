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

// Header Nav & Settings Triggers (Desktop)
const openSettingsBtn = document.getElementById('open-profile-btn');
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
const tabNavSettings = document.getElementById('tab-nav-profile');
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
const permsUserList = document.getElementById('perms-user-list');

// Thread Delete Confirmation Modal Elements
const threadDeleteModal = document.getElementById('thread-delete-modal');
const closeThreadDeleteModalBtn = document.getElementById('close-thread-delete-modal-btn');
const cancelDeleteThreadBtn = document.getElementById('cancel-delete-thread-btn');
const finalDeleteThreadBtn = document.getElementById('final-delete-thread-btn');
const deleteThreadTargetName = document.getElementById('delete-thread-target-name');
const deleteThreadConfirmInput = document.getElementById('delete-thread-confirm-input');

// Settings & Account Modal Elements
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
const userCardMsgBtn = document.getElementById('user-card-msg-btn');
const userCardAddFriendBtn = document.getElementById('user-card-add-friend-btn');
const unaddConfirmBox = document.getElementById('unadd-confirm-box');
const confirmUnaddBtn = document.getElementById('confirm-unadd-btn');
const cancelUnaddBtn = document.getElementById('cancel-unadd-btn');

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
const friendsContainer = document.getElementById('friends-container');
const groupsContainer = document.getElementById('groups-container');
const chatHeader = document.getElementById('chat-header');
const chatMessages = document.getElementById('chat-messages');
const chatPendingBanner = document.getElementById('chat-pending-banner');

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
let activeThread = "Welcome & Security";
let currentFetchId = 0;

let threadMetaMap = JSON.parse(localStorage.getItem('forum_thread_metadata') || '{}');
if (!threadMetaMap["Welcome & Security"]) threadMetaMap["Welcome & Security"] = { owner: SITE_ADMIN_USERNAME, moderators: [], banned: [] };
if (!threadMetaMap["Update Thread"]) threadMetaMap["Update Thread"] = { owner: SITE_ADMIN_USERNAME, moderators: [], banned: [] };

// Voting Cache
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

// Dynamic Settings Tab Navigation Elements
let settingsTabNavProfile = null;
let settingsTabNavPrivacy = null;
let settingsTabProfileSection = null;
let settingsTabPrivacySection = null;
let toggleAccountPrivacyCheckbox = null;
let privacyStatusDescription = null;

// Dynamic Profile Card Post History Container
let userCardPostsContainer = null;

// --- DYNAMIC SETTINGS MODAL UI UPGRADE ---
function setupSettingsModalTabs() {
    if (!profileModal) return;
    const modalBox = profileModal.querySelector('.modal-box');
    if (!modalBox || modalBox.dataset.settingsConfigured === "true") return;

    modalBox.dataset.settingsConfigured = "true";

    const modalTitle = modalBox.querySelector('h2');
    if (modalTitle) modalTitle.innerHTML = "⚙️ Settings";

    const tabNavBar = document.createElement('div');
    tabNavBar.style.cssText = "display: flex; gap: 8px; border-bottom: 1px solid #334155; margin-bottom: 16px; padding-bottom: 8px;";
    tabNavBar.innerHTML = `
        <button type="button" id="settings-tab-btn-profile" style="flex: 1; padding: 8px; font-size: 0.88rem; background: #0284c7; color: #fff; border: 1px solid #38bdf8; border-radius: 6px;">Profile</button>
        <button type="button" id="settings-tab-btn-privacy" style="flex: 1; padding: 8px; font-size: 0.88rem; background: #0f172a; color: #94a3b8; border: 1px solid #334155; border-radius: 6px;">Privacy & Security</button>
    `;

    const modalHeader = modalBox.querySelector('.modal-header');
    if (modalHeader) {
        modalHeader.insertAdjacentElement('afterend', tabNavBar);
    }

    const profileWrapper = document.createElement('div');
    profileWrapper.id = "settings-profile-section-wrapper";
    
    const elementsToWrap = Array.from(modalBox.children).filter(child => {
        return child !== modalHeader && child !== tabNavBar;
    });

    elementsToWrap.forEach(el => profileWrapper.appendChild(el));
    modalBox.appendChild(profileWrapper);

    const privacyWrapper = document.createElement('div');
    privacyWrapper.id = "settings-privacy-section-wrapper";
    privacyWrapper.className = "hidden";
    privacyWrapper.innerHTML = `
        <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 14px; margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="font-size: 0.95rem; color: #f8fafc; font-weight: 700; margin-bottom: 2px;">Account Privacy</h3>
                    <p id="privacy-status-desc" style="font-size: 0.8rem; color: #94a3b8; margin: 0;">Public: Any human can view your forum post history.</p>
                </div>
                <input type="checkbox" id="toggle-account-privacy-chk" style="width: 20px; height: 20px; cursor: pointer; margin: 0;">
            </div>
        </div>
        <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 14px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.5;">
            🛡️ <strong>Private Profile Guard:</strong> When your account is private, other users see your verification score and username, but your post history feed remains completely hidden.
        </div>
    `;
    modalBox.appendChild(privacyWrapper);

    settingsTabNavProfile = document.getElementById('settings-tab-btn-profile');
    settingsTabNavPrivacy = document.getElementById('settings-tab-btn-privacy');
    settingsTabProfileSection = profileWrapper;
    settingsTabPrivacySection = privacyWrapper;
    toggleAccountPrivacyCheckbox = document.getElementById('toggle-account-privacy-chk');
    privacyStatusDescription = document.getElementById('privacy-status-desc');

    safeAddListener(settingsTabNavProfile, 'click', () => switchSettingsTab('profile'));
    safeAddListener(settingsTabNavPrivacy, 'click', () => switchSettingsTab('privacy'));

    safeAddListener(toggleAccountPrivacyCheckbox, 'change', async () => {
        if (!currentUser || !db) return;
        const newPrivacyState = toggleAccountPrivacyCheckbox.checked;
        currentUserIsPrivate = newPrivacyState;
        updatePrivacyDescriptionText();

        const { error } = await db.from('profiles').update({ is_private: newPrivacyState }).eq('id', currentUser.id);
        if (error) {
            alert(`Failed to save privacy settings: ${error.message}`);
            toggleAccountPrivacyCheckbox.checked = !newPrivacyState;
            currentUserIsPrivate = !newPrivacyState;
            updatePrivacyDescriptionText();
        }
    });
}

function updatePrivacyDescriptionText() {
    if (!privacyStatusDescription) return;
    if (currentUserIsPrivate) {
        privacyStatusDescription.textContent = "Private: Your forum post history is hidden from other members.";
    } else {
        privacyStatusDescription.textContent = "Public: Any human can view your forum post history.";
    }
}

function switchSettingsTab(tab) {
    if (tab === 'profile') {
        if (settingsTabProfileSection) settingsTabProfileSection.classList.remove('hidden');
        if (settingsTabPrivacySection) settingsTabPrivacySection.classList.add('hidden');
        if (settingsTabNavProfile) {
            settingsTabNavProfile.style.background = '#0284c7';
            settingsTabNavProfile.style.borderColor = '#38bdf8';
            settingsTabNavProfile.style.color = '#fff';
        }
        if (settingsTabNavPrivacy) {
            settingsTabNavPrivacy.style.background = '#0f172a';
            settingsTabNavPrivacy.style.borderColor = '#334155';
            settingsTabNavPrivacy.style.color = '#94a3b8';
        }
    } else {
        if (settingsTabProfileSection) settingsTabProfileSection.classList.add('hidden');
        if (settingsTabPrivacySection) settingsTabPrivacySection.classList.remove('hidden');
        if (settingsTabNavPrivacy) {
            settingsTabNavPrivacy.style.background = '#0284c7';
            settingsTabNavPrivacy.style.borderColor = '#38bdf8';
            settingsTabNavPrivacy.style.color = '#fff';
        }
        if (settingsTabNavProfile) {
            settingsTabNavProfile.style.background = '#0f172a';
            settingsTabNavProfile.style.borderColor = '#334155';
            settingsTabNavProfile.style.color = '#94a3b8';
        }
    }
}

// Ensure the profile settings modal triggers settings layout
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

// --- DYNAMIC PROFILE CARD POST HISTORY CONTAINER ---
function setupUserProfileHistoryContainer() {
    if (!userProfileModal) return;
    const modalBox = userProfileModal.querySelector('.modal-box');
    if (!modalBox || modalBox.querySelector('#user-card-posts-section')) return;

    const postsSection = document.createElement('div');
    postsSection.id = "user-card-posts-section";
    postsSection.style.cssText = "margin-top: 14px; border-top: 1px solid #334155; padding-top: 12px; display: flex; flex-direction: column; max-height: 240px; overflow-y: auto;";
    postsSection.innerHTML = `
        <div style="font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Activity History</div>
        <div id="user-card-posts-list" style="display: flex; flex-direction: column; gap: 8px;">
            <div style="font-size: 0.8rem; color: #64748b;">Loading post history...</div>
        </div>
    `;
    modalBox.appendChild(postsSection);
    userCardPostsContainer = document.getElementById('user-card-posts-list');
}

// --- DIRECT MODAL & VIEW OPENERS ---

function openMessagesModal() {
    if (!currentUser) { 
        alert("Please log in to view messages."); 
        setMobileTabActive('feed');
        return; 
    }
    if (dmModal) dmModal.classList.remove('hidden');
    showSidebarViewOnMobile();
    refreshMessagingHub();
    setMobileTabActive('messages');
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

function openSettingsModal() {
    if (!currentUser) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        if (authEmailInput) authEmailInput.focus();
        setMobileTabActive('feed');
        return;
    }
    setupSettingsModalTabs();
    if (toggleAccountPrivacyCheckbox) {
        toggleAccountPrivacyCheckbox.checked = currentUserIsPrivate;
    }
    updatePrivacyDescriptionText();
    switchSettingsTab('profile');
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

safeAddListener(closeDmBtn, 'click', closeMessagesModal);

// Unconditionally allow closing messages even when a direct chat is active
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
            } else if (friendship && friendship.status === 'pending') {
                if (friendship.user_id === currentUser.id) {
                    userCardAddFriendBtn.innerHTML = `⏳ Sent`;
                    userCardAddFriendBtn.className = 'btn-friend-state secondary';
                } else {
                    userCardAddFriendBtn.innerHTML = `📬 Accept`;
                    userCardAddFriendBtn.className = 'btn-friend-state';
                }
            } else {
                userCardAddFriendBtn.innerHTML = `➕ Add Friend`;
                userCardAddFriendBtn.className = 'btn-friend-state';
            }
        }
    } catch (e) {
        if (userCardAddFriendBtn) {
            userCardAddFriendBtn.innerHTML = `➕ Add Friend`;
            userCardAddFriendBtn.className = 'btn-friend-state';
        }
    }
}

async function loadProfileUserPosts(username, isPrivate) {
    setupUserProfileHistoryContainer();
    const container = document.getElementById('user-card-posts-list');
    if (!container) return;

    if (isPrivate) {
        container.innerHTML = `
            <div style="background: #0f172a; border: 1px dashed #475569; padding: 12px; border-radius: 8px; text-align: center; color: #94a3b8; font-size: 0.82rem;">
                🔒 This user's post history is set to private.
            </div>
        `;
        return;
    }

    container.innerHTML = '<div style="font-size:0.8rem; color:#64748b;">Loading post history...</div>';

    const { data: userPosts, error } = await db
        .from('Posts')
        .select('*')
        .ilike('author', username)
        .order('id', { ascending: false })
        .limit(10);

    if (error || !userPosts || userPosts.length === 0) {
        container.innerHTML = '<div style="font-size:0.8rem; color:#64748b; font-style:italic;">No public posts from this user yet.</div>';
        return;
    }

    container.innerHTML = '';
    userPosts.forEach(p => {
        const pDate = p.created_at ? new Date(p.created_at).toLocaleDateString() : '';
        const item = document.createElement('div');
        item.style.cssText = "background: #0f172a; border: 1px solid #334155; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: border-color 0.15s;";
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #38bdf8; margin-bottom: 2px;">
                <span>#${escapeHTML(p.thread)}</span>
                <span style="color: #64748b;">${pDate}</span>
            </div>
            <div style="font-size: 0.82rem; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHTML(p.content || '[Attached Photo]')}
            </div>
        `;
        item.addEventListener('mouseenter', () => { item.style.borderColor = '#38bdf8'; });
        item.addEventListener('mouseleave', () => { item.style.borderColor = '#334155'; });
        item.addEventListener('click', () => {
            if (userProfileModal) userProfileModal.classList.add('hidden');
            navigateToPost(p.id);
        });
        container.appendChild(item);
    });
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

    await loadProfileUserPosts(cleanUser, targetProfileIsPrivate);
};

safeAddListener(closeUserProfileBtn, 'click', () => {
    if (userProfileModal) userProfileModal.classList.add('hidden');
});

safeAddListener(userCardMsgBtn, async () => {
    if (!currentUser) {
        alert("Please log in to send direct messages.");
        return;
    }
    if (!targetProfileId || !targetProfileUsername) return;

    if (userProfileModal) userProfileModal.classList.add('hidden');
    if (dmModal) dmModal.classList.remove('hidden');
    setMobileTabActive('messages');

    await startOrOpenDirectChat({
        id: targetProfileId,
        username: targetProfileUsername
    });
});

safeAddListener(userCardAddFriendBtn, async () => {
    if (!currentUser) {
        alert("Please log in to manage friends.");
        return;
    }

    if (targetFriendshipRecord && targetFriendshipRecord.status === 'accepted') {
        if (unaddConfirmBox) unaddConfirmBox.classList.toggle('hidden');
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

safeAddListener(confirmUnaddBtn, async () => {
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

safeAddListener(cancelUnaddBtn, () => {
    if (unaddConfirmBox) unaddConfirmBox.classList.add('hidden');
});

// --- SESSION & AUTHENTICATION ---

async function syncUserState(user) {
    if (user) {
        currentUser = user;
        currentUsername = user.user_metadata?.username || user.email?.split('@')[0] || "human";
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
                if (toggleAccountPrivacyCheckbox) {
                    toggleAccountPrivacyCheckbox.checked = currentUserIsPrivate;
                }
                updatePrivacyDescriptionText();

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
    if (url) {
        if (headerAvatarImg) { headerAvatarImg.src = url; headerAvatarImg.classList.remove('hidden'); }
        if (headerAvatarFallback) headerAvatarFallback.classList.add('hidden');
        if (postBarAvatar) { postBarAvatar.src = url; postBarAvatar.classList.remove('hidden'); }
        if (tabAvatarImg) { tabAvatarImg.src = url; tabAvatarImg.classList.remove('hidden'); }
        if (tabAvatarFallback) tabAvatarFallback.classList.add('hidden');
        if (profilePreviewAvatar) profilePreviewAvatar.src = url;
    } else {
        if (headerAvatarImg) headerAvatarImg.classList.add('hidden');
        if (headerAvatarFallback) headerAvatarFallback.classList.remove('hidden');
        if (postBarAvatar) postBarAvatar.classList.add('hidden');
        if (tabAvatarImg) tabAvatarImg.classList.add('hidden');
        if (tabAvatarFallback) tabAvatarFallback.classList.remove('hidden');
        if (profilePreviewAvatar) profilePreviewAvatar.src = DEFAULT_AVATAR;
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

// --- PROFILE SETTINGS PASSWORD & AVATAR LOGIC ---

safeAddListener(profileAvatarFile, 'change', async () => {
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
    if (currentUsername) usernameAvatarMap.set(currentUsername.toLowerCase(), currentAvatarUrl);
    renderUserAvatar(currentAvatarUrl);
    renderCurrentFeed();
    alert("Avatar updated successfully!");
});

safeAddListener(updatePasswordBtn, async () => {
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

safeAddListener(openDeleteModalBtn, () => {
    if (deleteConfirmModal) deleteConfirmModal.classList.remove('hidden');
    if (deleteUsernameInput) deleteUsernameInput.value = '';
});
safeAddListener(closeDeleteModalBtn, () => { if (deleteConfirmModal) deleteConfirmModal.classList.add('hidden'); });
safeAddListener(cancelDeleteBtn, () => { if (deleteConfirmModal) deleteConfirmModal.classList.add('hidden'); });

safeAddListener(finalDeleteBtn, async () => {
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

// --- CREATE & DELETE THREADS ---

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

    threadMetaMap[newName] = { owner: currentUsername, moderators: [], banned: [] };
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

safeAddListener(postSortSelect, 'change', () => { renderCurrentFeed(); });

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

safeAddListener(finalDeleteThreadBtn, async () => {
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
        permsUserList.innerHTML = '<div class="no-posts" style="padding: 10px;">No members active in this thread yet.</div>';
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

// --- MESSAGING & CHATS HUB ---

function showSidebarViewOnMobile() {
    if (sidebarPane) sidebarPane.classList.remove('mobile-hidden');
    if (chatPane) chatPane.classList.add('mobile-hidden');
    if (topModalBar) topModalBar.classList.remove('hidden');
}

function showChatViewOnMobile() {
    if (sidebarPane) sidebarPane.classList.add('mobile-hidden');
    if (chatPane) chatPane.classList.remove('mobile-hidden');
    if (topModalBar) topModalBar.classList.add('hidden');
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
    await loadFriendRequests();
    await loadFriends();
    await loadConversations();
    updateSidebarBadges();
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

safeAddListener(addFriendBtn, async () => {
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
    alert(`Friend request sent to @${targetProfile.username}!`);
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
    if (!db) return;
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

    const { data: friendship } = await db
        .from('friendships')
        .select('status')
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${friend.id}),and(user_id.eq.${friend.id},friend_id.eq.${currentUser.id})`)
        .maybeSingle();

    const isFriend = friendship && friendship.status === 'accepted';

    if (existing1on1Id) {
        selectConversation(existing1on1Id, `@${friend.username}`, friend.id, friend.username, isFriend);
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

        selectConversation(newConv.id, `@${friend.username}`, friend.id, friend.username, isFriend);
    }
}

safeAddListener(toggleGroupCreateBtn, 'click', () => {
    if (groupCreatorBox) groupCreatorBox.classList.toggle('hidden');
});
safeAddListener(cancelGroupBtn, 'click', () => {
    if (groupCreatorBox) groupCreatorBox.classList.add('hidden');
});

safeAddListener(createGroupConfirmBtn, async () => {
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
            () => { loadMessages(true); }
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

async function loadMessages(forceScroll = false) {
    if (!currentUser || !activeConversationId || !db || !chatMessages) return;

    const { data: messages, error } = await db
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('id', { ascending: true });

    if (error) {
        console.warn("Error loading chat messages:", error);
        return;
    }

    const visibleMessages = (messages || []).filter(msg => {
        if (!msg.pending_approval) return true;
        return msg.sender_id === currentUser.id;
    });

    const currentMsgCount = chatMessages.querySelectorAll('.msg-bubble').length;
    if (!forceScroll && visibleMessages.length === currentMsgCount) return;

    chatMessages.innerHTML = '';
    if (!visibleMessages || visibleMessages.length === 0) {
        chatMessages.innerHTML = '<div class="no-posts">No messages in this chat yet. Start the conversation!</div>';
        return;
    }

    const senderIds = Array.from(new Set(visibleMessages.map(m => m.sender_id)));
    await ensureAvatarsCached(senderIds);

    visibleMessages.forEach(msg => {
        const isMine = msg.sender_id === currentUser.id;
        const senderAvatar = userAvatarCache.get(msg.sender_id) || DEFAULT_AVATAR;
        const isPending = msg.pending_approval;

        const row = document.createElement('div');
        row.className = `msg-row ${isMine ? 'mine' : 'theirs'}`;

        const avatarImgHtml = `<img src="${senderAvatar}" class="msg-avatar clickable-avatar" data-username="${escapeHTML(msg.sender_username)}" alt="pfp" title="@${escapeHTML(msg.sender_username)}">`;
        const authorHtml = !isMine ? `<div class="msg-author clickable-username" data-username="${escapeHTML(msg.sender_username)}">@${escapeHTML(msg.sender_username)}</div>` : '';
        const textHtml = msg.content ? `<div>${renderFormattedContent(msg.content)}</div>` : '';
        const imgHtml = msg.image_url ? `<a href="${msg.image_url}" target="_blank"><img src="${msg.image_url}" class="chat-img-thumb" alt="Uploaded photo" loading="lazy"></a>` : '';
        const pendingBadge = (isMine && isPending) ? `<span class="pending-tag">⏳ Pending Friend Acceptance</span>` : '';

        const bubbleHtml = `
            <div class="msg-bubble ${isMine ? 'msg-mine' : 'msg-theirs'} ${isPending ? 'pending-approval' : ''}">
                ${authorHtml}${textHtml}${imgHtml}${pendingBadge}
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

        const { data: publicUrlData } = db.storage.from('chat-images').getPublicUrl(filePath);
        uploadedImageUrl = publicUrlData.publicUrl;
    }

    const isPendingApproval = Boolean(activeConversationPartnerId && !activeConversationIsFriend);

    const { error } = await db
        .from('chat_messages')
        .insert([{
            conversation_id: activeConversationId,
            sender_id: currentUser.id,
            sender_username: currentUsername,
            content: content || '',
            image_url: uploadedImageUrl,
            pending_approval: isPendingApproval
        }]);

    dmSendBtn.disabled = false;
    dmSendBtn.textContent = 'Send';

    if (error) {
        alert(`Error sending message: ${error.message}`);
        return;
    }

    if (isPendingApproval && activeConversationPartnerId) {
        await db.from('friendships').insert([{
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
    }

    dmText.value = '';
    dmImageInput.value = '';
    const label = document.querySelector('.upload-photo-label');
    if (label) {
        label.style.borderColor = '#475569';
        label.title = 'Attach Photo';
    }

    loadMessages(true);
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

safeAddListener(clearAllNotifsBtn, async () => {
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

safeAddListener(closeFabModalBtn, () => {
    if (fabModalOverlay) {
        fabModalOverlay.classList.remove('active');
        setTimeout(() => fabModalOverlay.classList.add('hidden'), 300);
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
