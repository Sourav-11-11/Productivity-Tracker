import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Plus, RefreshCw, X, Maximize2 } from 'lucide-react';

const INITIAL_SCHEDULE = [  { id: '1', duration: 15, activity: 'Wake up', what: 'Freshen up', details: 'Hydrate', isFixed: true, fixedStart: 390 },  { id: '2', duration: 15, activity: 'Pre-workout', what: 'Banana (optional)', details: 'Light energy' },  { id: '3', duration: 75, activity: 'Gym', what: 'Workout', details: 'Follow your split' },  { id: '4', duration: 30, activity: 'Breakfast', what: 'Protein meal', details: 'Core nutrition', isFixed: true, fixedStart: 495 },  { id: '5', duration: 60, activity: 'Light Work', what: 'Emails / review', details: 'Low stress' },  { id: '6', duration: 20, activity: 'Shake', what: 'Nutrition', details: 'Calories' },  { id: '7', duration: 180, activity: 'Deep Work 1', what: 'Core learning', details: 'No distractions' },  { id: '8', duration: 30, activity: 'Lunch', what: 'Main meal', details: 'Protein', isFixed: true, fixedStart: 785 },  { id: '9', duration: 90, activity: 'Rest', what: 'Nap / relax', details: 'Recovery', isFixed: true, fixedStart: 815 },  { id: '10', duration: 30, activity: 'Reset', what: 'Light snack', details: 'Prepare' },  { id: '11', duration: 150, activity: 'Deep Work 2', what: 'Revision', details: 'Reinforce' },  { id: '12', duration: 30, activity: 'Break', what: 'Relax', details: 'Energy' },  { id: '13', duration: 60, activity: 'Light Study', what: 'Notes', details: 'No heavy thinking' },  { id: '14', duration: 30, activity: 'Dinner', what: 'Meal', details: 'Protein', isFixed: true, fixedStart: 1175 },  { id: '15', duration: 30, activity: 'Plan & Track', what: 'Review day', details: 'Track' },  { id: '16', duration: 45, activity: 'Chill', what: 'Relax', details: 'No stress' },  { id: '17', duration: 480, activity: 'Sleep', what: 'Sleep', details: 'Recovery', isFixed: true, fixedStart: 1280 },];

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m.toString().padStart(2, '0');
  const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
  return `${displayH}:${displayM} ${ampm}`;
}

