load();

function backToIndex(type, value) {
  window.location.href = "index.html?type=" + type + "&value=" + value;
}

async function load() {
    const r = await fetch("../json/questions.json");
    const data = await r.json();
    startRender(data);
}

let currentId = "1";  // 第一題

function startRender(data) {
    renderQuestion(data, currentId);
}

function renderQuestion(data, id) {
    const q = data.questions[id];
    const app = document.getElementById("app");
    app.innerHTML = ""; // 清除舊畫面

    // 問題文字
    const title = document.createElement("h2");
    title.textContent = q.text;
    app.appendChild(title);

    // 答案按鈕
    const btnBox = document.createElement("div");
    btnBox.className = "btnBox";

    q.answers.forEach(ans => {
        const btn = document.createElement("button");
        btn.textContent = ans.text;

        btn.onclick = () => {
            if (ans.next) {
                if (ans.next === "pass") {
                    showDone();
                } else {
                    renderQuestion(data, ans.next);
                }
            } else {
                showDone();
            }
        };

        btnBox.appendChild(btn);
    });

    app.appendChild(btnBox);

    // 圖片區
    if (q.images && q.images.length > 0) {
        const imgBox = document.createElement("div");

        const example = document.createElement("p");
        
        example.textContent = "範例圖片：";
        app.appendChild(example);
        imgBox.className = "imageBox";

        q.images.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            img.className = "questionImage";
            imgBox.appendChild(img);
        });

        app.appendChild(imgBox);
    }

}

function showDone() {
    const app = document.getElementById("app");
    app.innerHTML = `
        <h2>導覽完成！</h2>
        <p>感謝回答所有問題。</p>
    `;
}
