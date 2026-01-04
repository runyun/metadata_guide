const allPlaces = [
  "封面" // 0
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


function exportResult() {
  const title = document.getElementById('titleResult').value;
  const surname = document.getElementById('surnameResult').value;
  const volume = document.getElementById('volumeResult').value;

  const result= [title, surname, volume].join(', ');

  navigator.clipboard.writeText(result);

  document.getElementById("exportResult").textContent = "已複製結果到剪貼簿：" + result;
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

function loadColumns() {
  let html = "";

  for (const col of data.columns) {
    const places = col.placeIndexes ? col.placeIndexes.map(i => allPlaces[i]).join('、 ') : allPlaces.join('、 ');

      html += `
          <div class="item">
              <div class="title">
                  <p>${col.display}</p>
                  <input type="text" id="${col.name}Result" placeholder="請輸入${col.display}">
                  <input type="text" id="${col.name}Page" placeholder="頁數" >
                  <span class="arrow" onclick="toggleContent(event)">提示 ▶</span>
              </div>
              <div class="content">
                  <div>
                      <p>說明：${col.explain}</p>
                      <p>最可能出現的地方：${places}</p>
                      ${renderRules(col.rules)}
                  </div>
                  <div class="guideHint">
                      <a href="guide.html?type=${col.name}&typeDisplay=${col.display}">開始導覽 ▶</a>
                  </div>
              </div>
          </div>
      `;
  }

  const memo = `
          <div class="item">
              <div class="title">
                  備註
                  <input type="text" id="memo" placeholder="請輸入備註">
                  <span></span>
                  <span class="arrow" onclick="toggleContent(event)">提示 ▶</span>
              </div>
              <div class="content">
                  <div>
                      <p>說明：譜書需要特別注意的事情，比如:缺幾本、泡過水、有幾頁毀損…等</p>
                  </div>
              </div>
          </div>
      `;
  
  html += memo;

  document.getElementById("metadataList").innerHTML = html;

  fillFromLocalStorage()
}

function fillFromLocalStorage() {
  const stored = JSON.parse(localStorage.getItem("guideData") || "{}");

  for (const key in stored) {
    const input = document.getElementById(key + "Result");
    if (input) {
      input.value = stored[key].value || ""; 
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
