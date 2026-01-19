
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

                if(ans.save){
                    renderAnswer(ans.next);
                    return;
                }
                renderQuestion(data, ans.next);
                return;

            } else if (ans.return !== undefined) {
                if (ans.return === "pass") {
                    backToIndex('?.?');
                    return;

                } if (ans.return.includes("%")) {
                    renderAnswer();
                    return;

                } else {

                    const { answers, pages } = assemble_total_number_answers();

                    if (answers != '') {
                        backToIndex(answers, pages);
                        return;
                    }

                    backToIndex(ans.return);
                    return;
                }

            } else {
                renderAnswer();
                return;
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

        // 第幾張（包含左右箭頭）
        const counter = document.createElement("div");
        counter.className = "imageCounter";

        // 中間文字
        const counterText = document.createElement("span");
        counterText.className = "counterText";
        counter.appendChild(counterText);

        // 圖片
        const img = document.createElement("img");
        img.className = "questionImage";

        img.onclick = () => {
            openModal(img.src);
        };

        function updateImage() {
            img.src = "../images/" + currentType + "/" + q.images[currentIndex].file;
            description.textContent = q.images[currentIndex].description || "";
            counterText.textContent = `(${currentIndex + 1} / ${total})`;
        }

        updateImage();

        imgBox.appendChild(description);

        const slider = document.createElement("div");
        slider.className = "imageSlider";

        // 只有超過一張圖才顯示左右箭頭
        if (total > 1) {
            const prevBtn = document.createElement("button");
            prevBtn.textContent = "←";
            prevBtn.className = "counterBtn";
            prevBtn.onclick = () => {
                currentIndex = (currentIndex - 1 + total) % total;
                updateImage();
            };

            const nextBtn = document.createElement("button");
            nextBtn.textContent = "→";
            nextBtn.className = "counterBtn";
            nextBtn.onclick = () => {
                currentIndex = (currentIndex + 1) % total;
                updateImage();
            };

            // 左箭頭 | 中間文字 | 右箭頭
            counter.insertBefore(prevBtn, counterText);
            counter.appendChild(nextBtn);
        }

        slider.appendChild(img);

        imgBox.appendChild(counter);
        imgBox.appendChild(slider);
        images.appendChild(imgBox);
    }

}

let total_number_answers = {};

function assemble_total_number_answers() {
    if (Object.keys(total_number_answers).length === 0) {
        return { answers: "", pages: "" };
    }

    const sortedKeys = Object.keys(total_number_answers)
        .sort((a, b) => a - b);

    const answers = sortedKeys
        .map(key => total_number_answers[key].answer)
        .join("");

    const pages = sortedKeys
    .map(key => total_number_answers[key].page)
    .filter(page => page != null && page !== "")
    .join(", ");


    return { answers, pages };
}

function repalce_default_text(defaultText, answerText) {
    let returnText = '';

    const replaceIndex = defaultText.indexOf("%");
    if (replaceIndex !== -1) {
        returnText = defaultText.replace("%", answerText);
    }

    return returnText;
}


function renderAnswer(next) {
    const answerBtn = document.getElementById("answerBtn");
    answerBtn.innerHTML = ""; // 清空畫面

    // 標題
    const title = document.createElement("h2");
    title.textContent = "請輸入你的回答";
    answerBtn.appendChild(title);

    if (currentType === 'volumes') {
        // 清單類型輸入
        const listContainer = document.createElement("div");
        listContainer.id = "volumesList";
        listContainer.className = "volumes-list";

        // 新增第一個輸入框
        addVolumeInput(listContainer);

        // 新增按鈕
        const addBtn = document.createElement("button");
        addBtn.textContent = "新增一行";
        addBtn.onclick = () => addVolumeInput(listContainer);
        answerBtn.appendChild(listContainer);
        answerBtn.appendChild(addBtn);

    } else {
        // 單行輸入框
        const inputText = document.createElement("input");
        inputText.type = "text";
        inputText.placeholder = "請輸入答案";
        answerBtn.appendChild(inputText);

        const inputPage = document.createElement("input");
        inputPage.type = "text";
        inputPage.placeholder = "請輸入資訊所在的頁碼";
        answerBtn.appendChild(inputPage);
    }

    // 按鈕區
    const btnBox = document.createElement("div");
    btnBox.className = "btnBox";

    const continueBtn = document.createElement("button");
    continueBtn.textContent = next === undefined ? "完成" : "繼續下一題 ";

    continueBtn.onclick = () => {
        let answerText = "";
        let answerPage = "";
        const question = questionData.questions[currentId].answers[0];
        const answerId = question.save || null;
        const defaultText = question.default || "";

        if (currentType === 'volumes') {
            // 收集清單資料
            const inputs = document.querySelectorAll("#volumesList input");
            const values = Array.from(inputs).map(input => input.value.trim()).filter(val => val !== "");
            answerText = values.join("&");
        } else {
            answerText = document.querySelector("input[placeholder='請輸入答案']").value.trim();
            answerPage = document.querySelector("input[placeholder='請輸入資訊所在的頁碼']").value.trim();
        }

        if (next === undefined) {  
            if(question.save){
                total_number_answers[answerId] = {answer:answerText, page:answerPage};
            }

            const { answers, pages } = assemble_total_number_answers();
            if (answers != '') {
                answerText = answers ;
                answerPage = pages;
            }

            replaceText = repalce_default_text( defaultText, answerText);
            if(replaceText){
                answerText = replaceText;
            }

            backToIndex(answerText, answerPage);

        } else {
            if (defaultText) {
                answerText = repalce_default_text(defaultText, answerText);
            }

            total_number_answers[answerId] = {answer:answerText, page:answerPage};

            renderQuestion(questionData, next);
        }
    };

    btnBox.appendChild(continueBtn);

    // 取消按鈕（回到上一個 renderQuestion）
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "取消";
    cancelBtn.onclick = () => {
        if (currentId) {
            renderQuestion(questionData, currentId);
        }
    };

    btnBox.appendChild(cancelBtn);

    answerBtn.appendChild(btnBox);

    if (currentType !== 'volumes') {
        document.querySelector("input[placeholder='請輸入答案']").focus();
    }
}

function addVolumeInput(container) {
    const inputContainer = document.createElement("div");
    inputContainer.className = "volume-input-container";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "請輸入卷冊內容";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "刪除";
    deleteBtn.onclick = () => {
        container.removeChild(inputContainer);
    };

    inputContainer.appendChild(input);
    inputContainer.appendChild(deleteBtn);
    container.appendChild(inputContainer);
}

function openModal(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modal.style.display = 'block';
    modalImg.src = src;
    modalImg.classList.remove('zoomed');
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modal.style.display = 'none';
    modalImg.classList.remove('zoomed');
}

// 點擊模態框圖片放大
document.getElementById('modalImage').onclick = function() {
    this.classList.toggle('zoomed');
};

// 點擊叉叉關閉
document.querySelector('.close').onclick = closeModal;

// 點擊模態框背景關閉
document.getElementById('imageModal').onclick = function(event) {
    if (event.target === this) {
        closeModal();
    }
};

load();