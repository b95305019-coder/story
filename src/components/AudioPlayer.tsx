import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Volume2, Sparkles, ChevronRight } from "lucide-react";

interface AudioPlayerProps {
  text: string;
  chapterIndex: number;
}

export default function AudioPlayer({ text, chapterIndex }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [rate, setRate] = useState<number>(0.95); // Slightly slower is warmer for fairy tales
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(-1);
  const [sentences, setSentences] = useState<string[]>([]);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const activeIndexRef = useRef<number>(-1);
  const isPlayingRef = useRef<boolean>(false);

  // Initialize SpeechSynthesis and voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        // Filter for Chinese (Taiwan zh-TW, general zh, or fallback Cantonese/Chinese)
        const zhVoices = availableVoices.filter(v => 
          v.lang.toLowerCase().includes("zh") || 
          v.lang.toLowerCase().includes("tw") ||
          v.lang.toLowerCase().includes("hk")
        );
        
        setVoices(zhVoices.length > 0 ? zhVoices : availableVoices.slice(0, 10));
        
        // Auto select a good Taiwan voice or Chinese voice if possible
        const twVoice = zhVoices.find(v => v.lang.includes("TW")) || zhVoices[0];
        if (twVoice) {
          setSelectedVoice(twVoice.name);
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      stopSpeech();
    };
  }, []);

  // Split text into sentences for reliable playback on iOS Safari (iPhone 12)
  useEffect(() => {
    if (!text) return;
    
    // Split on typical sentence end particles
    const rawParts = text.split(/([。！？；]+)/);
    const parsedSentences: string[] = [];
    
    // Merge punctuation with its previous sentence
    for (let i = 0; i < rawParts.length; i++) {
      const part = rawParts[i];
      if (!part) continue;
      
      if (["。", "！", "？", "；"].includes(part)) {
        if (parsedSentences.length > 0) {
          parsedSentences[parsedSentences.length - 1] += part;
        } else {
          parsedSentences.push(part);
        }
      } else {
        const trimmed = part.trim();
        if (trimmed) {
          parsedSentences.push(trimmed);
        }
      }
    }
    
    setSentences(parsedSentences);
    stopSpeech();
  }, [text, chapterIndex]);

  // Stop current utterance
  const stopSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setActiveSentenceIndex(-1);
    activeIndexRef.current = -1;
    isPlayingRef.current = false;
  };

  // Pause speech
  const pauseSpeech = () => {
    if (synthRef.current && isPlaying) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  };

  // Resume speech
  const resumeSpeech = () => {
    if (synthRef.current && isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
    }
  };

  // Play sentence queue sequentially
  const playQueueFromIndex = (index: number) => {
    if (!synthRef.current || index >= sentences.length || !isPlayingRef.current) {
      if (index >= sentences.length) {
        stopSpeech();
      }
      return;
    }

    setActiveSentenceIndex(index);
    activeIndexRef.current = index;

    const textToSpeak = sentences[index];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Set parameters
    const foundVoice = voices.find(v => v.name === selectedVoice);
    if (foundVoice) {
      utterance.voice = foundVoice;
    }
    utterance.rate = rate;
    utterance.pitch = 1.05; // Slightly high-pitched is cute and whimsical
    utterance.volume = 1.0;

    utterance.onend = () => {
      // Small lag between sentences feel more natural
      setTimeout(() => {
        if (isPlayingRef.current) {
          playQueueFromIndex(index + 1);
        }
      }, 350);
    };

    utterance.onerror = (e) => {
      console.warn("Speech Synthesis error:", e);
      if (isPlayingRef.current) {
        // Safe progression to avoid lockups
        playQueueFromIndex(index + 1);
      }
    };

    synthRef.current.speak(utterance);
    
    // Resume workarounds for Safari (especially on iOS)
    // Utterance can stall occasionally, force-resume triggers safely
    if (synthRef.current.paused) {
      synthRef.current.resume();
    }
  };

  // Start complete playback
  const startSpeech = () => {
    if (!synthRef.current || sentences.length === 0) return;
    
    // Cancel any ongoing tts
    synthRef.current.cancel();
    
    setIsPlaying(true);
    setIsPaused(false);
    isPlayingRef.current = true;
    
    // Start from the beginning
    playQueueFromIndex(0);
  };

  return (
    <div className="w-full bg-violet-950/40 backdrop-blur-md rounded-2xl p-4 border border-violet-500/20 shadow-lg mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Play controls & audio status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-500/20 text-pink-300">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-violet-100 flex items-center gap-1">
              <span>溫馨語音朗讀</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            </h4>
            <p className="text-xs text-violet-300">
              {isPlaying 
                ? `正在朗讀中 (${activeSentenceIndex + 1}/${sentences.length} 句)` 
                : "點擊播放按鈕，讓童話發聲"}
            </p>
          </div>
        </div>

        {/* Audio buttons */}
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              onClick={startSpeech}
              id="tts-start-btn"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-violet-600 text-white font-medium text-sm shadow-md shadow-pink-500/15 hover:opacity-95 transition-all text-center safe-tap active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>朗讀故事</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={resumeSpeech}
              id="tts-resume-btn"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 text-white font-medium text-sm shadow-md hover:bg-emerald-500 transition-all safe-tap active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>繼續</span>
            </button>
          ) : (
            <button
              onClick={pauseSpeech}
              id="tts-pause-btn"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-amber-600 text-white font-medium text-sm shadow-md hover:bg-amber-500 transition-all safe-tap active:scale-95"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>暫停</span>
            </button>
          )}

          {isPlaying && (
            <button
              onClick={stopSpeech}
              id="tts-stop-btn"
              className="flex items-center justify-center p-2.5 rounded-full bg-slate-800 text-rose-400 border border-slate-700 hover:bg-slate-700 transition-all safe-tap active:scale-95"
              title="停止播放"
            >
              <Square className="w-4 h-4 fill-rose-400" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable settings */}
      <div className="mt-4 pt-3 border-t border-violet-500/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Voice Select */}
        {voices.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-violet-300">選擇朗讀聲音：</label>
            <select
              value={selectedVoice}
              onChange={(e) => {
                setSelectedVoice(e.target.value);
                if (isPlaying) {
                  // restart with new voice from the current sentence index
                  synthRef.current?.cancel();
                  playQueueFromIndex(activeSentenceIndex);
                }
              }}
              className="text-xs bg-slate-900/60 text-slate-200 border border-violet-500/20 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name} className="bg-slate-900 text-slate-200 text-xs">
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Speed Adjustment */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-medium text-violet-300">朗讀速度：</label>
            <span className="text-[11px] font-semibold text-pink-400 font-mono">{rate}x</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.6"
              max="1.5"
              step="0.1"
              value={rate}
              onChange={(e) => {
                const newRate = parseFloat(e.target.value);
                setRate(newRate);
                if (isPlaying) {
                  // restart with new speed from current index
                  synthRef.current?.cancel();
                  playQueueFromIndex(activeSentenceIndex);
                }
              }}
              className="w-full accent-pink-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Visual dynamic sound wave and sentence highlighter */}
      {isPlaying && !isPaused && (
        <div className="mt-4 flex items-center justify-center gap-1.5 h-8 bg-violet-950/20 rounded-xl px-4 border border-violet-500/5">
          <div className="sound-bar" />
          <div className="sound-bar" />
          <div className="sound-bar" />
          <div className="sound-bar animate-[waveGrow_1.3s_infinite_ease-in-out]" />
          <div className="sound-bar" />
          <div className="sound-bar" />
          <div className="sound-bar" />
        </div>
      )}

      {/* Sentence highlighting display */}
      {isPlaying && activeSentenceIndex >= 0 && sentences[activeSentenceIndex] && (
        <div className="mt-3 bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-400/20 flex gap-2">
          <ChevronRight className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
          <span className="text-xs text-indigo-100 font-serif leading-relaxed italic">
            「 {sentences[activeSentenceIndex]} 」
          </span>
        </div>
      )}
    </div>
  );
}
