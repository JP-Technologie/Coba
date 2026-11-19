// ============================================
// COBA ASSISTANT — floating widget
// Site-wide help bot: sessions persist in localStorage
// so "recent chats" carry across every page.
// ============================================

(function () {
  const STORAGE_KEY = 'coba_chat_sessions_v1';
  const ACTIVE_KEY = 'coba_chat_active_v1';

  let sessions = [];
  let activeId = null;

  /* ---------- Persistence ---------- */
  function loadSessions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      sessions = raw ? JSON.parse(raw) : [];
    } catch (e) {
      sessions = [];
    }
    activeId = localStorage.getItem(ACTIVE_KEY);
  }

  function saveSessions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
    } catch (e) { /* storage unavailable — fail silently, chat still works this page load */ }
  }

  function getActiveSession() {
    return sessions.find(s => s.id === activeId) || null;
  }

  function createSession() {
    const session = {
      id: 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: 'New chat',
      updatedAt: Date.now(),
      messages: [
        {
          role: 'bot',
          text: "Hi, I'm the Coba Demo Assistant. I can explain the sample pages and features. This prototype is not a bank, and its balances and transactions are fictional.",
          time: Date.now()
        }
      ]
    };
    sessions.unshift(session);
    activeId = session.id;
    saveSessions();
    return session;
  }

  /* ---------- Assistant brain (rule-based FAQ) ---------- */
  function getBotReply(rawText) {
    const t = rawText.toLowerCase();

    const rules = [
      { k: ['agent', 'human', 'representative', 'support team', 'talk to someone', 'contact us', 'help centre', 'help center'],
        r: "The Help Centre has answers about this prototype. The Contact page has a local preview form, but no support inbox is connected and submitting it does not send a message. Please don't share personal or financial details here." },
      { k: ['safe', 'secure', 'security', 'insured', 'insurance', 'licensed', 'license', 'trust'],
        r: "Coba here is a website prototype, not a licensed bank or financial service. It does not hold or insure funds. Use fictional information only; browser demo storage is not suitable for sensitive data." },
      { k: ['otp', 'verification code', 'one-time', 'one time', 'sms', 'email code'],
        r: "Login verification is simulated. The test code 123456 is shown on the login page; no email or SMS is sent, and this is not real identity verification." },
      { k: ['fee', 'fees', 'charge', 'cost', 'free'],
        r: "This demo does not process payments, so it has no real transfer or bill-payment fees. No pricing for a real banking service is established here." },
      { k: ['transfer', 'send money', 'how long', 'speed', 'receipt'],
        r: "The Send page lets you enter fictional details, review them, and generate a sample receipt. It does not contact a bank, verify a recipient, or move money. The receipt is not proof of payment." },
      { k: ['saving', 'vault', 'interest', 'invest'],
        r: "The Savings Vault creates a visual sample card. Its 12% rate and daily-interest figure are illustrative examples only; no funds are locked and no interest is paid." },
      { k: ['card', 'lost', 'stolen', 'freeze', 'block'],
        r: "The Cards page shows a fictional masked card. Freeze/unfreeze changes only its appearance in this browser page; it does not affect a real card. Card requests are not issued or shipped." },
      { k: ['bill', 'airtime', 'data', 'electricity', 'tv', 'subscription'],
        r: "The Pay bills demo supports airtime, data, electricity, and TV sample forms. It does not contact providers or purchase a service; its receipt is only a visual example." },
      { k: ['transaction', 'history', 'search', 'filter'],
        r: "Transaction History contains fictional sample records. You can search them and filter by direction or time period; it is not connected to an account." },
      { k: ['profile', 'settings', 'notification', 'phone number', 'change password'],
        r: "Profile & Settings saves sample name, contact, and notification preferences in this browser. Password validation is only a UI demonstration and does not change a real credential." },
      { k: ['open account', 'sign up', 'signup', 'register', 'create account', 'get started'],
        r: "Signup is a front-end demonstration. It does not create a real account or verify identity. Use fictional details and never enter a real password or ID." },
      { k: ['login', 'log in', 'sign in', 'password', 'forgot', 'locked out'],
        r: "Demo login accepts a valid-looking email or phone and any non-empty password, then shows the test code 123456 on screen. Do not enter a real password. The retry limit runs in this browser only, not on a server." },
      { k: ['hi', 'hello', 'hey', 'good morning', 'good afternoon'],
        r: "Hello! I can explain the demo transfer, Savings Vault, bill payments, cards, transaction history, profile settings, and login flow. What would you like to know?" },
      { k: ['thank', 'thanks', 'appreciate'],
        r: "Anytime! Let me know if anything else comes up." }
    ];

    for (const rule of rules) {
      if (rule.k.some(keyword => t.includes(keyword))) return rule.r;
    }

    return "I don't have an answer for that yet. Try asking about the demo transfer, vault, bills, cards, transaction history, profile settings, OTP, or what information is stored. This chat cannot contact a human or process banking requests.";
  }

  /* ---------- DOM refs (set on init) ---------- */
  let els = {};

  function fmtTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function fmtRelative(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    return days + 'd ago';
  }

  /* ---------- Rendering ---------- */
  function renderSessionList() {
    els.sessionList.innerHTML = '';
    if (sessions.length === 0) {
      els.sessionList.innerHTML = '<div class="chat-session-empty">No chats yet \u2014 start one below.</div>';
      return;
    }
    sessions
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .forEach(session => {
        const btn = document.createElement('button');
        btn.className = 'chat-session-item' + (session.id === activeId ? ' active' : '');
        btn.innerHTML =
          '<span class="chat-session-title"></span>' +
          '<span class="chat-session-time"></span>';
        btn.querySelector('.chat-session-title').textContent = session.title;
        btn.querySelector('.chat-session-time').textContent = fmtRelative(session.updatedAt);
        btn.addEventListener('click', () => {
          activeId = session.id;
          saveSessions();
          renderSessionList();
          renderMessages();
          closeSidebar();
        });
        els.sessionList.appendChild(btn);
      });
  }

  function renderMessages() {
    const session = getActiveSession();
    els.messages.innerHTML = '';
    if (!session) return;
    session.messages.forEach(m => {
      const wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.alignItems = m.role === 'user' ? 'flex-end' : 'flex-start';

      const bubble = document.createElement('div');
      bubble.className = 'msg ' + (m.role === 'user' ? 'user' : 'bot');
      bubble.textContent = m.text;

      const time = document.createElement('span');
      time.className = 'msg-time';
      time.textContent = fmtTime(m.time);

      wrap.appendChild(bubble);
      wrap.appendChild(time);
      els.messages.appendChild(wrap);
    });
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'typing-indicator';
    t.id = 'typingIndicator';
    t.innerHTML = '<span></span><span></span><span></span>';
    els.messages.appendChild(t);
    els.messages.scrollTop = els.messages.scrollHeight;
  }
  function hideTyping() {
    const t = document.getElementById('typingIndicator');
    if (t) t.remove();
  }

  /* ---------- Actions ---------- */
  function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    let session = getActiveSession();
    if (!session) session = createSession();

    session.messages.push({ role: 'user', text: trimmed, time: Date.now() });
    if (session.title === 'New chat') {
      session.title = trimmed.length > 34 ? trimmed.slice(0, 34) + '\u2026' : trimmed;
    }
    session.updatedAt = Date.now();
    saveSessions();
    renderMessages();
    renderSessionList();

    els.suggestions.style.display = 'none';
    showTyping();

    setTimeout(() => {
      hideTyping();
      const reply = getBotReply(trimmed);
      session.messages.push({ role: 'bot', text: reply, time: Date.now() });
      session.updatedAt = Date.now();
      saveSessions();
      renderMessages();
      renderSessionList();
    }, 650 + Math.random() * 500);
  }

  function openSidebar() {
    els.sidebar.classList.add('is-open');
    els.sidebarOverlay.classList.add('is-open');
  }
  function closeSidebar() {
    els.sidebar.classList.remove('is-open');
    els.sidebarOverlay.classList.remove('is-open');
  }

  function openPanel() {
    els.panel.classList.add('is-open');
    els.bubble.classList.add('is-open');
    els.panel.setAttribute('aria-hidden', 'false');
    els.badge.classList.add('hidden');
    els.input.focus();
  }
  function closePanel() {
    els.panel.classList.remove('is-open');
    els.bubble.classList.remove('is-open');
    els.panel.setAttribute('aria-hidden', 'true');
    closeSidebar();
  }

  /* ---------- Init ---------- */
  function init() {
    els = {
      bubble: document.getElementById('chatBubble'),
      badge: document.getElementById('chatBadge'),
      panel: document.getElementById('chatPanel'),
      sidebar: document.getElementById('chatSidebar'),
      sidebarOverlay: document.getElementById('sidebarOverlay'),
      sessionList: document.getElementById('chatSessionList'),
      messages: document.getElementById('chatMessages'),
      suggestions: document.getElementById('chatSuggestions'),
      form: document.getElementById('chatForm'),
      input: document.getElementById('chatInput'),
      newChatBtn: document.getElementById('newChatBtn'),
      historyBtn: document.getElementById('historyBtn'),
      closeSidebarBtn: document.getElementById('closeSidebarBtn'),
      closeChatBtn: document.getElementById('closeChatBtn')
    };
    if (!els.bubble) return; // widget markup not present on this page

    loadSessions();
    if (!getActiveSession()) {
      if (sessions.length > 0) {
        activeId = sessions.sort((a, b) => b.updatedAt - a.updatedAt)[0].id;
      } else {
        createSession();
      }
    }
    renderSessionList();
    renderMessages();

    els.bubble.addEventListener('click', () => {
      const isOpen = els.panel.classList.contains('is-open');
      if (isOpen) closePanel(); else openPanel();
    });
    els.closeChatBtn.addEventListener('click', closePanel);
    els.historyBtn.addEventListener('click', () => {
      renderSessionList();
      openSidebar();
    });
    els.closeSidebarBtn.addEventListener('click', closeSidebar);
    els.sidebarOverlay.addEventListener('click', closeSidebar);

    els.newChatBtn.addEventListener('click', () => {
      createSession();
      saveSessions();
      renderSessionList();
      renderMessages();
      els.suggestions.style.display = 'flex';
      closeSidebar();
      els.input.focus();
    });

    els.form.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage(els.input.value);
      els.input.value = '';
    });

    els.suggestions.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => sendMessage(chip.textContent));
    });

    // hide suggestion chips if the active session already has a conversation going
    const session = getActiveSession();
    if (session && session.messages.length > 1) {
      els.suggestions.style.display = 'none';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
