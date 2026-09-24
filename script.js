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

// --- DATABASE CONFIGURATION LINK ---
// TODO: PASTE YOUR EXACT COPIED SUPABASE VALUES INSIDE THE QUOTATIONS BELOW
const SUPABASE_URL = "https://zuafgczkmaaxvdmvymrx.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1YWZnY3prbWFheHZkbXZ5bXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyODAyMzEsImV4cCI6MjEwNTg1NjIzMX0.WF5wP6-1SjGw8sRUTI6Ngm0E23PNpeESZgqJwmG0qU8";

// Initialize the global cloud network connection pipeline
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let pageLoadTime = null; 
let textWasPasted = false;
let keystrokeGaps = [];
let lastKeyTime = Date.now();
let mouseMovementsRecorded = 0;
let timerInterval = null; 
let isTimerRunning = false; 

function startCompositionTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
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

textBox.addEventListener('keydown', () => {
    if (!isTimerRunning) startCompositionTimer();
    const currentTime = Date.now();
    const gap = currentTime - lastKeyTime;
    if (keystrokeGaps.length < 50) keystrokeGaps.push(gap);
    statKeys.textContent = `${keystrokeGaps.length} keys`;
    
    if (keystrokeGaps.length > 3) {
        let perfectIntervals = 0;
        for (let i = 2; i < keystrokeGaps.length; i++) {
            if (keystrokeGaps[i] === keystrokeGaps[i - 1]) perfectIntervals++;
        }
        let uniformityRatio = perfectIntervals / (keystrokeGaps.length - 2);
        statUniformity.textContent = `${(uniformityRatio * 100).toFixed(0)}%`;
    }
    lastKeyTime = currentTime;
});

// --- UPDATED: LIVE CLOUD SYNC FORUM STORAGE FEED ENGINE ---

async function loadForumPosts() {
    const selectedThread = topicSelect.value;
    currentThreadTitle.textContent = selectedThread;
    
    // Fetch directly from the online cloud database using filtering rules
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('thread', selectedThread)
        .order('id', { ascending: false }); // Show newest posts first

    if (error) {
        console.error("Cloud Retrieval Error:", error.message);
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
        
        // Format the database timestamptz nicely
        const dateFormatted = new Date(post.created_at).toLocaleString();
        
        item.innerHTML = `
            <div class="post-meta">
                <span>By: <span class="post-author">${escapeHTML(post.author)}</span></span>
                <span>${dateFormatted}</span>
            </div>
            <div class="post-content">${escapeHTML(post.content)}</div>
        `;
        forumFeed.appendChild(item);
    });
}

topicSelect.addEventListener('change', loadForumPosts);

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

function resetTelemetryConsole() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    pageLoadTime = null;
    isTimerRunning = false; 
    textWasPasted = false;
    keystrokeGaps = [];
    mouseMovementsRecorded = 0;
    lastKeyTime = Date.now();
    textBox.value = '';
    nicknameInput.value = '';
    statPaste.textContent = "FALSE";
    statPaste.className = "badge badge-green";
    statTimer.textContent = "0.0s"; 
    statKeys.textContent = "0 keys";
    statUniformity.textContent = "0%";
}

// Kick off the first database load on startup
loadForumPosts();

// Process form submissions over the network pipe
forumForm.addEventListener('submit', async (event) => {
    event.preventDefault(); 
    
    if (honeypotField.value !== "") {
        alert("Submission Blocked: Honeypot triggered.");
        return;
    }

    const totalTimeElapsed = pageLoadTime ? (Date.now() - pageLoadTime) / 1000 : 0;
    if (textWasPasted) { alert("Submission Blocked: Paste detected."); return; }
    if (totalTimeElapsed < 4) { alert("Submission Blocked: Impossibly fast post time."); return; }
    if (mouseMovementsRecorded === 0) { alert("Submission Blocked: No interaction track detected."); return; }
    if (keystrokeGaps.length < 5) { alert("Submission Blocked: Type a longer message."); return; }

    let perfectIntervals = 0;
    for (let i = 2; i < keystrokeGaps.length; i++) {
        if (keystrokeGaps[i] === keystrokeGaps[i - 1]) perfectIntervals++;
    }
    let uniformityRatio = perfectIntervals / (keystrokeGaps.length - 2);
    if (uniformityRatio > 0.60) { alert("Submission Blocked: Automation detected."); return; }

    let authorName = nicknameInput.value.trim() || "Anonymous";

    // --- SUCCESS PATH: HUMAN VERIFIED & TRANSMITTED TO CLOUD ---
    const { error } = await supabase
        .from('posts')
        .insert([
            { thread: topicSelect.value, author: authorName, content: textBox.value }
        ]);

    if (error) {
        alert("Database Error: Could not save post to cloud. Check console logs.");
        console.error("Supabase Error:", error.message);
        return;
    }

    // Refresh view states from the internet
    loadForumPosts();
    resetTelemetryConsole();
});
