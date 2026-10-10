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


// Phones zoom the page when a text field is focused (and sometimes leave it zoomed). The stylesheet keeps inputs at
// 16px, which stops that; this is the safety net for anything that still ends up zoomed in once the keyboard closes.
(function initZoomGuard() {
    const vv = window.visualViewport;
    const meta = document.querySelector('meta[name="viewport"]');
    if (!vv || !meta) return;
    const original = meta.getAttribute('content') || 'width=device-width, initial-scale=1.0';
    let timer = null;
    const reset = () => {
        if (vv.scale <= 1.02) return;
        meta.setAttribute('content', original + ', maximum-scale=1');
        setTimeout(() => meta.setAttribute('content', original), 400);
    };
    document.addEventListener('focusout', (e) => {
        if (!e.target || !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
        clearTimeout(timer);
        timer = setTimeout(reset, 150);
    });
})();

// --- IN-APP DIALOGS: styled replacements for the browser's confirm() and prompt() boxes ---
// uiConfirm(message, {title, confirmText, cancelText, danger}) -> Promise<boolean>
// uiPrompt(message, {title, value, placeholder, maxLength, confirmText}) -> Promise<string | null>
let uiDialogChain = Promise.resolve();
function uiDialog(opts = {}) {
    const kind = opts.kind === 'prompt' ? 'prompt' : opts.kind === 'choice' ? 'choice' : 'confirm';
    const cancelValue = kind === 'confirm' ? false : null;
    const run = () => new Promise((resolve) => {
        const root = document.getElementById('ui-dialog');
        if (!root) { resolve(cancelValue); return; }
        const box = document.getElementById('ui-dialog-box');
        const input = document.getElementById('ui-dialog-input');
        const okBtn = document.getElementById('ui-dialog-ok');
        const cancelBtn = document.getElementById('ui-dialog-cancel');
        const previousFocus = document.activeElement;
        document.getElementById('ui-dialog-title').textContent = opts.title || (kind === 'prompt' ? 'Enter a value' : 'Please confirm');
        document.getElementById('ui-dialog-message').textContent = opts.message || '';
        box.classList.toggle('danger', Boolean(opts.danger));
        okBtn.textContent = opts.confirmText || 'OK';
        cancelBtn.textContent = opts.cancelText || 'Cancel';
        input.classList.toggle('hidden', kind !== 'prompt');
        const choicesEl = document.getElementById('ui-dialog-choices');
        choicesEl.textContent = '';
        choicesEl.classList.toggle('hidden', kind !== 'choice');
        okBtn.classList.toggle('hidden', kind === 'choice');
        if (kind === 'prompt') {
            input.value = opts.value || '';
            input.placeholder = opts.placeholder || '';
            input.maxLength = opts.maxLength || 120;
        }

        let done = false;
        const finish = (result) => {
            if (done) return;
            done = true;
            document.removeEventListener('keydown', onKey, true);
            root.removeEventListener('click', onBackdrop);
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            root.classList.add('hidden');
            try { if (previousFocus && previousFocus.focus) previousFocus.focus({ preventScroll: true }); } catch (e) { /* element gone */ }
            resolve(result);
        };
        const onOk = () => finish(kind === 'prompt' ? input.value : true);
        const onCancel = () => finish(cancelValue);
        const onBackdrop = (e) => { if (e.target === root) onCancel(); };
        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); onCancel(); }
            else if (e.key === 'Enter' && kind !== 'choice' && e.target !== cancelBtn) { e.preventDefault(); e.stopImmediatePropagation(); onOk(); }
        };
        if (kind === 'choice') {
            (opts.choices || []).forEach((ch) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'secondary' + (ch.current ? ' current' : '');
                b.textContent = ch.label;
                b.addEventListener('click', () => finish(ch.value));
                choicesEl.appendChild(b);
            });
        }
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        root.addEventListener('click', onBackdrop);
        document.addEventListener('keydown', onKey, true);
        root.classList.remove('hidden');
        // focus straight away so keyboard and screen-reader users land inside the dialog
        if (kind === 'prompt') { input.focus({ preventScroll: true }); input.select(); }
        else if (kind === 'choice') { (choicesEl.querySelector('button') || cancelBtn).focus({ preventScroll: true }); }
        else (opts.danger ? cancelBtn : okBtn).focus({ preventScroll: true });
    });
    // One dialog at a time: a second request waits for the first to be answered.
    const next = uiDialogChain.then(run, run);
    uiDialogChain = next.then(() => {}, () => {});
    return next;
}
const uiConfirm = (message, opts = {}) => uiDialog({ ...opts, kind: 'confirm', message });
const uiPrompt = (message, opts = {}) => uiDialog({ ...opts, kind: 'prompt', message });
const uiChoose = (message, choices, opts = {}) => uiDialog({ ...opts, kind: 'choice', message, choices });

// Browsers show their own "Please fill out this field" bubble on required form fields. Show the app's toast instead,
// so every message in the app looks the same. (Cancelling the event keeps the form from submitting, as before.)
let invalidToastLock = false;
document.addEventListener('invalid', (e) => {
    const el = e.target;
    e.preventDefault();
    if (invalidToastLock) return; // several fields can be invalid at once: speak up once, about the first
    invalidToastLock = true;
    setTimeout(() => { invalidToastLock = false; }, 400);
    const raw = (el.labels && el.labels[0] && el.labels[0].textContent) || el.getAttribute('aria-label') || el.placeholder || el.name || 'This field';
    const label = raw.replace(/\s*\(required\)\s*/i, '').replace(/\s+/g, ' ').trim();
    showToast({ title: "Check your details", message: `${label}: ${el.validationMessage || 'please check this field.'}`, type: "error", icon: "▵", duration: 4500, force: true });
    try { el.focus(); } catch (err) { /* hidden field */ }
}, true);

// --- NATIVE POLISH (only active inside the iOS/Android app; harmless in a browser) ---
// Light haptic feedback through the Capacitor Haptics plugin when it is installed in the native shell.
function hapticTap(kind = 'light') {
    try {
        const h = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
        if (!h) return;
        if (kind === 'success' && h.notification) h.notification({ type: 'SUCCESS' });
        else if (h.impact) h.impact({ style: kind === 'medium' ? 'MEDIUM' : 'LIGHT' });
    } catch (e) { /* plugin unavailable */ }
}

// Slim banner while the device has no connection, so a dropped network never looks like a frozen app.
(function initOfflineBanner() {
    let banner = null;
    const show = () => {
        if (banner) return;
        banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.setAttribute('role', 'status');
        banner.textContent = "You're offline. Reconnecting when your connection returns...";
        document.body.appendChild(banner);
    };
    const hide = () => { if (banner) { banner.remove(); banner = null; } };
    window.addEventListener('offline', show);
    window.addEventListener('online', hide);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        if (document.body) show(); else document.addEventListener('DOMContentLoaded', show, { once: true });
    }
})();

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


// --- GLOBAL POPUP INTERCEPTOR (turns any leftover browser alert() into a styled toast) ---
// Titles are plain and describe the situation, never "security" language for an ordinary problem.
window.alert = function(msg) {
    if (!msg) return;
    const str = String(msg);
    let title = "Notice";
    let icon = "✦";
    let type = "info";

    const lower = str.toLowerCase();
    if (lower.includes("error") || lower.includes("failed") || lower.includes("blocked") || lower.includes("denied") || lower.includes("must be") || lower.includes("please") || lower.includes("security check") || lower.includes("invalid") || lower.includes("already taken") || lower.includes("incorrect")) {
        type = "error";
        icon = "▵";
        title = "Couldn't do that";
        if (lower.includes("security check") || lower.includes("captcha") || lower.includes("turnstile")) {
            title = "Human check";
            icon = "◈";
        } else if (lower.includes("username") || lower.includes("password") || lower.includes("login") || lower.includes("sign up")) {
            title = "Sign-in problem";
            icon = "◈";
        } else if (lower.includes("call") || lower.includes("microphone") || lower.includes("audio")) {
            title = "Call problem";
            icon = "◈";
        }
    } else if (lower.includes("success") || lower.includes("copied") || lower.includes("updated") || lower.includes("welcome")) {
        type = "success";
        icon = "✓";
        title = "Done";
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
let activeCall = null; // see createCallState(): a call room with one RTCPeerConnection per other participant
let isMicMuted = false;
let incomingCallData = null; // { callerId, callerUsername, conversationId }
let userCallSignalingChannel = null;
const recentlyDeclinedCalls = new Map();
let ringtoneAudioCtx = null;
let ringtoneInterval = null;
let queuedIceCandidates = [];
let isAnsweringCall = false; 
let answeringConversationId = null;




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
let notifBlockedWarned = false;




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
// Votes are remembered per account. (They used to share one key per browser, so a second account on the
// same device inherited the first one's highlighted votes.)
const VOTE_STORE_PREFIX = 'user_forum_votes_';
let userVotes = {};
let userCommentVotes = JSON.parse(localStorage.getItem('user_forum_comment_votes') || '{}');
let cachedPosts = [];
// People the signed-in user has blocked (see the SAFETY section): id -> { id, username }, plus a lowercase-name index.
const blockedById = new Map();
const blockedNames = new Set();
// Privacy & Security Center state
const mfaCleared = new Set();      // user ids whose two-factor check is done on this device
let mfaPending = null;             // in-flight two-factor prompt (so a second auth event never opens a second one)
let pendingSigninAlert = false;    // set after a password sign-in so the member's other devices get an alert
let chatPrivacy = { timer: 0, clearedAt: null }; // disappearing-message timer / clear-chat time of the open chat
const userCardSafety = document.getElementById('user-card-safety');
const userCardBlockBtn = document.getElementById('user-card-block-btn');
const userCardReportBtn = document.getElementById('user-card-report-btn');
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

    // Decode from an object URL (no base64 copy of the whole file in memory).
    const objectUrl = URL.createObjectURL(file);

    try {
        const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = objectUrl;
        });

        const needsResize = img.width > maxWidth;
        const alreadyLight = file.size <= 350 * 1024 && /^image\/(jpeg|webp)$/.test(file.type);

        // Small JPEG/WebP files gain nothing from a lossy re-encode.
        if (!needsResize && alreadyLight) return file;

        const scale = needsResize ? maxWidth / img.width : 1;
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (!blob) throw new Error('Canvas empty');

        return new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpeg", {
            type: 'image/jpeg',
            lastModified: Date.now()
        });
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
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
    if (tab === 'privacy' && typeof refreshPrivacyCenter === 'function') refreshPrivacyCenter();
}


safeAddListener(tabBtnSettingsProfile, 'click', () => switchSettingsTab('profile'));
safeAddListener(tabBtnSettingsAudio, 'click', () => { switchSettingsTab('audio'); loadAudioSettings(); });
safeAddListener(tabBtnSettingsNotifs, 'click', () => switchSettingsTab('notifs'));
safeAddListener(tabBtnSettingsPrivacy, 'click', () => switchSettingsTab('privacy'));


// Audio & Calling technical toggles listeners
// Push mic-processing and deafen changes into any call / voice stage that is already running, so the
// settings button works mid-session instead of only taking effect on the next connection.
function applyAudioSettingsLive() {
    const constraints = {
        echoCancellation: Boolean(userAudioSettings.echoCancellation),
        noiseSuppression: Boolean(userAudioSettings.noiseSuppression),
        autoGainControl: Boolean(userAudioSettings.autoGainControl)
    };
    [typeof activeCall !== 'undefined' && activeCall ? activeCall.localStream : null,
     typeof voiceStageLocalStream !== 'undefined' ? voiceStageLocalStream : null].forEach(stream => {
        if (!stream) return;
        stream.getAudioTracks().forEach(track => {
            track.applyConstraints(constraints).catch(() => {});
        });
    });
}

function applyDeafenLive() {
    if (remoteAudioEl) remoteAudioEl.muted = userAudioSettings.deafen;
    if (typeof activeCall !== 'undefined' && activeCall && activeCall.peers) {
        activeCall.peers.forEach(peer => { peer.audioEl.muted = Boolean(userAudioSettings.deafen); });
    }
    if (typeof voiceStagePeers !== 'undefined') {
        voiceStagePeers.forEach(peer => {
            if (peer.audioEl) peer.audioEl.muted = Boolean(voiceStageIsDeafened || userAudioSettings.deafen);
        });
    }
}

safeAddListener(audioOptEcho, 'change', () => { userAudioSettings.echoCancellation = audioOptEcho.checked; saveAudioSettings(); applyAudioSettingsLive(); });
safeAddListener(audioOptNoise, 'change', () => { userAudioSettings.noiseSuppression = audioOptNoise.checked; saveAudioSettings(); applyAudioSettingsLive(); });
safeAddListener(audioOptGain, 'change', () => { userAudioSettings.autoGainControl = audioOptGain.checked; saveAudioSettings(); applyAudioSettingsLive(); });
safeAddListener(audioOptHifi, 'change', () => { userAudioSettings.highFidelity = audioOptHifi.checked; saveAudioSettings(); });
safeAddListener(audioOptDeafen, 'change', () => {
    userAudioSettings.deafen = audioOptDeafen.checked;
    saveAudioSettings();
    applyDeafenLive();
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
        .ilike('author', likeExact(username))
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
        .ilike('author', likeExact(username))
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
    // The live chat / voice stage overlay is forced to z-index 20000 in the stylesheet; without lifting the
    // settings modal above it, the modal opens hidden behind the stage and the settings button appears to do
    // nothing. 21000 stays below the call windows and voice-invite dialog (24998+).
    const liveChatOpen = Boolean(voiceForumModal && !voiceForumModal.classList.contains('hidden'));
    if (profileModal) {
        profileModal.style.zIndex = liveChatOpen ? '21000' : '';
        profileModal.classList.remove('hidden');
    }
    
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




// The Human Check score and the suspension flag are kept by the database (report_behavior / clear_suspension), so a
// browser console can no longer reset them. Older databases without those functions fall back to a direct write.
async function persistBehavior(points) {
    if (!currentUser || !db) return null;
    try {
        const { data, error } = await db.rpc('report_behavior', { p_points: points });
        if (error) throw error;
        const d = Array.isArray(data) ? data[0] : data;
        return d && typeof d.score === 'number' ? d : null;
    } catch (e) {
        if (isMissingFunctionError(e)) {
            try {
                await db.from('profiles').update(suspicionScore >= 5 ? { suspicion_score: suspicionScore, is_suspended: true } : { suspicion_score: suspicionScore }).eq('id', currentUser.id);
            } catch (e2) { /* nothing more to try */ }
        } else {
            console.warn("Human check update notice:", e);
        }
        return null;
    }
}

// Returns { ok, waitSeconds }. The server makes everyone wait a few minutes after a suspension.
async function clearSuspensionOnServer() {
    if (!currentUser || !db) return { ok: true, waitSeconds: 0 };
    try {
        const { data, error } = await db.rpc('clear_suspension');
        if (error) throw error;
        const d = Array.isArray(data) ? data[0] : data;
        return { ok: d ? d.ok !== false : true, waitSeconds: d && d.wait_seconds ? Number(d.wait_seconds) : 0 };
    } catch (e) {
        if (isMissingFunctionError(e)) {
            await db.from('profiles').update({ is_suspended: false, suspicion_score: 0 }).eq('id', currentUser.id);
            return { ok: true, waitSeconds: 0 };
        }
        throw e;
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
    persistBehavior(5);
}




safeAddListener(submitCaptchaBtn, 'click', async () => {
    const entered = (captchaInput ? captchaInput.value : "").trim().toUpperCase();
    
    if (entered === currentCaptchaSecret && currentCaptchaSecret !== "") {
        submitCaptchaBtn.disabled = true;
        submitCaptchaBtn.textContent = "Verifying...";




        try {
            const cleared = await clearSuspensionOnServer();
            if (!cleared.ok) {
                // Solved, but the server asks for a short wait after a suspension. Keep the window open.
                const mins = Math.max(1, Math.ceil(cleared.waitSeconds / 60));
                if (captchaStatusMsg) captchaStatusMsg.textContent = `Code accepted. Please wait about ${mins} minute${mins === 1 ? '' : 's'}, then press Verify again.`;
                return;
            }
            isSuspended = false;
            suspicionScore = 0;
            updateSuspicionUI();




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
        const row = {
            user_id: targetUserId,
            actor_username: currentUsername,
            type: type,
            entity_id: entityId || null,
            message: message,
            is_read: false
        };
        const { error } = await db.from('user_notifications').insert([row]);
        // Some deployments reject a non-numeric entity_id (e.g. a conversation uuid); retry without it.
        if (error && row.entity_id !== null) {
            await db.from('user_notifications').insert([{ ...row, entity_id: null }]);
        }
    } catch (e) {
        console.warn("Failed to dispatch notification:", e);
    }
}




async function loadUserNotifications() {
    if (!currentUser || !db || !notificationsList) return;

    // With the activity panel closed only the unread badge matters: ask for a count instead of
    // downloading and re-rendering 40 rows.
    const panelOpen = notificationsModal && !notificationsModal.classList.contains('hidden');
    if (!panelOpen) {
        try {
            const { count, error } = await db
                .from('user_notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', currentUser.id)
                .eq('is_read', false);
            if (error) throw error;

            const unread = count || 0;
            const text = unread > 99 ? '99+' : unread;
            [activityNotifBadge, mobileActivityBadge].forEach(badge => {
                if (!badge) return;
                if (unread > 0) { badge.textContent = text; badge.classList.remove('hidden'); }
                else badge.classList.add('hidden');
            });
        } catch (e) {
            console.warn("Notification badge refresh notice:", e);
        }
        return;
    }

    try {
        let { data: notifs, error } = await db
            .from('user_notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('id', { ascending: false })
            .limit(40);




        // Surface database blocks (e.g. RLS) once, without a blocking alert on every refresh.
        if (error) {
            console.error("Notifications Blocked:", error.message);
            if (!notifBlockedWarned) {
                notifBlockedWarned = true;
                showToast({
                    title: "Notifications unavailable",
                    message: error.message,
                    type: "error",
                    icon: "⚠",
                    duration: 6000,
                    force: true
                });
            }
            return;
        }




        notifs = (notifs || []).filter(n => !isBlockedUsername(n.actor_username));

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
            .ilike('author', likeExact(cleanUser));




        let total = 0;
        (posts || []).forEach(p => {
            total += (Number(p.likes || 0) - Number(p.dislikes || 0));
        });




        const { data: comments } = await db
            .from('post_comments')
            .select('likes, dislikes')
            .ilike('author', likeExact(cleanUser));




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
        if (userCardSafety) userCardSafety.classList.add('hidden');
        return;
    }

    // Report / Block are always available on someone else's card. A blocked member can't be messaged or befriended.
    if (userCardSafety) userCardSafety.classList.remove('hidden');
    refreshProfileSafetyUI();
    if (isBlockedUsername(targetProfileUsername) || isBlockedId(targetProfileId)) {
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
            .ilike('username', likeExact(cleanUser))
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
    // The live chat overlay sits at z-index 20000; lift the card above it when opened from there.
    const stageOpen = Boolean(voiceForumModal && !voiceForumModal.classList.contains('hidden'));
    userProfileModal.style.setProperty('z-index', stageOpen ? '21000' : '105', 'important');
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




// Realtime (postgres_changes on user_notifications + broadcast signaling) delivers new activity instantly.
// Polling is only a safety net, so it runs slowly, never in a background tab, and catches up the moment the
// tab becomes visible again. (It used to run 5 queries every 5 seconds, even while hidden.)
const NOTIF_POLL_MS = 20000;

function pollNotificationsOnce() {
    if (!currentUser || document.hidden) return;
    checkNotifications();
    loadUserNotifications();
}

function startNotificationPolling() {
    stopNotificationPolling();
    notifPollInterval = setInterval(pollNotificationsOnce, NOTIF_POLL_MS);
}

function stopNotificationPolling() {
    if (notifPollInterval) clearInterval(notifPollInterval);
    notifPollInterval = null;
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && notifPollInterval) pollNotificationsOnce();
});

async function syncUserState(user) {
    // A member who turned on two-factor login must enter a code before anything loads.
    if (user && !(await ensureMfaVerified(user))) return;
    if (!user) mfaCleared.clear();
    switchVoteStore(user ? user.id : null);
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
        onFounderSignedIn();
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
        await Promise.race([loadBlocks(), new Promise(r => setTimeout(r, 5000))]); // never let a slow query stall sign-in
        await syncCloudThreads();
        checkNotifications();
        loadUserNotifications();
        loadNotificationPreferences();
        initUserCallSignaling();
        initRealtimeActivityNotifications();
        startNotificationPolling();
        if (pendingSigninAlert) { pendingSigninAlert = false; announceSignIn(); }
    } else {
        currentUser = null;
        currentUsername = null;
        currentAvatarUrl = null;
        activeConversationId = null;
        currentUserIsPrivate = false;
        suspicionScore = 0;
        updateSuspicionUI();


        callSignalingInitTicket++;
        userNotifInitTicket++;
        if (userCallSignalingChannel && db) {
            removeChannelTracked(userCallSignalingChannel);
            userCallSignalingChannel = null;
        }
        if (userNotifRealtimeChannel && db) {
            removeChannelTracked(userNotifRealtimeChannel);
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
        stopNotificationPolling();




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
        clearBlocks();




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




    db.auth.onAuthStateChange(async (event, session) => {
        if (!hasBooted) return;
        const user = session?.user || null;
        // Supabase re-emits SIGNED_IN (tab refocus) and TOKEN_REFRESHED for the already signed-in user. A full
        // re-sync rebuilds the realtime channels, leaving a window where incoming calls can't be received.
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && user && currentUser && user.id === currentUser.id) {
            currentUser = user;
            return;
        }
        await syncUserState(user);
    });
}




safeAddListener(authToggleBtn, 'click', () => setSignUpMode(!isSignUpMode));

function setSignUpMode(on) {
    isSignUpMode = Boolean(on);
    const termsGroup = document.getElementById('auth-terms-group');
    if (termsGroup) termsGroup.classList.toggle('hidden', !isSignUpMode);
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
}




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
        const termsChk = document.getElementById('auth-terms-chk');
        if (termsChk && !termsChk.checked) {
            alert("Please confirm you are 13 or older and agree to the Terms of Use and Privacy Policy to create an account.");
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = "Sign Up";
            return;
        }
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
            alert("A Red Pearl code is required to join Turing's Gate.");
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = "Sign Up";
            if (window.turnstile) turnstile.reset();
            return;
        }




        // The database checks the code (check_invite_code) and ALSO enforces it when the account is created, so a
        // code that is sent along with the sign-up is what actually admits the member.
        const pearlCode = FOUNDER_KEY_RE.test(inviteCode.toUpperCase()) ? inviteCode.toUpperCase() : null;
        let codeValid = null; // true / false from the database, null when it cannot be asked
        let serverGate = false; // true when the database itself admits (and records) the code at sign-up
        try {
            const res = await db.rpc('check_invite_code', { p_code: inviteCode });
            if (res.error) throw res.error;
            codeValid = res.data === true;
            serverGate = true;
        } catch (e) {
            if (!isMissingFunctionError(e)) console.warn("Red Pearl code check notice:", e);
            // Older database without check_invite_code: use the previous checks.
            try {
                if (pearlCode) {
                    const res = await db.rpc('check_founder_pearl', { p_code: pearlCode });
                    if (!res.error) codeValid = res.data === true;
                } else {
                    const res = await db.from('invitations').select('id, status').eq('code', inviteCode).eq('status', 'pending').maybeSingle();
                    if (!res.error) codeValid = Boolean(res.data);
                }
            } catch (err2) { /* leave null */ }
        }

        if (codeValid !== true) {
            if (pearlCode && codeValid === false) {
                clearFounderPearl();
                alert("That Red Pearl code has expired or was already used. Pop a fresh pearl from the bowl.");
                if (authInviteInput()) authInviteInput().value = '';
                refreshFounder().then(() => { if (founderRemaining() > 0) openFounderModal(); });
            } else {
                alert(codeValid === false ? "Invalid or already used Red Pearl code." : "We couldn't check your Red Pearl code right now. Please try again in a moment.");
            }
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = "Sign Up";
            if (window.turnstile) turnstile.reset();
            return;
        }

        const { error } = await db.auth.signUp({
            email,
            password,
            options: { 
                data: { username: username, invite_code: inviteCode },
                captchaToken: captchaToken // Supabase backend validates this
            }
        });

        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = "Sign Up";

        if (error) {
            // The sign-in service hides the real reason behind a generic "Database error saving new user", which can mean
            // the code was just used or expired, or that the username is taken. The code was already checked a moment ago,
            // so keep the code and ask the person to check both.
            const generic = /database error saving new user/i.test(error.message || '');
            const codeProblem = /red pearl code/i.test(error.message || '');
            if (codeProblem && pearlCode) clearFounderPearl();
            alert(codeProblem
                ? "Your Red Pearl code was not accepted. It may have expired or already been used. Please try a different code."
                : generic
                    ? "We couldn't create your account. The username may already be taken, or your Red Pearl code may have just expired or been used. Please check both and try again."
                    : `Sign up error: ${error.message}`);
            if (window.turnstile) turnstile.reset(); 
            return;
        }

        // Burn the founder pearl so it can't be used twice (the bowl counter drops as the new profile appears).
        // (The database already did this when the account was created; this is only for older databases.)
        if (pearlCode) {
            if (!serverGate) db.rpc('claim_founder_pearl', { p_code: pearlCode, p_username: username }).then(null, () => {});
            clearFounderPearl();
        }

        // Mark invite as claimed and log chain-of-custody lineage
        if (inviteCode && !pearlCode && !serverGate) {
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
        pendingSigninAlert = true;
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




    // Real deletion: delete_my_account() (see safety.sql) removes the person's data AND their login. Apple
    // requires that in-app deletion actually deletes the account, not just a profile row.
    const doomedId = currentUser.id;
    let viaLegacyPath = false;
    let removedFiles = [];
    try {
        const { data: delData, error: rpcErr } = await db.rpc('delete_my_account');
        if (delData && Array.isArray(delData.files)) removedFiles = delData.files;
        if (rpcErr) {
            if (!isMissingFunctionError(rpcErr)) throw rpcErr;
            // The SQL hasn't been installed yet: fall back to removing the profile only.
            viaLegacyPath = true;
            const { error: profErr } = await db.from('profiles').delete().eq('id', doomedId);
            if (profErr) throw profErr;
        }
    } catch (err) {
        finalDeleteBtn.disabled = false;
        finalDeleteBtn.textContent = 'Confirm Delete';
        showToast({ title: "Account not deleted", message: `We couldn't delete your account (${err?.message || err}). Please try again, or email ${SUPPORT_EMAIL} and we'll delete it for you.`, type: "error", icon: "▵", duration: 10000, force: true });
        return;
    }

    // The profile photo and photos sent in chats belonged to this person only: remove them from storage too (best effort).
    await removeStoredFiles(removedFiles);
    try {
        Object.keys(localStorage).filter(k => k.includes(doomedId)).forEach(k => localStorage.removeItem(k));
    } catch (e) { /* storage unavailable */ }
    await db.auth.signOut({ scope: 'local' }).then(null, () => {});
    finalDeleteBtn.disabled = false;
    finalDeleteBtn.textContent = 'Confirm Delete';
    if (deleteConfirmModal) deleteConfirmModal.classList.add('hidden');
    showToast({
        title: viaLegacyPath ? "Profile removed" : "Account deleted",
        message: viaLegacyPath
            ? `Your profile has been removed. To erase your login email as well, email ${SUPPORT_EMAIL}.`
            : "Your account and personal data have been deleted.",
        type: viaLegacyPath ? "info" : "success", icon: "✓", duration: 10000, force: true
    });
});

// ---------------------------------------------------------------------------------------------------------
// SAFETY: reporting and blocking. Required for apps with user-generated content (App Store guideline 1.2):
// people can report posts, replies, messages and members, and block anyone they don't want to see.
// Reports land in the `reports` table (moderators review them in the Supabase dashboard); blocks are stored
// in `user_blocks` (falling back to this device if that table isn't installed yet). Both come from safety.sql.
// ---------------------------------------------------------------------------------------------------------
const SUPPORT_EMAIL = 'support@turingsgate.com';
const BLOCK_STORE_PREFIX = 'tg_blocks_';
let blocksServerBacked = true;

const isOwnUsername = (name) =>
    Boolean(currentUsername) && String(name || '').toLowerCase().replace('@', '') === currentUsername.toLowerCase().replace('@', '');

function isBlockedUsername(name) {
    return blockedNames.size > 0 && blockedNames.has(String(name || '').toLowerCase().replace('@', ''));
}
function isBlockedId(id) {
    return Boolean(id) && blockedById.has(id);
}
function isBlockedMessage(msg) {
    return Boolean(msg) && (isBlockedId(msg.sender_id) || isBlockedUsername(msg.sender_username));
}

function rebuildBlockIndex() {
    blockedNames.clear();
    blockedById.forEach(b => { if (b.username) blockedNames.add(String(b.username).toLowerCase()); });
}

function readLocalBlocks() {
    try {
        const raw = JSON.parse(localStorage.getItem(BLOCK_STORE_PREFIX + (currentUser ? currentUser.id : 'guest')) || '[]');
        return Array.isArray(raw) ? raw.filter(b => b && b.id) : [];
    } catch (e) { return []; }
}
function writeLocalBlocks() {
    try {
        const key = BLOCK_STORE_PREFIX + (currentUser ? currentUser.id : 'guest');
        if (blocksServerBacked) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify([...blockedById.values()]));
    } catch (e) { /* storage unavailable */ }
}

function clearBlocks() {
    blockedById.clear();
    blockedNames.clear();
    renderBlockedList();
}

async function loadBlocks() {
    blockedById.clear();
    if (!db || !currentUser) { rebuildBlockIndex(); renderBlockedList(); return; }
    const uid = currentUser.id;
    const local = readLocalBlocks();
    let serverRows = null;
    try {
        const { data, error } = await db.from('user_blocks').select('blocked_id, blocked_username');
        if (error) throw error;
        serverRows = data || [];
        blocksServerBacked = true;
    } catch (e) {
        if (isMissingRelationError(e)) blocksServerBacked = false;
        else console.warn("Block list load notice:", e);
    }
    if (!currentUser || currentUser.id !== uid) return; // signed out or switched account while loading

    (serverRows || []).forEach(r => blockedById.set(r.blocked_id, { id: r.blocked_id, username: r.blocked_username || '' }));
    const localOnly = local.filter(b => !blockedById.has(b.id));
    localOnly.forEach(b => blockedById.set(b.id, { id: b.id, username: b.username || '' }));
    rebuildBlockIndex();
    renderBlockedList();
    if (blockedById.size && cachedPosts.length) renderCurrentFeed(); // hide anything already on screen

    // Blocks made on this device before the table existed move to the account now.
    if (serverRows && localOnly.length) {
        db.from('user_blocks')
            .insert(localOnly.map(b => ({ blocker_id: uid, blocked_id: b.id, blocked_username: b.username || null })))
            .then(({ error }) => { if (!error) writeLocalBlocks(); }, () => {});
    }
}

// Re-draw everything that could be showing a blocked member's content.
function refreshAfterBlockChange() {
    renderBlockedList();
    if (typeof renderCurrentFeed === 'function') renderCurrentFeed();
    document.querySelectorAll('.comments-section:not(.hidden)').forEach(sec => {
        const pid = sec.id.replace('comments-section-', '');
        if (pid) loadCommentsForPost(pid);
    });
    if (dmModal && !dmModal.classList.contains('hidden')) {
        refreshMessagingHub();
        if (activeConversationId) loadMessages(true);
    }
    loadUserNotifications();
    checkNotifications();
}

async function blockUser(id, username) {
    if (!currentUser || !db || !id || id === currentUser.id) return false;
    const clean = String(username || '').toLowerCase().replace('@', '');
    if (blocksServerBacked) {
        const { error } = await db.from('user_blocks').insert({ blocker_id: currentUser.id, blocked_id: id, blocked_username: clean });
        if (error && error.code !== '23505') { // 23505 = already blocked
            if (isMissingRelationError(error)) {
                blocksServerBacked = false;
            } else {
                alert(`Could not block this member: ${error.message}`);
                return false;
            }
        }
    }
    blockedById.set(id, { id, username: clean });
    rebuildBlockIndex();
    writeLocalBlocks();

    // Best effort: drop any friendship either way. Messages and replies from them are hidden by the filters.
    db.from('friendships').delete()
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${currentUser.id})`)
        .then(() => refreshMessagingHub(), () => {});

    refreshAfterBlockChange();
    hapticTap('success');
    showToast({ title: "Member blocked", message: `@${clean} can no longer appear in your feed, chats or notifications.`, type: "success", icon: "⊘", duration: 4000, force: true });
    return true;
}

async function unblockUser(id) {
    if (!currentUser || !db || !id) return false;
    const entry = blockedById.get(id);
    if (blocksServerBacked) {
        const { error } = await db.from('user_blocks').delete().eq('blocker_id', currentUser.id).eq('blocked_id', id);
        if (error && !isMissingRelationError(error)) {
            alert(`Could not unblock this member: ${error.message}`);
            return false;
        }
    }
    blockedById.delete(id);
    rebuildBlockIndex();
    writeLocalBlocks();
    refreshAfterBlockChange();
    if (entry && entry.username) {
        showToast({ title: "Member unblocked", message: `@${entry.username} can appear for you again.`, type: "info", icon: "◈", duration: 3500, force: true });
    }
    return true;
}

async function resolveProfileId(username) {
    const clean = String(username || '').toLowerCase().replace('@', '');
    if (!clean || !db) return null;
    const { data } = await db.from('profiles').select('id').ilike('username', likeExact(clean)).maybeSingle();
    return data ? data.id : null;
}

function renderBlockedList() {
    const box = document.getElementById('blocked-users-list');
    if (!box) return;
    if (blockedById.size === 0) {
        box.innerHTML = '<div class="no-posts" style="font-size: 0.8rem;">You haven\'t blocked anyone.</div>';
        return;
    }
    box.innerHTML = '';
    [...blockedById.values()]
        .sort((a, b) => String(a.username).localeCompare(String(b.username)))
        .forEach(b => {
            const row = document.createElement('div');
            row.className = 'blocked-row';
            row.innerHTML = `<span>@${escapeHTML(b.username || 'unknown')}</span><button type="button" class="secondary">Unblock</button>`;
            row.querySelector('button').addEventListener('click', async (e) => {
                e.currentTarget.disabled = true;
                const ok = await unblockUser(b.id);
                if (!ok) e.currentTarget.disabled = false;
            });
            box.appendChild(row);
        });
}

function refreshProfileSafetyUI() {
    if (!userCardBlockBtn) return;
    const blocked = isBlockedUsername(targetProfileUsername) || isBlockedId(targetProfileId);
    userCardBlockBtn.textContent = blocked ? 'Unblock' : 'Block';
}

safeAddListener(userCardBlockBtn, 'click', async () => {
    if (!currentUser) { alert("Please log in to block members."); return; }
    if (!targetProfileId) { alert("Could not find this member."); return; }
    userCardBlockBtn.disabled = true;
    try {
        if (isBlockedId(targetProfileId)) {
            await unblockUser(targetProfileId);
        } else if (await uiConfirm("Their posts, replies, messages and notifications will be hidden from you, and they won't be able to ring you. You can unblock them any time in Settings > Privacy.", { title: `Block @${targetProfileUsername}?`, confirmText: 'Block', danger: true })) {
            await blockUser(targetProfileId, targetProfileUsername);
        }
    } finally {
        userCardBlockBtn.disabled = false;
    }
    await updateProfileFriendButtonUI();
});

safeAddListener(userCardReportBtn, 'click', () => {
    openReportModal({ type: 'user', id: targetProfileId || targetProfileUsername, username: targetProfileUsername, context: '' });
});

// --- Report dialog ---
const reportModal = document.getElementById('report-modal');
const reportDetailsInput = document.getElementById('report-details');
const reportStatusEl = document.getElementById('report-status');
const reportSubmitBtn = document.getElementById('submit-report-btn');
const REPORT_NOUN = { post: 'post', comment: 'reply', message: 'message', user: 'member' };
let reportTarget = null;
let reportSending = false;

function setReportStatus(text, ok = false, mailto = false) {
    if (!reportStatusEl) return;
    reportStatusEl.classList.toggle('ok', ok);
    reportStatusEl.textContent = text;
    if (mailto) {
        reportStatusEl.appendChild(document.createTextNode(' '));
        const a = document.createElement('a');
        a.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Report from Turing's Gate")}`;
        a.textContent = SUPPORT_EMAIL;
        a.style.color = '#7dd3fc';
        reportStatusEl.appendChild(a);
    }
}

function openReportModal(target) {
    if (!reportModal || !target) return;
    if (!currentUser) { alert("Please log in to report content."); return; }
    if (isOwnUsername(target.username)) return;
    reportTarget = target;
    reportSending = false;

    const noun = REPORT_NOUN[target.type] || 'content';
    const who = target.username ? ` by @${target.username}` : '';
    document.getElementById('report-modal-title').textContent = `⚑ Report ${noun}`;
    document.getElementById('report-modal-intro').textContent =
        target.type === 'user'
            ? `What's wrong with @${target.username}? Your report is private.`
            : `What's wrong with this ${noun}${who}? Your report is private.`;
    const ctx = document.getElementById('report-context');
    const ctxText = String(target.context || '').replace(/\s+/g, ' ').trim().slice(0, 300);
    ctx.textContent = ctxText;
    ctx.classList.toggle('hidden', !ctxText);

    reportModal.querySelectorAll('input[name="report-reason"]').forEach(r => { r.checked = false; });
    if (reportDetailsInput) reportDetailsInput.value = '';
    setReportStatus('');
    if (reportSubmitBtn) { reportSubmitBtn.disabled = false; reportSubmitBtn.textContent = 'Send Report'; }
    reportModal.classList.remove('hidden');
    const first = reportModal.querySelector('input[name="report-reason"]');
    if (first) first.focus({ preventScroll: true });
}

function closeReportModal() {
    if (reportModal) reportModal.classList.add('hidden');
    reportTarget = null;
}

async function submitReport() {
    if (reportSending || !reportTarget || !currentUser || !db) return;
    const picked = reportModal.querySelector('input[name="report-reason"]:checked');
    if (!picked) { setReportStatus('Please choose a reason.'); return; }

    const target = reportTarget;
    const row = {
        reporter_id: currentUser.id,
        target_type: target.type,
        target_id: String(target.id == null ? '' : target.id),
        target_username: target.username ? String(target.username).toLowerCase().replace('@', '') : null,
        reason: picked.value,
        details: (reportDetailsInput ? reportDetailsInput.value.trim() : '').slice(0, 500) || null,
        context: String(target.context || '').replace(/\s+/g, ' ').trim().slice(0, 300) || null
    };

    reportSending = true;
    reportSubmitBtn.disabled = true;
    reportSubmitBtn.textContent = 'Sending...';
    setReportStatus('');

    let done = false;
    try {
        const { error } = await db.from('reports').insert(row);
        if (!error || error.code === '23505') {
            done = true; // 23505: this exact item was already reported by this person
        } else if (isMissingRelationError(error)) {
            setReportStatus("Reports can't be filed from here right now. Please email", false, true);
        } else {
            setReportStatus(`Could not send the report: ${error.message}`);
        }
    } catch (e) {
        setReportStatus('Could not send the report. Check your connection and try again.');
    }
    reportSending = false;
    if (!done) {
        reportSubmitBtn.disabled = false;
        reportSubmitBtn.textContent = 'Send Report';
        return;
    }

    closeReportModal();
    hapticTap('success');
    showToast({ title: "Report received", message: "Thank you. Our moderators will review it.", type: "success", icon: "⚑", duration: 4500, force: true });

    // Offer to block as well, for anything that isn't a profile report (the card has its own Block button).
    if (target.type !== 'user' && target.username && !isBlockedUsername(target.username)) {
        setTimeout(async () => {
            if (!(await uiConfirm("You won't see their posts, replies or messages any more.", { title: `Also block @${target.username}?`, confirmText: 'Block', cancelText: 'No thanks', danger: true }))) return;
            const id = await resolveProfileId(target.username);
            if (id) await blockUser(id, target.username);
            else alert("Could not find that member to block.");
        }, 150);
    }
}

safeAddListener(reportSubmitBtn, 'click', submitReport);
safeAddListener(document.getElementById('cancel-report-btn'), 'click', closeReportModal);
safeAddListener(document.getElementById('close-report-modal-btn'), 'click', closeReportModal);
safeAddListener(reportModal, 'click', (e) => { if (e.target === reportModal) closeReportModal(); });
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && reportModal && !reportModal.classList.contains('hidden')) closeReportModal();
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




