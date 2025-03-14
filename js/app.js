// DOM Elements
const tabs = document.querySelectorAll('.nav-tab');
// Remove tab indicator reference
// const tabIndicator = document.querySelector('.tab-indicator');
const sections = document.querySelectorAll('.section');
const quickActionButtons = document.querySelectorAll('.action-btn');
const durationButtons = document.querySelectorAll('.duration-btn');
const customDurationInput = document.querySelector('.custom-duration-input');
const startTimerButton = document.getElementById('start-timer');
const stopTimerButton = document.getElementById('stop-timer');
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const progressRingCircle = document.querySelector('.progress-ring-circle');
const emotionForm = document.getElementById('emotion-form');
const emotionSelect = document.getElementById('emotion-select');
const logEntriesContainer = document.getElementById('log-entries');
const tipsCategoryButtons = document.querySelectorAll('.category-btn');
const tipsContainer = document.querySelector('.tips-container');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const notificationClose = document.getElementById('notification-close');
const shareButtons = document.querySelectorAll('.share-btn');

// App state
let timerInterval;
let timerDuration = 5; // Default 5 minutes
let timerEndTime;
let selectedDurationButton;
let totalTimerSeconds = 0; // Store the total seconds for progress calculation

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Remove this line as we don't need to position the tab indicator anymore
    // positionTabIndicator(document.querySelector('.nav-tab.active'));
    
    // Initialize emotional log display
    displayEmotionalLogs();
    
    // Initialize tips display
    displayTips('quick');
    
    // Select default duration button
    selectDurationButton(document.querySelector('.duration-btn[data-duration="5"]'));
    
    // Check for any existing timer
    checkExistingTimer();
    
    // Initialize progress ring
    if (progressRingCircle) {
        const circumference = 2 * Math.PI * 120; // 2πr where r=120
        progressRingCircle.style.strokeDasharray = `${circumference}`;
        progressRingCircle.style.strokeDashoffset = `${circumference}`;
    }
});

// ===== NAVIGATION =====
// Remove or modify the position tab indicator function
// function positionTabIndicator(activeTab) {
//     if (!tabIndicator || !activeTab) return;
//     
//     const tabWidth = activeTab.offsetWidth;
//     const tabLeft = activeTab.offsetLeft;
//     
//     tabIndicator.style.width = `${tabWidth}px`;
//     tabIndicator.style.transform = `translateX(${tabLeft}px)`;
// }

// Update the navigation logic to not use the tab indicator
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and add to clicked tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // No need to position the tab indicator anymore
        // positionTabIndicator(tab);
        
        // Show corresponding section
        const tabId = tab.dataset.tab;
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === tabId) {
                section.classList.add('active');
            }
        });
    });
});

// Quick action buttons
quickActionButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.dataset.goto;
        
        // Activate the target tab
        const tab = document.querySelector(`.nav-tab[data-tab="${targetTab}"]`);
        tab.click();
    });
});

// Handle window resize for tab indicator
window.addEventListener('resize', () => {
    // Remove this line as we don't need to position the tab indicator anymore
    // positionTabIndicator(document.querySelector('.nav-tab.active'));
});

// ===== TIMER FUNCTIONALITY =====
// Duration button selection
durationButtons.forEach(button => {
    button.addEventListener('click', () => {
        const duration = button.dataset.duration;
        
        if (duration === 'custom') {
            // Show custom duration input
            customDurationInput.style.display = 'flex';
            selectDurationButton(button);
            timerDuration = parseInt(document.getElementById('custom-minutes').value, 10);
        } else {
            // Hide custom duration input
            customDurationInput.style.display = 'none';
            selectDurationButton(button);
            timerDuration = parseInt(duration, 10);
        }
        
        // Update timer display
        updateTimerDisplay(timerDuration * 60);
    });
});

// Custom duration input
document.getElementById('custom-minutes').addEventListener('input', (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
        timerDuration = value;
        updateTimerDisplay(timerDuration * 60);
    }
});

// Start timer
startTimerButton.addEventListener('click', () => {
    startTimer(timerDuration);
});

// Stop timer
stopTimerButton.addEventListener('click', () => {
    stopTimer();
});

