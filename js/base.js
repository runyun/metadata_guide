const data = {
    "columns" : [
        { "name": "title",
          "display": "譜名",
          "explain": "家譜的書名",
          "placeIndexes": [0, 1, 5] }
        ,{ "name": "sub_title",
          "display": "副譜名",
          "explain": "輔助譜名，增加辨識度",
          "placeIndexes": [0, 1, 2, 3] }
        ,{ "name": "surname",
          "display": "姓氏",
          "explain": "家譜裡包含什麼姓氏的世系？",
          "rules": ["最多記載兩個姓氏"],
          "placeIndexes": [0, 1] }
        ,{ "name": "total_number",
          "display": "總卷數",
          "explain": "家譜的所有本數和使用單位",
          "placeIndexes": [2, 10] }
        ,{ "name": "ancestral_hall",
          "display": "堂號",
          "explain": "用於識別、區分不同支系或發源地的特殊徽號",
          "rules": ["只記一個，如有多個就記第1個"],
          "placeIndexes": [0, 1, 4, 11] }
        ,{ "name": "author",
          "display": "作者",
          "explain": "主要編輯者",
          "rules": [
            "填寫時需連名帶姓"
            , "只填寫一個人就好"
            , "如果沒有的話就留空"],
          "placeIndexes": [0, 3, 5, 9] }
        ,{ "name": "first_ancestor",
          "display": "一世祖",
          "explain": "世系圖上的第一代祖先", 
          "rules": [
            "填寫時需連名帶姓"
            , "填寫諱名"
            , "只填寫一個人就好"],
          "placeIndexes": [3, 7, 8] }
        ,{ "name": "migrant_ancestor",
          "display": "始遷祖",
          "explain": "一世祖之後遷徒的祖先",
          "rules": [
            "填寫時需連名帶姓"
            , "填寫諱名"
            , "只填寫一個人就好"],
          "placeIndexes": [3, 7, 8] }
        ,{ "name": "place",
          "display": "譜籍地",
          "explain": "一世祖或始遷祖遷到的現代地名",
          "placeIndexes": [3, 8] }
        ,{ "name": "beg_year",
          "display": "起年",
          "explain": "家譜所記載的最早祖先的西元年",
          "rules": ["西元年前的用負數"],
          "placeIndexes": [8] }
        ,{ "name": "publish_year",
          "display": "出版年",
          "explain": "家譜出版的西元年",
          "placeIndexes": [3, 4, 5, 6] }
        ,{ "name": "volumes",
          "display": "卷冊內容",
          "explain": "若是這套家譜本數多於一本，各本的內容主題", 
          "placeIndexes": [1, 2] }
    ]
};

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
                  ${col.display}
                  <input type="text" id="${col.name}Result" placeholder="請輸入${col.display}">
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

  document.getElementById("metadataList").innerHTML = html;

  fillUrlValue()
}

function fillUrlValue() {
    const params = new URLSearchParams(location.search);
    const type = params.get("type");
    const value = params.get("value");

    if (type) {
        const input = document.getElementById(type + "Result");
        if (input) {
            input.value = value;
        }
    }
}

function clearAll() {
    const inputs = document.querySelectorAll('#metadataList input[type="text"]');
    inputs.forEach(input => {
        input.value = "";
    });

    const newUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
}


loadColumns();
