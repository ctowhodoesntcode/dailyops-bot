const { ipcRenderer } = require('electron');

// Default Schedule Based on Prompt Requirements
const schedule = [
    { start: "08:00", end: "09:30", title: "OLY Morning Operations", desc: "Reply to inquiries, Check Lemmor's report, Review client messages & tickets, Check forum/platforms, Handle urgent updates." },
    { start: "09:30", end: "10:00", title: "Breakfast Break", desc: "Eat breakfast, Rest for a while, Prepare for focused work." },
    { start: "10:00", end: "12:00", title: "PDFScanAccess Work", desc: "R&D with DeynDev, Improve features, Marketing & bump posts, Research better systems, Study competitors/ideas." },
    { start: "12:00", end: "13:30", title: "Lunch and Rest Time", desc: "Eat lunch, Relax, Play or chill, Recharge before working again." },
    { start: "13:30", end: "17:00", title: "OLY + PDFScanAccess Main Work", desc: "OLY: Improve scripts/systems, Forum engagement, Workflow. PDFScanAccess: Product improvement, Marketing, Content/messaging, R&D." },
    { start: "17:00", end: "19:00", title: "Dinner + Light Research", desc: "Eat dinner, Chill and rest, Do light research, Prepare ideas for Cefiro." },
    { start: "19:30", end: "23:30", title: "Cefiro Growth Work", desc: "Research marketing, Recommend systems, Improve organization workflow & conversion, Study improvements, Plan offers/sales." }
];

let lastView = 'setup-view';

document.getElementById('closeBtn').addEventListener('click', () => ipcRenderer.send('close-app'));

document.getElementById('minimizeBtn').addEventListener('click', () => {
    document.getElementById('app-container').classList.add('is-bubble');
    lastView = document.querySelector('.view.active').id;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('bubble-view').classList.add('active');
    // Using 120x120 to leave plenty of room for CSS box-shadow glow
    ipcRenderer.send('resize-window', { width: 120, height: 120, isBubble: true });
});

const bubbleDiv = document.querySelector('.bubble-content');

// Native click/dblclick expands the app flawlessly
const expandApp = () => {
    document.getElementById('app-container').classList.remove('is-bubble');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(lastView).classList.add('active');
    ipcRenderer.send('resize-window', { width: 380, height: 600, isBubble: false });
    
    // Clear notification badge
    document.getElementById('notif-badge').style.display = 'none';
    document.getElementById('notif-badge').textContent = '0';
};

bubbleDiv.addEventListener('click', expandApp);
bubbleDiv.addEventListener('dblclick', expandApp);

let timerInterval;
let currentTaskIndex = -1;
let customOps = []; // Store custom checklist tasks

