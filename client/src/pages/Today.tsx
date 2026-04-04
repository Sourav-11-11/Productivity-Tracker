import React, { useState, useEffect, useRef } from 'react';

import { useOnboardingStore } from '../store/useOnboardingStore';
import { CheckCircle2, Trash2, Save } from 'lucide-react';
import { db } from '../db/db';

interface PlannedTask {
  id: string;
  title: string;
  time: string;
  category: string;
  details: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
}

export const Today: React.FC = () => {
  const { primaryGoal } = useOnboardingStore();
  
  // Planned tasks state
  const [plannedTasks, setPlannedTasks] = useState<PlannedTask[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const saveNotesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tomorrow planner state
  const [tomorrowTitle, setTomorrowTitle] = useState('');
  const [tomorrowTime, setTomorrowTime] = useState('');
  const [tomorrowCategory, setTomorrowCategory] = useState('Study');
  const [tomorrowDetails, setTomorrowDetails] = useState('');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().split('T')[0];
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0];

  // Load notes on mount
  useEffect(() => {
    const loadNotes = async () => {
      const log = await db.dailyLogs.get(todayStr);
      if (log) {
        setNotes(log.notes);
      }
    };
    loadNotes();
  }, [todayStr]);

  // Load today's planned tasks + auto-migrate from yesterday's tomorrow plan
  useEffect(() => {
    const loadPlannedTasks = async () => {
      const stored = localStorage.getItem(`planned_${todayStr}`);
      if (stored) {
        setPlannedTasks(JSON.parse(stored));
      } else {
        // Check if yesterday's plan exists and migrate it
        const yesterdayPlan = localStorage.getItem(`planned_${yesterdayStr}`);
        if (yesterdayPlan) {
          const tasks = JSON.parse(yesterdayPlan) as PlannedTask[];
          const migratedTasks = tasks.map(t => ({ ...t, date: todayStr, completed: false }));
          setPlannedTasks(migratedTasks);
          localStorage.setItem(`planned_${todayStr}`, JSON.stringify(migratedTasks));
        }
      }
    };
    loadPlannedTasks();
  }, [todayStr, yesterdayStr]);

  // Save notes with debounce
  const handleNotesChange = (value: string) => {
    setNotes(value);
    setIsSavingNotes(true);

    if (saveNotesTimeoutRef.current) {
      clearTimeout(saveNotesTimeoutRef.current);
    }

    saveNotesTimeoutRef.current = setTimeout(async () => {
      try {
        await db.dailyLogs.put({ id: todayStr, date: todayStr, notes: value });
        setIsSavingNotes(false);
      } catch (error) {
        console.error('Failed to save notes:', error);
        setIsSavingNotes(false);
      }
    }, 500);
  };

  // Toggle task completion
  const handleToggleTask = (id: string) => {
    const updated = plannedTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setPlannedTasks(updated);
    localStorage.setItem(`planned_${todayStr}`, JSON.stringify(updated));
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    const updated = plannedTasks.filter(t => t.id !== id);
    setPlannedTasks(updated);
    localStorage.setItem(`planned_${todayStr}`, JSON.stringify(updated));
  };

  // Add tomorrow task
  const handleAddTomorrowTask = () => {
    if (!tomorrowTitle.trim() || !tomorrowTime.trim()) {
      alert('Please fill in title and time');
      return;
    }

    const newTask: PlannedTask = {
      id: Date.now().toString(),
      title: tomorrowTitle,
      time: tomorrowTime,
      category: tomorrowCategory,
      details: tomorrowDetails,
      completed: false,
      date: tomorrowStr,
    };

    const stored = localStorage.getItem(`planned_${tomorrowStr}`);
    const tomorrowTasks = stored ? JSON.parse(stored) : [];
    tomorrowTasks.push(newTask);
    localStorage.setItem(`planned_${tomorrowStr}`, JSON.stringify(tomorrowTasks));

    setTomorrowTitle('');
    setTomorrowTime('');
    setTomorrowCategory('Study');
    setTomorrowDetails('');
    alert('Task added to tomorrow!');
  };

  // Default template for tomorrow
  const defaultTemplate = [
    { time: '6:30 – 7:00', title: '🌅 Wake', category: 'Gym', details: 'Cold shower + warm-up' },
    { time: '7:00 – 8:00', title: '💪 Gym', category: 'Gym', details: '45 min + 10 min shower' },
    { time: '8:00 – 8:45', title: '🥗 Breakfast', category: 'Personal', details: '100g protein. Eggs + oats' },
    { time: '9:00 – 9:30', title: '📋 Plan Day', category: 'Study', details: 'Review goals + priorities' },
    { time: '10:30 – 1:30', title: '🔥 DSA Block 1', category: 'DSA', details: '1.5 hr learning + 1.5 hr problems. Core growth time. Try → Fail → Learn → Retry.' },
    { time: '1:30 – 2:15', title: '🥗 Lunch', category: 'Personal', details: '100g protein. Protein + carbs' },
    { time: '2:15 – 3:15', title: '🎯 Interview Prep', category: 'Placement', details: 'Mock interview or revision' },
    { time: '3:15 – 3:30', title: '☕ Break', category: 'Personal', details: '5 min walk + water' },
    { time: '4:00 – 6:30', title: '🔥 DSA Block 2', category: 'DSA', details: '1.5 hr learning + 1 hr problems' },
    { time: '6:30 – 7:00', title: '🥗 Dinner', category: 'Personal', details: '100g protein' },
    { time: '7:00 – 8:00', title: '📱 Revise / Job Apply', category: 'Placement', details: 'Apply 2-3 new jobs OR revise previous topics' },
    { time: '8:00 – 8:30', title: '🛁 Shower', category: 'Personal', details: 'Relax + wind down' },
    { time: '9:00 – 10:30', title: '📚 Revision', category: 'Study', details: 'Reinforce today\'s learning' },
    { time: '10:30 – 10:45', title: '🌙 Plan Next Day', category: 'Study', details: 'Tomorrow\'s priorities before sleep' },
  ];

  const loadDefaultTemplate = () => {
    const stored = localStorage.getItem(`planned_${tomorrowStr}`);
    if (stored && JSON.parse(stored).length > 0) {
      alert('Tomorrow already has tasks. Clear them first if needed.');
      return;
    }
    const tasksWithIds = defaultTemplate.map((t, i) => ({
      ...t,
      id: `default_${i}_${Date.now()}`,
      completed: false,
      date: tomorrowStr
    }));
    localStorage.setItem(`planned_${tomorrowStr}`, JSON.stringify(tasksWithIds));
    alert('✅ Default schedule loaded for tomorrow!');
  };



  return (
    <div className="min-h-full bg-[#0A0A0A] py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-16">
        
        {/* HEADER */}
        <header className="space-y-1">
          <h1 className="text-xl font-medium text-[#A3A3A3]">Hi Sourav</h1>
          <p className="text-3xl font-semibold text-[#FAFAFA] tracking-tight">Focus: {primaryGoal || 'Not set'}</p>
        </header>

        {/* TODAY'S TASKS - TIMELINE */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#262626] pb-4">
            <h2 className="text-xl font-medium text-[#FAFAFA]">Timeline</h2>
            {plannedTasks.length > 0 && (
              <span className="text-sm text-[#A3A3A3]">
                {plannedTasks.filter(t => t.completed).length} / {plannedTasks.length} Done
              </span>
            )}
          </div>

          {plannedTasks.length > 0 ? (
            <div className="flex flex-col">
              {plannedTasks.map((task) => (
                <div key={task.id} className="group flex flex-col border-b border-[#141414] last:border-0 relative">
                  
                  {/* Row */}
                  <div 
                    onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    className="flex items-center gap-6 py-5 cursor-pointer"
                  >
                    {/* Time (Left) */}
                    <div className="w-28 flex-shrink-0 text-sm tracking-wide text-[#A3A3A3]">
                      {task.time.split('–')[0]?.trim()} <span className="text-[#525252] mx-1">—</span> {task.time.split('–')[1]?.trim()}
                    </div>

                    {/* Task Title (Center) */}
                    <div className="flex-1 min-w-0 pr-4">
                      <p
                        className={`text-lg font-medium transition-all duration-500 ease-in-out ${
                          task.completed
                            ? 'text-[#525252] line-through'
                            : 'text-[#FAFAFA]'
                        }`}
                      >
                        {task.title}
                      </p>
                    </div>

                    {/* Actions (Right) */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[#525252] hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTask(task.id);
                        }}
                        className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-500 ease-in-out border ${
                          task.completed
                            ? 'bg-[#FAFAFA] border-[#FAFAFA] text-[#0A0A0A]'
                            : 'bg-transparent border-[#525252] hover:border-[#A3A3A3] text-transparent'
                        }`}
                      >
                        <CheckCircle2 className={`w-4 h-4 transition-opacity duration-300 ${task.completed ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      expandedTaskId === task.id ? 'max-h-[500px] opacity-100 pb-5' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="ml-[136px] pr-12 text-sm text-[#A3A3A3] space-y-2">
                       {task.category && <span className="inline-block px-2 py-1 bg-[#141414] text-[#A3A3A3] text-xs rounded mb-2">{task.category}</span>}
                       <p className="leading-relaxed whitespace-pre-wrap">{task.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-[#525252] text-sm">
              <p>No tasks planned for today. Formulate your schedule below.</p>
            </div>
          )}
        </section>

        {/* NOTES SECTION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#262626] pb-4">
            <h2 className="text-xl font-medium text-[#FAFAFA]">Reflections</h2>
            {isSavingNotes && (
              <span className="text-xs text-[#525252] animate-pulse">Saving...</span>
            )}
            {!isSavingNotes && notes && (
              <span className="text-xs text-[#A3A3A3] flex items-center gap-1">
                <Save className="w-3 h-3" /> Saved
              </span>
            )}
          </div>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Write down your thoughts, progress, and reflections..."
            className="w-full bg-transparent border-none text-lg text-[#FAFAFA] placeholder-[#525252] focus:outline-none focus:ring-0 resize-none min-h-[150px] leading-relaxed"
          />
        </section>

        {/* DAILY TARGETS (Minimalized) */}
        <section className="space-y-6">
          <h3 className="text-xl font-medium text-[#FAFAFA] border-b border-[#262626] pb-4">Daily Check-ins</h3>
          <div className="flex flex-col gap-4">
            {['🧠 DSA Problems (4-6)', '🥗 Protein (100–120g)', '💪 Gym', '🍌 Protein Shake', '💼 Job Apply'].map(target => (
               <div key={target} className="flex justify-between items-center text-[#A3A3A3]">
                 <span className="text-base">{target}</span>
                 <input type="checkbox" className="w-5 h-5 rounded border-[#262626] bg-[#141414] text-[#FAFAFA] focus:ring-0 cursor-pointer outline-none checked:bg-[#FAFAFA]" />
               </div>
            ))}
          </div>
        </section>

        {/* PLAN TOMORROW SECTION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#262626] pb-4">
             <h2 className="text-xl font-medium text-[#FAFAFA]">Plan Tomorrow</h2>
             <button
                onClick={loadDefaultTemplate}
                className="text-sm text-[#3B82F6] hover:text-blue-400 transition-colors"
                title="Load Default Schedule"
              >
                Load Default
              </button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Time (e.g., 10:30 – 1:30)"
                value={tomorrowTime}
                onChange={(e) => setTomorrowTime(e.target.value)}
                className="w-1/3 px-4 py-3 bg-[#141414] border border-[#262626] focus:border-[#525252] rounded text-[#FAFAFA] placeholder-[#525252] outline-none text-sm transition-colors"
              />
              <input
                type="text"
                placeholder="Task title (e.g., 🔥 DSA Block 1)"
                value={tomorrowTitle}
                onChange={(e) => setTomorrowTitle(e.target.value)}
                className="w-2/3 px-4 py-3 bg-[#141414] border border-[#262626] focus:border-[#525252] rounded text-[#FAFAFA] placeholder-[#525252] outline-none text-sm transition-colors"
              />
            </div>

            <div className="flex gap-4">
              <select
                value={tomorrowCategory}
                onChange={(e) => setTomorrowCategory(e.target.value)}
                className="w-1/3 px-4 py-3 bg-[#141414] border border-[#262626] focus:border-[#525252] rounded text-[#FAFAFA] outline-none text-sm cursor-pointer transition-colors"
              >
                <option>Study</option>
                <option>DSA</option>
                <option>Placement</option>
                <option>Gym</option>
                <option>Personal</option>
              </select>
              <textarea
                placeholder="Full details, meaning, rules..."
                value={tomorrowDetails}
                onChange={(e) => setTomorrowDetails(e.target.value)}
                className="w-2/3 px-4 py-3 bg-[#141414] border border-[#262626] focus:border-[#525252] rounded text-[#FAFAFA] placeholder-[#525252] outline-none resize-none min-h-[46px] text-sm transition-colors overflow-hidden"
              />
            </div>

            <button
              onClick={handleAddTomorrowTask}
              className="w-full py-4 text-sm font-medium text-[#FAFAFA] bg-[#262626] hover:bg-[#404040] rounded transition-colors flex justify-center items-center gap-2"
            >
              Add to Tomorrow
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};
