const STORAGE_KEY = "story_translator_history";

const eventTextEl = document.getElementById("eventText");
const ageGroupEl = document.getElementById("ageGroup");
const styleEl = document.getElementById("style");
const generateBtn = document.getElementById("generateBtn");
const regenerateBtn = document.getElementById("regenerateBtn");
const saveBtn = document.getElementById("saveBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const statusText = document.getElementById("statusText");

const resultEmpty = document.getElementById("resultEmpty");
const resultBox = document.getElementById("resultBox");
const storyTitleEl = document.getElementById("storyTitle");
const storyContentEl = document.getElementById("storyContent");
const parentTipEl = document.getElementById("parentTip");
const historyListEl = document.getElementById("historyList");

let currentStory = null;

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveHistory(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString("zh-TW");
}

function renderHistory() {
  const history = getHistory();

  if (!history.length) {
    historyListEl.innerHTML = `<p>目前還沒有收藏故事。</p>`;
    return;
  }

  historyListEl.innerHTML = history
    .map(
      (item) => `
      <div class="history-card">
        <h3>${escapeHtml(item.title)}</h3>
        <div class="history-meta">
          年齡：${escapeHtml(item.ageGroup)} ｜ 風格：${escapeHtml(item.style)} ｜ ${formatDate(item.createdAt)}
        </div>
        <p><strong>事件：</strong>${escapeHtml(item.eventText)}</p>
        <p><strong>故事：</strong>${escapeHtml(item.story)}</p>
        <p><strong>家長引導重點：</strong>${escapeHtml(item.parentTip)}</p>
      </div>
    `
    )
    .join("");
}

function showResult(data) {
  storyTitleEl.textContent = data.title;
  storyContentEl.textContent = data.story;
  parentTipEl.textContent = data.parentTip;

  resultEmpty.classList.add("hidden");
  resultBox.classList.remove("hidden");
}

function escapeHtml(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function generateStory() {
  const eventText = eventTextEl.value.trim();
  const ageGroup = ageGroupEl.value;
  const style = styleEl.value;

  if (!eventText) {
    statusText.textContent = "請先輸入事件內容。";
    return;
  }

  generateBtn.disabled = true;
  regenerateBtn.disabled = true;
  saveBtn.disabled = true;
  statusText.textContent = "AI 正在生成故事...";

  try {
    const response = await fetch("/api/story", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventText,
        ageGroup,
        style,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "生成失敗");
    }

    currentStory = {
      id: Date.now().toString(),
      eventText,
      ageGroup,
      style,
      title: data.title || "未命名故事",
      story: data.story || "",
      parentTip: data.parentTip || "",
      createdAt: new Date().toISOString(),
    };

    showResult(currentStory);
    statusText.textContent = "故事生成完成。";
  } catch (error) {
    console.error(error);
    statusText.textContent = `發生錯誤：${error.message}`;
  } finally {
    generateBtn.disabled = false;
    regenerateBtn.disabled = false;
    saveBtn.disabled = false;
  }
}

function saveCurrentStory() {
  if (!currentStory) {
    statusText.textContent = "目前沒有可收藏的故事。";
    return;
  }

  const history = getHistory();
  history.unshift(currentStory);

  const trimmedHistory = history.slice(0, 20);
  saveHistory(trimmedHistory);
  renderHistory();

  statusText.textContent = "已收藏到手機。";
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
  statusText.textContent = "已清空收藏。";
}

generateBtn.addEventListener("click", generateStory);
regenerateBtn.addEventListener("click", generateStory);
saveBtn.addEventListener("click", saveCurrentStory);
clearHistoryBtn.addEventListener("click", clearHistory);

renderHistory();
