// --- DATABASE CONFIGURATION ---
const SUPABASE_URL = "https://zuafgczkmaaxvdmvymrx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1YWZnY3prbWFheHZkbXZ5bXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyODAyMzEsImV4cCI6MjEwNTg1NjIzMX0.WF5wP6-1SjGw8sRUTI6Ngm0E23PNpeESZgqJwmG0qU8";

// Safely obtain client from window.supabase
const client = (window.supabase && typeof window.supabase.createClient === 'function')
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

if (!client) {
    console.error("Critical: Supabase library not found on window object.");
}

// DOM Elements
const formElem = document.getElementById('forumForm');
const textElem = document.getElementById('forum-post');
const trapElem = document.getElementById('honeypot-field');
const selectElem = document.getElementById('topic-select');
const nickElem = document.getElementById('user-nickname');
const feedElem = document.getElementById('forum-feed');
const threadTitleElem = document.getElementById('current-thread-title');

const pasteBadge = document.getElementById('stat-paste');
const timerDisplay = document.getElementById('stat-timer');
const keysDisplay = document.getElementById('stat-keys');
const uniformityDisplay = document.getElementById('stat-uniformity');

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
        timerDisplay.textContent = `${elapsed.toFixed(1)}s`;
    }, 100);
}

// User Interaction Tracking
window.addEventListener('mousemove', () => { mouseMovementsRecorded++; });
window.addEventListener('touchstart', () => { mouseMovementsRecorded++; });

// Detect Clipboard Pasting
textElem.addEventListener('paste', () => {
    textWasPasted = true;
    pasteBadge.textContent = "TRUE";
    pasteBadge.className = "badge badge-red";
    if (!isTimerRunning) startCompositionTimer();
});

// Telemetry & Keystroke Monitoring
textElem.addEventListener('keydown', (e) => {
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
            uniformityDisplay.textContent = `${(uniformityRatio * 100).toFixed(0)}%`;
        }
    }
    
    lastKeyTime = currentTime;
    keysDisplay.textContent = `${textElem.value.length + 1} keys`;
});

// Post Feed Renderer
async function loadForumPosts() {
    const selectedThread = selectElem.value;
    threadTitleElem.textContent = selectedThread;
    
    if (!client) {
        feedElem.innerHTML = `<div class="no-posts" style="color: #f87171;">Database client failed to connect. Check CDN link.</div>`;
        return;
    }

    const { data: posts, error } = await client
        .from('posts')
        .select('*')
        .eq('thread', selectedThread)
        .order('id', { ascending: false });

    if (error) {
        console.error("Cloud Retrieval Error:", error);
        feedElem.innerHTML = `<div class="no-posts" style="color: #f87171;">Error loading posts: ${escapeHTML(error.message)}</div>`;
        return;
    }
    
    if (!posts || posts.length === 0) {
        feedElem.innerHTML = `<div class="no-posts">No human content posted inside "${escapeHTML(selectedThread)}" yet...</div>`;
        return;
    }
    
    feedElem.innerHTML = '';
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
        feedElem.appendChild(item);
    });
}

selectElem.addEventListener('change', loadForumPosts);

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
    textElem.value = '';
    nickElem.value = '';
    pasteBadge.textContent = "FALSE";
    pasteBadge.className = "badge badge-green";
    timerDisplay.textContent = "0.0s"; 
    keysDisplay.textContent = "0 keys";
    uniformityDisplay.textContent = "0%";
}

// Initial post load
loadForumPosts();

// Form Submit Handler
formElem.addEventListener('submit', async (event) => {
    event.preventDefault(); 
    
    if (trapElem.value !== "") {
        alert("Submission Blocked: Honeypot triggered.");
        return;
    }

    const totalTimeElapsed = pageLoadTime ? (Date.now() - pageLoadTime) / 1000 : 0;
    if (textWasPasted) { alert("Submission Blocked: Paste detected."); return; }
    if (totalTimeElapsed < 3) { alert("Submission Blocked: Impossibly fast post time."); return; }
    if (mouseMovementsRecorded === 0) { alert("Submission Blocked: No interaction track detected."); return; }
    if (textElem.value.trim().length < 5) { alert("Submission Blocked: Type a longer message."); return; }

    let perfectIntervals = 0;
    for (let i = 2; i < keystrokeGaps.length; i++) {
        if (keystrokeGaps[i] === keystrokeGaps[i - 1]) perfectIntervals++;
    }
    const uniformityRatio = keystrokeGaps.length > 2 ? (perfectIntervals / (keystrokeGaps.length - 2)) : 0;
    if (uniformityRatio > 0.60) { alert("Submission Blocked: Automation detected."); return; }

    const authorName = nickElem.value.trim() || "Anonymous";

    if (!client) {
        alert("Database Error: Client connection not ready.");
        return;
    }

    const { error } = await client
        .from('posts')
        .insert([
            { thread: selectElem.value, author: authorName, content: textElem.value }
        ]);

    if (error) {
        alert(`Database Error: ${error.message}`);
        console.error("Supabase Insert Error:", error);
        return;
    }

    await loadForumPosts();
    resetTelemetryConsole();
});
