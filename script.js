const forumForm = document.getElementById('forumForm');
const textBox = document.getElementById('forum-post');
const honeypotField = document.getElementById('honeypot-field');
const topicSelect = document.getElementById('topic-select');
const nicknameInput = document.getElementById('user-nickname');
const forumFeed = document.getElementById('forum-feed');
const currentThreadTitle = document.getElementById('current-thread-title');

// Dashboard UI Hook Elements
const statPaste = document.getElementById('stat-paste');
const statTimer = document.getElementById('stat-timer');
const statKeys = document.getElementById('stat-keys');
const statUniformity = document.getElementById('stat-uniformity');

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

// Capture movement coordinates
window.addEventListener('mousemove', () => {
    mouseMovementsRecorded++;
});

textBox.addEventListener('paste', () => {
    textWasPasted = true;
    statPaste.textContent = "TRUE";
    statPaste.className = "badge badge-red";
    
    if (!isTimerRunning) {
        startCompositionTimer();
    }
});

textBox.addEventListener('keydown', () => {
    if (!isTimerRunning) {
        startCompositionTimer();
    }

    const currentTime = Date.now();
    const gap = currentTime - lastKeyTime;
    
    if (keystrokeGaps.length < 50) { 
        keystrokeGaps.push(gap);
    }
    
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

// --- LOCAL STORAGE FEED TRACKING SYSTEM ---

function loadForumPosts() {
    const posts = JSON.parse(localStorage.getItem('forum_posts')) || [];
    const selectedThread = topicSelect.value;
    
    currentThreadTitle.textContent = selectedThread;
    
    const filteredPosts = posts.filter(post => post.thread === selectedThread);
    
    if (filteredPosts.length === 0) {
        forumFeed.innerHTML = `<div class="no-posts">No human content posted inside "${escapeHTML(selectedThread)}" yet...</div>`;
        return;
    }
    
    forumFeed.innerHTML = '';
    filteredPosts.reverse().forEach(post => {
        const item = document.createElement('div');
        item.className = 'post-item';
        item.innerHTML = `
            <div class="post-meta">
                <span>By: <span class="post-author">${escapeHTML(post.author)}</span></span>
                <span>${post.timestamp}</span>
            </div>
            <div class="post-content">${escapeHTML(post.content)}</div>
        `;
        forumFeed.appendChild(item);
    });
}

topicSelect.addEventListener('change', loadForumPosts);

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

function resetTelemetryConsole() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
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

// Initial engine activation layout map triggers cleanly
loadForumPosts();

// --- RESTORED FORM SUBMISSION WITH LOCAL STORAGE SAVING ---
forumForm.addEventListener('submit', (event) => {
    event.preventDefault(); 
    
    if (honeypotField.value !== "") {
        alert("Submission Blocked: Honeypot triggered.");
        return;
    }

    const totalTimeElapsed = pageLoadTime ? (Date.now() - pageLoadTime) / 1000 : 0;

    if (textWasPasted) {
        alert("Submission Blocked: AI/Bots love copying and pasting.");
        return;
    }

    if (totalTimeElapsed < 4) {
        alert("Submission Blocked: Impossibly fast post time. Humans need time to think and type.");
        return;
    }

    if (mouseMovementsRecorded === 0) {
        alert("Submission Blocked: No mouse cursor track detected.");
        return;
    }

    if (keystrokeGaps.length < 5) {
        alert("Submission Blocked: Please type a longer message.");
        return;
    }

    let perfectIntervals = 0;
    for (let i = 2; i < keystrokeGaps.length; i++) {
        if (keystrokeGaps[i] === keystrokeGaps[i - 1]) perfectIntervals++;
    }

    let uniformityRatio = perfectIntervals / (keystrokeGaps.length - 2);

    if (uniformityRatio > 0.60) {
        alert("Submission Blocked: Automation detected.");
        return;
    }

    // Capture author handle text element string properties cleanly
    let authorName = nicknameInput.value.trim();
    if (authorName === "") {
        authorName = "Anonymous";
    }

    const newPost = {
        thread: topicSelect.value, 
        author: authorName,
        content: textBox.value,
        timestamp: new Date().toLocaleString()
    };

    // Grab existing storage array, push the fresh entry, commit it back to memory
    const storedPosts = JSON.parse(localStorage.getItem('forum_posts')) || [];
    storedPosts.push(newPost);
    localStorage.setItem('forum_posts', JSON.stringify(storedPosts));

    // Refresh display feeds and scrub local tracing variables seamlessly
    loadForumPosts();
    resetTelemetryConsole();
});
