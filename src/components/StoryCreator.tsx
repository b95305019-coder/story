import { useState } from "react";
import { StoryGenre, StartStoryRequest } from "../types";
import { Sparkles, BookOpen, User, Palette, ChevronRight, HelpCircle, Landmark } from "lucide-react";
import { motion } from "motion/react";

interface StoryCreatorProps {
  onStart: (request: StartStoryRequest) => void;
  isLoading: boolean;
}

const PRESET_CHARACTERS = [
  { id: "bear", name: "蓬蓬熊", desc: "背著紅色小氣球的蒲公英冒險家 🐻", emoji: "🐻" },
  { id: "fox", name: "巧克狐", desc: "愛吃草莓甜點的戴禮帽魔術師 🦊", emoji: "🦊" },
  { id: "whale", name: "藍鯨朵朵", desc: "身上會長出漂浮白雲的飛天小藍鯨 🐳", emoji: "🐳" },
  { id: "robot", name: "嗶嗶機器人", desc: "一打噴嚏就會噴出彩色肥皂泡與星星的鐵皮夥伴 🤖", emoji: "🤖" },
  { id: "unicorn", name: "白日夢獨角獸", desc: "鬃毛像彩虹糖一樣甜、極度愛做白日夢的小神獸 🦄", emoji: "🦄" },
];

const PRESET_THEMES = [
  { id: "forest", name: "魔法雲朵森林", desc: "每顆松果都藏著一串清脆音符、樹葉會隨著風唱歌的神奇森林 🌲" },
  { id: "space", name: "糖果星際星雲", desc: "有巨大的草莓棉花糖黑洞、需要搭乘熱氣球航行的高速糖粉銀河 🚀" },
  { id: "toy", name: "玩具秘密城堡", desc: "每到晴朗的梅雨季節，城堡裡的發條人與小木偶都會悄悄甦醒 🏰" },
  { id: "sea", name: "閃亮海底風歌", desc: "貝殼都聽得懂風的悄悄話、章魚先生經營著奇妙夜光畫廊的海底王國 🐚" },
];

const GENRES = [
  { value: StoryGenre.WHIMSICAL, label: "奇幻溫馨 🌸", desc: "色彩繽紛、充滿可愛與奇思妙想的世界" },
  { value: StoryGenre.COZY, label: "溫柔療癒 🌙", desc: "適合睡前舒緩、步調輕柔、描繪大自然與微光細節" },
  { value: StoryGenre.ADVENTUROUS, label: "勇氣冒險 🎒", desc: "攜手突破小考驗、展開一段精彩的歷險之旅" },
  { value: StoryGenre.MYSTERIOUS, label: "神祕探索 🔎", desc: "帶著無限好奇、去解開古老森林或城堡裡的小小謎底" },
];

