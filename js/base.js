const allPlaces = [
  "書皮" // 0
  , "版心"
  , "目錄" // 2
  , "序言"
  , "書名頁" // 4
  , "版權頁"
  , "後記/跋" // 6
  , "世系圖"
  , "世傳" // 8
  , "修譜名錄" 
  , "凡例" // 10
  , "祠堂圖"
];

function addVolumeInput(listId) {
  const list = document.getElementById(listId);
  const inputContainer = document.createElement("div");
  inputContainer.className = "volume-input-container";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "請輸入卷冊內容";

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "刪除";
  deleteBtn.onclick = () => deleteVolumeInput(deleteBtn);

  inputContainer.appendChild(input);
  inputContainer.appendChild(deleteBtn);
  list.appendChild(inputContainer);
}

function deleteVolumeInput(btn) {
  const container = btn.parentElement;
  container.parentElement.removeChild(container);
}

function renderRules(rules) {
  if (!Array.isArray(rules) || rules.length === 0) return '';

  return `
    <p>注意事項：</p>
    <ul>
      ${rules.map(r => `<li>${r}</li>`).join('')}
    </ul>
  `;
}

function toggleContent(event) {
  event.stopPropagation(); 

  const arrow = event.target;                   
  const item = arrow.closest(".item");          
  const content = item.querySelector(".content");

  const isOpen = content.style.display === "block";

  content.style.display = isOpen ? "none" : "block";

  toggleArrow = isOpen ? "▶" : "▼";
  
  arrow.textContent = "提示 " + toggleArrow;
}

function loadColumns() {
  let html = "";

  for (const col of data.columns) {
    const places = col.placeIndexes ? col.placeIndexes.map(i => allPlaces[i]).join('、 ') : allPlaces.join('、 ');
    let guideHintHtml = '';
    if (col.hasGuide) {
      guideHintHtml = `<div class="guideHint">
          <a href="guide.html?type=${col.name}&typeDisplay=${col.display}">開始導覽 ▶</a>
      </div>`;
    }

    let inputHtml = '';
    if (col.name === 'volumes') {
      inputHtml = `
        <div class="volumes-list" id="${col.name}List">
          <div class="volume-input-container">
            <input type="text" id="${col.name}Result1" placeholder="請輸入卷冊內容">
            <button onclick="deleteVolumeInput(this)">刪除</button>
          </div>
        </div>
        <button onclick="addVolumeInput('${col.name}List')">新增一行</button>
      `;
    } else {
      inputHtml = `
        <input type="text" id="${col.name}Result" placeholder="請輸入${col.display}">
        <input type="text" id="${col.name}Page" placeholder="資訊所在頁碼" >
      `;
    }

      html += `
          <div class="item">
              <div class="title">
                  <p>${col.display}</p>
                  ${inputHtml}
                  <span class="arrow" onclick="toggleContent(event)">提示 ▶</span>
              </div>
              <div class="content">
                  <div>
                      <p>說明：${col.explain}</p>
                      <p>最可能出現的地方：${places}</p>
                      ${renderRules(col.rules)}
                  </div>
                  ${guideHintHtml}
              </div>
          </div>
      `;
  }

  document.getElementById("metadataList").innerHTML = html;

  fillFromLocalStorage()
}

function fillFromLocalStorage() {
  const stored = JSON.parse(localStorage.getItem("guideData") || "{}");

  for (const key in stored) {
    if (key === 'volumes') {
      const list = document.getElementById(key + "List");
      if (!list) continue;
      
      const values = stored[key].value ? stored[key].value.split('&') : [];
      const containers = list.querySelectorAll('.volume-input-container');
      
      // 移除現有的輸入框，除了第一個
      for (let i = containers.length - 1; i > 0; i--) {
        list.removeChild(containers[i]);
      }
      
      // 填充第一個
      if (containers.length > 0 && values.length > 0) {
        containers[0].querySelector('input').value = values[0];
      }
      
      // 新增並填充其餘的
      for (let i = 1; i < values.length; i++) {
        addVolumeInput(key + "List");
        const newContainers = list.querySelectorAll('.volume-input-container');
        newContainers[newContainers.length - 1].querySelector('input').value = values[i];
      }
    } else {
      const input = document.getElementById(key + "Result");
      if (input) {
        input.value = stored[key].value || ""; 
      }
    }

    const pageInput = document.getElementById(key + "Page");
    if (pageInput) {
      pageInput.value = stored[key].page || "";
    }
  }
}

function clearAll() {
    const inputs = document.querySelectorAll('#metadataList input[type="text"]');
    inputs.forEach(input => {
        input.value = "";
    });
    
    // 清空 volumes 清單，只保留一個輸入框
    const volumesList = document.getElementById('volumesList');
    if (volumesList) {
      const containers = volumesList.querySelectorAll('.volume-input-container');
      for (let i = containers.length - 1; i > 0; i--) {
        volumesList.removeChild(containers[i]);
      }
      if (containers.length > 0) {
        containers[0].querySelector('input').value = "";
      }
    }

    clearStoredFormState();
    updateFormTitle();

    // Clear submit result message
    const resultSpan = document.getElementById('submitResult');
    if (resultSpan) resultSpan.textContent = '';
}

function clearStoredFormState() {
  localStorage.removeItem('guideData');
  sessionStorage.removeItem('currentBookEntryId');
  sessionStorage.removeItem('currentMetaId');

  // Remove metaId from URL to prevent reload from reusing it
  const url = new URL(window.location.href);
  if (url.searchParams.has('metaId')) {
    url.searchParams.delete('metaId');
    window.history.replaceState(null, '', url.toString());
  }
}

