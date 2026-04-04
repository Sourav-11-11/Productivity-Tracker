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
import { GripVertical, Plus, Trash2, CheckCircle2, Circle, RefreshCw } from 'lucide-react';

const INITIAL_SCHEDULE = [
  { id: '1', duration: 15, activity: 'Wake up', what: 'Freshen up', details: 'Hydrate (1 glass water)' },
  { id: '2', duration: 15, activity: 'Pre-workout', what: 'Banana (optional)', details: 'Light energy' },
  { id: '3', duration: 75, activity: '🏋️ Gym', what: 'Workout', details: 'Follow your split' },
  { id: '4', duration: 30, activity: '🍳 Breakfast', what: '4–5 eggs + idli + 1 glass milk', details: 'Main protein meal' },
  { id: '5', duration: 60, activity: '💻 Light Work', what: 'Job apply / revise yesterday DSA', details: 'Keep it low stress' },
  { id: '6', duration: 20, activity: '🥤 Shake', what: 'Banana + milk + dry fruit mix', details: 'High calories' },
  { id: '7', duration: 180, activity: '🔥 DSA Block 1', what: '1.5 hr learning + 1.5 hr problems', details: 'Core growth time' },
  { id: '8', duration: 30, activity: '🍛 Lunch', what: 'Rice + dal + paneer/chicken', details: "Don't skip protein" },
  { id: '9', duration: 90, activity: '😴 Rest', what: 'Nap / relax', details: 'Recovery (important)' },
  { id: '10', duration: 30, activity: 'Reset', what: 'Freshen up / light snack', details: 'Prepare for next block' },
  { id: '11', duration: 150, activity: '🔥 DSA Block 2', what: '1 hr revision + 1.5 hr problems', details: 'Reinforce learning' },
  { id: '12', duration: 30, activity: '🍌 Break', what: 'Banana / peanuts / relax', details: 'Light energy' },
  { id: '13', duration: 60, activity: '⚡ Light Study', what: 'Easy problems / notes', details: 'No heavy thinking' },
  { id: '14', duration: 30, activity: '🍽️ Dinner', what: 'Normal meal + 2–3 eggs/paneer', details: 'Protein focus' },
  { id: '15', duration: 30, activity: '🧠 Plan & Track', what: 'Review day + plan tomorrow', details: 'Track problems + habits' },
  { id: '16', duration: 45, activity: 'Chill', what: 'Relax / light phone use', details: 'No stress' },
  { id: '17', duration: 480, activity: '😴 Sleep', what: 'Sleep', details: '7–8 hrs minimum' },
];

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m.toString().padStart(2, '0');
  return `${displayH}:${displayM} ${ampm}`;
}

const SortableRow = ({ item, startTime, isCompleted, onToggle, onDelete }: { item: any, startTime: number, isCompleted: boolean, onToggle: (id: string) => void, onDelete: (id: string) => void }) => {
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

  const endStr = item.duration ? ` - ${formatTime(startTime + item.duration)}` : '';
  const timeDisplay = `${formatTime(startTime)}${endStr}`;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-[#262626] transition-colors group ${isDragging ? 'opacity-30' : 'opacity-100'} ${isCompleted ? 'bg-[#0A0A0A]/50 opacity-40' : 'bg-[#0A0A0A] hover:bg-[#141414]'}`}
    >
      <td className="p-3 w-10 text-center">
        <button {...attributes} {...listeners} className="text-[#525252] hover:text-[#FAFAFA] cursor-grab">
          <GripVertical size={16} />
        </button>
      </td>
      <td className="p-3 w-12 text-center text-[#525252]">
          <button onClick={() => onToggle(item.id)} className="hover:text-[#FAFAFA] transition-colors">
              {isCompleted ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} />}
          </button>
      </td>
      <td className={`p-3 text-xs tracking-widest text-[#A3A3A3] whitespace-nowrap ${isCompleted && 'line-through'}`}>{timeDisplay}</td>
      <td className={`p-3 text-sm font-medium text-[#FAFAFA] ${isCompleted && 'line-through text-[#525252]'}`}>{item.activity}</td>
      <td className={`p-3 text-sm text-[#A3A3A3] ${isCompleted && 'line-through text-[#525252]'}`}>{item.what}</td>
      <td className={`p-3 text-xs text-[#525252] hidden md:table-cell ${isCompleted && 'line-through'}`}>
          <div className="flex items-center justify-between w-full h-full">
            <span>{item.details}</span>
            <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 text-[#525252] hover:text-red-500 transition-all p-1">
                <Trash2 size={14} />
            </button>
          </div>
      </td>
    </tr>
  );
};

