const fs = require('fs'); 
const p = 'client/src/pages/JobTracker.tsx';
let txt = fs.readFileSync(p, 'utf8');

const rx1 = /const renderDraggableJob =[\s\S]+?;\n  };\n\n  const renderDroppableColumn =[\s\S]+?;\n  };/;
if (rx1.test(txt)) {
  txt = txt.replace(rx1, '');
  const rxJSX = /\{COLUMNS\.map\(renderDroppableColumn\)\}/g;
  txt = txt.replace(rxJSX, '{COLUMNS.map((status) => <DroppableColumn key={status} status={status} colJobs={sortedJobsInColumn(status)} updateJobStatus={updateJobStatus} />)}');
  
  const rxOverlay = /\{renderDraggableJob\(jobs\.find\(j => j\.id === activeId\)\!\)\}/;
  txt = txt.replace(rxOverlay, '<DraggableJob job={jobs.find(j => j.id === activeId)!} updateJobStatus={updateJobStatus} />');
  
  // now append component definitions to the file
  const comp = `

function DraggableJob({ job, updateJobStatus }: { job: Job, updateJobStatus: (id: string, s: JobStatus) => void }) {
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
      className={\`p-4 mb-3 rounded-xl bg-gray-900/60 border \${urgency.style} backdrop-blur-md \${isDragging ? 'opacity-50' : 'cursor-grab hover:bg-gray-800/80 transition-all transform hover:-translate-y-1 hover:shadow-lg'}\`}
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
}

function DroppableColumn({ status, colJobs, updateJobStatus }: { status: JobStatus, colJobs: Job[], updateJobStatus: (id: string, s: JobStatus) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={\`flex-1 min-w-[300px] rounded-2xl bg-gray-900/20 border border-white/5 p-4 flex flex-col \${isOver ? 'bg-gray-800/40 ring-2 ring-indigo-500/30' : ''} transition-all duration-300\`}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="font-semibold text-gray-300">{status}</h2>
        <span className="px-2 py-1 rounded-full bg-black/40 text-xs font-medium text-gray-400 border border-white/5 shadow-inner">
          {colJobs.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-[500px] pb-4 scrollbar-hide">
        {colJobs.map((job) => (
          <DraggableJob key={job.id} job={job} updateJobStatus={updateJobStatus} />
        ))}
        {colJobs.length === 0 && (
           <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-gray-600 text-sm">
              Drop here
           </div>
        )}
      </div>
    </div>
  );
}
`;

  txt += comp;
  fs.writeFileSync(p, txt);
  console.log('Fixed JobTracker hooks');
} else {
  console.log('Regex 1 not found');
}
