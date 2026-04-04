import { useState, useEffect } from 'react';

export type EndelMode = 'MORNING' | 'AFTERNOON' | 'EVENING';

interface EndelState {
  mode: EndelMode;
  gradientClass: string;
  animationClass: string;
  subtitle: string;
}

export const useEndelState = (): EndelState => {
  const [stamp, setStamp] = useState(new Date().getHours());

  useEffect(() => {
    // Check every minute if the hour changed to update ambient state
    const interval = setInterval(() => {
      setStamp(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (stamp >= 5 && stamp < 12) {
    return {
      mode: 'MORNING',
      gradientClass: 'from-[#FAFAFA] to-transparent',
      animationClass: 'animate-pulse opacity-[0.03]',
      subtitle: 'Ready to build.'
    };
  } else if (stamp >= 12 && stamp < 18) {
    return {
      mode: 'AFTERNOON',
      gradientClass: 'from-[#FAFAFA] to-transparent',
      animationClass: 'animate-pulse opacity-[0.05]',
      subtitle: 'Stay focused.'
    };
  } else {
    return {
      mode: 'EVENING',
      gradientClass: 'from-[#525252] to-transparent',
      animationClass: 'animate-pulse opacity-[0.02]',
      subtitle: 'Rest and recharge.'
    };
  }
};