// Render custom tasks list
function renderOps() {
    const setupList = document.getElementById('setup-ops-list');
    const trackerList = document.getElementById('tracker-ops-list');
    
    if (customOps.length === 0) {
        setupList.innerHTML = `<em style="color:var(--text-secondary); opacity:0.7;">No custom tasks yet.</em>`;
        trackerList.innerHTML = `<em style="color:var(--text-secondary); opacity:0.7;">No custom tasks added for today.</em>`;
        return;
    }

    // Render for Setup Mode (allowing deletes)
    setupList.innerHTML = customOps.map((op, i) => {
        let timeStr = '';
        if (op.time && op.endTime) timeStr = `${op.time} - ${op.endTime}`;
        else if (op.time) timeStr = op.time;
        else if (op.endTime) timeStr = `Until ${op.endTime}`;
        
        return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding: 6px 10px; background: rgba(0,0,0,0.2); border-radius: 6px;">
           <span class="${op.done ? 'done-text' : ''}" style="color:var(--text-primary);">- <strong style="color:var(--accent);">${timeStr ? timeStr+' ' : ''}</strong>${op.text}</span>
           <button type="button" onclick="removeOp(${i})" style="background:transparent; border:none; color:#ef4444; cursor:pointer; padding:4px;"><i class="fa-solid fa-trash"></i></button>
        </div>
        `;
    }).join('');

    // Render for Tracker Mode (Checklist logic)
    trackerList.innerHTML = customOps.map((op, i) => {
        let timeStr = '';
        if (op.time && op.endTime) timeStr = `${op.time} - ${op.endTime}`;
        else if (op.time) timeStr = op.time;
        else if (op.endTime) timeStr = `Until ${op.endTime}`;
        
        return `
        <label style="display:flex; align-items:center; gap:12px; margin-bottom:10px; cursor:pointer;" onclick="event.stopPropagation()">
            <input type="checkbox" onchange="toggleOp(${i})" ${op.done ? 'checked' : ''}>
            <span class="${op.done ? 'done-text' : ''}" style="color:var(--text-primary);"><strong style="color:var(--accent);">${timeStr ? timeStr+' ' : ''}</strong>${op.text}</span>
        </label>
        `;
    }).join('');
}

window.removeOp = (index) => {
    customOps.splice(index, 1);
    renderOps();
};

window.toggleOp = (index) => {
    customOps[index].done = !customOps[index].done;
    renderOps();
};

document.getElementById('ops-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('op-input');
    const timeInput = document.getElementById('op-time');
    const timeEndInput = document.getElementById('op-end-time');
    const val = input.value.trim();
    
    if (val) {
        let timeFormatted = '';
        let timeEndFormatted = '';
        if (timeInput.value) timeFormatted = formatTimeStr(timeInput.value);
        if (timeEndInput.value) timeEndFormatted = formatTimeStr(timeEndInput.value);
        
        customOps.push({ text: val, time: timeFormatted, endTime: timeEndFormatted, done: false });
        input.value = '';
        timeInput.value = '';
        timeEndInput.value = '';
        renderOps();
    }
});

// Initialize empty forms at startup
renderOps();

document.getElementById('exportBtn').addEventListener('click', () => {
    const focus = document.getElementById('today-focus').value;
    const notes = document.getElementById('end-shift-notes').value;
    
    let report = `DAILY OPS SHIFT REPORT - ${new Date().toLocaleDateString()}\n`;
    report += `====================================================\n\n`;
    report += `TODAY'S FOCUS:\n${focus}\n\n`;
    
    report += `CUSTOM TASKS & CHECKLIST:\n`;
    if (customOps.length === 0) {
        report += `- No custom tasks added.\n`;
    } else {
        customOps.forEach(op => {
            const status = op.done ? "[X]" : "[ ]";
            let timeStr = '';
            if (op.time && op.endTime) timeStr = ` (${op.time} - ${op.endTime})`;
            else if (op.time) timeStr = ` (${op.time})`;
            else if (op.endTime) timeStr = ` (Until ${op.endTime})`;
            
            report += `${status}${timeStr} ${op.text}\n`;
        });
    }
    
    report += `\nMAIN SCHEDULE RUN:\n`;
    schedule.forEach(s => {
        report += `- ${formatTimeStr(s.start)} - ${formatTimeStr(s.end)}: ${s.title}\n`;
    });
    
    report += `\nEND SHIFT NOTES:\n${notes || 'No notes taken.'}\n`;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Shift_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

document.getElementById('startBtn').addEventListener('click', () => {
    document.getElementById('setup-view').classList.remove('active');
    document.getElementById('tracker-view').classList.add('active');
    lastView = 'tracker-view';
    renderTimeline();
    startTracker();
});

document.getElementById('backBtn').addEventListener('click', () => {
    clearInterval(timerInterval);
    document.getElementById('tracker-view').classList.remove('active');
    document.getElementById('setup-view').classList.add('active');
    lastView = 'setup-view';
});

// Edit Schedule Logic
function renderEditSchedule() {
    const list = document.getElementById('edit-schedule-list');
    list.innerHTML = schedule.map((item, i) => `
        <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                <input type="time" id="edit-start-${i}" value="${item.start}" style="flex: 1; padding: 6px; border-radius: 4px; background: rgba(255,255,255,0.05); color: #fff; border: none;">
                <span style="align-self: center;">to</span>
                <input type="time" id="edit-end-${i}" value="${item.end}" style="flex: 1; padding: 6px; border-radius: 4px; background: rgba(255,255,255,0.05); color: #fff; border: none;">
                <button type="button" onclick="removeScheduleItem(${i})" style="background:transparent; border:none; color:#ef4444; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>
            <input type="text" id="edit-title-${i}" value="${item.title}" placeholder="Main Task Title" style="width: 100%; padding: 8px; margin-bottom: 8px; border-radius: 4px; background: rgba(255,255,255,0.05); color: #fff; border: none;">
            <textarea id="edit-desc-${i}" rows="2" placeholder="Description/Tasks..." style="width: 100%; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.05); color: var(--text-secondary); border: none; resize: vertical;">${item.desc}</textarea>
        </div>
    `).join('');
}

window.removeScheduleItem = (i) => {
    schedule.splice(i, 1);
    renderEditSchedule();
};

document.getElementById('addBlockBtn').addEventListener('click', () => {
    schedule.push({ start: "12:00", end: "13:00", title: "New Task Block", desc: "Notes here..." });
    renderEditSchedule();
    // Scroll to bottom
    const list = document.getElementById('edit-schedule-list');
    list.scrollTop = list.scrollHeight;
});

document.getElementById('editBtn').addEventListener('click', () => {
    renderEditSchedule();
    document.getElementById('setup-view').classList.remove('active');
    document.getElementById('edit-schedule-view').classList.add('active');
    lastView = 'edit-schedule-view';
});

document.getElementById('cancelScheduleBtn').addEventListener('click', () => {
    document.getElementById('edit-schedule-view').classList.remove('active');
    document.getElementById('setup-view').classList.add('active');
    lastView = 'setup-view';
});

document.getElementById('saveScheduleBtn').addEventListener('click', () => {
    // Collect specific inputs back to the array
    for (let i = 0; i < schedule.length; i++) {
        schedule[i].start = document.getElementById(`edit-start-${i}`).value;
        schedule[i].end = document.getElementById(`edit-end-${i}`).value;
        schedule[i].title = document.getElementById(`edit-title-${i}`).value;
        schedule[i].desc = document.getElementById(`edit-desc-${i}`).value;
    }
    
    // Sort array by start time
    schedule.sort((a, b) => a.start.localeCompare(b.start));
    
    document.getElementById('edit-schedule-view').classList.remove('active');
    document.getElementById('setup-view').classList.add('active');
    lastView = 'setup-view';
});

function renderTimeline() {
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
    
    schedule.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.id = `timeline-item-${index}`;
        
        div.innerHTML = `
            <div class="timeline-time">${formatTimeStr(item.start)} - ${formatTimeStr(item.end)}</div>
            <div class="timeline-title">${item.title}</div>
        `;
        timeline.appendChild(div);
    });
}

function startTracker() {
    updateTracker();
    timerInterval = setInterval(updateTracker, 1000);
}

function parseTime(timeStr) {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0).getTime();
}

