import { useEffect, useState, useRef } from "react";
import { useStore } from "../store/useStore";
import { useJobStore } from "../store/useJobStore";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical } from "lucide-react";

// Sortable Task Item Component
const SortableTaskItem = ({ task, onToggle, onDelete, onUpdate }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onUpdate(task.id, { ...task, title: editTitle.trim() });
    } else {
      setEditTitle(task.title);
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 bg-gray-900/60 border border-gray-800/60 rounded-xl p-4 hover:border-gray-700/80 transition-all group ${
        isDragging ? "shadow-lg shadow-blue-500/20" : ""
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={`flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
          task.completed
            ? "bg-green-600 border-green-600"
            : "border-gray-600 hover:border-green-500 bg-transparent"
        }`}
        aria-label="Toggle task completion"
      >
        {task.completed && <span className="text-white text-sm font-bold">✓</span>}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit();
              if (e.key === "Escape") setIsEditing(false);
            }}
            className="w-full px-3 py-1 bg-gray-800 border border-blue-500 rounded-lg text-gray-100 focus:outline-none"
          />
        ) : (
          <p
            onClick={() => setIsEditing(true)}
            className={`cursor-text transition-all ${
              task.completed
                ? "line-through text-gray-500 opacity-60"
                : "text-gray-100"
            }`}
          >
            {task.title}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">{task.duration} min</p>
      </div>

      {/* Delete Button */}
      <button
        onClick={() => onDelete(task.id)}
        className="flex-shrink-0 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        aria-label="Delete task"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export const Dashboard = () => {
  const { tasks, loadFromDB, addTask, updateTask, deleteTask, reorderTasks } = useStore();
  const { jobs } = useJobStore();
  const { goals, primaryGoal, level, availableTime } = useOnboardingStore();

  // Drag & Drop Setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(tasks, oldIndex, newIndex);
      reorderTasks(newOrder);
    }
  };

  // Task Input State
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const parseTaskInput = (input: string) => {
    const match = input.match(/^(.+?)\s+(\d+)\s*min$/i);
    if (match) {
      return { title: match[1].trim(), duration: parseInt(match[2]) };
    }
    return null;
  };

  const handleTaskInput = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const parsed = parseTaskInput(trimmed);
    if (parsed) {
      addTask({
        id: `task-${Date.now()}`,
        title: parsed.title,
        duration: parsed.duration,
        category: "DSA",
        completed: false,
        createdAt: Date.now(),
      });
      setInputValue("");
      inputRef.current?.focus();
    }
  };

  // Task Management
  const handleToggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      updateTask(id, { ...task, completed: !task.completed });
    }
  };

  const handleUpdateTask = (id: string, updated: any) => {
    updateTask(id, updated);
  };

  const handleDeleteTask = (id: string) => {
    deleteTask(id);
  };

  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  // Derived Data
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const completedDuration = tasks
    .filter((t) => t.completed)
    .reduce((acc, t) => acc + (t.duration || 0), 0);

  const focusHours = Math.floor(completedDuration / 60);

  // SECTION 1: Quick Metrics
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setAnalysisLoading(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    try {
      const response = await fetch("http://localhost:5000/api/ai/analyze-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          jobs,
          userContext: { goal: primaryGoal, goals, level, availableTime }
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data);
      } else {
        setAnalysisError(`API Error: ${response.status}. Please try again.`);
        console.error("API error:", response.status);
      }
    } catch (error) {
      setAnalysisError("Failed to fetch analysis. Check your connection and try again.");
      console.error("AI Analysis failed", error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Tomorrow Plan State
  const [planLoading, setPlanLoading] = useState(false);
  const [tomorrowPlan, setTomorrowPlan] = useState<any>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  // Note: Profile editing disabled in this version - users can reset onboarding from settings

  const handleGeneratePlan = async () => {
    setPlanLoading(true);
    setTomorrowPlan(null);
    setPlanError(null);
    try {
      const response = await fetch("http://localhost:5000/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tasks, 
          jobs,
          userContext: { goal: primaryGoal, goals, level, availableTime }
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setTomorrowPlan(data);
      } else {
        setPlanError(`API Error: ${response.status}. Please try again.`);
        console.error("API error:", response.status);
      }
    } catch (error) {
      setPlanError("Failed to generate plan. Check your connection and try again.");
      console.error("AI Plan Gen failed", error);
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-1">
            Insights & AI
          </h2>
          <p className="text-gray-400 text-sm">
            Deep analysis and AI-powered recommendations for your growth.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGeneratePlan}
            disabled={planLoading || totalTasks === 0}
            className="px-5 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {planLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </span>
            ) : (
              <>✨ Generate Tomorrow Plan</>
            )}
          </button>
          <button
            onClick={handleAnalyze}
            disabled={analysisLoading || totalTasks === 0}
            className="px-5 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-blue-400 border border-blue-500/30 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {analysisLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Thinking...
              </span>
            ) : (
              <>✨ Analyze My Day</>
            )}
          </button>
        </div>
      </div>

      {/* Task Input & List Section */}
      <div className="space-y-6">
        {/* Task Input Form */}
        <form onSubmit={handleTaskInput} className="w-full">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add task (e.g. Solve graphs 60min)"
            className="w-full px-5 py-3 bg-gray-800/60 border border-gray-700/60 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/60 focus:bg-gray-800/80 transition-all text-sm"
          />
          <p className="text-xs text-gray-500 mt-2 ml-1">Format: "Task title + duration" (e.g., "Solve graphs 60min")</p>
        </form>

        {/* Task List with Drag & Drop */}
        {tasks.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-3">
              <SortableContext
                items={tasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {tasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onUpdate={handleUpdateTask}
                  />
                ))}
              </SortableContext>
            </div>
          </DndContext>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-12 bg-gray-900/30 border border-dashed border-gray-700/50 rounded-2xl">
            <p className="text-gray-500 text-sm">No tasks yet. Add one to get started! 🚀</p>
          </div>
        )}
      </div>

      {/* Error Cards */}
      {planError && (
        <section className="bg-red-900/20 border border-red-500/50 rounded-3xl p-6 shadow-[0_0_20px_rgba(239,68,68,0.1)] flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="text-2xl">❌</div>
          <div className="flex-1">
            <h3 className="text-red-400 font-bold mb-1">Plan Generation Failed</h3>
            <p className="text-red-200 text-sm">{planError}</p>
          </div>
          <button
            onClick={handleGeneratePlan}
            className="text-red-400 hover:text-red-300 text-sm font-semibold underline whitespace-nowrap mt-1"
          >
            Try Again
          </button>
        </section>
      )}
      {analysisError && (
        <section className="bg-red-900/20 border border-red-500/50 rounded-3xl p-6 shadow-[0_0_20px_rgba(239,68,68,0.1)] flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="text-2xl">❌</div>
          <div className="flex-1">
            <h3 className="text-red-400 font-bold mb-1">Analysis Failed</h3>
            <p className="text-red-200 text-sm">{analysisError}</p>
          </div>
          <button
            onClick={handleAnalyze}
            className="text-red-400 hover:text-red-300 text-sm font-semibold underline whitespace-nowrap mt-1"
          >
            Retry
          </button>
        </section>
      )}

      {/* Tomorrow Plan Result Section */}
      {tomorrowPlan && (
        <section className="bg-gray-900 border border-emerald-500/30 rounded-3xl p-8 shadow-[0_0_20px_rgba(16,185,129,0.1)] animate-in slide-in-from-top-4 duration-500 flex flex-col gap-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-800/60">
            <div className="flex items-center gap-3">
              <span className="text-2xl drop-shadow-md">✨</span>
              <h3 className="text-xl font-bold text-white tracking-tight">Tomorrow Plan</h3>
            </div>
            <span className="text-xs text-emerald-500 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full whitespace-nowrap overflow-hidden text-ellipsis shadow-inner">
              {tomorrowPlan.focus}
            </span>
          </div>
          
          <div className="bg-gray-950/50 p-4 border border-gray-800/60 rounded-2xl flex items-start gap-4">
             <span className="text-xl">🤖</span>
             <p className="text-gray-300 text-sm leading-relaxed">{tomorrowPlan.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tomorrowPlan.timeBlocks?.map((block: any, idx: number) => (
              <div key={idx} className="bg-gray-950/80 rounded-2xl p-6 border border-emerald-500/20 transition-all hover:bg-gray-900/60 hover:border-emerald-500/40 flex flex-col gap-4 shadow-lg shadow-emerald-900/5">
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-emerald-500/50">●</span> {block.label}
                </h4>
                <ul className="space-y-3 text-sm text-gray-300">
                  {block.tasks.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-emerald-500/50 mt-1 flex-shrink-0 text-xs">▹</span> 
                      <span className="leading-snug font-medium text-gray-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
{/* AI Analysis Result Section */}
      {analysisResult && (
        <section className="bg-gray-900 border border-blue-500/30 rounded-3xl p-8 shadow-[0_0_20px_rgba(59,130,246,0.1)] animate-in slide-in-from-top-4 duration-500 flex flex-col gap-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-800/60">
            <div className="flex items-center gap-3">
              <span className="text-2xl drop-shadow-md">✨</span>
              <h3 className="text-xl font-bold text-white tracking-tight">AI Assistant</h3>
            </div>
            <span className="text-xs text-gray-500 font-medium bg-gray-800/50 px-3 py-1 rounded-full">
              Generated just now
            </span>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="bg-gray-950/80 rounded-2xl p-6 border border-blue-500/20 transition-all hover:bg-gray-900/60 hover:border-blue-500/40">
              <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-3 mb-4">
                <span className="text-lg">📈</span> Insights
              </h4>
              <ul className="space-y-3 text-sm text-gray-300">
                {analysisResult.insights.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-blue-500 mt-1 text-[10px]">●</span> 
                    <span className="leading-relaxed font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-gray-950/80 rounded-2xl p-6 border border-orange-500/20 transition-all hover:bg-gray-900/60 hover:border-orange-500/40">
              <h4 className="text-sm font-bold text-orange-400 uppercase tracking-widest flex items-center gap-3 mb-4">
                <span className="text-lg">⚠️</span> Improvements
              </h4>
              <ul className="space-y-3 text-sm text-gray-300">
                {analysisResult.improvements.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-orange-500 mt-1 text-[10px]">●</span> 
                    <span className="leading-relaxed font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-950/80 rounded-2xl p-6 border border-green-500/20 transition-all hover:bg-gray-900/60 hover:border-green-500/40">
              <h4 className="text-sm font-bold text-green-400 uppercase tracking-widest flex items-center gap-3 mb-4">
                <span className="text-lg">✅</span> Next Day Plan
              </h4>
              <ul className="space-y-3 text-sm text-gray-300">
                {analysisResult.nextDayPlan.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-green-500 mt-1 text-[10px]">●</span> 
                    <span className="leading-relaxed font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 1: Quick Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/60 border border-gray-800/40 rounded-xl p-6 text-center hover:border-gray-700/60 transition-colors">
          <p className="text-3xl font-bold text-green-400 mb-2">{completionPercentage}%</p>
          <p className="text-xs font-semibold text-gray-400 uppercase">Consistency</p>
        </div>
        <div className="bg-gray-900/60 border border-gray-800/40 rounded-xl p-6 text-center hover:border-gray-700/60 transition-colors">
          <p className="text-3xl font-bold text-blue-400 mb-2">{completedTasks}/{totalTasks}</p>
          <p className="text-xs font-semibold text-gray-400 uppercase">Tasks Done</p>
        </div>
        <div className="bg-gray-900/60 border border-gray-800/40 rounded-xl p-6 text-center hover:border-gray-700/60 transition-colors">
          <p className="text-3xl font-bold text-purple-400 mb-2">{focusHours}h</p>
          <p className="text-xs font-semibold text-gray-400 uppercase">Focus Time</p>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;