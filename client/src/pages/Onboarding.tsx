import React, { useState } from 'react';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { ChevronRight, CheckCircle, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

type Step = 'goals' | 'primaryGoal' | 'level' | 'time' | 'complete';

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { goals, primaryGoal, level, availableTime, toggleGoal, setPrimaryGoal, setLevel, setAvailableTime, completeOnboarding } = useOnboardingStore();
  const [currentStep, setCurrentStep] = useState<Step>('goals');
  const [error, setError] = useState<string | null>(null);

  const allGoals = ['Placement', 'DSA', 'Productivity'];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const times = ['<2h', '2–4h', '4–8h'];

  const handleNext = (step: Step) => {
    setError(null);
    setTimeout(() => {
      setCurrentStep(step);
    }, 0);
  };

  const handleGoalsNext = () => {
    if (goals.length === 0) {
      setError('Please select at least one goal');
      return;
    }
    handleNext('primaryGoal');
  };

  const handlePrimaryGoalSelect = (goal: string) => {
    setPrimaryGoal(goal);
    handleNext('level');
  };

  const handleLevelSelect = (selected: string) => {
    setLevel(selected as 'Beginner' | 'Intermediate' | 'Advanced');
    handleNext('time');
  };

  const handleTimeSelect = (selected: string) => {
    setAvailableTime(selected as '<2h' | '2–4h' | '4–8h');
    handleNext('complete');
  };

  const handleComplete = () => {
    completeOnboarding();
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      {/* Animated Background Blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl">⚡</span>
            <h1 className="text-3xl font-bold text-white">LetsMakeIt</h1>
          </div>
          <p className="text-gray-400 text-sm">Personalized AI-powered productivity</p>
        </div>

        {/* Step 1: Goals (Multi-Select) */}
        <div
          className={`transition-all duration-300 ${
            currentStep === 'goals'
              ? 'opacity-100 scale-100'
              : 'absolute inset-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/60 rounded-3xl p-8 shadow-2xl">
            <div className="mb-8">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🎯</span>
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-2">What are your goals?</h2>
              <p className="text-gray-400 text-sm text-center">Select all that apply</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5 flex items-start gap-2">
                <span className="text-red-400 text-sm font-medium flex-1">{error}</span>
              </div>
            )}

            <div className="space-y-3 mb-6">
              {allGoals.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGoal(g)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 font-medium ${
                    goals.includes(g)
                      ? 'bg-blue-500/20 border-blue-500/60 text-blue-300'
                      : 'bg-gray-800/40 border-gray-700/40 text-gray-300 hover:bg-gray-800/60 hover:border-gray-600/60'
                  }`}
                >
                  <span>{g}</span>
                  {goals.includes(g) && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>

            <button
              onClick={handleGoalsNext}
              disabled={goals.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>

            {/* Progress indicator */}
            <div className="flex gap-1.5 justify-center mt-8">
              <div className="w-2 h-2 rounded-full bg-blue-500/60" />
              <div className="w-2 h-2 rounded-full bg-gray-600/40" />
              <div className="w-2 h-2 rounded-full bg-gray-600/40" />
              <div className="w-2 h-2 rounded-full bg-gray-600/40" />
              <div className="w-2 h-2 rounded-full bg-gray-600/40" />
            </div>
          </div>
        </div>

        {/* Step 2: Primary Goal */}
        <div
          className={`transition-all duration-300 ${
            currentStep === 'primaryGoal'
              ? 'opacity-100 scale-100'
              : 'absolute inset-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/60 rounded-3xl p-8 shadow-2xl">
            <div className="mb-8">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">⭐</span>
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-2">Main focus?</h2>
              <p className="text-gray-400 text-sm text-center">Pick your primary goal</p>
            </div>

            <div className="space-y-3">
              {goals.map((g) => (
                <button
                  key={g}
                  onClick={() => handlePrimaryGoalSelect(g)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 font-medium ${
                    primaryGoal === g
                      ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300'
                      : 'bg-gray-800/40 border-gray-700/40 text-gray-300 hover:bg-gray-800/60 hover:border-gray-600/60'
                  }`}
                >
                  <span>{g}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ))}
            </div>

            {/* Progress indicator */}
            <div className="flex gap-1.5 justify-center mt-8">
              <div className="w-2 h-2 rounded-full bg-blue-500/60" />
              <div className="w-2 h-2 rounded-full bg-indigo-500/60" />
              <div className="w-2 h-2 rounded-full bg-gray-600/40" />
              <div className="w-2 h-2 rounded-full bg-gray-600/40" />
              <div className="w-2 h-2 rounded-full bg-gray-600/40" />
            </div>
          </div>
        </div>

        {/* Step 3: Level */}
        <div
          className={`transition-all duration-300 ${
            currentStep === 'level'
              ? 'opacity-100 scale-100'
              : 'absolute inset-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/60 rounded-3xl p-8 shadow-2xl">
            <div className="mb-8">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">📚</span>
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-2">Your experience level?</h2>
              <p className="text-gray-400 text-sm text-center">We'll adjust difficulty accordingly</p>
            </div>

            <div className="space-y-3">
              {levels.map((lv) => (
                <button
                  key={lv}
                  onClick={() => handleLevelSelect(lv)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 font-medium ${
                    level === lv
                      ? 'bg-purple-500/20 border-purple-500/60 text-purple-300'
                      : 'bg-gray-800/40 border-gray-700/40 text-gray-300 hover:bg-gray-800/60 hover:border-gray-600/60'
                  }`}
                >
                  <span>{lv}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ))}
            </div>

            {/* Progress indicator */}
            <div className="flex gap-1.5 justify-center mt-8">
              <div className="w-2 h-2 rounded-full bg-blue-500/60" />
              <div className="w-2 h-2 rounded-full bg-indigo-500/60" />
              <div className="w-2 h-2 rounded-full bg-purple-500/60" />
              <div className="w-2 h-2 rounded-full bg-gray-600/40" />
              <div className="w-2 h-2 rounded-full bg-gray-600/40" />
            </div>
          </div>
        </div>

        {/* Step 4: Time */}
        <div
          className={`transition-all duration-300 ${
            currentStep === 'time'
              ? 'opacity-100 scale-100'
              : 'absolute inset-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/60 rounded-3xl p-8 shadow-2xl">
            <div className="mb-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">⏱️</span>
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-2">Daily available time?</h2>
              <p className="text-gray-400 text-sm text-center">We'll create realistic plans</p>
            </div>

            <div className="space-y-3">
              {times.map((time) => (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 font-medium ${
                    availableTime === time
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                      : 'bg-gray-800/40 border-gray-700/40 text-gray-300 hover:bg-gray-800/60 hover:border-gray-600/60'
                  }`}
                >
                  <span>{time}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ))}
            </div>

            {/* Progress indicator */}
            <div className="flex gap-1.5 justify-center mt-8">
              <div className="w-2 h-2 rounded-full bg-blue-500/60" />
              <div className="w-2 h-2 rounded-full bg-indigo-500/60" />
              <div className="w-2 h-2 rounded-full bg-purple-500/60" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
              <div className="w-2 h-2 rounded-full bg-gray-600/40" />
            </div>
          </div>
        </div>

        {/* Step 5: Complete */}
        <div
          className={`transition-all duration-300 ${
            currentStep === 'complete'
              ? 'opacity-100 scale-100'
              : 'absolute inset-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/60 rounded-3xl p-8 shadow-2xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center animate-bounce">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">All set! 🎉</h2>
            <p className="text-gray-400 text-sm mb-6">Your personalized profile:</p>

            <div className="bg-gray-950/50 border border-gray-800/60 rounded-2xl p-6 mb-8 text-left space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Goals</span>
                <div className="flex gap-2">
                  {goals.map((g) => (
                    <span key={g} className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-gray-800/40 pt-4">
                <span className="text-gray-400">Main Focus</span>
                <span className="text-white font-semibold">⭐ {primaryGoal}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-800/40 pt-4">
                <span className="text-gray-400">Level</span>
                <span className="text-white font-semibold">📚 {level}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-800/40 pt-4">
                <span className="text-gray-400">Time</span>
                <span className="text-white font-semibold">⏱️ {availableTime}</span>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
            >
              Start Exploring →
            </button>

            <p className="text-gray-500 text-xs mt-4">
              You can update these settings anytime in the dashboard
            </p>

            {/* Progress indicator */}
            <div className="flex gap-1.5 justify-center mt-8">
              <div className="w-2 h-2 rounded-full bg-blue-500/60" />
              <div className="w-2 h-2 rounded-full bg-indigo-500/60" />
              <div className="w-2 h-2 rounded-full bg-purple-500/60" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
              <div className="w-2 h-2 rounded-full bg-green-500/60" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
