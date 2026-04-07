import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, "..", "public");

app.use(cors());
app.use(express.json());
app.use(express.static(publicPath));

function buildPrompt({ eventText, ageGroup, style }) {
  return `
你是一位擅長兒童引導與安全教育的故事老師。

請根據家長提供的事件，寫出一篇讓孩子聽得懂的短故事。

要求：
1. 適合年齡：${ageGroup}
2. 故事風格：${style}
3. 用字簡單、溫和、不恐嚇
4. 要讓孩子理解危險、後果與更好的做法
5. 故事要具體，有角色、有情節、有自然結果
6. 結尾要有溫柔引導
7. 請避免說教口吻
8. 字數約 180 到 300 字
9. 請使用繁體中文
10. 請只輸出 JSON，不要加上任何額外說明

家長輸入的事件：
${eventText}

請用以下 JSON 格式輸出：
{
  "title": "故事標題",
  "story": "故事內容",
  "parentTip": "給家長看的引導重點"
}
`.trim();
}

app.post("/api/story", async (req, res) => {
  try {
    const { eventText, ageGroup, style } = req.body;

    if (!eventText || !ageGroup || !style) {
      return res.status(400).json({
        error: "缺少必要欄位",
      });
    }

    const prompt = buildPrompt({ eventText, ageGroup, style });

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: prompt,
    });

    const text = response.output_text?.trim();

    if (!text) {
      return res.status(500).json({
        error: "AI 沒有回傳內容",
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      return res.status(500).json({
        error: "AI 回傳格式不是合法 JSON",
        raw: text,
      });
    }

    return res.json(parsed);
  } catch (error) {
    console.error("API Error:", error);

    return res.status(500).json({
      error: "生成故事失敗",
      detail: error?.message || "未知錯誤",
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