const SortableRow = ({ item, startTime, isCompleted, isNext, onToggle, onDelete, onUpdate, setFocusMode }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editData, setEditData] = useState({ activity: item.activity, duration: item.duration, what: item.what, details: item.details });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const timeDisplay = formatTime(startTime);
  const endDisplay = item.duration ? formatTime(startTime + item.duration) : '';

  const handleSave = (e: any) => {
      e.stopPropagation();
      onUpdate(item.id, editData);
      setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div style={style} className="border-l-[3px] border-transparent py-4 px-2 my-1">
        <div className="flex flex-col gap-3 max-w-2xl ml-20 md:ml-24">
          <div className="flex items-center gap-3">
            <input type="text" placeholder="Activity" value={editData.activity} onChange={e => setEditData({...editData, activity: e.target.value})} className="bg-transparent border-b border-[#262626] px-0 py-2 text-[#FAFAFA] text-lg w-full focus:outline-none focus:border-[#525252] transition-colors" />
            <div className="flex items-center gap-2">
              <input type="number" value={editData.duration} onChange={e => setEditData({...editData, duration: Number(e.target.value)})} className="bg-transparent border-b border-[#262626] px-0 py-2 text-[#FAFAFA] text-sm w-16 focus:outline-none focus:border-[#525252] text-center" />
              <span className="text-[#525252] text-xs font-mono">MIN</span>
            </div>
          </div>
          <input type="text" placeholder="What to do" value={editData.what} onChange={e => setEditData({...editData, what: e.target.value})} className="bg-transparent border-b border-[#262626] px-0 py-2 text-[#A3A3A3] text-sm w-full focus:outline-none focus:border-[#525252]" />
          <input type="text" placeholder="Details" value={editData.details} onChange={e => setEditData({...editData, details: e.target.value})} className="bg-transparent border-b border-[#262626] px-0 py-2 text-[#525252] text-sm w-full focus:outline-none focus:border-[#525252]" />
          <div className="flex justify-end gap-4 mt-2">
            <button onClick={(e: any) => {e.stopPropagation(); setIsEditing(false)}} className="text-[10px] uppercase tracking-widest text-[#525252] hover:text-[#FAFAFA] transition-colors">Cancel</button>
            <button onClick={handleSave} className="text-[10px] uppercase tracking-widest text-[#FAFAFA] hover:text-white transition-colors">Save</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
        ref={setNodeRef}
        style={style}
        className={`group relative flex flex-col w-full py-4 transition-all duration-500 ease-out border-l-[3px] ${isDragging ? 'opacity-30' : 'opacity-100'} ${isCompleted ? 'opacity-40 border-transparent' : isNext ? 'border-[#FAFAFA] bg-[#141414]/20' : 'border-transparent hover:bg-[#141414]/30'} cursor-default`}
        onClick={() => !isDragging && setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between px-4 sm:px-6">
        {/* Time - Left */}
        <div className="w-20 md:w-24 flex flex-col shrink-0">
            <span {...attributes} {...listeners} className={`text-xs font-mono tracking-widest cursor-grab active:cursor-grabbing ${isCompleted ? 'text-[#3B3B3B]' : isNext ? 'text-[#FAFAFA]' : 'text-[#525252] group-hover:text-[#A3A3A3]'} transition-colors`}>
                {timeDisplay}
            </span>
        </div>
        
        {/* Title - Center */}
        <div className="flex-1 flex items-center justify-between min-w-0 pr-4">
            <div className="flex items-center gap-3 truncate">
                <span className={`text-[16px] truncate transition-colors duration-300 ${isCompleted ? 'line-through text-[#525252]' : isNext ? 'text-[#FAFAFA] font-medium' : 'text-[#A3A3A3] group-hover:text-[#FAFAFA]'}`}>
                    {item.activity}
                </span>
                {item.what && !isExpanded && (
                    <span className={`text-[11px] truncate hidden sm:inline-block ml-4 transition-colors ${isCompleted ? 'text-[#262626]' : 'text-[#525252] group-hover:text-[#808080]'}`}>
                        {item.what}
                    </span>
                )}
            </div>

            <button 
                onClick={(e: any) => { e.stopPropagation(); setFocusMode(item); }}
                className={`opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[#525252] hover:text-[#FAFAFA] ${isExpanded ? 'hidden' : 'block'} focus:outline-none`}
                title="Focus Mode"
            >
                <Maximize2 size={14} />
            </button>
        </div>

        {/* Checkbox - Right */}
        <div className="w-8 flex justify-end shrink-0">
            <button onClick={(e) => {e.stopPropagation(); onToggle(item.id)}} className="outline-none focus:outline-none flex items-center justify-center p-1">
                <div className={`w-[18px] h-[18px] rounded-full border transition-all duration-300 flex items-center justify-center ${isCompleted ? 'border-[#262626] bg-[#262626]' : isNext ? 'border-[#A3A3A3] hover:border-[#FAFAFA]' : 'border-[#262626] group-hover:border-[#525252]'}`}>
                    {isCompleted && <Check size={10} className="text-[#0A0A0A]" />}
                </div>
            </button>
        </div>
      </div>

      {/* Expanded Inline Details */}
      <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          <div className="pl-[88px] sm:pl-[120px] pr-6 flex flex-col gap-3 pb-2 cursor-auto" onClick={(e: any) => e.stopPropagation()}>
             {item.what && (
                 <div>
                     <span className="text-[10px] uppercase tracking-widest text-[#525252] block mb-1">Task</span>
                     <p className="text-sm text-[#A3A3A3] leading-relaxed">{item.what}</p>
                 </div>
             )}
             {item.details && (
                 <div className="mt-1">
                     <span className="text-[10px] uppercase tracking-widest text-[#525252] block mb-1">Details</span>
                     <p className="text-xs text-[#525252] leading-relaxed">{item.details}</p>
                 </div>
             )}
             
             <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#141414]">
                 <button onClick={() => setFocusMode(item)} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#FAFAFA] hover:text-white transition-colors">
                     <Maximize2 size={12} /> Focus
                 </button>
                 <button onClick={() => {setIsEditing(true); setIsExpanded(false);}} className="text-[10px] uppercase tracking-widest text-[#525252] hover:text-[#A3A3A3] transition-colors">Edit</button>
                 <button onClick={() => onDelete(item.id)} className="text-[10px] uppercase tracking-widest text-[#525252] hover:text-[#A3A3A3] transition-colors">Delete</button>
                 
                 <span className="ml-auto text-[10px] font-mono tracking-widest text-[#525252]">
                     {item.duration} MIN &bull; {timeDisplay} - {endDisplay}
                 </span>
             </div>
          </div>
      </div>
    </div>
  );
};

