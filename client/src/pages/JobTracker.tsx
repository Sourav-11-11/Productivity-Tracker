import React, { useState, useMemo } from 'react';
import { useJobStore, type Job, type JobStatus } from '../store/useJobStore';
import { useStore } from '../store/useStore';
import { useOnboardingStore } from '../store/useOnboardingStore';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const COLUMNS: JobStatus[] = ['Applied', 'OA', 'Interview', 'Offer', 'Rejected'];

const parseJobInput = (input: string) => {
  const parts = input.trim().split(/\s+/);
  if (parts.length < 2) return null;

  let company = parts[0];
  let role = parts.slice(1).join(' ');
  let deadline = '';

  const dateMatch = input.match(/\b(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)\b/i);
  if (dateMatch) {
    deadline = dateMatch[1];
    role = role.replace(dateMatch[0], '').trim();
    if (!role) role = 'Software Engineer';
  }

  return { company, role, deadline };
};

const getUrgency = (deadline?: string) => {
  if (!deadline) return { level: 'none', style: 'opacity-40' };
  const d = new Date(deadline + ' 2026');
  if (isNaN(d.getTime())) return { level: 'none', style: 'opacity-40' };
  const diffDays = Math.ceil((d.getTime() - Date.now()) / (1000 * 3600 * 24));
  
  if (diffDays <= 1) return { level: 'critical', style: 'text-[#FAFAFA] font-medium opacity-100' };
  if (diffDays <= 3) return { level: 'high', style: 'text-[#FAFAFA] opacity-90' };
  if (diffDays <= 7) return { level: 'medium', style: 'text-[#A3A3A3] opacity-80' };
  return { level: 'low', style: 'text-[#525252] opacity-60' };
};

