import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Helper to get Gemini client dynamically or fallback to env variable
function getDynamicGeminiClient(reqApiKey?: string): GoogleGenAI {
  const apiKey = reqApiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("找不到有效的 Gemini API 金鑰。請在前端設定中輸入您的個人 API Key。");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Resilient helper to call Gemini with secondary fallback models if first gets overloaded (e.g., 503 Spikes)
async function generateStoryContent(ai: GoogleGenAI, primaryModel: string, options: any) {
  try {
    return await ai.models.generateContent({
      model: primaryModel,
      ...options,
    });
  } catch (error: any) {
    const errorStr = (error && typeof error === "object") ? JSON.stringify(error) : (error?.message || String(error));
    const isServiceInterrupted = 
      errorStr.includes("503") || 
      errorStr.includes("UNAVAILABLE") || 
      errorStr.includes("demand") || 
      errorStr.includes("overloaded") ||
      errorStr.includes("RESOURCE_EXHAUSTED") || 
      errorStr.includes("429");

    if (isServiceInterrupted) {
      console.warn(`[Gemini API Warning] Primary model (${primaryModel}) is experiencing high demand. Retrying with gemini-3.1-flash-lite as fallback...`);
      try {
        return await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          ...options,
        });
      } catch (fallbackError: any) {
        console.warn("[Gemini API Warning] Fallback to gemini-3.1-flash-lite failed. Retrying with gemini-flash-latest...");
        return await ai.models.generateContent({
          model: "gemini-flash-latest",
          ...options,
        });
      }
    }
    throw error;
  }
}

// Genre prompt helpers
const genrePrompts: Record<string, string> = {
  whimsical: "溫馨治癒、色彩繽紛、充滿可愛與不可思議魔法的氛圍。",
  adventurous: "充滿勇氣、小小的挑戰、與好朋友攜手探險、解決難題的氛圍。",
  cozy: "療癒輕柔、適合睡前聆聽、描繪大自然微小細節、極度安心與溫柔的氛圍。",
  mysterious: "神祕探索、充滿好奇心、解開大自然或古老城堡中的小小祕密氛圍。",
};

// Start a new story
app.post("/api/story/start", async (req, res) => {
  try {
    const { theme, character, genre, customSetup } = req.body;
    if (!theme || !character || !genre) {
      return res.status(400).json({ error: "Missing required story parameters." });
    }

    const headerKey = req.headers["x-api-key"] as string | undefined;
    const ai = getDynamicGeminiClient(headerKey);
    const genreDescription = genrePrompts[genre] || genrePrompts.whimsical;

    const basePrompt = `
      請幫我創作一個童話故事。以下是這次故事的基本元素設定：
      - 主要角色：${character}
      - 故事主題/背景：${theme}
      - 故事氛圍/風格：${genreDescription}
      ${customSetup ? `- 使用者特別指令/補充設定：${customSetup}` : ""}

      創作規範：
      1. 這是一部精彩童話故事的「第一章」。
      2. 請寫出約 150 - 250 字的繁體中文（台灣用語習慣）精緻內容。
      3. 段落描寫要具有極強的畫面感，聲音、顏色、氣味都要活靈活現。
      4. 故事在這一章的結尾必須是「未完待續」的感覺——一個突發的狀況、一個需要探索的方向、或一個神秘的謎題。字面中不要直接包含「未完待續」字眼，要用懸念感引導。
      5. 為了接下來的續寫，請提供三個極具創意、完全不套路、指向不同方向的後續道路選擇。
      6. 請為本故事取一個極富童趣與詩意的神奇故事書標題。
    `;

    const systemInstruction = "你是一位滿懷愛心與詩意、極度懂孩子心理的台灣專業童話作家。你撰寫的文字優美、柔和，極具畫面感，擅長在故事結尾留下扣人心弦的未完待續懸念。你必須回傳 JSON 物件，格式嚴格遵循 schema 的定義。";

    const response = await generateStoryContent(ai, "gemini-3.5-flash", {
      contents: basePrompt,
      config: {
        systemInstruction,
        temperature: 1.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "為這個童話故事創作的詩意、神奇的故事書標題 (繁體中文)" },
            text: { type: Type.STRING, description: "第一章的故事內文 (繁體中文，約150-250字，結尾帶有未完待續懸念)" },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "三個極具想像力、指向不同冒險軌跡的下一步選擇 (繁體中文)"
            }
          },
          required: ["title", "text", "options"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response generated from Gemini.");
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.error("Error starting story:", error);
    res.status(500).json({ error: error.message || "無法開始生成童話故事，請再試一次。" });
  }
});

// Continue an existing story
app.post("/api/story/continue", async (req, res) => {
  try {
    const { history, selectedOption, metadata } = req.body;
    if (!history || !selectedOption || !metadata) {
      return res.status(400).json({ error: "Missing required history flow parameters." });
    }

    const headerKey = req.headers["x-api-key"] as string | undefined;
    const ai = getDynamicGeminiClient(headerKey);
    const genreDescription = genrePrompts[metadata.genre] || genrePrompts.whimsical;

    // Build history conversation prompt
    let conversationText = `
      我們正在進行一部名為《${metadata.title}》的童話故事。
      下面是目前為止的故事歷史紀錄：
    `;

    history.forEach((chap: any, idx: number) => {
      conversationText += `\n[第 ${idx + 1} 章]：\n${chap.text}\n`;
      if (chap.selectedOption) {
        conversationText += `使用者選擇的後續發展：${chap.selectedOption}\n`;
      }
    });

    conversationText += `
      \n最新動態：使用者選擇了以下方向來展開下一章：「${selectedOption}」

      創作規範：
      1. 請延續上文的故事情節與世界觀設定，在「${selectedOption}」的引導下，創作下一章全新內容。
      2. 全新一章故事，字數依然維持在 150 - 250 字左右的繁體中文（台灣習慣詞），流暢、溫柔。
      3. 這一章的結尾，也「必須」留下一個令人心癢難耐、想知道後面发生什麼的 cliffhanger (懸念)，維持「未完待續」的浪漫神祕感。文字結尾可以用令人遐想的對話或突發奇妙情景。
      4. 為下一章提供另外三個全新方向、充滿無盡探索驚喜的自選發展選項。
    `;

    const systemInstruction = "你是一位滿懷愛心與詩意、極度懂孩子心理的台灣專業童話作家。你撰寫的文字優美、柔和，極具畫面感，擅長在故事結尾留下扣人心弦的未完待續懸念。你必須回傳 JSON 物件，格式嚴格遵循 schema 的定義。";

    const response = await generateStoryContent(ai, "gemini-3.5-flash", {
      contents: conversationText,
      config: {
        systemInstruction,
        temperature: 1.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "新章節的故事內文 (繁體中文，約150-250字，結尾帶有未完待續的懸念韻味)" },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "接續本章結尾全新發展的三個極富樂趣、風格各異的下一步選擇 (繁體中文)"
            }
          },
          required: ["text", "options"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response generated from Gemini.");
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.error("Error continuing story:", error);
    res.status(500).json({ error: error.message || "無法繼續撰寫童話故事，請再試一次。" });
  }
});

// Configure Vite or production serving
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started and listening on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