// Timer functions
function selectDurationButton(button) {
    if (selectedDurationButton) {
        selectedDurationButton.classList.remove('active');
    }
    button.classList.add('active');
    selectedDurationButton = button;
}

function startTimer(minutes) {
    stopTimer(); // Clear any existing timer
    
    const durationInSeconds = minutes * 60;
    totalTimerSeconds = durationInSeconds; // Store total seconds for progress calculation
    
    // Calculate end time
    const now = new Date();
    timerEndTime = new Date(now.getTime() + durationInSeconds * 1000);
    
    // Save to local storage
    localStorage.setItem('timerEndTime', timerEndTime.toISOString());
    localStorage.setItem('timerDuration', minutes);
    localStorage.setItem('totalTimerSeconds', totalTimerSeconds);
    
    // Update UI
    startTimerButton.disabled = true;
    stopTimerButton.disabled = false;
    durationButtons.forEach(btn => btn.disabled = true);
    document.getElementById('custom-minutes').disabled = true;
    
    // Start the countdown
    updateTimerInterval();
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerEndTime = null;
    
    // Clear from local storage
    localStorage.removeItem('timerEndTime');
    localStorage.removeItem('timerDuration');
    localStorage.removeItem('totalTimerSeconds');
    
    // Update UI
    startTimerButton.disabled = false;
    stopTimerButton.disabled = true;
    durationButtons.forEach(btn => btn.disabled = false);
    document.getElementById('custom-minutes').disabled = false;
    
    // Reset display to selected duration
    updateTimerDisplay(timerDuration * 60);
    
    // Reset progress ring
    if (progressRingCircle) {
        const circumference = 2 * Math.PI * 120;
        progressRingCircle.style.strokeDashoffset = `${circumference}`;
    }
}

function updateTimerInterval() {
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        const secondsLeft = updateTimerDisplay();
        
        if (secondsLeft <= 0) {
            stopTimer();
            timerComplete();
        }
    }, 1000);
}

function updateTimerDisplay(overrideSeconds) {
    let secondsRemaining;
    
    if (overrideSeconds !== undefined) {
        secondsRemaining = overrideSeconds;
    } else if (timerEndTime) {
        const now = new Date();
        secondsRemaining = Math.round((timerEndTime - now) / 1000);
        
        if (secondsRemaining < 0) {
            secondsRemaining = 0;
        }
    } else {
        secondsRemaining = timerDuration * 60;
    }
    
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    
    minutesDisplay.textContent = String(minutes).padStart(2, '0');
    secondsDisplay.textContent = String(seconds).padStart(2, '0');
    
    // Update progress ring
    if (progressRingCircle && timerEndTime) {
        updateProgressRing(secondsRemaining);
    }
    
    return secondsRemaining;
}

function updateProgressRing(secondsRemaining) {
    const storedTotalSeconds = parseInt(localStorage.getItem('totalTimerSeconds'), 10) || totalTimerSeconds;
    const progress = secondsRemaining / storedTotalSeconds;
    const circumference = 2 * Math.PI * 120; // 2πr where r=120
    const offset = circumference * (1 - progress);
    
    progressRingCircle.style.strokeDashoffset = offset;
    
    // Change color based on remaining time
    if (progress <= 0.25) {
        progressRingCircle.style.stroke = 'var(--error)';
    } else if (progress <= 0.5) {
        progressRingCircle.style.stroke = 'var(--warning)';
    } else {
        progressRingCircle.style.stroke = 'var(--primary)';
    }
}

