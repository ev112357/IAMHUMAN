// --- DATABASE CONFIGURATION LINK ---
const SUPABASE_URL = "https://zuafgczkmaaxvdmvymrx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1YWZnY3prbWFheHZkbXZ5bXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyODAyMzEsImV4cCI6MjEwNTg1NjIzMX0.WF5wP6-1SjGw8sRUTI6Ngm0E23PNpeESZgqJwmG0qU8";

const db = (window.supabase && typeof window.supabase.createClient === 'function')
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
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

// DOM Elements - Friends & DMs
const dmSection = document.getElementById('dm-section');
const addFriendInput = document.getElementById('add-friend-input');
const addFriendBtn = document.getElementById('add-friend-btn');
const friendsContainer = document.getElementById('friends-container');
const chatHeader = document.getElementById('chat-header');
const chatMessages = document.getElementById('chat-messages');
const dmForm = document.getElementById('dm-form');
const dmText = document.getElementById('dm-text');
const dmSendBtn = document.getElementById('dm-send-btn');

// App State
let currentUser = null;
let currentUsername = null;
let isSignUpMode = false;
let activeFriend = null; // { id, username }
let dmInterval = null;

// Telemetry State
let pageLoadTime = null; 
let textWasPasted = false;
let keystrokeGaps = [];
let lastKeyTime = null;
let mouseMovementsRecorded = 0;
let timerInterval = null; 
let isTimerRunning = false; 

// --- AUTHENTICATION ---

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
            alert("Username must be at least 3 characters (letters, numbers, underscores).");
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
    if (dmInterval) clearInterval(dmInterval);
    await db.auth.signOut();
});

if (db) {
    db.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
            currentUser = session.user;

            const { data: profile } = await db
                .from('profiles')
                .select('username')
                .eq('id', currentUser.id)
                .maybeSingle();

            currentUsername = profile?.username || currentUser.user_metadata?.username || "human";
            currentUserTag.textContent = `@${currentUsername}`;

            authPanel.classList.add('hidden');
            postPanel.classList.remove('hidden');
            dmSection.classList.remove('hidden');

            loadFriends();
        } else {
            currentUser = null;
            currentUsername = null;
            activeFriend = null;
            if (dmInterval) clearInterval(dmInterval);
            postPanel.classList.add('hidden');
            dmSection.classList.add('hidden');
            authPanel.classList.remove('hidden');
        }
    });
}

// --- FRIENDS & DIRECT MESSAGING ---

async function loadFriends() {
    if (!currentUser) return;

    // Get friendships where current user is either party
    const { data: friendships, error } = await db
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`);

    if (error) {
        console.error("Error loading friends:", error);
        return;
    }

    const friendIds = friendships.map(f => f.user_id === currentUser.id ? f.friend_id : f.user_id);

    if (friendIds.length === 0) {
        friendsContainer.innerHTML = '<div class="no-posts">No friends yet. Add one above!</div>';
        return;
    }

    const { data: profiles } = await db
        .from('profiles')
        .select('id, username')
        .in('id', friendIds);

    friendsContainer.innerHTML = '';
    (profiles || []).forEach(friend => {
        const div = document.createElement('div');
        div.className = `friend-item ${activeFriend && activeFriend.id === friend.id ? 'active' : ''}`;
        div.textContent = `@${friend.username}`;
        div.addEventListener('click', () => selectFriend(friend));
        friendsContainer.appendChild(div);
    });
}

addFriendBtn.addEventListener('click', async () => {
    const targetUsername = addFriendInput.value.trim().toLowerCase().replace('@', '');
    if (!targetUsername) return;

    if (targetUsername === currentUsername) {
        alert("You cannot add yourself as a friend.");
        return;
    }

    // Find user by username
    const { data: targetProfile, error: profileErr } = await db
        .from('profiles')
        .select('id, username')
        .eq('username', targetUsername)
        .maybeSingle();

    if (profileErr || !targetProfile) {
        alert("User not found.");
        return;
    }

    // Check existing
    const { data: existing } = await db
        .from('friendships')
        .select('id')
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${targetProfile.id}),and(user_id.eq.${targetProfile.id},friend_id.eq.${currentUser.id})`)
        .maybeSingle();

    if (existing) {
        alert("You are already friends with this user.");
        return;
    }

    const { error: insertErr } = await db
        .from('friendships')
        .insert([{ user_id: currentUser.id, friend_id: targetProfile.id }]);

    if (insertErr) {
        alert(`Could not add friend: ${insertErr.message}`);
        return;
    }

    addFriendInput.value = '';
    alert(`Added @${targetProfile.username} as a friend!`);
    loadFriends();
});

function selectFriend(friend) {
    activeFriend = friend;
    chatHeader.textContent = `Chatting with @${friend.username}`;
    dmText.disabled = false;
    dmSendBtn.disabled = false;

    // Highlight selected in sidebar
    document.querySelectorAll('.friend-item').forEach(el => {
        el.classList.toggle('active', el.textContent === `@${friend.username}`);
    });

    loadDirectMessages();

    // Poll for new messages every 3 seconds
    if (dmInterval) clearInterval(dmInterval);
    dmInterval = setInterval(loadDirectMessages, 3000);
}

async function loadDirectMessages() {
    if (!currentUser || !activeFriend) return;

    const { data: messages, error } = await db
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${activeFriend.id}),and(sender_id.eq.${activeFriend.id},recipient_id.eq.${currentUser.id})`)
        .order('id', { ascending: true });

    if (error) {
        console.error("Error loading DMs:", error);
        return;
    }

    chatMessages.innerHTML = '';
    if (!messages || messages.length === 0) {
        chatMessages.innerHTML = '<div class="no-posts">No messages yet. Say hello!</div>';
        return;
    }

    messages.forEach(msg => {
        const isMine = msg.sender_id === currentUser.id;
        const bubble = document.createElement('div');
        bubble.className = `msg-bubble ${isMine ? 'msg-mine' : 'msg-theirs'}`;
        bubble.textContent = msg.content;
        chatMessages.appendChild(bubble);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

dmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = dmText.value.trim();
    if (!content || !activeFriend) return;

    const { error } = await db
        .from('direct_messages')
        .insert([{
            sender_id: currentUser.id,
            recipient_id: activeFriend.id,
            sender_username: currentUsername,
            content: content
        }]);

    if (error) {
        alert(`Error sending DM: ${error.message}`);
        return;
    }

    dmText.value = '';
    loadDirectMessages();
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
