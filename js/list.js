// Fetch and render entries from `metadata` table with book_entries status
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

  // Convert metadata data to guideData format for loading into form
  function dataToGuideData(metaData) {
    const guideData = {};
    
    for (const col of data.columns) {
      const value = metaData[col.name] || '';
      const pageValue = metaData[col.name + '_page'] || '';
      
      guideData[col.name] = {
        value: value,
        page: pageValue
      };
    }
    return guideData;
  }

  // Open record in index.html
  function openRecord(metaId, bookEntryId, metaData) {
    // Save metadata to localStorage as guideData
    const guideData = dataToGuideData(metaData);
    try {
      localStorage.setItem('guideData', JSON.stringify(guideData));
    } catch (e) {
      console.error('Unable to save to localStorage:', e);
    }

    // Save ids to sessionStorage for later use
    try {
      sessionStorage.setItem('currentBookEntryId', bookEntryId);
      sessionStorage.setItem('currentMetaId', metaId);
    } catch (e) {
      console.error('Unable to save to sessionStorage:', e);
    }

    // Open index.html in same window
    window.location.href = 'index.html?metaId=' + metaId;
  }

  let allRows = [];

  function getFilters() {
    const from = document.getElementById('filterFrom')?.value;
    const to = document.getElementById('filterTo')?.value;
    const status = document.getElementById('filterStatus')?.value;
    const org = document.getElementById('filterOrg')?.value?.trim();
    const loc = document.getElementById('filterLoc')?.value?.trim();
    const creator = document.getElementById('filterCreator')?.value?.trim();

    return { from, to, status, org, loc, creator };
  }

  function normalizeText(str) {
    return (str || '').toString().trim().toLowerCase();
  }

  function matchesFilters(row, filters, creatorMap) {
    const hasAnyFilter = !!(filters.from || filters.to || filters.status || filters.org || filters.loc || filters.creator);
    if (!hasAnyFilter) return true;

    const entry = (row.book_entries && row.book_entries.length > 0) ? row.book_entries[0] : {};

    // Created date filter
    if (filters.from || filters.to) {
      const addedAt = entry.added_at ? new Date(entry.added_at) : null;
      if (!addedAt) return false;

      if (filters.from) {
        const min = new Date(filters.from);
        if (addedAt < min) return false;
      }
      if (filters.to) {
        const max = new Date(filters.to);
        // include entire day
        max.setHours(23, 59, 59, 999);
        if (addedAt > max) return false;
      }
    }

    // Status filter
    if (filters.status) {
      if (entry.status_code !== filters.status) return false;
    }

    // Creator filter
    if (filters.creator) {
      const creatorName = normalizeText(creatorMap[entry.added_by] || '');
      if (!creatorName.includes(normalizeText(filters.creator))) return false;
    }

    // Organization filter
    if (filters.org) {
      const orgName = normalizeText(entry.organizations?.name || '');
      if (!orgName.includes(normalizeText(filters.org))) return false;
    }

    // Location filter
    if (filters.loc) {
      const locName = normalizeText(entry.locations?.name || '');
      if (!locName.includes(normalizeText(filters.loc))) return false;
    }

    return true;
  }

  function renderTable(rows, creatorMap) {
    const container = document.getElementById('listContainer');
    if (!container) return;

    if (!rows || rows.length === 0) {
      container.innerHTML = '<p>目前沒有資料。</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'metadataTable';

    // Header: Action | Status | ID | Created | Creator | ...columns
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>操作</th><th>狀態</th><th>編號</th><th>建立時間</th><th>建立者</th>' + 
                          data.columns.map(col => `<th>${col.display}</th>`).join('');
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const row of rows) {
      const tr = document.createElement('tr');

      // Get book entry info
      let bookEntryId = null;
      let statusCode = '編輯中'; // default status
      let statusDisplay = '編輯中';
      let created = ''; // default empty
      let creatorName = '';

      if (row.book_entries && row.book_entries.length > 0) {
        const entry = row.book_entries[0];
        bookEntryId = entry.id;
        statusCode = entry.status_code;
        created = fmtDate(entry.added_at);
        creatorName = creatorMap[entry.added_by] || '';

        // Map status code to display name
        const statusMap = {
          'editing': '編輯中',
          'reviewing': '審核中',
          'closing': '待結案',
          'closed': '已結案'
        };
        statusDisplay = statusMap[statusCode] || statusCode;
      }

      // Create action button
      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.textContent = '打開';
      actionBtn.style.cursor = 'pointer';

      actionBtn.addEventListener('click', () => {
        openRecord(row.id, bookEntryId, row.data);
      });

      const actionCell = document.createElement('td');
      actionCell.appendChild(actionBtn);

      // Status cell
      const statusCell = document.createElement('td');
      statusCell.textContent = statusDisplay;

      // ID
      const idCell = document.createElement('td');
      idCell.textContent = row.id;

      // created
      const createdCell = document.createElement('td');
      createdCell.textContent = created;

      // creator
      const creatorCell = document.createElement('td');
      creatorCell.textContent = creatorName;

      tr.appendChild(actionCell);
      tr.appendChild(statusCell);
      tr.appendChild(idCell);
      tr.appendChild(createdCell);
      tr.appendChild(creatorCell);

      // columns
      for (const col of data.columns) {
        const td = document.createElement('td');
        td.textContent = row.data[col.name] || '';
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    container.innerHTML = '';
    container.appendChild(table);
  }

  async function applyFilters() {
    const filters = getFilters();

    // Fully rebuild creator map for lookup
    const creatorIds = new Set();
    for (const row of allRows) {
      if (row.book_entries && row.book_entries.length > 0) {
        const entry = row.book_entries[0];
        if (entry.added_by) creatorIds.add(entry.added_by);
      }
    }

    const creatorMap = {};
    if (creatorIds.size > 0) {
      const { data: users, error: usersError } = await window.supabaseClient
        .from('users')
        .select('id, name')
        .in('id', Array.from(creatorIds));
      if (!usersError && users && users.length) {
        users.forEach(u => {
          creatorMap[u.id] = u.name;
        });
      }
    }

    const filtered = allRows.filter(row => matchesFilters(row, filters, creatorMap));
    renderTable(filtered, creatorMap);
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
      // Fetch metadata with associated book_entries
      const { data: rows, error } = await window.supabaseClient
        .from('metadata')
        .select('id, data, book_entries(id, status_code, added_at, added_by, organization_id, organizations(id, name), location_id, locations(id, name))')
        .order('id', { ascending: false })
        .limit(200);

      if (error) throw error;

      allRows = rows || [];

      await applyFilters();

    } catch (err) {
      container.innerHTML = '<div style="color:crimson">載入失敗：' + (err.message || err) + '</div>';
      console.error(err);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('viewMetadataBtn');
    if (btn) btn.addEventListener('click', () => window.open('list.html', '_blank'));

    const applyBtn = document.getElementById('applyFiltersBtn');
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (applyBtn) applyBtn.addEventListener('click', () => applyFilters());
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        document.getElementById('filterFrom').value = '';
        document.getElementById('filterTo').value = '';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterOrg').value = '';
        document.getElementById('filterLoc').value = '';
        document.getElementById('filterCreator').value = '';
        applyFilters();
      });
    }

    if (location.pathname.endsWith('list.html')) {
      loadList();
    }
  });

})();