export default function StoryCreator({ onStart, isLoading }: StoryCreatorProps) {
  const [selectedChar, setSelectedChar] = useState(PRESET_CHARACTERS[0].name);
  const [selectedTheme, setSelectedTheme] = useState(PRESET_THEMES[0].name);
  const [selectedGenre, setSelectedGenre] = useState<StoryGenre>(StoryGenre.WHIMSICAL);
  
  const [customChar, setCustomChar] = useState("");
  const [customTheme, setCustomTheme] = useState("");
  const [customSetup, setCustomSetup] = useState("");
  
  const [charMode, setCharMode] = useState<"preset" | "custom">("preset");
  const [themeMode, setThemeMode] = useState<"preset" | "custom">("preset");

  const handleStartStory = () => {
    const character = charMode === "preset" ? selectedChar : (customChar.trim() || "神秘旅人");
    const theme = themeMode === "preset" ? selectedTheme : (customTheme.trim() || "未知奇異國度");
    
    onStart({
      theme,
      character,
      genre: selectedGenre,
      customSetup: customSetup.trim() || undefined,
    });
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="relative text-center py-4">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block"
        >
          <span className="text-4xl text-center block mb-2">✨📓✨</span>
        </motion.div>
        <span className="text-xs font-semibold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/10 inline-block mb-2">
          iPhone 12 適配版智慧童話書
        </span>
        <h2 className="text-2xl font-black font-serif text-white tracking-tight">
          創立你的魔法童話
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
          選擇你最愛的角色與場景，釋放 AI 童話作家的神奇力量，開啟一段無盡的冒險之旅。
        </p>
      </div>

      {/* Step 1: Character selection */}
      <div className="bg-indigo-950/30 backdrop-blur-md rounded-2xl p-5 border border-indigo-400/20 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2.5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <User className="w-4 h-4 text-violet-300" />
            <span>步驟一：選擇主角</span>
          </h3>
          <div className="flex bg-slate-950/50 rounded-lg p-0.5 border border-indigo-500/10">
            <button
              onClick={() => setCharMode("preset")}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-all font-medium ${charMode === "preset" ? "bg-violet-600 text-white" : "text-indigo-300"}`}
            >
              故事主角
            </button>
            <button
              onClick={() => setCharMode("custom")}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-all font-medium ${charMode === "custom" ? "bg-violet-600 text-white" : "text-indigo-300"}`}
            >
              自定義主角
            </button>
          </div>
        </div>

        {charMode === "preset" ? (
          <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
            {PRESET_CHARACTERS.map((char) => (
              <div
                key={char.id}
                onClick={() => setSelectedChar(char.name)}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  selectedChar === char.name
                    ? "bg-violet-950/50 border-violet-400/60 text-white"
                    : "bg-indigo-950/20 border-indigo-500/10 text-slate-300 hover:bg-indigo-950/40"
                }`}
              >
                <span className="text-2xl select-none">{char.emoji}</span>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold">{char.name}</span>
                  <span className="text-[11px] text-indigo-200/60 leading-tight">{char.desc}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-indigo-200/75">寫下你自己設計的角色（例：『一隻愛唱歌的小蝸牛嘟嘟』）：</label>
            <input
              type="text"
              placeholder="例：戴著黃色圍巾、夢想會飛的小刺蝟波波"
              value={customChar}
              onChange={(e) => setCustomChar(e.target.value)}
              className="w-full text-xs bg-slate-950/60 border border-indigo-500/20 rounded-xl px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>
        )}
      </div>

      {/* Step 2: Theme / Scene selection */}
      <div className="bg-indigo-950/30 backdrop-blur-md rounded-2xl p-5 border border-indigo-400/20 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2.5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-pink-300" />
            <span>步驟二：故事背景</span>
          </h3>
          <div className="flex bg-slate-950/50 rounded-lg p-0.5 border border-indigo-500/10">
            <button
              onClick={() => setThemeMode("preset")}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-all font-medium ${themeMode === "preset" ? "bg-pink-600 text-white" : "text-indigo-300"}`}
            >
              神奇場景
            </button>
            <button
              onClick={() => setThemeMode("custom")}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-all font-medium ${themeMode === "custom" ? "bg-pink-600 text-white" : "text-indigo-300"}`}
            >
              自定義場景
            </button>
          </div>
        </div>

        {themeMode === "preset" ? (
          <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
            {PRESET_THEMES.map((theme) => (
              <div
                key={theme.id}
                onClick={() => setSelectedTheme(theme.name)}
                className={`flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer ${
                  selectedTheme === theme.name
                    ? "bg-pink-950/40 border-pink-400/60 text-white"
                    : "bg-indigo-950/20 border-indigo-500/10 text-slate-300 hover:bg-indigo-950/40"
                }`}
              >
                <span className="text-[13px] font-bold">{theme.name}</span>
                <span className="text-[11px] text-indigo-200/60 leading-tight mt-0.5">{theme.desc}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-indigo-200/75">寫下你想讓故事在哪裡展開：</label>
            <input
              type="text"
              placeholder="例：會下起棉花大雪、人人都能在天空中游泳的冰淇淋小國"
              value={customTheme}
              onChange={(e) => setCustomTheme(e.target.value)}
              className="w-full text-xs bg-slate-950/60 border border-indigo-500/20 rounded-xl px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>
        )}
      </div>

      {/* Step 3: Genre Selector */}
      <div className="bg-indigo-950/30 backdrop-blur-md rounded-2xl p-5 border border-indigo-400/20 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 border-b border-indigo-500/10 pb-2.5">
          <Palette className="w-4 h-4 text-amber-300" />
          <span>步驟三：故事基調氣氛</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {GENRES.map((g) => (
            <div
              key={g.value}
              onClick={() => setSelectedGenre(g.value)}
              className={`flex flex-col p-2.5 rounded-xl border cursor-pointer transition-all ${
                selectedGenre === g.value
                  ? "bg-amber-950/40 border-amber-400/60 text-white"
                  : "bg-indigo-950/20 border-indigo-500/10 text-slate-300 hover:bg-indigo-950/40"
              }`}
            >
              <span className="text-xs font-bold">{g.label}</span>
              <span className="text-[9px] text-indigo-200/60 leading-tight mt-0.5">{g.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 4: Custom additions / instructions */}
      <div className="bg-indigo-950/30 backdrop-blur-md rounded-2xl p-4 border border-indigo-400/20 flex flex-col gap-2">
        <div className="flex items-center gap-1 text-[11px] text-indigo-200 font-semibold">
          <HelpCircle className="w-3.5 h-3.5 text-sky-300" />
          <span>加點神秘佐料？（可選，自定義特殊劇情）</span>
        </div>
        <textarea
          placeholder="例：一路上要有很多好吃的、他的口袋裡總是掏出奇怪的音樂盒、結尾要有大彩蛋..."
          rows={2}
          value={customSetup}
          onChange={(e) => setCustomSetup(e.target.value)}
          className="w-full text-xs bg-slate-950/60 border border-indigo-500/20 rounded-xl px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 resize-none"
        />
      </div>

      {/* Launch button */}
      <div className="mt-2 pb-6">
        <button
          onClick={handleStartStory}
          disabled={isLoading}
          id="btn-create-fairy"
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl btn-vibrant-3d text-white font-black text-base shadow-lg cursor-pointer active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none safe-tap"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>正撒落魔法金粉，編織童話中...</span>
            </div>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-white animate-pulse" />
              <span>翻開神奇童話書 📖</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