// --- JOINED THREADS PANEL (collapsible on single-column / phone layouts) ---
const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
const sidebarActiveName = document.getElementById('sidebar-active-name');
const singleColumnQuery = window.matchMedia ? window.matchMedia('(max-width: 860px)') : { matches: false };

function setSidebarCollapsed(collapsed) {
    const panel = document.querySelector('.threads-sidebar');
    if (!panel) return;
    panel.classList.toggle('collapsed', collapsed);
    if (sidebarCollapseBtn) sidebarCollapseBtn.setAttribute('aria-expanded', String(!collapsed));
}

// On phones the feed comes first; the list is one tap away. (The class is ignored by the stylesheet on
// wide screens, so rotating or resizing just works.)
setSidebarCollapsed(singleColumnQuery.matches);
if (sidebarCollapseBtn) {
    sidebarCollapseBtn.addEventListener('click', () => {
        const panel = document.querySelector('.threads-sidebar');
        setSidebarCollapsed(!(panel && panel.classList.contains('collapsed')));
    });
}

function renderJoinedThreadsSidebar() {
    if (!joinedThreadsContainer) return;
    joinedThreadsContainer.innerHTML = '';
    if (sidebarActiveName) sidebarActiveName.textContent = activeThread || '';




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
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${icon} ${escapeHTML(tName)}</span>${isMandatory ? '<span class="thread-default-tag" style="font-size: 0.68rem; opacity: 0.7; margin-left: 6px;">Default</span>' : ''}
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
                // Picking a thread on a phone: tuck the list away and show the feed.
                if (singleColumnQuery.matches) setSidebarCollapsed(true);




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
            bannerBtn.onclick = () => { if (!canSetThreadBanner()) { denyBannerChange(); return; } document.getElementById('banner-upload-input').click(); };
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
                const input = await uiPrompt('Shown next to your name in this thread. Leave it blank to remove it.', { title: `Set your flair for "${activeThread}"`, value: currentFlair, maxLength: 18, placeholder: 'e.g. Night Owl', confirmText: 'Save' });
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
        return `${space}<span class="clickable-thread" data-thread="${escapeHTML(actualName)}" title="Go to ${escapeHTML(actualName)}">T/${threadRaw}</span>`;
    });




    return withThreadLinks.replace(/\n/g, '<br>');
}




// --- POST MEDIA: MULTI-PHOTO CAROUSELS & INLINE VIDEO ---
// Storage format (Posts.image_url, still a plain text column):
//   * one photo        -> the bare URL, exactly as before (older posts keep working)
//   * several / video  -> JSON array of { t: 'i'|'v', u: url, p?: poster url, w?, h? }
const MAX_POST_MEDIA = 10;
const MAX_POST_VIDEOS = 3;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // must not exceed the bucket limit AND the project-wide upload limit in Supabase
const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
const MEDIA_BUCKET = 'chat-images';
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|ogv)(?:[?#].*)?$/i;

let postMediaQueue = []; // { id, file, kind, thumbUrl, poster: {blob, w, h} | null, duration }
let postMediaSeq = 0;

function isVideoFile(file) {
    return (file.type && file.type.startsWith('video/')) || VIDEO_EXT_RE.test(file.name || '');
}

function safeMediaUrl(url) {
    return typeof url === 'string' && /^https?:\/\//i.test(url.trim()) ? url.trim() : '';
}

function formatBytes(bytes) {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// Small preview for the composer so ten 12MP photos don't sit decoded in memory.
async function makeImageThumb(file) {
    try {
        const bitmap = await createImageBitmap(file, { resizeWidth: 220, resizeQuality: 'medium' });
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext('2d').drawImage(bitmap, 0, 0);
        if (bitmap.close) bitmap.close();
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.7));
        if (blob) return URL.createObjectURL(blob);
    } catch (e) {}
    return URL.createObjectURL(file);
}

// First-frame poster + dimensions for a video, so feed cards lay out instantly
// and don't download any video bytes until they are scrolled into view.
function extractVideoMeta(file) {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        let settled = false;

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            video.removeAttribute('src');
            video.load();
            URL.revokeObjectURL(url);
            resolve(result);
        };

        const timer = setTimeout(() => finish(null), 10000);

        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.addEventListener('error', () => finish(null));
        video.addEventListener('loadedmetadata', () => {
            try {
                video.currentTime = Math.min(0.1, (video.duration || 1) / 2);
            } catch (e) { finish(null); }
        });
        video.addEventListener('seeked', () => {
            const maxWidth = 960;
            const scale = Math.min(1, maxWidth / (video.videoWidth || maxWidth));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(2, Math.round(video.videoWidth * scale));
            canvas.height = Math.max(2, Math.round(video.videoHeight * scale));
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            const duration = video.duration;
            const w = video.videoWidth;
            const h = video.videoHeight;
            canvas.toBlob((blob) => {
                finish(blob ? { blob, w, h, duration } : { blob: null, w, h, duration });
            }, 'image/jpeg', 0.72);
        });
        video.src = url;
    });
}

async function prepareMediaItem(item) {
    if (item.kind === 'image') {
        item.thumbUrl = await makeImageThumb(item.file);
    } else {
        const meta = await extractVideoMeta(item.file);
        if (meta) {
            item.poster = meta.blob ? { blob: meta.blob, w: meta.w, h: meta.h } : null;
            item.width = meta.w;
            item.height = meta.h;
            item.duration = meta.duration;
            if (meta.blob) item.thumbUrl = URL.createObjectURL(meta.blob);
        }
    }
    // The item may have been removed while it was being prepared.
    if (!postMediaQueue.includes(item)) {
        releaseMediaItem(item);
        return;
    }
    renderPostMediaPreview();
}

function releaseMediaItem(item) {
    if (item.thumbUrl) {
        try { URL.revokeObjectURL(item.thumbUrl); } catch (e) {}
        item.thumbUrl = null;
    }
}

function clearPostMedia() {
    postMediaQueue.forEach(releaseMediaItem);
    postMediaQueue = [];
    if (postImageFile) postImageFile.value = '';
    renderPostMediaPreview();
}

function renderPostMediaPreview() {
    if (!postPhotoPreviewBar) return;
    const grid = document.getElementById('post-media-grid');

    if (postMediaQueue.length === 0) {
        postPhotoPreviewBar.classList.add('hidden');
        if (grid) grid.innerHTML = '';
        return;
    }

    postPhotoPreviewBar.classList.remove('hidden');

    const videos = postMediaQueue.filter(m => m.kind === 'video').length;
    const photos = postMediaQueue.length - videos;
    const totalBytes = postMediaQueue.reduce((sum, m) => sum + m.file.size, 0);
    const parts = [];
    if (photos) parts.push(`${photos} photo${photos === 1 ? '' : 's'}`);
    if (videos) parts.push(`${videos} video${videos === 1 ? '' : 's'}`);
    if (postPhotoFilename) {
        postPhotoFilename.textContent = `◈ ${parts.join(' · ')} (${formatBytes(totalBytes)}) — ${postMediaQueue.length}/${MAX_POST_MEDIA}`;
    }

    if (!grid) return;
    grid.innerHTML = postMediaQueue.map((m, i) => `
        <div class="post-media-thumb" data-id="${m.id}">
            ${m.thumbUrl
                ? `<img src="${m.thumbUrl}" alt="Attachment ${i + 1}" draggable="false">`
                : `<div class="post-media-loading"></div>`}
            ${m.kind === 'video' ? '<span class="post-media-badge">▶ Video</span>' : ''}
            <span class="post-media-order">${i + 1}</span>
            <button type="button" class="post-media-btn post-media-remove" data-act="remove" data-id="${m.id}" aria-label="Remove attachment ${i + 1}">✕</button>
            ${postMediaQueue.length > 1 ? `
                <div class="post-media-move">
                    <button type="button" class="post-media-btn" data-act="left" data-id="${m.id}" aria-label="Move earlier" ${i === 0 ? 'disabled' : ''}>‹</button>
                    <button type="button" class="post-media-btn" data-act="right" data-id="${m.id}" aria-label="Move later" ${i === postMediaQueue.length - 1 ? 'disabled' : ''}>›</button>
                </div>` : ''}
        </div>
    `).join('');
}

function addPostMediaFiles(fileList) {
    const rejected = [];

    for (const file of Array.from(fileList || [])) {
        const video = isVideoFile(file);

        if (!video && !(file.type && file.type.startsWith('image/'))) {
            rejected.push(`${file.name}: only photos and videos can be attached.`);
            continue;
        }
        if (postMediaQueue.length >= MAX_POST_MEDIA) {
            rejected.push(`A post can have at most ${MAX_POST_MEDIA} attachments.`);
            break;
        }
        if (video) {
            if (postMediaQueue.filter(m => m.kind === 'video').length >= MAX_POST_VIDEOS) {
                rejected.push(`A post can have at most ${MAX_POST_VIDEOS} videos.`);
                continue;
            }
            if (file.size > MAX_VIDEO_BYTES) {
                rejected.push(`${file.name} is ${formatBytes(file.size)}; videos must be under ${formatBytes(MAX_VIDEO_BYTES)}.`);
                continue;
            }
        } else if (file.size > MAX_IMAGE_BYTES) {
            rejected.push(`${file.name} is ${formatBytes(file.size)}; photos must be under ${formatBytes(MAX_IMAGE_BYTES)}.`);
            continue;
        }

        const item = {
            id: ++postMediaSeq,
            file,
            kind: video ? 'video' : 'image',
            thumbUrl: null,
            poster: null,
            width: 0,
            height: 0,
            duration: 0
        };
        postMediaQueue.push(item);
        item.ready = prepareMediaItem(item).then(null, () => {});
    }

    renderPostMediaPreview();

    if (rejected.length) {
        showToast({
            title: "Some files were skipped",
            message: Array.from(new Set(rejected)).join(' '),
            type: "error",
            icon: "⚠",
            duration: 6500,
            force: true
        });
    }
}

safeAddListener(postImageFile, 'change', () => {
    addPostMediaFiles(postImageFile.files);
    // Allow picking the same file again after removing it.
    postImageFile.value = '';
});

safeAddListener(removePostPhotoBtn, 'click', clearPostMedia);

safeAddListener(document.getElementById('post-media-grid'), 'click', (e) => {
    const btn = e.target.closest('.post-media-btn');
    if (!btn || btn.disabled) return;

    const id = Number(btn.getAttribute('data-id'));
    const index = postMediaQueue.findIndex(m => m.id === id);
    if (index < 0) return;

    const act = btn.getAttribute('data-act');
    if (act === 'remove') {
        releaseMediaItem(postMediaQueue[index]);
        postMediaQueue.splice(index, 1);
    } else {
        const target = act === 'left' ? index - 1 : index + 1;
        if (target < 0 || target >= postMediaQueue.length) return;
        [postMediaQueue[index], postMediaQueue[target]] = [postMediaQueue[target], postMediaQueue[index]];
    }
    renderPostMediaPreview();
});

// --- RESUMABLE (TUS) UPLOADS FOR BIG FILES ---
// Anything over 6 MB goes through Supabase's resumable endpoint, so a dropped mobile connection picks up
// where it stopped instead of restarting. Smaller files, and a resumable upload that never gets going
// (client fails to load, endpoint refuses), use the plain single-request upload.
const RESUMABLE_MIN_BYTES = 6 * 1024 * 1024;
const RESUMABLE_CHUNK_BYTES = 6 * 1024 * 1024; // Supabase requires exactly 6 MB chunks
const TUS_LIB_URL = '/vendor/tus-js-client-4.3.1.min.js';
let tusLibPromise = null;

// Loads the vendored tus client the first time a big file is uploaded.
function loadTusLib() {
    if (window.tus && window.tus.Upload) return Promise.resolve(window.tus);
    if (!tusLibPromise) {
        tusLibPromise = new Promise((resolve, reject) => {
            const tag = document.createElement('script');
            let timer = null;
            const fail = () => {
                clearTimeout(timer);
                tag.remove();
                reject(new Error('The upload helper did not load.'));
            };
            tag.onload = () => {
                clearTimeout(timer);
                if (window.tus && window.tus.Upload) resolve(window.tus); else fail();
            };
            tag.onerror = fail;
            timer = setTimeout(fail, 20000);
            tag.src = TUS_LIB_URL;
            document.head.appendChild(tag);
        });
        // A failed load is not cached, so the next big file tries again.
        tusLibPromise.catch(() => { tusLibPromise = null; });
    }
    return tusLibPromise;
}

// getSession hands back a refreshed token when the current one is about to expire.
async function getUploadAuthHeader() {
    let token = null;
    try {
        const { data } = await db.auth.getSession();
        token = data && data.session ? data.session.access_token : null;
    } catch (e) {}
    return `Bearer ${token || SUPABASE_ANON_KEY}`;
}

function describeTusError(err) {
    const res = err && err.originalResponse;
    if (!res) {
        if (err && err.originalRequest) return 'the connection dropped, check your network and try again';
        return (err && err.message) || 'upload failed';
    }
    let detail = '';
    try {
        const body = JSON.parse(res.getBody());
        detail = body.message || body.error || '';
    } catch (e) {}
    return detail || `the server answered ${res.getStatus()}`;
}

// Uploads one file in resumable chunks and resolves with the stored path (a resumed upload keeps the path it
// started with). Rejects with err.fallback set when the server never took the upload, so the caller can use
// the plain upload. Running uploads are tracked in `jobs` so the caller can cancel them if another file fails.
async function uploadResumable(file, { path, contentType, cacheControl, jobs, onBytes }) {
    let tus;
    try {
        tus = await loadTusLib();
        if (tus.isSupported === false) throw new Error('Resumable uploads are not supported here.');
    } catch (err) {
        err.fallback = true;
        throw err;
    }

    const job = { path, cancelled: false, cancel: null };
    let succeed = null;
    let fail = null;
    const finished = new Promise((resolve, reject) => { succeed = resolve; fail = reject; });
    finished.catch(() => {}); // cancelled before anyone awaited it

    const metadata = { bucketName: MEDIA_BUCKET, objectName: path, contentType, cacheControl };
    const upload = new tus.Upload(file, {
        endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
        headers: { apikey: SUPABASE_ANON_KEY, 'x-upsert': 'false' },
        metadata,
        chunkSize: RESUMABLE_CHUNK_BYTES,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        // A fresh token on every request, retries included, so a long upload outlives the first one.
        onBeforeRequest: async (req) => { req.setHeader('authorization', await getUploadAuthHeader()); },
        // A 401 is most likely an expired token, which the retry replaces.
        onShouldRetry: (err, attempt, options) => {
            const res = err && err.originalResponse;
            if (res && res.getStatus() === 401) return attempt < 2;
            return tus.defaultOptions.onShouldRetry(err, attempt, options);
        },
        onProgress: (sent) => onBytes(sent),
        onSuccess: () => succeed(),
        onError: (err) => fail(err)
    });

    job.cancel = () => {
        job.cancelled = true;
        upload.abort(true).then(null, () => {});
        fail(Object.assign(new Error('Upload cancelled'), { cancelled: true }));
    };
    jobs.add(job);

    try {
        // Resume an earlier attempt at this same file (name, size, date) if the server still holds it.
        try {
            const mine = `forum_posts/${currentUser.id}_`;
            const earlier = (await upload.findPreviousUploads())
                .filter(p => p.uploadUrl && p.metadata && p.metadata.bucketName === MEDIA_BUCKET
                    && typeof p.metadata.objectName === 'string' && p.metadata.objectName.startsWith(mine))
                .sort((a, b) => (Date.parse(b.creationTime) || 0) - (Date.parse(a.creationTime) || 0));
            if (earlier.length) {
                metadata.objectName = earlier[0].metadata.objectName;
                job.path = metadata.objectName;
                upload.resumeFromPreviousUpload(earlier[0]);
            }
        } catch (e) {}

        if (!job.cancelled) upload.start();
        await finished;
        return job.path;
    } catch (err) {
        if (err.cancelled) throw err;
        const message = describeTusError(err); // before abort(), which resets the request the response is read from
        const started = !!upload.url;
        // Drop what the server holds for this try. Offline that fails and the stored link stays for next time.
        upload.abort(true).then(null, () => {});
        const failure = new Error(message);
        failure.fallback = !started;
        failure.path = job.path;
        throw failure;
    } finally {
        jobs.delete(job);
    }
}

// Uploads every queued attachment (3 at a time) and returns the media entries
// to store on the post. On any failure the files already uploaded are removed.
// onProgress(completed, total) fires per finished file; onBytes(sent, total) tracks bytes across all files
// (each item also keeps its own count in item.uploadedBytes).
async function uploadPostMedia(items, onProgress, onBytes) {
    // Posters and dimensions are still being extracted if the user publishes quickly.
    await Promise.all(items.map(item => item.ready).filter(Boolean));

    const entries = new Array(items.length);
    const uploadedPaths = [];
    const resumableJobs = new Set();
    const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0) || 1;
    let completed = 0;
    let next = 0;
    let failure = null;

    items.forEach(item => { item.uploadedBytes = 0; });

    const reportBytes = (index, bytes) => {
        const item = items[index];
        item.uploadedBytes = Math.max(item.uploadedBytes, Math.min(bytes, item.file.size)); // never goes backwards on a retry
        if (onBytes) onBytes(items.reduce((sum, m) => sum + m.uploadedBytes, 0), totalBytes);
    };

    // Stops the resumable uploads still running after a failure. Their paths are rolled back too in case
    // the last chunk had already landed.
    const cancelResumable = () => {
        resumableJobs.forEach(job => { uploadedPaths.push(job.path); job.cancel(); });
        resumableJobs.clear();
    };

    const uploadOne = async (item, index) => {
        const stamp = `${currentUser.id}_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`;
        const uploadOpts = (contentType) => ({ contentType, cacheControl: '31536000', upsert: false });

        // Big files go up in resumable chunks; everything else, and a resumable upload that never started, in one request.
        const storeFile = async (file, path, opts) => {
            if (file.size > RESUMABLE_MIN_BYTES) {
                try {
                    const stored = await uploadResumable(file, {
                        path, contentType: opts.contentType, cacheControl: opts.cacheControl,
                        jobs: resumableJobs, onBytes: (sent) => reportBytes(index, sent)
                    });
                    return { path: stored, error: null };
                } catch (err) {
                    if (!err.fallback) {
                        if (err.path) uploadedPaths.push(err.path);
                        return { path, error: err };
                    }
                }
            }
            const { error } = await db.storage.from(MEDIA_BUCKET).upload(path, file, opts);
            return { path, error };
        };

        if (item.kind === 'image') {
            const compressed = await compressImage(item.file, 1280, 0.78);
            const ext = (compressed.name.split('.').pop() || 'jpeg').toLowerCase();
            const { path, error } = await storeFile(compressed, `forum_posts/${stamp}.${ext}`, uploadOpts(compressed.type || 'image/jpeg'));
            if (error) throw new Error(`"${item.file.name}": ${error.message}`);
            uploadedPaths.push(path);
            entries[index] = { t: 'i', u: db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl };
            return;
        }

        const ext = (item.file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
        const videoType = item.file.type || (ext === 'webm' ? 'video/webm' : 'video/mp4');
        const { path, error } = await storeFile(item.file, `forum_posts/${stamp}.${ext}`, uploadOpts(videoType));
        if (error) throw new Error(`"${item.file.name}": ${error.message}`);
        uploadedPaths.push(path);

        const entry = { t: 'v', u: db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl };
        if (item.width && item.height) { entry.w = item.width; entry.h = item.height; }

        if (item.poster && item.poster.blob) {
            const posterPath = `forum_posts/${stamp}_poster.jpeg`;
            const posterRes = await db.storage.from(MEDIA_BUCKET).upload(posterPath, item.poster.blob, uploadOpts('image/jpeg'));
            if (!posterRes.error) {
                uploadedPaths.push(posterPath);
                entry.p = db.storage.from(MEDIA_BUCKET).getPublicUrl(posterPath).data.publicUrl;
            }
        }
        entries[index] = entry;
    };

    const worker = async () => {
        while (!failure && next < items.length) {
            const index = next++;
            try {
                await uploadOne(items[index], index);
                reportBytes(index, items[index].file.size);
                completed++;
                if (onProgress) onProgress(completed, items.length);
            } catch (err) {
                failure = failure || err;
                cancelResumable();
            }
        }
    };

    await Promise.all([worker(), worker(), worker()]);

    if (failure) {
        if (uploadedPaths.length) {
            await db.storage.from(MEDIA_BUCKET).remove(Array.from(new Set(uploadedPaths))).then(null, () => {});
        }
        throw new Error(`Upload failed for ${failure.message}`);
    }
    return entries;
}

function encodePostMedia(entries) {
    if (!entries || entries.length === 0) return null;
    if (entries.length === 1 && entries[0].t === 'i') return entries[0].u; // legacy single-photo format
    return JSON.stringify(entries);
}

function parsePostMedia(raw) {
    if (!raw) return [];

    let list = null;
    if (Array.isArray(raw)) {
        list = raw;
    } else if (typeof raw === 'string') {
        const text = raw.trim();
        if (text.startsWith('[')) {
            try { list = JSON.parse(text); } catch (e) { list = null; }
        }
        if (!Array.isArray(list)) list = [text];
    }
    if (!list) return [];

    return list.slice(0, 20).map((entry) => {
        if (typeof entry === 'string') {
            const url = safeMediaUrl(entry);
            return url ? { type: VIDEO_EXT_RE.test(url) ? 'video' : 'image', url } : null;
        }
        if (!entry || typeof entry !== 'object') return null;
        const url = safeMediaUrl(entry.u || entry.url || entry.v);
        if (!url) return null;
        const isVideo = entry.t === 'v' || Boolean(entry.v) || VIDEO_EXT_RE.test(url);
        return {
            type: isVideo ? 'video' : 'image',
            url,
            poster: safeMediaUrl(entry.p),
            width: Number(entry.w) || 0,
            height: Number(entry.h) || 0
        };
    }).filter(Boolean);
}

const PLAY_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
const MUTED_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
const SOUND_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
const FULLSCREEN_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';

function videoSlideHtml(media, inCarousel) {
    const ratio = media.width && media.height ? `aspect-ratio: ${media.width} / ${media.height};` : '';
    const poster = media.poster ? ` poster="${escapeHTML(media.poster)}"` : '';
    // Without a poster, fetch metadata up front so the first frame can show.
    const preload = media.poster ? 'none' : 'metadata';
    const initialSrc = media.poster ? '' : ` src="${escapeHTML(media.url)}#t=0.001"`;

    return `
        <div class="video-wrap${inCarousel ? ' in-carousel' : ''} is-paused is-muted" style="${ratio}">
            <video class="inline-video" muted loop playsinline webkit-playsinline preload="${preload}"${poster}${initialSrc}
                   data-src="${escapeHTML(media.url)}" aria-label="Video attachment"></video>
            <button type="button" class="video-center-play" aria-label="Play video">${PLAY_ICON}</button>
            <div class="video-controls">
                <button type="button" class="video-btn video-mute" aria-label="Toggle sound"><span class="icon-muted">${MUTED_ICON}</span><span class="icon-sound">${SOUND_ICON}</span></button>
                <button type="button" class="video-btn video-fs" aria-label="Fullscreen">${FULLSCREEN_ICON}</button>
            </div>
            <div class="video-progress" role="slider" aria-label="Seek" aria-valuemin="0" aria-valuemax="100"><div class="video-progress-bar"></div></div>
            <div class="video-error hidden">Video unavailable. <a href="${escapeHTML(media.url)}" target="_blank" rel="noopener noreferrer">Open file</a></div>
        </div>`;
}

function renderPostMediaHtml(post) {
    const media = parsePostMedia(post.image_url);
    if (media.length === 0) return '';

    const slide = (m, index, inCarousel) => {
        if (m.type === 'video') return videoSlideHtml(m, inCarousel);
        const url = escapeHTML(m.url);
        return inCarousel
            ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="media-link"><img src="${url}" class="media-img" alt="Post photo ${index + 1} of ${media.length}" loading="lazy" decoding="async" draggable="false"></a>`
            : `<a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${url}" class="post-img-thumb" alt="Post photo" loading="lazy" decoding="async"></a>`;
    };

    if (media.length === 1) {
        return `<div class="post-media">${slide(media[0], 0, false)}</div>`;
    }

    return `
        <div class="media-carousel" data-count="${media.length}" data-index="0" role="group" aria-roledescription="carousel" aria-label="${media.length} attachments">
            <div class="media-track" tabindex="0">
                ${media.map((m, i) => `<div class="media-slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${media.length}">${slide(m, i, true)}</div>`).join('')}
            </div>
            <button type="button" class="media-nav media-prev" aria-label="Previous attachment" hidden>‹</button>
            <button type="button" class="media-nav media-next" aria-label="Next attachment">›</button>
            <div class="media-counter" aria-hidden="true">1 / ${media.length}</div>
            <div class="media-dots">${media.map((_, i) => `<button type="button" class="media-dot${i === 0 ? ' active' : ''}" data-i="${i}" aria-label="Go to attachment ${i + 1}"></button>`).join('')}</div>
        </div>`;
}

