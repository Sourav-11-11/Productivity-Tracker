import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Maximize2, Minimize2 } from 'lucide-react';
import { QuickTaskModal } from './QuickTaskModal';
import { Clock } from './Clock';
import { PomodoroTimer } from './PomodoroTimer';
import { useEndelState } from '../hooks/useEndelState';

interface MainLayoutProps {
  children: React.ReactNode;
  activeRoute?: string;
  onNavigate?: (route: string) => void;
}

const NAV_ITEMS = [
  { name: 'Today', id: 'today' },
  { name: 'Progress', id: 'progress' },
  { name: 'Jobs', id: 'jobs' },
  { name: 'Notes', id: 'notes' },
  { name: 'Accounts', id: 'accounts' }
];

export const MainLayout: React.FC<MainLayoutProps> = ({ children, activeRoute = 'today', onNavigate }) => {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const { tasks } = useStore();
  const endelState = useEndelState();

  const calculateStreak = () => {
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const storedTasks = localStorage.getItem(`planned_${dateStr}`);
      
      if (storedTasks) {
        try {
           const tasksForDay = JSON.parse(storedTasks);
           const completedTasks = tasksForDay.filter((t: any) => t.completed);
           if (completedTasks.length > 0) {
             streak++;
             currentDate.setDate(currentDate.getDate() - 1);
           } else break;
        } catch (e) { break; }
      } else break;
    }
    return streak;
  };

  const getTodayStats = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const storedTasks = localStorage.getItem(`planned_${todayStr}`);
    if (!storedTasks) return { completed: 0, total: 0, rate: 0 };
    try {
      const tasksForDay = JSON.parse(storedTasks);
      const completed = tasksForDay.filter((t: any) => t.completed).length;
      const total = tasksForDay.length;
      const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
      return { completed, total, rate };
    } catch (e) {
      return { completed: 0, total: 0, rate: 0 };
    }
  };

  const todayStats = getTodayStats();
  const completionRate = todayStats.rate;
  const streak = calculateStreak();
  const focusHours = Math.floor(tasks.reduce((acc, t) => acc + (t.completed ? (t.duration || 0) : 0), 0) / 60);
  const focusMinutes = tasks.reduce((acc, t) => acc + (t.completed ? (t.duration || 0) : 0), 0) % 60;
  const todaysTasks = tasks.filter(t => !t.completed).slice(0, 5);

  return (
    <div className="flex h-screen w-full bg-[#0A0A0A] text-[#FAFAFA] overflow-hidden font-sans selection:bg-[#FAFAFA] selection:text-[#0A0A0A] transition-colors duration-1000">
      
      {/* Abstract Animated Glows Behind Layout */}
      <div className={`absolute top-0 left-1/4 w-[80vw] h-[80vh] bg-gradient-to-br ${endelState.gradientClass} rounded-full blur-[150px] -z-10 ${endelState.animationClass} pointer-events-none mix-blend-screen transition-all duration-[5000ms] ease-in-out`} style={{ animationDuration: '15s' }} />

      {/* Extreme Minimal Sidebar */}
      <aside className="w-56 flex flex-col flex-shrink-0 z-10 border-r border-[#141414]/50 bg-[#0A0A0A]">
        <div className="p-8 pb-4">
          <Clock />
        </div>
        
        <nav className="flex-1 px-8 space-y-4 mt-8">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate && onNavigate(item.id)}
              className={`w-full text-left flex items-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] text-sm tracking-widest uppercase ${
                activeRoute === item.id
                  ? 'text-[#FAFAFA] font-medium opacity-100 translate-x-2'
                  : 'text-[#525252] hover:text-[#A3A3A3] opacity-60 hover:opacity-100 hover:translate-x-1'
              }`}
            >
              {activeRoute === item.id && <span className="w-1.5 h-1.5 bg-[#FAFAFA] rounded-full mr-4 absolute -left-0 shadow-[0_0_10px_#FAFAFA]" />}
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-8 mt-auto flex items-center justify-between">
          <button
            onClick={() => setIsQuickTaskOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-[#262626] text-[#A3A3A3] hover:text-[#FAFAFA] hover:border-[#FAFAFA] hover:shadow-[0_0_15px_rgba(250,250,250,0.3)] transition-all duration-500 group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
          </button>
          <div className="text-[10px] text-[#525252] tracking-widest uppercase">Profile</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent z-10 relative">
        <header className="h-24 flex items-center justify-end px-10 flex-shrink-0 bg-transparent relative z-20">
          <button
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className="text-[#525252] hover:text-[#FAFAFA] transition-colors p-2"
          >
            {isRightPanelOpen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-10 relative scrollbar-hide pb-20">
          {children}
        </div>
      </main>

      {/* Immaterial Right Insights Panel */}
      <aside
        className={`flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex-shrink-0 z-10 bg-[#0A0A0A]/50 backdrop-blur-2xl border-l border-[#141414]/50 ${
          isRightPanelOpen ? 'w-[360px] opacity-100' : 'w-0 opacity-0 border-l-0'
        }`}
      >
        <div className="p-10 flex flex-col gap-12 w-[360px] overflow-y-auto scrollbar-hide h-full">
          
          <div className="space-y-6">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-[#525252]">Real-Time Sync</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm font-light text-[#A3A3A3]">Momentum</span>
                <span className="text-3xl font-light tracking-tighter text-[#FAFAFA]">{completionRate}%</span>
              </div>
              <div className="w-full h-[1px] bg-[#141414] overflow-hidden">
                <div 
                  className="h-full bg-[#FAFAFA] shadow-[0_0_10px_#FAFAFA] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-[#525252]">Active States</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#525252] mb-1">Streak</p>
                <p className="text-2xl font-light text-[#FAFAFA] tabular-nums">{streak}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#525252] mb-1">Focus</p>
                <p className="text-2xl font-light text-[#FAFAFA] tabular-nums">{focusHours}<span className="text-sm text-[#525252]">h</span> {focusMinutes}<span className="text-sm text-[#525252]">m</span></p>
              </div>
            </div>
          </div>

          {todaysTasks.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-[#525252]">Pending Energy</h2>
              <div className="space-y-4">
                {todaysTasks.map((task, i) => (
                  <div key={task.id} className="flex items-center gap-4 group" style={{ transitionDelay: `${i * 100}ms` }}>
                    <div className="w-1 h-1 rounded-full bg-[#262626] group-hover:bg-[#FAFAFA] transition-colors" />
                    <p className="text-sm font-light text-[#A3A3A3] group-hover:text-[#FAFAFA] transition-colors truncate">
                      {task.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto space-y-6">
             <p className="text-[10px] uppercase tracking-[0.2em] text-[#525252] leading-loose">
               {endelState.subtitle}
             </p>
          </div>
          
        </div>
      </aside>

      <QuickTaskModal isOpen={isQuickTaskOpen} onClose={() => setIsQuickTaskOpen(false)} />
      <PomodoroTimer />
    </div>
  );
};
