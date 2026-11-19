// ============================================
// COBA — shared interactions
// ============================================

function startDemoSession(name) {
  sessionStorage.removeItem('cobaPendingDemoOtp');
  sessionStorage.setItem('cobaDemoSession', JSON.stringify({ name }));
  window.location.assign('dashboard.html');
}

function beginDemoVerification(name, contact) {
  const loginForm = document.getElementById('loginForm');
  const otpPanel = document.getElementById('otpPanel');
  if (!loginForm || !otpPanel) {
    startDemoSession(name);
    return;
  }

  sessionStorage.setItem('cobaPendingDemoOtp', JSON.stringify({ name, code: '123456' }));
  const destination = contact.includes('@')
    ? `${contact.charAt(0)}••••@${contact.split('@')[1]}`
    : `••••${contact.slice(-2)}`;
  document.getElementById('otpDestination').textContent = destination;
  document.getElementById('otpInput').value = '';
  document.getElementById('otpStatus').textContent = '';
  loginForm.hidden = true;
  otpPanel.hidden = false;
  document.getElementById('otpInput').focus();
}

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Persistent display theme ---------- */
  const themeToggle = document.createElement('button');
  themeToggle.type = 'button';
  themeToggle.className = 'theme-toggle';
  themeToggle.setAttribute('aria-pressed', 'false');
  themeToggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.6 8.6 0 1 0 20.2 15.4Z"/></svg><span></span>';
  document.body.appendChild(themeToggle);

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    themeToggle.querySelector('span').textContent = isDark ? 'Light mode' : 'Dark mode';
  }

  let savedTheme = 'light';
  try {
    savedTheme = localStorage.getItem('cobaTheme') === 'dark' ? 'dark' : 'light';
  } catch (error) {
    savedTheme = 'light';
  }
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    try {
      localStorage.setItem('cobaTheme', nextTheme);
    } catch (error) {
      // Theme still applies for this page view when storage is unavailable.
    }
  });

  /* ---------- Local-only contact preview ---------- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const contactPreview = document.getElementById('contactPreview');
    contactForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;
      document.getElementById('contactPreviewName').textContent = document.getElementById('contactName').value.trim();
      document.getElementById('contactPreviewTopic').textContent = document.getElementById('contactTopic').value;
      document.getElementById('contactPreviewMessage').textContent = document.getElementById('contactMessage').value.trim();
      contactForm.hidden = true;
      contactPreview.hidden = false;
      contactPreview.focus();
    });

    document.getElementById('editContactMessage').addEventListener('click', () => {
      contactPreview.hidden = true;
      contactForm.hidden = false;
      document.getElementById('contactMessage').focus();
    });
  }

  /* ---------- Demo inactivity sign-out notice ---------- */
  if (sessionStorage.getItem('cobaDemoLogoutReason') === 'inactivity') {
    const formMsg = document.getElementById('formMsg');
    const formMsgText = document.getElementById('formMsgText');
    if (formMsg && formMsgText) {
      formMsgText.textContent = 'Demo session ended after 10 minutes of inactivity.';
      formMsg.classList.add('show');
    }
    sessionStorage.removeItem('cobaDemoLogoutReason');
  }

  /* ---------- Demo protected-page session gate ---------- */
  const dashboardApp = document.getElementById('dashboardApp');
  const transferApp = document.getElementById('transferApp');
  const transactionsApp = document.getElementById('transactionsApp');
  const vaultApp = document.getElementById('vaultApp');
  const billsApp = document.getElementById('billsApp');
  const cardsApp = document.getElementById('cardsApp');
  const profileApp = document.getElementById('profileApp');
  let demoSession = null;
  if (dashboardApp || transferApp || transactionsApp || vaultApp || billsApp || cardsApp || profileApp) {
    try {
      demoSession = JSON.parse(sessionStorage.getItem('cobaDemoSession'));
    } catch (error) {
      demoSession = null;
    }

    if (!demoSession || typeof demoSession.name !== 'string') {
      window.location.replace('login.html');
      return;
    }

    /* ---------- Demo inactivity auto-logout ---------- */
    const inactivityTimeout = 10 * 60 * 1000;
    const inactivityWarning = 60 * 1000;
    let inactivityTimer;
    let warningTimer;

    function clearInactivityTimers() {
      window.clearTimeout(inactivityTimer);
      window.clearTimeout(warningTimer);
    }

    function logoutForInactivity() {
      clearInactivityTimers();
      sessionStorage.removeItem('cobaDemoSession');
      sessionStorage.setItem('cobaDemoLogoutReason', 'inactivity');
      window.location.assign('login.html');
    }

    function resetInactivityTimer() {
      clearInactivityTimers();
      const activeWarning = document.getElementById('inactivityWarning');
      if (activeWarning) activeWarning.hidden = true;

      warningTimer = window.setTimeout(() => {
        if (activeWarning) activeWarning.hidden = false;
      }, inactivityTimeout - inactivityWarning);
      inactivityTimer = window.setTimeout(logoutForInactivity, inactivityTimeout);
    }

    ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(eventName => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });

    if (!document.getElementById('inactivityWarning')) {
      const warning = document.createElement('aside');
      warning.id = 'inactivityWarning';
      warning.className = 'inactivity-warning';
      warning.hidden = true;
      warning.setAttribute('role', 'status');
      warning.innerHTML = '<strong>Demo session expiring</strong><span>You’ll be logged out soon due to inactivity. Move or type to stay signed in.</span>';
      document.body.appendChild(warning);
    }

    resetInactivityTimer();
  }

  if (dashboardApp) {
    document.getElementById('dashboardName').textContent = demoSession.name;
    document.getElementById('dashboardGreeting').textContent = demoSession.name.split(/\s+/)[0];
    document.getElementById('dashboardInitials').textContent = demoSession.name
      .split(/\s+/).filter(Boolean).map(part => part.charAt(0)).join('').slice(0, 2).toUpperCase();
    document.getElementById('logoutBtn').addEventListener('click', () => {
      sessionStorage.removeItem('cobaDemoSession');
      window.location.assign('login.html');
    });
  }

  /* ---------- Demo transfer review ---------- */
  const transferForm = document.getElementById('transferForm');
  if (transferForm) {
    const reviewPanel = document.getElementById('transferReview');
    const receiptPanel = document.getElementById('transferReceipt');
    const transferFields = {
      recipient: document.getElementById('recipientName'),
      bank: document.getElementById('recipientBank'),
      account: document.getElementById('accountNumber'),
      amount: document.getElementById('transferAmount')
    };
    let transferDetails;

    transferForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!transferForm.reportValidity()) return;

      transferDetails = {
        recipient: transferFields.recipient.value.trim(),
        bank: transferFields.bank.selectedOptions[0].textContent,
        account: transferFields.account.value.trim(),
        amount: Number(transferFields.amount.value)
      };
      document.getElementById('reviewRecipient').textContent = transferDetails.recipient;
      document.getElementById('reviewBank').textContent = transferDetails.bank;
      document.getElementById('reviewAccount').textContent = `••••••${transferDetails.account.slice(-4)}`;
      document.getElementById('reviewAmount').textContent = new Intl.NumberFormat('en-NG', {
        style: 'currency', currency: 'NGN', minimumFractionDigits: 2
      }).format(transferDetails.amount);
      transferForm.hidden = true;
      reviewPanel.hidden = false;
      reviewPanel.focus();
    });

    document.getElementById('editTransferBtn').addEventListener('click', () => {
      reviewPanel.hidden = true;
      transferForm.hidden = false;
      transferFields.recipient.focus();
    });

    document.getElementById('confirmTransferBtn').addEventListener('click', event => {
      const confirmButton = event.currentTarget;
      confirmButton.disabled = true;
      confirmButton.textContent = 'Preparing demo receipt…';

      window.setTimeout(() => {
        document.getElementById('receiptRecipient').textContent = transferDetails.recipient;
        document.getElementById('receiptBank').textContent = transferDetails.bank;
        document.getElementById('receiptAccount').textContent = `••••••${transferDetails.account.slice(-4)}`;
        document.getElementById('receiptAmount').textContent = new Intl.NumberFormat('en-NG', {
          style: 'currency', currency: 'NGN', minimumFractionDigits: 2
        }).format(transferDetails.amount);
        document.getElementById('receiptReference').textContent = `DEMO-${Date.now()}`;
        document.getElementById('receiptDate').textContent = new Intl.DateTimeFormat('en-NG', {
          dateStyle: 'medium', timeStyle: 'short'
        }).format(new Date());
        reviewPanel.hidden = true;
        receiptPanel.hidden = false;
        receiptPanel.focus();
      }, 350);
    });
  }

  /* ---------- Demo bill payments ---------- */
  const billForm = document.getElementById('billForm');
  if (billForm) {
    const categoryButtons = Array.from(document.querySelectorAll('[data-bill-category]'));
    const categoryInput = document.getElementById('billCategory');
    const providerSelect = document.getElementById('billProvider');
    const identifierLabel = document.getElementById('billIdentifierLabel');
    const identifierInput = document.getElementById('billIdentifier');
    const amountInput = document.getElementById('billAmount');
    const review = document.getElementById('billReview');
    const receipt = document.getElementById('billReceipt');

    const providers = {
      airtime: ['MTN', 'Airtel', 'Glo', '9mobile'],
      data: ['MTN', 'Airtel', 'Glo', '9mobile'],
      electricity: ['Ikeja Electric', 'Eko Electric', 'AEDC', 'PHED'],
      tv: ['DSTV', 'GOtv', 'Startimes', 'Showmax']
    };

    function formatNaira(amount) {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency', currency: 'NGN', minimumFractionDigits: 2
      }).format(amount);
    }

    function selectCategory(category) {
      categoryInput.value = category;
      categoryButtons.forEach(button => {
        const selected = button.dataset.billCategory === category;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });

      providerSelect.innerHTML = providers[category].map(name => `<option value="${name}">${name}</option>`).join('');
      const labels = {
        airtime: ['Phone number', 'Use a fictional phone number'],
        data: ['Phone number', 'Use a fictional phone number'],
        electricity: ['Meter number', 'Use a fictional meter number'],
        tv: ['Smartcard/IUC number', 'Use a fictional subscriber number']
      };
      identifierLabel.textContent = labels[category][0];
      identifierInput.placeholder = labels[category][1];
      identifierInput.value = '';
    }

    categoryButtons.forEach(button => {
      button.addEventListener('click', () => selectCategory(button.dataset.billCategory));
    });

    billForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!billForm.reportValidity()) return;

      document.getElementById('billReviewCategory').textContent = categoryInput.value.charAt(0).toUpperCase() + categoryInput.value.slice(1);
      document.getElementById('billReviewProvider').textContent = providerSelect.value;
      document.getElementById('billReviewIdentifier').textContent = `••••••${identifierInput.value.trim().slice(-4)}`;
      document.getElementById('billReviewAmount').textContent = formatNaira(Number(amountInput.value));
      billForm.hidden = true;
      review.hidden = false;
      review.focus();
    });

    document.getElementById('editBillBtn').addEventListener('click', () => {
      review.hidden = true;
      billForm.hidden = false;
      identifierInput.focus();
    });

    document.getElementById('confirmBillBtn').addEventListener('click', event => {
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = 'Preparing demo receipt…';
      window.setTimeout(() => {
        document.getElementById('billReceiptCategory').textContent = categoryInput.value.charAt(0).toUpperCase() + categoryInput.value.slice(1);
        document.getElementById('billReceiptProvider').textContent = providerSelect.value;
        document.getElementById('billReceiptIdentifier').textContent = `••••••${identifierInput.value.trim().slice(-4)}`;
        document.getElementById('billReceiptAmount').textContent = formatNaira(Number(amountInput.value));
        document.getElementById('billReceiptReference').textContent = `DEMO-BILL-${Date.now()}`;
        review.hidden = true;
        receipt.hidden = false;
        receipt.focus();
      }, 350);
    });

    selectCategory('airtime');
  }

  /* ---------- Hero "Beam" animation (landing page) ---------- */
  const curve = document.getElementById('beamCurve');
  const spark = document.getElementById('beamSpark');
  const ring = document.getElementById('beamRing');
  const receivedAmt = document.getElementById('receivedAmt');
  const receivedStatus = document.getElementById('receivedStatus');

  if (curve && spark) {
    const pathLength = curve.getTotalLength();
    const duration = 1600; // ms for the spark to travel
    const pause = 1800; // ms to pause once received before looping
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function animateBeam(startTime) {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease-in-out
      const point = curve.getPointAtLength(eased * pathLength);
      spark.setAttribute('cx', point.x);
      spark.setAttribute('cy', point.y);
      spark.setAttribute('opacity', 1);

      if (t < 1) {
        requestAnimationFrame(() => animateBeam(startTime));
      } else {
        // arrived: show ring pulse + update receiver card
        spark.setAttribute('opacity', 0);
        ring.setAttribute('cx', point.x);
        ring.setAttribute('cy', point.y);
        pulseRing();
        if (receivedAmt) receivedAmt.textContent = '₦45,000.00';
        if (receivedStatus) receivedStatus.style.opacity = 1;

        setTimeout(() => {
          if (receivedAmt) receivedAmt.textContent = '₦0.00';
          if (receivedStatus) receivedStatus.style.opacity = 0;
          if (!reduceMotion) requestAnimationFrame(() => animateBeam(performance.now()));
        }, pause);
      }
    }

    function pulseRing() {
      let r = 6, opacity = 0.9;
      ring.setAttribute('opacity', opacity);
      const grow = () => {
        r += 1.6;
        opacity -= 0.045;
        ring.setAttribute('r', r);
        ring.setAttribute('opacity', Math.max(opacity, 0));
        if (opacity > 0) requestAnimationFrame(grow);
        else { ring.setAttribute('r', 6); }
      };
      requestAnimationFrame(grow);
    }

    if (!reduceMotion) {
      requestAnimationFrame(() => animateBeam(performance.now()));
    } else {
      // Static reduced-motion state: show a completed transfer
      const endPoint = curve.getPointAtLength(pathLength);
      spark.setAttribute('cx', endPoint.x);
      spark.setAttribute('cy', endPoint.y);
      spark.setAttribute('opacity', 1);
      if (receivedAmt) receivedAmt.textContent = '₦45,000.00';
      if (receivedStatus) receivedStatus.style.opacity = 1;
    }
  }

  /* ---------- Password show/hide toggle ---------- */
  document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.input-wrap').querySelector('input');
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.textContent = isPass ? 'Hide' : 'Show';
    });
  });

  /* ---------- Password strength meter (signup) ---------- */
  const passInput = document.getElementById('password');
  const meter = document.getElementById('strengthMeter');
  const hint = document.getElementById('strengthHint');

  if (passInput && meter) {
    const bars = meter.querySelectorAll('span');
    const colors = ['#D64545', '#FFC72C', '#1E6FEB', '#1B8A5A'];
    const labels = ['Too weak', 'Getting there', 'Good', 'Strong'];

    passInput.addEventListener('input', () => {
      const val = passInput.value;
      let score = 0;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
      if (/\d/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      bars.forEach((bar, i) => {
        bar.style.background = i < score ? colors[Math.max(score - 1, 0)] : '#E2E8F0';
      });
      hint.textContent = val.length === 0
        ? 'Use 8+ characters with a number and a symbol.'
        : labels[Math.max(score - 1, 0)];
    });
  }

  /* ---------- Validation helpers ---------- */
  function setInvalid(fieldEl, invalid) {
    if (!fieldEl) return;
    fieldEl.classList.toggle('invalid', invalid);
  }

  function isValidEmailOrPhone(val) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRe = /^[0-9+\-\s()]{7,}$/;
    return emailRe.test(val) || phoneRe.test(val);
  }
  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }
  function isValidPhone(val) {
    return /^[0-9+\-\s()]{7,}$/.test(val);
  }

  /* ---------- Login form ---------- */
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const maxAttempts = 3;
    const lockDuration = 30 * 1000;
    const attemptKey = 'cobaDemoLoginAttempts';
    let attemptTimer;

    function readAttempts() {
      try {
        return JSON.parse(localStorage.getItem(attemptKey)) || { count: 0, lockedUntil: 0 };
      } catch (error) {
        return { count: 0, lockedUntil: 0 };
      }
    }

    function showLoginNotice(text, isError = false) {
      const msg = document.getElementById('formMsg');
      document.getElementById('formMsgText').textContent = text;
      msg.classList.toggle('error', isError);
      msg.classList.add('show');
    }

    function clearAttemptLimit() {
      localStorage.removeItem(attemptKey);
      if (attemptTimer) window.clearInterval(attemptTimer);
      const submit = loginForm.querySelector('button[type="submit"]');
      submit.disabled = false;
      submit.textContent = 'Log in';
    }

    function startLockout(lockedUntil) {
      const submit = loginForm.querySelector('button[type="submit"]');
      submit.disabled = true;

      const update = () => {
        const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
        if (remaining === 0) {
          clearAttemptLimit();
          showLoginNotice('You can try signing in again.', false);
          return;
        }
        submit.textContent = `Try again in ${remaining}s`;
        showLoginNotice(`Too many attempts. Try again in ${remaining} seconds.`, true);
      };

      update();
      attemptTimer = window.setInterval(update, 1000);
    }

    const existingAttempts = readAttempts();
    if (existingAttempts.lockedUntil > Date.now()) {
      startLockout(existingAttempts.lockedUntil);
    } else if (existingAttempts.lockedUntil) {
      clearAttemptLimit();
    }

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const attempts = readAttempts();
      if (attempts.lockedUntil > Date.now()) {
        startLockout(attempts.lockedUntil);
        return;
      }

      const email = document.getElementById('email');
      const password = document.getElementById('password');
      let valid = true;

      if (!isValidEmailOrPhone(email.value.trim())) {
        setInvalid(document.getElementById('emailField'), true);
        valid = false;
      } else {
        setInvalid(document.getElementById('emailField'), false);
      }

      if (password.value.trim().length === 0) {
        setInvalid(document.getElementById('passField'), true);
        valid = false;
      } else {
        setInvalid(document.getElementById('passField'), false);
      }

      if (!valid) {
        const nextCount = attempts.count + 1;
        if (nextCount >= maxAttempts) {
          const lockedUntil = Date.now() + lockDuration;
          localStorage.setItem(attemptKey, JSON.stringify({ count: nextCount, lockedUntil }));
          startLockout(lockedUntil);
        } else {
          localStorage.setItem(attemptKey, JSON.stringify({ count: nextCount, lockedUntil: 0 }));
          showLoginNotice(`${maxAttempts - nextCount} attempt${maxAttempts - nextCount === 1 ? '' : 's'} remaining.`, true);
        }
        return;
      }

      clearAttemptLimit();
      const accountName = email.value.trim().includes('@')
        ? email.value.trim().split('@')[0].replace(/[._-]+/g, ' ')
        : 'Demo user';
      const displayName = accountName.split(/\s+/).filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
      clearAttemptLimit();
      beginDemoVerification(displayName, email.value.trim());
    });
  }

  /* ---------- Demo one-time-code challenge ---------- */
  const otpForm = document.getElementById('otpForm');
  if (otpForm) {
    otpForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!otpForm.reportValidity()) return;
      let pending;
      try {
        pending = JSON.parse(sessionStorage.getItem('cobaPendingDemoOtp'));
      } catch (error) {
        pending = null;
      }

      const codeInput = document.getElementById('otpInput');
      const status = document.getElementById('otpStatus');
      if (!pending || typeof pending.name !== 'string') {
        status.textContent = 'Start demo sign-in again to request a verification code.';
        status.className = 'settings-status error';
        return;
      }
      if (codeInput.value !== pending.code) {
        status.textContent = 'That demo code does not match. Use the code shown above.';
        status.className = 'settings-status error';
        codeInput.select();
        return;
      }

      status.textContent = 'Demo code verified. Opening the sample dashboard…';
      status.className = 'settings-status success';
      window.setTimeout(() => startDemoSession(pending.name), 350);
    });

    document.getElementById('otpBackBtn').addEventListener('click', () => {
      sessionStorage.removeItem('cobaPendingDemoOtp');
      otpForm.closest('#otpPanel').hidden = true;
      document.getElementById('loginForm').hidden = false;
      document.getElementById('email').focus();
    });
  }

  /* ---------- Signup form ---------- */
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      const firstName = document.getElementById('firstName');
      const lastName = document.getElementById('lastName');
      const email = document.getElementById('email');
      const phone = document.getElementById('phone');
      const password = document.getElementById('password');
      const terms = document.getElementById('terms');

      setInvalid(document.getElementById('firstField'), firstName.value.trim().length === 0);
      if (firstName.value.trim().length === 0) valid = false;

      setInvalid(document.getElementById('lastField'), lastName.value.trim().length === 0);
      if (lastName.value.trim().length === 0) valid = false;

      const emailOk = isValidEmail(email.value.trim());
      setInvalid(document.getElementById('emailField'), !emailOk);
      if (!emailOk) valid = false;

      const phoneOk = isValidPhone(phone.value.trim());
      setInvalid(document.getElementById('phoneField'), !phoneOk);
      if (!phoneOk) valid = false;

      const passOk = password.value.length >= 8;
      setInvalid(document.getElementById('passField'), !passOk);
      if (!passOk) valid = false;

      if (!terms.checked) {
        valid = false;
        terms.closest('.checkbox-row').style.color = '#D64545';
      } else {
        terms.closest('.checkbox-row').style.color = '';
      }

      if (valid) {
        const msg = document.getElementById('formMsg');
        msg.classList.add('show');
        signupForm.querySelector('button[type="submit"]').textContent = 'Creating account…';
      }
    });
  }

  /* ---------- Demo transaction history ---------- */
  const historySearch = document.getElementById('historySearch');
  if (historySearch) {
    const typeFilter = document.getElementById('historyType');
    const periodFilter = document.getElementById('historyPeriod');
    const rows = Array.from(document.querySelectorAll('.history-row'));
    const emptyState = document.getElementById('historyEmpty');
    const resultCount = document.getElementById('historyCount');

    function filterHistory() {
      const query = historySearch.value.trim().toLowerCase();
      const type = typeFilter.value;
      const period = periodFilter.value;
      let visibleCount = 0;

      rows.forEach(row => {
        const searchable = row.textContent.toLowerCase();
        const matchesQuery = !query || searchable.includes(query);
        const matchesType = type === 'all' || row.dataset.type === type;
        const matchesPeriod = period === 'all' || row.dataset.period === period;
        const visible = matchesQuery && matchesType && matchesPeriod;
        row.hidden = !visible;
        if (visible) visibleCount++;
      });

      emptyState.hidden = visibleCount !== 0;
      resultCount.textContent = `${visibleCount} sample transaction${visibleCount === 1 ? '' : 's'}`;
    }

    historySearch.addEventListener('input', filterHistory);
    typeFilter.addEventListener('change', filterHistory);
    periodFilter.addEventListener('change', filterHistory);
  }

  /* ---------- Demo savings vault ---------- */
  const vaultForm = document.getElementById('vaultForm');
  if (vaultForm) {
    const vaultAmount = document.getElementById('vaultAmount');
    const vaultName = document.getElementById('vaultName');
    const vaultLock = document.getElementById('vaultLock');
    const vaultPreview = document.getElementById('vaultPreview');
    const vaultList = document.getElementById('vaultList');
    const emptyVault = document.getElementById('emptyVault');

    function formatNaira(amount) {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency', currency: 'NGN', minimumFractionDigits: 2
      }).format(amount);
    }

    function updatePreview() {
      const amount = Number(vaultAmount.value);
      if (!amount || amount <= 0) {
        vaultPreview.textContent = 'Enter a sample amount';
        return;
      }
      const dailyInterest = (amount * 0.12) / 365;
      vaultPreview.textContent = `Illustrative daily interest: ${formatNaira(dailyInterest)} · 12% example rate`;
    }

    vaultAmount.addEventListener('input', updatePreview);

    vaultForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!vaultForm.reportValidity()) return;

      const amount = Number(vaultAmount.value);
      const lockDays = Number(vaultLock.value);
      const name = vaultName.value.trim();
      const unlockDate = new Date();
      unlockDate.setDate(unlockDate.getDate() + lockDays);

      const card = document.createElement('article');
      card.className = 'vault-card';
      card.innerHTML = `
        <div class="vault-card-top"><span class="vault-icon" aria-hidden="true">₦</span><span class="vault-status">Demo locked</span></div>
        <h3></h3>
        <div class="vault-card-amount"></div>
        <div class="vault-card-meta"><span>Illustrative 12% annual rate</span><span></span></div>
      `;
      card.querySelector('h3').textContent = name;
      card.querySelector('.vault-card-amount').textContent = formatNaira(amount);
      card.querySelector('.vault-card-meta span:last-child').textContent = `Unlocks ${unlockDate.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`;

      vaultList.appendChild(card);
      emptyVault.hidden = true;
      vaultForm.reset();
      updatePreview();
      card.focus?.();
    });
  }

  /* ---------- Demo cards ---------- */
  const cardsFreezeBtn = document.getElementById('cardsFreezeBtn');
  if (cardsFreezeBtn) {
    const cardPreview = document.getElementById('demoCardPreview');
    const cardState = document.getElementById('cardState');
    let frozen = false;

    cardsFreezeBtn.addEventListener('click', () => {
      frozen = !frozen;
      cardPreview.classList.toggle('frozen', frozen);
      cardState.textContent = frozen ? 'Frozen · demo only' : 'Active · demo only';
      cardsFreezeBtn.textContent = frozen ? 'Unfreeze card' : 'Freeze card';
      cardsFreezeBtn.setAttribute('aria-pressed', String(frozen));
    });

    const requestForm = document.getElementById('requestCardForm');
    const requestType = document.getElementById('requestCardType');
    const requestConfirmation = document.getElementById('requestCardConfirmation');

    requestForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!requestForm.reportValidity()) return;
      const cardType = requestType.options[requestType.selectedIndex].text;
      document.getElementById('requestCardTypeText').textContent = cardType;
      requestForm.hidden = true;
      requestConfirmation.hidden = false;
      requestConfirmation.focus();
    });

    document.getElementById('requestAnotherCardBtn').addEventListener('click', () => {
      requestConfirmation.hidden = true;
      requestForm.hidden = false;
      requestType.focus();
    });
  }

  /* ---------- Demo profile and settings ---------- */
  const profileName = document.getElementById('profileName');
  const profilePhone = document.getElementById('profilePhone');
  const profileEmail = document.getElementById('profileEmail');
  const profileForm = document.getElementById('profileForm');
  const profileStatus = document.getElementById('profileStatus');
  const passwordForm = document.getElementById('passwordForm');
  const passwordStatus = document.getElementById('passwordStatus');
  const notificationInputs = Array.from(document.querySelectorAll('[data-notification]'));

  let savedProfile = {};
  try {
    savedProfile = JSON.parse(localStorage.getItem('cobaDemoProfile')) || {};
  } catch (error) {
    savedProfile = {};
  }

  profileName.value = savedProfile.name || demoSession.name;
  profilePhone.value = savedProfile.phone || '';
  profileEmail.value = savedProfile.email || '';
  notificationInputs.forEach(input => {
    input.checked = savedProfile[input.dataset.notification] !== false;
  });

  document.getElementById('profileHeaderName').textContent = profileName.value;
  document.getElementById('profileInitials').textContent = profileName.value
    .split(/\s+/).filter(Boolean).map(part => part.charAt(0)).join('').slice(0, 2).toUpperCase();

  profileForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!profileForm.reportValidity()) return;

    const profile = {
      name: profileName.value.trim(),
      phone: profilePhone.value.trim(),
      email: profileEmail.value.trim(),
      transactions: document.getElementById('notificationTransactions').checked,
      security: document.getElementById('notificationSecurity').checked,
      marketing: document.getElementById('notificationMarketing').checked
    };
    localStorage.setItem('cobaDemoProfile', JSON.stringify(profile));
    demoSession.name = profile.name;
    sessionStorage.setItem('cobaDemoSession', JSON.stringify(demoSession));

    document.getElementById('profileHeaderName').textContent = profile.name;
    document.getElementById('profileInitials').textContent = profile.name
      .split(/\s+/).filter(Boolean).map(part => part.charAt(0)).join('').slice(0, 2).toUpperCase();
    profileStatus.textContent = 'Demo profile and notification preferences saved on this browser.';
    profileStatus.className = 'settings-status success';
  });

  passwordForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!passwordForm.reportValidity()) return;

    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    if (newPassword.value.length < 8) {
      passwordStatus.textContent = 'Use at least 8 characters for the demo password.';
      passwordStatus.className = 'settings-status error';
      return;
    }
    if (newPassword.value !== confirmPassword.value) {
      passwordStatus.textContent = 'The new password entries do not match.';
      passwordStatus.className = 'settings-status error';
      return;
    }

    passwordForm.reset();
    passwordStatus.textContent = 'Demo validation passed. No real password or account credential was changed.';
    passwordStatus.className = 'settings-status success';
  });

  document.getElementById('profileLogoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('cobaDemoSession');
    window.location.assign('login.html');
  });
});