// --- Carousel behaviour (delegated, one listener set for the whole feed) ---
function syncCarousel(carousel) {
    const track = carousel.querySelector('.media-track');
    if (!track || !track.clientWidth) return;

    const count = Number(carousel.dataset.count) || 1;
    const index = Math.max(0, Math.min(count - 1, Math.round(track.scrollLeft / track.clientWidth)));
    carousel.dataset.index = String(index);

    const counter = carousel.querySelector('.media-counter');
    if (counter) counter.textContent = `${index + 1} / ${count}`;
    carousel.querySelectorAll('.media-dot').forEach((dot, i) => dot.classList.toggle('active', i === index));

    const prev = carousel.querySelector('.media-prev');
    const next = carousel.querySelector('.media-next');
    if (prev) prev.hidden = index === 0;
    if (next) next.hidden = index === count - 1;
}

function goToSlide(carousel, index) {
    const track = carousel.querySelector('.media-track');
    const count = Number(carousel.dataset.count) || 1;
    if (!track) return;
    const target = Math.max(0, Math.min(count - 1, index));
    track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' });
}

document.addEventListener('scroll', (e) => {
    const track = e.target;
    if (!(track instanceof Element) || !track.classList.contains('media-track')) return;
    if (track._syncFrame) return;
    track._syncFrame = requestAnimationFrame(() => {
        track._syncFrame = 0;
        const carousel = track.closest('.media-carousel');
        if (carousel) syncCarousel(carousel);
    });
}, true);

document.addEventListener('keydown', (e) => {
    const track = e.target;
    if (!(track instanceof Element) || !track.classList.contains('media-track')) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const carousel = track.closest('.media-carousel');
    if (!carousel) return;
    e.preventDefault();
    goToSlide(carousel, Number(carousel.dataset.index) + (e.key === 'ArrowRight' ? 1 : -1));
});

// --- Inline video: plays muted while visible in the feed, pauses off-screen ---
const trackedVideos = new Set();
let activeInlineVideo = null;

const autoplayAllowed = () => {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saver = navigator.connection && navigator.connection.saveData;
    return !reduced && !saver;
};

function ensureVideoSource(video) {
    if (!video.getAttribute('src') && video.dataset.src) {
        video.src = video.dataset.src;
        video.load();
    }
}

function pauseInlineVideo(video) {
    if (!video) return;
    try { video.pause(); } catch (e) {}
    if (activeInlineVideo === video) activeInlineVideo = null;
}

function playInlineVideo(video) {
    if (video.dataset.userPaused === '1' || document.hidden || !autoplayAllowed()) return;
    if (activeInlineVideo && activeInlineVideo !== video) pauseInlineVideo(activeInlineVideo);
    activeInlineVideo = video;
    ensureVideoSource(video);
    const attempt = video.play();
    if (attempt && attempt.catch) attempt.catch(() => { /* autoplay blocked; the play button stays visible */ });
}

function releaseVideoSource(video) {
    // Free decoder/network resources for videos far from the viewport.
    if (!video.paused || !video.getAttribute('src') || video.dataset.userPaused === '1') return;
    video.removeAttribute('src');
    video.load();
}

const videoPlayObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        for (const entry of entries) {
            const video = entry.target;
            if (!video.isConnected) {
                videoPlayObserver.unobserve(video);
                trackedVideos.delete(video);
                if (activeInlineVideo === video) activeInlineVideo = null;
                continue;
            }
            video._ratio = entry.intersectionRatio;
            if (entry.intersectionRatio >= 0.6) playInlineVideo(video);
            else if (entry.intersectionRatio < 0.3) pauseInlineVideo(video);
        }
    }, { threshold: [0, 0.3, 0.6, 0.9] })
    : null;

const videoUnloadObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting && entry.target.isConnected) releaseVideoSource(entry.target);
        }
    }, { rootMargin: '250% 0px 250% 0px' })
    : null;

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseInlineVideo(activeInlineVideo);
        return;
    }
    // Resume whichever video is most visible after returning to the tab.
    let best = null;
    trackedVideos.forEach((video) => {
        if (video.isConnected && (video._ratio || 0) >= 0.6 && (!best || video._ratio > best._ratio)) best = video;
    });
    if (best) playInlineVideo(best);
});

function wireInlineVideo(video) {
    const wrap = video.closest('.video-wrap');
    if (!wrap) return;
    const bar = wrap.querySelector('.video-progress-bar');

    video.addEventListener('play', () => { wrap.classList.remove('is-paused'); });
    video.addEventListener('pause', () => { wrap.classList.add('is-paused'); });
    video.addEventListener('volumechange', () => { wrap.classList.toggle('is-muted', video.muted); });
    video.addEventListener('timeupdate', () => {
        if (bar && video.duration) bar.style.width = `${(video.currentTime / video.duration) * 100}%`;
    });
    video.addEventListener('error', () => {
        // A released source also fires no error; only real failures reach here.
        if (!video.getAttribute('src')) return;
        const message = wrap.querySelector('.video-error');
        if (message) message.classList.remove('hidden');
        wrap.classList.add('has-error');
    });

    trackedVideos.add(video);
    if (videoPlayObserver) videoPlayObserver.observe(video);
    if (videoUnloadObserver) videoUnloadObserver.observe(video);
}

function hydratePostMedia(root) {
    root.querySelectorAll('video.inline-video').forEach(wireInlineVideo);
}