function checkExistingTimer() {
    const savedEndTime = localStorage.getItem('timerEndTime');
    
    if (savedEndTime) {
        const endTime = new Date(savedEndTime);
        const now = new Date();
        
        if (endTime > now) {
            // There's an active timer, restore it
            timerEndTime = endTime;
            timerDuration = parseInt(localStorage.getItem('timerDuration'), 10) || 5;
            totalTimerSeconds = parseInt(localStorage.getItem('totalTimerSeconds'), 10) || (timerDuration * 60);
            
            // Find and select the appropriate duration button
            const durationBtn = document.querySelector(`.duration-btn[data-duration="${timerDuration}"]`);
            if (durationBtn) {
                selectDurationButton(durationBtn);
            } else {
                // Must be a custom duration
                const customBtn = document.querySelector('.duration-btn[data-duration="custom"]');
                selectDurationButton(customBtn);
                document.getElementById('custom-minutes').value = timerDuration;
                customDurationInput.style.display = 'flex';
            }
            
            // Start the timer
            startTimerButton.disabled = true;
            stopTimerButton.disabled = false;
            durationButtons.forEach(btn => btn.disabled = true);
            document.getElementById('custom-minutes').disabled = true;
            
            updateTimerInterval();
        } else {
            // Timer has expired
            localStorage.removeItem('timerEndTime');
            localStorage.removeItem('timerDuration');
            localStorage.removeItem('totalTimerSeconds');
        }
    }
}

function timerComplete() {
    // Show notification
    showNotification('Break time is over! 🕒');
    
    // Play sound (if enabled by user interaction)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnQGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YU8GAAB/f39/f39/f38AAIB/gH+Af4B/gH8AAH9/f39/f39/fwAAgH+Af4B/gH+AfwAAf39/f39/f39/AIB/f4B/gH+Af4B/AH9/f39/f39/f38AgH+Af4B/gH+Af4AAf39/f39/f39/fwCAf4B/gH+Af4B/gAB/f39/f39/f39/AIB/gH+Af4B/gH+AAH9/f39/f39/f38AgH+Af4B/gH+Af4AAf39/f39/f39/fwCAf4B/gH+Af4B/AICAf4CAf4B/gH+Af3+Af39/gH9/f39/f4B/f39/f39/gH+Af4B/gH+Af3+Af39/f39/f39/gH+Af4B/gH+Af3+Af39/f39/f39/gH+Af4B/gH+Af3+Af39/f39/f39/gH+Af4B/gH+Af3+Af39/f39/f39/gH+Af4B/gH+Af3+Af39/f39/f39/gH+Af4B/gH+Af4b/nf+8/+r/DAAfABwABwDO/4X/Nf/n/pr+X/5M/nL+w/5s/zkAIAFMAk0DTgT5BCEFtgTnA6YCGwGC//X9jfxJ++X6y/vy/IH+NABtAdAC1wOABIEEKgSvA8MCngFDAAf/5f3s/D78Gfwq/Iv8Cv2l/R7+bP5b/uL9LP2Z/FH8tPyI/bX+BAAtASECxQILAwoDbQKbAZMARf/j/Zn8Z/t0+vr5Efqb+m/7xvxX/r7/FwElAhEDxgM2BD4EOgQHBAMD0gF6AAX/of16/F37aPqb+j37WPzp/bL/awHdAhkEEgWgBS4GZwZVBgMGcAWPA3oBm/9e/kH9o/w//Ar84ftS/KL8hP21/v3/NgFOAlMD1wMTBOsDLQPHAiwCmQEHAYMA9P9X/wX/wP5w/kH+C/4w/oL+tv7w/jb/kP8TAHgAywDpAP4AIAFkAZwB4QE0Am0CoQKtApkCZQIfAtwBgwFAARQB9ADUAJcARAAUAM3/ff8Y/6r+Tv4Y/vL93P3i/eT96P3y/fT99P3o/dP9zP3X/ez9/v0W/ij+Q/5n/o7+nP6W/nr+Z/5R/jL+D/76/ef94f3i/ej9Av4N/hn+Hf4X/gr+/f0A/gf+HP4x/kb+Wf5c/lX+Qf43/jL+L/4t/if+HP4i/iv+Ov5G/k7+Yf5k/mP+Wf5S/lP+WP5m/nf+hf6O/pr+lv6P/oX+ef50/nn+hf6N/pP+kf6L/nv+ZP5R/kL+Qf5Q/mX+df6E/pT+lf6P/oP+df5o/mP+X/5o/nj+hf6T/pr+nP6Q/n7+af5c/lr+YP5t/nj+g/6Q/pf+lP6K/nj+Z/5L/jf+Iv4d/iD+Lf47/k7+av6D/p3+sf65/rj+sP6i/pL+gf52/m7+cf5//o7+o/64/s7+4P7l/t7+0f6//qn+kP5y/ln+SP5H/ln+dP6Q/rH+0v7y/g//G/8X/wf/7v7S/rv+qf6Z/pP+mf6g/qr+vP7P/uP+9v7//gX/CP8G/wD/9P7o/tv+zv7D/r7+wf7K/tX+4f7v/v3+B/8I/wf/Bv8D/wL///7+/vv++f75/vz+//4E/wb/Cf8K/wr/Cf8H/wT///79/vr++f74/vj++P75/vz+/f7//gP/Bv8H/wj/CP8H/wT/AP/9/vj+9P7v/uz+7P7v/vH+9f75/vz+AP8D/wX/CP8J/wn/CP8F/wL/AP/9/vr++P74/vf++P77/v3+//4B/wP/BP8E/wX/A/8B//7++v73/vX+8/7y/vP+9f74/vv+/v4B/wT/BP8F/wT/Av8A//3++/76/vn++f75/vr+/P7+/v/+Af8C/wP/A/8C/wL/Af///v7+/f78/vv++/78/v3+/v7//gD/Af8B/wL/Av8B/wH/AP/+/v7+/f78/vz+/P79/v7+/v7//v/+Af8B/wH/Af8B/wH/AP///v7+/v7+/v7+/v7+/v7+/v7+/v///wAAAAAAAAAAAAAAAAAAAAAAAAAA');
        audio.play();
    } catch (e) {
        console.error('Sound playback failed:', e);
    }
}

