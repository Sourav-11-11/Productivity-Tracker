import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type JobStatus = "Applied" | "OA" | "Interview" | "Offer" | "Rejected";

export interface Job {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  appliedDate: string;
  deadline?: string;
  notes?: string;
  position?: number; // Position within column for drag-reorder persistence
}

interface JobState {
  jobs: Job[];
  addJob: (job: Omit<Job, "id" | "appliedDate" | "position">) => void;
  updateJobStatus: (id: string, newStatus: JobStatus) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  reorderJobs: (jobIds: string[]) => void; // Reorder jobs based on provided order
}

export const useJobStore = create<JobState>()(
  persist(
    (set) => ({
      jobs: [],
      addJob: (jobData) => set((state) => ({
        jobs: [
          ...state.jobs,
          {
            ...jobData,
            id: Date.now().toString(),
            appliedDate: new Date().toISOString(),
            position: 0,
          }
        ]
      })),
      updateJobStatus: (id, status) => set((state) => ({
        jobs: state.jobs.map(j => j.id === id ? { ...j, status } : j)
      })),
      updateJob: (id, updates) => set((state) => ({
        jobs: state.jobs.map(j => j.id === id ? { ...j, ...updates } : j)
      })),
      deleteJob: (id) => set((state) => ({
        jobs: state.jobs.filter(j => j.id !== id)
      })),
      reorderJobs: (jobIds) => set((state) => ({
        jobs: state.jobs.map((job, index) => ({
          ...job,
          position: jobIds.indexOf(job.id) >= 0 ? jobIds.indexOf(job.id) : index
        })).sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
      })),
    }),
    { name: "job-applications-storage" }
  )
);
