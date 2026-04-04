import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { useOnboardingStore } from '../store/useOnboardingStore';

const QUOTES = [
  "Discipline beats motivation.",
  "Small wins daily = big results.",
  "Consistency creates confidence.",
  "Progress over perfection.",
  "One day at a time, always forward.",
  "Your future self will thank you.",
  "Done is better than perfect.",
  "Build the habit, not just the task.",
  "Every streak starts with one day.",
  "Commits compound like interest.",
  "Show up for yourself daily.",
  "Excellence is a habit.",
  "Create momentum, not motivation.",
  "The best time was yesterday. The second best is now.",
  "Focus on the process, trust the results.",
  "Sustainable progress beats burnout.",
  "Your consistency is your superpower.",
  "No shortcuts, only shortcuts masquerading as progress.",
  "Build 1% better every single day.",
  "Streaks are built on single days.",
  "Discipline is choosing what you want most.",
  "The compound effect of daily effort is unstoppable.",
  "Success is the sum of small efforts.",
  "Your habit is your identity.",
  "Consistency trumps intensity.",
  "Make it too easy to say no to laziness.",
  "Every day you skip makes it easier to skip.",
  "The hardest part is showing up.",
  "Let your streak speak for you.",
  "Yesterday you said tomorrow. Not today."
];

interface DailyStats {
  date: string;
  completed: number;
  total: number;
  percentage: number;
}