/* ---------- Password show/hide toggle (for demo login/signup) ---------- */
document.querySelectorAll('.toggle-pass').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.closest('.input-wrap').querySelector('input');
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.textContent = isPass ? 'Hide' : 'Show';
  });
});

/* ---------- Google / Apple sign-in simulation ---------- */
// Demo-only front-end flow (no real OAuth backend).
// See note at bottom for what's needed to go live.
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('oauthOverlay');
  const modal = document.getElementById('oauthModal');
  if (!overlay || !modal) return; // not on an auth page

  const googleAccounts = [
    { name: 'Tomi Adebayo', email: 'tomi.adebayo@gmail.com', color: '#1E6FEB' },
    { name: 'Zainab Bello', email: 'zainab.bello@gmail.com', color: '#EA9C00' }
  ];
  const appleAccount = { name: 'Tomi Adebayo', email: 'tomi.adebayo@icloud.com' };
  let hideEmail = false;

  function openOverlay() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }
  function closeOverlay() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function initials(name) {
    return name.split(' ').map(p => p.charAt(0)).join('').slice(0, 2).toUpperCase();
  }

  function renderGoogleChooser() {
    modal.className = 'oauth-modal';
    modal.innerHTML = `
      <div class="oauth-modal-header">
        <svg class="provider-logo" viewBox="0 0 48 48" width="36" height="36">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.7 34.7 27 35.5 24 35.5c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C39.5 37.5 44 31.3 44 24c0-1.3-.1-2.7-.4-3.5z"/>
        </svg>
        <h3>Sign in with Google</h3>
        <p>Choose an account to continue to Coba</p>
      </div>
      <div class="oauth-account-list">
        ${googleAccounts.map((a, i) => `
          <button type="button" class="oauth-account" data-i="${i}">
            <span class="oauth-avatar" style="background:${a.color}">${initials(a.name)}</span>
            <span>
              <span class="oauth-account-name">${a.name}</span>
              <span class="oauth-account-email">${a.email}</span>
            </span>
          </button>`).join('')}
        <button type="button" class="oauth-account" id="oauthUseOther">
          <span class="oauth-avatar" style="background:#5f6368;">+</span>
          <span><span class="oauth-account-name">Use another account</span></span>
        </button>
      </div>
      <p class="oauth-demo-note">Demo chooser — no real Google account is contacted.</p>
      <div class="oauth-footer"><button type="button" class="oauth-cancel" id="oauthCancel">Cancel</button></div>
    `;

    modal.querySelectorAll('.oauth-account[data-i]').forEach(btn => {
      btn.addEventListener('click', () => {
        const acc = googleAccounts[Number(btn.getAttribute('data-i'))];
        runGoogleSignIn(acc);
      });
    });
    document.getElementById('oauthUseOther').addEventListener('click', () => {
      runGoogleSignIn(googleAccounts[0]);
    });
    document.getElementById('oauthCancel').addEventListener('click', closeOverlay);
  }

  function runGoogleSignIn(acc) {
    renderLoading('google');
    setTimeout(() => finishOAuth('Google', acc.name, acc.email), 1000);
  }

  function renderAppleSheet() {
    modal.className = 'oauth-modal apple-theme';
    const emailDisplay = hideEmail ? 'Hidden — Coba gets a private relay address' : appleAccount.email;
    modal.innerHTML = `
      <div class="oauth-modal-header">
        <svg class="provider-logo" viewBox="0 0 24 24" width="30" height="30" fill="#fff">
          <path d="M16.365 1.43c0 1.14-.462 2.25-1.15 3.03-.78.9-2.05 1.6-3.06 1.52-.13-1.1.44-2.26 1.13-3 .78-.87 2.13-1.53 3.08-1.55zm3.6 16.6c-.55 1.28-.82 1.85-1.53 2.98-.99 1.58-2.39 3.56-4.13 3.58-1.54.02-1.94-1.01-4.03-1-2.09.01-2.53 1.02-4.07 1-1.74-.02-3.06-1.79-4.05-3.37-2.78-4.4-3.07-9.57-1.35-12.31 1.22-1.95 3.15-3.09 4.96-3.09 1.85 0 3.01 1.02 4.53 1.02 1.48 0 2.37-1.03 4.53-1.03 1.6 0 3.3.87 4.51 2.38-3.97 2.18-3.33 7.85.6 9.84z"/>
        </svg>
        <h3>Sign in with Apple</h3>
        <p>Continue as ${appleAccount.name}</p>
      </div>
      <div class="oauth-account-list">
        <button type="button" class="oauth-account" id="oauthAppleContinue">
          <span class="oauth-avatar" style="background:#1E6FEB;">${initials(appleAccount.name)}</span>
          <span>
            <span class="oauth-account-name">${appleAccount.name}</span>
            <span class="oauth-account-email">${emailDisplay}</span>
          </span>
        </button>
      </div>
      <div class="oauth-hide-email-row">
        <span>Hide my email from Coba</span>
        <button type="button" class="oauth-toggle ${hideEmail ? 'on' : ''}" id="oauthHideEmailToggle" aria-label="Toggle hide my email"></button>
      </div>
      <p class="oauth-demo-note">Demo sheet — no real Apple ID is contacted.</p>
      <div class="oauth-footer"><button type="button" class="oauth-cancel" id="oauthCancel">Cancel</button></div>
    `;

    document.getElementById('oauthHideEmailToggle').addEventListener('click', () => {
      hideEmail = !hideEmail;
      renderAppleSheet();
    });
    document.getElementById('oauthAppleContinue').addEventListener('click', () => {
      const email = hideEmail ? 'k3f8s1p2@privaterelay.appleid.com' : appleAccount.email;
      renderLoading('apple');
      setTimeout(() => finishOAuth('Apple', appleAccount.name, email), 1000);
    });
    document.getElementById('oauthCancel').addEventListener('click', closeOverlay);
  }

  function renderLoading(provider) {
    modal.className = 'oauth-modal' + (provider === 'apple' ? ' apple-theme' : '');
    modal.innerHTML = `
      <div class="oauth-loading">
        <div class="oauth-spinner"></div>
        <p>Connecting to ${provider === 'apple' ? 'Apple' : 'Google'}…</p>
      </div>`;
  }

  function finishOAuth(provider, name, email) {
    closeOverlay();
    const parts = name.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    // Signup page: prefill fields + show success
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
      const firstEl = document.getElementById('firstName');
      const lastEl = document.getElementById('lastName');
      const emailEl = document.getElementById('email');
      const termsEl = document.getElementById('terms');
      if (firstEl) firstEl.value = firstName || '';
      if (lastEl) lastEl.value = lastName || '';
      if (emailEl) emailEl.value = email;
      if (termsEl) termsEl.checked = true;

      const msg = document.getElementById('formMsg');
      const msgText = document.getElementById('formMsgText');
      if (msg && msgText) {
        msgText.textContent = `Account created with ${provider} — welcome to Coba!`;
        msg.classList.add('show');
      }
      const submitBtn = signupForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Redirecting…';
      return;
    }

    // Login page: straight to success
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      const msg = document.getElementById('formMsg');
      const msgText = document.getElementById('formMsgText');
      if (msg && msgText) {
        msgText.textContent = `Signed in with ${provider} as ${email} — redirecting…`;
        msg.classList.add('show');
      }
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Redirecting…';
      beginDemoVerification(name, email);
    }
  }

  document.querySelectorAll('[data-oauth="google"]').forEach(btn => {
    btn.addEventListener('click', () => { renderGoogleChooser(); openOverlay(); });
  });
  document.querySelectorAll('[data-oauth="apple"]').forEach(btn => {
    btn.addEventListener('click', () => { hideEmail = false; renderAppleSheet(); openOverlay(); });
  });

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlay(); });
});
