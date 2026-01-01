
let currentType = null;   // 全域保存 type
let questionData = null; // 保存載入的 json


function backToIndex(value, page) {
    // 讀取原本資料（如果沒有就給空物件）
    const stored = JSON.parse(localStorage.getItem("guideData") || "{}");

    stored[currentType] = {value, page};

    localStorage.setItem("guideData", JSON.stringify(stored));

    window.location.href = "index.html";
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
    
    // 警告文字
    if (q.warning) {
        const warning = document.createElement("p");
        warning.className = "warningText";
        warning.textContent = "注意：" + q.warning;
        question.appendChild(warning);
    }

    // 答案按鈕
    const btnBox = document.createElement("div");
    btnBox.className = "btnBox";

    q.answers.forEach(ans => {
        const btn = document.createElement("button");
        btn.textContent = ans.text;

        btn.onclick = () => {
            if (ans.next) {
                renderQuestion(data, ans.next);

            } else if (ans.return){
                if (ans.return === "pass") {
                    backToIndex('?.?');
                } else {
                    backToIndex(ans.return);
                }

            } else {
                renderAnswer();
            }
        };

        btnBox.appendChild(btn);
    });

    answerBtn.appendChild(btnBox);

    // 圖片區（輪播 + 說明文字 + 第幾張）
    if (q.images && q.images.length > 0) {
        let currentIndex = 0;
        const total = q.images.length;

        const imgBox = document.createElement("div");
        imgBox.className = "imageBox";

        const example = document.createElement("p");
        example.textContent = "範例圖片：";
        images.appendChild(example);

        // 說明文字
        const description = document.createElement("p");
        description.className = "imageDescription";

        // 第幾張
        const counter = document.createElement("p");
        counter.className = "imageCounter";

        // 左右箭頭
        const prevBtn = document.createElement("button");
        prevBtn.textContent = "←";

        const nextBtn = document.createElement("button");
        nextBtn.textContent = "→";

        // 圖片
        const img = document.createElement("img");
        img.className = "questionImage";

        // 更新顯示
        function updateImage() {
            img.src = "../images/" + currentType + "/" + q.images[currentIndex].file;
            description.textContent = q.images[currentIndex].description || "";
            counter.textContent = `(${currentIndex + 1} / ${total})`;
        }

        // 初始
        updateImage();

        // 按鈕事件
        prevBtn.onclick = () => {
            currentIndex = (currentIndex - 1 + total) % total;
            updateImage();
        };

        nextBtn.onclick = () => {
            currentIndex = (currentIndex + 1) % total;
            updateImage();
        };

        // 組裝
        imgBox.appendChild(description);
        imgBox.appendChild(counter);

        const slider = document.createElement("div");
        slider.className = "imageSlider";
        slider.appendChild(prevBtn);
        slider.appendChild(img);
        slider.appendChild(nextBtn);

        imgBox.appendChild(slider);
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
    const inputText = document.createElement("input");
    inputText.type = "text";
    inputText.placeholder = "請輸入答案";
    inputText.maxLength = 20;
    inputText.style.width = "100%";
    inputText.style.fontSize = "16px";
    inputText.style.padding = "8px";

    answerBtn.appendChild(inputText);

    const inputPage = document.createElement("input");
    inputPage.type = "text";
    inputPage.placeholder = "請輸入頁碼";
    inputPage.maxLength = 20;
    inputPage.style.width = "100%";
    inputPage.style.fontSize = "16px";
    inputPage.style.padding = "8px";

    answerBtn.appendChild(inputPage);

    // 按鈕區
    const btnBox = document.createElement("div");
    btnBox.className = "btnBox";

    const doneBtn = document.createElement("button");
    doneBtn.textContent = "完成";

    doneBtn.onclick = () => {
        const answerText = inputText.value.trim();
        const answerPage = inputPage.value.trim();
        backToIndex(answerText, answerPage);
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

    inputText.focus();
}

load();