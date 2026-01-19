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

    localStorage.removeItem("guideData");
}


function initApp() {
  loadColumns();
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