export const Timetable = () => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('daily_timetable_v2');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
  });
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [completions, setCompletions] = useState<Record<string, boolean>>(() => {
    const savedComps = localStorage.getItem(`timetable_comps_${todayStr}`);
    return savedComps ? JSON.parse(savedComps) : {};
  });

  const [wakeTime, setWakeTime] = useState(6 * 60 + 30);
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState<{ duration: number, activity: string, what: string, details: string }>({ duration: 30, activity: '', what: '', details: '' });
  const [focusTask, setFocusTask] = useState<any>(null);
  
  const [timerLeft, setTimerLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [dsaCategory, setDsaCategory] = useState<string>('Arrays & Hashing');
  const [dsaProblems, setDsaProblems] = useState<number>(0);
  const [dsaProgress, setDsaProgress] = useState<any>({});

  useEffect(() => {
    localStorage.setItem('daily_timetable_v2', JSON.stringify(items));
    
    try {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('timetable_comps_')) {
          const dateStr = key.replace('timetable_comps_', '');
          const dateTime = new Date(dateStr).getTime();
          if (now - dateTime > thirtyDaysMs) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch(e) { }
  }, [items]);

  const handleOpenFocusMode = (t: any) => {
      setTimerLeft(t.duration * 60);
      setIsTimerRunning(false);
      setFocusTask(t);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      setItems((items: any) => {
        const oldIndex = items.findIndex((i: any) => i.id === active.id);
        const newIndex = items.findIndex((i: any) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleToggle = (id: string) => {
      const updatedComps = { ...completions, [id]: !completions[id] };
      setCompletions(updatedComps);
      localStorage.setItem(`timetable_comps_${todayStr}`, JSON.stringify(updatedComps));
      updateStreak(updatedComps);
  };

  const handleSyncToPresent = () => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    let t = wakeTime;
    const evaluated = items.map((i: any) => {
      if (i.isFixed && i.fixedStart !== undefined) {
          t = Math.max(t, i.fixedStart);
      }
      const end = t + i.duration;
      let status;
      if (completions[i.id]) {
          status = 'COMPLETED';
      } else if (i.isFixed) {
          status = 'PLANNED';
      } else {
          status = end < currentMins ? 'DUE' : 'PLANNED';
      }
      t = end;
      return { ...i, _status: status };
    });

    const planned = evaluated.filter((i: any) => i._status === 'PLANNED');
    const completed = evaluated.filter((i: any) => i._status === 'COMPLETED');
    const due = evaluated.filter((i: any) => i._status === 'DUE');

    const newItems = [...planned, ...completed, ...due].map(i => {
       const clone = {...i};
       delete clone._status;
       return clone;
    });

    setItems(newItems);
    setWakeTime(currentMins);
  };

  const handleDelete = (id: string) => setItems((prev: any) => prev.filter((i: any) => i.id !== id));
  const handleUpdate = (id: string, updates: any) => setItems((prev: any) => prev.map((i: any) => i.id === id ? { ...i, ...updates } : i));

  const handleAddTask = () => {
      if (!newTask.activity) return;
      const t = { ...newTask, id: Date.now().toString(), duration: Number(newTask.duration) || 30 };
      setItems((prev: any) => [...prev, t]);
      setIsAdding(false);
      setNewTask({ duration: 30, activity: '', what: '', details: '' });
  };

  const updateStreak = (currentComps: Record<string, boolean>) => {
      const streakData = JSON.parse(localStorage.getItem('streak_history') || '[]');
      const hasAnyComplete = Object.values(currentComps).some(v => v);

      if (hasAnyComplete && !streakData.includes(todayStr)) {
          streakData.push(todayStr);
      } else if (!hasAnyComplete && streakData.includes(todayStr)) {
          streakData.splice(streakData.indexOf(todayStr), 1);
      }
      localStorage.setItem('streak_history', JSON.stringify(streakData));
      window.dispatchEvent(new Event('streak_updated'));
  };

  let currentTime = wakeTime;
  const completedCount = Object.values(completions).filter(Boolean).length;
  const totalCount = items.length;
  const completionPercentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  
  let endOfDayMessage = completionPercentage < 50 ? "Keep going" : completionPercentage < 80 ? "Good progress" : completionPercentage < 100 ? "Almost done" : "Perfect day";

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape' && focusTask) {
              setFocusTask(null);
          }
      };
      if (focusTask) window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusTask]);

  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem('dsa_progress');
      if (savedProgress) setDsaProgress(JSON.parse(savedProgress));
    } catch(e) {}
  }, []);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerLeft !== null && timerLeft > 0) {
      interval = setInterval(() => {
        setTimerLeft(prev => prev !== null ? prev - 1 : 0);
      }, 1000);
    } else if (timerLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerLeft]);

  return (
    <div className="w-full max-w-4xl mx-auto pb-32">
      {/* Real-Time Progress System */}
      <div className="mb-14">
          <div className="flex items-center justify-between mb-4">
             <div className="text-[#FAFAFA] text-[10px] tracking-[0.2em] uppercase font-medium">
                 Progress
             </div>
             <div className="text-[#A3A3A3] text-[10px] tracking-[0.2em] uppercase flex gap-4">
                 <span>{completionPercentage}%</span>
                 <span>{endOfDayMessage}</span>
             </div>
          </div>
          <div className="h-[1px] w-full bg-[#141414] overflow-hidden">
              <div className="h-full bg-[#FAFAFA] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ width: `${completionPercentage}%` }} />
          </div>
      </div>

      {/* Daily Setup Controls */}
      <div className="flex items-center justify-between mb-8 opacity-50 hover:opacity-100 transition-opacity">
          <div className="flex gap-8"><button onClick={handleSyncToPresent} className="text-[10px] uppercase tracking-widest text-[#525252] hover:text-[#FAFAFA] flex items-center gap-2 transition-colors focus:outline-none"><RefreshCw size={12} /> Sync to Now</button><button onClick={() => { if(window.confirm('Reset timetable to original schedule?')) { localStorage.removeItem('daily_timetable_v2'); localStorage.removeItem('timetable_comps_' + todayStr); window.location.reload(); } }} className="text-[10px] uppercase tracking-widest text-[#525252] hover:text-red-500/80 transition-colors focus:outline-none">Reset Board</button></div>
          <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest text-[#525252]">Start</span>
              <input 
                  type="time" 
                  className="bg-transparent text-[#A3A3A3] text-sm font-mono focus:outline-none focus:text-[#FAFAFA] transition-colors"
                  value={`${String(Math.floor(wakeTime / 60)).padStart(2, '0')}:${String(wakeTime % 60).padStart(2, '0')}`}
                  onChange={(e) => {
                      const [h, m] = e.target.value.split(':');
                      setWakeTime(parseInt(h) * 60 + parseInt(m));
                  }}
              />
          </div>
      </div>

      {/* Timeline Layout */}
      <div className="flex flex-col gap-0">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {(() => {
              let isFirstPendingFound = false;
              return items.map((item: any) => {
                const isCompleted = completions[item.id] || false;
                let isNextTask = false;
                if (!isCompleted && !isFirstPendingFound) {
                    isNextTask = true;
                    isFirstPendingFound = true;
                }
              if (item.isFixed && item.fixedStart !== undefined) {
                  currentTime = Math.max(currentTime, item.fixedStart);
              }
              const startTime = currentTime;
              currentTime += item.duration;
              return <SortableRow
                        key={item.id}
                        item={item}
                        startTime={startTime}
                        isCompleted={isCompleted}
                        isNext={isNextTask}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                        setFocusMode={handleOpenFocusMode}
                    />;
            });
            })()}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add Task Input */}
      <div className="mt-12 pl-4 sm:pl-6 border-t border-[#141414] pt-8">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="py-4 flex items-center gap-4 text-[10px] uppercase tracking-widest text-[#525252] hover:text-[#A3A3A3] transition-colors focus:outline-none"
          >
            <Plus size={14} /> Add Block
          </button>
        ) : (
          <div className="py-4 pr-6 animate-in fade-in slide-in-from-bottom-2">
             <div className="flex flex-col gap-4 max-w-2xl">
               <div className="flex items-center gap-4">
                 <input
                   type="text"
                   placeholder="Activity title"
                   className="bg-transparent border-b border-[#262626] px-0 py-2 text-[#FAFAFA] text-lg focus:outline-none focus:border-[#525252] flex-1 w-full"
                   value={newTask.activity}
                   onChange={(e) => setNewTask({ ...newTask, activity: e.target.value })}
                   autoFocus
                 />
                 <div className="flex items-center gap-2">
                     <input
                       type="number"
                       placeholder="30"
                       className="bg-transparent border-b border-[#262626] px-0 py-2 text-[#FAFAFA] text-sm focus:outline-none focus:border-[#525252] w-12 text-center"
                       value={newTask.duration || ''}
                       onChange={(e) => setNewTask({ ...newTask, duration: Number(e.target.value) })}
                     />
                     <span className="text-[10px] text-[#525252] font-mono tracking-widest">MIN</span>
                 </div>
               </div>
               <input
                 type="text"
                 placeholder="What to do"
                 className="bg-transparent border-b border-[#262626] px-0 py-2 text-[#A3A3A3] text-sm focus:outline-none focus:border-[#525252] w-full"
                 value={newTask.what}
                 onChange={(e) => setNewTask({ ...newTask, what: e.target.value })}
               />
               <input
                 type="text"
                 placeholder="Additional details"
                 className="bg-transparent border-b border-[#262626] px-0 py-2 text-[#525252] text-sm focus:outline-none focus:border-[#525252] w-full"
                 value={newTask.details}
                 onChange={(e) => setNewTask({ ...newTask, details: e.target.value })}
               />
               <div className="flex justify-end gap-6 mt-4">
                 <button
                   onClick={() => setIsAdding(false)}
                   className="text-[10px] uppercase tracking-widest text-[#525252] hover:text-[#FAFAFA] transition-colors focus:outline-none"
                 >
                   Cancel
                 </button>
                 <button
                   disabled={!newTask.activity}
                   onClick={handleAddTask}
                   className="text-[10px] uppercase tracking-widest text-[#FAFAFA] hover:text-white disabled:opacity-30 transition-colors focus:outline-none"
                 >
                   Add Block
                 </button>
               </div>
             </div>
          </div>
        )}
      </div>

      {/* FOCUS MODE FULLSCREEN OVERLAY */}
      {focusTask && (() => {
         const t = focusTask;
         return (
         <div 
             className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/95 backdrop-blur-sm animate-in fade-in duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-y-auto py-12"
             onClick={() => setFocusTask(null)}
         >
             <div 
                 className="max-w-2xl w-full mx-auto my-auto flex flex-col items-center text-center animate-in zoom-in-95 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                 onClick={(e: any) => e.stopPropagation()}
             >
                 <div className="text-[#525252] text-[10px] font-mono tracking-[0.3em] mb-4">
                     {t.duration} MIN BLOCK
                 </div>
                 
                 <h1 className="text-3xl md:text-5xl font-sans tracking-tight text-[#FAFAFA] mb-6 font-light mix-blend-screen leading-tight">
                     {t.activity}
                 </h1>
                 
                 {t.what && (
                     <p className="text-base md:text-lg text-[#A3A3A3] font-light max-w-lg mb-4 leading-relaxed">
                         {t.what}
                     </p>
                 )}
                 
                 {t.details && (
                     <p className="text-sm text-[#525252] max-w-md leading-relaxed my-2">
                         {t.details}
                     </p>
                 )}
                 
                 {/* Universal Focus Timer for any block */}
                 <div className="flex flex-col items-center gap-4 mt-6">
                     <div className="text-5xl md:text-7xl font-mono text-[#FAFAFA] font-light tracking-widest leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                         {timerLeft !== null ? `${String(Math.floor(timerLeft / 60)).padStart(2, '0')}:${String(timerLeft % 60).padStart(2, '0')}` : '00:00'}
                     </div>
                     <div className="flex gap-4">
                         <button 
                             onClick={(e) => { e.stopPropagation(); setIsTimerRunning(!isTimerRunning); }}
                             className="px-6 py-2 border border-[#262626] rounded-full text-[10px] uppercase tracking-widest text-[#FAFAFA] hover:bg-[#FAFAFA] hover:text-[#0A0A0A] transition-colors focus:outline-none"
                         >
                             {isTimerRunning ? 'Pause' : 'Start Timer'}
                         </button>
                         <button 
                             onClick={(e) => { e.stopPropagation(); setTimerLeft(t.duration * 60); setIsTimerRunning(false); }}
                             className="px-6 py-2 border border-[#262626] rounded-full text-[10px] uppercase tracking-widest text-[#525252] hover:text-[#FAFAFA] transition-colors focus:outline-none"
                         >
                             Reset
                         </button>
                     </div>
                 </div>

                 {/* Focus Problem Tracker (Deep Work / DSA) */}
                 {(t.activity.toLowerCase().includes('dsa') || t.activity.toLowerCase().includes('deep work')) && (
                     <div className="mt-8 bg-[#141414]/30 border border-[#262626] rounded-2xl p-5 max-w-md w-full animate-in fade-in duration-700 delay-300" onClick={(e) => e.stopPropagation()}>
                         <div className="text-[10px] uppercase tracking-widest text-[#FAFAFA] mb-6 flex justify-between items-center">
                             <span>Progress Tracker</span>
                             <span className="text-[#525252]">Problems Solved: {dsaProgress[todayStr]?.problems || 0}</span>
                         </div>
                         
                         <div className="flex flex-col gap-5 text-sm">
                             <div className="flex items-center justify-between group">
                                 <span className="text-[#A3A3A3] group-hover:text-[#FAFAFA] transition-colors">Category</span>
                                 <select 
                                     value={dsaCategory}
                                     onChange={(e) => setDsaCategory(e.target.value)}
                                     className="bg-transparent border-b border-[#262626] text-[#FAFAFA] focus:outline-none pb-1 text-right focus:border-[#525252] transition-colors cursor-pointer"
                                 >
                                     <option value="Arrays & Hashing" className="bg-[#0A0A0A]">Arrays & Hashing</option>
                                     <option value="Two Pointers" className="bg-[#0A0A0A]">Two Pointers</option>
                                     <option value="Stack" className="bg-[#0A0A0A]">Stack</option>
                                     <option value="Binary Search" className="bg-[#0A0A0A]">Binary Search</option>
                                     <option value="Sliding Window" className="bg-[#0A0A0A]">Sliding Window</option>
                                     <option value="Linked List" className="bg-[#0A0A0A]">Linked List</option>
                                     <option value="Trees" className="bg-[#0A0A0A]">Trees</option>
                                     <option value="Graphs" className="bg-[#0A0A0A]">Graphs</option>
                                     <option value="Dynamic Programming" className="bg-[#0A0A0A]">Dynamic Programming</option>
                                     <option value="Greedy" className="bg-[#0A0A0A]">Greedy</option>
                                     <option value="Math & Geometry" className="bg-[#0A0A0A]">Math & Geometry</option>
                                 </select>
                             </div>
                             
                             <div className="flex items-center justify-between mt-2 group">
                                 <span className="text-[#A3A3A3] group-hover:text-[#FAFAFA] transition-colors">Session Solved</span>
                                 <div className="flex gap-4 items-center border border-[#262626] rounded-full px-4 py-1">
                                     <button onClick={() => setDsaProblems(Math.max(0, dsaProblems - 1))} className="text-[#525252] hover:text-[#FAFAFA] focus:outline-none transition-colors text-lg leading-none mb-1">-</button>
                                     <span className="text-[#FAFAFA] w-4 text-center font-mono">{dsaProblems}</span>
                                     <button onClick={() => setDsaProblems(dsaProblems + 1)} className="text-[#525252] hover:text-[#FAFAFA] focus:outline-none transition-colors text-lg leading-none mb-1">+</button>
                                 </div>
                             </div>

                             <button 
                                 onClick={() => {
                                     const newProg = { ...dsaProgress, [todayStr]: { problems: (dsaProgress[todayStr]?.problems || 0) + dsaProblems, category: dsaCategory } };
                                     setDsaProgress(newProg);
                                     localStorage.setItem('dsa_progress', JSON.stringify(newProg));
                                     setDsaProblems(0); // reset current session counter
                                 }}
                                 className={`mt-4 w-full py-2 border border-[#262626] rounded-xl text-[10px] uppercase tracking-widest transition-all duration-300 focus:outline-none ${dsaProblems > 0 ? 'text-[#FAFAFA] hover:bg-[#FAFAFA] hover:text-[#0A0A0A]' : 'text-[#525252] cursor-not-allowed opacity-50'}`}
                                 disabled={dsaProblems === 0}
                             >
                                 Log Progress
                             </button>
                         </div>
                     </div>
                 )}

                 <button 
                     onClick={(e: any) => {
                         e.stopPropagation();
                         handleToggle(t.id);
                         setFocusTask(null);
                     }}
                     className="mt-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-medium text-[#FAFAFA] hover:text-[#0A0A0A] border border-[#262626] hover:border-[#FAFAFA] hover:bg-[#FAFAFA] px-6 py-3 rounded-full transition-all duration-300 focus:outline-none"
                 >
                     <Check size={14} /> 
                     {completions[t.id] ? 'Reopen Block' : 'Mark Completed'}
                 </button>

                 <div className="absolute top-12 right-12">
                     <button onClick={() => setFocusTask(null)} className="text-[#525252] hover:text-[#FAFAFA] transition-colors p-2 focus:outline-none">
                         <X size={24} strokeWidth={1} />
                     </button>
                 </div>
             </div>
         </div>
         );
      })()}
    </div>
  );
};