function formatTimeStr(timeStr) {
    let [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function updateTracker() {
    const now = new Date();
    const day = now.getDay();

    // Check if weekend
    if (day === 0 || day === 6) { // 0 = Sunday, 6 = Saturday
        document.getElementById('current-title').textContent = "Weekend!";
        document.getElementById('current-desc').textContent = "It's the weekend. Rest and recharge for Monday!";
        document.getElementById('progress').style.width = `100%`;
        document.getElementById('countdown').textContent = "00:00:00";
        return;
    }

    const nowTime = now.getTime();
    let foundCurrent = false;

    for (let i = 0; i < schedule.length; i++) {
        const item = schedule[i];
        const startTime = parseTime(item.start);
        const endTime = parseTime(item.end);

        // Styling past items
        const tlItem = document.getElementById(`timeline-item-${i}`);
        if(tlItem) {
            tlItem.classList.remove('active', 'past');
            if (nowTime > endTime) {
                tlItem.classList.add('past');
            } else if (nowTime >= startTime && nowTime <= endTime) {
                tlItem.classList.add('active');
            }
        }

        // Check active bounds
        if (nowTime >= startTime && nowTime <= endTime) {
            foundCurrent = true;
            
            if (currentTaskIndex !== i) {
                currentTaskIndex = i;
                notifyTransition(item.title);
            }

            document.getElementById('current-title').textContent = item.title;
            document.getElementById('current-desc').textContent = item.desc;

            // Math for Progress and Countdown
            const totalDuration = endTime - startTime;
            const elapsed = nowTime - startTime;
            const remaining = endTime - nowTime;

            const progressPct = (elapsed / totalDuration) * 100;
            document.getElementById('progress').style.width = `${progressPct}%`;
            
            document.getElementById('countdown').textContent = formatCountdown(remaining);
            break;
        }
    }

    if (!foundCurrent) {
        // If outside of schedule, find the next one
        let nextItem = null;
        for (let i = 0; i < schedule.length; i++) {
            if (nowTime < parseTime(schedule[i].start)) {
                nextItem = schedule[i];
                break;
            }
        }

        if (nextItem) {
             document.getElementById('current-title').textContent = "Free Time / Waiting";
             document.getElementById('current-desc').textContent = `Next up: ${nextItem.title}`;
             document.getElementById('progress').style.width = `0%`;
             document.getElementById('countdown').textContent = formatCountdown(parseTime(nextItem.start) - nowTime);
             currentTaskIndex = -1;
        } else {
             document.getElementById('current-title').textContent = "Day Complete!";
             document.getElementById('current-desc').textContent = "Great job today, Lej! Rest up.";
             document.getElementById('progress').style.width = `100%`;
             document.getElementById('countdown').textContent = "00:00:00";
             currentTaskIndex = -1;
        }
    }
}

function formatCountdown(ms) {
    if (ms < 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [hours, minutes, seconds]
        .map(val => val.toString().padStart(2, '0'))
        .join(':');
}

let audioCtx;

function notifyTransition(taskTitle) {
    ipcRenderer.send('show-notification', {
        title: "DailyOps Bot",
        body: `Time to switch to: ${taskTitle}`
    });
    
    // Increment notification badge
    const badge = document.getElementById('notif-badge');
    const currentCount = parseInt(badge.textContent || "0");
    badge.textContent = (currentCount + 1).toString();
    badge.style.display = 'flex';
    
    // Play custom alarm tone at 200% volume using Web Audio API
    try {
        const audio = new Audio('resources/Chinese%20Meme%20Ringtone%20Download.mp3');
        
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const source = audioCtx.createMediaElementSource(audio);
        const gainNode = audioCtx.createGain();
        // Set volume to 200%
        gainNode.gain.value = 2.0;
        
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        audio.play().catch(e => console.log('Audio play blocked or failed: ', e));
    } catch(err) {
        console.log(err);
    }
}