// ===== EMOTIONAL LOGGING =====
// Submit emotion form
emotionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const emotionOption = emotionSelect.options[emotionSelect.selectedIndex];
    const emotion = emotionOption.value;
    const emoji = emotionOption.dataset.emoji;
    const notes = document.getElementById('notes-input').value;
    const timestamp = new Date().toISOString();
    
    // Save log entry
    saveEmotionalLog(emotion, emoji, notes, timestamp);
    
    // Reset form
    emotionForm.reset();
    
    // Show notification
    showNotification('Emotion logged successfully! 👍');
    
    // Update display
    displayEmotionalLogs();
});

// Save emotional log to local storage
function saveEmotionalLog(emotion, emoji, notes, timestamp) {
    const logs = getEmotionalLogs();
    logs.push({ emotion, emoji, notes, timestamp });
    localStorage.setItem('emotionalLogs', JSON.stringify(logs));
}

// Get emotional logs from local storage
function getEmotionalLogs() {
    const logs = localStorage.getItem('emotionalLogs');
    return logs ? JSON.parse(logs) : [];
}

// Display emotional logs
function displayEmotionalLogs() {
    const logs = getEmotionalLogs();
    
    if (logs.length === 0) {
        logEntriesContainer.innerHTML = '<div class="empty-log">No emotion logs yet</div>';
        return;
    }
    
    // Sort logs by date (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    logEntriesContainer.innerHTML = logs.map(log => {
        const date = new Date(log.timestamp);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        return `
            <div class="log-entry">
                <div class="log-entry-header">
                    <div class="log-entry-emotion">
                        <span class="log-entry-emotion-emoji">${log.emoji || ''}</span>
                        ${log.emotion}
                    </div>
                    <div class="log-entry-date">
                        <i class="far fa-clock"></i> ${formattedDate}
                    </div>
                </div>
                ${log.notes ? `<div class="log-entry-notes">${log.notes}</div>` : ''}
            </div>
        `;
    }).join('');
}

// ===== TILT MANAGEMENT TIPS =====
// Category buttons
tipsCategoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        tipsCategoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const category = button.dataset.category;
        displayTips(category);
    });
});

// Display tips by category
function displayTips(category) {
    const tips = getTipsByCategory(category);
    
    tipsContainer.innerHTML = tips.map(tip => `
        <div class="tip">
            <h3>
                <span class="tip-emoji">${tip.emoji}</span>
                ${tip.title}
            </h3>
            <p>${tip.content}</p>
            ${tip.link ? `<p><a href="${tip.link}" target="_blank" rel="noopener">Learn more</a></p>` : ''}
        </div>
    `).join('');
}

