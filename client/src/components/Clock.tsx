import React, { useState, useEffect } from 'react';

export const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    let animationFrameId: number;
    
    // Update on animation frame for high precision
    const tick = () => {
      setTime(new Date());
      animationFrameId = requestAnimationFrame(tick);
    };
    
    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col items-start justify-center group pointer-events-none select-none">
      <div className="text-2xl font-light text-[#FAFAFA] tracking-tighter flex items-end gap-1">
        <span>{hours}</span>
        <span className="opacity-50 text-xl mb-[2px] animate-pulse">:</span>
        <span>{minutes}</span>
        <span className="text-xs text-[#A3A3A3] tracking-[0.1em] ml-1 mb-1 font-medium">{seconds}</span>
      </div>
      <div className="text-[10px] text-[#525252] tracking-[0.2em] uppercase mt-1">
        {dateStr}
      </div>
    </div>
  );
};
