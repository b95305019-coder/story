import React, { useState, useEffect, useRef, FormEvent } from "react";
import { StoryChapter, FairytaleSession } from "../types";
import { Sparkles, ArrowLeft, History, RotateCcw, Share2, Compass, PenTool, CheckCircle } from "lucide-react";
import AudioPlayer from "./AudioPlayer";
import ShareModal from "./ShareModal";
import { motion, AnimatePresence } from "motion/react";

interface StoryVisualizerProps {
  session: FairytaleSession;
  onContinue: (selectedOption: string) => void;
  onGoBack: () => void;
  isLoading: boolean;
  onRewindToChapter: (chapterIndex: number) => void;
}

export default function StoryVisualizer({
  session,
  onContinue,
  onGoBack,
  isLoading,
  onRewindToChapter,
}: StoryVisualizerProps) {
  const [customOption, setCustomOption] = useState("");
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chapters = session.chapters;
  const currentChapter = chapters[chapters.length - 1];

  // Auto-scroll to the bottom when a new chapter is added
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 300);
    }
    setActiveChapterIndex(chapters.length - 1);
  }, [chapters.length]);

  const handleCustomOptionSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customOption.trim()) return;
    onContinue(customOption.trim());
    setCustomOption("");
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  return (
    <div className="w-full flex flex-col pb-16">
      {/* Top action header bar */}
      <div className="flex items-center justify-between gap-2 mb-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <button
          onClick={onGoBack}
          id="visualizer-back-btn"
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-all safe-tap"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回宮殿</span>
        </button>

        <h3 className="text-xs font-bold text-pink-400 select-none truncate max-w-[140px] text-center font-serif">
          《{session.metadata.title}》
        </h3>

        <div className="flex items-center gap-1.5">
          {/* Share */}
          <button
            onClick={handleShare}
            id="story-share-btn"
            className="flex items-center gap-1 text-[10px] font-semibold text-violet-300 hover:text-white bg-violet-600/10 hover:bg-violet-600/35 border border-violet-500/20 px-2.5 py-1.5 rounded-lg transition-all safe-tap"
            title="複製整本故事"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">已複製！</span>
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3" />
                <span>分享</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chapters Scroll View */}
      <div className="flex flex-col gap-5 mb-6">
        {chapters.map((chapter, index) => {
          const isLatest = index === chapters.length - 1;
          return (
            <motion.div
              initial={isLatest ? { opacity: 0, y: 15 } : { opacity: 1 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              key={chapter.id}
              className={`parchment-paper p-6 sm:p-7 relative ${
                isLatest ? "ring-2 ring-violet-500/30" : "opacity-85 filter brightness-95"
              }`}
            >
              {/* Header inside parchment */}
              <div className="flex items-center justify-between mb-3 border-b border-rose-950/10 pb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-orange-950 w-full flex items-center gap-1 font-serif">
                  <span>✦ 故事第 {chapter.chapterIndex + 1} 章 ✦</span>
                  {chapter.selectedOption && (
                    <span className="text-[9px] text-zinc-600 font-sans font-medium line-clamp-1 ml-auto">
                      路標：{chapter.selectedOption}
                    </span>
                  )}
                </span>

                {/* Rewind opportunity button */}
                {!isLatest && (
                  <button
                    onClick={() => {
                      if (confirm(`真的要穿越時空，倒帶回到故事的第 ${chapter.chapterIndex + 1} 章嗎？未來的片段將需要由該點重新創造唷！`)) {
                        onRewindToChapter(index);
                      }
                    }}
                    className="flex items-center gap-0.5 text-[10px] font-bold text-violet-900 bg-violet-100 hover:bg-violet-200 border border-violet-200 px-2 py-1 rounded-md transition-all shrink-0 safe-tap"
                    title="倒帶回到這一章"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>倒帶</span>
                  </button>
                )}
              </div>

              {/* Character custom badge */}
              {index === 0 && (
                <div className="inline-block bg-pink-100 border border-pink-200 text-pink-900 font-bold text-[10px] px-2.5 py-0.5 rounded-full mb-3 select-none">
                  主角：{session.metadata.character} ✦ 氣氛：{session.metadata.genre}
                </div>
              )}

              {/* Story Content Text */}
              <p 
                style={{ wordBreak: "break-all" }}
                className="text-amber-950 text-base sm:text-lg font-serif leading-relaxed tracking-wide mb-4 whitespace-pre-wrap select-text text-justify"
              >
                {chapter.text}
              </p>

              {/* Divider / Starry separation */}
              <div className="flex items-center justify-center gap-1.5 py-1 text-amber-900/30 select-none">
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
              </div>

              {/* Audio Narrator exclusive inside this chapter */}
              <div className="mt-4">
                <AudioPlayer text={chapter.text} chapterIndex={index} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div ref={scrollRef} />

      {/* Decision Branch Section (CLIFFHANGER STATE) */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center text-slate-300 flex flex-col items-center justify-center gap-3 shadow-inner"
          >
            <div className="relative w-12 h-12 flex items-center justify-center">
              <span className="absolute inset-0 w-full h-full border-3 border-pink-500/20 rounded-full" />
              <span className="absolute inset-0 w-full h-full border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xl">🖌️</span>
            </div>
            <div>
              <p className="text-xs font-serif font-bold text-slate-200">
                AI 作家正在翻弄羊皮紙，編寫下一個路口...
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                故事將繼承先前的完整歷史，無限展開中
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4 bg-indigo-950/20 border border-violet-500/10 rounded-2xl p-4 sm:p-5 shadow-lg"
          >
            {/* Suspense Flag */}
            <div className="flex items-center justify-between gap-2 border-b border-violet-500/10 pb-2.5">
              <div className="flex items-center gap-1.5 text-pink-400">
                <Sparkles className="w-4 h-4 fill-pink-500 animate-pulse" />
                <span className="text-xs font-black font-serif tracking-widest uppercase">
                  未完待續，接下來的主角將...
                </span>
              </div>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-400/10">
                無限漫遊
              </span>
            </div>

            {/* Part A: Preset choices */}
            <div className="flex flex-col gap-2.5">
              {currentChapter?.options?.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => onContinue(option)}
                  id={`fairy-option-${idx + 1}`}
                  className="w-full text-left bg-indigo-950/40 text-indigo-100 border-2 border-indigo-500/15 hover:border-pink-500/35 hover:bg-indigo-900/50 rounded-xl p-3.5 transition-all text-xs flex items-center gap-3 safe-tap active:scale-95 group shadow-md font-semibold"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-900/50 text-pink-300 text-[11px] font-black font-mono shrink-0 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                    {idx + 1}
                  </span>
                  <span className="font-bold font-serif flex-1 leading-relaxed text-indigo-200">{option}</span>
                </button>
              ))}
            </div>

            {/* Part B: Custom Typed Direction */}
            <form onSubmit={handleCustomOptionSubmit} className="mt-2.5 pt-3 border-t border-violet-500/10 flex flex-col gap-2">
              <div className="flex items-center gap-1 text-[11px] text-indigo-200 font-semibold mb-0.5">
                <PenTool className="w-3.5 h-3.5 text-yellow-300" />
                <span>或是，輸入你自己想像的神奇劇情：</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="例：突然天上掉下一顆草莓蛋糕，主角決定咬一口..."
                  value={customOption}
                  onChange={(e) => setCustomOption(e.target.value)}
                  className="flex-1 text-xs bg-slate-950/55 border border-indigo-400/20 rounded-xl px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 font-serif"
                />
                <button
                  type="submit"
                  disabled={!customOption.trim()}
                  id="fairy-custom-option-submit"
                  className="rounded-xl px-4 bg-purple-600 text-white hover:bg-purple-500 active:scale-95 transition-all outline-none font-bold text-xs flex items-center justify-center gap-1 shrink-0 safe-tap disabled:opacity-40 disabled:pointer-events-none h-10 btn-vibrant-3d"
                >
                  <span>揮灑</span>
                  <Compass className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {isShareModalOpen && (
        <ShareModal 
          session={session} 
          onClose={() => setIsShareModalOpen(false)} 
        />
      )}
    </div>
  );
}
