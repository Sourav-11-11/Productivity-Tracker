import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingData {
  goals: string[]; // Multiple selected goals (Placement, DSA, Productivity)
  primaryGoal: string | null; // Main focus selected from goals
  level: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  availableTime: '<2h' | '2–4h' | '4–8h' | null;
  completed: boolean;
}

interface OnboardingState extends OnboardingData {
  toggleGoal: (goal: string) => void; // Add/remove goal from selection
  setPrimaryGoal: (goal: string | null) => void;
  setLevel: (level: OnboardingData['level']) => void;
  setAvailableTime: (time: OnboardingData['availableTime']) => void;
  completeOnboarding: () => void;
  reset: () => void;
  // Compatibility with old code
  goal?: string | null;
  setGoal?: (goal: string | null) => void;
}

const INITIAL_STATE: OnboardingData = {
  goals: [],
  primaryGoal: null,
  level: null,
  availableTime: null,
  completed: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      toggleGoal: (goal) => set((state) => {
        const newGoals = state.goals.includes(goal)
          ? state.goals.filter(g => g !== goal)
          : [...state.goals, goal];
        
        // If primary goal was removed, clear it
        const newPrimaryGoal = newGoals.includes(state.primaryGoal ?? '') ? state.primaryGoal : null;
        
        return { 
          goals: newGoals,
          primaryGoal: newPrimaryGoal
        };
      }),

      setPrimaryGoal: (goal) => set({ primaryGoal: goal }),

      setLevel: (level) => set({ level }),
      setAvailableTime: (availableTime) => set({ availableTime }),

      completeOnboarding: () => set({ completed: true }),

      reset: () => set(INITIAL_STATE),
    }),
    { name: 'onboarding-storage' }
  )
);
