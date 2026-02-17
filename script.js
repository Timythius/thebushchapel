/**
 * The Bush Chapel - Interactive Features
 * Comment system, animations, user interactions, and Firebase community board
 */

// ============================================
// Community Board System (Firebase)
// ============================================

class CommunityBoard {
    constructor() {
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        this.isAdmin = false;
        this.unsubscribeMessages = null;
        this.unsubscribePending = null;
    }

    // Initialize Firebase
    init() {
        // Check if Firebase is available and config exists
        if (typeof firebase === 'undefined' || typeof firebaseConfig === 'undefined') {
            return false;
        }

        // Initialize Firebase if not already done
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        this.auth = firebase.auth();
        this.db = firebase.firestore();

        // Set up auth state listener
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.updateUIForAuthState();
            if (user) {
                this.checkAdminStatus(user.email);
            }
        });

        // Set up UI event listeners
        this.setupEventListeners();

        // Load public messages
        this.loadMessages();

        return true;
    }

    // Check if user is admin
    async checkAdminStatus(email) {
        this.isAdmin = (email === ADMIN_EMAIL);
        this.updateAdminUI();
        if (this.isAdmin) {
            this.loadPendingMessages();
        }
    }

    // Update UI based on auth state
    updateUIForAuthState() {
        const loggedOutEl = document.getElementById('auth-logged-out');
        const loggedInEl = document.getElementById('auth-logged-in');
        const composeSection = document.getElementById('compose-section');
        const userNameEl = document.getElementById('user-display-name');

        if (this.currentUser) {
            if (loggedOutEl) loggedOutEl.style.display = 'none';
            if (loggedInEl) loggedInEl.style.display = 'block';
            if (composeSection) composeSection.style.display = 'block';
            if (userNameEl) userNameEl.textContent = this.currentUser.displayName || this.currentUser.email;
        } else {
            if (loggedOutEl) loggedOutEl.style.display = 'block';
            if (loggedInEl) loggedInEl.style.display = 'none';
            if (composeSection) composeSection.style.display = 'none';
        }
    }

    // Update admin panel visibility
    updateAdminUI() {
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.style.display = this.isAdmin ? 'block' : 'none';
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Auth tab switching
        const authTabs = document.querySelectorAll('.auth-tab');
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // If tab is already active, submit the corresponding form
                if (tab.classList.contains('active')) {
                    if (tab.dataset.tab === 'login') {
                        document.getElementById('login-form').requestSubmit();
                    } else if (tab.dataset.tab === 'register') {
                        document.getElementById('register-form').requestSubmit();
                    }
                    return;
                }
                this.switchAuthTab(tab.dataset.tab);
            });
        });

        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Message form
        const messageForm = document.getElementById('message-form');
        if (messageForm) {
            messageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.postMessage();
            });
        }

        // Forgot password link
        const forgotPasswordBtn = document.getElementById('forgot-password-btn');
        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPasswordForm();
            });
        }

        // Back to login link
        const backToLoginBtn = document.getElementById('back-to-login-btn');
        if (backToLoginBtn) {
            backToLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }

        // Forgot password form
        const forgotPasswordForm = document.getElementById('forgot-password-form');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordReset();
            });
        }
    }

    // Show forgot password form
    showForgotPasswordForm() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('forgot-password-form').style.display = 'block';
        document.querySelector('.auth-tabs').style.display = 'none';
    }

    // Show login form
    showLoginForm() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('forgot-password-form').style.display = 'none';
        document.querySelector('.auth-tabs').style.display = 'flex';
        document.querySelector('[data-tab="login"]').classList.add('active');
        document.querySelector('[data-tab="register"]').classList.remove('active');
    }

    // Handle password reset
    async handlePasswordReset() {
        const email = document.getElementById('reset-email').value;
        const errorEl = document.getElementById('reset-error');

        try {
            errorEl.textContent = '';
            errorEl.style.color = 'var(--pentecost-red)';
            await this.auth.sendPasswordResetEmail(email);
            errorEl.style.color = 'var(--gum-green)';
            errorEl.textContent = 'Reset link sent! Check your email.';
            showNotification('Password reset email sent.');
        } catch (error) {
            errorEl.textContent = this.getErrorMessage(error.code);
        }
    }

    // Switch between login and register tabs
    switchAuthTab(tab) {
        const tabs = document.querySelectorAll('.auth-tab');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        tabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        if (tab === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    }

    // Handle login
    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        try {
            errorEl.textContent = '';
            await this.auth.signInWithEmailAndPassword(email, password);
            showNotification('Welcome back!');
        } catch (error) {
            errorEl.textContent = this.getErrorMessage(error.code);
        }
    }

    // Handle registration
    async handleRegister() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const errorEl = document.getElementById('register-error');

        try {
            errorEl.textContent = '';
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);

            // Update display name
            await userCredential.user.updateProfile({
                displayName: name
            });

            // Create user document in Firestore
            await this.db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                displayName: name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isAdmin: email === ADMIN_EMAIL
            });

            showNotification('Welcome to the community!');
        } catch (error) {
            errorEl.textContent = this.getErrorMessage(error.code);
        }
    }

    // Handle logout
    async handleLogout() {
        try {
            await this.auth.signOut();
            this.isAdmin = false;
            this.updateAdminUI();
            showNotification('You have been signed out.');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Post a new message
    async postMessage() {
        if (!this.currentUser) {
            showNotification('Please sign in to post a message.');
            return;
        }

        const content = document.getElementById('message-content').value.trim();
        const isPrivate = document.getElementById('message-private').checked;

        if (!content) {
            showNotification('Please enter a message.');
            return;
        }

        try {
            await this.db.collection('messages').add({
                authorId: this.currentUser.uid,
                authorName: this.currentUser.displayName || this.currentUser.email,
                content: content,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isPrivate: isPrivate,
                isApproved: false,
                threadId: null
            });

            // Clear form
            document.getElementById('message-content').value = '';
            document.getElementById('message-private').checked = false;

            showNotification('Your message has been submitted for review.');
        } catch (error) {
            console.error('Error posting message:', error);
            showNotification('Error posting message. Please try again.');
        }
    }

    // Load approved public messages
    loadMessages() {
        const container = document.getElementById('messages-container');
        if (!container) return;

        // Real-time listener for approved public messages
        this.unsubscribeMessages = this.db.collection('messages')
            .where('isApproved', '==', true)
            .where('isPrivate', '==', false)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .onSnapshot((snapshot) => {
                if (snapshot.empty) {
                    container.innerHTML = '<p class="no-messages">No messages yet. Be the first to share!</p>';
                    return;
                }

                const messages = [];
                snapshot.forEach(doc => {
                    messages.push({ id: doc.id, ...doc.data() });
                });

                this.renderMessages(messages, container);
            }, (error) => {
                console.error('Error loading messages:', error);
                if (error.code === 'failed-precondition') {
                    container.innerHTML = '<p class="no-messages">Setting up the message board... Please refresh in a moment.</p>';
                } else {
                    container.innerHTML = '<p class="error-message">Error loading messages. Please try refreshing the page.</p>';
                }
            });
    }

    // Load pending messages for admin
    loadPendingMessages() {
        const container = document.getElementById('pending-messages');
        if (!container || !this.isAdmin) return;

        this.unsubscribePending = this.db.collection('messages')
            .where('isApproved', '==', false)
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                if (snapshot.empty) {
                    container.innerHTML = '<p class="no-messages">No pending messages.</p>';
                    return;
                }

                const messages = [];
                snapshot.forEach(doc => {
                    messages.push({ id: doc.id, ...doc.data() });
                });

                this.renderPendingMessages(messages, container);
            }, (error) => {
                console.error('Error loading pending messages:', error);
                if (error.code === 'failed-precondition') {
                    container.innerHTML = '<p class="no-messages">Index building... Refresh shortly.</p>';
                }
            });
    }

    // Render messages
    renderMessages(messages, container) {
        // Group messages by thread
        const topLevel = messages.filter(m => !m.threadId);
        const replies = messages.filter(m => m.threadId);

        let html = '';
        topLevel.forEach(message => {
            const messageReplies = replies.filter(r => r.threadId === message.id);
            html += this.createMessageHTML(message, messageReplies);
        });

        container.innerHTML = html;

        // Attach reply button handlers
        container.querySelectorAll('.message-reply-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showReplyForm(btn.dataset.messageId);
            });
        });
    }

    // Render pending messages for admin
    renderPendingMessages(messages, container) {
        let html = '';
        messages.forEach(message => {
            html += this.createPendingMessageHTML(message);
        });

        container.innerHTML = html;

        // Attach approve/delete handlers
        container.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.approveMessage(btn.dataset.messageId);
            });
        });

        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.deleteMessage(btn.dataset.messageId);
            });
        });
    }

    // Create message HTML
    createMessageHTML(message, replies = []) {
        const date = message.createdAt ? this.formatDate(message.createdAt.toDate()) : 'Just now';
        const privateIndicator = message.isPrivate ? '<span class="private-indicator">Private</span>' : '';

        let repliesHTML = '';
        if (replies.length > 0) {
            repliesHTML = '<div class="message-replies">' +
                replies.map(reply => {
                    const replyDate = reply.createdAt ? this.formatDate(reply.createdAt.toDate()) : 'Just now';
                    return `
                        <div class="message reply">
                            <div class="message-header">
                                <span class="message-author">${escapeHTML(reply.authorName)}</span>
                                <span class="message-date">${replyDate}</span>
                            </div>
                            <div class="message-body">${escapeHTML(reply.content)}</div>
                        </div>
                    `;
                }).join('') +
                '</div>';
        }

        const replyButton = this.currentUser ?
            `<button class="message-reply-btn" data-message-id="${message.id}">Reply</button>` : '';

        return `
            <div class="message" data-message-id="${message.id}">
                <div class="message-header">
                    <span class="message-author">${escapeHTML(message.authorName)}</span>
                    <span class="message-date">${date}</span>
                    ${privateIndicator}
                </div>
                <div class="message-body">${escapeHTML(message.content)}</div>
                <div class="message-actions">
                    ${replyButton}
                </div>
                <div class="reply-form-container" id="reply-form-${message.id}"></div>
                ${repliesHTML}
            </div>
        `;
    }

    // Create pending message HTML for admin
    createPendingMessageHTML(message) {
        const date = message.createdAt ? this.formatDate(message.createdAt.toDate()) : 'Just now';
        const privateIndicator = message.isPrivate ? '<span class="private-indicator">Private</span>' : '';

        return `
            <div class="message pending" data-message-id="${message.id}">
                <div class="message-header">
                    <span class="message-author">${escapeHTML(message.authorName)}</span>
                    <span class="message-date">${date}</span>
                    ${privateIndicator}
                </div>
                <div class="message-body">${escapeHTML(message.content)}</div>
                <div class="admin-actions">
                    <button class="approve-btn" data-message-id="${message.id}">Approve</button>
                    <button class="delete-btn" data-message-id="${message.id}">Delete</button>
                </div>
            </div>
        `;
    }

    // Show reply form
    showReplyForm(messageId) {
        // Remove existing reply forms
        document.querySelectorAll('.reply-form-container').forEach(el => {
            el.innerHTML = '';
        });

        const container = document.getElementById(`reply-form-${messageId}`);
        if (!container) return;

        container.innerHTML = `
            <form class="reply-form" id="reply-form-submit-${messageId}">
                <div class="form-group">
                    <textarea id="reply-content-${messageId}" rows="3" placeholder="Write your reply..." required></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="submit-reply-btn">Post Reply</button>
                    <button type="button" class="cancel-reply-btn" data-message-id="${messageId}">Cancel</button>
                </div>
            </form>
        `;

        // Attach form submit handler
        const form = document.getElementById(`reply-form-submit-${messageId}`);
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.replyToMessage(messageId);
        });

        // Attach cancel handler
        container.querySelector('.cancel-reply-btn').addEventListener('click', () => {
            container.innerHTML = '';
        });

        // Focus textarea
        document.getElementById(`reply-content-${messageId}`).focus();
    }

    // Reply to a message
    async replyToMessage(parentMessageId) {
        if (!this.currentUser) {
            showNotification('Please sign in to reply.');
            return;
        }

        const content = document.getElementById(`reply-content-${parentMessageId}`).value.trim();
        if (!content) {
            showNotification('Please enter a reply.');
            return;
        }

        try {
            await this.db.collection('messages').add({
                authorId: this.currentUser.uid,
                authorName: this.currentUser.displayName || this.currentUser.email,
                content: content,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isPrivate: false,
                isApproved: false,
                threadId: parentMessageId
            });

            // Clear reply form
            document.getElementById(`reply-form-${parentMessageId}`).innerHTML = '';

            showNotification('Your reply has been submitted for review.');
        } catch (error) {
            console.error('Error posting reply:', error);
            showNotification('Error posting reply. Please try again.');
        }
    }

    // Approve a message (admin only)
    async approveMessage(messageId) {
        if (!this.isAdmin) return;

        try {
            await this.db.collection('messages').doc(messageId).update({
                isApproved: true
            });
            showNotification('Message approved.');
        } catch (error) {
            console.error('Error approving message:', error);
            showNotification('Error approving message.');
        }
    }

    // Delete a message (admin only)
    async deleteMessage(messageId) {
        if (!this.isAdmin) return;

        if (!confirm('Are you sure you want to delete this message?')) {
            return;
        }

        try {
            await this.db.collection('messages').doc(messageId).delete();
            showNotification('Message deleted.');
        } catch (error) {
            console.error('Error deleting message:', error);
            showNotification('Error deleting message.');
        }
    }

    // Format date
    formatDate(date) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-AU', options);
    }

    // Get user-friendly error message
    getErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'This email is already registered. Please sign in instead.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/weak-password':
                return 'Password must be at least 6 characters.';
            case 'auth/user-not-found':
                return 'No account found with this email.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/too-many-requests':
                return 'Too many attempts. Please try again later.';
            default:
                return 'An error occurred. Please try again.';
        }
    }

    // Cleanup listeners
    destroy() {
        if (this.unsubscribeMessages) {
            this.unsubscribeMessages();
        }
        if (this.unsubscribePending) {
            this.unsubscribePending();
        }
    }
}