export const Progress: React.FC = () => {
  const { tasks } = useStore();
  const { primaryGoal } = useOnboardingStore();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const dailyStats = useMemo(() => {
    const stats: { [key: string]: DailyStats } = {};
    const timetable = JSON.parse(localStorage.getItem('daily_timetable') || '[]');
    const totalRoutineItems = timetable.length;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      stats[dateStr] = { date: dateStr, completed: 0, total: 0, percentage: 0 };

      // Incorporate Timetable Completions
      const dailyCompsStr = localStorage.getItem(`timetable_comps_${dateStr}`);
      if (dailyCompsStr && totalRoutineItems > 0) {
          const comps = JSON.parse(dailyCompsStr);
          const completedCount = Object.values(comps).filter(v => v === true).length;
          stats[dateStr].total += totalRoutineItems;
          stats[dateStr].completed += completedCount;
      }
    }

    // Incorporate Store Tasks
    tasks.forEach(task => {
      const createdDate = new Date(task.createdAt).toISOString().split('T')[0];
      if (stats[createdDate]) {
        stats[createdDate].total += 1;
        if (task.completed) {
          stats[createdDate].completed += 1;
        }
      }
    });

    Object.keys(stats).forEach(date => {
      if (stats[date].total > 0) {
        stats[date].percentage = Math.round((stats[date].completed / stats[date].total) * 100);
      }
    });

    return Object.values(stats);
  }, [tasks]);

  const { currentStreak, longestStreak } = useMemo(() => {
    const streakData = JSON.parse(localStorage.getItem('streak_history') || '[]');
    let longest = 0;
    let tempStreak = 0;
    
    // Sort dates
    streakData.sort();
    
    for (let i = 0; i < streakData.length; i++) {
        if (i === 0) {
            tempStreak = 1;
        } else {
            const currDate = new Date(streakData[i]);
            const prevDate = new Date(streakData[i - 1]);
            const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                tempStreak++;
            } else if (diffDays > 1) {
                if (tempStreak > longest) longest = tempStreak;
                tempStreak = 1;
            }
        }
    }
    if (tempStreak > longest) longest = tempStreak;

    // Check if current streak involves today or yesterday
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let current = 0;
    if (streakData.includes(todayStr) || streakData.includes(yesterdayStr)) {
        // Compute current streak by walking backward
        let checkDate = new Date();
        if (!streakData.includes(todayStr)) {
            checkDate = yesterday;
        }
        let walkStreak = 0;
        
        while (true) {
            const checkStr = checkDate.toISOString().split('T')[0];
            if (streakData.includes(checkStr)) {
                walkStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        current = walkStreak;
    }

    return { currentStreak: current, longestStreak: longest };
  }, [dailyStats]);

  const todayQuote = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const res = await fetch('http://localhost:5000/api/ai/analyze-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tasks, 
          jobs: [], 
          userContext: { goal: primaryGoal, dailyStats, currentStreak }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.actionableFocus || "Keep pushing forward with your daily goals.");
      }
    } catch (e) {
      console.error(e);
      setAiAnalysis("Failed to load AI insights. Ensure backend is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0A0A0A]/90 backdrop-blur-xl border border-[#262626] rounded-xl px-4 py-3 shadow-[0_0_30px_rgba(250,250,250,0.05)]">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#525252] mb-1">{label}</p>
          <p className="text-xl font-light text-[#FAFAFA]">{payload[0].value}<span className="text-sm text-[#A3A3A3]">%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-full bg-transparent py-10 px-8 text-[#FAFAFA] font-sans">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#141414]/20 via-[#0A0A0A] to-[#0A0A0A]" />

      <div className="max-w-6xl mx-auto space-y-24 mt-10">
        
        {/* Kinetic Header */}
        <header className="flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[#A3A3A3] font-medium opacity-50">Energy & Consistency</div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter mix-blend-screen text-transparent bg-clip-text bg-gradient-to-b from-[#FAFAFA] to-[#525252]">
            {currentStreak} <span className="text-[#525252]">Days</span>
          </h1>
          <p className="text-sm font-light text-[#A3A3A3] max-w-sm mt-4 text-center leading-relaxed">
            "{todayQuote}"
          </p>
        </header>

        {/* Ethereal Analytics Flow */}
        <section className="relative w-full h-[400px] animate-in fade-in zoom-in-95 duration-1000 delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] fill-mode-both">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyStats} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FAFAFA" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#FAFAFA" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#262626', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area 
                type="monotone" 
                dataKey="percentage" 
                stroke="#FAFAFA" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPercentage)" 
                animationDuration={2500}
                animationEasing="ease-in-out"
                activeDot={{ r: 4, stroke: '#0A0A0A', strokeWidth: 2, fill: '#FAFAFA' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          
          {/* Chart Overlay Gradients for smooth fade out at edges */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0A0A0A] to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0A0A0A] to-transparent pointer-events-none" />
          
          <div className="absolute top-0 right-0 p-4 pointer-events-none">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#525252]">30 Day Velocity</span>
          </div>
        </section>

        {/* Minimal Synced Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-[#141414]/50 pt-10 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-500 fill-mode-both">
          
          <div className="flex flex-col items-center justify-center space-y-3 group cursor-default">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#525252] group-hover:text-[#A3A3A3] transition-colors">Longest State</p>
            <p className="text-4xl font-light tracking-tighter text-[#FAFAFA]">{longestStreak} <span className="text-lg text-[#525252]">Days</span></p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-3 group cursor-default">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#525252] group-hover:text-[#A3A3A3] transition-colors">Actions Completed</p>
            <p className="text-4xl font-light tracking-tighter text-[#FAFAFA]">{dailyStats.reduce((sum: number, d: any) => sum + d.completed, 0)}</p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-3 group cursor-default">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#525252] group-hover:text-[#A3A3A3] transition-colors">Algorithmic Balance</p>
            <p className="text-4xl font-light tracking-tighter text-[#FAFAFA]">
              {dailyStats.reduce((sum: number, d: any) => sum + d.total, 0) > 0
                ? Math.round((dailyStats.reduce((sum: number, d: any) => sum + d.completed, 0) / dailyStats.reduce((sum: number, d: any) => sum + d.total, 0)) * 100)
                : 0}
              <span className="text-lg text-[#525252]">%</span>
            </p>
          </div>

        </section>

        {/* AI Analytics Integration */}
        <section className="pt-10 pb-20 border-t border-[#141414]/50 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-700 fill-mode-both max-w-3xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-6">
                <Brain className="w-8 h-8 text-[#A3A3A3] opacity-50" />
                <h2 className="text-xl font-light tracking-wide text-[#FAFAFA]">System Analysis</h2>
                <p className="text-sm font-light text-[#A3A3A3]">Generate an intelligent overview of your current progress and momentum to find the best way forward.</p>
                
                {!aiAnalysis && !isAnalyzing && (
                    <button 
                        onClick={handleAIAnalysis}
                        className="mt-4 px-6 py-2.5 bg-[#FAFAFA] text-[#0A0A0A] text-xs uppercase tracking-widest font-medium rounded hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" /> Synthesize Insights
                    </button>
                )}

                {isAnalyzing && (
                    <div className="flex items-center justify-center gap-2 text-[#525252] animate-pulse mt-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs uppercase tracking-widest">Processing Data Vectors...</span>
                    </div>
                )}

                {aiAnalysis && (
                    <div className="w-full mt-6 bg-[#0F0F0F] border border-[#262626] rounded-xl p-8 relative overflow-hidden group text-left">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FAFAFA]/5 to-transparent rounded-full blur-3xl" />
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-[#FAFAFA] flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" /> AI Feedback
                            </h3>
                            <button onClick={handleAIAnalysis} className="text-[#525252] hover:text-[#FAFAFA] transition-colors" title="Regenerate">
                                <RefreshCw className="w-4 h-4"/>
                            </button>
                        </div>
                        <p className="text-sm font-light text-[#A3A3A3] leading-relaxed whitespace-pre-wrap">
                            {aiAnalysis}
                        </p>
                    </div>
                )}
            </div>
        </section>

      </div>
    </div>
  );
};
