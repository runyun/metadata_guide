
let currentType = null;   // 全域保存 type
let questionData = null; // 保存載入的 json

function backToIndex(value) {
    window.location.href =
        "index.html?type=" + encodeURIComponent(currentType) +
        "&value=" + encodeURIComponent(value);
}


async function load() {
    const params = new URLSearchParams(window.location.search);
    currentType = params.get('type');
    typeDisplay = params.get('typeDisplay');

    let jsonPath = "../json/"+ currentType + ".json";


    const r = await fetch(jsonPath);
    questionData = await r.json();

    startRender(questionData);

    document.getElementById("typeDisplay").textContent = typeDisplay;
}

let currentId = "1";  // 第一題

function startRender(data) {
    renderQuestion(data, currentId);
}

function renderQuestion(data, id) {
    currentId = id;         // 更新現在題目

    const q = data.questions[id];
    const question = document.getElementById("question");
    const answerBtn = document.getElementById('answerBtn');
    const images = document.getElementById('sampleImage');

    // 清除舊畫面
    question.innerHTML = ""; 
    answerBtn.innerHTML = ""; 
    images.innerHTML = ""; 

    // 問題文字
    const title = document.createElement("h2");
    title.textContent = q.text;
    question.appendChild(title);

    // 答案按鈕
    const btnBox = document.createElement("div");
    btnBox.className = "btnBox";

    q.answers.forEach(ans => {
        const btn = document.createElement("button");
        btn.textContent = ans.text;

        btn.onclick = () => {
            if (ans.next) {
                if (ans.next === "pass") {
                    backToIndex('?.?');
                } else {
                    renderQuestion(data, ans.next);
                }
            } else {
                renderAnswer();
            }
        };

        btnBox.appendChild(btn);
    });

    answerBtn.appendChild(btnBox);

    // 圖片區
    if (q.images && q.images.length > 0) {
        const imgBox = document.createElement("div");

        const example = document.createElement("p");
        
        example.textContent = "範例圖片：";
        images.appendChild(example);
        imgBox.className = "imageBox";

        q.images.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            img.className = "questionImage";
            imgBox.appendChild(img);
        });

        images.appendChild(imgBox);
    }

}

function renderAnswer() {
    const answerBtn = document.getElementById("answerBtn");
    answerBtn.innerHTML = ""; // 清空畫面

    // 標題
    const title = document.createElement("h2");
    title.textContent = "請輸入你的回答";
    answerBtn.appendChild(title);

    // 單行輸入框
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "請輸入答案";
    input.maxLength = 20;
    input.style.width = "100%";
    input.style.fontSize = "16px";
    input.style.padding = "8px";
    answerBtn.appendChild(input);

    // 按鈕區
    const btnBox = document.createElement("div");
    btnBox.className = "btnBox";

    const doneBtn = document.createElement("button");
    doneBtn.textContent = "完成";

    doneBtn.onclick = () => {
        const answerText = input.value.trim();
        backToIndex(answerText);
    };

    btnBox.appendChild(doneBtn);
    answerBtn.appendChild(btnBox);

    // 取消按鈕（回到上一個 renderQuestion）
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "取消";
    cancelBtn.onclick = () => {
        if (currentId) {
            renderQuestion(questionData, currentId);
        }
    };

    answerBtn.appendChild(cancelBtn);

    input.focus();
}

load();