// Global community board instance
let communityBoard = null;

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
// Liturgical Calendar System (2025-2035)
// ============================================
//
// This site uses 6 liturgical seasons (Epiphany is included in Ordinary Time):
// 1. Advent
// 2. Christmas
// 3. Ordinary Time (includes Epiphany and post-Pentecost periods)
// 4. Lent
// 5. Easter
// 6. Pentecost

const liturgicalCalendar = {
    // Liturgical dates for 2025-2035 (Melbourne, Australia)
    // Sources: Church of England Calendar, Anglican Compass
    years: {
        2025: { easter: '2025-04-20', advent: '2024-11-30' },
        2026: { easter: '2026-04-05', advent: '2025-11-29' },
        2027: { easter: '2027-03-28', advent: '2026-11-28' },
        2028: { easter: '2028-04-16', advent: '2027-12-03' },
        2029: { easter: '2029-04-01', advent: '2028-12-02' },
        2030: { easter: '2030-04-21', advent: '2029-12-01' },
        2031: { easter: '2031-04-13', advent: '2030-11-30' },
        2032: { easter: '2032-03-28', advent: '2031-11-28' },
        2033: { easter: '2033-04-17', advent: '2032-11-27' },
        2034: { easter: '2034-04-09', advent: '2033-12-03' },
        2035: { easter: '2035-03-25', advent: '2034-12-02' }
    },

    // Video/content availability for each season
    content: {
        lent: {
            available: true,
            videoId: 'DAB7XcuyvOA',
            title: 'Lent Liturgy',
            description: '',
            pdfUrl: 'liturgies/lent-liturgy.pdf'
        },
        advent: {
            available: true,
            videoId: 'DAB7XcuyvOA',
            title: 'Advent Liturgy',
            description: '',
            pdfUrl: 'liturgies/advent-liturgy.pdf'
        },
        christmas: { available: false },
        easter: { available: false },
        pentecost: { available: false },
        'ordinary-time': { available: false }
    },

    // Parse 'YYYY-MM-DD' as local midnight (not UTC)
    parseLocalDate(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    },

    getCurrentSeason() {
        const now = new Date();
        // Normalize to midnight local time for clean date comparisons
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-11
        const yearData = this.years[year];

        if (!yearData) return 'ordinary-time';

        // Parse dates as local midnight (not UTC)
        const easter = this.parseLocalDate(yearData.easter);
        const ashWednesday = new Date(easter);
        ashWednesday.setDate(easter.getDate() - 46);

        const pentecost = new Date(easter);
        pentecost.setDate(easter.getDate() + 49);
        const pentecostEnd = new Date(pentecost);
        pentecostEnd.setDate(pentecost.getDate() + 7);

        // Epiphany is always Jan 6
        const epiphany = new Date(year, 0, 6);

        // Get Advent for THIS year
        const adventDate = this.parseLocalDate(yearData.advent);


        // SIMPLIFIED LOGIC: Check seasons in chronological order for the current year
        // NOTE: We only use 6 seasons - Epiphany is included in Ordinary Time

        // Jan 1-6: Christmas (continuation from previous year's Dec 25)
        if (month === 0 && today.getDate() <= 6) {
            return 'christmas';
        }

        // Jan 7 - Ash Wednesday: Ordinary Time (includes what liturgically is Epiphany)
        if (today > epiphany && today < ashWednesday) {
            return 'ordinary-time';
        }

        // Ash Wednesday - Easter: Lent
        if (today >= ashWednesday && today < easter) {
            return 'lent';
        }

        // Easter - Pentecost: Easter
        if (today >= easter && today < pentecost) {
            return 'easter';
        }

        // Pentecost week: Pentecost
        if (today >= pentecost && today < pentecostEnd) {
            return 'pentecost';
        }

        // After Pentecost - Advent: Ordinary Time (second period)
        if (today >= pentecostEnd && today < adventDate) {
            return 'ordinary-time';
        }

        // Advent - Dec 24: Advent
        if (today >= adventDate && today < new Date(year, 11, 25)) {
            return 'advent';
        }

        // Dec 25-31: Christmas
        if (month === 11 && today.getDate() >= 25) {
            return 'christmas';
        }

        // Fallback
        console.log('DETECTED: ordinary-time (fallback)');
        return 'ordinary-time';
    },

    getSeasonOrder() {
        const currentSeason = this.getCurrentSeason();
        // Proper liturgical calendar order (with Ordinary Time appearing where Epiphany would be)
        const seasons = ['advent', 'christmas', 'ordinary-time', 'lent', 'easter', 'pentecost'];
        const currentIndex = seasons.indexOf(currentSeason);

        // Rotate array to start with current season, then flow in calendar order
        return [...seasons.slice(currentIndex), ...seasons.slice(0, currentIndex)];
    }
};