document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    // Carousel arrows and dots
    const nav = target.closest('.media-nav, .media-dot');
    if (nav) {
        const carousel = nav.closest('.media-carousel');
        if (!carousel) return;
        const current = Number(carousel.dataset.index) || 0;
        if (nav.classList.contains('media-dot')) goToSlide(carousel, Number(nav.dataset.i));
        else goToSlide(carousel, current + (nav.classList.contains('media-next') ? 1 : -1));
        return;
    }

    const wrap = target.closest('.video-wrap');
    if (!wrap) return;
    const video = wrap.querySelector('video');
    if (!video) return;

    if (target.closest('.video-mute')) {
        video.muted = !video.muted;
        if (!video.muted && video.paused) {
            video.dataset.userPaused = '0';
            playInlineVideo(video);
        }
        return;
    }

    if (target.closest('.video-fs')) {
        ensureVideoSource(video);
        const request = video.requestFullscreen || video.webkitRequestFullscreen || video.webkitEnterFullscreen;
        if (request) {
            const result = request.call(video);
            if (result && result.catch) result.catch(() => {});
        }
        return;
    }

    if (target.closest('.video-progress')) {
        ensureVideoSource(video);
        const rect = wrap.querySelector('.video-progress').getBoundingClientRect();
        if (video.duration && rect.width) {
            video.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * video.duration;
        }
        return;
    }

    if (target.closest('.video-error a')) return;

    // Tap the picture or the big play button: toggle playback.
    if (video.paused) {
        video.dataset.userPaused = '0';
        activeInlineVideo && activeInlineVideo !== video && pauseInlineVideo(activeInlineVideo);
        activeInlineVideo = video;
        ensureVideoSource(video);
        const attempt = video.play();
        if (attempt && attempt.catch) attempt.catch(() => {});
    } else {
        video.dataset.userPaused = '1';
        pauseInlineVideo(video);
    }
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




        const nonFriendMembers = otherMembers.filter(m => !acceptedFriendIds.has(m.user_id) && !isBlockedId(m.user_id));




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




    let { data: requests, error } = await db
        .from('friendships')
        .select('id, user_id')
        .eq('friend_id', currentUser.id)
        .eq('status', 'pending');
    if (requests) requests = requests.filter(r => !isBlockedId(r.user_id));




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




    const friendIds = friendships.map(f => f.user_id === currentUser.id ? f.friend_id : f.user_id).filter(id => !isBlockedId(id));




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
        .ilike('username', likeExact(targetUsername))
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
        const { convId, isFriend } = await ensureDirectConversation(friend);
        selectConversation(convId, `@${friend.username}`, friend.id, friend.username, isFriend);
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


    unreadCountsByConv.delete(conversationId);
    let currentUnreadTotal = 0;
    unreadCountsByConv.forEach(c => currentUnreadTotal += c);
    if (currentUnreadTotal === 0) {
        if (notifBadge) { notifBadge.textContent = '0'; notifBadge.classList.add('hidden'); }
        if (mobileMsgBadge) { mobileMsgBadge.textContent = '0'; mobileMsgBadge.classList.add('hidden'); }
    }




    // Load the chat's privacy settings first so expired or cleared messages never flash on screen.
    chatPrivacy = { timer: 0, clearedAt: null };
    updateChatPrivacyUI();
    const openedConversation = conversationId;
    loadChatPrivacy(conversationId).then(() => { if (activeConversationId === openedConversation) loadMessages(true); });




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
                        .then(null, () => {});
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
    if (msg.created_at) row.dataset.created = msg.created_at;
    if (msg.expires_at) row.dataset.expires = msg.expires_at;
    if (isOptimistic) row.style.opacity = '0.75';




    const avatarImgHtml = `<img src="${attrUrl(senderAvatar, DEFAULT_AVATAR)}" class="msg-avatar clickable-avatar" data-username="${escapeHTML(msg.sender_username)}" alt="pfp" title="@${escapeHTML(msg.sender_username)}">`;
    const authorHtml = !isMine ? `<div class="msg-author clickable-username" data-username="${escapeHTML(msg.sender_username)}">@${escapeHTML(msg.sender_username)}</div>` : '';
    const sharedLink = extractSharedLink(msg.content);
    const textHtml = sharedLink
        ? ((sharedLink.note ? `<div>${renderFormattedContent(sharedLink.note)}</div>` : '') + shareCardPlaceholder(sharedLink))
        : (msg.content ? `<div>${renderFormattedContent(msg.content)}</div>` : '');
    const chatImageUrl = attrUrl(msg.image_url);
    const imgHtml = chatImageUrl ? `<a href="${chatImageUrl}" target="_blank" rel="noopener noreferrer"><img src="${chatImageUrl}" class="chat-img-thumb" alt="Uploaded photo" loading="lazy"></a>` : '';
    
    let pendingBadge = '';
    if (isOptimistic) {
        pendingBadge = `<span class="pending-tag" style="background:#475569; color:#94a3b8;">Sending...</span>`;
    } else if (isPending) {
        pendingBadge = isMine 
            ? `<span class="pending-tag">Pending Approval</span>` 
            : `<span class="pending-tag" style="background:#0369a1; color:#e0f2fe;">Chat Request</span>`;
    }
    const cardClasses = sharedLink ? ` has-share-card${!sharedLink.note && isMine ? ' card-only' : ''}` : '';
    const reportHtml = (!isMine && !isOptimistic && msg.id != null)
        ? `<div style="text-align:right; line-height:1;"><button type="button" class="msg-report-btn" aria-label="Report this message">Report</button></div>`
        : '';
    const bubbleHtml = `
        <div class="msg-bubble ${isMine ? 'msg-mine' : 'msg-theirs'} ${isPending ? 'pending-approval' : ''}${cardClasses}">
            ${authorHtml}${textHtml}${imgHtml}${pendingBadge}${reportHtml}
        </div>
    `;




    row.innerHTML = isMine ? (bubbleHtml + avatarImgHtml) : (avatarImgHtml + bubbleHtml);




    const attachedImg = row.querySelector('.chat-img-thumb');
    if (attachedImg) {
        attachedImg.onload = () => scrollToBottom(false);
    }

    row.querySelectorAll('.share-card').forEach((card) => {
        hydrateShareCard(card).then(() => scrollToBottom(false), () => {});
    });

    const reportMsgBtn = row.querySelector('.msg-report-btn');
    if (reportMsgBtn) {
        reportMsgBtn.addEventListener('click', () => openReportModal({
            type: 'message', id: msg.id, username: msg.sender_username,
            context: msg.content || (msg.image_url ? '[photo]' : '')
        }));
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

    if (isBlockedMessage(msg)) return;




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




    const visibleMessages = (messages || []).reverse().filter(m => !isBlockedMessage(m) && !isMessageExpiredOrCleared(m));




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
                    if (!(await uiConfirm("This removes the message request and the messages in it.", { title: 'Decline this request?', confirmText: 'Decline', danger: true }))) return;
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
    if (file && chatPrivacy.timer > 0) {
        dmImageInput.value = '';
        showToast({ title: "No photos right now", message: "Photos are turned off while disappearing messages are on in this chat.", type: "info", icon: "◈", duration: 4500, force: true });
        return;
    }
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




                db.from('user_notifications').insert(notifsToInsert).then(({ error }) => {
                    if (!error) return;
                    const fallbackNotifs = notifsToInsert.map(n => ({ ...n, entity_id: null }));
                    return db.from('user_notifications').insert(fallbackNotifs);
                }).then(null, () => {});
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
        const [{ count: pendingReqs }, { data: memberships }] = await Promise.all([
            db.from('friendships')
                .select('*', { count: 'exact', head: true })
                .eq('friend_id', currentUser.id)
                .eq('status', 'pending'),
            db.from('conversation_members')
                .select('conversation_id')
                .eq('user_id', currentUser.id)
        ]);




        let unreadTotal = 0;
        unreadCountsByConv.clear();




        if (memberships && memberships.length > 0) {
            const convIds = memberships.map(m => m.conversation_id);
            const { data: unreadMsgs } = await db
                .from('chat_messages')
                .select('conversation_id, sender_id, sender_username, content')
                .in('conversation_id', convIds)
                .neq('sender_id', currentUser.id)
                .eq('is_read', false)
                .eq('pending_approval', false);




            if (unreadMsgs) {
                unreadTotal = 0;
                unreadMsgs.forEach(m => {
                    if (isBlockedMessage(m)) return;
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
        if (!activeCall && !isAnsweringCall) {
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
                        db.from('user_notifications').delete().eq('id', notif.id).then(null, () => {});
                    } else if (!activeCall && !isAnsweringCall) {
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




// Update just this post's vote controls. Re-rendering the whole feed for one click threw away scroll
// position, open comment threads, playing videos and carousel positions. The order is deliberately left
// alone until the next sort/refresh, as on most feeds.
function refreshPostVoteUI(post) {
    const card = document.getElementById(`post-${post.id}`);
    if (!card) return;

    const vote = userVotes[post.id] || 0;
    const score = card.querySelector('.vote-score');
    if (score) score.textContent = getPostScore(post);

    card.querySelectorAll('.vote-btn').forEach(btn => {
        const dir = parseInt(btn.getAttribute('data-dir'), 10);
        btn.classList.toggle('upvoted', vote === 1 && dir === 1);
        btn.classList.toggle('downvoted', vote === -1 && dir === -1);
    });
}

function switchVoteStore(userId) {
    try {
        if (!userId) { userVotes = {}; return; }
        const key = VOTE_STORE_PREFIX + userId;
        let saved = localStorage.getItem(key);
        if (saved === null) {
            // First sign-in on this browser since per-account storage: adopt the old shared votes once.
            const legacy = localStorage.getItem('user_forum_votes');
            if (legacy) {
                saved = legacy;
                localStorage.setItem(key, legacy);
                localStorage.removeItem('user_forum_votes');
            }
        }
        userVotes = JSON.parse(saved || '{}') || {};
    } catch (e) {
        userVotes = {};
    }
}

function persistUserVotes() {
    if (!currentUser) return;
    try { localStorage.setItem(VOTE_STORE_PREFIX + currentUser.id, JSON.stringify(userVotes)); } catch (e) {}
}

// The server's record of this account's votes wins over whatever this browser remembers.
let postVotesTableMissing = false;
async function syncServerVotes(posts) {
    if (!currentUser || !db || postVotesTableMissing) return;
    const ids = (posts || []).map(p => p.id).filter(id => /^\d+$/.test(String(id)));
    if (ids.length === 0) return;

    const { data, error } = await db
        .from('post_votes')
        .select('post_id, value')
        .eq('user_id', currentUser.id)
        .in('post_id', ids);

    if (error) {
        // Table not installed yet (see the SQL setup): keep using the local record.
        if (isMissingRelationError(error)) postVotesTableMissing = true;
        return;
    }
    (data || []).forEach(row => { userVotes[row.post_id] = row.value; });
    persistUserVotes();
}

function isMissingRelationError(error) {
    return Boolean(error) && (error.code === 'PGRST205' || error.code === '42P01' ||
        /schema cache|does not exist|Could not find the table/i.test(error.message || ''));
}

// ilike() treats _ and % as wildcards; escape them when we mean an exact (case-insensitive) match.
function likeExact(value) { return String(value).replace(/[\\%_]/g, '\\$&'); }

// Removes files by their public address ( .../storage/v1/object/public/<bucket>/<path> ). Only files of this project, never throws.
async function removeStoredFiles(urls) {
    try {
        const marker = '/storage/v1/object/public/';
        const byBucket = new Map();
        (urls || []).forEach((u) => {
            const str = String(u || '');
            if (!str.startsWith(SUPABASE_URL)) return;
            const rest = str.slice(str.indexOf(marker) + marker.length).split('?')[0];
            if (str.indexOf(marker) < 0 || !rest) return;
            const slash = rest.indexOf('/');
            if (slash < 1) return;
            const bucket = rest.slice(0, slash), path = decodeURIComponent(rest.slice(slash + 1));
            if (!byBucket.has(bucket)) byBucket.set(bucket, []);
            byBucket.get(bucket).push(path);
        });
        for (const [bucket, paths] of byBucket) await db.storage.from(bucket).remove(paths).then(null, () => {});
    } catch (e) { /* best effort */ }
}

// Unguessable invite codes: random hex from the browser's secure random source.
function randomHex(len) {
    const bytes = new Uint8Array(Math.ceil(len / 2));
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').slice(0, len).toUpperCase();
}

function isMissingFunctionError(error) {
    return Boolean(error) && (error.code === 'PGRST202' || error.code === '42883' ||
        /Could not find the function|function .* does not exist/i.test(error.message || ''));
}

// Sends one vote to the server and returns the post's authoritative counts.
// Preferred path: the cast_vote() database function, which locks the row, records the user's vote and
// adjusts the counts in a single transaction. Fallback (until that SQL is installed): re-read the counts
// right before writing, which narrows but cannot close the race.
let voteRpcAvailable = null;
async function submitVote(post, previousVote, newVote, baseline) {
    if (voteRpcAvailable !== false) {
        const { data, error } = await db.rpc('cast_vote', { p_post_id: Number(post.id), p_value: newVote });
        if (!error) {
            voteRpcAvailable = true;
            const row = Array.isArray(data) ? data[0] : data;
            return { likes: Number(row.like_count), dislikes: Number(row.dislike_count) };
        }
        if (!isMissingFunctionError(error)) throw error;
        voteRpcAvailable = false;
    }

    const { data: fresh } = await db.from('Posts').select('likes, dislikes').eq('id', post.id).maybeSingle();
    // `baseline` is the count from before this click's optimistic update (post.likes already includes it).
    let likes = Number((fresh && fresh.likes) ?? baseline.likes);
    let dislikes = Number((fresh && fresh.dislikes) ?? baseline.dislikes);

    if (previousVote === 1) likes = Math.max(0, likes - 1);
    if (previousVote === -1) dislikes = Math.max(0, dislikes - 1);
    if (newVote === 1) likes += 1;
    if (newVote === -1) dislikes += 1;

    const { error } = await db.from('Posts').update({ likes, dislikes }).eq('id', post.id);
    if (error) throw error;
    return { likes, dislikes };
}

// Clicks on the same post are sent one at a time, in order, so the last click always wins.
const voteQueues = new Map();
const votesInFlight = new Map();

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
    hapticTap('light');

    const post = postCacheMap.get(Number(postId));
    if (!post) return;

    const previousVote = userVotes[postId] || 0;
    const newVote = previousVote === direction ? 0 : direction;
    const before = { likes: Number(post.likes || 0), dislikes: Number(post.dislikes || 0) };

    // Optimistic UI: the click feels instant, the server then confirms the real counts.
    userVotes[postId] = newVote;
    persistUserVotes();

    if (previousVote === 1) post.likes = Math.max(0, Number(post.likes || 0) - 1);
    if (previousVote === -1) post.dislikes = Math.max(0, Number(post.dislikes || 0) - 1);
    if (newVote === 1) post.likes = Number(post.likes || 0) + 1;
    if (newVote === -1) post.dislikes = Number(post.dislikes || 0) + 1;
    refreshPostVoteUI(post);

    const key = String(postId);
    votesInFlight.set(key, (votesInFlight.get(key) || 0) + 1);

    const run = (voteQueues.get(key) || Promise.resolve()).then(async () => {
        try {
            const counts = await submitVote(post, previousVote, newVote, before);
            if (votesInFlight.get(key) === 1) {
                // Last pending click for this post: show the server's numbers.
                post.likes = counts.likes;
                post.dislikes = counts.dislikes;
                refreshPostVoteUI(post);
            }

            if (newVote === 1 && previousVote !== 1 && post.author) {
                const cleanAuthor = post.author.toLowerCase().replace('@', '');
                if (currentUsername && cleanAuthor !== currentUsername.toLowerCase().replace('@', '')) {
                    db.from('profiles').select('id').ilike('username', likeExact(cleanAuthor)).maybeSingle()
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
        } catch (err) {
            console.error("Failed to save vote:", err);
            if (votesInFlight.get(key) === 1) {
                userVotes[postId] = previousVote;
                persistUserVotes();
                post.likes = before.likes;
                post.dislikes = before.dislikes;
                refreshPostVoteUI(post);
            }
            showToast({
                title: "Vote not saved",
                message: "Your vote could not be recorded. Please try again.",
                type: "error",
                icon: "⚠",
                force: true
            });
        } finally {
            votesInFlight.set(key, (votesInFlight.get(key) || 1) - 1);
        }
    });
    voteQueues.set(key, run);
    return run;
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
        <span>Simple behaviour signals (pasted text, impossible typing speed, a hidden trap field and rapid-fire posting) feed a 0 to 5 risk score. Only the score is kept, never what you typed.</span>
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
                <span>Share <span id="share-count-${post.id}" style="margin-left:4px; opacity:0.8;">${post.shares || 0}</span></span>
            </button>
            ${!userCanEdit && !post.is_pinned && post.id !== 'welcome-seed' ? `
            <button type="button" class="btn-post-action danger-text btn-report-post" data-post-id="${post.id}" aria-label="Report this post">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                <span>Report</span>
            </button>` : ''}
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




    const photoHtml = renderPostMediaHtml(post);
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
                    <img src="${attrUrl(authorAvatar, DEFAULT_AVATAR)}" class="post-author-avatar" data-username="${escapeHTML(cleanAuthor)}" alt="pfp">
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




    hydratePostMedia(item);

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
            if (!(await uiConfirm("This permanently removes the post and any photos or videos attached to it.", { title: 'Delete this post?', confirmText: 'Delete', danger: true }))) return;
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




    const reportPostBtn = item.querySelector('.btn-report-post');
    if (reportPostBtn) {
        reportPostBtn.addEventListener('click', () => openReportModal({
            type: 'post', id: post.id, username: cleanAuthor,
            context: [post.title, post.content].filter(Boolean).join(' - ')
        }));
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
                            countSpan.textContent = String(count);
                        }
                    }
                });
        } else if (post.id === 'welcome-seed') {
            const countSpan = item.querySelector(`#comment-count-${post.id}`);
            if (countSpan) countSpan.textContent = '0';
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




// Storage object paths for a post's uploads (photos, videos and video posters).
function getPostMediaPaths(post) {
    const marker = `/${MEDIA_BUCKET}/`;
    const paths = [];
    parsePostMedia(post && post.image_url).forEach((m) => {
        [m.url, m.poster].forEach((url) => {
            if (!url) return;
            const at = url.indexOf(marker);
            if (at >= 0) paths.push(decodeURIComponent(url.slice(at + marker.length).split(/[?#]/)[0]));
        });
    });
    return paths;
}

async function deletePostById(postId) {
    if (!currentUser) return;
    if (db) {
        const doomed = postCacheMap.get(Number(postId)) || cachedPosts.find(p => String(p.id) === String(postId));
        const mediaPaths = getPostMediaPaths(doomed);

        await db.from('Posts').delete().eq('id', postId);
        await db.from('post_comments').delete().eq('post_id', postId);

        // Best effort: don't leave orphaned uploads behind (storage policy may not allow it).
        if (mediaPaths.length > 0) {
            db.storage.from(MEDIA_BUCKET).remove(mediaPaths).then(null, () => {});
        }
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
    
    let { data: comments, error } = await db
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('id', { ascending: true });




    // Replies from people you've blocked are hidden (their children disappear with them).
    if (!error && comments && blockedNames.size) {
        const hiddenIds = new Set(comments.filter(c => isBlockedUsername(c.author)).map(c => c.id));
        let grew = hiddenIds.size > 0;
        while (grew) {
            grew = false;
            comments.forEach(c => { if (c.parent_id && hiddenIds.has(c.parent_id) && !hiddenIds.has(c.id)) { hiddenIds.add(c.id); grew = true; } });
        }
        comments = comments.filter(c => !hiddenIds.has(c.id));
    }

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
            <img src="${attrUrl(avatar, DEFAULT_AVATAR)}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; cursor: pointer;" class="clickable-username" data-username="${escapeHTML(cleanAuthor)}">
            <div style="flex: 1;">
                <div style="color: #38bdf8; font-weight: 600; margin-bottom: 2px;" class="clickable-username" data-username="${escapeHTML(cleanAuthor)}">@${escapeHTML(cleanAuthor)}</div>
                <div style="color: #e2e8f0; line-height: 1.3;">${escapeHTML(c.content)}</div>
                <div style="margin-top: 4px; display: flex; gap: 14px; align-items: center;">
                    <button type="button" class="btn-reply-toggle" style="background:none; border:none; color:#64748b; font-size:0.75rem; cursor:pointer; padding:0; width:auto; text-decoration:underline;">Reply</button>
                    ${isOwnUsername(cleanAuthor) ? '' : '<button type="button" class="btn-report-link btn-report-comment">Report</button>'}
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




        const reportCommentBtn = commentBody.querySelector('.btn-report-comment');
        if (reportCommentBtn) {
            reportCommentBtn.addEventListener('click', () => openReportModal({ type: 'comment', id: c.id, username: cleanAuthor, context: c.content }));
        }

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
        countSpan.textContent = String(newCount);
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
        db.from('profiles').select('id').ilike('username', likeExact(postAuthorUsername.toLowerCase().replace('@', ''))).maybeSingle()
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
                    db.from('profiles').select('id').ilike('username', likeExact(parentAuthor)).maybeSingle()
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
    const sorted = sortPosts(cachedPosts).filter(p => !isBlockedUsername(p.author));
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
        // Newest 300 posts: every sort mode works client-side, and downloading a thread's entire history
        // (poll votes and all) on each visit does not scale.
        const res = await db
            .from('Posts')
            .select('*')
            .eq('thread', requestedThread)
            .order('id', { ascending: false })
            .limit(300);
        posts = res.data;
        error = res.error;

        // Pinned posts must survive even when they are older than the newest 300.
        if (!error && posts && posts.length >= 300) {
            const pinnedRes = await db
                .from('Posts')
                .select('*')
                .eq('thread', requestedThread)
                .eq('is_pinned', true);
            const seen = new Set(posts.map(p => p.id));
            (pinnedRes.data || []).forEach(p => { if (!seen.has(p.id)) posts.push(p); });
        }
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

    await syncServerVotes(cachedPosts);




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
        return `<span class="ticker-item" data-id="${u.id}">◈ [${date}] <strong>@${escapeHTML(u.author)}:</strong> ${escapeHTML(u.content).substring(0, 100)}...</span>`;
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




// URLs that come from the database (avatars, chat images, ...) are user-controlled. Only http(s) and our own
// blob: previews may reach a src/href, and the value is escaped for the attribute. Anything else becomes `fallback`.
function attrUrl(url, fallback = '') {
    const text = typeof url === 'string' ? url.trim() : '';
    return escapeHTML(/^(https?:\/\/|blob:)/i.test(text) ? text : fallback);
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




function resetTelemetryConsole({ keepContent = false } = {}) {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    pageLoadTime = null;
    isTimerRunning = false; 
    textWasPasted = false;
    keystrokeGaps = [];
    mouseMovementsRecorded = 0;
    lastKeyTime = null;
    if (!keepContent) {
        if (textBox) textBox.value = '';
        const titleInput = document.getElementById('post-title-input');
        if (titleInput) titleInput.value = '';
        clearPostMedia();
    }
    if (statPaste) { statPaste.textContent = "FALSE"; statPaste.className = "badge badge-green"; }
    if (statTimer) statTimer.textContent = "0.0s"; 
    if (statKeys) statKeys.textContent = "0 keys";
    
    // Clear Poll Form
    const pollBuilder = document.getElementById('poll-builder-container');
    if (pollBuilder && !keepContent) {
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




// --- SHARE TO DIRECT MESSAGES ---
// Pick any number of chats or people, add an optional note, and send. The message is an ordinary chat
// message whose last line is a link ("[View Post](...)" / "[Open Thread](...)"); chat bubbles turn that
// link into a preview card, and older clients simply show the link.
const MAX_SHARE_RECIPIENTS = 10;
const shareRecipientSearch = document.getElementById('share-recipient-search');
const shareRecipientList = document.getElementById('share-recipient-list');
const shareSelectedChips = document.getElementById('share-selected-chips');
const shareNote = document.getElementById('share-note');

let shareChats = [];                 // existing conversations: { key, kind: 'conv', convId, label, sub, isGroup, partnerId, partnerUsername }
let sharePeople = [];                // search hits not already covered by a chat: { key, kind: 'user', userId, username, label, sub }
const shareSelected = new Map();     // key -> recipient
let sharePeopleTimer = null;
let sharePeopleSeq = 0;

function resetShareRecipients() {
    clearTimeout(sharePeopleTimer);
    sharePeopleSeq++; // drop any search still in flight
    shareChats = [];
    sharePeople = [];
    shareSelected.clear();
    if (shareRecipientSearch) shareRecipientSearch.value = '';
    if (shareNote) shareNote.value = '';
    renderShareRecipients();
}

function renderShareRecipients() {
    if (!shareRecipientList) return;
    const query = (shareRecipientSearch ? shareRecipientSearch.value : '').trim().replace(/^@/, '').toLowerCase();

    const matches = (r) => !query || r.label.toLowerCase().replace(/^@|^group:\s*/, '').includes(query) || r.label.toLowerCase().includes(query);
    const rows = [...shareChats.filter(matches), ...sharePeople.filter(matches)];

    if (!currentUser) {
        shareRecipientList.innerHTML = '<div class="share-empty">Log in to share via direct message.</div>';
    } else if (rows.length === 0) {
        shareRecipientList.innerHTML = `<div class="share-empty">${query.length >= 2 ? 'No matches. Try another username.' : (shareChats.length === 0 ? 'No chats yet. Search for a username to start one.' : 'No matches.')}</div>`;
    } else {
        shareRecipientList.innerHTML = rows.map((r) => {
            const selected = shareSelected.has(r.key);
            const initial = escapeHTML((r.label.replace(/^@|^Group:\s*/i, '')[0] || '?').toUpperCase());
            return `<button type="button" class="share-recipient${selected ? ' selected' : ''}" role="option" aria-selected="${selected}" data-key="${escapeHTML(r.key)}">
                <span class="share-recipient-avatar${r.isGroup ? ' is-group' : ''}">${initial}</span>
                <span class="share-recipient-text"><span class="share-recipient-name">${escapeHTML(r.label)}</span><span class="share-recipient-sub">${escapeHTML(r.sub)}</span></span>
                <span class="share-check" aria-hidden="true">${selected ? '✓' : ''}</span>
            </button>`;
        }).join('');
    }

    if (shareSelectedChips) {
        shareSelectedChips.innerHTML = Array.from(shareSelected.values()).map(r =>
            `<button type="button" class="share-chip" data-key="${escapeHTML(r.key)}" aria-label="Remove ${escapeHTML(r.label)}">${escapeHTML(r.label)} <span aria-hidden="true">✕</span></button>`
        ).join('');
    }

    if (internalShareBtn) {
        const n = shareSelected.size;
        internalShareBtn.disabled = n === 0 || shareSending;
        internalShareBtn.textContent = n === 0 ? 'Send' : `Send to ${n} ${n === 1 ? 'chat' : 'chats'}`;
    }
}

async function populateShareConversations() {
    resetShareRecipients();
    if (!currentUser || !db) return;

    const { data: memberships } = await db.from('conversation_members')
        .select('conversation_id')
        .eq('user_id', currentUser.id);
    if (!memberships || memberships.length === 0) { renderShareRecipients(); return; }

    const convIds = memberships.map(m => m.conversation_id);
    const [{ data: convs }, { data: others }] = await Promise.all([
        db.from('conversations').select('id, name, is_group').in('id', convIds),
        db.from('conversation_members').select('conversation_id, user_id').in('conversation_id', convIds).neq('user_id', currentUser.id)
    ]);

    const partnerIds = Array.from(new Set((others || []).map(m => m.user_id)));
    const { data: profiles } = partnerIds.length > 0
        ? await db.from('profiles').select('id, username').in('id', partnerIds)
        : { data: [] };

    shareChats = (convs || []).map((conv) => {
        if (conv.is_group || (conv.name && conv.name.trim())) {
            return { key: `conv:${conv.id}`, kind: 'conv', convId: conv.id, isGroup: true, partnerId: null,
                     label: `Group: ${conv.name || 'Chat'}`, sub: 'Group chat' };
        }
        const partner = (others || []).find(m => m.conversation_id === conv.id);
        const profile = partner ? (profiles || []).find(p => p.id === partner.user_id) : null;
        if (!profile) return null;
        return { key: `conv:${conv.id}`, kind: 'conv', convId: conv.id, isGroup: false, partnerId: profile.id,
                 partnerUsername: profile.username, label: `@${profile.username}`, sub: 'Direct message' };
    }).filter(Boolean).sort((a, b) => a.label.localeCompare(b.label));

    renderShareRecipients();
}

// Anyone on the site can be messaged: search usernames that aren't already in the chat list.
async function searchSharePeople(rawQuery) {
    const query = rawQuery.trim().replace(/^@/, '');
    const seq = ++sharePeopleSeq;
    if (!db || !currentUser || query.length < 2) {
        sharePeople = [];
        renderShareRecipients();
        return;
    }

    // Prefix match only, with the user's own %, _ and \ treated literally (so "john_doe" finds john_doe).
    const safe = query.replace(/[\\%_]/g, '\\$&');
    const { data } = await db.from('profiles')
        .select('id, username, is_private')
        .ilike('username', `${safe}%`)
        .neq('id', currentUser.id)
        .limit(8);
    if (seq !== sharePeopleSeq) return;

    const haveChat = new Set(shareChats.filter(c => c.partnerId).map(c => c.partnerId));
    sharePeople = (data || [])
        .filter(p => p.username && !p.is_private && !haveChat.has(p.id))
        .map(p => ({ key: `user:${p.id}`, kind: 'user', userId: p.id, username: p.username,
                     label: `@${p.username}`, sub: 'Start a new chat' }));
    renderShareRecipients();
}

safeAddListener(shareRecipientSearch, 'input', () => {
    renderShareRecipients();
    clearTimeout(sharePeopleTimer);
    sharePeopleTimer = setTimeout(() => searchSharePeople(shareRecipientSearch.value), 250);
});

safeAddListener(shareRecipientList, 'click', (e) => {
    const row = e.target.closest('.share-recipient');
    if (!row) return;
    const key = row.getAttribute('data-key');
    const recipient = [...shareChats, ...sharePeople].find(r => r.key === key);
    if (!recipient) return;

    if (shareSelected.has(key)) {
        shareSelected.delete(key);
    } else {
        if (shareSelected.size >= MAX_SHARE_RECIPIENTS) {
            showToast({ title: "Too many recipients", message: `You can send to up to ${MAX_SHARE_RECIPIENTS} chats at once.`, type: "info", icon: "✉", force: true });
            return;
        }
        shareSelected.set(key, recipient);
    }
    renderShareRecipients();
});

safeAddListener(shareSelectedChips, 'click', (e) => {
    const chip = e.target.closest('.share-chip');
    if (!chip) return;
    shareSelected.delete(chip.getAttribute('data-key'));
    renderShareRecipients();
});

// Looks up (or creates) the 1-on-1 conversation with a user. Shared by "message a friend" and sharing.
async function ensureDirectConversation(friend) {
    const { data: friendship } = await db
        .from('friendships')
        .select('status')
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${friend.id}),and(user_id.eq.${friend.id},friend_id.eq.${currentUser.id})`)
        .eq('status', 'accepted')
        .limit(1)
        .maybeSingle();
    const isFriend = Boolean(friendship);

    const { data: myMemberships } = await db
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

    const myConvIds = (myMemberships || []).map(m => m.conversation_id);
    if (myConvIds.length > 0) {
        const { data: sharedMemberships } = await db
            .from('conversation_members')
            .select('conversation_id')
            .in('conversation_id', myConvIds)
            .eq('user_id', friend.id);

        if (sharedMemberships && sharedMemberships.length > 0) {
            const { data: conv } = await db
                .from('conversations')
                .select('id')
                .in('id', sharedMemberships.map(s => s.conversation_id))
                .eq('is_group', false)
                .limit(1)
                .maybeSingle();
            if (conv) return { convId: conv.id, isFriend };
        }
    }

    const { data: newConv, error: convErr } = await db
        .from('conversations')
        .insert([{ is_group: false, created_by: currentUser.id }])
        .select()
        .single();
    if (convErr) throw new Error(`Error creating chat: ${convErr.message}`);

    const { error: memberErr } = await db.from('conversation_members').insert([
        { conversation_id: newConv.id, user_id: currentUser.id },
        { conversation_id: newConv.id, user_id: friend.id }
    ]);
    if (memberErr) throw new Error(`Error creating chat: ${memberErr.message}`);

    return { convId: newConv.id, isFriend };
}

// Posts one message into a conversation with the same approval rules as the normal chat box:
// a first message to a non-friend waits for approval and sends them a friend request.
async function sendMessageToConversation({ convId, partnerId, isFriend, text, notifyText }) {
    let pending = false;
    if (partnerId && !isFriend) {
        const { data: approved } = await db
            .from('chat_messages')
            .select('id')
            .eq('conversation_id', convId)
            .eq('pending_approval', false)
            .limit(1);
        pending = !approved || approved.length === 0;
    }

    // Writing back to someone who messaged us first approves their pending request.
    if (partnerId) {
        await db.from('chat_messages')
            .update({ pending_approval: false })
            .eq('conversation_id', convId)
            .neq('sender_id', currentUser.id)
            .eq('pending_approval', true);
    }

    const { error } = await db.from('chat_messages').insert([{
        conversation_id: convId,
        sender_id: currentUser.id,
        sender_username: currentUsername,
        content: text,
        pending_approval: pending
    }]);
    if (error) throw new Error(error.message);

    if (pending && partnerId) {
        const { data: existing } = await db
            .from('friendships')
            .select('id')
            .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${partnerId}),and(user_id.eq.${partnerId},friend_id.eq.${currentUser.id})`)
            .maybeSingle();
        if (!existing) {
            await db.from('friendships').insert([{ user_id: currentUser.id, friend_id: partnerId, status: 'pending' }]);
        }
        sendNotification(partnerId, 'friend_request', null, 'sent you a friend request and a pending message.');
        return;
    }

    let recipientIds = partnerId ? [partnerId] : [];
    if (!partnerId) {
        const { data: members } = await db
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', convId)
            .neq('user_id', currentUser.id);
        recipientIds = (members || []).map(m => m.user_id);
    }
    recipientIds.forEach(id => sendNotification(id, 'direct_message', String(convId), notifyText));
}

async function deliverShare(recipient, text, notifyText) {
    if (recipient.kind === 'user') {
        const { convId, isFriend } = await ensureDirectConversation({ id: recipient.userId, username: recipient.username });
        return sendMessageToConversation({ convId, partnerId: recipient.userId, isFriend, text, notifyText });
    }

    let isFriend = true;
    if (recipient.partnerId) {
        const { data: friendship } = await db
            .from('friendships')
            .select('status')
            .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${recipient.partnerId}),and(user_id.eq.${recipient.partnerId},friend_id.eq.${currentUser.id})`)
            .eq('status', 'accepted')
            .limit(1)
            .maybeSingle();
        isFriend = Boolean(friendship);
    }
    return sendMessageToConversation({ convId: recipient.convId, partnerId: recipient.partnerId, isFriend, text, notifyText });
}

// 3. Send via Internal DM
let shareSending = false;

safeAddListener(internalShareBtn, 'click', async () => {
    if (shareSending || shareSelected.size === 0 || !currentShareTarget || !currentUser) return;
    if (isSuspended) {
        triggerSuspensionGate();
        return;
    }

    // Capture what is being shared now: the modal (and these globals) may change while messages are sent.
    const shareType = currentShareType;
    const shareTarget = currentShareTarget;
    const shareUrl = currentSharePostUrl;

    const recipients = Array.from(shareSelected.values());
    const note = (shareNote ? shareNote.value : '').trim();
    const link = shareType === 'thread'
        ? `[Open Thread](${shareUrl})`
        : `[View Post](${shareUrl})`;
    const text = note ? `${note}\n${link}` : link;
    const notifyText = shareType === 'thread'
        ? `shared the #${shareTarget} community with you.`
        : 'shared a post with you.';

    shareSending = true;
    internalShareBtn.disabled = true;
    internalShareBtn.textContent = 'Sending...';

    const failed = [];
    let sent = 0;
    for (const recipient of recipients) {
        try {
            await deliverShare(recipient, text, notifyText);
            sent++;
            shareSelected.delete(recipient.key);
        } catch (err) {
            console.warn("Share failed for", recipient.label, err);
            failed.push(recipient.label);
        }
    }

    shareSending = false;

    if (sent > 0 && shareType === 'post') {
        await incrementShareCount(shareTarget);
    }

    if (failed.length === 0) {
        showToast({
            title: shareType === 'thread' ? "Thread shared" : "Post shared",
            message: sent === 1 ? `Sent to ${recipients[0].label}.` : `Sent to ${sent} chats.`,
            type: "success",
            icon: "✉",
            force: true
        });
        if (shareModal) shareModal.classList.add('hidden');
        resetShareRecipients();
        checkNotifications();
    } else {
        showToast({
            title: sent > 0 ? "Partly shared" : "Could not share",
            message: `Failed: ${failed.join(', ')}. They are still selected so you can retry.`,
            type: "error",
            icon: "⚠",
            duration: 7000,
            force: true
        });
        renderShareRecipients();
    }
});

// --- Shared-link cards inside chat bubbles ---
const sharedPostCache = new Map(); // post id -> Promise<post | null>

// Hosts whose ?post= / ?thread= links open in this app: this site, its www/bare twin, and former domains.
const LEGACY_SITE_HOSTS = []; // e.g. ['old-name.vercel.app']
function isOwnSiteHost(host) {
    const bare = (h) => h.replace(/^www\./, '');
    return bare(host) === bare(window.location.host) || LEGACY_SITE_HOSTS.includes(host);
}

function extractSharedLink(content) {
    if (!content) return null;
    const match = content.match(/\[(?:View Post|Open Thread)\]\((https?:\/\/[^\s)]+)\)\s*$/);
    if (!match) return null;
    try {
        const url = new URL(match[1]);
        if (!isOwnSiteHost(url.host)) return null;
        const note = content.slice(0, match.index).trim();
        const postId = url.searchParams.get('post');
        if (postId && /^\d+$/.test(postId)) return { kind: 'post', id: postId, url: url.href, note };
        const thread = url.searchParams.get('thread');
        if (thread) return { kind: 'thread', name: thread, url: url.href, note };
    } catch (e) {}
    return null;
}

function shareCardPlaceholder(link) {
    const attr = link.kind === 'post' ? `data-post-id="${escapeHTML(link.id)}"` : `data-thread="${escapeHTML(link.name)}"`;
    const label = link.kind === 'post' ? 'Loading post…' : `#${escapeHTML(link.name)}`;
    return `<a class="share-card" href="${escapeHTML(link.url)}" data-kind="${link.kind}" ${attr}>
        <span class="share-card-body"><span class="share-card-kicker">${link.kind === 'post' ? 'Shared post' : 'Shared thread'}</span><span class="share-card-title">${label}</span></span>
    </a>`;
}

async function hydrateShareCard(card) {
    const kind = card.getAttribute('data-kind');
    if (kind === 'thread') {
        card.querySelector('.share-card-body').insertAdjacentHTML('beforeend', '<span class="share-card-cta">Open thread →</span>');
        return;
    }

    const id = card.getAttribute('data-post-id');
    if (!sharedPostCache.has(id)) {
        sharedPostCache.set(id, db
            ? db.from('Posts').select('id, thread, author, title, content, image_url').eq('id', id).maybeSingle()
                .then(({ data, error }) => {
                    if (error) { sharedPostCache.delete(id); return null; } // transient: allow a retry later
                    return data || null;
                }, () => { sharedPostCache.delete(id); return null; })
            : Promise.resolve(null));
    }
    const post = await sharedPostCache.get(id);
    const body = card.querySelector('.share-card-body');
    if (!body) return;

    if (!post) {
        body.innerHTML = '<span class="share-card-kicker">Shared post</span><span class="share-card-title">This post is no longer available.</span>';
        card.classList.add('is-gone');
        return;
    }

    const media = parsePostMedia(post.image_url);
    const first = media[0];
    const thumb = first ? (first.type === 'video' ? first.poster : first.url) : '';
    const plain = (post.content || '').replace(/[#*_`>\[\]()]/g, '').replace(/\s+/g, ' ').trim();
    const headline = post.title || plain.slice(0, 90) || (first ? (first.type === 'video' ? 'Video post' : 'Photo post') : 'Post');
    const snippet = post.title ? plain.slice(0, 110) : (plain.length > 90 ? plain.slice(90, 190) : '');
    const extra = media.length > 1 ? `<span class="share-card-badge">${media.length} attachments</span>` : (first && first.type === 'video' ? '<span class="share-card-badge">▶ Video</span>' : '');

    card.classList.toggle('has-thumb', Boolean(thumb));
    card.innerHTML = `
        ${thumb ? `<span class="share-card-thumb">${extra}</span>` : ''}
        <span class="share-card-body">
            <span class="share-card-kicker">#${escapeHTML(post.thread || 'forum')} · @${escapeHTML((post.author || 'anonymous').replace('@', ''))}</span>
            <span class="share-card-title">${escapeHTML(headline)}</span>
            ${snippet ? `<span class="share-card-snippet">${escapeHTML(snippet)}</span>` : ''}
            ${!thumb && extra ? extra : ''}
            <span class="share-card-cta">View post →</span>
        </span>`;

    const thumbEl = card.querySelector('.share-card-thumb');
    if (thumbEl && thumb) thumbEl.style.backgroundImage = `url(${JSON.stringify(thumb)})`;
}

// One delegated handler: tapping a card closes the chat and jumps to the post or thread.
safeAddListener(chatMessages, 'click', (e) => {
    const card = e.target.closest('.share-card');
    if (!card) return;
    e.preventDefault();
    const kind = card.getAttribute('data-kind');
    closeMessagesModal();
    if (kind === 'thread') navigateToThread(card.getAttribute('data-thread'));
    else navigateToPost(card.getAttribute('data-post-id'));
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




    if (postContent.length < 2 && postMediaQueue.length === 0 && !pollOptionsJSON && !postTitle) {
        alert("Please enter a message, attach a photo or video, or create a poll.");
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




        const saved = await persistBehavior(behaviorPoints);
        if (saved) {
            suspicionScore = Math.min(5, Math.max(suspicionScore, saved.score)); // the database has the final say
            if (saved.suspended) suspicionScore = 5;
            updateSuspicionUI();
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
    let published = false;
    try {
        if (postMediaQueue.length > 0) {
            // Big videos go up in resumable chunks, so show combined byte progress instead of a file count.
            const bigVideos = postMediaQueue.filter(m => m.kind === 'video' && m.file.size > RESUMABLE_MIN_BYTES).length;
            const videoLabel = bigVideos > 1 ? 'videos' : 'video';
            let shownPercent = 0;
            if (submitBtn && bigVideos) submitBtn.textContent = `Uploading ${videoLabel} 0%`;
            const entries = await uploadPostMedia(postMediaQueue, (done, total) => {
                if (submitBtn && !bigVideos) submitBtn.textContent = `Uploading ${done}/${total}...`;
            }, (sent, total) => {
                const percent = Math.floor(sent * 100 / total);
                if (!submitBtn || !bigVideos || percent === shownPercent) return;
                shownPercent = percent;
                submitBtn.textContent = `Uploading ${videoLabel} ${percent}%`;
            });
            if (submitBtn) submitBtn.textContent = 'Publishing...';
            postImageUrl = encodePostMedia(entries);
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




        published = true;
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
        // ALWAYS reset telemetry flags so textWasPasted is reset to FALSE. The draft (text, poll,
        // attachments) is only cleared once the post is live, so a failed upload never loses it.
        resetTelemetryConsole({ keepContent: !published });




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




// Only the thread owner, its moderators and site admins may set or remove a banner.
function canSetThreadBanner(threadName = activeThread) {
    if (!currentUser) return false;
    const role = getThreadRole(threadName);
    return role === 'Owner' || role === 'Moderator' || role === 'Site Admin';
}
function denyBannerChange() {
    showToast({
        title: "Banner is managed by moderators",
        message: "Only the thread owner, its moderators or a site admin can change this thread's banner.",
        type: "error", icon: "▵", duration: 5000, force: true
    });
}

// Uploads an already-prepared banner image and saves it on the thread. Returns true on success.
async function uploadThreadBanner(file) {
    if (!currentUser || !db) return false;
    if (!canSetThreadBanner()) { denyBannerChange(); return false; }

    try {
        const fileExt = (file.name.split('.').pop() || '').toLowerCase() || (file.type === 'image/gif' ? 'gif' : 'jpeg');
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
        const localThreadIndex = allCloudThreads.findIndex(t => t.name === activeThread);
        if (localThreadIndex !== -1) allCloudThreads[localThreadIndex].banner_url = bannerUrl;
        else allCloudThreads.push({ name: activeThread, banner_url: bannerUrl });

        renderThreadBanner();
        updateThreadControlsUI();
        showToast({ title: "Banner updated", message: `The banner for "${activeThread}" is live.`, type: "success", icon: "◈", duration: 4000, force: true });

        // Silently sync the cloud in the background WITHOUT wiping memory
        db.from('forum_threads').select('*').order('id', { ascending: true })
            .then(({ data }) => {
                if (data && data.length > 0) {
                    const defaults = [
                        { name: "Welcome & Security", owner_username: "gemini" },
                        { name: "Update Thread", owner_username: "gemini" },
                        { name: "New User Discussion", owner_username: "gemini" }
                    ];
                    const freshMerge = [...data];
                    defaults.forEach(def => {
                        if (!freshMerge.find(t => t.name === def.name)) freshMerge.push(def);
                    });
                    allCloudThreads = freshMerge;
                }
            }, () => {});
        return true;
    } catch (err) {
        showToast({ title: "Banner not saved", message: `Error uploading banner: ${err.message}`, type: "error", icon: "▵", duration: 6000, force: true });
        return false;
    }
}

// --- BANNER EDITOR: reposition and resize the picture before it is confirmed ---
// The result is cropped in the browser to a 3:1 image, so what you frame here is what gets uploaded.
const BANNER_ASPECT = 3;
const BANNER_OUT_W = 1800;
const bannerEd = { open: false, busy: false, file: null, url: null, iw: 0, ih: 0, fw: 0, fh: 0, base: 1, zoom: 1, ox: 0, oy: 0, raf: 0 };
const bEl = (id) => document.getElementById(id);

function bannerClamp() {
    const s = bannerEd.base * bannerEd.zoom;
    bannerEd.ox = Math.min(0, Math.max(bannerEd.fw - bannerEd.iw * s, bannerEd.ox));
    bannerEd.oy = Math.min(0, Math.max(bannerEd.fh - bannerEd.ih * s, bannerEd.oy));
}
function bannerRegion() {
    const s = bannerEd.base * bannerEd.zoom;
    return { sx: -bannerEd.ox / s, sy: -bannerEd.oy / s, sw: bannerEd.fw / s, sh: bannerEd.fh / s };
}
function bannerDrawPreview(canvas, aspect) {
    const img = bEl('banner-crop-img');
    if (!canvas || !img || !bannerEd.iw) return;
    const { sx, sy, sw, sh } = bannerRegion();
    let rx = sx, ry = sy, rw = sw, rh = sh;
    // the live page shows the banner "cover" style, so a wider or narrower box trims the picture
    if (aspect > sw / sh) { rh = sw / aspect; ry = sy + (sh - rh) / 2; }
    else { rw = sh * aspect; rx = sx + (sw - rw) / 2; }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, rx, ry, rw, rh, 0, 0, canvas.width, canvas.height);
}
function bannerApply() {
    bannerClamp();
    const s = bannerEd.base * bannerEd.zoom;
    const img = bEl('banner-crop-img');
    img.style.width = (bannerEd.iw * s) + 'px';
    img.style.height = (bannerEd.ih * s) + 'px';
    img.style.transform = `translate(${bannerEd.ox}px, ${bannerEd.oy}px)`;
    const slider = bEl('banner-zoom');
    if (slider && Number(slider.value) !== bannerEd.zoom) slider.value = bannerEd.zoom;
    if (!bannerEd.raf) {
        bannerEd.raf = requestAnimationFrame(() => {
            bannerEd.raf = 0;
            bannerDrawPreview(bEl('banner-prev-desktop'), 4.5);
            bannerDrawPreview(bEl('banner-prev-phone'), 2.8);
        });
    }
}
function bannerSetZoom(z, cx = bannerEd.fw / 2, cy = bannerEd.fh / 2) {
    const next = Math.min(4, Math.max(1, z));
    const s1 = bannerEd.base * bannerEd.zoom, s2 = bannerEd.base * next;
    const ix = (cx - bannerEd.ox) / s1, iy = (cy - bannerEd.oy) / s1;
    bannerEd.zoom = next;
    bannerEd.ox = cx - ix * s2;
    bannerEd.oy = cy - iy * s2;
    bannerApply();
}
function bannerMeasure(recentre) {
    const frame = bEl('banner-crop-frame');
    const prevCentre = bannerEd.fw ? { x: (bannerEd.fw / 2 - bannerEd.ox) / (bannerEd.base * bannerEd.zoom), y: (bannerEd.fh / 2 - bannerEd.oy) / (bannerEd.base * bannerEd.zoom) } : null;
    bannerEd.fw = frame.clientWidth;
    bannerEd.fh = frame.clientHeight;
    bannerEd.base = Math.max(bannerEd.fw / bannerEd.iw, bannerEd.fh / bannerEd.ih);
    if (recentre || !prevCentre) {
        bannerEd.zoom = 1;
        bannerEd.ox = (bannerEd.fw - bannerEd.iw * bannerEd.base) / 2;
        bannerEd.oy = (bannerEd.fh - bannerEd.ih * bannerEd.base) / 2;
    } else {
        const s = bannerEd.base * bannerEd.zoom;
        bannerEd.ox = bannerEd.fw / 2 - prevCentre.x * s;
        bannerEd.oy = bannerEd.fh / 2 - prevCentre.y * s;
    }
    bannerApply();
}

async function openBannerEditor(file) {
    const modal = bEl('banner-editor-modal'), img = bEl('banner-crop-img');
    if (!modal || !img) return uploadThreadBanner(await compressImage(file, 1920, 0.8));
    const url = URL.createObjectURL(file);
    img.src = url;
    try { await img.decode(); } catch (e) { /* handled below */ }
    if (!img.naturalWidth) {
        URL.revokeObjectURL(url);
        showToast({ title: "Can't open that picture", message: "Choose a JPG, PNG or WebP image.", type: "error", icon: "▵", duration: 5000, force: true });
        return false;
    }
    Object.assign(bannerEd, { open: true, busy: false, file, url, iw: img.naturalWidth, ih: img.naturalHeight, fw: 0, fh: 0, zoom: 1 });
    const confirmBtn = bEl('banner-confirm');
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Use this banner';
    modal.classList.remove('hidden');
    await new Promise(r => requestAnimationFrame(r));
    bannerMeasure(true);
    return true;
}

function closeBannerEditor() {
    if (bannerEd.busy) return;
    const modal = bEl('banner-editor-modal');
    if (modal) modal.classList.add('hidden');
    if (bannerEd.url) URL.revokeObjectURL(bannerEd.url);
    const img = bEl('banner-crop-img');
    if (img) img.removeAttribute('src');
    Object.assign(bannerEd, { open: false, file: null, url: null, iw: 0, ih: 0 });
}

async function renderBannerFile() {
    const img = bEl('banner-crop-img');
    const { sx, sy, sw, sh } = bannerRegion();
    const outW = Math.max(300, Math.min(BANNER_OUT_W, Math.round(sw)));
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = Math.round(outW / BANNER_ASPECT);
    canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.86));
    if (!blob) throw new Error('Could not prepare the picture');
    return new File([blob], 'banner.jpeg', { type: 'image/jpeg', lastModified: Date.now() });
}

safeAddListener(bEl('banner-confirm'), 'click', async () => {
    if (!bannerEd.open || bannerEd.busy) return;
    if (!canSetThreadBanner()) { closeBannerEditor(); denyBannerChange(); return; }
    const btn = bEl('banner-confirm');
    bannerEd.busy = true;
    btn.disabled = true;
    btn.textContent = 'Saving...';
    let ok = false;
    try { ok = await uploadThreadBanner(await renderBannerFile()); }
    catch (err) { showToast({ title: "Banner not saved", message: err.message, type: "error", icon: "▵", duration: 6000, force: true }); }
    bannerEd.busy = false;
    btn.disabled = false;
    btn.textContent = 'Use this banner';
    if (ok) closeBannerEditor();
});
safeAddListener(bEl('banner-cancel'), 'click', closeBannerEditor);
safeAddListener(bEl('banner-editor-close'), 'click', closeBannerEditor);
safeAddListener(bEl('banner-reset'), 'click', () => { if (bannerEd.open) bannerMeasure(true); });
safeAddListener(bEl('banner-zoom'), 'input', (e) => { if (bannerEd.open) bannerSetZoom(Number(e.target.value)); });

(function initBannerGestures() {
    const frame = bEl('banner-crop-frame');
    if (!frame) return;
    const pts = new Map();
    let pan = null, pinch = null;
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const local = (x, y) => { const r = frame.getBoundingClientRect(); return { x: x - r.left, y: y - r.top }; };
    frame.addEventListener('pointerdown', (e) => {
        if (!bannerEd.open) return;
        try { frame.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 1) pan = { x: e.clientX, y: e.clientY, ox: bannerEd.ox, oy: bannerEd.oy };
        else if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: dist(a, b) || 1, zoom: bannerEd.zoom }; pan = null; }
    });
    frame.addEventListener('pointermove', (e) => {
        if (!pts.has(e.pointerId)) return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 1 && pan) {
            bannerEd.ox = pan.ox + (e.clientX - pan.x);
            bannerEd.oy = pan.oy + (e.clientY - pan.y);
            bannerApply();
        } else if (pts.size === 2 && pinch) {
            const [a, b] = [...pts.values()];
            const mid = local((a.x + b.x) / 2, (a.y + b.y) / 2);
            bannerSetZoom(pinch.zoom * (dist(a, b) / pinch.d), mid.x, mid.y);
        }
    });
    const end = (e) => {
        pts.delete(e.pointerId);
        pinch = null;
        if (pts.size === 1) { const [p] = [...pts.values()]; pan = { x: p.x, y: p.y, ox: bannerEd.ox, oy: bannerEd.oy }; }
        else pan = null;
    };
    frame.addEventListener('pointerup', end);
    frame.addEventListener('pointercancel', end);
    frame.addEventListener('wheel', (e) => {
        if (!bannerEd.open) return;
        e.preventDefault();
        const p = local(e.clientX, e.clientY);
        bannerSetZoom(bannerEd.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08), p.x, p.y);
    }, { passive: false });
    frame.addEventListener('keydown', (e) => {
        if (!bannerEd.open) return;
        const step = e.shiftKey ? 30 : 10;
        const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
        if (moves[e.key]) { e.preventDefault(); bannerEd.ox += moves[e.key][0]; bannerEd.oy += moves[e.key][1]; bannerApply(); }
        else if (e.key === '+' || e.key === '=') { e.preventDefault(); bannerSetZoom(bannerEd.zoom * 1.1); }
        else if (e.key === '-') { e.preventDefault(); bannerSetZoom(bannerEd.zoom / 1.1); }
    });
    window.addEventListener('resize', () => { if (bannerEd.open) bannerMeasure(false); });
})();

safeAddListener(document.getElementById('banner-upload-input'), 'change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // let the same picture be chosen again later
    if (!file || !currentUser) return;
    if (!canSetThreadBanner()) { denyBannerChange(); return; }
    if (!/^image\//.test(file.type)) {
        showToast({ title: "Pictures only", message: "Banners must be an image (JPG, PNG, WebP or GIF).", type: "error", icon: "▵", duration: 5000, force: true });
        return;
    }
    // Animated GIFs would lose their animation if cropped, so they are used as they are.
    if (file.type === 'image/gif') { await uploadThreadBanner(file); return; }
    await openBannerEditor(file);
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
                        <div class="red-pearl" title="Red Pearl Ready — Click to extract your code"></div>
                    </div>
                    <div class="pod-info">
                        <div style="font-size: 0.72rem; color: #cbd5e1; font-weight: 600;">Red Pearl Code</div>
                        <button type="button" class="btn-pod-action" style="background: linear-gradient(135deg, #ff2a5f, #b3002b); color: #fff; border: 1px solid #ff2a5f; cursor: pointer;">
                            Extract Code
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
                        const newCode = 'TG-' + randomHex(12);
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
                            title: `Red Pearl Code Minted: ${newCode}`,
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
                        <div class="pod-code-label" title="${escapeHTML(inv.code)}">${escapeHTML(inv.code)}</div>
                        <div class="pod-timer-text" data-regen="${regenTarget}">${formatCountdown(msRemaining)}</div>
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
                <span class="ledger-meta">Issued: ${createdDate} by <strong>@${escapeHTML(inv.inviter_username || (inv.inviter_id === currentUser.id ? currentUsername : 'inviter'))}</strong></span>
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


    const newCode = 'TG-ADM-' + randomHex(12);
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
    if (isBlockedUsername(username)) return;
    const isMine = username === currentUsername;
    const div = document.createElement('div');
    div.style.cssText = `display: flex; gap: 8px; margin-bottom: 6px; align-items: flex-start; justify-content: ${isMine ? 'flex-end' : 'flex-start'};`;
    
    const avatarHtml = `<img src="${attrUrl(avatarUrl, DEFAULT_AVATAR)}" style="width:24px; height:24px; border-radius:50%; object-fit:cover;">`;
    const bubbleHtml = `
        <div style="background: ${isMine ? '#10b981' : '#1e293b'}; color: ${isMine ? '#0f172a' : '#e2e8f0'}; padding: 6px 10px; border-radius: 8px; font-size: 0.85rem; max-width: 85%; word-wrap: break-word;">
            ${!isMine ? `<div class="live-chat-author" data-username="${escapeHTML(username)}" style="font-size:0.7rem; font-weight:bold; color:#38bdf8; margin-bottom:2px; cursor:pointer;">@${escapeHTML(username)}</div>` : ''}
            ${escapeHTML(message)}
        </div>
    `;




    div.innerHTML = isMine ? bubbleHtml + avatarHtml : avatarHtml + bubbleHtml;
    const liveAuthor = div.querySelector('.live-chat-author');
    if (liveAuthor) liveAuthor.addEventListener('click', () => window.openUserProfileCard(liveAuthor.getAttribute('data-username')));
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




// --- CALL SIGNALING HELPERS ---
// supabase-js behaviours the call system has to work around:
//  * db.channel(name) returns the EXISTING channel for that name (even one that is still being removed), and
//    subscribe() on a channel that is already joined never fires its callback. Re-using a topic therefore
//    silently drops signals, so every call channel is created through openFreshChannel().
//  * Query builders are thenables without .catch(); fire-and-forget queries use .then(null, handler).
const handledCallIds = new Set();
const channelRemovals = new Map();
const signalQueues = new Map();
const notifiedCallers = new Set();
let callSetupInProgress = false;
let incomingCallTimer = null;
let callSignalingInitTicket = 0;

function callLog(...args) { console.log('[call]', ...args); }

function newCallId() {
    try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Direct audio needs a TURN relay on restrictive networks (mobile carriers, corporate/school Wi-Fi, some home
// routers). STUN alone only works when both peers can reach each other directly. Add TURN credentials here,
// e.g. { urls: 'turn:turn.example.com:3478', username: '...', credential: '...' }.
const TURN_ICE_SERVERS = [];

function getIceServers() {
    return [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        ...TURN_ICE_SERVERS
    ];
}

function removeChannelTracked(ch) {
    if (!ch || !db) return Promise.resolve();
    const done = Promise.resolve(db.removeChannel(ch)).then(() => {}, () => {}).then(() => {
        if (channelRemovals.get(ch.topic) === done) channelRemovals.delete(ch.topic);
    });
    channelRemovals.set(ch.topic, done);
    return done;
}

async function openFreshChannel(name, config) {
    const topic = `realtime:${name}`;
    if (channelRemovals.has(topic)) await channelRemovals.get(topic);
    for (const stale of db.getChannels().filter(c => c.topic === topic)) {
        await removeChannelTracked(stale);
    }
    return config ? db.channel(name, config) : db.channel(name);
}

// Resolves true once the channel has joined, false on error/timeout.
// `onStatus` keeps receiving later statuses too (e.g. the automatic rejoin after a network blip).
function subscribeChannel(ch, timeoutMs = 8000, onStatus = null) {
    return new Promise((resolve) => {
        let settled = false;
        const finish = (ok) => { if (!settled) { settled = true; clearTimeout(timer); resolve(ok); } };
        const timer = setTimeout(() => finish(false), timeoutMs);
        ch.subscribe((status) => {
            if (onStatus) { try { onStatus(status); } catch (e) { console.warn("Channel status handler error:", e); } }
            if (status === 'SUBSCRIBED') finish(true);
            else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') finish(false);
        });
    });
}

// One-shot broadcast to a channel this client does not otherwise hold open (decline, busy, ...).
// Sends to the same topic are serialised so a second send never tears down the first one's channel.
function sendSignalOnce(channelName, events) {
    if (!db) return Promise.resolve(false);
    // openFreshChannel() closes any existing channel with this name; never do that to the live call's room.
    if (typeof activeCall !== 'undefined' && activeCall && !activeCall.ended && channelName === `call_room_${activeCall.conversationId}`) {
        return Promise.resolve(false);
    }
    const list = Array.isArray(events) ? events : [events];
    const prev = signalQueues.get(channelName) || Promise.resolve();
    const run = prev.then(async () => {
        let ch = null;
        try {
            ch = await openFreshChannel(channelName);
            if (!(await subscribeChannel(ch))) {
                callLog(`could not join ${channelName} to deliver`, list.map(e => e.event));
                return false;
            }
            for (const e of list) {
                await ch.send({ type: 'broadcast', event: e.event, payload: e.payload });
            }
            return true;
        } catch (err) {
            console.warn(`Signal delivery to ${channelName} failed:`, err);
            return false;
        } finally {
            if (ch) await removeChannelTracked(ch);
        }
    });
    const tail = run.then(() => {}, () => {});
    signalQueues.set(channelName, tail);
    tail.then(() => { if (signalQueues.get(channelName) === tail) signalQueues.delete(channelName); });
    return run;
}

function describeMicError(err) {
    const name = err && err.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') {
        return 'Microphone access is blocked. Allow the microphone for this site in your browser settings, then try again.';
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No usable microphone was found on this device.';
    if (name === 'NotReadableError') return 'Your microphone is being used by another app.';
    return `Could not start the call: ${(err && (err.message || err.name)) || 'unknown error'}`;
}

function purgeIncomingCallNotifications() {
    if (!db || !currentUser) return;
    db.from('user_notifications')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('type', 'incoming_call')
        .then(null, () => {});
}

function dismissIncomingCallUI() {
    stopRingtoneSound();
    if (incomingCallTimer) {
        clearTimeout(incomingCallTimer);
        incomingCallTimer = null;
    }
    incomingCallData = null;
    if (callAmbientBackdrop) callAmbientBackdrop.classList.add('hidden');
    if (incomingCallPopout) incomingCallPopout.classList.add('hidden');
}

function renderIncomingCallerName(data) {
    if (!incomingCallerName) return;
    if (data.isGroup && data.groupName) {
        incomingCallerName.textContent = `${data.groupName} (@${data.callerUsername || 'User'})`;
    } else {
        incomingCallerName.textContent = `@${data.callerUsername || 'User'}`;
    }
}

// =========================================================================
// --- 1-ON-1 WEBRTC AUDIO CALLING SYSTEM ---
// =========================================================================
// Flow: caller opens call_room_<conversation> and pulses `incoming_call` to the callee's user_call_sig_<id>
// channel (plus a user_notifications row as a fallback). The callee joins the room and sends `call_accepted`;
// the caller then creates the WebRTC offer, the callee answers, and ICE candidates are exchanged over the room.

function triggerIncomingCallUI(data) {
    if (!data || !data.callerId || data.callerId === currentUser?.id) return;
    if (activeCall || isAnsweringCall || callSetupInProgress) return;

    if (!userNotifPrefs.allEnabled || !userNotifPrefs.calls) {
        return;
    }

    if (data.callId) {
        // Dialing pulses of a call we already answered/declined/lost are ignored; a brand new call has a new id.
        if (handledCallIds.has(data.callId)) return;
    } else {
        // Database-notification fallback carries no call id, so honour explicit declines for a while.
        const lastDeclined = Math.max(
            recentlyDeclinedCalls.get(data.conversationId) || 0,
            recentlyDeclinedCalls.get(data.callerId) || 0
        );
        if (Date.now() - lastDeclined < 45000) return;
    }

    // Broadcast pulse and notification fallback both arrive for the same call: don't restart the ringtone.
    if (incomingCallData && incomingCallData.conversationId === data.conversationId) {
        const seen = new Set([...(incomingCallData.ringIds || []), data.callId].filter(Boolean));
        incomingCallData = { ...incomingCallData, ...data, ringIds: Array.from(seen) };
        renderIncomingCallerName(incomingCallData);
        return;
    }

    incomingCallData = { ...data, ringIds: data.callId ? [data.callId] : [] };
    renderIncomingCallerName(data);
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
    // Never leave a ghost popup if the caller's cancel signal is lost.
    if (incomingCallTimer) clearTimeout(incomingCallTimer);
    incomingCallTimer = setTimeout(() => {
        incomingCallTimer = null;
        if (incomingCallData && !isAnsweringCall) dismissIncomingCallUI();
    }, 45000);
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
            activeCallBar.className = 'active-call-window connecting';
        } else {
            callPulseIndicator.className = 'call-pulse-dot';
            activeCallBar.className = 'active-call-window';
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

    if (callDurationText) {
        callDurationText.classList.remove('hidden');
        callDurationText.textContent = "00:00";
    }

    if (activeCall.callTimerInterval) clearInterval(activeCall.callTimerInterval);
    activeCall.callStartTime = Date.now();
    hapticTap('success');
    updateCallUI(activeCall);
    activeCall.callTimerInterval = setInterval(() => {
        if (!activeCall || !activeCall.callStartTime) return;
        const elapsed = Math.floor((Date.now() - activeCall.callStartTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        if (callDurationText) callDurationText.textContent = `${mins}:${secs}`;
    }, 1000);
}

// =============================================================================
// AUDIO CALL ENGINE: 1-on-1 and group calls (full-mesh WebRTC)
// =============================================================================
// Every conversation has one call room: the realtime channel `call_room_<conversation id>`.
//  * Presence says who is in the room right now; it is the single source of truth for the roster, so
//    joining late, leaving early and dropped connections all fall out of the same code path.
//  * Every pair of people in the room holds its own RTCPeerConnection (a "mesh"). For each pair the
//    side with the higher user id creates the offer, so two people never offer at the same time.
//  * Offers, answers and ICE candidates are broadcast on the room tagged with { from, to }; everyone
//    ignores messages that are not addressed to them.
//  * Ringing is separate: the caller pulses `incoming_call` to each member's personal channel (plus a
//    notification row as a fallback). Answering simply means joining the room.
// A 1-on-1 call is the same thing with a room of two that ends when the other person leaves.

const MAX_CALL_PARTICIPANTS = 6; // full mesh: every extra person adds a connection to everyone else
const CALL_SOLO_TIMEOUT_MS = 30000;
const CALL_PRESENCE_GRACE_MS = 4000;
const CALL_PEER_CONNECT_TIMEOUT_MS = 25000;
const CALL_RING_PULSES = 14; // x 2.5s = 35s per ring
const CALL_MAX_RING_TARGETS = 40;

function callIsCurrent(call) {
    return Boolean(call && activeCall === call && !call.ended);
}

function createCallState(fields) {
    return {
        callId: null,
        ringIds: new Set(),
        conversationId: null,
        isGroup: false,
        groupName: null,
        isCaller: false,
        partnerId: null,        // the other person in a 1-on-1 call
        partnerUsername: '',
        localStream: null,
        callChannel: null,
        joinedAt: Date.now(),
        peers: new Map(),       // user id -> peer connection record
        roster: new Map(),      // user id -> { username, muted } for everyone else in the room
        earlyIce: new Map(),    // ICE that arrived before its peer existed
        gaveUp: new Set(),      // peers we could not connect to
        sigTargets: [],         // personal channels we ring: { id, chan, ready }
        rings: new Map(),       // ring id -> { id, targetIds, payload, pulses, timer }
        members: null,          // Set of user ids allowed in this conversation (null = unknown)
        lastRingAt: 0,
        presencePayload: null,
        everHadPeer: false,
        ended: false,
        callStartTime: null,
        callTimerInterval: null,
        soloTimer: null,
        speakTimer: null,
        selfMeter: null,
        chipSignature: '',
        ...fields
    };
}

function getCallAudioSink() {
    let sink = document.getElementById('call-audio-sink');
    if (!sink) {
        sink = document.createElement('div');
        sink.id = 'call-audio-sink';
        sink.setAttribute('aria-hidden', 'true');
        sink.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;opacity:0.01;pointer-events:none;';
        document.body.appendChild(sink);
    }
    return sink;
}

function sendCallSignal(call, event, to, payload = {}) {
    if (!call.callChannel) return;
    call.callChannel.send({
        type: 'broadcast',
        event,
        payload: { ...payload, from: currentUser.id, to }
    }).catch(() => {});
}

// ---- peers -------------------------------------------------------------------

function createCallPeer(call, id, username, { negotiate = true } = {}) {
    const pc = new RTCPeerConnection({ iceServers: getIceServers() });
    call.localStream.getTracks().forEach(track => pc.addTrack(track, call.localStream));

    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    audioEl.setAttribute('playsinline', '');
    audioEl.muted = Boolean(userAudioSettings.deafen);
    audioEl.dataset.peer = id;
    getCallAudioSink().appendChild(audioEl);

    const peer = {
        id,
        username,
        pc,
        audioEl,
        queued: call.earlyIce.get(id) || [],
        remoteSet: false,
        failures: 0,
        state: 'connecting',
        speaking: false,
        analyser: null,
        meterSource: null,
        meterData: null,
        leaveTimer: null,
        connectTimer: null,
        disconnectTimer: null,
        iceOutbox: [],
        iceTimer: null,
        candidateTypes: { host: 0, srflx: 0, relay: 0 }
    };
    call.earlyIce.delete(id);
    call.peers.set(id, peer);

    pc.ontrack = (event) => {
        const stream = (event.streams && event.streams[0]) || new MediaStream([event.track]);
        audioEl.srcObject = stream;
        audioEl.play().catch(e => console.warn("Call audio play notice:", e));
        attachCallMeter(call, peer, stream);
    };

    pc.onicecandidate = (event) => {
        if (!event.candidate) {
            callLog('ICE gathering finished for', username, peer.candidateTypes);
            return;
        }
        if (event.candidate.type in peer.candidateTypes) peer.candidateTypes[event.candidate.type]++;
        if (!callIsCurrent(call) || call.peers.get(id) !== peer) return;
        queueCallIce(call, peer, event.candidate.toJSON ? event.candidate.toJSON() : event.candidate);
    };

    const onState = () => onCallPeerState(call, peer);
    pc.oniceconnectionstatechange = onState;
    pc.onconnectionstatechange = onState;

    armCallPeerTimeout(call, peer);

    // Deterministic roles: the higher id offers, the other side answers.
    if (negotiate && currentUser.id > id) negotiateCallPeer(call, peer, false);
    return peer;
}

// Candidates are sent in small batches: with several people in the room, one broadcast per candidate would
// multiply into hundreds of realtime messages in the first second of a call.
function queueCallIce(call, peer, candidate) {
    peer.iceOutbox.push(candidate);
    if (peer.iceTimer) return;
    peer.iceTimer = setTimeout(() => {
        peer.iceTimer = null;
        if (!callIsCurrent(call) || call.peers.get(peer.id) !== peer) return;
        const batch = peer.iceOutbox.splice(0);
        if (batch.length) sendCallSignal(call, 'call_ice', peer.id, { candidates: batch });
    }, 120);
}

function armCallPeerTimeout(call, peer) {
    clearTimeout(peer.connectTimer);
    peer.connectTimer = setTimeout(() => {
        if (callIsCurrent(call) && call.peers.get(peer.id) === peer && peer.state !== 'connected') {
            handleCallPeerFailure(call, peer, 'timeout');
        }
    }, CALL_PEER_CONNECT_TIMEOUT_MS);
}

async function negotiateCallPeer(call, peer, iceRestart) {
    try {
        const offer = await peer.pc.createOffer({ iceRestart: Boolean(iceRestart) });
        if (!callIsCurrent(call) || call.peers.get(peer.id) !== peer) return;
        await peer.pc.setLocalDescription(offer);
        sendCallSignal(call, 'call_offer', peer.id, { sdp: { type: offer.type, sdp: offer.sdp } });
        callLog('offer sent to', peer.username, iceRestart ? '(ICE restart)' : '');
    } catch (err) {
        console.error("Error creating call offer:", err);
        handleCallPeerFailure(call, peer, 'offer-error');
    }
}

async function flushPeerIce(peer) {
    while (peer.queued.length > 0) {
        const candidate = peer.queued.shift();
        try {
            await peer.pc.addIceCandidate(candidate);
        } catch (err) {
            console.warn("Notice adding queued ICE candidate:", err);
        }
    }
}

// The room is a public realtime channel, so anyone who learns a conversation id could join it. Only people
// who really belong to the conversation (checked against conversation_members) are ever connected to.
function callPeerAllowed(call, id) {
    return !call.members || call.members.has(id);
}

async function onCallOffer(call, data) {
    if (!callIsCurrent(call) || !data || data.to !== currentUser.id || !data.sdp) return;
    if (!callPeerAllowed(call, data.from)) return;

    // An offer can overtake our own presence sync, so create the peer on demand.
    let peer = call.peers.get(data.from);
    if (!peer) {
        const known = call.roster.get(data.from);
        peer = createCallPeer(call, data.from, (known && known.username) || 'User', { negotiate: false });
    }

    const pc = peer.pc;
    try {
        if (pc.signalingState !== 'stable') {
            // Both sides offered (e.g. simultaneous restarts): the lower id yields, the higher keeps its offer.
            if (currentUser.id > data.from) return;
            await pc.setLocalDescription({ type: 'rollback' });
        }
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        peer.remoteSet = true;
        await flushPeerIce(peer);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendCallSignal(call, 'call_answer', data.from, { sdp: { type: answer.type, sdp: answer.sdp } });
        callLog('answered offer from', peer.username);
    } catch (err) {
        console.error("Error handling call offer:", err);
        handleCallPeerFailure(call, peer, 'answer-error');
    }
}

async function onCallAnswer(call, data) {
    if (!callIsCurrent(call) || !data || data.to !== currentUser.id || !data.sdp) return;
    if (!callPeerAllowed(call, data.from)) return;
    const peer = call.peers.get(data.from);
    if (!peer || peer.pc.signalingState !== 'have-local-offer') return;

    try {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        peer.remoteSet = true;
        await flushPeerIce(peer);
    } catch (err) {
        console.error("Error handling call answer:", err);
        handleCallPeerFailure(call, peer, 'answer-error');
    }
}

async function onCallIce(call, data) {
    if (!callIsCurrent(call) || !data || data.to !== currentUser.id) return;
    if (!callPeerAllowed(call, data.from)) return;
    const candidates = Array.isArray(data.candidates) ? data.candidates : (data.candidate ? [data.candidate] : []);
    if (candidates.length === 0) return;

    const peer = call.peers.get(data.from);
    if (!peer) {
        if (!call.earlyIce.has(data.from)) call.earlyIce.set(data.from, []);
        call.earlyIce.get(data.from).push(...candidates);
        return;
    }
    for (const candidate of candidates) {
        if (peer.remoteSet) {
            try { await peer.pc.addIceCandidate(candidate); }
            catch (err) { console.warn("Notice adding ICE candidate:", err); }
        } else {
            peer.queued.push(candidate);
        }
    }
}

function onCallPeerState(call, peer) {
    if (!callIsCurrent(call) || call.peers.get(peer.id) !== peer) return;

    const ice = peer.pc.iceConnectionState;
    const conn = peer.pc.connectionState;
    callLog('peer', peer.username, { ice, conn });

    if (ice === 'connected' || ice === 'completed' || conn === 'connected') {
        peer.state = 'connected';
        peer.failures = 0;
        clearTimeout(peer.connectTimer);
        clearTimeout(peer.disconnectTimer);
        isAnsweringCall = false;
        if (!call.callStartTime) setCallConnectedState();
        updateCallUI(call);
    } else if (ice === 'failed' || conn === 'failed') {
        handleCallPeerFailure(call, peer, 'failed');
    } else if (ice === 'disconnected' || conn === 'disconnected') {
        // Usually a blip; give it a few seconds to recover before treating it as a failure.
        peer.state = 'reconnecting';
        updateCallUI(call);
        clearTimeout(peer.disconnectTimer);
        peer.disconnectTimer = setTimeout(() => {
            if (callIsCurrent(call) && call.peers.get(peer.id) === peer && peer.state !== 'connected') {
                handleCallPeerFailure(call, peer, 'disconnected');
            }
        }, 10000);
    }
}

function handleCallPeerFailure(call, peer, reason) {
    if (!callIsCurrent(call) || call.peers.get(peer.id) !== peer) return;

    peer.failures++;
    console.warn(`[call] Connection to @${peer.username} ${reason}.`, peer.candidateTypes.relay === 0
        ? 'No TURN relay candidates were available; this network may block direct peer-to-peer audio (see TURN_ICE_SERVERS).'
        : '');

    if (peer.failures <= 2) {
        // Retry. The offerer restarts ICE; the other side waits for the new offer.
        peer.state = 'connecting';
        updateCallUI(call);
        armCallPeerTimeout(call, peer);
        if (currentUser.id > peer.id) negotiateCallPeer(call, peer, true);
        return;
    }

    if (!call.isGroup) {
        cleanupCall("Connection Failed");
        return;
    }

    // Group call: give up on this one person but keep the call going for everyone else.
    closeCallPeer(peer);
    call.peers.delete(peer.id);
    call.gaveUp.add(peer.id);
    showToast({
        title: "Can't reach @" + peer.username,
        message: "Their network may be blocking direct audio. The rest of the call continues.",
        type: "error",
        icon: "📡",
        duration: 6000,
        force: true
    });
    updateCallUI(call);
}

function closeCallPeer(peer) {
    clearTimeout(peer.connectTimer);
    clearTimeout(peer.leaveTimer);
    clearTimeout(peer.disconnectTimer);
    clearTimeout(peer.iceTimer);
    try { peer.pc.close(); } catch (e) {}
    try { if (peer.meterSource) peer.meterSource.disconnect(); } catch (e) {}
    peer.audioEl.srcObject = null;
    peer.audioEl.remove();
}

function onCallPeerLeft(call, id) {
    call.roster.delete(id);
    call.gaveUp.delete(id);
    call.earlyIce.delete(id);

    const peer = call.peers.get(id);
    if (!peer) {
        updateCallUI(call);
        return;
    }

    closeCallPeer(peer);
    call.peers.delete(id);
    callLog('@' + peer.username, 'left the call');
    updateCallUI(call);

    // In a 1-on-1 call the other person leaving ends it; a group call carries on.
    if (!call.isGroup) {
        if (call.everHadPeer) cleanupCall("Call Ended");
        return;
    }
    checkCallAlone(call);
}

// If everyone else is gone, don't leave the user sitting in an empty call forever.
function checkCallAlone(call, timeout = CALL_SOLO_TIMEOUT_MS) {
    if (!callIsCurrent(call)) return;
    if (call.peers.size > 0 || call.roster.size > 0) {
        clearTimeout(call.soloTimer);
        call.soloTimer = null;
        return;
    }
    if (call.soloTimer) return;
    call.soloTimer = setTimeout(() => {
        call.soloTimer = null;
        if (callIsCurrent(call) && call.peers.size === 0 && call.roster.size === 0) {
            cleanupCall(call.everHadPeer ? "Everyone left" : "Call Ended");
        }
    }, timeout);
}

// ---- roster (presence) ------------------------------------------------------------

function reconcileCallPeers(call) {
    if (!callIsCurrent(call) || !call.callChannel) return;

    const state = call.callChannel.presenceState ? call.callChannel.presenceState() : {};
    const me = currentUser.id;
    const everyone = [];
    const present = new Map();

    for (const [key, metas] of Object.entries(state || {})) {
        // A key that is mid-leave can linger with no entries; and after a track() update the newest entry is last.
        if (!Array.isArray(metas) || metas.length === 0) continue;
        if (key !== me && !callPeerAllowed(call, key)) continue;
        const meta = metas[metas.length - 1] || {};
        everyone.push({ key, at: Number(meta.at) || 0 });
        if (key !== me) present.set(key, { username: meta.username || 'User', muted: Boolean(meta.muted) });
    }

    // Capacity: if the room is over the limit, the most recent joiners step out (and are ignored meanwhile).
    const overflow = new Set();
    if (everyone.length > MAX_CALL_PARTICIPANTS) {
        everyone.sort((a, b) => (a.at - b.at) || (a.key < b.key ? -1 : 1));
        everyone.slice(MAX_CALL_PARTICIPANTS).forEach(e => overflow.add(e.key));
        if (overflow.has(me)) {
            showToast({
                title: "Call is full",
                message: `Calls are limited to ${MAX_CALL_PARTICIPANTS} people.`,
                type: "error",
                icon: "📞",
                force: true
            });
            endCurrentAudioCall();
            return;
        }
    }

    overflow.forEach(id => present.delete(id));
    call.roster = present;

    for (const [id, info] of present) {
        const existing = call.peers.get(id);
        if (existing) {
            existing.username = info.username;
            existing.muted = info.muted;
            clearTimeout(existing.leaveTimer);
            existing.leaveTimer = null;
        } else if (!call.gaveUp.has(id)) {
            const peer = createCallPeer(call, id, info.username);
            peer.muted = info.muted;
        }
    }

    // People who vanished from presence get a short grace period (reconnects look like leave+join).
    for (const [id, peer] of call.peers) {
        if (!present.has(id) && !peer.leaveTimer) {
            peer.leaveTimer = setTimeout(() => {
                if (callIsCurrent(call) && !call.roster.has(id)) onCallPeerLeft(call, id);
            }, CALL_PRESENCE_GRACE_MS);
        }
    }

    if (present.size > 0) {
        call.everHadPeer = true;
        clearTimeout(call.soloTimer);
        call.soloTimer = null;
        // Somebody picked up: stop the ringback tone.
        stopRingtoneSound();
    } else if (call.everHadPeer) {
        checkCallAlone(call);
    }

    updateCallUI(call);
}

// A decline/busy reply only counts if it is from the person we are calling and answers one of our rings.
function ringReplyApplies(call, payload) {
    if (!callIsCurrent(call) || call.isGroup || !call.isCaller || call.everHadPeer) return false;
    if (payload && payload.from && payload.from !== call.partnerId) return false;
    if (payload && payload.callId && !call.ringIds.has(payload.callId)) return false;
    return true;
}

function bindCallRoomEvents(call, chan) {
    const mine = (payload) => payload && payload.to === currentUser?.id;

    chan
        .on('presence', { event: 'sync' }, () => reconcileCallPeers(call))
        .on('presence', { event: 'join' }, () => reconcileCallPeers(call))
        .on('presence', { event: 'leave' }, () => reconcileCallPeers(call))
        .on('broadcast', { event: 'call_offer' }, (msg) => { if (mine(msg?.payload)) onCallOffer(call, msg.payload); })
        .on('broadcast', { event: 'call_answer' }, (msg) => { if (mine(msg?.payload)) onCallAnswer(call, msg.payload); })
        .on('broadcast', { event: 'call_ice' }, (msg) => { if (mine(msg?.payload)) onCallIce(call, msg.payload); })
        .on('broadcast', { event: 'call_leave' }, (msg) => {
            const from = msg?.payload?.from;
            if (callIsCurrent(call) && from && from !== currentUser.id) onCallPeerLeft(call, from);
        })
        .on('broadcast', { event: 'call_declined' }, (msg) => {
            if (!ringReplyApplies(call, msg?.payload)) return;
            cleanupCall("Call Declined");
        })
        .on('broadcast', { event: 'call_busy' }, (msg) => {
            if (!ringReplyApplies(call, msg?.payload)) return;
            cleanupCall("User is Busy");
        });
}

// Announces (or re-announces) us in the room's presence. The server forgets our presence when the socket
// drops, and supabase-js rejoins the channel without replaying track(), so this runs again on every rejoin.
async function trackCallPresence(call, attempts = 2) {
    for (let i = 0; i < attempts; i++) {
        if (!callIsCurrent(call) || !call.callChannel) return false;
        try {
            const result = await call.callChannel.track({
                user_id: currentUser.id,
                username: currentUsername,
                at: call.joinedAt,
                muted: Boolean(isMicMuted)
            });
            if (result === 'ok') return true;
            callLog('presence track returned', result);
        } catch (err) {
            console.warn("Presence track failed:", err);
        }
        await new Promise(resolve => setTimeout(resolve, 400));
    }
    return false;
}

// Opens the call room, listens for signals and announces ourselves in presence.
async function joinCallRoom(call) {
    const chan = await openFreshChannel(`call_room_${call.conversationId}`, {
        config: { presence: { key: currentUser.id } }
    });
    if (!callIsCurrent(call)) { removeChannelTracked(chan); return false; }

    call.callChannel = chan;
    bindCallRoomEvents(call, chan);

    let subscriptions = 0;
    const joined = await subscribeChannel(chan, 8000, (status) => {
        if (status === 'SUBSCRIBED') {
            if (++subscriptions > 1 && callIsCurrent(call)) {
                callLog('call room rejoined; announcing again');
                trackCallPresence(call);
            }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[call] call room problem:', status);
        }
    });
    if (!callIsCurrent(call) || !joined) return false;

    if (!(await trackCallPresence(call))) return false;
    if (!callIsCurrent(call)) return false;

    callLog('joined call room', call.conversationId);
    reconcileCallPeers(call);
    return true;
}

async function loadCallMembers(conversationId) {
    try {
        const { data, error } = await db
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', conversationId);
        if (error || !data) return null;
        return new Set(data.map(m => m.user_id));
    } catch (e) {
        return null;
    }
}

// ---- ringing ------------------------------------------------------------------------

// Tells the given members (default: everyone not in the call) that these rings are over.
function cancelOutgoingCall(call, callIds = Array.from(call.ringIds), onlyIds = null) {
    call.sigTargets.forEach((target) => {
        if (!target.ready || !target.chan || call.roster.has(target.id)) return;
        if (onlyIds && !onlyIds.includes(target.id)) return;
        target.chan.send({
            type: 'broadcast',
            event: 'cancel_call',
            payload: { callerId: currentUser?.id, callIds, conversationId: call.conversationId }
        }).catch(() => {});
    });
}

function sendRingPulse(call, target, onlyRing = null) {
    if (!callIsCurrent(call) || !target.ready || !target.chan || call.roster.has(target.id)) return;
    const rings = onlyRing ? [onlyRing] : Array.from(call.rings.values());
    rings.forEach((ring) => {
        if (ring.targetIds.includes(target.id)) {
            target.chan.send({ type: 'broadcast', event: 'incoming_call', payload: ring.payload }).catch(() => {});
        }
    });
}

// Opens (or re-opens) the personal channel we ring someone on.
function openSigTarget(call, target) {
    if (target.opening || !callIsCurrent(call)) return;
    target.opening = true;
    target.attempts = (target.attempts || 0) + 1;
    target.ready = false;
    if (target.chan) { removeChannelTracked(target.chan); target.chan = null; }

    openFreshChannel(`user_call_sig_${target.id}`).then((chan) => {
        if (!callIsCurrent(call)) { removeChannelTracked(chan); target.opening = false; return; }
        target.chan = chan;
        return subscribeChannel(chan).then((ok) => {
            target.opening = false;
            target.ready = ok;
            if (ok) sendRingPulse(call, target);
        });
    }).catch((err) => {
        target.opening = false;
        console.warn("Could not reach a call member's channel:", err);
    });
}

// Rings the given members: pulses on their personal channels for ~35 seconds (until they join) and
// adds a notification row as a fallback for anyone whose realtime connection is down.
function startRinging(call, ids, { initial = false } = {}) {
    const targetIds = Array.from(new Set(ids)).filter(id => id && id !== currentUser.id).slice(0, CALL_MAX_RING_TARGETS);
    if (targetIds.length === 0) return;

    const ringId = newCallId();
    call.ringIds.add(ringId);
    if (!call.callId) call.callId = ringId;
    call.lastRingAt = Date.now();

    const ring = {
        id: ringId,
        targetIds,
        pulses: 0,
        timer: null,
        payload: {
            callId: ringId,
            isGroup: call.isGroup,
            groupName: call.groupName,
            callerId: currentUser.id,
            callerUsername: currentUsername,
            callerAvatar: currentAvatarUrl,
            conversationId: call.conversationId
        }
    };
    call.rings.set(ringId, ring);

    // Personal channels are opened once and reused by later rings.
    targetIds.forEach((id) => {
        const existing = call.sigTargets.find(t => t.id === id);
        if (existing) {
            sendRingPulse(call, existing, ring);
        } else {
            const target = { id, chan: null, ready: false, opening: false, attempts: 0 };
            call.sigTargets.push(target);
            openSigTarget(call, target);
        }
    });

    targetIds.forEach(id => {
        sendNotification(
            id,
            'incoming_call',
            call.conversationId,
            call.isGroup ? 'started a group call in ' + (call.groupName || 'Chat') : 'is calling you...'
        );
    });

    const finishRing = () => {
        clearInterval(ring.timer);
        call.rings.delete(ringId);
    };

    ring.timer = setInterval(() => {
        if (!callIsCurrent(call)) { finishRing(); return; }

        const waiting = call.sigTargets.filter(t => targetIds.includes(t.id) && !call.roster.has(t.id));
        const answeredOneToOne = !call.isGroup && call.roster.size > 0;

        if (waiting.length === 0 || answeredOneToOne) {
            finishRing();
            return;
        }

        if (ring.pulses >= CALL_RING_PULSES) {
            finishRing();
            cancelOutgoingCall(call, [ringId], targetIds);
            if (initial && !call.everHadPeer) cleanupCall("No Answer");
            return;
        }

        ring.pulses++;
        waiting.forEach((target) => {
            // A personal channel that failed to join gets another few tries.
            if (!target.ready && !target.opening && target.attempts < 3) openSigTarget(call, target);
            else sendRingPulse(call, target, ring);
        });
    }, 2500);
}

// ---- UI ------------------------------------------------------------------------------

function callDisplayName(call) {
    return call.isGroup ? (call.groupName || 'Group call') : `@${call.partnerUsername || 'User'}`;
}

function updateCallUI(call) {
    if (!callIsCurrent(call) || !activeCallBar) return;

    const peers = Array.from(call.peers.values());
    let status;
    if (!call.isGroup) {
        if (call.callStartTime) status = `In call with ${callDisplayName(call)}`;
        else if (call.isCaller && !call.everHadPeer) status = `Calling ${callDisplayName(call)}...`;
        else status = `Connecting to ${callDisplayName(call)}...`;
    } else if (call.callStartTime) {
        status = `${callDisplayName(call)} · ${peers.length + 1} in call`;
    } else if (peers.length > 0) {
        status = `Connecting to ${callDisplayName(call)}...`;
    } else {
        status = call.isCaller ? `Ringing ${callDisplayName(call)}...` : `Joining ${callDisplayName(call)}...`;
    }
    showActiveCallBar(status, !call.callStartTime);

    const chips = document.getElementById('call-participants');
    const ringBtn = document.getElementById('call-ring-btn');
    if (ringBtn) ringBtn.classList.toggle('hidden', !call.isGroup);
    if (!chips) return;

    if (!call.isGroup) {
        chips.classList.add('hidden');
        return;
    }
    chips.classList.remove('hidden');

    const signature = [isMicMuted, ...peers.map(p => `${p.id}:${p.username}:${p.state}:${p.muted ? 1 : 0}`)].join('|');
    if (signature === call.chipSignature) return;
    call.chipSignature = signature;

    chips.innerHTML =
        `<span class="call-chip call-chip-you${isMicMuted ? ' is-muted' : ''}${call.selfMeter && call.selfMeter.speaking ? ' speaking' : ''}" data-peer="__self">You${isMicMuted ? ' 🔇' : ''}</span>` +
        peers.map(p => `<span class="call-chip call-chip-${escapeHTML(p.state)}${p.muted ? ' is-muted' : ''}${p.speaking ? ' speaking' : ''}" data-peer="${escapeHTML(p.id)}" title="${escapeHTML(p.state)}">@${escapeHTML(p.username)}${p.muted ? ' 🔇' : ''}</span>`).join('');
}

// "Who's talking" highlight: a light-weight volume check on each remote stream and on our own mic.
function levelOf(analyser, data) {
    analyser.getByteTimeDomainData(data);
    let peak = 0;
    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128));
    return peak;
}

function setChipSpeaking(peerId, speaking) {
    const chip = document.querySelector(`#call-participants [data-peer="${CSS.escape(peerId)}"]`);
    if (chip) chip.classList.toggle('speaking', speaking);
}

function startCallSpeakingMeter(call) {
    if (call.speakTimer) return;
    call.speakTimer = setInterval(() => {
        if (!callIsCurrent(call) || document.hidden || !call.isGroup) return;

        call.peers.forEach((peer) => {
            if (!peer.analyser) return;
            const speaking = levelOf(peer.analyser, peer.meterData) > 14;
            if (speaking !== peer.speaking) {
                peer.speaking = speaking;
                setChipSpeaking(peer.id, speaking);
            }
        });

        if (call.selfMeter) {
            const speaking = !isMicMuted && levelOf(call.selfMeter.analyser, call.selfMeter.data) > 14;
            if (speaking !== call.selfMeter.speaking) {
                call.selfMeter.speaking = speaking;
                setChipSpeaking('__self', speaking);
            }
        }
    }, 160);
}

function attachCallMeter(call, peer, stream) {
    if (!call.isGroup) return;
    try {
        const ctx = getSharedAudioContext();
        if (!ctx) return;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser); // analysis only; the <audio> element does the playing
        peer.analyser = analyser;
        peer.meterSource = source;
        peer.meterData = new Uint8Array(analyser.fftSize);
        startCallSpeakingMeter(call);
    } catch (e) { /* the speaking highlight is a nicety, never a requirement */ }
}

function attachSelfMeter(call) {
    if (!call.isGroup || !call.localStream) return;
    try {
        const ctx = getSharedAudioContext();
        if (!ctx) return;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const source = ctx.createMediaStreamSource(call.localStream);
        source.connect(analyser);
        call.selfMeter = { analyser, source, data: new Uint8Array(analyser.fftSize), speaking: false };
        startCallSpeakingMeter(call);
    } catch (e) {}
}

// ---- lifecycle -------------------------------------------------------------------------

function cleanupCall(statusNotice = null) {
    stopRingtoneSound();
    if (callAmbientBackdrop) {
        callAmbientBackdrop.classList.add('hidden');
    }
    queuedIceCandidates = [];
    isAnsweringCall = false;
    answeringConversationId = null;

    if (activeCall) {
        const call = activeCall;
        call.ended = true;
        activeCall = null;
        callLog('cleaning up call', call.callId || '', statusNotice || '');

        // Leaving for any reason (hang-up, everyone left, failure) ends rings that are still going out.
        call.rings.forEach((ring) => {
            clearInterval(ring.timer);
            cancelOutgoingCall(call, [ring.id], ring.targetIds);
        });
        call.rings.clear();
        clearInterval(call.callTimerInterval);
        clearInterval(call.speakTimer);
        clearTimeout(call.soloTimer);
        if (call.localStream) {
            // Completely stop all audio tracks so the hardware microphone shuts down and recording dot disappears
            try {
                call.localStream.getTracks().forEach(t => {
                    try { t.stop(); } catch (e) {}
                });
            } catch (e) {}
        }
        call.peers.forEach(closeCallPeer);
        call.peers.clear();
        try { if (call.selfMeter) call.selfMeter.source.disconnect(); } catch (e) {}
        if (call.callChannel) removeChannelTracked(call.callChannel);
        call.sigTargets.forEach(t => { if (t.chan) removeChannelTracked(t.chan); });
    }

    if (remoteAudioEl) {
        remoteAudioEl.srcObject = null;
    }
    const chips = document.getElementById('call-participants');
    if (chips) { chips.innerHTML = ''; chips.classList.add('hidden'); }
    const ringBtn = document.getElementById('call-ring-btn');
    if (ringBtn) ringBtn.classList.add('hidden');

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

// A ringing popup for the conversation we have just started or joined a call in is now meaningless.
function closeStaleIncomingPopup(call) {
    if (incomingCallData && incomingCallData.conversationId === call.conversationId) {
        (incomingCallData.ringIds || [incomingCallData.callId]).forEach(id => { if (id) handledCallIds.add(id); });
        dismissIncomingCallUI();
    }
}

async function startAudioCall() {
    if (!currentUser || !activeConversationId) {
        alert("Please select a conversation to start a call.");
        return;
    }
    if (activeCall || isAnsweringCall || callSetupInProgress) {
        alert("You are already on an audio call.");
        return;
    }
    callSetupInProgress = true;

    const targetConvId = activeConversationId;
    const targetPartnerId = activeConversationPartnerId;
    const isGroupCall = !targetPartnerId;

    let stream = null;
    let call = null;
    try {
        stream = await getMicrophoneStream();

        call = createCallState({
            conversationId: targetConvId,
            isGroup: isGroupCall,
            groupName: isGroupCall ? ((chatHeader ? chatHeader.textContent : '').replace(/^Group:\s*/i, '').trim() || 'Group Chat') : null,
            isCaller: true,
            partnerId: targetPartnerId,
            partnerUsername: activeConversationPartnerUsername || 'User',
            localStream: stream
        });
        activeCall = call;
        callLog('starting call', isGroupCall ? 'group' : 'direct');
        closeStaleIncomingPopup(call);
        updateCallUI(call);
        playRingtoneSound();
        attachSelfMeter(call);

        let targetIds = [targetPartnerId];
        call.members = new Set([currentUser.id, targetPartnerId]);
        if (isGroupCall) {
            const { data: members, error: membersError } = await db
                .from('conversation_members')
                .select('user_id')
                .eq('conversation_id', targetConvId)
                .neq('user_id', currentUser.id);
            if (!callIsCurrent(call)) return;
            if (membersError) throw new Error("Could not load the group's members.");
            targetIds = (members || []).map(m => m.user_id);
            call.members = new Set([currentUser.id, ...targetIds]);
            if (targetIds.length === 0) {
                cleanupCall("Nobody to call");
                showToast({ title: "Nobody to call", message: "This group has no other members yet.", type: "info", icon: "📞", force: true });
                return;
            }
        }

        const joined = await joinCallRoom(call);
        if (!callIsCurrent(call)) return;
        if (!joined) {
            console.error("[call] Could not join the call room (Realtime unavailable).");
            cleanupCall("Call Failed");
            showToast({
                title: "Call Failed",
                message: "Could not reach the call server. Check your connection and try again.",
                type: "error",
                icon: "📞",
                force: true
            });
            return;
        }

        startRinging(call, targetIds, { initial: true });

    } catch (err) {
        console.error("Audio call error:", err);
        if (!activeCall && stream) {
            try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
        }
        cleanupCall();
        showToast({
            title: "Call Failed",
            message: describeMicError(err),
            type: "error",
            icon: "🎤",
            force: true
        });
    } finally {
        callSetupInProgress = false;
    }
}

async function answerAudioCall() {
    if (!incomingCallData || !currentUser) return;
    if (activeCall || isAnsweringCall || callSetupInProgress) return;

    const data = incomingCallData;
    dismissIncomingCallUI();

    isAnsweringCall = true;
    answeringConversationId = data.conversationId;
    // Ignore any dialing pulses of this call that are still in flight (including re-rings).
    (data.ringIds || [data.callId]).forEach(id => { if (id) handledCallIds.add(id); });
    // Purge the database notification so polling never re-triggers the popup
    purgeIncomingCallNotifications();

    let stream = null;
    let call = null;
    try {
        stream = await getMicrophoneStream();

        call = createCallState({
            callId: data.callId || null,
            conversationId: data.conversationId,
            isGroup: Boolean(data.isGroup),
            groupName: data.groupName || null,
            isCaller: false,
            partnerId: data.isGroup ? null : data.callerId,
            partnerUsername: data.callerUsername || 'User',
            localStream: stream
        });
        (data.ringIds || [data.callId]).forEach(id => { if (id) call.ringIds.add(id); });
        activeCall = call;
        callLog('answering call', data.callId || '(no id)', call.isGroup ? 'group' : 'direct');
        updateCallUI(call);
        attachSelfMeter(call);

        // Ringing is just a message anyone can send, so confirm this conversation really includes us and the caller.
        // Only act on a roster we can actually see: if database policies hide other people's rows we get an
        // empty or me-only list, which proves nothing, so we neither refuse the call nor restrict who may join.
        const members = await loadCallMembers(call.conversationId);
        if (!callIsCurrent(call)) return;
        if (members && members.size > 0) {
            if (!members.has(currentUser.id) || (members.size > 1 && data.callerId && !members.has(data.callerId))) {
                throw new Error("This call does not belong to one of your conversations.");
            }
            if (members.size > 1) call.members = members;
        }

        if (dmModal && dmModal.classList.contains('hidden')) {
            openMessagesModal();
        }
        if (data.isGroup) {
            selectConversation(data.conversationId, data.groupName || 'Group Chat', null, null, true);
        } else {
            selectConversation(data.conversationId, `@${data.callerUsername}`, data.callerId, data.callerUsername, true);
        }

        const joined = await joinCallRoom(call);
        if (!callIsCurrent(call)) return;
        if (!joined) throw new Error("Could not join the call room");

        // The caller may have hung up while we were answering; don't wait around in an empty room.
        checkCallAlone(call, call.isGroup ? CALL_SOLO_TIMEOUT_MS : 10000);

    } catch (err) {
        console.error("Answer call error:", err);
        if (!activeCall && stream) {
            try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
        }
        cleanupCall();
        showToast({
            title: "Could Not Answer Call",
            message: describeMicError(err),
            type: "error",
            icon: "🎤",
            force: true
        });
    }
}

function declineAudioCall() {
    const data = incomingCallData;
    dismissIncomingCallUI();

    if (data) {
        (data.ringIds || [data.callId]).forEach(id => { if (id) handledCallIds.add(id); });
        if (data.conversationId) recentlyDeclinedCalls.set(data.conversationId, Date.now());
        if (data.callerId) recentlyDeclinedCalls.set(data.callerId, Date.now());

        // Declining a group call only dismisses it for this user; it must not hang up everyone else.
        if (db && !data.isGroup) {
            const declined = {
                event: 'call_declined',
                payload: { from: currentUser?.id, conversationId: data.conversationId, callId: data.callId || null }
            };
            sendSignalOnce(`call_room_${data.conversationId}`, declined);
            if (data.callerId) sendSignalOnce(`user_call_sig_${data.callerId}`, declined);
        }
    }

    purgeIncomingCallNotifications();
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

    // Let everyone else's participant list show the mute state.
    if (activeCall.callChannel) trackCallPresence(activeCall, 1);
    updateCallUI(activeCall);
}

function endCurrentAudioCall() {
    const call = activeCall;
    if (call && call.callChannel) {
        // Tell the others right away instead of making them wait for presence to notice.
        call.callChannel.send({
            type: 'broadcast',
            event: 'call_leave',
            payload: { from: currentUser?.id }
        }).catch(() => {});
        try { call.callChannel.untrack(); } catch (e) {}
    }
    cleanupCall("Call Ended");
}

// Ring everyone in the group who isn't in the call yet (late joiners, people who missed it).
async function ringGroupAgain() {
    const call = activeCall;
    if (!callIsCurrent(call) || !call.isGroup || !db) return;
    if (Date.now() - call.lastRingAt < 10000) {
        showToast({ title: "Just rang them", message: "Give it a few seconds before ringing again.", type: "info", icon: "⏳", force: true });
        return;
    }

    const { data: members } = await db
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', call.conversationId)
        .neq('user_id', currentUser.id);
    if (!callIsCurrent(call)) return;

    const missing = (members || []).map(m => m.user_id).filter(id => !call.roster.has(id));
    if (missing.length === 0) {
        showToast({ title: "Everyone is already here", message: "All group members are in the call.", type: "info", icon: "✓", force: true });
        return;
    }

    startRinging(call, missing);
    showToast({
        title: "Ringing again",
        message: `Calling ${missing.length} member${missing.length === 1 ? '' : 's'} who ${missing.length === 1 ? 'is' : 'are'} not in the call.`,
        type: "info",
        icon: "📞",
        force: true
    });
}

async function initUserCallSignaling() {
    if (!db || !currentUser) return;
    const userId = currentUser.id;
    const ticket = ++callSignalingInitTicket;

    try {
        // Awaits removal of any previous channel for this user first (see openFreshChannel).
        const chan = await openFreshChannel(`user_call_sig_${userId}`);
        if (ticket !== callSignalingInitTicket || !currentUser || currentUser.id !== userId) {
            removeChannelTracked(chan);
            return;
        }
        userCallSignalingChannel = chan;

        chan
            .on('broadcast', { event: 'incoming_call' }, (payload) => {
                const data = payload?.payload;
                if (!data || !data.callerId) return;
                if (callSetupInProgress) return; // mid-dial (e.g. the mic prompt is open): ignore pulses
                if (isBlockedId(data.callerId)) return; // never ring for someone you blocked

                // Already answering, or already in this conversation's call: ignore repeat pulses.
                if (isAnsweringCall || (activeCall && (activeCall.conversationId === data.conversationId || activeCall.partnerId === data.callerId))) {
                    return;
                }

                // Answer each call attempt with a single busy/declined signal, not one per dialing pulse.
                const replyKey = data.callId || `${data.callerId}:${data.conversationId}`;

                // In a different call: tell a 1-on-1 caller we're busy; group invites just don't ring us.
                if (activeCall) {
                    if (!data.isGroup && !notifiedCallers.has(`busy:${replyKey}`)) {
                        notifiedCallers.add(`busy:${replyKey}`);
                        sendSignalOnce(`call_room_${data.conversationId}`, {
                            event: 'call_busy',
                            payload: { from: currentUser.id, callId: data.callId || null }
                        });
                    }
                    return;
                }

                if (!userNotifPrefs.allEnabled || !userNotifPrefs.calls) {
                    if (!data.isGroup && !notifiedCallers.has(`declined:${replyKey}`)) {
                        notifiedCallers.add(`declined:${replyKey}`);
                        sendSignalOnce(`call_room_${data.conversationId}`, {
                            event: 'call_declined',
                            payload: { from: currentUser?.id, callId: data.callId || null }
                        });
                    }
                    return;
                }

                triggerIncomingCallUI(data);
            })
            .on('broadcast', { event: 'security_signin' }, (payload) => showSigninAlert(payload?.payload))
            .on('broadcast', { event: 'cancel_call' }, (payload) => {
                const data = payload?.payload;
                const ids = [...(data?.callIds || []), ...(data?.callId ? [data.callId] : [])];
                ids.forEach(id => handledCallIds.add(id));
                if (incomingCallData && incomingCallData.callerId === data?.callerId) {
                    // The popup may be backed by several ring waves (ring-again); only close it when all are cancelled.
                    const stillRinging = (incomingCallData.ringIds || []).filter(id => !ids.includes(id));
                    if (stillRinging.length === 0) dismissIncomingCallUI();
                    else incomingCallData.ringIds = stillRinging;
                }
                // Remove the notification fallback row so the poller can't bring the popup back.
                if (!incomingCallData) purgeIncomingCallNotifications();
            })
            .on('broadcast', { event: 'call_declined' }, (payload) => {
                const data = payload?.payload;
                const call = activeCall;
                if (!call || !call.isCaller || call.isGroup || call.everHadPeer) return;
                if (data?.callId && !call.ringIds.has(data.callId)) return;
                cleanupCall("Call Declined");
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
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') callLog('listening for incoming calls');
                else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.warn('[call] Incoming-call channel problem:', status);
                }
            });
    } catch (err) {
        console.warn("Call signaling init notice:", err);
    }
}

safeAddListener(startCallBtn, 'click', startAudioCall);
safeAddListener(document.getElementById('call-ring-btn'), 'click', ringGroupAgain);
safeAddListener(acceptCallBtn, 'click', answerAudioCall);
safeAddListener(declineCallBtn, 'click', declineAudioCall);
safeAddListener(callMuteBtn, 'click', toggleCallMute);
safeAddListener(callHangupBtn, 'click', endCurrentAudioCall);



let userNotifRealtimeChannel = null;


let userNotifInitTicket = 0;

async function initRealtimeActivityNotifications() {
    if (!db || !currentUser) return;
    const userId = currentUser.id;
    const ticket = ++userNotifInitTicket;

    // db.channel() would hand back the old, still-closing channel (and .on() throws on a joined one), so wait for
    // the previous channel to be fully removed first.
    let chan;
    try {
        chan = await openFreshChannel(`user_realtime_notifs_${userId}`);
    } catch (err) {
        console.warn("Realtime notification init notice:", err);
        return;
    }
    if (ticket !== userNotifInitTicket || !currentUser || currentUser.id !== userId) {
        removeChannelTracked(chan);
        return;
    }

    userNotifRealtimeChannel = chan
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

                // 1. Update notification counters & populate the notifications tab
                checkNotifications();
                loadUserNotifications();

                // Suppress redundant popup toast for incoming calls (Accept/Decline popout is already visible)
                if (notif.type === 'incoming_call') return;
                if (isBlockedUsername(notif.actor_username)) return;

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


async function openVoiceForumModal(threadName) {
    if (!currentUser) {
        alert("Please log in to join the voice stage.");
        return;
    }


    const targetThread = threadName || activeThread || 'General';


    if (voiceStageIsConnected && activeVoiceStageThread !== targetThread) {
        if (!(await uiConfirm(`You are on the voice stage in "${activeVoiceStageThread}". Leave it and join "${targetThread}" instead?`, { title: 'Switch voice stage?', confirmText: 'Switch' }))) {
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
                message: `Voice Stage is now ${payload.mode === 'invite_only' ? 'Invite Only' : 'Open to Everyone'} (by @${payload.moderatorUsername || 'Mod'}).`,
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
            .ilike('username', likeExact(cleanUser))
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
        }]).then(null, () => {});


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


    const pc = new RTCPeerConnection({ iceServers: getIceServers() });


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
            <div id="voice-participant-${escapeHTML(p.user_id)}" class="voice-participant-card ${isSpeaking ? 'is-speaking' : ''}" data-userid="${escapeHTML(p.user_id)}">
                ${showModActions ? `
                    <div style="position: absolute; top: 4px; right: 4px; display: flex; gap: 2px; z-index: 10;">
                        <button type="button" class="voice-card-mute-btn" data-userid="${escapeHTML(p.user_id)}" data-username="${escapeHTML(p.username || 'User')}" title="Mute Participant" style="background: rgba(30,41,59,0.8); border: 1px solid #334155; border-radius: 4px; color: #f87171; font-size: 0.72rem; padding: 2px 5px; cursor: pointer;">🔇</button>
                        <button type="button" class="voice-card-kick-btn" data-userid="${escapeHTML(p.user_id)}" data-username="${escapeHTML(p.username || 'User')}" title="Kick from Stage" style="background: rgba(30,41,59,0.8); border: 1px solid #334155; border-radius: 4px; color: #ef4444; font-size: 0.72rem; padding: 2px 5px; cursor: pointer;">👢</button>
                    </div>
                ` : ''}
                <div class="voice-participant-avatar-wrap">
                    <img src="${attrUrl(p.avatar_url, DEFAULT_AVATAR)}" class="voice-participant-avatar" alt="${escapeHTML(p.username || 'User')}">
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
    loadAudioSettings();
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
// ---------------------------------------------------------------------------------------------------------
// FOUNDER RED PEARLS: open enrollment for the first 1,000 members (founder.sql).
// Guests see a fish bowl of pearls; popping one reserves a one-time key (PEARL-XXXX-XXXX) and writes it into the
// sign-up form. Pearls left = 1000 - members - keys reserved but not yet used, so it starts at 991 with 9 members
// and falls as people join. When it reaches 0 the bowl stops appearing and normal invite codes are required.
// ---------------------------------------------------------------------------------------------------------
const FOUNDER_CAP = 1000;
const FOUNDER_KEY_RE = /^PEARL-[0-9A-F]{4}-[0-9A-F]{4}$/;
const FOUNDER_STORE_KEY = 'tg_founder_pearl';
const FOUNDER_DISMISS_KEY = 'tg_founder_dismissed_session';
const FOUNDER_HOLD_MS = 55 * 60 * 1000; // a key is reserved for 60 minutes server-side; stop showing it a little earlier
const FOUNDER_POLL_MS = 15000;
let founderStatus = null;   // { remaining, members } once the database has answered, else null (feature stays hidden)
let founderBusy = false;
let founderPollTimer = null;
let founderShownCount = null;
const founderPopped = new Set();

const authInviteInput = () => document.getElementById('auth-invite-code');
const fEl = (id) => document.getElementById(id);
const founderReducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const founderRemaining = () => (founderStatus ? founderStatus.remaining : 0);

function readFounderPearl() {
    try {
        const v = JSON.parse(localStorage.getItem(FOUNDER_STORE_KEY) || 'null');
        if (v && FOUNDER_KEY_RE.test(String(v.code)) && Date.now() - Number(v.ts) < FOUNDER_HOLD_MS) return v;
        if (v) localStorage.removeItem(FOUNDER_STORE_KEY);
    } catch (e) { /* storage unavailable */ }
    return null;
}
function saveFounderPearl(code) {
    try { localStorage.setItem(FOUNDER_STORE_KEY, JSON.stringify({ code, ts: Date.now() })); } catch (e) { /* storage unavailable */ }
}
function clearFounderPearl() {
    try { localStorage.removeItem(FOUNDER_STORE_KEY); } catch (e) { /* storage unavailable */ }
}

// Pearl positions for a full bowl (bottom rows first). Drawing only the ones below the "water line" makes the pile
// shrink as pearls are claimed. Seeded so the layout never jumps between renders.
const FOUNDER_LAYOUT = (() => {
    const cx = 160, cy = 178, R = 118, r = 8.5, top = 98, bottom = 292;
    let seed = 1337;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const out = [];
    let row = 0;
    for (let y = bottom - r; y >= top; y -= 15, row++) {
        for (let x = cx - R; x <= cx + R; x += 17) {
            const px = x + (row % 2 ? 8.5 : 0) + (rnd() - 0.5) * 2.4;
            const py = y + (rnd() - 0.5) * 2.4;
            if (Math.hypot(px - cx, py - cy) <= R - r - 2.5) {
                out.push({ x: px, y: py, g: ['fp-a', 'fp-b', 'fp-c'][Math.floor(rnd() * 3)], glint: rnd() < 0.09 });
            }
        }
    }
    return out;
})();
const SVG_NS = 'http://www.w3.org/2000/svg';
const svgCircle = (cx, cy, r, fill) => {
    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', cx.toFixed(1)); c.setAttribute('cy', cy.toFixed(1)); c.setAttribute('r', r); c.setAttribute('fill', fill);
    return c;
};

function renderFounderPearls() {
    const g = fEl('founder-pearls');
    if (!g) return;
    const remaining = Math.max(0, Math.min(FOUNDER_CAP, founderRemaining()));
    // 0 pearls left = empty bowl; otherwise the pile's height follows the share that is left
    const fill = remaining <= 0 ? 0 : 0.1 + 0.9 * (remaining / FOUNDER_CAP);
    const surface = 292 - fill * (292 - 98);
    g.textContent = '';
    FOUNDER_LAYOUT.forEach((p, i) => {
        if (p.y < surface || founderPopped.has(i)) return;
        const c = svgCircle(p.x, p.y, 8.5, `url(#${p.g})`);
        c.setAttribute('class', p.glint ? 'pearl glint' : 'pearl');
        if (p.glint) c.style.animationDelay = (i % 7) * 0.45 + 's';
        c.dataset.i = i;
        g.appendChild(c);
    });
}

function paintFounderCount(animate = true) {
    const countEl = fEl('founder-count');
    const target = Math.max(0, founderRemaining());
    if (countEl) {
        const from = founderShownCount == null ? target : founderShownCount;
        founderShownCount = target;
        if (!animate || from === target || founderReducedMotion()) countEl.textContent = target.toLocaleString();
        else {
            const t0 = performance.now(), dur = 500;
            const step = (now) => {
                const k = Math.min(1, (now - t0) / dur);
                countEl.textContent = Math.round(from + (target - from) * k).toLocaleString();
                if (k < 1 && founderShownCount === target) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }
    }
    const fillEl = fEl('founder-meter-fill');
    if (fillEl) fillEl.style.width = (Math.max(0, Math.min(1, target / FOUNDER_CAP)) * 100).toFixed(1) + '%';
}

// Reflect the current state in the modal, the sign-up panel ribbon and the "all claimed" note.
function paintFounder() {
    const open = founderStatus && founderRemaining() > 0;
    const held = readFounderPearl();
    paintFounderCount();
    renderFounderPearls();

    const box = fEl('founder-box');
    if (box) box.classList.toggle('is-closed', !open);
    const label = fEl('founder-count-label');
    if (label) label.textContent = open ? 'of 1,000 pearls left' : 'pearls left. All 1,000 are claimed!';
    const explainer = fEl('founder-explainer');
    if (explainer) {
        if (!explainer.dataset.open) explainer.dataset.open = explainer.innerHTML;
        explainer.innerHTML = open
            ? explainer.dataset.open
            : '<strong>How to join now:</strong> Turing\'s Gate is <strong>invite-only</strong>. Ask someone who is already inside for a Red Pearl code, then enter it on the sign-up form. Every member gets Red Pearls of their own to share.';
    }
    const title = fEl('founder-title'), sub = fEl('founder-sub'), hint = fEl('founder-hint');
    if (title) title.textContent = open ? 'Claim your Founder Red Pearl' : 'The founder pearls are all claimed';
    if (sub) sub.textContent = open
        ? "Turing's Gate is opening to its first 1,000 humans with no invite needed. Pop a pearl to get your Red Pearl code."
        : "Thank you to everyone who joined the first 1,000. Turing's Gate is now invite-only.";
    if (hint) hint.classList.toggle('hidden', !open);
    const bowl = fEl('founder-bowl');
    if (bowl) bowl.disabled = !open && !held;

    const ribbon = fEl('founder-ribbon'), ribbonText = fEl('founder-ribbon-text'), closedNote = fEl('founder-closed-note');
    const guest = !currentUser;
    if (ribbon && ribbonText) {
        const showRibbon = guest && (open || held);
        ribbon.classList.toggle('hidden', !showRibbon);
        ribbonText.innerHTML = held
            ? 'Your Red Pearl code is ready: finish signing up below'
            : `Claim a Founder Red Pearl <b>${Math.max(0, founderRemaining()).toLocaleString()}</b> of 1,000 left`;
    }
    if (closedNote) closedNote.classList.toggle('hidden', !(guest && founderStatus && !open && !held));
}

async function refreshFounder() {
    if (!db) return null;
    try {
        const { data, error } = await db.rpc('founder_status');
        if (error) throw error;
        const d = Array.isArray(data) ? data[0] : data;
        if (d && Number.isFinite(Number(d.remaining))) {
            founderStatus = { remaining: Math.max(0, Number(d.remaining)), members: Number(d.members) || 0 };
            paintFounder();
            return founderStatus;
        }
    } catch (e) {
        if (!isMissingFunctionError(e)) console.warn("Founder pearl status notice:", e);
    }
    return founderStatus;
}

function startFounderPolling() {
    if (founderPollTimer) return;
    founderPollTimer = setInterval(() => {
        if (document.hidden || currentUser) return;
        refreshFounder();
    }, FOUNDER_POLL_MS);
}
function stopFounderPolling() {
    if (founderPollTimer) clearInterval(founderPollTimer);
    founderPollTimer = null;
}

function founderModalOpen() {
    const m = fEl('founder-modal');
    return Boolean(m && !m.classList.contains('hidden'));
}

function openFounderModal() {
    const m = fEl('founder-modal');
    if (!m || currentUser) return;
    const held = readFounderPearl();
    fEl('founder-result').classList.toggle('hidden', !held);
    if (held) fEl('founder-code').textContent = held.code;
    setFounderStatusText('');
    paintFounder();
    m.classList.remove('hidden');
    startFounderPolling();
}

function closeFounderModal(dismiss = true) {
    const m = fEl('founder-modal');
    if (m) m.classList.add('hidden');
    if (dismiss) { try { sessionStorage.setItem(FOUNDER_DISMISS_KEY, 'true'); } catch (e) { /* storage unavailable */ } }
}

function setFounderStatusText(text) {
    const el = fEl('founder-status');
    if (el) el.textContent = text || '';
}

// Put the key into the sign-up form and switch it to sign-up mode, so closing the bowl leaves a ready-to-submit form.
function applyFounderCode(code) {
    setSignUpMode(true);
    const input = authInviteInput();
    if (input) input.value = code;
    const wrap = document.getElementById('auth-panel-wrapper');
    if (wrap) wrap.classList.remove('hidden');
    paintFounder();
}

function burstFounder(x, y) {
    const fx = fEl('founder-fx');
    if (!fx) return;
    for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
        const d = 26 + Math.random() * 30;
        const c = svgCircle(x, y, 2.2 + Math.random() * 2, i % 3 ? '#fb7185' : '#ffe4e6');
        fx.appendChild(c);
        const anim = c.animate(
            [{ transform: 'translate(0px,0px) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(.2)`, opacity: 0 }],
            { duration: 560, easing: 'cubic-bezier(.1,.7,.3,1)' }
        );
        anim.onfinish = () => c.remove();
    }
}

// Lifts one pearl from the top of the pile, swells it, then bursts it. `done` runs when the animation is over.
function animateFounderPop(done) {
    const g = fEl('founder-pearls'), fx = fEl('founder-fx');
    const nodes = g ? [...g.children] : [];
    if (!nodes.length || !fx) { done(); return; }
    nodes.sort((a, b) => Number(a.getAttribute('cy')) - Number(b.getAttribute('cy')));
    const el = nodes[Math.floor(Math.random() * Math.min(12, nodes.length))];
    const cx = Number(el.getAttribute('cx')), cy = Number(el.getAttribute('cy'));
    founderPopped.add(Number(el.dataset.i));
    const fly = svgCircle(cx, cy, 8.5, el.getAttribute('fill'));
    fly.style.transformBox = 'fill-box';
    fly.style.transformOrigin = 'center';
    el.remove();
    fx.appendChild(fly);
    const endX = cx + (160 - cx) * 0.4, endY = cy - 66;
    if (founderReducedMotion() || !fly.animate) {
        fly.remove(); burstFounder(endX, endY); done(); return;
    }
    const dx = (160 - cx) * 0.4;
    const anim = fly.animate([
        { transform: 'translate(0px,0px) scale(1)', filter: 'brightness(1)' },
        { transform: `translate(${dx}px,-52px) scale(3.1)`, filter: 'brightness(1.5)', offset: 0.45 },
        { transform: `translate(${dx}px,-60px) scale(3.5)`, filter: 'brightness(1.9)', offset: 0.75 },
        { transform: `translate(${dx}px,-66px) scale(0.2)`, filter: 'brightness(2.2)', opacity: 0 }
    ], { duration: 640, easing: 'ease-out' });
    anim.onfinish = () => { burstFounder(endX, endY); fly.remove(); done(); };
}

function showFounderTicket(code) {
    fEl('founder-code').textContent = code;
    fEl('founder-result').classList.remove('hidden');
    const use = fEl('founder-use-btn');
    if (use) setTimeout(() => use.scrollIntoView({ block: 'nearest', behavior: founderReducedMotion() ? 'auto' : 'smooth' }), 80);
}

async function popFounderPearl() {
    if (founderBusy || currentUser || !db) return;
    const bowl = fEl('founder-bowl');

    // Already holding a key: show it again instead of taking another pearl.
    const held = readFounderPearl();
    if (held) {
        applyFounderCode(held.code);
        showFounderTicket(held.code);
        setFounderStatusText('This Red Pearl code is already yours. It is filled in on the sign-up form.');
        return;
    }
    if (founderRemaining() <= 0) return;

    founderBusy = true;
    setFounderStatusText('');
    if (bowl) { bowl.classList.remove('is-wobble'); void bowl.offsetWidth; bowl.classList.add('is-wobble'); }
    let res = null;
    try {
        const { data, error } = await db.rpc('issue_founder_pearl');
        if (error) throw error;
        res = Array.isArray(data) ? data[0] : data;
    } catch (e) {
        res = { error: isMissingFunctionError(e) ? 'unavailable' : 'failed' };
    }

    if (res && res.code && FOUNDER_KEY_RE.test(String(res.code))) {
        saveFounderPearl(res.code);
        if (founderStatus) founderStatus.remaining = Math.max(0, Number(res.remaining));
        hapticTap('medium');
        try { playTechChirp('pop'); } catch (e) { /* audio blocked */ }
        animateFounderPop(() => {
            paintFounderCount();
            applyFounderCode(res.code);
            showFounderTicket(res.code);
            setFounderStatusText('Your Red Pearl code is filled in on the sign-up form. Finish signing up within an hour.');
            founderBusy = false;
        });
        return;
    }

    founderBusy = false;
    const err = res && res.error;
    if (err === 'sold_out') {
        await refreshFounder();
        if (founderStatus) founderStatus.remaining = 0;
        paintFounder();
        setFounderStatusText('Someone just took the last pearl. The founder window is now closed.');
    } else if (err === 'rate_limited') {
        setFounderStatusText("You've popped a few pearls already. Please try again in a little while.");
    } else if (err === 'unavailable') {
        setFounderStatusText('Founder pearls are not available right now. If you have a Red Pearl code, enter it on the sign-up form.');
    } else {
        setFounderStatusText("Couldn't reach the bowl. Check your connection and tap it again.");
    }
}

// Decide whether the bowl is the welcome screen. Resolves true when the founder flow "owns" the guest welcome.
async function founderWelcome() {
    for (let i = 0; i < 40 && !hasBooted; i++) await new Promise(r => setTimeout(r, 150)); // wait for the session check
    if (currentUser) return true;
    const st = await refreshFounder();
    if (currentUser) return true;
    if (!st || st.remaining <= 0) { paintFounder(); return false; }
    startFounderPolling();
    const held = readFounderPearl();
    if (held) { applyFounderCode(held.code); return true; }
    try {
        if (localStorage.getItem('tg_known_member') === '1') return false; // a returning member logging in doesn't need the pitch
        if (sessionStorage.getItem(FOUNDER_DISMISS_KEY) === 'true') return true;
    } catch (e) { /* storage unavailable */ }
    openFounderModal();
    return true;
}

function onFounderSignedIn() {
    try { localStorage.setItem('tg_known_member', '1'); } catch (e) { /* storage unavailable */ }
    closeFounderModal(false);
    stopFounderPolling();
    const ribbon = fEl('founder-ribbon'), note = fEl('founder-closed-note');
    if (ribbon) ribbon.classList.add('hidden');
    if (note) note.classList.add('hidden');
}

safeAddListener(fEl('founder-bowl'), 'click', popFounderPearl);
safeAddListener(fEl('founder-close-btn'), 'click', () => closeFounderModal(true));
safeAddListener(fEl('founder-browse'), 'click', () => closeFounderModal(true));
safeAddListener(fEl('founder-modal'), 'click', (e) => { if (e.target === fEl('founder-modal')) closeFounderModal(true); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && founderModalOpen()) closeFounderModal(true); });
safeAddListener(fEl('founder-login'), 'click', () => {
    closeFounderModal(true);
    setSignUpMode(false);
    const wrap = document.getElementById('auth-panel-wrapper');
    if (wrap) { wrap.classList.remove('hidden'); wrap.scrollIntoView({ behavior: 'smooth' }); }
    const email = document.getElementById('auth-email');
    if (email) email.focus({ preventScroll: true });
});
safeAddListener(fEl('founder-have-code'), 'click', () => {
    closeFounderModal(true);
    setSignUpMode(true);
    const wrap = document.getElementById('auth-panel-wrapper');
    if (wrap) { wrap.classList.remove('hidden'); wrap.scrollIntoView({ behavior: 'smooth' }); }
    const input = authInviteInput();
    if (input) input.focus({ preventScroll: true });
});
safeAddListener(fEl('founder-use-btn'), 'click', () => {
    closeFounderModal(true);
    const wrap = document.getElementById('auth-panel-wrapper');
    if (wrap) { wrap.classList.remove('hidden'); wrap.scrollIntoView({ behavior: 'smooth' }); }
    const user = document.getElementById('auth-username');
    if (user) user.focus({ preventScroll: true });
});
safeAddListener(fEl('founder-copy-btn'), 'click', async () => {
    const code = fEl('founder-code').textContent;
    try { await navigator.clipboard.writeText(code); setFounderStatusText('Code copied.'); }
    catch (e) { setFounderStatusText('Copy failed. Press and hold the code to select it.'); }
});
safeAddListener(fEl('founder-ribbon'), 'click', () => {
    if (readFounderPearl()) {
        const user = document.getElementById('auth-username');
        if (user) user.focus();
    } else {
        openFounderModal();
    }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden && !currentUser && founderStatus) refreshFounder(); });

// ---------------------------------------------------------------------------------------------------------
// PRIVACY & SECURITY CENTER: two-factor login, sign-in alerts, "Download my data", disappearing messages.
// ---------------------------------------------------------------------------------------------------------
const mfaEl = (id) => document.getElementById(id);

// Shows the two-factor window and resolves true once onSubmit(code) succeeds, false if the person backs out.
// onSubmit throws an Error to show a message and let them try again.
function openMfaModal({ title, prompt, setup = null, submitText = 'Verify', cancelText = 'Cancel', locked = false, onSubmit }) {
    return new Promise((resolve) => {
        const modal = mfaEl('mfa-modal'), code = mfaEl('mfa-code'), status = mfaEl('mfa-status');
        const submit = mfaEl('mfa-submit'), cancel = mfaEl('mfa-cancel'), closeX = mfaEl('mfa-close');
        if (!modal) { resolve(false); return; }
        mfaEl('mfa-title').textContent = title;
        mfaEl('mfa-prompt').textContent = prompt;
        submit.textContent = submitText;
        cancel.textContent = cancelText;
        status.textContent = '';
        status.classList.remove('ok');
        code.value = '';
        // A sign-in challenge must be answered (or the person signed out), so it ignores outside clicks, Esc and the X.
        modal.toggleAttribute('data-no-backdrop-close', locked);
        closeX.classList.toggle('hidden', locked);
        const setupBox = mfaEl('mfa-setup');
        setupBox.classList.toggle('hidden', !setup);
        if (setup) {
            const qr = String(setup.qr || '');
            if (/^data:image\/svg\+xml/i.test(qr)) mfaEl('mfa-qr').src = qr; else mfaEl('mfa-qr').removeAttribute('src');
            mfaEl('mfa-qr').classList.toggle('hidden', !/^data:image\/svg\+xml/i.test(qr));
            mfaEl('mfa-secret').textContent = setup.secret || '';
        }

        let busy = false, done = false;
        const finish = (result) => {
            if (done) return;
            done = true;
            submit.removeEventListener('click', onGo);
            cancel.removeEventListener('click', onNo);
            closeX.removeEventListener('click', onNo);
            code.removeEventListener('keydown', onKey);
            code.removeEventListener('input', onInput);
            modal.classList.add('hidden');
            mfaEl('mfa-qr').removeAttribute('src');
            mfaEl('mfa-secret').textContent = '';
            code.value = '';
            resolve(result);
        };
        const onNo = () => { if (!busy) finish(false); };
        const onGo = async () => {
            if (busy) return;
            const digits = code.value.replace(/\D/g, '');
            if (digits.length !== 6) { status.textContent = 'Enter the 6-digit code.'; return; }
            busy = true; submit.disabled = true; status.textContent = '';
            try { await onSubmit(digits); busy = false; submit.disabled = false; finish(true); }
            catch (err) {
                busy = false; submit.disabled = false;
                status.textContent = /invalid|expired|incorrect/i.test(err && err.message || '') ? 'That code did not work. Check the app and try the new code.' : ((err && err.message) || 'Something went wrong. Try again.');
                code.select();
            }
        };
        const onKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); onGo(); } };
        const onInput = () => { code.value = code.value.replace(/\D/g, '').slice(0, 6); };
        submit.addEventListener('click', onGo);
        cancel.addEventListener('click', onNo);
        closeX.addEventListener('click', onNo);
        code.addEventListener('keydown', onKey);
        code.addEventListener('input', onInput);
        modal.classList.remove('hidden');
        setTimeout(() => code.focus({ preventScroll: true }), 30);
    });
}

// Called before the app loads for a signed-in member. Returns false when they were signed out instead.
async function ensureMfaVerified(user) {
    if (!db || !db.auth || !db.auth.mfa || !user) return true;
    if (mfaCleared.has(user.id)) return true;
    if (mfaPending) return mfaPending;
    mfaPending = (async () => {
        try {
            let level = null;
            try { level = (await db.auth.mfa.getAuthenticatorAssuranceLevel()).data; } catch (e) { return true; } // cannot tell: never lock anyone out
            if (!level || level.nextLevel !== 'aal2' || level.currentLevel === 'aal2') { mfaCleared.add(user.id); return true; }
            const factors = await db.auth.mfa.listFactors();
            const factor = ((factors.data && factors.data.totp) || [])[0];
            if (!factor) { mfaCleared.add(user.id); return true; }
            const ok = await openMfaModal({
                title: 'Two-factor sign-in',
                prompt: 'Enter the 6-digit code from your authenticator app to finish signing in.',
                submitText: 'Verify', cancelText: 'Sign out', locked: true,
                onSubmit: async (code) => {
                    const r = await db.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
                    if (r.error) throw r.error;
                }
            });
            if (!ok) { await db.auth.signOut(); return false; }
            mfaCleared.add(user.id);
            return true;
        } finally {
            mfaPending = null;
        }
    })();
    return mfaPending;
}

async function getVerifiedTotpFactor() {
    const r = await db.auth.mfa.listFactors();
    return ((r.data && r.data.totp) || []).find(f => f.status === 'verified') || null;
}

async function refreshMfaState() {
    const text = mfaEl('mfa-state-text'), btn = mfaEl('mfa-toggle-btn');
    if (!text || !btn) return;
    if (!db || !db.auth || !db.auth.mfa || !currentUser) { text.textContent = 'Not available right now.'; btn.disabled = true; return; }
    try {
        const factor = await getVerifiedTotpFactor();
        btn.dataset.state = factor ? 'on' : 'off';
        text.textContent = factor
            ? 'On. You enter a code from your authenticator app each time you sign in.'
            : 'Off (optional). You can add a second step so a stolen password is not enough to get in. Nobody is required to use this.';
        btn.textContent = factor ? 'Turn off' : 'Turn on';
        btn.className = factor ? 'danger' : '';
        btn.disabled = false;
    } catch (e) {
        text.textContent = 'Could not check right now.';
        btn.disabled = true;
    }
}

async function enableTwoFactor() {
    const btn = mfaEl('mfa-toggle-btn');
    btn.disabled = true;
    try {
        // clear half-finished setups from earlier attempts
        const all = await db.auth.mfa.listFactors();
        for (const f of ((all.data && all.data.all) || [])) {
            if (f.status === 'unverified') await db.auth.mfa.unenroll({ factorId: f.id });
        }
        const en = await db.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Turing Gate ${new Date().toISOString().slice(0, 10)}` });
        if (en.error) {
            showToast({ title: "Two-factor setup", message: `Could not start: ${en.error.message}. If this keeps happening, two-factor login may not be switched on for this site yet.`, type: "error", icon: "▵", duration: 9000, force: true });
            return;
        }
        const factorId = en.data.id;
        const ok = await openMfaModal({
            title: 'Turn on two-factor',
            prompt: '2. Enter the 6-digit code your authenticator app shows now.',
            setup: { qr: en.data.totp && en.data.totp.qr_code, secret: en.data.totp && en.data.totp.secret },
            submitText: 'Turn on',
            onSubmit: async (code) => {
                const r = await db.auth.mfa.challengeAndVerify({ factorId, code });
                if (r.error) throw r.error;
            }
        });
        if (!ok) { await db.auth.mfa.unenroll({ factorId }).then(null, () => {}); return; }
        if (currentUser) mfaCleared.add(currentUser.id);
        hapticTap('success');
        showToast({ title: "Two-factor is on", message: "Your other devices will ask for a code the next time you open the app.", type: "success", icon: "◈", duration: 7000, force: true });
    } catch (e) {
        showToast({ title: "Two-factor setup", message: (e && e.message) || 'Something went wrong.', type: "error", icon: "▵", duration: 7000, force: true });
    } finally {
        await refreshMfaState();
    }
}

async function disableTwoFactor() {
    const btn = mfaEl('mfa-toggle-btn');
    btn.disabled = true;
    try {
        const factor = await getVerifiedTotpFactor();
        if (!factor) return;
        const ok = await openMfaModal({
            title: 'Turn off two-factor',
            prompt: 'Enter a code from your authenticator app to confirm.',
            submitText: 'Turn off',
            onSubmit: async (code) => {
                const v = await db.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
                if (v.error) throw v.error;
                const u = await db.auth.mfa.unenroll({ factorId: factor.id });
                if (u.error) throw u.error;
            }
        });
        if (ok) showToast({ title: "Two-factor is off", message: "You can turn it back on any time.", type: "info", icon: "◈", duration: 5000, force: true });
    } catch (e) {
        showToast({ title: "Two-factor", message: (e && e.message) || 'Something went wrong.', type: "error", icon: "▵", duration: 7000, force: true });
    } finally {
        await refreshMfaState();
    }
}

safeAddListener(mfaEl('mfa-toggle-btn'), 'click', () => {
    if (mfaEl('mfa-toggle-btn').dataset.state === 'on') disableTwoFactor(); else enableTwoFactor();
});

safeAddListener(mfaEl('signout-others-btn'), 'click', async () => {
    if (!db || !currentUser) return;
    if (!(await uiConfirm("Every other phone, tablet and computer signed in to your account will be signed out. This device stays signed in. A device that was already open can keep working for up to an hour before it is asked to sign in again. If you think someone else has your password, change it too.", { title: 'Sign out other devices?', confirmText: 'Sign them out', danger: true }))) return;
    const { error } = await db.auth.signOut({ scope: 'others' });
    if (error) showToast({ title: "Not signed out", message: error.message, type: "error", icon: "▵", duration: 6000, force: true });
    else showToast({ title: "Other devices signed out", message: "If you think someone else had your password, change it now in Settings > Profile.", type: "success", icon: "◈", duration: 8000, force: true });
});

safeAddListener(mfaEl('privacy-delete-account-btn'), 'click', () => { if (openDeleteModalBtn) openDeleteModalBtn.click(); });

// --- Sign-in alerts: a new password sign-in tells the member's other open devices ---
function deviceLabel() {
    const ua = navigator.userAgent || '';
    if (/TuringsGateApp/.test(ua)) return "Turing's Gate app";
    const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /CrOS/.test(ua) ? 'Chromebook' : /Linux/.test(ua) ? 'Linux' : 'a device';
    const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /(Chrome|CriOS)\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'a browser';
    return `${browser} on ${os}`;
}
function thisDeviceId() {
    try {
        let id = localStorage.getItem('tg_device_id');
        if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()); localStorage.setItem('tg_device_id', id); }
        return id;
    } catch (e) { return 'unknown'; }
}
function announceSignIn() {
    if (!currentUser) return;
    sendSignalOnce(`user_call_sig_${currentUser.id}`, { event: 'security_signin', payload: { label: deviceLabel(), from: thisDeviceId(), at: Date.now() } });
}
function showSigninAlert(data) {
    if (!data || !currentUser || data.from === thisDeviceId()) return;
    const label = String(data.label || 'a new device').replace(/[^A-Za-z0-9 .'()-]/g, '').slice(0, 40) || 'a new device';
    showToast({
        title: "New sign-in to your account",
        message: `Signed in on ${label}. If this was not you, change your password and use Settings > Privacy > Sign out others.`,
        type: "error", icon: "▵", duration: 15000, force: true,
        onClick: () => { if (typeof openSettingsBtn !== 'undefined' && openSettingsBtn) { openSettingsBtn.click(); switchSettingsTab('privacy'); } }
    });
}

// --- Download my data ---
async function collectMyData() {
    const uid = currentUser.id, uname = (currentUsername || '').toLowerCase();
    const out = {
        exported_at: new Date().toISOString(),
        about: "A copy of the data Turing's Gate holds about you. Chats include messages from the other people in them. Reports you filed are kept for moderation and are not included. Photos and videos are linked by address rather than embedded.",
        account: {
            id: uid, email: currentUser.email || null, username: currentUsername,
            created_at: currentUser.created_at || null, last_sign_in_at: currentUser.last_sign_in_at || null
        }
    };
    const ask = async (key, run) => {
        try {
            const r = await run();
            if (r && r.error) throw r.error;
            out[key] = r && 'data' in r ? r.data : r;
        } catch (e) { out[key] = { unavailable: String((e && e.message) || e) }; }
    };
    await ask('profile', () => db.from('profiles').select('*').eq('id', uid).maybeSingle());
    await ask('posts', () => db.from('Posts').select('*').ilike('author', likeExact(uname)).order('id').limit(10000));
    await ask('comments', () => db.from('post_comments').select('*').ilike('author', likeExact(uname)).order('id').limit(10000));
    await ask('friendships', () => db.from('friendships').select('*').or(`user_id.eq.${uid},friend_id.eq.${uid}`).limit(10000));
    await ask('blocked_members', () => db.from('user_blocks').select('*').limit(10000));
    await ask('votes', () => db.from('post_votes').select('*').limit(50000));
    await ask('notifications', () => db.from('user_notifications').select('*').eq('user_id', uid).order('id').limit(10000));
    await ask('thread_flairs', () => db.from('user_thread_flairs').select('*').ilike('username', likeExact(uname)).limit(10000));
    await ask('invites_created', () => db.from('invitations').select('code, status, created_at, claimed_by_username, claimed_at').eq('inviter_id', uid).limit(1000));
    try {
        const mem = await db.from('conversation_members').select('conversation_id').eq('user_id', uid).limit(10000);
        if (mem.error) throw mem.error;
        const ids = (mem.data || []).map(m => m.conversation_id);
        out.conversations = ids.length ? (await db.from('conversations').select('*').in('id', ids)).data || [] : [];
        out.messages_in_my_chats = ids.length ? (await db.from('chat_messages').select('*').in('conversation_id', ids).order('id').limit(50000)).data || [] : [];
    } catch (e) { out.conversations = { unavailable: String((e && e.message) || e) }; }
    const local = {};
    try { Object.keys(localStorage).filter(k => /^(tg_|forum_)/.test(k) && !/founder_pearl|device_id/.test(k)).forEach(k => { local[k] = localStorage.getItem(k); }); } catch (e) { /* storage unavailable */ }
    out.settings_on_this_device = local;
    return out;
}

async function deliverFile(file) {
    const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: "My Turing's Gate data" }); return 'shared'; }
        catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return 'downloaded';
}

safeAddListener(mfaEl('export-data-btn'), 'click', async () => {
    if (!db || !currentUser) return;
    const btn = mfaEl('export-data-btn'), status = mfaEl('export-data-status');
    btn.disabled = true; btn.textContent = 'Preparing...';
    status.textContent = 'Gathering your data. This can take a moment.';
    try {
        const data = await collectMyData();
        const file = new File([JSON.stringify(data, null, 2)], `turings-gate-data-${(currentUsername || 'me').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' });
        const how = await deliverFile(file);
        const count = (v) => Array.isArray(v) ? v.length : 0;
        status.textContent = how === 'cancelled' ? 'Cancelled.' : `Done: ${count(data.posts)} posts, ${count(data.comments)} replies, ${count(data.messages_in_my_chats)} chat messages, ${count(data.friendships)} friend links (${(file.size / 1024).toFixed(0)} KB).`;
        if (how !== 'cancelled') showToast({ title: "Your data is ready", message: how === 'shared' ? "Choose where to save it." : "The file was downloaded.", type: "success", icon: "◈", duration: 5000, force: true });
    } catch (e) {
        status.textContent = 'Could not prepare your data right now. Please try again.';
        console.warn("Data export notice:", e);
    } finally {
        btn.disabled = false; btn.textContent = 'Download my data';
    }
});

function refreshPrivacyCenter() {
    const score = mfaEl('psc-human-score');
    if (score) score.textContent = `${Math.min(5, Math.max(0, Number(suspicionScore) || 0))} / 5`;
    refreshMfaState();
}

// --- Disappearing messages and "clear chat for me" ---
const formatTimer = (secs) => secs === 86400 ? '24 hours' : secs === 604800 ? '7 days' : 'off';

// The database stamps every new message with its own expiry (expires_at). A timer only affects messages sent after it was set.
function isMessageExpiredOrCleared(msg) {
    if (!msg || !msg.created_at) return false;
    const t = Date.parse(msg.created_at);
    if (!Number.isFinite(t)) return false;
    if (chatPrivacy.clearedAt && t <= Date.parse(chatPrivacy.clearedAt)) return true;
    const exp = msg.expires_at ? Date.parse(msg.expires_at) : NaN;
    return Number.isFinite(exp) && exp <= Date.now();
}

function updateChatPrivacyUI() {
    const banner = mfaEl('chat-privacy-banner'), opts = mfaEl('chat-options-btn');
    if (opts) opts.classList.toggle('hidden', !activeConversationId);
    if (banner) {
        banner.classList.toggle('hidden', !(chatPrivacy.timer > 0));
        banner.textContent = chatPrivacy.timer > 0 ? `⏱ New messages in this chat disappear after ${formatTimer(chatPrivacy.timer)}. Earlier messages stay. Photos are turned off while this is on.` : '';
    }
    const label = document.querySelector('.upload-photo-label');
    if (label) {
        label.style.opacity = chatPrivacy.timer > 0 ? '0.4' : '';
        label.style.pointerEvents = chatPrivacy.timer > 0 ? 'none' : '';
    }
    if (dmImageInput) dmImageInput.disabled = chatPrivacy.timer > 0 || !activeConversationId;
}

async function loadChatPrivacy(convId) {
    chatPrivacy = { timer: 0, clearedAt: null };
    if (!db || !currentUser || !convId) { updateChatPrivacyUI(); return; }
    try {
        const [c, m] = await Promise.all([
            db.from('conversations').select('disappear_after').eq('id', convId).maybeSingle(),
            db.from('conversation_members').select('cleared_at').eq('conversation_id', convId).eq('user_id', currentUser.id).maybeSingle()
        ]);
        if (convId !== activeConversationId) return; // the person opened another chat meanwhile
        if (!c.error && c.data) chatPrivacy.timer = Number(c.data.disappear_after) || 0;
        if (!m.error && m.data) chatPrivacy.clearedAt = m.data.cleared_at || null;
    } catch (e) { /* the privacy columns are not installed yet: the feature stays off */ }
    updateChatPrivacyUI();
    db.rpc('purge_expired_messages').then(null, () => {});
}

safeAddListener(mfaEl('chat-options-btn'), 'click', async () => {
    if (!activeConversationId || !db) return;
    const choice = await uiChoose('', [
        { value: 'timer', label: `⏱ Disappearing messages (${formatTimer(chatPrivacy.timer)})` },
        { value: 'clear', label: '🧹 Clear this chat for me' }
    ], { title: 'Chat options' });
    const convId = activeConversationId;
    if (choice === 'timer') {
        const pick = await uiChoose('Messages sent from now on are deleted for everyone in this chat once they are older than the timer. Earlier messages are not affected. Photos cannot be sent while a timer is on.', [
            { value: 0, label: 'Off', current: chatPrivacy.timer === 0 },
            { value: 86400, label: '24 hours', current: chatPrivacy.timer === 86400 },
            { value: 604800, label: '7 days', current: chatPrivacy.timer === 604800 }
        ], { title: 'Disappearing messages' });
        if (pick === null || pick === chatPrivacy.timer) return;
        const { error } = await db.rpc('set_conversation_disappearing', { p_conversation_id: String(convId), p_seconds: pick });
        if (error) {
            showToast({ title: "Timer not changed", message: isMissingFunctionError(error) ? "This needs a database update that has not been installed yet." : error.message, type: "error", icon: "▵", duration: 6000, force: true });
            return;
        }
        chatPrivacy.timer = pick;
        updateChatPrivacyUI();
        // tell everyone in the chat, so nobody is surprised
        try {
            await sendMessageToConversation({
                convId, partnerId: activeConversationPartnerId, isFriend: activeConversationIsFriend,
                text: pick ? `⏱ ${currentUsername} turned on disappearing messages: new messages disappear after ${formatTimer(pick)}.` : `⏱ ${currentUsername} turned off disappearing messages for new messages.`
            });
        } catch (e) { /* the timer is set even if the notice could not be sent */ }
        loadMessages(true);
    } else if (choice === 'clear') {
        if (!(await uiConfirm("This hides the chat history for you. The messages are permanently deleted once everyone in the chat has cleared it.", { title: 'Clear this chat?', confirmText: 'Clear for me', danger: true }))) return;
        const { error } = await db.rpc('clear_conversation_for_me', { p_conversation_id: String(convId) });
        if (error) {
            showToast({ title: "Chat not cleared", message: isMissingFunctionError(error) ? "This needs a database update that has not been installed yet." : error.message, type: "error", icon: "▵", duration: 6000, force: true });
            return;
        }
        chatPrivacy.clearedAt = new Date().toISOString();
        loadMessages(true);
        showToast({ title: "Chat cleared", message: "The history is hidden for you.", type: "success", icon: "◈", duration: 4000, force: true });
    }
});

// Remove messages from the open chat as they expire, and keep the server tidy while the chat is open.
setInterval(() => {
    if (!activeConversationId || !chatMessages) return;
    const now = Date.now();
    chatMessages.querySelectorAll('.msg-row[data-expires]').forEach(row => { if (Date.parse(row.dataset.expires) <= now) row.remove(); });
}, 30000);
setInterval(() => { if (activeConversationId && db && !document.hidden) db.rpc('purge_expired_messages').then(null, () => {}); }, 300000);

// ---------------------------------------------------------------------------------------------------------
// CLICK / TAP OUTSIDE A WINDOW TO CLOSE IT (and Esc on a keyboard). Works for every overlay in the app by pressing the
// window's own close button, so each one still runs its usual clean-up. Windows that need an answer (the suspension
// notice, the in-app confirm box) opt out with data-no-backdrop-close.
// ---------------------------------------------------------------------------------------------------------
const isOverlayEl = (el) => Boolean(el && el.classList && (el.classList.contains('modal-overlay') || el.classList.contains('fab-modal-overlay')));
let overlayPressTarget = null;

function dismissOverlay(ov) {
    if (!isOverlayEl(ov) || ov.classList.contains('hidden') || ov.hasAttribute('data-no-backdrop-close')) return false;
    const closer = ov.querySelector('.close-btn, [data-close]');
    if (closer) closer.click();
    // Safety net: a window whose close button does nothing (or has no close button) is still hidden.
    if (!ov.classList.contains('hidden')) { ov.classList.remove('active'); ov.classList.add('hidden'); }
    return true;
}

document.addEventListener('pointerdown', (e) => { overlayPressTarget = isOverlayEl(e.target) ? e.target : null; }, true);
// A drag that starts inside a window and ends on the backdrop makes the browser fire a click on the backdrop itself.
// Several windows have their own "click the backdrop to close" handlers that would wrongly react to it, so swallow it
// before it reaches them.
document.addEventListener('click', (e) => {
    if (isOverlayEl(e.target) && overlayPressTarget !== e.target) e.stopImmediatePropagation();
}, true);
document.addEventListener('click', (e) => {
    const ov = e.target;
    // Only a press that STARTED on the backdrop counts, so dragging a text selection out of a window never closes it.
    if (!isOverlayEl(ov) || overlayPressTarget !== ov) return;
    overlayPressTarget = null;
    dismissOverlay(ov);
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const open = [...document.querySelectorAll('.modal-overlay, .fab-modal-overlay')]
        .filter(o => !o.classList.contains('hidden') && !o.hasAttribute('data-no-backdrop-close'));
    if (!open.length) return;
    const z = (o) => parseInt(getComputedStyle(o).zIndex, 10) || 0;
    const top = open.reduce((best, o) => (z(o) >= z(best) ? o : best), open[0]);
    e.preventDefault();
    e.stopImmediatePropagation();
    dismissOverlay(top);
}, true);

function triggerGuestDisclaimer() {
    // If logged in, do not show
    if (currentUser) return;

    // While founder pearls remain, the founder bowl is the welcome screen; the classic notice only appears afterwards.
    founderWelcome().then((handled) => { if (!handled) showGuestDisclaimerNotice(); }, () => showGuestDisclaimerNotice());
}

function showGuestDisclaimerNotice() {
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


async function openVoiceStageInsideLiveChat(threadName) {
    const targetThread = threadName || activeThread || 'General';


    if (voiceStageIsConnected && activeVoiceStageThread !== targetThread) {
        if (!(await uiConfirm(`You are on the voice stage in "${activeVoiceStageThread}". Disconnect and switch to "${targetThread}"?`, { title: 'Switch voice stage?', confirmText: 'Switch' }))) {
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
    if (!canSetThreadBanner()) { denyBannerChange(); return; }
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
    const input = await uiPrompt('Shown next to your name in this thread. Leave it blank to remove it.', { title: `Set your flair for "${activeThread}"`, value: currentFlair, maxLength: 18, placeholder: 'e.g. Night Owl', confirmText: 'Save' });
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
        // Phones don't need a retina-sized backing store for soft background art.
        dpr = Math.min(window.devicePixelRatio || 1, width < 640 ? 1.5 : 2);

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();

    // ---------------------------------------------------------------------
    // Koi varieties, shared sprites and colour helpers
    // ---------------------------------------------------------------------
    const RIPPLE_TAU = 1.7;

    const KOI_VARIETIES = [
        {   // Pearl-white with a red head cap and flame patches
            name: 'kohaku',
            base: ['#eaf7ff', '#cfe9fa', '#a9d3ec'],
            patches: ['#ff5b40', '#ff7449'],
            cap: '#ff4d38',
            patchCount: [2, 3],
            patchAlpha: 0.92,
            ridge: 0.14,
            scales: 'rgba(120, 170, 205, 0.20)',
            shimmer: 0.09,
            fin: '226, 243, 255',
            rim: '190, 240, 255',
            eye: '#d9a441'
        },
        {   // Pearl-white with red and sumi (black) markings
            name: 'sanke',
            base: ['#e6f4ff', '#c6e3f6', '#9cc8e4'],
            patches: ['#f8472f', '#ff6040'],
            dark: '#101c30',
            patchCount: [2, 3],
            patchAlpha: 0.90,
            ridge: 0.12,
            scales: 'rgba(110, 160, 200, 0.20)',
            shimmer: 0.08,
            fin: '220, 240, 255',
            rim: '180, 236, 255',
            eye: '#d9a441'
        },
        {   // Metallic gold
            name: 'ogon',
            base: ['#f9dc8b', '#e0ad43', '#a8741f'],
            patches: ['#fff0bd'],
            patchCount: [1, 2],
            patchAlpha: 0.38,
            ridge: 0.26,
            scales: 'rgba(255, 244, 200, 0.28)',
            shimmer: 0.20,
            fin: '255, 226, 150',
            rim: '255, 232, 160',
            eye: '#8a5a12'
        },
        {   // Deep indigo with red and pearl markings
            name: 'showa',
            base: ['#22375a', '#16274a', '#0d1a33'],
            patches: ['#ff5340', '#f2e8ea'],
            cap: '#f6efef',
            patchCount: [2, 3],
            patchAlpha: 0.90,
            ridge: 0.10,
            scales: 'rgba(130, 175, 220, 0.20)',
            shimmer: 0.11,
            fin: '170, 205, 240',
            rim: '150, 215, 255',
            eye: '#e0b050'
        },
        {   // Blue-grey, reticulated, with orange cheeks and flanks
            name: 'asagi',
            base: ['#86abcc', '#5f88b0', '#436b92'],
            patches: ['#f38d4c', '#f6a05a'],
            patchCount: [2, 2],
            patchAlpha: 0.70,
            ridge: 0.16,
            scales: 'rgba(20, 45, 80, 0.34)',
            shimmer: 0.12,
            fin: '190, 220, 245',
            rim: '170, 228, 255',
            eye: '#e0b050'
        },
        {   // The original bioluminescent look: dark body, cyan glow
            name: 'ghost',
            base: ['#0c3052', '#082440', '#041424'],
            patches: ['#2fc6f0', '#38bdf8'],
            patchCount: [3, 4],
            patchAlpha: 0.30,
            ridge: 0.10,
            scales: 'rgba(90, 210, 255, 0.20)',
            shimmer: 0.22,
            fin: '0, 240, 255',
            rim: '70, 215, 255',
            eye: '#ff2a60'
        }
    ];

    const makeSoftSprite = (r, g, b) => {
        const sprite = document.createElement('canvas');
        sprite.width = sprite.height = 64;

        const sctx = sprite.getContext('2d');
        const gradient = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.85)`);
        gradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.30)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        sctx.fillStyle = gradient;
        sctx.fillRect(0, 0, 64, 64);

        return sprite;
    };

    const slickSprite = makeSoftSprite(130, 215, 255);
    const glowSprite = makeSoftSprite(90, 190, 255);

    // Ripple colours are quantised so frames reuse the same strings.
    const rippleColors = [];
    const rippleColor = (alpha) => {
        const q = clamp(Math.round(alpha * 60), 0, 60);
        return rippleColors[q] ||
            (rippleColors[q] = `rgba(150, 226, 255, ${(q / 60).toFixed(3)})`);
    };

    class TrueKoi {
        constructor(w, h, scale = 1.0, variety = KOI_VARIETIES[0], depth = 1) {
            this.w = w;
            this.h = h;
            this.scale = scale;
            this.variety = variety;
            this.depth = depth;

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
                4.7 * scale,
                6.2 * scale,
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

            // Surface ripples shed by the tail, tail root and snout.
            this.ripples = [];
            this.lastStroke = null;
            this.microClock = Math.random() * 0.4;
            this.bowClock = Math.random() * 0.9;

            // Per-frame body frames (perpendicular vectors) and a scratch
            // object so drawing does not allocate.
            this.frames = [];
            for (let i = 0; i < this.numVertebrae; i++) {
                this.frames.push({ px: 0, py: 0 });
            }
            this.scratch = { x: 0, y: 0, px: 0, py: 0, w: 0 };

            this.patches = this.makePatches();
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

        // ---------------------------------------------------------------------
        // Wake: a real swimming fish leaves (a) a vortex street shed at each
        // tail stroke reversal, (b) small ripples from the tail root and
        // snout, and (c) a faint bow-wave "V". In the water's own frame these
        // are expanding, fading surface rings that stay where they were made
        // and slowly drift away from the fish, so the trail reads as a string
        // of ripples that grow and dissolve instead of glowing ropes.
        // ---------------------------------------------------------------------
        addRipple(x, y, opts) {
            const gaps = [];
            const arcs = 2 + ((Math.random() * 2) | 0);
            for (let i = 0; i < arcs; i++) {
                gaps.push({
                    start: Math.random() * TAU,
                    sweep: 1.5 + Math.random() * 2.7
                });
            }

            this.ripples.push({
                x,
                y,
                age: 0,
                life: opts.life,
                r0: opts.r0 * this.scale,
                grow: opts.grow * this.scale,
                strength: opts.strength,
                rings: opts.rings,
                spacing: opts.spacing * this.scale,
                driftX: opts.driftX || 0,
                driftY: opts.driftY || 0,
                slick: Boolean(opts.slick),
                spin: (Math.random() - 0.5) * 0.35,
                gaps
            });

            // Hard cap keeps worst-case cost bounded on slow devices.
            if (this.ripples.length > 28) {
                this.ripples.shift();
            }
        }

        updateWake(dt) {
            const last = this.numVertebrae - 1;
            const tail = this.spine[last];
            const beforeTail = this.spine[last - 1];

            // Direction pointing away from the fish along the tail.
            let backX = tail.x - beforeTail.x;
            let backY = tail.y - beforeTail.y;
            const backLen = Math.hypot(backX, backY) || 1;
            backX /= backLen;
            backY /= backLen;

            // Vortices are shed every time the caudal fin reverses direction.
            const stroke = Math.floor(
                (this.swimPhase - 2.25 - Math.PI * 0.5) / Math.PI
            );

            if (this.lastStroke === null) {
                this.lastStroke = stroke;
            } else if (stroke !== this.lastStroke) {
                this.lastStroke = stroke;

                const side = (stroke & 1) ? 1 : -1;
                const geometry = this.getTailGeometry();
                const tip = geometry.points[side > 0 ? 12 : 2];
                const effort = 0.75 + 0.5 * this.burst;

                this.addRipple(tip.x, tip.y, {
                    life: 5.2,
                    r0: 3.2,
                    grow: 15 * effort,
                    strength: 0.95 * effort,
                    rings: 3,
                    spacing: 5.4,
                    slick: true,
                    // The vortex pair throws a weak jet backwards and outward.
                    driftX: backX * this.speed * 0.11 +
                        geometry.sideX * side * 3.2 * this.scale,
                    driftY: backY * this.speed * 0.11 +
                        geometry.sideY * side * 3.2 * this.scale
                });
            }

            this.microClock += dt;
            if (this.microClock >= 0.46) {
                this.microClock = 0;

                this.addRipple(
                    this.spine[this.tailBaseIndex].x,
                    this.spine[this.tailBaseIndex].y,
                    {
                        life: 3.1,
                        r0: 1.6,
                        grow: 8.5,
                        strength: 0.50,
                        rings: 2,
                        spacing: 3.8,
                        driftX: backX * this.speed * 0.05,
                        driftY: backY * this.speed * 0.05
                    }
                );
            }

            this.bowClock += dt;
            if (this.bowClock >= 0.95) {
                this.bowClock = 0;

                this.addRipple(
                    this.spine[0].x,
                    this.spine[0].y,
                    {
                        life: 2.6,
                        r0: 1.4,
                        grow: 7.5,
                        strength: 0.36,
                        rings: 2,
                        spacing: 3.4
                    }
                );
            }

            const slow = Math.exp(-0.75 * dt);
            let kept = 0;

            for (let i = 0; i < this.ripples.length; i++) {
                const ripple = this.ripples[i];

                ripple.age += dt;
                if (ripple.age >= ripple.life) continue;

                ripple.x += ripple.driftX * dt;
                ripple.y += ripple.driftY * dt;
                ripple.driftX *= slow;
                ripple.driftY *= slow;

                this.ripples[kept++] = ripple;
            }

            this.ripples.length = kept;
        }

        drawWake(ctx) {
            if (this.ripples.length === 0) return;

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';

            for (const ripple of this.ripples) {
                const t = ripple.age / ripple.life;

                const fade =
                    Math.pow(1 - t, 1.7) *
                    smoothstep(0, 0.10, t) *
                    ripple.strength *
                    this.depth;

                if (fade < 0.004) continue;

                // Fast initial expansion that settles as energy is lost.
                const radius =
                    ripple.r0 +
                    ripple.grow *
                    RIPPLE_TAU *
                    (1 - Math.exp(-ripple.age / RIPPLE_TAU));

                if (ripple.slick) {
                    // Turbulent, glassy patch where the vortex pair formed.
                    const size = radius * 2.7;

                    ctx.globalAlpha = clamp(fade * 0.30, 0, 1);
                    ctx.drawImage(
                        slickSprite,
                        ripple.x - size / 2,
                        ripple.y - size / 2,
                        size,
                        size
                    );
                    ctx.globalAlpha = 1;
                }

                for (let ring = 0; ring < ripple.rings; ring++) {
                    // Rings spread apart as the packet disperses.
                    const ringRadius =
                        radius -
                        ring *
                        ripple.spacing *
                        (0.65 + 0.35 * Math.min(1, ripple.age * 0.8));

                    if (ringRadius < 1.2) continue;

                    const alpha = fade * (1 - ring * 0.30);

                    ctx.strokeStyle = rippleColor(alpha * 0.34);
                    ctx.lineWidth =
                        Math.max(0.5, (1.25 - ring * 0.24) * this.scale);

                    ctx.beginPath();

                    for (const gap of ripple.gaps) {
                        const start = gap.start + ripple.spin * ripple.age;

                        ctx.moveTo(
                            ripple.x + Math.cos(start) * ringRadius,
                            ripple.y + Math.sin(start) * ringRadius
                        );

                        ctx.arc(
                            ripple.x,
                            ripple.y,
                            ringRadius,
                            start,
                            start + gap.sweep * (1 - ring * 0.12)
                        );
                    }

                    ctx.stroke();
                }
            }

            // Bow wave: two short arms trailing from the head.
            const head = this.spine[0];
            const neck = this.spine[2];
            const headAngle = Math.atan2(head.y - neck.y, head.x - neck.x);
            const armLength = (14 + this.speed * 0.5) * this.scale;
            const kelvin = 0.34;

            ctx.lineWidth = Math.max(0.5, 0.9 * this.scale);

            for (let side = -1; side <= 1; side += 2) {
                const angle = headAngle + Math.PI + side * kelvin;
                const endX = head.x + Math.cos(angle) * armLength;
                const endY = head.y + Math.sin(angle) * armLength;

                const gradient = ctx.createLinearGradient(
                    head.x, head.y, endX, endY
                );

                gradient.addColorStop(0, rippleColor(0.20 * this.depth));
                gradient.addColorStop(1, rippleColor(0));

                ctx.strokeStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(head.x, head.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }

            ctx.restore();
        }

        // ---------------------------------------------------------------------
        // Rendering helpers
        // ---------------------------------------------------------------------
        makePatches() {
            const variety = this.variety;
            const patches = [];

            const add = (u, v, rx, ry, color) => {
                patches.push({
                    u, v, rx, ry, color,
                    phase: Math.random() * TAU,
                    phase2: Math.random() * TAU
                });
            };

            // Accent colour order matters: later patches draw on top.
            if (variety.cap) {
                // Cap on the head, like a kohaku's "tancho"/head marking.
                add(0.07, 0, 1.9, 0.78, variety.cap);
            }

            const count =
                variety.patchCount[0] +
                Math.floor(Math.random() * (variety.patchCount[1] - variety.patchCount[0] + 1));

            for (let i = 0; i < count; i++) {
                const slot = (i + 0.5) / count;
                add(
                    0.26 + slot * 0.56 + (Math.random() - 0.5) * 0.07,
                    (Math.random() - 0.5) * 0.62,
                    1.5 + Math.random() * 1.9,
                    0.42 + Math.random() * 0.45,
                    variety.patches[i % variety.patches.length]
                );
            }

            if (variety.dark) {
                const darkCount = 2 + Math.floor(Math.random() * 2);
                for (let i = 0; i < darkCount; i++) {
                    add(
                        0.30 + Math.random() * 0.5,
                        (Math.random() - 0.5) * 0.9,
                        0.9 + Math.random() * 1.2,
                        0.22 + Math.random() * 0.25,
                        variety.dark
                    );
                }
            }

            return patches;
        }

        computeBodyFrames() {
            const last = this.numVertebrae - 1;

            for (let i = 0; i <= last; i++) {
                const a = this.spine[Math.max(0, i - 1)];
                const b = this.spine[Math.min(last, i + 1)];

                const tx = b.x - a.x;
                const ty = b.y - a.y;
                const len = Math.hypot(tx, ty) || 1;

                this.frames[i].px = -ty / len;
                this.frames[i].py = tx / len;
            }
        }

        // Position on the body at a fractional spine station.
        sampleBody(station) {
            const last = this.numVertebrae - 1;
            const s = clamp(station, 0, last);
            const i0 = Math.min(last - 1, Math.floor(s));
            const t = s - i0;

            const a = this.spine[i0];
            const b = this.spine[i0 + 1];
            const fa = this.frames[i0];
            const fb = this.frames[i0 + 1];

            const out = this.scratch;
            out.x = a.x + (b.x - a.x) * t;
            out.y = a.y + (b.y - a.y) * t;
            out.px = fa.px + (fb.px - fa.px) * t;
            out.py = fa.py + (fb.py - fa.py) * t;
            out.w = this.bodyWidths[i0] +
                (this.bodyWidths[i0 + 1] - this.bodyWidths[i0]) * t;

            return out;
        }

        fillPatch(ctx, patch, alpha) {
            const steps = 11;
            const pts = [];

            for (let k = 0; k < steps; k++) {
                const th = (k / steps) * TAU;

                const wobble =
                    1 +
                    0.22 * Math.sin(3 * th + patch.phase) +
                    0.14 * Math.sin(2 * th + patch.phase2);

                const station =
                    patch.u * (this.numVertebrae - 1) +
                    Math.cos(th) * patch.rx * wobble;

                const lateral =
                    patch.v + Math.sin(th) * patch.ry * wobble;

                const s = this.sampleBody(station);

                pts.push({
                    x: s.x + s.px * lateral * s.w,
                    y: s.y + s.py * lateral * s.w
                });
            }

            ctx.beginPath();
            ctx.moveTo(
                (pts[0].x + pts[steps - 1].x) * 0.5,
                (pts[0].y + pts[steps - 1].y) * 0.5
            );

            for (let k = 0; k < steps; k++) {
                const p = pts[k];
                const n = pts[(k + 1) % steps];

                ctx.quadraticCurveTo(
                    p.x,
                    p.y,
                    (p.x + n.x) * 0.5,
                    (p.y + n.y) * 0.5
                );
            }

            ctx.closePath();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = patch.color;
            ctx.fill();
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

        // Fin membranes fade from an opaque root to a translucent free edge,
        // with curved rays that follow the flex of the membrane.
        drawTail(ctx) {
            const geometry = this.getTailGeometry();
            const root = geometry.root;
            const points = geometry.points;
            const variety = this.variety;

            if (points.length < 3) return;

            ctx.beginPath();
            ctx.moveTo(root.x, root.y);

            for (let i = 0; i < points.length - 1; i++) {
                const current = points[i];
                const next = points[i + 1];

                ctx.quadraticCurveTo(
                    current.x,
                    current.y,
                    (current.x + next.x) * 0.5,
                    (current.y + next.y) * 0.5
                );
            }

            const finalPoint = points[points.length - 1];
            ctx.lineTo(finalPoint.x, finalPoint.y);

            const center = points[7];

            ctx.quadraticCurveTo(
                center.x * 0.48 + root.x * 0.52,
                center.y * 0.48 + root.y * 0.52,
                root.x,
                root.y
            );

            ctx.closePath();

            const membrane = ctx.createLinearGradient(
                root.x,
                root.y,
                center.x,
                center.y
            );

            membrane.addColorStop(0, `rgba(${variety.fin}, 0.58)`);
            membrane.addColorStop(0.55, `rgba(${variety.fin}, 0.30)`);
            membrane.addColorStop(1, `rgba(${variety.fin}, 0.10)`);

            ctx.fillStyle = membrane;
            ctx.fill();

            ctx.strokeStyle = `rgba(${variety.rim}, 0.42)`;
            ctx.lineWidth = 0.9 * this.scale;
            ctx.stroke();

            // Rays bow with the membrane instead of radiating as rigid spokes.
            ctx.beginPath();

            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                const t = 0.78 + 0.14 * p.edgeWeight;

                const endX = root.x + (p.x - root.x) * t;
                const endY = root.y + (p.y - root.y) * t;

                const bow =
                    Math.sin(this.swimPhase - 2.6 + i * 0.18) *
                    (0.8 + 1.3 * p.edgeWeight) *
                    this.scale;

                ctx.moveTo(root.x, root.y);
                ctx.quadraticCurveTo(
                    root.x + (endX - root.x) * 0.55 - geometry.sideX * bow,
                    root.y + (endY - root.y) * 0.55 - geometry.sideY * bow,
                    endX,
                    endY
                );
            }

            ctx.strokeStyle = `rgba(${variety.rim}, 0.20)`;
            ctx.lineWidth = 0.6 * this.scale;
            ctx.stroke();
        }

        drawPaddleFin(ctx, anchor, tipX, tipY, controlX, controlY, rearX, rearY, alpha, width) {
            const variety = this.variety;

            ctx.beginPath();
            ctx.moveTo(anchor.x, anchor.y);
            ctx.quadraticCurveTo(controlX, controlY, tipX, tipY);
            ctx.quadraticCurveTo(rearX, rearY, anchor.x, anchor.y);
            ctx.closePath();

            const membrane = ctx.createLinearGradient(anchor.x, anchor.y, tipX, tipY);
            membrane.addColorStop(0, `rgba(${variety.fin}, ${alpha})`);
            membrane.addColorStop(1, `rgba(${variety.fin}, ${alpha * 0.30})`);

            ctx.fillStyle = membrane;
            ctx.fill();

            ctx.strokeStyle = `rgba(${variety.rim}, ${alpha + 0.12})`;
            ctx.lineWidth = width * this.scale;
            ctx.stroke();

            // A few rays fanning across the membrane.
            ctx.beginPath();
            for (const s of [0.18, 0.42, 0.68]) {
                const inv = 1 - s;
                const ex = inv * inv * tipX + 2 * inv * s * rearX + s * s * anchor.x;
                const ey = inv * inv * tipY + 2 * inv * s * rearY + s * s * anchor.y;
                ctx.moveTo(anchor.x, anchor.y);
                ctx.lineTo(
                    anchor.x + (ex - anchor.x) * 0.92,
                    anchor.y + (ey - anchor.y) * 0.92
                );
            }
            ctx.strokeStyle = `rgba(${variety.rim}, 0.18)`;
            ctx.lineWidth = 0.5 * this.scale;
            ctx.stroke();
        }

        drawPectoralFins(ctx) {
            const anchorIndex = 3;
            const anchor = this.spine[anchorIndex];
            const bodyAngle = this.getBodyAngle(anchorIndex);
            const finLength = 20.5 * this.scale;

            for (let side = -1; side <= 1; side += 2) {
                // Fins stabilize the fish with small, slow counter-motion.
                const phaseOffset = side < 0 ? 0.35 : 1.05;

                const stroke =
                    0.105 * Math.sin(this.swimPhase * 0.63 + phaseOffset) +
                    0.035 * Math.sin(this.swimPhase * 1.18 + side * 0.5);

                const finAngle =
                    bodyAngle +
                    side * (Math.PI * 0.51) +
                    side * 0.12 +
                    stroke;

                this.drawPaddleFin(
                    ctx,
                    anchor,
                    anchor.x + Math.cos(finAngle) * finLength,
                    anchor.y + Math.sin(finAngle) * finLength,
                    anchor.x + Math.cos(finAngle - side * 0.32) * 13 * this.scale,
                    anchor.y + Math.sin(finAngle - side * 0.32) * 13 * this.scale,
                    anchor.x - Math.cos(bodyAngle) * 6.0 * this.scale,
                    anchor.y - Math.sin(bodyAngle) * 6.0 * this.scale,
                    0.40,
                    0.9
                );
            }
        }

        drawPelvicFins(ctx) {
            const anchorIndex = 7;
            const anchor = this.spine[anchorIndex];
            const bodyAngle = this.getBodyAngle(anchorIndex);
            const finLength = 10.5 * this.scale;

            for (let side = -1; side <= 1; side += 2) {
                const finAngle =
                    bodyAngle +
                    side * (Math.PI * 0.72) +
                    0.06 * Math.sin(this.swimPhase * 0.58 + side);

                this.drawPaddleFin(
                    ctx,
                    anchor,
                    anchor.x + Math.cos(finAngle) * finLength,
                    anchor.y + Math.sin(finAngle) * finLength,
                    anchor.x + Math.cos(finAngle - side * 0.24) * 6.5 * this.scale,
                    anchor.y + Math.sin(finAngle - side * 0.24) * 6.5 * this.scale,
                    anchor.x - Math.cos(bodyAngle) * 4.1 * this.scale,
                    anchor.y - Math.sin(bodyAngle) * 4.1 * this.scale,
                    0.30,
                    0.7
                );
            }
        }

        drawBody(ctx, time) {
            this.computeBodyFrames();

            const last = this.numVertebrae - 1;
            const variety = this.variety;
            const left = [];
            const right = [];

            for (let i = 0; i <= last; i++) {
                const width = this.bodyWidths[i];
                const frame = this.frames[i];

                left.push({
                    x: this.spine[i].x + frame.px * width,
                    y: this.spine[i].y + frame.py * width
                });

                right.push({
                    x: this.spine[i].x - frame.px * width,
                    y: this.spine[i].y - frame.py * width
                });
            }

            const head = this.spine[0];
            const neck = this.spine[1];

            let forwardX = head.x - neck.x;
            let forwardY = head.y - neck.y;
            const forwardLen = Math.hypot(forwardX, forwardY) || 1;
            forwardX /= forwardLen;
            forwardY /= forwardLen;

            // Koi have blunt, rounded snouts.
            const snout = {
                x: head.x + forwardX * 3.4 * this.scale,
                y: head.y + forwardY * 3.4 * this.scale
            };

            const tailAnchor = this.spine[last];
            const path = new Path2D();
            const headFrame = this.frames[0];
            const headWidth = this.bodyWidths[0];

            path.moveTo(snout.x, snout.y);

            // Rounded cap: the curve leaves the snout sideways and wraps
            // around to the widest point of the head.
            path.bezierCurveTo(
                snout.x + headFrame.px * headWidth * 0.95,
                snout.y + headFrame.py * headWidth * 0.95,
                left[0].x + forwardX * headWidth * 0.55,
                left[0].y + forwardY * headWidth * 0.55,
                left[0].x,
                left[0].y
            );

            for (let i = 0; i < left.length - 1; i++) {
                const a = left[i];
                const b = left[i + 1];

                path.quadraticCurveTo(a.x, a.y, (a.x + b.x) * 0.5, (a.y + b.y) * 0.5);
            }

            path.quadraticCurveTo(left[last].x, left[last].y, tailAnchor.x, tailAnchor.y);

            for (let i = right.length - 1; i > 0; i--) {
                const a = right[i];
                const b = right[i - 1];

                path.quadraticCurveTo(a.x, a.y, (a.x + b.x) * 0.5, (a.y + b.y) * 0.5);
            }

            path.bezierCurveTo(
                right[0].x + forwardX * headWidth * 0.55,
                right[0].y + forwardY * headWidth * 0.55,
                snout.x - headFrame.px * headWidth * 0.95,
                snout.y - headFrame.py * headWidth * 0.95,
                snout.x,
                snout.y
            );
            path.closePath();

            const baseGradient = ctx.createLinearGradient(
                head.x, head.y, tailAnchor.x, tailAnchor.y
            );
            baseGradient.addColorStop(0, variety.base[0]);
            baseGradient.addColorStop(0.5, variety.base[1]);
            baseGradient.addColorStop(1, variety.base[2]);

            ctx.fillStyle = baseGradient;
            ctx.fill(path);

            ctx.save();
            ctx.clip(path);

            // Dorsal ridge catches more light than the flanks.
            ctx.beginPath();
            ctx.moveTo(this.spine[0].x, this.spine[0].y);
            for (let i = 1; i <= last; i++) {
                ctx.lineTo(this.spine[i].x, this.spine[i].y);
            }
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.strokeStyle = `rgba(255, 255, 255, ${variety.ridge})`;
            ctx.lineWidth = 11 * this.scale;
            ctx.stroke();

            for (const patch of this.patches) {
                this.fillPatch(ctx, patch, variety.patchAlpha);
            }
            ctx.globalAlpha = 1;

            // Overlapping scales.
            ctx.beginPath();
            for (let i = 2; i <= 12; i++) {
                const spine = this.spine[i];
                const frame = this.frames[i];
                const width = this.bodyWidths[i];
                const toward = Math.atan2(-frame.px, frame.py);
                const radius = Math.max(1.5, width * 0.30);
                const offsets = (i & 1)
                    ? [-0.58, -0.2, 0.2, 0.58]
                    : [-0.40, 0, 0.40];

                for (const o of offsets) {
                    const cx = spine.x + frame.px * o * width - Math.cos(toward) * radius * 0.55;
                    const cy = spine.y + frame.py * o * width - Math.sin(toward) * radius * 0.55;

                    ctx.moveTo(
                        cx + Math.cos(toward - 0.95) * radius,
                        cy + Math.sin(toward - 0.95) * radius
                    );
                    ctx.arc(cx, cy, radius, toward - 0.95, toward + 0.95);
                }
            }
            ctx.strokeStyle = variety.scales;
            ctx.lineWidth = 0.7 * this.scale;
            ctx.stroke();

            // Gentle moving caustic highlight, as if lit through rippling water.
            const shimmerAt = 0.5 + 0.5 * Math.sin(time * 0.7 + this.waveOffset);
            const shimmer = ctx.createLinearGradient(
                head.x, head.y, tailAnchor.x, tailAnchor.y
            );
            shimmer.addColorStop(clamp(shimmerAt - 0.24, 0, 1), 'rgba(190, 235, 255, 0)');
            shimmer.addColorStop(shimmerAt, `rgba(190, 235, 255, ${variety.shimmer})`);
            shimmer.addColorStop(clamp(shimmerAt + 0.24, 0, 1), 'rgba(190, 235, 255, 0)');

            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = shimmer;
            ctx.fill(path);
            ctx.globalCompositeOperation = 'source-over';

            // Darken the edges so the body reads as rounded.
            ctx.strokeStyle = 'rgba(3, 10, 22, 0.42)';
            ctx.lineWidth = 6 * this.scale;
            ctx.stroke(path);

            ctx.restore();

            ctx.strokeStyle = `rgba(${variety.rim}, 0.34)`;
            ctx.lineWidth = 0.75 * this.scale;
            ctx.stroke(path);
        }

        drawDorsalAndHead(ctx) {
            const variety = this.variety;

            // Dorsal fin seen from above: a thin ridge with a little sway.
            ctx.beginPath();
            for (let i = 4; i <= 9; i++) {
                const p = this.spine[i];
                const frame = this.frames[i];
                const sway =
                    Math.sin(this.swimPhase * 0.9 - i * 0.45) *
                    0.9 * this.scale * ((i - 3) / 6);

                const x = p.x + frame.px * sway;
                const y = p.y + frame.py * sway;

                if (i === 4) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = `rgba(${variety.fin}, 0.28)`;
            ctx.lineWidth = 3.4 * this.scale;
            ctx.stroke();
            ctx.strokeStyle = `rgba(${variety.rim}, 0.55)`;
            ctx.lineWidth = 0.9 * this.scale;
            ctx.stroke();

            // Gill cover.
            const gill = this.spine[3];
            const gillFrame = this.frames[3];
            const gillWidth = this.bodyWidths[3] * 0.88;
            const toward = Math.atan2(-gillFrame.px, gillFrame.py);

            ctx.beginPath();
            ctx.moveTo(
                gill.x + gillFrame.px * gillWidth,
                gill.y + gillFrame.py * gillWidth
            );
            ctx.quadraticCurveTo(
                gill.x + Math.cos(toward) * 3.4 * this.scale,
                gill.y + Math.sin(toward) * 3.4 * this.scale,
                gill.x - gillFrame.px * gillWidth,
                gill.y - gillFrame.py * gillWidth
            );
            ctx.strokeStyle = 'rgba(4, 12, 26, 0.34)';
            ctx.lineWidth = 0.9 * this.scale;
            ctx.stroke();

            // Barbels at the corners of the mouth.
            const head = this.spine[0];
            const neck = this.spine[1];
            const fx = head.x - neck.x;
            const fy = head.y - neck.y;
            const fl = Math.hypot(fx, fy) || 1;
            const dirX = fx / fl;
            const dirY = fy / fl;
            const perpX = -dirY;
            const perpY = dirX;
            const wiggle = Math.sin(this.swimPhase * 1.1) * 0.8 * this.scale;

            ctx.beginPath();
            for (let side = -1; side <= 1; side += 2) {
                const bx = head.x + dirX * 3.0 * this.scale + perpX * side * 2.6 * this.scale;
                const by = head.y + dirY * 3.0 * this.scale + perpY * side * 2.6 * this.scale;

                ctx.moveTo(bx, by);
                ctx.quadraticCurveTo(
                    bx + dirX * 3 * this.scale + perpX * side * (2.4 + wiggle) * this.scale,
                    by + dirY * 3 * this.scale + perpY * side * (2.4 + wiggle) * this.scale,
                    bx + dirX * 2 * this.scale + perpX * side * (5 + wiggle) * this.scale,
                    by + dirY * 2 * this.scale + perpY * side * (5 + wiggle) * this.scale
                );
            }
            ctx.strokeStyle = `rgba(${variety.rim}, 0.55)`;
            ctx.lineWidth = 0.6 * this.scale;
            ctx.stroke();
        }

        drawEyes(ctx) {
            const eyeIndex = 1;
            const eyePoint = this.spine[eyeIndex];

            const dx = this.spine[0].x - this.spine[2].x;
            const dy = this.spine[0].y - this.spine[2].y;
            const len = Math.hypot(dx, dy) || 1;

            const forwardX = dx / len;
            const forwardY = dy / len;
            const perpX = -forwardY;
            const perpY = forwardX;
            const distance = this.bodyWidths[eyeIndex] * 0.84;

            for (let side = -1; side <= 1; side += 2) {
                const eyeX =
                    eyePoint.x + perpX * side * distance * 0.94 +
                    forwardX * 1.25 * this.scale;
                const eyeY =
                    eyePoint.y + perpY * side * distance * 0.94 +
                    forwardY * 1.25 * this.scale;

                ctx.beginPath();
                ctx.arc(eyeX, eyeY, 2.15 * this.scale, 0, TAU);
                ctx.fillStyle = 'rgba(6, 12, 24, 0.92)';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(eyeX, eyeY, 1.55 * this.scale, 0, TAU);
                ctx.fillStyle = this.variety.eye;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(eyeX, eyeY, 0.98 * this.scale, 0, TAU);
                ctx.fillStyle = '#04070d';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(
                    eyeX - 0.38 * this.scale,
                    eyeY - 0.38 * this.scale,
                    0.36 * this.scale,
                    0,
                    TAU
                );
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.fill();
            }
        }

        drawFish(ctx, time) {
            ctx.save();
            ctx.globalAlpha = this.depth * 0.94;

            // Soft light the fish pushes into the surrounding water.
            const mid = this.spine[6];
            const glowSize = 92 * this.scale;
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = this.depth * 0.10;
            ctx.drawImage(glowSprite, mid.x - glowSize / 2, mid.y - glowSize / 2, glowSize, glowSize);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = this.depth * 0.94;

            this.drawTail(ctx);
            this.drawPelvicFins(ctx);
            this.drawPectoralFins(ctx);
            this.drawBody(ctx, time);
            this.drawDorsalAndHead(ctx);
            this.drawEyes(ctx);

            ctx.restore();
        }
    }

    // Smaller screens get fewer, slightly smaller fish and a 30fps cap so the
    // background never competes with scrolling for the GPU.
    const isCompact = () => width < 640;
    const sizeFactor = isCompact() ? 0.82 : 1;

    const koiSpecs = [
        [1.30, 'kohaku'],
        [1.15, 'sanke'],
        [1.00, 'ogon'],
        [0.90, 'showa'],
        [0.80, 'asagi'],
        [1.05, 'ghost']
    ];

    const koiSchool = koiSpecs
        .slice(0, isCompact() ? 4 : koiSpecs.length)
        .map(([scale, name]) => new TrueKoi(
            width,
            height,
            scale * sizeFactor,
            KOI_VARIETIES.find(v => v.name === name),
            // Smaller koi are drawn deeper: dimmer and underneath.
            0.68 + 0.32 * clamp((scale - 0.8) / 0.5, 0, 1)
        ));

    // Back-to-front draw order (deepest first).
    const drawOrder = [...koiSchool].sort((a, b) => a.depth - b.depth);

    // Start with trails already in the water instead of fish appearing bare.
    for (let i = 0; i < 160; i++) {
        for (const koi of koiSchool) koi.update(width, height, 1 / 30);
    }

    const reduceMotion = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : { matches: false };

    let isRunning = !document.hidden;
    let lastTime = performance.now();
    let seaTime = 0;
    let rafId = 0;

    const drawScene = () => {
        ctx.clearRect(0, 0, width, height);

        // Water disturbance sits behind every fish.
        for (const koi of drawOrder) koi.drawWake(ctx);
        for (const koi of drawOrder) koi.drawFish(ctx, seaTime);
    };

    const startLoop = () => {
        cancelAnimationFrame(rafId);
        lastTime = performance.now();
        if (isRunning && !reduceMotion.matches) {
            rafId = requestAnimationFrame(renderSea);
        }
    };

    document.addEventListener('visibilitychange', () => {
        isRunning = !document.hidden;
        startLoop();
    });

    function renderSea(now) {
        if (!isRunning) return;
        rafId = requestAnimationFrame(renderSea);

        const elapsed = now - lastTime;
        if (isCompact() && elapsed < 30) return;

        // Clamp giant gaps after sleeping / tab switching.
        const dt = Math.min(Math.max(elapsed / 1000, 0), 0.05);
        lastTime = now;
        seaTime += dt;

        for (const koi of koiSchool) koi.update(width, height, dt);
        drawScene();
    }

    // A resize (device rotation, window drag) needs a new backing store; the
    // mobile URL bar showing/hiding only nudges the height, which must not.
    let resizeTimer = 0;
    let lastBackingWidth = width;
    let lastBackingHeight = height;

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const widthChanged = window.innerWidth !== lastBackingWidth;
            const heightJump = Math.abs(window.innerHeight - lastBackingHeight) > 120;
            if (!widthChanged && !heightJump) return;

            resizeCanvas();
            lastBackingWidth = width;
            lastBackingHeight = height;
            if (reduceMotion.matches) drawScene();
        }, 150);
    }, { passive: true });

    if (reduceMotion.matches) {
        drawScene();
    } else {
        startLoop();
    }
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
    if (!canSetThreadBanner()) { denyBannerChange(); return; }
    if (!(await uiConfirm(`This removes the banner for "${activeThread}". You can set a new one any time.`, { title: 'Remove banner?', confirmText: 'Remove', danger: true }))) return;
    const tData = allCloudThreads.find(t => t.name === activeThread);
    if (tData && tData.id && db) {
        const { error } = await db.from('forum_threads').update({ banner_url: null }).eq('id', tData.id);
        if (error) {
            await db.from('threads').update({ banner_url: null }).eq('id', tData.id).then(null, () => {});
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
