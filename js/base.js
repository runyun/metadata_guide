const data = {
    "columns" : [
        { "name": "title",
          "display": "譜名",
          "explain": "家譜的書名" }
        ,{ "name": "sub_title",
          "display": "副譜名",
          "explain": "輔助譜名，增加辨識度" }
        ,{ "name": "surname",
          "display": "姓氏",
          "explain": "家譜裡包含什麼姓氏的世系" }
        ,{ "name": "total_number",
          "display": "總卷數",
          "explain": "家譜的所有本數和使用單位" }
        ,{ "name": "ancestral_hall",
          "display": "堂號",
          "explain": "" }
        ,{ "name": "first_Ancestor",
          "display": "一世祖",
          "explain": "" }
        ,{ "name": "migrant_Ancestor",
          "display": "始遷祖",
          "explain": "" }
        ,{ "name": "author",
          "display": "作者",
          "explain": "" }
        ,{ "name": "place",
          "display": "譜籍地",
          "explain": "" }
        ,{ "name": "beg_year",
          "display": "起年",
          "explain": "" }
        ,{ "name": "publish_year",
          "display": "出版年",
          "explain": "" }
        ,{ "name": "volumes",
          "display": "卷冊內容",
          "explain": "" }
    ]
};

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

async function loadColumns() {

  let html = "";

  for (const col of data.columns) {
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
                      <p>最可能出現的地方：</p>
                  </div>
                  <div class="guideHint">
                      <a href="guide.html">開始導覽 ▶</a>
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

loadColumns();