// ============================================
// Auto-update Homepage Content
// ============================================

function updateHomepageForSeason() {
    const season = liturgicalCalendar.getCurrentSeason();
    const seasonContent = liturgicalCalendar.content[season];
    const videoSection = document.querySelector('.latest-video');

    if (!videoSection) return;

    if (!seasonContent || !seasonContent.available) {
        // Hide video section if no content available
        videoSection.style.display = 'none';
        return;
    }

    // Update video section with current season content
    videoSection.style.display = 'block';

    const iframe = videoSection.querySelector('iframe');
    const title = videoSection.querySelector('.video-info h3');
    const description = videoSection.querySelector('.video-description');
    const pdfLink = videoSection.querySelector('.view-more');

    if (iframe) {
        iframe.src = `https://www.youtube.com/embed/${seasonContent.videoId}`;
        iframe.title = `${seasonContent.title} - The Bush Chapel`;
    }

    if (title) title.textContent = seasonContent.title;
    if (description) description.textContent = seasonContent.description;
    if (pdfLink) pdfLink.href = seasonContent.pdfUrl;
}

function rotateSeasonsGrid() {
    const seasonsGrid = document.querySelector('.seasons-grid');
    if (!seasonsGrid) return;

    const currentSeason = liturgicalCalendar.getCurrentSeason();
    const seasonOrder = liturgicalCalendar.getSeasonOrder();


    // Get all season cards
    const cards = {
        'advent': seasonsGrid.querySelector('.season-card.advent'),
        'christmas': seasonsGrid.querySelector('.season-card.christmas'),
        'lent': seasonsGrid.querySelector('.season-card.lent'),
        'easter': seasonsGrid.querySelector('.season-card.easter'),
        'pentecost': seasonsGrid.querySelector('.season-card.pentecost'),
        'ordinary-time': seasonsGrid.querySelector('.season-card.ordinary')
    };

    // Clear the grid
    seasonsGrid.innerHTML = '';

    // Re-add cards in new order
    seasonOrder.forEach((seasonKey, index) => {
        const card = cards[seasonKey];
        if (!card) return;

        // Add "Current Season" label to first card
        if (index === 0) {
            // Remove any existing current season label
            const existingLabel = card.querySelector('p[style*="italic"]');
            if (existingLabel) existingLabel.remove();

            // Add new label
            const label = document.createElement('p');
            label.style.cssText = 'font-size: 0.9rem; margin-top: 0.5rem; font-style: italic;';
            label.textContent = 'Current Season';
            card.appendChild(label);
        } else {
            // Remove current season label from non-current cards
            const existingLabel = card.querySelector('p[style*="italic"]');
            if (existingLabel) existingLabel.remove();
        }

        seasonsGrid.appendChild(card);
    });
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

    // Auto-update liturgical content
    updateHomepageForSeason();
    rotateSeasonsGrid();

    // Initialize community board if on community page
    if (window.location.pathname.includes('community')) {
        communityBoard = new CommunityBoard();
        communityBoard.init();
    }

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
    `;
    document.head.appendChild(style);
});
