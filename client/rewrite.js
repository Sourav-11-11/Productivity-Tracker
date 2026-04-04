const fs = require('fs');
const content = import React, { useState, useMemo } from 'react';
import { useJobStore, type Job, type JobStatus } from '../store/useJobStore';
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
import { Sparkles, Calendar, Building, Briefcase, Plus, CheckCircle, XCircle, ChevronRight, BarChart2, Search, Filter } from 'lucide-react';

const COLUMNS: JobStatus[] = ['Applied', 'OA', 'Interview', 'Offer', 'Rejected'];

const parseJobInput = (input: string) => {
  const parts = input.trim().split(/\\s+/);
  if (parts.length < 2) return null;

  let company = parts[0];
  let role = parts.slice(1).join(' ');
  let deadline = '';

  const dateMatch = input.match(/\\b(\\d{1,2}\\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)\\b/i);
  if (dateMatch) {
    deadline = dateMatch[1];
    role = role.replace(dateMatch[0], '').trim();
    if (!role) role = 'Software Engineer';
  }

  return { company, role, deadline };
};

const getUrgency = (deadline?: string) => {
  if (!deadline) return { level: 'none', style: 'border-white/5' };
  const d = new Date(deadline + ' 2026');
  if (isNaN(d.getTime())) return { level: 'none', style: 'border-white/5' };
  const diffDays = Math.ceil((d.getTime() - Date.now()) / (1000 * 3600 * 24));
  
  if (diffDays <= 1) return { level: 'critical', style: 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' };
  if (diffDays <= 3) return { level: 'high', style: 'border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]' };
  if (diffDays <= 7) return { level: 'medium', style: 'border-yellow-500/50' };
  return { level: 'low', style: 'border-white/10' };
};

export default function JobTracker() {
  const { jobs, addJob, updateJobStatus } = useJobStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [smartInput, setSmartInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

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
      if (filter === 'Applied Today') {
         // quick and dirty
         const todayStr = new Date().toDateString();
         // our mock dates
         return true; // placeholder till full appliedDate logic
      }
      return true;
    });
  }, [jobs, searchTerm, filter]);

  const activeCount = jobs.filter(j => j.status === 'Applied' || j.status === 'OA').length;
  const offerCount = jobs.filter(j => j.status === 'Offer').length;
  const rejectedCount = jobs.filter(j => j.status === 'Rejected').length;

  const insights = useMemo(() => {
    const list = [];
    if (jobs.length < 5) list.push('Increase application volume.');
    if (jobs.filter(j => j.status === 'Applied').length > 5 && jobs.filter(j => j.status === 'OA').length === 0) {
      list.push('Many Applied but low OA: Resume may need improvement.');
    }
    if (rejectedCount > 3) list.push('Many rejections: Improve preparation.');
    if (jobs.filter(j => !j.deadline).length === jobs.length && jobs.length > 0) {
      list.push('No deadlines tracked: Add deadlines to stay consistent.');
    }
    if (list.length === 0) list.push('Great momentum!');
    return list.slice(0, 4);
  }, [jobs, rejectedCount]);

  const sortedJobsInColumn = (status: JobStatus) => {
    const colJobs = filteredJobs.filter(j => j.status === status);
    return colJobs.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline + ' 2026').getTime() - new Date(b.deadline + ' 2026').getTime();
    });
  };

  const renderDraggableJob = (job: Job) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: job.id,
      data: job,
    });
    
    // transform string mapping properly!
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
        className={\p-4 mb-3 rounded-xl bg-gray-900/60 border \ backdrop-blur-md \\}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-100">{job.company}</h3>
          </div>
          {job.deadline && (
             <div className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-black/40 text-gray-300 border border-white/5">
                <Calendar className="w-3 h-3" />
                {job.deadline}
             </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <Briefcase className="w-4 h-4" />
          <p>{job.role}</p>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 gap-2">
           {ns && (
               <button 
                 onPointerDown={(e) => { e.stopPropagation(); updateJobStatus(job.id, ns); }}
                 className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
               >
                   Mark Done <ChevronRight className="w-3 h-3"/>
               </button>
           )}
           {job.status !== 'Rejected' && (
               <button 
                 onPointerDown={(e) => { e.stopPropagation(); updateJobStatus(job.id, 'Rejected'); }}
                 className="p-1.5 rounded-lg text-rose-400/70 hover:bg-rose-500/10 hover:text-rose-400"
               >
                   <XCircle className="w-4 h-4" />
               </button>
           )}
        </div>
      </div>
    );
  };

  const renderDroppableColumn = (status: JobStatus) => {
    const { setNodeRef, isOver } = useDroppable({ id: status });
    const colJobs = sortedJobsInColumn(status);

    return (
      <div
        ref={setNodeRef}
        className={\lex-1 min-w-[300px] rounded-2xl bg-gray-900/20 border border-white/5 p-4 flex flex-col \ transition-all duration-300\}
      >
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="font-semibold text-gray-300">{status}</h2>
          <span className="px-2 py-1 rounded-full bg-black/40 text-xs font-medium text-gray-400 border border-white/5 shadow-inner">
            {colJobs.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto min-h-[500px] pb-4 scrollbar-hide">
          {colJobs.map((job) => (
            <React.Fragment key={job.id}>{renderDraggableJob(job)}</React.Fragment>
          ))}
          {colJobs.length === 0 && (
             <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-gray-600 text-sm">
                Drop here
             </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050510] relative overflow-x-hidden overflow-y-auto text-gray-200 p-8 space-y-6">
       
       <div className="grid grid-cols-4 gap-4 max-w-7xl mx-auto relative z-10">
          {[
            { label: 'Total Apps', val: jobs.length, color: 'text-indigo-400' },
            { label: 'Active', val: activeCount, color: 'text-emerald-400' },
            { label: 'Offers', val: offerCount, color: 'text-amber-400' },
            { label: 'Rejections', val: rejectedCount, color: 'text-rose-400' }
          ].map((stat, i) => (
             <div key={i} className="bg-gray-900/40 border border-white/5 backdrop-blur-xl p-4 rounded-2xl flex flex-col items-center justify-center">
                <span className={\	ext-3xl font-bold \\}>{stat.val}</span>
                <span className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</span>
             </div>
          ))}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto relative z-10">
          <div className="lg:col-span-2 space-y-4">
             <form onSubmit={handleAddJob} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:opacity-100 opacity-0 transition-opacity" />
                <div className="relative bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl">
                    <div className="pl-4 pr-3 text-indigo-400">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <input
                        type="text"
                        placeholder="e.g., Amazon SDE Intern 20 Aug"
                        className="flex-1 bg-transparent border-none outline-none text-gray-100 placeholder-gray-600 px-2 py-3"
                        value={smartInput}
                        onChange={(e) => setSmartInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                        disabled={!smartInput.trim()}
                    >
                        <Plus className="w-4 h-4" /> Add
                    </button>
                </div>
            </form>
            
            <div className="flex gap-4 items-center">
               <div className="flex-1 bg-gray-900/40 border border-white/5 rounded-xl p-2 flex items-center">
                 <Search className="w-4 h-4 text-gray-500 ml-2 mr-2" />
                 <input 
                   type="text" 
                   placeholder="Search company or role..."
                   className="bg-transparent border-none outline-none text-sm text-gray-300 w-full"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
               </div>
               <div className="bg-gray-900/40 border border-white/5 rounded-xl p-2 flex items-center gap-2 pr-3">
                 <Filter className="w-4 h-4 text-gray-500 ml-2" />
                 <select 
                   className="bg-transparent border-none outline-none text-sm text-gray-300 appearance-none min-w-[120px]"
                   value={filter}
                   onChange={e => setFilter(e.target.value)}
                 >
                   <option>All</option>
                   <option>Deadline Soon</option>
                 </select>
               </div>
            </div>
          </div>

          <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden backdrop-blur-xl">
             <div className="flex items-center gap-2 mb-4">
                 <BarChart2 className="w-5 h-5 text-purple-400" />
                 <h3 className="font-semibold text-gray-200">AI Placement Insights</h3>
             </div>
             <ul className="space-y-3 z-10 flex-1">
                 {insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                       <CheckCircle className="w-4 h-4 text-emerald-500/50 mt-0.5 shrink-0" />
                       <p>{insight}</p>
                    </li>
                 ))}
             </ul>
             <div className="mt-4 pt-4 border-t border-white/5">
                 <span className="text-xs text-indigo-400 font-medium tracking-wide uppercase">Today's Focus:</span>
                 <p className="text-sm text-gray-300 mt-1">
                   {jobs.length < 5 ? "Apply to 3 companies." : "Follow up on X applications & prepare for OA."}
                 </p>
             </div>
          </div>
       </div>

       <div className="max-w-7xl mx-auto relative z-10 overflow-x-auto">
         {jobs.length === 0 ? (
            <div className="w-full h-64 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center bg-gray-900/20 backdrop-blur-sm">
                <Sparkles className="w-10 h-10 text-indigo-500 mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-gray-300">Start your placement journey</h3>
                <button onClick={() => document.querySelector('input')?.focus()} className="mt-4 text-indigo-400 hover:text-indigo-300 transition-colors">
                   + Add your first application
                </button>
            </div>
         ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-6 pb-8 pt-4">
                {COLUMNS.map(renderDroppableColumn)}
              </div>
              <DragOverlay>
                {activeId ? (
                   <div className="opacity-80 rotate-3 scale-105">
                     {renderDraggableJob(jobs.find(j => j.id === activeId)!)}
                   </div>
                ) : null}
              </DragOverlay>
            </DndContext>
         )}
       </div>

    </div>
  );
}
;
fs.writeFileSync('d:/sourav/LetsMakeIt/client/src/pages/JobTracker.tsx', content);
