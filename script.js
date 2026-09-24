// --- DATABASE CONFIGURATION LINK ---
const SUPABASE_URL = "https://zuafgczkmaaxvdmvymrx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1YWZnY3prbWFheHZkbXZ5bXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyODAyMzEsImV4cCI6MjEwNTg1NjIzMX0.WF5wP6-1SjGw8sRUTI6Ngm0E23PNpeESZgqJwmG0qU8";

// Safely access the global library from the CDN without naming collision
const db = (window.supabase && typeof window.supabase.createClient === 'function')
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

if (!db) {
    console.error("Critical: window.supabase is not available. Check your CDN script tag.");
}

// DOM Elements
const forumForm = document.getElementById('forumForm');
const textBox = document.getElementById('forum-post');
const honeypotField = document.getElementById('honeypot-field');
const topicSelect = document.getElementById('topic-select');
const nicknameInput = document.getElementById('user-nickname');
const forumFeed = document.getElementById('forum-feed');
const currentThreadTitle = document.getElementById('current-thread-title');

const statPaste = document.getElementById('stat-paste');
const statTimer = document.getElementById('stat-timer');
const statKeys = document.getElementById('stat-keys');
const statUniformity = document.getElementById('stat-uniformity');

// Telemetry State
let pageLoadTime = null; 
let textWasPasted = false;
let keystrokeGaps = [];
let lastKeyTime = null;
let mouseMovementsRecorded = 0;
let timerInterval = null; 
let isTimerRunning = false; 

function startCompositionTimer() {
    if (timerInterval) clearInterval(timerInterval);
    pageLoadTime = Date.now();
    isTimerRunning = true;
    
    timerInterval = setInterval(() => {
        const elapsed = (Date.now() - pageLoadTime) / 1000;
        statTimer.textContent = `${elapsed.toFixed(1)}s`;
    }, 100);
}

// Interaction trackers
window.addEventListener('mousemove', () => { mouseMovementsRecorded++; });
window.addEventListener('touchstart', () => { mouseMovementsRecorded++; });

// Detect paste
textBox.addEventListener('paste', () => {
    textWasPasted = true;
    statPaste.textContent = "TRUE";
    statPaste.className = "badge badge-red";
    if (!isTimerRunning) startCompositionTimer();
});

// Detect keystrokes
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

// Feed loader
async function loadForumPosts() {
    const selectedThread = topicSelect.value;
    currentThreadTitle.textContent = selectedThread;
    
    if (!db) {
        forumFeed.innerHTML = `<div class="no-posts" style="color: #f87171;">Database client failed to connect. Check console.</div>`;
        return;
    }

    // Updated from 'posts' to 'Posts' to match table casing
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
                <span>By: <span class="post-author">${escapeHTML(post.author || 'Anonymous')}</span></span>
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
    nicknameInput.value = '';
    statPaste.textContent = "FALSE";
    statPaste.className = "badge badge-green";
    statTimer.textContent = "0.0s"; 
    statKeys.textContent = "0 keys";
    statUniformity.textContent = "0%";
}

// Initial fetch
loadForumPosts();

// Form submit
forumForm.addEventListener('submit', async (event) => {
    event.preventDefault(); 
    
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

    const authorName = nicknameInput.value.trim() || "Anonymous";

    if (!db) {
        alert("Database Error: Client connection not ready.");
        return;
    }

    // Updated from 'posts' to 'Posts' to match table casing
    const { error } = await db
        .from('Posts')
        .insert([
            { thread: topicSelect.value, author: authorName, content: textBox.value }
        ]);

    if (error) {
        alert(`Database Error: ${error.message}`);
        console.error("Supabase Insert Error:", error);
        return;
    }

    await loadForumPosts();
    resetTelemetryConsole();
});
