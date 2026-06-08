import { FairytaleSession } from "../types";
import { BookOpen, Calendar, Trash2, ChevronRight, User, Heart } from "lucide-react";

interface SavedStoriesProps {
  sessions: FairytaleSession[];
  onSelectSession: (session: FairytaleSession) => void;
  onDeleteSession: (id: string) => void;
}

export default function SavedStories({ sessions, onSelectSession, onDeleteSession }: SavedStoriesProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 bg-indigo-950/30 rounded-2xl border border-indigo-400/25 text-center text-slate-300">
        <Heart className="w-10 h-10 text-pink-400 mb-3 animate-pulse" />
        <h4 className="text-sm font-semibold text-slate-100">這裡還沒有寫好的童話</h4>
        <p className="text-xs text-indigo-200/70 mt-1 max-w-xs leading-relaxed">
          點擊上方的「翻開神奇童話」建立你的第一個旅途，冒險將被永久珍藏在這裡唷！
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 px-1">
        <BookOpen className="w-4 h-4 text-pink-400" />
        <span className="text-xs font-bold text-slate-200">
          我的奇幻藏書閣 ({sessions.length})
        </span>
      </div>

      <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
        {sessions.map((session) => {
          const firstChapter = session.chapters[0];
          const words = session.chapters.reduce((acc, c) => acc + c.text.length, 0);
          
          return (
            <div
              key={session.id}
              className="flex items-center justify-between p-3.5 bg-indigo-950/35 hover:bg-indigo-950/60 border border-indigo-500/15 rounded-xl transition-all gap-3"
            >
              {/* Clickable info block */}
              <div
                onClick={() => onSelectSession(session)}
                className="flex-1 cursor-pointer flex flex-col gap-1 overflow-hidden"
              >
                <h4 className="text-[13px] font-bold text-white truncate flex items-center gap-1 shadow-sm font-serif">
                  《{session.metadata.title || "奇幻冒險"}》
                </h4>
                
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-indigo-200/60">
                  <span className="flex items-center gap-0.5 whitespace-nowrap">
                    <User className="w-3 h-3 text-pink-400" />
                    <strong>{session.metadata.character}</strong>
                  </span>
                  <span>•</span>
                  <span>{session.chapters.length} 篇章</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(session.updatedAt).toLocaleDateString(undefined, { 
                      month: "numeric", 
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onSelectSession(session)}
                  className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors safe-tap"
                  title="繼續冒險"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("確定要刪除這本童話嗎？這項魔法消失後就無法復原囉！")) {
                      onDeleteSession(session.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-indigo-300 hover:text-red-400 hover:bg-red-500/10 transition-colors safe-tap"
                  title="燃燒這本書"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
