import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';

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

  const dailyStats = useMemo(() => {
    const stats: { [key: string]: DailyStats } = {};
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      stats[dateStr] = { date: dateStr, completed: 0, total: 0, percentage: 0 };
    }

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
    let current = 0;
    let longest = 0;
    let tempStreak = 0;

    for (let i = dailyStats.length - 1; i >= 0; i--) {
      if (dailyStats[i].percentage >= 60) {
        tempStreak++;
      } else {
        if (tempStreak > longest) longest = tempStreak;
        tempStreak = 0;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dailyStats[dailyStats.length - 1].date === today && dailyStats[dailyStats.length - 1].percentage >= 60) {
      current = tempStreak;
    } else if (dailyStats[dailyStats.length - 1].date === yesterdayStr && dailyStats[dailyStats.length - 1].percentage >= 60) {
      current = tempStreak;
    }

    if (tempStreak > longest) longest = tempStreak;

    return { currentStreak: current, longestStreak: longest };
  }, [dailyStats]);

  const todayQuote = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  const getColorClass = (percentage: number): string => {
    if (percentage === 0) return 'bg-[#141414] border border-[#262626]';
    if (percentage <= 25) return 'bg-[#262626]';
    if (percentage <= 50) return 'bg-[#525252]';
    if (percentage <= 75) return 'bg-[#A3A3A3]';
    return 'bg-[#FAFAFA]';
  };

  return (
    <div className="min-h-full bg-[#0A0A0A] py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <header className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-[#FAFAFA]">Progress</h1>
          <p className="text-[#A3A3A3] text-base">Track your consistency and maintain velocity.</p>
        </header>

        {/* Daily Quote */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 flex flex-col justify-center">
          <p className="text-lg text-[#FAFAFA] font-medium tracking-wide">"{todayQuote}"</p>
          <p className="text-xs text-[#525252] mt-3 uppercase tracking-widest font-semibold">Today's Focus</p>
        </div>

        {/* Streak Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#FAFAFA] rounded-full blur-[80px] -mr-10 -mt-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500" />
            <p className="text-sm text-[#A3A3A3] mb-4 font-medium uppercase tracking-wider">Current Streak</p>
            <div className="flex items-baseline gap-3 relative z-10">
              <span className="text-6xl font-bold text-[#FAFAFA] tracking-tighter tabular-nums">{currentStreak}</span>
              <span className="text-[#525252] font-semibold text-lg">Days</span>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#FAFAFA] rounded-full blur-[80px] -mr-10 -mt-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500" />
            <p className="text-sm text-[#A3A3A3] mb-4 font-medium uppercase tracking-wider">Best Streak</p>
            <div className="flex items-baseline gap-3 relative z-10">
              <span className="text-6xl font-bold text-[#FAFAFA] tracking-tighter tabular-nums">{longestStreak}</span>
              <span className="text-[#525252] font-semibold text-lg">Days</span>
            </div>
          </div>
        </div>

        {/* Streak Calendar */}
        <section className="bg-[#141414] border border-[#262626] rounded-xl p-8">
          <div className="flex items-center justify-between border-b border-[#262626] pb-6 mb-8">
            <h2 className="text-lg font-medium text-[#FAFAFA]">Activity Heatmap</h2>
            <span className="text-sm text-[#A3A3A3] bg-[#0A0A0A] px-3 py-1 rounded-full border border-[#262626]">Last 30 Days</span>
          </div>
          
          <div className="max-w-md mx-auto">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={`${day}-${i}`} className="text-center text-xs text-[#525252] font-semibold mb-2">
                  {day}
                </div>
              ))}

              {/* Calendar cells */}
              {dailyStats.map((stat, idx) => {
                const dayOfWeek = new Date(stat.date).getDay();
                
                const emptyCells = idx === 0 ? Array.from({ length: dayOfWeek }).map((_, i) => (
                   <div key={`empty-${i}`} className="aspect-square rounded pointer-events-none" />
                )) : [];

                return (
                  <React.Fragment key={stat.date}>
                    {emptyCells}
                    <div
                      className={`aspect-square rounded transition-all duration-300 ${getColorClass(stat.percentage)} cursor-pointer relative group flex items-center justify-center hover:ring-2 hover:ring-[#A3A3A3] hover:ring-offset-2 hover:ring-offset-[#141414]`}
                    >
                      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-[#262626] text-[#FAFAFA] text-xs py-1.5 px-3 rounded shadow-xl -top-12 pointer-events-none whitespace-nowrap z-10 border border-[#404040]">
                        <p className="font-semibold">{stat.completed}/{stat.total} tasks</p>
                        <p className="text-[#A3A3A3] text-[10px] mt-0.5">{stat.date}</p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-3 pt-8 mt-4 border-t border-[#262626]">
              <span className="text-xs font-medium text-[#525252]">Less</span>
              <div className="flex gap-1.5">
                {[
                  'bg-[#0A0A0A] border border-[#262626]',
                  'bg-[#262626]',
                  'bg-[#525252]',
                  'bg-[#A3A3A3]',
                  'bg-[#FAFAFA]'
                ].map((color, i) => (
                  <div key={i} className={`w-3.5 h-3.5 rounded-sm ${color}`} />
                ))}
              </div>
              <span className="text-xs font-medium text-[#525252]">More</span>
            </div>
          </div>
        </section>

        {/* Summary Stats Container */}
        <section className="bg-[#141414] border border-[#262626] rounded-xl p-8">
          <div className="flex items-center justify-between border-b border-[#262626] pb-6 mb-8">
            <h2 className="text-lg font-medium text-[#FAFAFA]">Summary</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#0A0A0A] border border-[#262626] rounded-xl transition-colors hover:border-[#404040]">
              <p className="text-xs text-[#A3A3A3] mb-2 uppercase tracking-wider font-semibold">Total Tasks</p>
              <p className="text-4xl font-semibold text-[#FAFAFA] tabular-nums">{dailyStats.reduce((sum, d) => sum + d.total, 0)}</p>
            </div>

            <div className="p-6 bg-[#0A0A0A] border border-[#262626] rounded-xl transition-colors hover:border-[#404040]">
              <p className="text-xs text-[#A3A3A3] mb-2 uppercase tracking-wider font-semibold">Completed</p>
              <p className="text-4xl font-semibold text-[#FAFAFA] tabular-nums">{dailyStats.reduce((sum, d) => sum + d.completed, 0)}</p>
            </div>

            <div className="p-6 bg-[#0A0A0A] border border-[#262626] rounded-xl transition-colors hover:border-[#404040]">
              <p className="text-xs text-[#A3A3A3] mb-2 uppercase tracking-wider font-semibold">Overall %</p>
              <p className="text-4xl font-semibold text-[#FAFAFA] tabular-nums">
                {dailyStats.reduce((sum, d) => sum + d.total, 0) > 0
                  ? Math.round(
                      (dailyStats.reduce((sum, d) => sum + d.completed, 0) /
                        dailyStats.reduce((sum, d) => sum + d.total, 0)) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
