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
      const { data: rows, error } = await window.supabaseClient
        .from('metadata')
        .select('id, user_id, data, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      if (!rows || rows.length === 0) {
        container.innerHTML = '<p>目前沒有資料。</p>';
        return;
      }

      const table = document.createElement('table');
      table.className = 'metadataTable';

      // Header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.innerHTML = '<th>編號</th><th>建立時間</th>' + data.columns.map(col => `<th>${col.display}</th>`).join('');
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Body
      const tbody = document.createElement('tbody');
      for (const row of rows) {
        const tr = document.createElement('tr');
        const created = fmtDate(row.created_at);
        tr.innerHTML = `<td>${row.id}</td><td>${created}</td>` + data.columns.map(col => `<td>${row.data[col.name] || ''}</td>`).join('');
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);

      container.innerHTML = '';
      container.appendChild(table);

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
