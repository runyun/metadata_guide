// Fetch and render entries from `metadata` table (data jsonb)
(async function () {
  function fmtDate(ts) {
    try {
      const d = new Date(ts);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}/${mm}/${dd}`;
    } catch (e) {
      return ts;
    }

  }

  async function loadList() {
    const user = window.guideAuth && window.guideAuth.getCurrentUser && window.guideAuth.getCurrentUser();
    if (!user) {
      alert('請先登入');
      location.href = 'index.html';
      return;
    }

    const container = document.getElementById('listContainer');
    if (!container) return;
    container.textContent = '載入中…';

    try {
      const { data, error } = await window.supabaseClient
        .from('metadata')
        .select('id, user_id, data, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      if (!data || data.length === 0) {
        container.innerHTML = '<p>目前沒有資料。</p>';
        return;
      }

      const list = document.createElement('div');
      list.className = 'metadataList';

      for (const row of data) {
        const item = document.createElement('div');
        item.className = 'metadataItem';
        const title = (row.data && row.data.title) ? row.data.title : '(無譜名)';
        const created = fmtDate(row.created_at);

        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(row.data, null, 2);
        pre.style.whiteSpace = 'pre-wrap';

        item.innerHTML = `<h3>${title}</h3><div>建立時間：${created}</div>`;
        item.appendChild(pre);
        list.appendChild(item);
      }

      container.innerHTML = '';
      container.appendChild(list);

    } catch (err) {
      container.innerHTML = '<div style="color:crimson">載入失敗：' + (err.message || err) + '</div>';
      console.error(err);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('viewMetadataBtn');
    if (btn) btn.addEventListener('click', () => window.open('list.html', '_blank'));

    if (location.pathname.endsWith('list.html')) {
      loadList();
    }
  });

})();
