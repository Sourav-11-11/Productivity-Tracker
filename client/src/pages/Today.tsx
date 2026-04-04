import { useOnboardingStore } from '../store/useOnboardingStore';
import { useEndelState } from '../hooks/useEndelState';
import { Timetable } from '../components/Timetable';
import { StreakCalendar } from '../components/StreakCalendar';
import { useMemo } from 'react';

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
];

export const Today = () => {
  const { primaryGoal } = useOnboardingStore();
  const endelState = useEndelState();

  const todayQuote = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  return (
    <div className="min-h-full bg-transparent py-4 px-8 text-[#FAFAFA] font-sans selection:bg-[#FAFAFA] selection:text-[#0A0A0A] overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Kinetic Header */}
        <header className="flex flex-col items-start gap-2 animate-in fade-in slide-in-from-bottom-10 duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
          <div className="flex items-center gap-6">
            <h1 className="text-[10px] uppercase tracking-[0.5em] text-[#FAFAFA] font-medium">{endelState.mode}</h1>
            <div className="w-12 h-[1px] bg-[#525252]" />
            <p className="text-[10px] uppercase tracking-widest text-[#525252]">{primaryGoal || 'Daily Overview'}</p>
          </div>
          <p className="text-3xl md:text-4xl font-light tracking-tighter text-[#FAFAFA] mix-blend-screen leading-tight">
            {endelState.subtitle}
          </p>
          {endelState.mode === 'EVENING' && (
            <p className="text-sm text-[#A3A3A3] italic tracking-wide mt-2">
              "{todayQuote}"
            </p>
          )}
        </header>

        <section className="flex flex-col xl:flex-row gap-12 items-start justify-between w-full">
            <div className="w-full xl:w-2/3">
                <Timetable />
            </div>
            
            <div className="w-full xl:w-1/3 flex justify-center">
                <StreakCalendar />
            </div>
        </section>

      </div>
    </div>
  );
};