export const Timetable = () => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('daily_timetable');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
  });
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [completions, setCompletions] = useState<Record<string, boolean>>(() => {
    const savedComps = localStorage.getItem(`timetable_comps_${todayStr}`);
    return savedComps ? JSON.parse(savedComps) : {};
  });

  const [wakeTime, setWakeTime] = useState(6 * 60 + 30); // 6:30 AM in minutes
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ duration: 30, activity: '', what: '', details: '' });

  useEffect(() => {
    localStorage.setItem('daily_timetable', JSON.stringify(items));
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

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
      const end = t + i.duration;
      const status = completions[i.id] ? 'COMPLETED' : (end < currentMins ? 'DUE' : 'PLANNED');
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

  const handleDelete = (id: string) => {
      setItems((prev: any) => prev.filter((i: any) => i.id !== id));
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

  const handleAddTask = () => {
      if (!newTask.activity) return;
      const t = { ...newTask, id: Date.now().toString(), duration: Number(newTask.duration) || 30 };
      setItems((prev: any) => [...prev, t]);
      setIsAdding(false);
      setNewTask({ duration: 30, activity: '', what: '', details: '' });
  };

  let currentTime = wakeTime;

  return (
    <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl overflow-hidden shadow-2xl mt-12 w-full max-w-5xl mx-auto">
      <div className="p-6 border-b border-[#262626] bg-[#0F0F0F] flex items-center justify-between">
        <div className="flex items-center justify-center gap-4">
          <div>
            <h2 className="text-sm uppercase tracking-[0.2em] font-medium text-[#FAFAFA]">Daily Routine</h2>
            <p className="text-xs text-[#525252] mt-1 tracking-wider uppercase">Drag to reorder slots directly.</p>
          </div>
          <button 
            onClick={handleSyncToPresent}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] rounded text-[10px] uppercase tracking-widest text-[#A3A3A3] hover:text-[#FAFAFA] transition-colors ml-4"
            title="Start planned tasks from now, push completed/due to end"
          >
            <RefreshCw className="w-3 h-3" /> Sync to Now
          </button>
        </div>
        <div className="flex gap-2 items-center">
            <span className="text-xs text-[#525252] uppercase tracking-widest">Wake Up:</span>
            <input 
                type="time" 
                className="bg-[#141414] text-[#FAFAFA] border border-[#262626] rounded p-1 text-sm focus:outline-none focus:border-[#525252]"
                defaultValue="06:30"
                onChange={(e) => {
                    const [h, m] = e.target.value.split(':');
                    setWakeTime(parseInt(h) * 60 + parseInt(m));
                }}
            />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#262626] bg-[#141414] text-[10px] uppercase tracking-widest text-[#525252]">
              <th className="p-3 font-normal w-10"></th>
              <th className="p-3 font-normal w-12"></th>
              <th className="p-3 font-normal">Time</th>
              <th className="p-3 font-normal">Activity</th>
              <th className="p-3 font-normal">What to Do</th>
              <th className="p-3 font-normal hidden md:table-cell">Details</th>
            </tr>
          </thead>
          <tbody>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items} strategy={verticalListSortingStrategy}>
                {items.map((item: any) => {
                  const startTime = currentTime;
                  currentTime += item.duration;
                  return <SortableRow 
                            key={item.id} 
                            item={item} 
                            startTime={startTime} 
                            isCompleted={completions[item.id] || false}
                            onToggle={() => handleToggle(item.id)}
                            onDelete={() => handleDelete(item.id)}
                        />;
                })}
              </SortableContext>
            </DndContext>
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-[#262626] bg-[#0F0F0F]">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#525252] hover:text-[#FAFAFA] hover:bg-[#141414] rounded transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Task
          </button>
        ) : (
          <div className="space-y-3 p-4 bg-[#141414] rounded-lg border border-[#262626]">
             <div className="flex gap-3 items-center text-sm">
               <input
                 type="number"
                 placeholder="Mins"
                 className="bg-[#0A0A0A] border border-[#262626] rounded px-3 py-2 text-[#FAFAFA] focus:outline-none focus:border-[#525252] w-24 placeholder-[#525252]"
                 value={newTask.duration || ''}
                 onChange={(e) => setNewTask({ ...newTask, duration: Number(e.target.value) })}
               />
               <input
                 type="text"
                 placeholder="Activity"
                 className="bg-[#0A0A0A] border border-[#262626] rounded px-3 py-2 text-[#FAFAFA] focus:outline-none focus:border-[#525252] flex-1 placeholder-[#525252]"
                 value={newTask.activity}
                 onChange={(e) => setNewTask({ ...newTask, activity: e.target.value })}
                 autoFocus
               />
               <input
                 type="text"
                 placeholder="What"
                 className="bg-[#0A0A0A] border border-[#262626] rounded px-3 py-2 text-[#FAFAFA] focus:outline-none focus:border-[#525252] flex-1 placeholder-[#525252]"
                 value={newTask.what}
                 onChange={(e) => setNewTask({ ...newTask, what: e.target.value })}
               />
               <input
                 type="text"
                 placeholder="Details (Optional)"
                 className="bg-[#0A0A0A] border border-[#262626] rounded px-3 py-2 text-[#FAFAFA] focus:outline-none focus:border-[#525252] flex-1 placeholder-[#525252] hidden md:block"
                 value={newTask.details}
                 onChange={(e) => setNewTask({ ...newTask, details: e.target.value })}
               />
             </div>
             <div className="flex justify-end gap-2 mt-4">
               <button
                 onClick={() => setIsAdding(false)}
                 className="px-4 py-2 text-xs uppercase tracking-wider text-[#525252] hover:text-[#FAFAFA] transition-colors"
               >
                 Cancel
               </button>
               <button
                 disabled={!newTask.activity}
                 onClick={handleAddTask}
                 className="px-6 py-2 text-xs uppercase tracking-wider bg-[#FAFAFA] text-[#0A0A0A] font-medium rounded hover:bg-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 Add
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};