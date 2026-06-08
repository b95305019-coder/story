import { useState } from "react";
import { FairytaleSession } from "../types";
import { Share2, Copy, Check, X, Sparkles, Wand2, Link, MessageSquare, Download } from "lucide-react";

interface ShareModalProps {
  session: FairytaleSession;
  onClose: () => void;
}

export default function ShareModal({ session, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [postcardCopied, setPostcardCopied] = useState(false);

  const title = session.metadata.title;
  const character = session.metadata.character;
  const theme = session.metadata.theme;
  const genre = session.metadata.genre;
  
  // Get the last chapter as safe excerpt
  const chapters = session.chapters;
  const latestChapter = chapters[chapters.length - 1];
  const excerptText = latestChapter?.text || "";
  const shortenedExcerpt = excerptText.length > 100 ? excerptText.substring(0, 95) + "..." : excerptText;

  // Build the live sharing dynamic URL
  const appBaseUrl = window.location.origin + window.location.pathname;
  const shareParams = new URLSearchParams();
  shareParams.set("sTitle", title);
  shareParams.set("sChar", character);
  shareParams.set("sTheme", theme);
  shareParams.set("sGenre", genre);
  shareParams.set("sText", excerptText);
  const magicShareUrl = `${appBaseUrl}?${shareParams.toString()}`;

  // Formatted plaintext invitation
  const beautifulShareText = `✨📖【童話星願 ∙ 奇幻夢境分享卡】📖✨

我與孩子一起編織了一本獨一無二的神奇童話！

《${title}》
🎨 冒險主角：${character}
🌌 奇妙背景：${theme}

📖 精彩段落：
「${shortenedExcerpt}」

🔮 邀請你點擊下方連結，一起幫 ${character} 抉擇命運，繼續編織寫下去：
🔗 飛入神奇童話世界： ${magicShareUrl}

#動態童話產生器 #親子共讀 #AI星願童話`;

  const handleCopyLinkOnly = () => {
    navigator.clipboard.writeText(magicShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPostcardText = () => {
    navigator.clipboard.writeText(beautifulShareText);
    setPostcardCopied(true);
    setTimeout(() => setPostcardCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Dim Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-gradient-to-br from-indigo-950/95 via-purple-950/95 to-slate-950/95 border-2 border-indigo-400/40 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]">
        
        {/* Sparkly header */}
        <div className="p-4 border-b border-indigo-500/10 flex items-center justify-between bg-indigo-950/50">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4.5 h-4.5 text-pink-400 animate-pulse" />
            <span className="text-xs font-black tracking-wide text-indigo-100 font-serif">
              神奇故事賀卡生成器
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full bg-slate-900/60 hover:bg-slate-800 text-indigo-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Card Center */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-5">
          
          {/* Visual card mimicking a beautiful postcard */}
          <div className="relative w-full rounded-2xl bg-gradient-to-tr from-violet-600 via-pink-500 to-indigo-600 p-1 shadow-lg shadow-purple-900/30">
            <div className="rounded-[14px] bg-slate-950 p-4 relative overflow-hidden flex flex-col gap-3 min-h-[290px]">
              
              {/* Card stars details */}
              <div className="absolute top-2 right-2 text-2xl opacity-20 pointer-events-none select-none select-none">✨</div>
              <div className="absolute bottom-2 left-2 text-xl opacity-20 pointer-events-none select-none select-none">⭐</div>
              
              {/* Postcard stamp frame mockup */}
              <div className="absolute top-4 right-4 w-12 h-14 border border-dashed border-pink-400/50 rounded flex flex-col items-center justify-center bg-pink-500/5 select-none">
                <span className="text-[9px] text-pink-300 font-bold scale-90 uppercase tracking-widest leading-none">FAIRY</span>
                <span className="text-base mt-1">🦄</span>
              </div>

              {/* Story badge */}
              <div className="flex">
                <span className="bg-pink-500/15 border border-pink-500/30 text-pink-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Dream Weaver
                </span>
              </div>

              {/* Postcard titles */}
              <div className="pr-14 flex flex-col gap-0.5">
                <h3 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-violet-300 font-serif line-clamp-2">
                  《{title}》
                </h3>
                <p className="text-[10px] text-indigo-300/80 font-mono">
                  ✦ 世界觀：{theme}
                </p>
              </div>

              {/* Excerpt panel styled like index card paper */}
              <div className="rounded-xl bg-orange-50 p-3 flex-1 border border-pink-200/20 text-indigo-950 leading-relaxed text-xs relative overflow-hidden font-serif">
                <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-orange-50/0 to-orange-50/10 pointer-events-none" />
                <p className="text-[10px] text-pink-600/70 font-sans font-black tracking-wide mb-1 flex items-center gap-1 border-b border-pink-200/50 pb-1">
                  <span>冒險片段 ✦ 第一節</span>
                  <span className="ml-auto font-normal text-[9px] opacity-80">主角：{character}</span>
                </p>
                <div className="line-clamp-6 text-[11px] text-slate-800 leading-normal">
                  {shortenedExcerpt}
                </div>
              </div>

              {/* Magical Invite Footer */}
              <div className="flex items-center justify-between mt-1 text-[9px] text-indigo-300/60 font-mono">
                <div className="flex flex-col">
                  <span>✦ 魔法音阻辨識已啟用</span>
                  <span>✦ 點擊連結與奇奇同行</span>
                </div>
                <div className="text-right">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-violet-600/20 border border-violet-500/30 text-[8px] text-violet-300 uppercase font-black tracking-wide">
                    LINK ATTACHED
                  </span>
                </div>
              </div>

            </div>
          </div>

          <p className="text-[11px] text-indigo-200/70 text-center leading-relaxed">
            💡 連結含有<b>完整的當前故事大綱與狀態設定</b>。<br />家人和朋友可以從您的進度繼續往下延伸發展！
          </p>

          {/* Share Actions buttons */}
          <div className="flex flex-col gap-2 pt-2 border-t border-indigo-500/10">
            {/* Copy full formatted text card invitation */}
            <button
              onClick={handleCopyPostcardText}
              className="w-full h-11 rounded-xl bg-pink-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md hover:bg-pink-500 active:scale-95 transition-all cursor-pointer safe-tap"
            >
              {postcardCopied ? (
                <>
                  <Check className="w-4 h-4 text-white animate-bounce" />
                  <span>賀卡邀請文字複製成功！</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>複製精美賀卡邀請文字 (適LINE/社群)</span>
                </>
              )}
            </button>

            {/* Copy just the magic link */}
            <button
              onClick={handleCopyLinkOnly}
              className="w-full h-11 rounded-xl bg-violet-950/60 text-violet-300 hover:text-white border-2 border-violet-500/20 font-bold text-xs flex items-center justify-center gap-2 hover:bg-violet-900/40 active:scale-95 transition-all cursor-pointer safe-tap"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">專用魔法連結已複製！</span>
                </>
              ) : (
                <>
                  <Link className="w-4 h-4" />
                  <span>僅複製專屬神奇進度連結</span>
                </>
              )}
            </button>
          </div>

          {/* Screenshot Reminder */}
          <div className="text-center">
            <span className="text-[9px] text-pink-400/70 font-bold animate-pulse">
              📸 小提示：直接截圖這張卡片，就是送給孩子最美的繪本封面唷！
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