function updateFormTitle() {
  const titleEl = document.getElementById('formTitle');
  if (!titleEl) return;

  const metaId = sessionStorage.getItem('currentMetaId');
  if (metaId) {
    titleEl.textContent = `表單編號：${metaId}`;
  } else {
    titleEl.textContent = '新表單';
  }
}

function goHome() {
  clearAll();
  // Reload the page to get a fresh form
  window.location.href = 'index.html';
}

function renderControlsForUser(user) {
  const controls = document.getElementById('controls');
  if (!controls) return;

  // decide which set of buttons to show based on roles
  const roles = (user.roles || []).map(r => r.name);
  let html = '';
  
  // Check if we're in approval workflow (loading from list.html)
  const inApprovalWorkflow = !!sessionStorage.getItem('currentBookEntryId');

  if (inApprovalWorkflow) {
    // In approval workflow - show role-specific approval buttons with rejection
    if (roles.includes('reviewer')) {
      html = `
        <button id="submitBtn">送結案</button>
        <button id="returnBtn">退回</button>
        <span id="submitResult"></span>
      `;
    } else if (roles.includes('approver')) {
      html = `
        <button id="submitBtn">結案</button>
        <button id="returnBtn">退回</button>
        <span id="submitResult"></span>
      `;
    } else if (roles.includes('inputter')) {
      html = `
        <button id="saveBtn">儲存</button>
        <button id="submitBtn">送審核</button>
        <span id="submitResult"></span>
      `;
      
      // Check if this record can be deleted (status='editing', added_by=current user, not in book_approvals)
      checkAndShowDeleteButton(user);
    }
  } else {
    // Not in approval workflow - new form (not yet in approval process)
    if (roles.includes('inputter')) {
      html = `
        <button id="saveBtn">儲存</button>
        <button id="submitBtn">送審核</button>
        <span id="submitResult"></span>
      `;
      checkAndShowDeleteButton(user);
    } else if (roles.includes('reviewer')) {
      html = `
        <button id="saveBtn">儲存</button>
        <button id="submitBtn">送結案</button>
        <span id="submitResult"></span>
      `;
    } else if (roles.includes('approver')) {
      html = `
        <button id="saveBtn">儲存</button>
        <button id="submitBtn">結案</button>
        <span id="submitResult"></span>
      `;
    } else {
      // default to basic submit behavior
      html = `
        <button id="saveBtn">儲存</button>
        <button id="submitBtn">送出</button>
        <span id="submitResult"></span>
      `;
    }
  }

  controls.innerHTML = html;

  // let submit.js attach its handlers (if available)
  if (typeof window.setupSubmitHandlers === 'function') {
    window.setupSubmitHandlers();
  }
}

async function checkAndShowDeleteButton(user) {
  try {
    const bookEntryId = parseInt(sessionStorage.getItem('currentBookEntryId') || '0');
    if (!bookEntryId) return;

    // Check if record exists in book_approvals
    const { data: approvalData, error: approvalError } = await window.supabaseClient
      .from('book_approvals')
      .select('id')
      .eq('book_entry_id', bookEntryId)
      .limit(1);

    if (approvalError) throw approvalError;

    // If already in book_approvals, don't show delete button
    if (approvalData && approvalData.length > 0) return;

    // Check book_entry status and added_by
    const { data: entryData, error: entryError } = await window.supabaseClient
      .from('book_entries')
      .select('status_code, added_by')
      .eq('id', bookEntryId)
      .single();

    if (entryError) throw entryError;

    // Only show delete button if status='editing' and added_by=current user
    if (entryData && entryData.status_code === 'editing' && entryData.added_by === user.id) {
      // Add delete button to controls
      const controls = document.getElementById('controls');
      const deleteBtn = document.createElement('button');
      deleteBtn.id = 'deleteBtn';
      deleteBtn.textContent = '刪除';
      deleteBtn.onclick = () => {
        if (confirm('確定要刪除此記錄嗎？此動作無法復原')) {
          if (typeof window.deleteRecord === 'function') {
            window.deleteRecord();
          }
        }
      };
      controls.appendChild(deleteBtn);
    }
  } catch (err) {
    console.error('Error checking delete button condition:', err);
  }
}

function initApp(skipClear = false) {
  const urlMetaId = new URLSearchParams(window.location.search).get('metaId');
  const isLoadingFromList = !!urlMetaId;

  // When opening from list.html, keep the metadata (from localStorage) for this one load.
  // But clear it immediately afterward so reload/login always starts fresh.
  if (isLoadingFromList) {
    sessionStorage.setItem('currentMetaId', urlMetaId);
  } else {
    // On normal load/refresh/login, always start with an empty form.
    clearStoredFormState();
  }

  loadColumns();
  updateFormTitle();

  // Clear form unless we're loading from list.html (indicated by guideData in localStorage)
  if (!skipClear) {
    const stored = localStorage.getItem('guideData');
    if (!stored) {
      // No guideData means this is a new form, not loading from list
      clearAll();
    }
  }

  // If we came from list.html, clear the persisted state immediately after rendering.
  if (isLoadingFromList) {
    clearStoredFormState();
  }

  // render controls once columns are loaded and user available
  const user = window.guideAuth && window.guideAuth.getCurrentUser && window.guideAuth.getCurrentUser();
  if (user) renderControlsForUser(user);
}

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, initialize immediately
  const user = window.guideAuth && window.guideAuth.getCurrentUser && window.guideAuth.getCurrentUser();
  if (user) initApp();

  // Called when login completes
  window.onUserLogin = function(user) {
    initApp();
  };

  // Called on logout (optional cleanup)
  window.onUserLogout = function() {
    // currently nothing special to clear beyond UI
  };

});
