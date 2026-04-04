import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useJobStore } from '../store/useJobStore';
import { CheckCircle, Plus } from 'lucide-react';
import { QuickTaskModal } from './QuickTaskModal';

interface MainLayoutProps {
  children: React.ReactNode;
  activeRoute?: string;
  onNavigate?: (route: string) => void;
}

const NAV_ITEMS = [
  { name: 'Today', id: 'today', icon: '📅' },
  { name: 'Progress', id: 'progress', icon: '📈' },
  { name: 'Jobs', id: 'jobs', icon: '💼' },
  { name: 'Notes', id: 'notes', icon: '📝' },
  { name: 'Insights', id: 'dashboard', icon: '✨' },
];

export const MainLayout: React.FC<MainLayoutProps> = ({ children, activeRoute = 'home', onNavigate }) => {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const { tasks } = useStore();
  const { jobs } = useJobStore();

  // Calculate streak (consecutive days with tasks completed from Today page)
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
          } else {
            break;
          }
        } catch (e) {
          break;
        }
      } else {
        break;
      }
    }
    return streak;
  };

  // Calculate real-time stats from Today page's PlannedTasks
  const getTodayStats = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const storedTasks = localStorage.getItem(`planned_${todayStr}`);
    
    if (!storedTasks) {
      return { completed: 0, total: 0, rate: 0 };
    }
    
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
  const completedToday = todayStats.completed;
  const totalTasks = todayStats.total;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedToday / totalTasks) * 100);
  const streak = calculateStreak();
  const focusHours = Math.floor(tasks.reduce((acc, t) => acc + (t.completed ? (t.duration || 0) : 0), 0) / 60);
  const focusMinutes = tasks.reduce((acc, t) => acc + (t.completed ? (t.duration || 0) : 0), 0) % 60;
  const jobsInProgress = jobs.filter(j => j.status === 'Applied' || j.status === 'OA').length;
  const todaysTasks = tasks.filter(t => !t.completed).slice(0, 5);

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-100 overflow-hidden font-sans">
      {/* Left Sidebar Fixed Width */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-blue-500">⚡</span> Productivity
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate && onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                activeRoute === item.id
                  ? 'bg-blue-600/10 text-blue-400 shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 mt-auto">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 rounded-lg transition-colors">
            <span className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-sm border border-gray-700">
              👤
            </span>
            <span className="font-medium">User Profile</span>
          </button>
        </div>
      </aside>

      {/* Center Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-950">
        {/* Top Bar */}
        <header className="h-16 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm flex items-center justify-between px-8 flex-shrink-0 z-10 sticky top-0">
          <div className="text-sm font-medium text-gray-400">
            {currentDate}
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
              <span className="text-orange-400">🔥</span>
              <span className="font-semibold text-orange-200">{streak} Day {streak === 1 ? 'Streak' : 'Streak'}</span>
            </div>
            <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
              <span className="text-green-400">⚡</span>
              <span className="font-semibold text-green-200">{completionRate}% Consistency</span>
            </div>
            <button
              onClick={() => setIsQuickTaskOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-medium text-sm border border-blue-500/30 shadow-lg shadow-blue-500/10"
              title="Quick Add Task"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
            <button
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className="p-2 ml-2 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors border border-transparent hover:border-gray-700 focus:outline-none"
              aria-label="Toggle Insights Panel"
              title="Toggle Insights Panel"
            >
              {isRightPanelOpen ? '▶️' : '◀️'}
            </button>
          </div>
        </header>

        {/* Scrollable Area for Children */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </div>
      </main>

      {/* Right Insights Panel (Collapsible) */}
      <aside
        className={`bg-gray-900 border-l border-gray-800 flex flex-col transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${
          isRightPanelOpen ? 'w-[320px] opacity-100' : 'w-0 opacity-0 border-l-0'
        }`}
      >
        <div className="p-6 flex flex-col gap-4 w-[320px] overflow-y-auto">
          <h2 className="text-lg font-semibold tracking-tight text-white">Today's Overview</h2>
          
          {/* Progress Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-blue-400">Progress</h3>
              <span className="text-2xl font-bold text-blue-300">{completionRate}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              {completedToday} of {totalTasks} tasks completed today
            </p>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-green-400 mb-4">📊 Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Focus Hours</span>
                <span className="font-medium text-gray-200 bg-gray-800/80 px-2.5 py-1 rounded text-xs">
                  {focusHours}h {focusMinutes}m
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">In Progress</span>
                <span className="font-medium text-gray-200 bg-gray-800/80 px-2.5 py-1 rounded text-xs">
                  {jobsInProgress} jobs
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Total Jobs</span>
                <span className="font-medium text-gray-200 bg-gray-800/80 px-2.5 py-1 rounded text-xs">
                  {jobs.length} apps
                </span>
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          {todaysTasks.length > 0 && (
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-amber-400 mb-4">📋 Pending Tasks</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {todaysTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-2 text-xs">
                    <span className="text-gray-600 mt-0.5">→</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-300 truncate font-medium">{task.title}</p>
                      <p className="text-gray-500 text-xs">{task.duration || 30}m • {task.category}</p>
                    </div>
                  </div>
                ))}
              </div>
              {todaysTasks.length > 5 && (
                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700">
                  +{todaysTasks.length - 5} more tasks
                </p>
              )}
            </div>
          )}

          {/* Empty State */}
          {todaysTasks.length === 0 && totalTasks > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 shadow-sm text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-green-300">All Done! 🎉</p>
              <p className="text-xs text-green-400 mt-1">No pending tasks for today</p>
            </div>
          )}

          {/* Motivation Card */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 shadow-sm mt-auto">
            <p className="text-xs text-purple-300 font-medium">💡 Tip of the Day</p>
            <p className="text-xs text-gray-400 mt-2">
              Focus on your top 3 priorities today. It's better to complete 3 important tasks than to rush through 10.
            </p>
          </div>
        </div>
      </aside>

      {/* Quick Task Modal */}
      <QuickTaskModal isOpen={isQuickTaskOpen} onClose={() => setIsQuickTaskOpen(false)} />
    </div>
  );
};
