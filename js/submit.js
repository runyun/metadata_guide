(function () {
  async function collectFormData() {
    const inputs = document.querySelectorAll('#metadataList input[type="text"]');
    const data = {};
    inputs.forEach(input => {
      const key = input.id.replace(/Result$/, '');
      data[key] = input.value || null;
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

  document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.addEventListener('click', submitMetadata);

    // if user logs in/out, clear messages
    window.onUserLogin = function(user) {
      const resultSpan = document.getElementById('submitResult');
      if (resultSpan) resultSpan.textContent = '';
    };
  });

})();
