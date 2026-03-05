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
  async function saveMetadata() {
    // similar validation as submitMetadata, but also create a book_entries row
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

    const saveBtn = document.getElementById('saveBtn');
    const resultSpan = document.getElementById('submitResult');
    if (saveBtn) saveBtn.disabled = true;
    if (resultSpan) resultSpan.textContent = '';

    try {
      const payload = await collectFormData();

      // insert into metadata table first and grab its id
      const {
        data: metaRows,
        error: metaErr
      } = await window.supabaseClient
        .from('metadata')
        .insert([{ data: payload }])
        .select();

      if (metaErr) throw metaErr;
      const metaId = metaRows && metaRows[0] && metaRows[0].id;
      if (!metaId) throw new Error('無法取得 metadata id');

      // prepare book_entries record
      const entryObj = {
        added_by: user.id,
        book_id: metaId
      };

      // attach organization/location if available from user affiliations
      if (user.affiliations && user.affiliations.length > 0) {
        const aff = user.affiliations[0];
        if (aff.organization && aff.organization.id) {
          entryObj.organization_id = aff.organization.id;
        }
        if (aff.location && aff.location.id) {
          entryObj.location_id = aff.location.id;
        }
      }

      const {
        data: entryRows,
        error: entryErr
      } = await window.supabaseClient
        .from('book_entries')
        .insert([entryObj]);

      if (entryErr) throw entryErr;

      // optional: also save current form to localStorage so user can continue later
      try {
        const stored = JSON.parse(localStorage.getItem('guideData') || '{}');
        Object.assign(stored, payload);
        localStorage.setItem('guideData', JSON.stringify(stored));
      } catch (e) {
        // ignore localStorage errors
      }

      if (resultSpan) {
        resultSpan.style.color = 'green';
        resultSpan.textContent = '已成功儲存';
      }

    } catch (err) {
      if (resultSpan) {
        resultSpan.style.color = 'crimson';
        resultSpan.textContent = '儲存失敗：' + (err.message || err);
      }
      console.error(err);
    } finally {
      if (saveBtn) saveBtn.disabled = false;
      if (resultSpan) setTimeout(() => { if (resultSpan) resultSpan.textContent = '' }, 4000);
    }
  }

  window.saveMetadata = saveMetadata;
  window.setupSubmitHandlers = setupSubmitHandlers;

})();
