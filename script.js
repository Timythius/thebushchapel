/**
 * The Bush Chapel - Interactive Features
 * Comment system, animations, and user interactions
 */

// ============================================
// Comment System
// ============================================

class CommentSystem {
    constructor(storageKey = 'bushchapel_comments') {
        this.storageKey = storageKey;
        this.comments = this.loadComments();
    }

    // Load comments from localStorage
    loadComments() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : {};
    }

    // Save comments to localStorage
    saveComments() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.comments));
    }

    // Get comments for a specific page
    getCommentsForPage(pageId) {
        return this.comments[pageId] || [];
    }

    // Add a new comment
    addComment(pageId, author, content) {
        if (!this.comments[pageId]) {
            this.comments[pageId] = [];
        }

        const comment = {
            id: Date.now(),
            author: author.trim(),
            content: content.trim(),
            date: new Date().toISOString(),
            replies: []
        };

        this.comments[pageId].unshift(comment);
        this.saveComments();
        return comment;
    }

    // Add a reply to a comment
    addReply(pageId, commentId, author, content) {
        const pageComments = this.comments[pageId];
        if (!pageComments) return null;

        const comment = pageComments.find(c => c.id === commentId);
        if (!comment) return null;

        const reply = {
            id: Date.now(),
            author: author.trim(),
            content: content.trim(),
            date: new Date().toISOString()
        };

        comment.replies.push(reply);
        this.saveComments();
        return reply;
    }

    // Format date for display
    formatDate(isoString) {
        const date = new Date(isoString);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-AU', options);
    }

    // Get comment count for a page
    getCommentCount(pageId) {
        const pageComments = this.comments[pageId] || [];
        let count = pageComments.length;
        pageComments.forEach(c => {
            count += c.replies ? c.replies.length : 0;
        });
        return count;
    }
}

// Initialize comment system
const commentSystem = new CommentSystem();

// ============================================
// Comment UI Functions
// ============================================

function initializeComments(pageId) {
    const commentsSection = document.querySelector('.comments-section');
    if (!commentsSection) return;

    // Update comment count
    updateCommentCount(pageId);

    // Render existing comments
    renderComments(pageId);

    // Set up form submission
    const form = document.getElementById('comment-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCommentSubmit(pageId);
        });
    }
}

function updateCommentCount(pageId) {
    const countEl = document.querySelector('.comment-count');
    if (countEl) {
        const count = commentSystem.getCommentCount(pageId);
        countEl.textContent = count;
    }
}

