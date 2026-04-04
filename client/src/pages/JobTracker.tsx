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
import { Sparkles, Plus, XCircle, BarChart2, Search, Filter, Loader2 } from 'lucide-react';

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
  if (!deadline) return { level: 'none', style: 'border-[#262626] text-[#A3A3A3]' };
  const d = new Date(deadline + ' 2026');
  if (isNaN(d.getTime())) return { level: 'none', style: 'border-[#262626] text-[#A3A3A3]' };
  const diffDays = Math.ceil((d.getTime() - Date.now()) / (1000 * 3600 * 24));
  
  if (diffDays <= 1) return { level: 'critical', style: 'border-[#FAFAFA] text-[#FAFAFA]' };
  if (diffDays <= 3) return { level: 'high', style: 'border-[#A3A3A3] text-[#A3A3A3]' };
  if (diffDays <= 7) return { level: 'medium', style: 'border-[#525252] text-[#525252]' };
  return { level: 'low', style: 'border-[#262626] text-[#A3A3A3]' };
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
    <div className="min-h-screen bg-[#0A0A0A] overflow-x-hidden overflow-y-auto text-[#FAFAFA] p-8 space-y-12">
       
       {/* Top Metrics */}
       <div className="grid grid-cols-4 gap-6 max-w-7xl mx-auto border-b border-[#262626] pb-8">
          {[
            { label: 'Total Apps', val: jobs.length, color: 'text-[#FAFAFA]' },
            { label: 'Active', val: activeCount, color: 'text-[#A3A3A3]' },
            { label: 'Offers', val: offerCount, color: 'text-[#FAFAFA]' },
            { label: 'Rejections', val: rejectedCount, color: 'text-[#525252]' }
          ].map((stat, i) => (
             <div key={i} className="flex flex-col items-start justify-center">
                <span className={`text-3xl font-medium tracking-tight ${stat.color}`}>{stat.val}</span>
                <span className="text-xs text-[#525252] mt-1 uppercase tracking-wider font-semibold">{stat.label}</span>
             </div>
          ))}
       </div>

       <div className="max-w-7xl mx-auto space-y-12">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-6 border-b border-[#262626] pb-8">
             <form onSubmit={handleAddJob} className="flex-1">
                <div className="bg-[#141414] border border-[#262626] rounded flex items-center p-1 focus-within:border-[#525252] transition-colors">
                    <input
                        type="text"
                        placeholder="e.g., Amazon SDE Intern 20 Aug"
                        className="flex-1 bg-transparent border-none outline-none text-[#FAFAFA] placeholder-[#525252] px-4 py-2"
                        value={smartInput}
                        onChange={(e) => setSmartInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="bg-[#FAFAFA] text-[#0A0A0A] hover:bg-[#E5E5E5] px-6 py-2 rounded font-medium transition-colors"
                        disabled={!smartInput.trim()}
                    >
                        Add
                    </button>
                </div>
            </form>
            
            <div className="flex gap-4 items-center">
               <div className="w-64 bg-[#141414] border border-[#262626] rounded flex items-center px-4 py-3">
                 <Search className="w-4 h-4 text-[#525252] mr-3" />
                 <input 
                   type="text" 
                   placeholder="Search..."
                   className="bg-transparent border-none outline-none text-sm text-[#FAFAFA] placeholder-[#525252] w-full"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
               </div>
               <div className="bg-[#141414] border border-[#262626] rounded flex items-center px-4 py-3">
                 <Filter className="w-4 h-4 text-[#525252] mr-3" />
                 <select 
                   className="bg-transparent border-none outline-none text-sm text-[#FAFAFA] appearance-none min-w-[120px] cursor-pointer"
                   value={filter}
                   onChange={e => setFilter(e.target.value)}
                 >
                   <option>All</option>
                   <option>Deadline Soon</option>
                 </select>
               </div>
            </div>
          </div>

          {/* AI Analysis View (Clean) */}
          <div className="border border-[#262626] rounded p-6 bg-[#0A0A0A]">
             <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                     <BarChart2 className="w-4 h-4 text-[#FAFAFA]" />
                     <h3 className="font-medium text-[#FAFAFA]">AI Strategy</h3>
                 </div>
                 <button onClick={fetchAIInsights} disabled={isAnalyzing} className="text-[#A3A3A3] hover:text-[#FAFAFA] text-sm flex items-center gap-2 transition-colors disabled:opacity-50">
                     {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4" />}
                     {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
                 </button>
             </div>
             
             {aiError && (
                 <div className="text-red-400 text-sm mb-4">
                     {aiError} <button onClick={fetchAIInsights} className="underline ml-2">Retry</button>
                 </div>
             )}
             
             {isAnalyzing ? (
                 <div className="animate-pulse space-y-4 py-4">
                     <div className="h-4 bg-[#141414] rounded w-3/4"></div>
                     <div className="h-10 bg-[#141414] rounded w-full"></div>
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
                                     <li key={i} className="flex gap-2 text-sm text-[#A3A3A3]">
                                         <span className="text-[#FAFAFA] mt-0.5">•</span>
                                         <span>{t}</span>
                                     </li>
                                 ))}
                             </ul>
                         </div>
                         <div>
                             <p className="text-sm text-[#A3A3A3] uppercase tracking-wider font-semibold mb-3">Placement Insights</p>
                             <ul className="space-y-3">
                                 {aiData.placement?.insights?.map((t: string, i: number) => (
                                     <li key={i} className="flex gap-2 text-sm text-[#A3A3A3]">
                                         <span className="text-[#FAFAFA] mt-0.5">•</span>
                                         <span>{t}</span>
                                     </li>
                                 ))}
                             </ul>
                         </div>
                     </div>
                 </div>
             ) : (
                 <div className="py-8 text-center text-[#525252]">
                     <p className="text-sm">Click Analyze to generate strategic insights for your job hunt.</p>
                 </div>
             )}
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
      className={`p-4 mb-4 rounded bg-[#0A0A0A] border ${urgency.style} group transition-all ${isDragging ? 'opacity-50' : 'cursor-grab hover:border-[#525252]'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-base text-[#FAFAFA]">{job.company}</h3>
        {job.deadline && (
           <div className={`text-xs font-semibold px-2 py-1 bg-[#141414] rounded border ${urgency.style}`}>
              {job.deadline}
           </div>
        )}
      </div>
      <div className="text-sm text-[#A3A3A3] mb-4">
        <p>{job.role}</p>
      </div>
      
      <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onPointerDown={(e) => { e.stopPropagation(); onAddPrepTask(job.id); }}
          className="text-xs text-[#A3A3A3] hover:text-[#FAFAFA] transition-colors flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Prep
        </button>
        <div className="flex gap-3">
          {ns && (
              <button
                onPointerDown={(e) => { e.stopPropagation(); updateJobStatus(job.id, ns); }}
                className="text-xs text-[#A3A3A3] hover:text-[#FAFAFA] transition-colors"
              >
                  Next
              </button>
          )}
          {job.status !== 'Rejected' && (
              <button
                title="Reject"
                onPointerDown={(e) => { e.stopPropagation(); updateJobStatus(job.id, 'Rejected'); }}
                className="text-[#525252] hover:text-red-400 transition-colors"
              >
                  <XCircle className="w-4 h-4" />
              </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({ status, colJobs, updateJobStatus, onAddPrepTask }: { status: JobStatus, colJobs: Job[], updateJobStatus: (id: string, s: JobStatus) => void, onAddPrepTask: (jobId: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[320px] rounded bg-[#141414] border border-[#262626] flex flex-col transition-colors ${isOver ? 'bg-[#1A1A1A] border-[#525252]' : ''}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-[#262626]">
        <h2 className="font-medium text-sm tracking-wider uppercase text-[#A3A3A3]">{status}</h2>
        <span className="text-xs font-semibold text-[#525252]">
          {colJobs.length}
        </span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto min-h-[500px]">
        {colJobs.map((job) => (
          <DraggableJob key={job.id} job={job} updateJobStatus={updateJobStatus} onAddPrepTask={onAddPrepTask} />
        ))}
      </div>
    </div>
  );
}