// Get tips by category
function getTipsByCategory(category) {
    const allTips = {
        quick: [
            {
                title: 'Take a Deep Breath',
                emoji: '🧘',
                content: 'When you feel tilt coming on, pause and take 5 deep breaths. Inhale for 4 counts, hold for 4, exhale for 6.'
            },
            {
                title: 'Step Away',
                emoji: '🚶',
                content: 'If you notice yourself tilting, commit to a 5-minute break away from the game. Use the timer in this app.'
            },
            {
                title: 'Focus on Decisions, Not Results',
                emoji: '🎯',
                content: 'Remind yourself that poker is about making good decisions. A bad beat doesn\'t mean you made a mistake.'
            },
            {
                title: 'Physical Reset',
                emoji: '💪',
                content: 'Stand up, stretch, shake out your arms and shoulders. Physical movement can help reset your mental state.'
            }
        ],
        prevention: [
            {
                title: 'Set Session Limits',
                emoji: '⏱️',
                content: 'Before you start playing, set clear time and loss limits. Stick to them regardless of how you\'re feeling.'
            },
            {
                title: 'Mindfulness Practice',
                emoji: '🧠',
                content: 'Regular mindfulness meditation can improve your emotional control. Even 5 minutes daily can help.'
            },
            {
                title: 'Study Your Triggers',
                emoji: '📝',
                content: 'Use the Emotion Log to identify patterns in what causes your tilt. Awareness is the first step to prevention.'
            },
            {
                title: 'Bankroll Management',
                emoji: '💰',
                content: 'Play at stakes where the money doesn\'t affect your emotional state. If losses hurt too much, you\'re playing too high.'
            },
            {
                title: 'Pre-session Visualization',
                emoji: '🌈',
                content: 'Before playing, visualize yourself handling tough situations calmly. Mental rehearsal builds resilience.'
            }
        ],
        recovery: [
            {
                title: 'Analyze Without Judgment',
                emoji: '🔍',
                content: 'After a tilting session, review what happened objectively. Focus on learning, not criticizing yourself.'
            },
            {
                title: 'Talk It Out',
                emoji: '💬',
                content: 'Discuss tough hands with poker friends. Verbalization helps process emotions and gain perspective.'
            },
            {
                title: 'Reframe the Narrative',
                emoji: '🔄',
                content: 'Instead of "I got unlucky," try "Variance is part of the game, and I can handle it."'
            },
            {
                title: 'Take a Longer Break',
                emoji: '🏝️',
                content: 'If tilt is severe, consider taking a day off from poker. Return only when you feel emotionally balanced.'
            },
            {
                title: 'Physical Exercise',
                emoji: '🏃',
                content: 'Exercise releases endorphins that can help counteract stress hormones produced during tilt episodes.'
            }
        ]
    };
    
    return allTips[category] || [];
}

// ===== NOTIFICATIONS =====
function showNotification(message) {
    notificationMessage.textContent = message;
    notification.classList.add('show');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        hideNotification();
    }, 3000);
}

function hideNotification() {
    notification.classList.remove('show');
}

notificationClose.addEventListener('click', hideNotification);

// ===== SOCIAL SHARING =====
shareButtons.forEach(button => {
    button.addEventListener('click', () => {
        const platform = button.dataset.platform;
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent('Check out TiltApp - Emotion management for poker players!');
        
        let shareUrl;
        
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                break;
            case 'instagram':
                // Instagram doesn't have a direct link sharing API like Twitter
                // Instead we'll show instructions or open Instagram app
                showNotification('To share on Instagram, take a screenshot and post it to your story or feed! 📱');
                
                // Attempt to open Instagram app
                setTimeout(() => {
                    window.open('instagram://');
                }, 1000);
                return;
            case 'copy':
                navigator.clipboard.writeText(window.location.href)
                    .then(() => {
                        showNotification('Link copied to clipboard! 📋');
                    })
                    .catch(err => {
                        console.error('Failed to copy link:', err);
                        showNotification('Failed to copy link. 😕');
                    });
                return;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    });
}); 