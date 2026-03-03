(function () {
  async function collectFormData() {
    const inputs = document.querySelectorAll('#metadataList input[type="text"]');
    const data = {};
    
    // 先處理 volumes 清單
    const volumesList = document.getElementById('volumesList');
    if (volumesList) {
      const volumeInputs = volumesList.querySelectorAll('input[type="text"]');
      const volumeValues = Array.from(volumeInputs).map(input => input.value || null).filter(val => val !== null && val.trim() !== '');
      data.volumes = volumeValues.join('&');
    }
    
    // 處理其他輸入框
    inputs.forEach(input => {
      const key = input.id.replace(/Result\d*$/, '').replace(/Page$/, '');
      if (key && key !== 'volumes') {
        if (input.id.endsWith('Page')) {
          data[key + '_page'] = input.value || null;
        } else {
          data[key] = input.value || null;
        }
      } 
    });
    
    return data;
  }

  async function submitMetadata() {
    const titleInput = document.getElementById('titleResult');
    if (!titleInput) return alert('找不到「譜名」欄位');

    const title = (titleInput.value || '').trim();
    if (!title) return alert('「譜名」不可為空');

    const user = window.guideAuth && window.guideAuth.getCurrentUser && window.guideAuth.getCurrentUser();
    if (!user) {
      alert('請先登入');
      location.href = 'index.html';
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const resultSpan = document.getElementById('submitResult');
    submitBtn.disabled = true;
    resultSpan.textContent = '';

    try {
      const payload = await collectFormData();
      const { data, error } = await window.supabaseClient
        .from('metadata')
        .insert([{ user_id: user.id || null, data: payload }]);

      if (error) throw error;

      resultSpan.style.color = 'green';
      resultSpan.textContent = '已成功送出';

      // clear inputs after successful submit
      if (typeof clearAll === 'function') clearAll();

    } catch (err) {
      resultSpan.style.color = 'crimson';
      resultSpan.textContent = '送出失敗：' + (err.message || err);
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      setTimeout(() => { if (resultSpan) resultSpan.textContent = '' }, 4000);
    }
  }

  function setupSubmitHandlers() {
    // attach to whatever controls currently exist
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.removeEventListener('click', submitMetadata);
      submitBtn.addEventListener('click', submitMetadata);
    }
    const returnBtn = document.getElementById('returnBtn');
    if (returnBtn) {
      returnBtn.removeEventListener('click', returnMetadata);
      returnBtn.addEventListener('click', returnMetadata);
    }
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.removeEventListener('click', saveMetadata);
      saveBtn.addEventListener('click', saveMetadata);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupSubmitHandlers();

    // if user logs in/out, clear messages
    window.onUserLogin = function(user) {
      const resultSpan = document.getElementById('submitResult');
      if (resultSpan) resultSpan.textContent = '';
      // reattach handlers since buttons may have been rebuilt
      setupSubmitHandlers();
    };
  });

  // expose helpers so other scripts can call or override if needed
  window.submitMetadata = submitMetadata;
  window.returnMetadata = function() { alert('退回功能尚未實作'); };
  window.saveMetadata = function() { alert('儲存功能尚未實作'); };
  window.setupSubmitHandlers = setupSubmitHandlers;

})();
