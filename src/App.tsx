import { useState, useEffect } from "react";
import { FairytaleSession, StartStoryRequest } from "./types";
import StoryCreator from "./components/StoryCreator";
import StoryVisualizer from "./components/StoryVisualizer";
import SavedStories from "./components/SavedStories";
import { Sparkles, BookOpen, Heart, RefreshCw, Feather, Key, Eye, EyeOff, HelpCircle, Gift } from "lucide-react";

export default function App() {
  const [sessions, setSessions] = useState<FairytaleSession[]>([]);
  const [activeSession, setActiveSession] = useState<FairytaleSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "gallery">("create");
  
  // API key configuration states
  const [apiKey, setApiKey] = useState("");
  const [showKeyField, setShowKeyField] = useState(false);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  
  // Receives shared stories from friends deep-links
  const [sharedCard, setSharedCard] = useState<{
    title: string;
    char: string;
    theme: string;
    genre: string;
    text: string;
  } | null>(null);

  // Load saved sessions & API Key on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem("fairy_sessions");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
        // Default to bookshelf if they have saved readings
        if (parsed.length > 0) {
          setActiveTab("gallery");
        }
      }
    } catch (e) {
      console.error("Failed to load fairy sessions from localStorage:", e);
    }

    try {
      const storedKey = localStorage.getItem("magic_fairy_key") || "";
      setApiKey(storedKey);
      if (!storedKey) {
        setShowKeyField(true);
      }
    } catch (e) {
      console.error("Failed to read magic key", e);
    }
  }, []);

  // Parse incoming sharing payload
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const title = params.get("sTitle");
      const char = params.get("sChar");
      const theme = params.get("sTheme");
      const genre = params.get("sGenre");
      const text = params.get("sText");

      if (title && char && text) {
        setSharedCard({
          title,
          char,
          theme: theme || "神奇場景",
          genre: genre || "whimsical",
          text,
        });
      }
    } catch (e) {
      console.error("Failed to parse sharing arguments", e);
    }
  }, []);

  // Convert shared card into local active session
  const handleImportSharedStory = () => {
    if (!sharedCard) return;

    const importedSession: FairytaleSession = {
      id: "shared-" + (Math.random().toString(36).substring(2)),
      metadata: {
        title: sharedCard.title,
        theme: sharedCard.theme,
        character: sharedCard.char,
        genre: sharedCard.genre as any,
      },
      chapters: [
        {
          id: Math.random().toString(36).substring(2),
          chapterIndex: 0,
          text: sharedCard.text,
          selectedOption: null,
          options: [
            `與 ${sharedCard.char} 一起勇敢地展開探索`,
            `和路旁的神奇雲彩妖精談談`,
            `揮動魔法棒，召喚彩虹星辰協助`
          ],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [importedSession, ...sessions];
    saveSessionsToLocal(updated);
    setActiveSession(importedSession);
    setSharedCard(null);
    setActiveTab("create");
    
    // Clear url arguments safely
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Save sessions helper
  const saveSessionsToLocal = (updatedList: FairytaleSession[]) => {
    setSessions(updatedList);
    try {
      localStorage.setItem("fairy_sessions", JSON.stringify(updatedList));
    } catch (e) {
      console.error("Failed to save sessions to localStorage:", e);
    }
  };

  // Start new story
  const handleStartStory = async (req: StartStoryRequest) => {
    if (!apiKey.trim()) {
      setError("💡 魔法尚未啟動！請先在上方『仙女魔法之泉』輸入您的 Gemini API Key 注入魔法能量唷！");
      setShowKeyField(true);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/story/start", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim()
        },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "伺服器發生小小魔法異常，請再試一次。");
      }

      const data = await response.json();
      
      const newSession: FairytaleSession = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        metadata: {
          title: data.title || "神奇的童話冒險",
          theme: req.theme,
          character: req.character,
          genre: req.genre,
        },
        chapters: [
          {
            id: Math.random().toString(36).substring(2),
            chapterIndex: 0,
            text: data.text,
            selectedOption: null,
            options: data.options,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedSessions = [newSession, ...sessions];
      saveSessionsToLocal(updatedSessions);
      setActiveSession(newSession);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "連線至魔法書本時失敗，請檢查網路。");
    } finally {
      setIsLoading(false);
    }
  };

  // Continue story with another chapter
  const handleContinueStory = async (selectedOption: string) => {
    if (!activeSession) return;
    if (!apiKey.trim()) {
      setError("💡 魔法不夠了！請先在頂部『仙女魔法之泉』中填寫您的 Gemini API Key 才能繼續撰寫後續劇情唷！");
      setShowKeyField(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const historyPayload = activeSession.chapters.map((c) => ({
        text: c.text,
        selectedOption: c.selectedOption,
      }));

      const response = await fetch("/api/story/continue", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim()
        },
        body: JSON.stringify({
          history: historyPayload,
          selectedOption,
          metadata: activeSession.metadata,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "伺服器發生小小魔法異常，請再試一次。");
      }

      const data = await response.json();

      const newChapter = {
        id: Math.random().toString(36).substring(2),
        chapterIndex: activeSession.chapters.length,
        text: data.text,
        selectedOption,
        options: data.options,
      };

      const updatedSession: FairytaleSession = {
        ...activeSession,
        chapters: [...activeSession.chapters, newChapter],
        updatedAt: new Date().toISOString(),
      };

      const updatedSessions = sessions.map((s) =>
        s.id === activeSession.id ? updatedSession : s
      );

      saveSessionsToLocal(updatedSessions);
      setActiveSession(updatedSession);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "連線至魔法書本時失敗，請檢查網路。");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a session
  const handleDeleteSession = (id: string) => {
    const filtered = sessions.filter((s) => s.id !== id);
    saveSessionsToLocal(filtered);
    if (activeSession?.id === id) {
      setActiveSession(null);
    }
  };

  // Time travel rewind back to a previous chapter
  const handleRewindToChapter = (chapterIndex: number) => {
    if (!activeSession) return;

    const slicedChapters = activeSession.chapters.slice(0, chapterIndex + 1);
    const updatedSession: FairytaleSession = {
      ...activeSession,
      chapters: slicedChapters,
      updatedAt: new Date().toISOString(),
    };

    const updatedSessions = sessions.map((s) =>
      s.id === activeSession.id ? updatedSession : s
    );

    saveSessionsToLocal(updatedSessions);
    setActiveSession(updatedSession);
  };

  return (
    <div className="fairy-bg min-h-screen text-slate-100 flex flex-col font-sans relative antialiased px-3.5 sm:px-6">
      {/* Floating background decorative celestial elements from Vibrant Palette */}
      <div className="fairy-icon-float text-4xl absolute top-[60px] left-[10%] opacity-20 pointer-events-none select-none">✨</div>
      <div className="fairy-icon-float text-5xl absolute bottom-[120px] right-[15%] opacity-15 pointer-events-none select-none">🌙</div>
      <div className="fairy-icon-float text-4xl absolute top-[220px] right-[8%] opacity-20 pointer-events-none select-none">⭐</div>

      {/* Visual background glowing dust decoration orbs */}
      <div className="glow-orb-primary top-[15%] left-[-10%]" />
      <div className="glow-orb-secondary bottom-[20%] right-[-10%]" />

      {/* Shared story introduction popover */}
      {sharedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => {
            setSharedCard(null);
            window.history.replaceState({}, document.title, window.location.pathname);
          }} />
          <div className="relative bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950 border-2 border-pink-400/40 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl z-10 p-6 flex flex-col gap-4 text-center">
            
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-3xl select-none">
                🎁
              </div>
            </div>

            <div>
              <h3 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-pink-400 to-purple-300 font-serif">
                收到好友分享的童話進度！
              </h3>
              <p className="text-[11px] text-indigo-200/70 mt-1 font-sans leading-relaxed">
                有一本為您與孩子編織的好書正等待被開啟唷！
              </p>
            </div>

            {/* Fairytale Book display box */}
            <div className="bg-slate-950/65 rounded-2xl p-4 border border-indigo-500/10 text-left flex flex-col gap-2">
              <h4 className="text-xs font-bold text-white font-serif flex items-center gap-1.5 line-clamp-1">
                📖 《{sharedCard.title}》
              </h4>
              <p className="text-[9px] text-indigo-200/50">
                主角：{sharedCard.char} ｜ 場景：{sharedCard.theme}
              </p>
              <div className="bg-orange-50/5 p-3 rounded-lg border border-pink-200/10 text-[11px] text-slate-300 italic font-serif leading-relaxed line-clamp-3">
                「{sharedCard.text}」
              </div>
            </div>

            <p className="text-[10px] text-indigo-300/60 leading-normal">
              點擊下方「注入魔法」即可將本段落載入您的童話書閣，並與孩子一起繼續寫下去！
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={handleImportSharedStory}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-black text-xs shadow-md shadow-pink-500/25 active:scale-95 transition-all cursor-pointer safe-tap"
              >
                🪄 載入故事並展開冒險 📖
              </button>
              
              <button
                onClick={() => {
                  setSharedCard(null);
                  window.history.replaceState({}, document.title, window.location.pathname);
                }}
                className="w-full py-2 text-indigo-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                關閉，開始創作我自己的故事
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main viewport frame */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col h-full mt-4 sm:mt-6">
        {/* Magic App Logo/Header */}
        {!activeSession && (
          <header className="flex flex-col items-center gap-1.5 py-4 select-none">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-pink-500/20 leading-none">
                <Feather className="w-4.5 h-4.5 fairy-icon-float" />
              </div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-pink-300 via-pink-400 to-indigo-300 bg-clip-text text-transparent font-serif select-none">
                童話星願 ✨
              </h1>
            </div>
            <p className="text-[10px] text-indigo-300/80 uppercase tracking-widest font-semibold font-sans">
              Endless Fairytale Generator
            </p>
          </header>
        )}

        {/* Dynamic Gemini API Key configuration block */}
        {!activeSession && (
          <div className="mb-5 bg-indigo-950/30 backdrop-blur-md rounded-2xl p-4 border border-indigo-500/10 shadow-lg">
            <button
              onClick={() => setShowKeyField(!showKeyField)}
              className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-0"
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-xl ${apiKey.trim() ? "bg-emerald-500/10 text-emerald-400" : "bg-pink-500/10 text-pink-400"}`}>
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5 font-serif">
                    <span>仙女魔法之泉 (API 金鑰)</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-sans uppercase tracking-wider font-extrabold ${apiKey.trim() ? "bg-emerald-500/20 text-emerald-300" : "bg-pink-500/20 text-pink-300"}`}>
                      {apiKey.trim() ? "魔法蓄滿" : "尚未注入"}
                    </span>
                  </h4>
                  <p className="text-[10px] text-indigo-200/60 font-sans mt-0.5">
                    {apiKey.trim() ? "已綁定金鑰，快點翻開神奇童話吧！" : "系統必須輸入個人 Gemini API Key 才能召喚故事唷"}
                  </p>
                </div>
              </div>
              <span className="text-xs text-indigo-300 hover:text-white font-bold underline transition-colors cursor-pointer shrink-0">
                {showKeyField ? "收合" : "設定"}
              </span>
            </button>

            {showKeyField && (
              <div className="mt-3.5 pt-3.5 border-t border-indigo-500/10 flex flex-col gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] text-indigo-200">
                    <label className="font-semibold flex items-center gap-1">
                      <span>貼上您的 Gemini API 金鑰：</span>
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-pink-400 hover:text-pink-300 hover:underline flex items-center gap-0.5 font-bold"
                    >
                      <span>取得免費金鑰 🔑</span>
                    </a>
                  </div>
                  
                  <div className="relative flex items-center">
                    <input
                      type={isKeyVisible ? "text" : "password"}
                      placeholder="請貼上您的 AI_zaSy... 金鑰"
                      value={apiKey}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setApiKey(val);
                        localStorage.setItem("magic_fairy_key", val);
                      }}
                      className="w-full text-xs bg-slate-950/80 border border-indigo-500/20 rounded-xl pl-3 pr-10 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setIsKeyVisible(!isKeyVisible)}
                      className="absolute right-3 p-1 text-slate-500 hover:text-indigo-300 focus:outline-none cursor-pointer"
                    >
                      {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-indigo-300/50 leading-normal">
                  🔒 安全：金鑰僅存放在本機 localStorage，直接對 Google API 發送連線，絕不上傳至任何第三方，完整保障隱私。
                </p>
              </div>
            )}
          </div>
        )}

        {/* Dynamic content area */}
        <main className="flex-1">
          {error && (
            <div className="mb-4 p-3.5 bg-red-950/60 border border-red-500/30 text-rose-200 text-xs rounded-xl flex items-start gap-2 h-auto">
              <span className="text-sm shrink-0">⚠️</span>
              <div>
                <p className="font-bold">魔法施展失敗</p>
                <p className="opacity-90">{error}</p>
              </div>
            </div>
          )}

          {activeSession ? (
            /* Active Story Playing Deck */
            <StoryVisualizer
              session={activeSession}
              onContinue={handleContinueStory}
              onGoBack={() => setActiveSession(null)}
              isLoading={isLoading}
              onRewindToChapter={handleRewindToChapter}
            />
          ) : (
            /* Main wizard / cabinet setup screen */
            <div className="flex flex-col gap-6">
              {/* Sliding header tabs */}
              <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab("create")}
                  id="tab-create"
                  className={`flex-1 py-2 rounded-lg text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 safe-tap ${
                    activeTab === "create"
                      ? "bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>翻開神奇童話</span>
                </button>
                <button
                  onClick={() => setActiveTab("gallery")}
                  id="tab-gallery"
                  className={`flex-1 py-2 rounded-lg text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 safe-tap ${
                    activeTab === "gallery"
                      ? "bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>我的奇幻藏書閣</span>
                </button>
              </div>

              {/* Tab Switch panels */}
              <div className="transition-all duration-300">
                {activeTab === "create" ? (
                  <StoryCreator onStart={handleStartStory} isLoading={isLoading} />
                ) : (
                  <SavedStories
                    sessions={sessions}
                    onSelectSession={(s) => setActiveSession(s)}
                    onDeleteSession={handleDeleteSession}
                  />
                )}
              </div>
            </div>
          )}
        </main>

        {/* Footer Credit Segment */}
        {!activeSession && (
          <footer className="py-6 mt-auto text-center text-[10px] text-slate-500 flex flex-col gap-1 items-center justify-center border-t border-slate-900 ios-padding-bottom">
            <div className="flex items-center gap-1">
              <span>Made with</span>
              <Heart className="w-2.5 h-2.5 text-pink-500 fill-pink-500" />
              <span>for loving children</span>
            </div>
            <p className="opacity-60">智慧童話星願 © 無限開展 ✦ 語音導讀</p>
          </footer>
        )}
      </div>
    </div>
  );
}
