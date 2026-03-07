// Simple name-only login using Supabase as a users table.
(function () {
  const STORAGE_KEY = 'guideUser';

  function saveUser(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  function clearUser() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      return null;
    }
  }

  async function loginByName(name) {
    if (!name || !name.trim()) throw new Error('請輸入名稱');

    if (!window.supabaseApi) throw new Error('Supabase 未初始化');

    const trimmed = name.trim();
    const user = await window.supabaseApi.findUserByName(trimmed);
    if (!user) {
      throw new Error('登入失敗');
    }
    saveUser(user);
    renderUserState();
    // start idle timer and track activity whenever user logs in
    resetInactivityTimer();
    registerActivityListeners();
    if (typeof window.onUserLogin === 'function') window.onUserLogin(user);
    return user;
  }

  function logout() {
    clearUser();
    renderUserState();
    clearTimeout(inactivityTimer);
    // optionally remove activity listeners
    const events = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach((ev) => {
      document.removeEventListener(ev, resetInactivityTimer);
    });

    // If there is no login UI on this page (e.g. list.html), redirect back to index
    if (!document.getElementById('loginBox')) {
      window.location.href = 'index.html';
    }

    if (typeof window.onUserLogout === 'function') window.onUserLogout();
  }

  // idle tracking --------------------------------------------------------
  const INACTIVITY_LIMIT = 60 * 60 * 1000; // 60 minutes
  let inactivityTimer = null;

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    if (getCurrentUser()) {
      inactivityTimer = setTimeout(() => {
        alert('閒置時間過長，已自動登出');
        logout();
      }, INACTIVITY_LIMIT);
    }
  }

  function registerActivityListeners() {
    const events = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach((ev) => {
      document.addEventListener(ev, resetInactivityTimer);
    });
  }

  function renderUserState() {
    const user = getCurrentUser();
    const loginBox = document.getElementById('loginBox');
    const appContent = document.getElementById('homeContainer');
    const userDisplay = document.getElementById('userDisplay');
    const header = document.getElementsByTagName('header')[0];

    // Show/hide login UI if present (index page)
    if (loginBox) {
      if (user) {
        loginBox.style.display = 'none';
        if (appContent) appContent.style.display = '';
        if (header) header.style.display = '';
      } else {
        loginBox.style.display = 'flex';
        if (appContent) appContent.style.display = 'none';
        if (header) header.style.display = 'none';
      }
    }

    // Update user display if available (list page + index page)
    if (userDisplay) {
      if (user) {
        let text = '已登入：' + user.name;
        if (user.roles && user.roles.length) {
          const roleNames = user.roles.map(r => r.name || r.id);
          text += ' [' + roleNames.join(', ') + ']';
        }
        userDisplay.textContent = text;
      } else {
        userDisplay.textContent = '';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('loginBtn');
    const nameInput = document.getElementById('loginName');
    const logoutBtn = document.getElementById('logoutBtn');

    if (submitBtn && nameInput) {
      submitBtn.addEventListener('click', async () => {
        submitBtn.disabled = true;
        try {
          await loginByName(nameInput.value);
        } catch (err) {
          alert(err.message || '登入失敗');
        } finally {
          submitBtn.disabled = false;
        }
      });

      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitBtn.click();
      });
    }

    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    renderUserState();
    // if user was already logged in when page loaded, start tracking
    if (getCurrentUser()) {
      resetInactivityTimer();
      registerActivityListeners();
    }
  });

  window.guideAuth = {
    getCurrentUser,
    loginByName,
    logout
  };

})();
