import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Coffee, Brain, X } from 'lucide-react';

type TimerMode = 'FOCUS' | 'REST';

export const PomodoroTimer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<TimerMode>('FOCUS');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft <= 0) {
      setIsActive(false);
      // Play sound
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      
      // Auto-switch mode
      if (mode === 'FOCUS') {
        setMode('REST');
        setTimeLeft(5 * 60);
      } else {
        setMode('FOCUS');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'FOCUS' ? 25 * 60 : 5 * 60);
  };

  const addTime = (minutes: number) => {
    setTimeLeft((prev) => prev + minutes * 60);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'FOCUS' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <audio ref={audioRef} src="https://assets.mixkit.co/tests/beep.mp3" preload="auto" />
      
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-[#FAFAFA] text-[#0A0A0A] rounded-full shadow-[0_0_20px_rgba(250,250,250,0.2)] flex items-center justify-center hover:scale-105 transition-all z-50"
        >
           <Coffee className="w-6 h-6" />
        </button>
      )}

      {/* Floating Timer Widget */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 w-80 bg-[#0F0F0F] border border-[#262626] rounded-2xl shadow-2xl p-6 z-50 animate-in slide-in-from-bottom-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2 p-1 bg-[#141414] rounded-lg">
              <button
                onClick={() => switchMode('FOCUS')}
                className={`px-3 py-1 text-xs uppercase tracking-widest rounded-md transition-all ${
                  mode === 'FOCUS' ? 'bg-[#FAFAFA] text-[#0A0A0A] font-medium' : 'text-[#525252] hover:text-[#FAFAFA]'
                }`}
              >
                Focus
              </button>
              <button
                onClick={() => switchMode('REST')}
                className={`px-3 py-1 text-xs uppercase tracking-widest rounded-md transition-all ${
                  mode === 'REST' ? 'bg-[#FAFAFA] text-[#0A0A0A] font-medium' : 'text-[#525252] hover:text-[#FAFAFA]'
                }`}
              >
                Rest
              </button>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-[#525252] hover:text-[#FAFAFA] transition-colors rounded p-1 hover:bg-[#1A1A1A]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center my-8">
            <div className="text-6xl font-light tracking-tighter text-[#FAFAFA] tabular-nums">
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs uppercase tracking-widest text-[#A3A3A3] mt-2 flex items-center justify-center gap-2">
              {mode === 'FOCUS' ? <Brain className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
              {mode === 'FOCUS' ? 'Deep Work' : 'Recovery'}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={toggleTimer}
              className="w-14 h-14 bg-[#FAFAFA] text-[#0A0A0A] rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_15px_rgba(250,250,250,0.1)]"
            >
              {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            <button
              onClick={resetTimer}
              className="w-10 h-10 bg-[#1A1A1A] border border-[#262626] text-[#A3A3A3] rounded-full flex items-center justify-center hover:text-[#FAFAFA] hover:border-[#525252] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addTime(5)}
              className="py-2 flex justify-center items-center gap-1.5 text-xs text-[#A3A3A3] bg-[#141414] hover:bg-[#1A1A1A] hover:text-[#FAFAFA] border border-[#262626] rounded-lg transition-colors uppercase tracking-wider"
            >
              <Plus className="w-3 h-3" /> 5 min
            </button>
            <button
              onClick={() => addTime(10)}
              className="py-2 flex justify-center items-center gap-1.5 text-xs text-[#A3A3A3] bg-[#141414] hover:bg-[#1A1A1A] hover:text-[#FAFAFA] border border-[#262626] rounded-lg transition-colors uppercase tracking-wider"
            >
              <Plus className="w-3 h-3" /> 10 min
            </button>
          </div>
        </div>
      )}
    </>
  );
};