function renderComments(pageId) {
    const listEl = document.querySelector('.comments-list');
    if (!listEl) return;

    const comments = commentSystem.getCommentsForPage(pageId);

    if (comments.length === 0) {
        listEl.innerHTML = `
            <div class="no-comments">
                <p>Be the first to share your thoughts on this liturgy.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = comments.map(comment => createCommentHTML(comment, pageId)).join('');

    // Attach reply button handlers
    document.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const commentId = parseInt(btn.dataset.commentId);
            showReplyForm(pageId, commentId);
        });
    });
}

function createCommentHTML(comment, pageId) {
    const repliesHTML = comment.replies && comment.replies.length > 0
        ? `<div class="replies">
            ${comment.replies.map(reply => `
                <div class="comment reply">
                    <div class="comment-header">
                        <span class="comment-author">${escapeHTML(reply.author)}</span>
                        <span class="comment-date">${commentSystem.formatDate(reply.date)}</span>
                    </div>
                    <div class="comment-body">${escapeHTML(reply.content)}</div>
                </div>
            `).join('')}
           </div>`
        : '';

    return `
        <div class="comment" data-comment-id="${comment.id}">
            <div class="comment-header">
                <span class="comment-author">${escapeHTML(comment.author)}</span>
                <span class="comment-date">${commentSystem.formatDate(comment.date)}</span>
            </div>
            <div class="comment-body">${escapeHTML(comment.content)}</div>
            <div class="comment-reply">
                <button class="reply-btn" data-comment-id="${comment.id}">Reply</button>
            </div>
            <div class="reply-form-container" id="reply-form-${comment.id}"></div>
            ${repliesHTML}
        </div>
    `;
}

function handleCommentSubmit(pageId) {
    const nameInput = document.getElementById('comment-name');
    const contentInput = document.getElementById('comment-content');

    const name = nameInput.value.trim();
    const content = contentInput.value.trim();

    if (!name || !content) {
        alert('Please fill in both your name and comment.');
        return;
    }

    commentSystem.addComment(pageId, name, content);

    // Clear form
    nameInput.value = '';
    contentInput.value = '';

    // Re-render comments
    renderComments(pageId);
    updateCommentCount(pageId);

    // Show success message
    showNotification('Your reflection has been shared. Thank you!');
}

function showReplyForm(pageId, commentId) {
    // Remove any existing reply forms
    document.querySelectorAll('.reply-form-container').forEach(el => {
        el.innerHTML = '';
    });

    const container = document.getElementById(`reply-form-${commentId}`);
    if (!container) return;

    container.innerHTML = `
        <form class="comment-form reply-form" onsubmit="handleReplySubmit(event, '${pageId}', ${commentId})">
            <div class="form-group">
                <label for="reply-name-${commentId}">Your Name</label>
                <input type="text" id="reply-name-${commentId}" required>
            </div>
            <div class="form-group">
                <label for="reply-content-${commentId}">Your Reply</label>
                <textarea id="reply-content-${commentId}" rows="3" required></textarea>
            </div>
            <button type="submit" class="submit-comment">Post Reply</button>
            <button type="button" class="cancel-reply" onclick="cancelReply(${commentId})">Cancel</button>
        </form>
    `;

    // Focus on name input
    document.getElementById(`reply-name-${commentId}`).focus();
}

function handleReplySubmit(event, pageId, commentId) {
    event.preventDefault();

    const nameInput = document.getElementById(`reply-name-${commentId}`);
    const contentInput = document.getElementById(`reply-content-${commentId}`);

    const name = nameInput.value.trim();
    const content = contentInput.value.trim();

    if (!name || !content) {
        alert('Please fill in both fields.');
        return;
    }

    commentSystem.addReply(pageId, commentId, name, content);

    // Re-render comments
    renderComments(pageId);
    updateCommentCount(pageId);

    showNotification('Your reply has been posted.');
}

function cancelReply(commentId) {
    const container = document.getElementById(`reply-form-${commentId}`);
    if (container) {
        container.innerHTML = '';
    }
}

// ============================================
// Utility Functions
// ============================================

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <p>${message}</p>
    `;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4a7c59;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ============================================
// Newsletter Form
// ============================================

function initializeNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;

        // Here you would typically send this to your backend
        // For now, we'll just show a success message
        console.log('Newsletter signup:', email);

        showNotification('Thank you for joining the journey! Check your inbox soon.');
        form.reset();
    });
}

// ============================================
// Scroll Animations
// ============================================

function initializeScrollAnimations() {
    const fadeElements = document.querySelectorAll('.fade-in');

    if (fadeElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    fadeElements.forEach(el => observer.observe(el));
}

// ============================================
// Active Navigation
// ============================================

function updateActiveNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.main-nav a');

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPath ||
            (currentPath.includes(link.getAttribute('href')) && link.getAttribute('href') !== 'index.html')) {
            link.classList.add('active');
        }
    });
}

// ============================================
// Mobile Menu Toggle
// ============================================