export function JobTracker() {
  const { jobs, addJob, updateJobStatus, reorderJobs } = useJobStore();
  const { tasks, addTask } = useStore();
  const { goals, primaryGoal, level, availableTime } = useOnboardingStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [smartInput, setSmartInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  
  const [aiData, setAiData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAddPrepTask = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      addTask({
        id: Date.now().toString(),
        title: `Prepare for ${job.company}`,
        duration: 60,
        category: 'Placement',
        completed: false,
        createdAt: Date.now(),
      });
    }
  };

  const fetchAIInsights = async () => {
    setIsAnalyzing(true);
    setAiError(null);
    setAiData(null);
    try {
      const res = await fetch('http://localhost:5000/api/ai/analyze-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tasks, 
          jobs,
          userContext: { goal: primaryGoal, goals, level, availableTime }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiData(data);
      } else {
        setAiError(`API Error: ${res.status}. Please try again.`);
      }
    } catch(err) {
      setAiError('Failed to fetch analysis. Check your connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseJobInput(smartInput);
    if (!parsed) return;
    addJob({ company: parsed.company, role: parsed.role, status: 'Applied', deadline: parsed.deadline });
    setSmartInput('');
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    
    if (COLUMNS.includes(over.id as JobStatus)) {
      updateJobStatus(active.id as string, over.id as JobStatus);
    } else if (over.id !== active.id) {
      const overJob = jobs.find(j => j.id === over.id);
      const activeJob = jobs.find(j => j.id === active.id);
      
      if (overJob && activeJob && overJob.status === activeJob.status) {
        const columnJobs = jobs.filter(j => j.status === activeJob.status);
        const overIndex = columnJobs.findIndex(j => j.id === over.id);
        const activeIndex = columnJobs.findIndex(j => j.id === active.id);
        
        const newOrder = [...columnJobs];
        if (activeIndex !== -1 && overIndex !== -1) {
          const [movedJob] = newOrder.splice(activeIndex, 1);
          newOrder.splice(overIndex, 0, movedJob);
          reorderJobs(newOrder.map(j => j.id));
        }
      }
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchSearch = j.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          j.role.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      
      if (filter === 'Deadline Soon') {
         const { level } = getUrgency(j.deadline);
         return level === 'critical' || level === 'high';
      }
      return true;
    });
  }, [jobs, searchTerm, filter]);

  const activeCount = jobs.filter(j => j.status === 'Applied' || j.status === 'OA').length;
  const offerCount = jobs.filter(j => j.status === 'Offer').length;
  const rejectedCount = jobs.filter(j => j.status === 'Rejected').length;

  const sortedJobsInColumn = (status: JobStatus) => {
    const colJobs = filteredJobs.filter(j => j.status === status);
    return colJobs.sort((a, b) => {
        if ((a.position ?? 999) !== (b.position ?? 999)) {
          return (a.position ?? 999) - (b.position ?? 999);
        }
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        
        const timeA = new Date(a.deadline + ' 2026').getTime();
        const timeB = new Date(b.deadline + ' 2026').getTime();
        if (isNaN(timeA) && isNaN(timeB)) return 0;
        if (isNaN(timeA)) return 1;
        if (isNaN(timeB)) return -1;
        return timeA - timeB;
    });
  };

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden overflow-y-auto text-[#FAFAFA] p-12 lg:p-24 space-y-32 selection:bg-[#FAFAFA] selection:text-[#0A0A0A]">
       
       <header className="max-w-7xl mx-auto flex flex-col items-start gap-4 animate-in fade-in slide-in-from-bottom-5 duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]">
         <h1 className="text-[10px] uppercase tracking-[0.5em] text-[#FAFAFA] font-medium">Trajectory</h1>
         <p className="text-5xl font-light tracking-tighter text-[#A3A3A3] mix-blend-screen leading-tight">
            Momentum Vector
         </p>
       </header>

       {/* Top Metrics */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-7xl mx-auto opacity-70 hover:opacity-100 transition-opacity duration-1000">
          {[
            { label: 'Total Apps', val: jobs.length, color: 'text-[#FAFAFA]' },
            { label: 'Active', val: activeCount, color: 'text-[#A3A3A3]' },
            { label: 'Offers', val: offerCount, color: 'text-[#FAFAFA]' },
            { label: 'Rejections', val: rejectedCount, color: 'text-[#525252]' }
          ].map((stat, i) => (
             <div key={i} className="flex flex-col items-start justify-center group cursor-default">
                <span className={`text-6xl md:text-8xl font-light tracking-tighter transition-all duration-700 group-hover:blur-[1px] ${stat.color}`}>{stat.val}</span>
                <span className="text-[10px] text-[#525252] mt-4 uppercase tracking-[0.3em] font-medium transition-colors duration-700 group-hover:text-[#FAFAFA]">{stat.label}</span>
             </div>
          ))}
       </div>

       <div className="max-w-7xl mx-auto space-y-24 animate-in fade-in duration-[2000ms] delay-300 fill-mode-both ease-[cubic-bezier(0.16,1,0.3,1)]">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-16 md:gap-32 w-full">
             <form onSubmit={handleAddJob} className="flex-1 opacity-60 hover:opacity-100 transition-opacity duration-700">
                <div className="flex items-end border-b border-[#262626]/50 pb-4 focus-within:border-[#FAFAFA] transition-colors duration-500">
                    <input
                        type="text"
                        placeholder="Commit e.g., Amazon SDE 20 Aug"
                        className="flex-1 bg-transparent border-none outline-none text-2xl font-light tracking-tight text-[#FAFAFA] placeholder-[#262626]"
                        value={smartInput}
                        onChange={(e) => setSmartInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="text-[10px] uppercase tracking-widest text-[#525252] hover:text-[#FAFAFA] disabled:opacity-30 pb-2 transition-colors duration-500"
                        disabled={!smartInput.trim()}
                    >
                        Implant
                    </button>
                </div>
            </form>
            
            <div className="flex gap-12 items-end border-b border-[#262626]/50 pb-4 opacity-40 hover:opacity-100 transition-opacity duration-700">
               <div className="flex items-center min-w-[200px]">
                 <input 
                   type="text" 
                   placeholder="Scan vector..."
                   className="bg-transparent border-none outline-none text-sm font-light tracking-widest text-[#FAFAFA] placeholder-[#262626] w-full"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
               </div>
               <div className="flex items-center h-full">
                 <select 
                   className="bg-transparent border-none outline-none text-[10px] uppercase tracking-[0.2em] text-[#FAFAFA] appearance-none cursor-pointer"
                   value={filter}
                   onChange={e => setFilter(e.target.value)}
                 >
                   <option>Synchronized</option>
                   <option>Deadline Approach</option>
                 </select>
               </div>
            </div>
          </div>

          {/* AI Analysis View (Clean) */}
          <div className="opacity-70 hover:opacity-100 transition-opacity duration-1000 space-y-12">
             <div className="flex items-center justify-between mb-4 border-b border-[#141414]/30 pb-4">
                 <div className="flex items-center gap-4">
                     <h3 className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#FAFAFA]">Synthesis</h3>
                 </div>
                 <button onClick={fetchAIInsights} disabled={isAnalyzing} className="text-[#525252] hover:text-[#FAFAFA] text-[10px] uppercase tracking-[0.2em] transition-colors disabled:opacity-50">
                     {isAnalyzing ? 'Processing...' : 'Engage Logic'}
                 </button>
             </div>
             
             {aiError && (
                 <div className="text-red-400 text-xs tracking-widest uppercase mb-4">
                     {aiError} <button onClick={fetchAIInsights} className="underline ml-4">Retry</button>
                 </div>
             )}
             
             {isAnalyzing ? (
                 <div className="animate-pulse space-y-6 opacity-30 py-4">
                     <div className="h-[1px] bg-[#FAFAFA] w-1/4"></div>
                     <div className="h-[1px] bg-[#525252] w-full"></div>
                     <div className="h-[1px] bg-[#525252] w-3/4"></div>
                 </div>
             ) : aiData ? (
                 <div className="space-y-8 mt-6">
                     <div>
                         <p className="text-sm text-[#A3A3A3] uppercase tracking-wider font-semibold mb-2">Summary</p>
                         <p className="text-[#FAFAFA] text-base leading-relaxed">{aiData.summary}</p>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-8">
                         <div>
                             <p className="text-sm text-[#A3A3A3] uppercase tracking-wider font-semibold mb-3">Productivity Insights</p>
                             <ul className="space-y-3">
                                 {aiData.productivity?.insights?.map((t: string, i: number) => (
                                     <li key={i} className="text-sm text-[#A3A3A3] font-light"><span className="text-[#FAFAFA] mr-2">•</span>{t}</li>
                                 ))}
                             </ul>
                         </div>
                         <div>
                             <p className="text-sm text-[#A3A3A3] uppercase tracking-wider font-semibold mb-3">Placement Insights</p>
                             <ul className="space-y-3">
                                 {aiData.placement?.insights?.map((t: string, i: number) => (
                                     <li key={i} className="text-sm text-[#A3A3A3] font-light"><span className="text-[#FAFAFA] mr-2">•</span>{t}</li>
                                 ))}
                             </ul>
                         </div>
                      </div>
                 </div>
             ) : null}
          </div>

          <div className="overflow-x-auto pb-8">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-6 min-w-max">
                {COLUMNS.map((status) => <DroppableColumn key={status} status={status} colJobs={sortedJobsInColumn(status)} updateJobStatus={updateJobStatus} onAddPrepTask={handleAddPrepTask} />)}
              </div>
              <DragOverlay>
                {activeId && jobs.find(j => j.id === activeId) ? (
                   <div className="opacity-90 shadow-2xl rotate-2">
                     <DraggableJob job={jobs.find(j => j.id === activeId)!} updateJobStatus={updateJobStatus} onAddPrepTask={handleAddPrepTask} />
                   </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

       </div>
    </div>
  );
}

function DraggableJob({ job, updateJobStatus, onAddPrepTask }: { job: Job, updateJobStatus: (id: string, s: JobStatus) => void, onAddPrepTask: (jobId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
    data: job,
  });

  const style = { transform: transform ? CSS.Translate.toString(transform) : undefined };
  const urgency = getUrgency(job.deadline);
  const nsIdx = COLUMNS.indexOf(job.status) + 1;
  const ns = nsIdx < COLUMNS.length - 1 ? COLUMNS[nsIdx] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`py-6 mb-8 group transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isDragging ? 'opacity-20 scale-95' : 'cursor-grab hover:-translate-y-1'}`}
    >
      <div className="flex flex-col items-start gap-1 w-full relative">
        <h3 className="text-2xl font-light tracking-tight text-[#FAFAFA] opacity-80 group-hover:opacity-100 transition-opacity truncate w-full">{job.company}</h3>
        <p className="text-xs font-light tracking-wide text-[#A3A3A3]">{job.role}</p>

        {job.deadline && (
           <div className={`mt-3 text-[10px] uppercase tracking-[0.2em] transition-opacity duration-700 ${urgency.style}`}>
              {job.deadline}
           </div>
        )}
      </div>
      
      <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity duration-700 mt-6 min-h-[20px]">
        <button
          onPointerDown={(e) => { e.stopPropagation(); onAddPrepTask(job.id); }}
          className="text-[10px] uppercase tracking-[0.2em] text-[#525252] hover:text-[#FAFAFA] transition-colors"
        >
          Prime
        </button>
        {ns && (
            <button
              onPointerDown={(e) => { e.stopPropagation(); updateJobStatus(job.id, ns); }}
              className="text-[10px] uppercase tracking-[0.2em] text-[#525252] hover:text-[#FAFAFA] transition-colors"
            >
                Advance
            </button>
        )}
        {job.status !== 'Rejected' && (
            <button
              onPointerDown={(e) => { e.stopPropagation(); updateJobStatus(job.id, 'Rejected'); }}
              className="text-[10px] uppercase tracking-[0.2em] text-[#525252] hover:text-red-400 transition-colors"
            >
                Eject
            </button>
        )}
      </div>
    </div>
  );
}

function DroppableColumn({ status, colJobs, updateJobStatus, onAddPrepTask }: { status: JobStatus, colJobs: Job[], updateJobStatus: (id: string, s: JobStatus) => void, onAddPrepTask: (jobId: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[320px] max-w-[400px] flex flex-col transition-all duration-1000 ${isOver ? 'opacity-100 scale-[1.02]' : 'opacity-80 hover:opacity-100'}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-[#141414]/50 mb-8">
        <h2 className="text-[10px] font-medium tracking-[0.4em] uppercase text-[#FAFAFA] opacity-50">{status}</h2>
        <span className="text-[10px] tracking-widest text-[#525252]">
          {colJobs.length}
        </span>
      </div>
      <div className="flex-1 px-4 overflow-y-auto min-h-[500px]">
        {colJobs.map((job) => (
          <DraggableJob key={job.id} job={job} updateJobStatus={updateJobStatus} onAddPrepTask={onAddPrepTask} />
        ))}
      </div>
    </div>
  );
}
