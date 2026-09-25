// --- DATABASE CONFIGURATION LINK ---
const SUPABASE_URL = "https://zuafgczkmaaxvdmvymrx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1YWZnY3prbWFheHZkbXZ5bXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyODAyMzEsImV4cCI6MjEwNTg1NjIzMX0.WF5wP6-1SjGw8sRUTI6Ngm0E23PNpeESZgqJwmG0qU8";

const db = (window.supabase && typeof window.supabase.createClient === 'function')
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

if (!db) console.error("Critical: window.supabase is not initialized.");

// DOM Elements - Auth & Navigation
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

// DOM Elements - Forum & Feed
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

// App & User State
let currentUser = null;
let currentUsername = null;
let isSignUpMode = false;

// Telemetry State
let pageLoadTime = null; 
let textWasPasted = false;
let keystrokeGaps = [];
let lastKeyTime = null;
let mouseMovementsRecorded = 0;
let timerInterval = null; 
let isTimerRunning = false; 

// --- AUTHENTICATION HANDLING ---

// Toggle between Login and Signup modes
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

// Submit Login or Signup
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;

    if (isSignUpMode) {
        const username = authUsernameInput.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (username.length < 3) {
            alert("Username must be at least 3 alphanumeric characters.");
            return;
        }

        // Check if username already exists in profiles
        const { data: existingUser } = await db
            .from('profiles')
            .select('username')
            .eq('username', username)
            .maybeSingle();

        if (existingUser) {
            alert("That username is already taken. Please choose another.");
            return;
        }

        const { data, error } = await db.auth.signUp({
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

// Logout
logoutBtn.addEventListener('click', async () => {
    await db.auth.signOut();
});

// Listen for Supabase Auth changes (Login, Logout, Session restore)
if (db) {
    db.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
            currentUser = session.user;
            
            // Fetch username from profiles
            const { data: profile } = await db
                .from('profiles')
                .select('username')
                .eq('id', currentUser.id)
                .maybeSingle();

            currentUsername = profile?.username || currentUser.user_metadata?.username || "human";
            currentUserTag.textContent = `@${currentUsername}`;

            authPanel.classList.add('hidden');
            postPanel.classList.remove('hidden');
        } else {
            currentUser = null;
            currentUsername = null;
            postPanel.classList.add('hidden');
            authPanel.classList.remove('hidden');
        }
    });
}

// --- TELEMETRY ENGINE ---

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

// --- FORUM FEED LOADER ---

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

// Initial feed load
loadForumPosts();

// --- FORUM SUBMISSION (Uses authenticated username) ---

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
        .insert([
            { 
                thread: topicSelect.value, 
                author: currentUsername, // Automatically uses unique username
                content: textBox.value 
            }
        ]);

    if (error) {
        alert(`Database Error: ${error.message}`);
        console.error("Supabase Insert Error:", error);
        return;
    }

    await loadForumPosts();
    resetTelemetryConsole();
});