function initializeMobileMenu() {
    const nav = document.querySelector('.main-nav');
    const header = document.querySelector('.main-header');

    // Create mobile menu button if it doesn't exist
    if (!document.querySelector('.mobile-menu-btn')) {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'mobile-menu-btn';
        menuBtn.innerHTML = '☰';
        menuBtn.setAttribute('aria-label', 'Toggle navigation menu');
        menuBtn.style.cssText = `
            display: none;
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 8px;
        `;

        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('open');
            menuBtn.innerHTML = nav.classList.contains('open') ? '✕' : '☰';
        });

        // Insert before nav
        header.querySelector('.header-content').insertBefore(menuBtn, nav);

        // Show button on mobile
        if (window.innerWidth <= 768) {
            menuBtn.style.display = 'block';
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                menuBtn.style.display = 'none';
                nav.classList.remove('open');
            } else {
                menuBtn.style.display = 'block';
            }
        });
    }
}

// ============================================
// Liturgical Season Detection
// ============================================

function getCurrentLiturgicalSeason() {
    const now = new Date();
    const year = now.getFullYear();

    // Calculate Easter (using Anonymous Gregorian algorithm)
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    const easter = new Date(year, month - 1, day);

    // Calculate other dates
    const ashWednesday = new Date(easter);
    ashWednesday.setDate(easter.getDate() - 46);

    const pentecost = new Date(easter);
    pentecost.setDate(easter.getDate() + 49);

    const advent1 = getAdventStart(year);
    const christmas = new Date(year, 11, 25);

    // Determine current season
    if (now >= advent1 && now < christmas) {
        return 'advent';
    } else if (now >= christmas || now < new Date(year, 0, 6)) {
        return 'christmas';
    } else if (now >= new Date(year, 0, 6) && now < ashWednesday) {
        return 'epiphany';
    } else if (now >= ashWednesday && now < easter) {
        return 'lent';
    } else if (now >= easter && now < pentecost) {
        return 'easter';
    } else if (now >= pentecost && now < new Date(pentecost.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        return 'pentecost';
    } else {
        return 'ordinary';
    }
}

function getAdventStart(year) {
    // Advent starts on the 4th Sunday before Christmas
    const christmas = new Date(year, 11, 25);
    const dayOfWeek = christmas.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 7 : dayOfWeek;
    const advent4 = new Date(year, 11, 25 - daysUntilSunday);
    const advent1 = new Date(advent4);
    advent1.setDate(advent4.getDate() - 21);
    return advent1;
}

function highlightCurrentSeason() {
    const season = getCurrentLiturgicalSeason();
    const seasonCard = document.querySelector(`.season-card.${season}`);
    if (seasonCard) {
        seasonCard.classList.add('current-season');
        // Add a subtle indicator
        const indicator = document.createElement('span');
        indicator.className = 'current-indicator';
        indicator.textContent = 'Current Season';
        indicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #c97c4c;
            color: white;
            font-size: 0.7rem;
            padding: 4px 8px;
            border-radius: 12px;
            font-weight: 600;
        `;
        seasonCard.appendChild(indicator);
    }
}

// ============================================
// Initialize Everything
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Get page ID from URL for comment system
    const pageId = window.location.pathname.replace(/[^a-z0-9]/gi, '_');

    // Initialize features
    initializeComments(pageId);
    initializeNewsletter();
    initializeScrollAnimations();
    updateActiveNavigation();
    initializeMobileMenu();
    highlightCurrentSeason();

    // Add CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .reply-form {
            margin-top: 16px;
            padding: 16px;
            background: #f5f1e8;
            border-radius: 8px;
        }
        .cancel-reply {
            background: none;
            border: none;
            color: #9e5a3c;
            cursor: pointer;
            margin-left: 10px;
            font-family: inherit;
        }
        .cancel-reply:hover {
            text-decoration: underline;
        }
        .replies {
            margin-left: 24px;
            margin-top: 12px;
            padding-left: 16px;
            border-left: 2px solid #c8dbc6;
        }
        .replies .comment {
            background: #faf8f5;
            border-left-color: #7ba584;
        }
        .current-season {
            position: relative;
        }
        @media (max-width: 768px) {
            .main-nav {
                display: none;
                width: 100%;
            }
            .main-nav.open {
                display: block;
            }
            .main-nav ul {
                flex-direction: column;
                text-align: center;
            }
        }
    `;
    document.head.appendChild(style);
});
