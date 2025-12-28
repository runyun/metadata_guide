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
    if (typeof window.onUserLogin === 'function') window.onUserLogin(user);
    return user;
  }

  function logout() {
    clearUser();
    renderUserState();
    if (typeof window.onUserLogout === 'function') window.onUserLogout();
  }

  function renderUserState() {
    const user = getCurrentUser();
    const loginBox = document.getElementById('loginBox');
    const appContent = document.getElementById('homeContainer');
    const userDisplay = document.getElementById('userDisplay');
    const header = document.getElementsByTagName('header')[0];

    if (!loginBox || !appContent) return;

    if (user) {
      loginBox.style.display = 'none';
      appContent.style.display = '';
      header.style.display = '';
      if (userDisplay) userDisplay.textContent = '已登入：' + user.name;
    } else {
      loginBox.style.display = 'block';
      appContent.style.display = 'none';
      header.style.display = 'none';
      if (userDisplay) userDisplay.textContent = '';
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
  });

  window.guideAuth = {
    getCurrentUser,
    loginByName,
    logout
  };

})();
