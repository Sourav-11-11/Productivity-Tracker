import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface DailyStats {
  date: string;
  completed: number;
  total: number;
  percentage: number;
  focusTime: number;
  missedTasks: string[];
  completedTasks: string[];
}

export const Progress: React.FC = () => {
  const { tasks } = useStore();
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);

  // Load historical data (365 days)
  const statsMapping = useMemo(() => {
    const stats: Record<string, DailyStats> = {};
    const timetable = JSON.parse(
        localStorage.getItem('daily_timetable_v3') || 
        localStorage.getItem('daily_timetable_v2') || 
        localStorage.getItem('daily_timetable') || '[]'
    );

    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      stats[dateStr] = {
          date: dateStr,
          completed: 0,
          total: 0,
          percentage: 0,
          focusTime: 0,
          missedTasks: [],
          completedTasks: []
      };

      const dailyCompsStr = localStorage.getItem(`timetable_comps_${dateStr}`);
      let comps: Record<string, boolean> = {};
      if (dailyCompsStr) {
          try { comps = JSON.parse(dailyCompsStr); } catch (e) {}
      }

      timetable.forEach((item: any) => {
          stats[dateStr].total += 1;
          if (comps[item.id]) {
              stats[dateStr].completed += 1;
              stats[dateStr].focusTime += (item.duration || 0);
              stats[dateStr].completedTasks.push(item.activity);
          } else {
              stats[dateStr].missedTasks.push(item.activity);
          }
      });
    }

    // Include general tasks from useStore 
    tasks.forEach((task: any) => {
        const dateStr = new Date(task.createdAt).toISOString().split('T')[0];
        if (stats[dateStr]) {
            stats[dateStr].total += 1;
            if (task.completed) {
                stats[dateStr].completed += 1;
                stats[dateStr].completedTasks.push(task.title);
            } else {
                stats[dateStr].missedTasks.push(task.title);
            }
        }
    });

    Object.keys(stats).forEach(dateStr => {
        const st = stats[dateStr];
        st.percentage = st.total > 0 ? Math.round((st.completed / st.total) * 100) : 0;
    });

    return stats;
  }, [tasks]);

  const statsList = useMemo(() => Object.values(statsMapping), [statsMapping]);

  // Streak & Discipline Calc
  const { currentStreak, bestStreak, disciplineScore } = useMemo(() => {
     let tempStreak = 0;
     let longest = 0;
     let consistencyScore = 0;

     // Calculate over last 30 days for score
     const last30 = statsList.slice(-30);
     last30.forEach(s => {
         if (s.percentage > 50) {
             tempStreak++;
             consistencyScore += s.percentage;
             if (tempStreak > longest) longest = tempStreak;
         } else {
             tempStreak = 0;
         }
     });

     // Real current streak
     let realCurrent = 0;
     for (let i = statsList.length - 1; i >= 0; i--) {
        if (statsList[i].percentage > 40 || statsList[i].date === todayStr) {
            if (statsList[i].percentage > 40) realCurrent++;
        } else {
            break;
        }
     }

     const discScore = last30.length > 0 ? Math.round(consistencyScore / last30.length) : 0;

     return { currentStreak: realCurrent, bestStreak: Math.max(longest, realCurrent), disciplineScore: discScore };
  }, [statsList, todayStr]);

  const { last7, prev7 } = useMemo(() => {
     const last14 = statsList.slice(-14);
     return {
         last7: last14.slice(7, 14),
         prev7: last14.slice(0, 7)
     };
  }, [statsList]);

  // Aggregates
  const focusLast7 = last7.reduce((a, b) => a + b.focusTime, 0);
  const focusPrev7 = prev7.reduce((a, b) => a + b.focusTime, 0);
  const tasksLast7 = last7.reduce((a, b) => a + b.completed, 0);
  const tasksPrev7 = prev7.reduce((a, b) => a + b.completed, 0);

  // Generate Insights
  const insights = useMemo(() => {
     const lines = [];
     if (focusLast7 > focusPrev7) lines.push("Focus time is trending upwards this week.");
     else if (focusLast7 < focusPrev7) lines.push("You spent less time deep working this week compared to last.");
     else lines.push("You maintained exactly the same focus time as last week.");
     
     if (currentStreak > 3) lines.push(`You are incredibly consistent, maintaining a ${currentStreak}-day momentum.`);
     else lines.push("Consistency is low right now. Focus on finishing your deep work blocks to rebuild the streak.");

     const recentMissed = last7.flatMap(d => d.missedTasks).map(t => t.toLowerCase());
     if (recentMissed.some(m => m.includes('dsa') || m.includes('solve'))) {
         lines.push("You've been skipping core problem solving blocks.");
     } else if (recentMissed.some(m => m.includes('gym') || m.includes('workout'))) {
         lines.push("Physical training has been neglected recently.");
     } else if (recentMissed.some(m => m.includes('study'))) {
         lines.push("Study sessions are being missed.");
     } else if (tasksLast7 > 0) {
         lines.push("Core disciplines are locked in perfectly.");
     }
     return lines.slice(0, 3);
  }, [focusLast7, focusPrev7, currentStreak, last7, tasksLast7]);

  const dayData = statsMapping[selectedDate || todayStr];

  // Recharts custom tooltips
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      return (
        <div className="bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#262626] rounded-xl px-6 py-4 shadow-[0_20px_40px_-20px_rgba(0,0,0,1)]">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#525252] mb-2 font-medium">Focus Output</p>
          <p className="text-3xl font-light tracking-tight text-[#FAFAFA]">{Math.floor(val/60)}<span className="text-[#A3A3A3] text-sm ml-1 mr-2">h</span>{val%60}<span className="text-[#A3A3A3] text-sm ml-1">m</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-full bg-transparent py-8 px-4 md:px-8 text-[#FAFAFA] font-sans selection:bg-[#FAFAFA] selection:text-[#0A0A0A]">
      <div className="max-w-[70rem] mx-auto space-y-12">
        
        {/* HEADER */}
        <header className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight text-[#FAFAFA] mix-blend-screen leading-tight">
               Reflection
            </h1>
            <div className="flex gap-12 mt-4">
                <div className="group cursor-default">
                    <div className="text-[10px] uppercase tracking-widest text-[#525252] mb-1 group-hover:text-[#A3A3A3] transition-colors">Current Streak</div>
                    <div className="text-3xl font-light text-[#FAFAFA] tracking-tighter">{currentStreak} <span className="text-sm text-[#525252] tracking-normal font-sans">Days</span></div>
                </div>
                <div className="group cursor-default">
                    <div className="text-[10px] uppercase tracking-widest text-[#525252] mb-1 group-hover:text-[#A3A3A3] transition-colors">Best Streak</div>
                    <div className="text-3xl font-light text-[#FAFAFA] tracking-tighter">{bestStreak} <span className="text-sm text-[#525252] tracking-normal font-sans">Days</span></div>
                </div>
            </div>
            {insights[0] && (
                <div className="text-lg md:text-xl font-light text-[#A3A3A3] mt-8 pt-4 border-t border-[#141414] max-w-2xl">
                    {insights[0]}
                </div>
            )}
        </header>

        {/* WEEKLY PERFORMANCE */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
            <div className="border border-[#262626] bg-[#141414]/20 rounded-2xl p-8 hover:bg-[#141414]/50 transition-colors">
                <div className="text-[10px] uppercase tracking-widest text-[#525252] mb-6">Focus Weekly Output</div>
                <div className="text-4xl font-light text-[#FAFAFA] mb-3 tracking-tighter">{Math.floor(focusLast7 / 60)}h {focusLast7 % 60}m</div>
                <div className={`text-xs ${focusLast7 >= focusPrev7 ? 'text-[#A3A3A3]' : 'text-[#525252]'}`}>
                    {focusLast7 >= focusPrev7 ? `↑ +${Math.floor((focusLast7 - focusPrev7)/60)}h ${(focusLast7 - focusPrev7)%60}m output increased` : `↓ -${Math.floor((focusPrev7 - focusLast7)/60)}h ${(focusPrev7 - focusLast7)%60}m dropped from last week`}
                </div>
            </div>

            <div className="border border-[#262626] bg-[#141414]/20 rounded-2xl p-8 flex flex-col justify-between hover:bg-[#141414]/50 transition-colors">
                <div>
                    <div className="text-[10px] uppercase tracking-widest text-[#525252] mb-6">Tasks Executed</div>
                    <div className="text-4xl font-light text-[#FAFAFA] mb-3 tracking-tighter">{tasksLast7}</div>
                </div>
                <div className={`text-xs ${tasksLast7 >= tasksPrev7 ? 'text-[#A3A3A3]' : 'text-[#525252]'}`}>
                    {tasksLast7 >= tasksPrev7 ? `↑ +${tasksLast7 - tasksPrev7} blocks completed` : `↓ -${tasksPrev7 - tasksLast7} blocks completed`}
                </div>
            </div>

            <div className="border border-[#262626] bg-[#141414]/20 rounded-2xl p-8 flex flex-col justify-between hover:bg-[#141414]/50 transition-colors">
                <div>
                    <div className="text-[10px] uppercase tracking-widest text-[#525252] mb-6">Discipline Alg</div >
                    <div className="text-4xl font-light text-[#FAFAFA] mb-3 tracking-tighter">{disciplineScore}<span className="text-[#525252] text-xl tracking-normal">/100</span></div>
                </div>
                <div className="text-[10px] text-[#525252]">
                    Based on 30-day consistency density
                </div>
            </div>
        </section>

        {/* HEATMAP */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both border-t border-[#141414] pt-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-[10px] uppercase tracking-widest text-[#525252]">
                        1-Year Execution Matrix
                    </h2>
                    <p className="text-[#A3A3A3] text-sm mt-1 font-light">365 Days of Consistency</p>
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-end gap-2 text-xs text-[#525252] mb-1">
                    <span>Less</span>
                    <div className="flex gap-1 mx-1">
                        <div className="w-3.5 h-3.5 rounded-[2px] bg-[#141414] border border-[#262626]" />
                        <div className="w-3.5 h-3.5 rounded-[2px] bg-[#262626]" />
                        <div className="w-3.5 h-3.5 rounded-[2px] bg-[#525252]" />
                        <div className="w-3.5 h-3.5 rounded-[2px] bg-[#A3A3A3]" />
                        <div className="w-3.5 h-3.5 rounded-[2px] bg-[#FAFAFA]" />
                    </div>
                    <span>More</span>
                </div>
            </div>
            
            <div className="overflow-x-auto pb-6 hide-scrollbar flex justify-start rounded-2xl w-full">
                <div className="flex flex-col gap-2 w-full">
                    <div className="flex gap-[3px] shrink-0 mx-auto md:mx-0 w-full justify-between lg:justify-start">
                        {/* Day Labels */}
                        <div className="flex flex-col gap-[3px] text-[10px] text-[#525252] mr-2 justify-between py-[2px] h-[78px]">
                            <span className="leading-none mt-[8px]">Mon</span>
                            <span className="leading-none mt-[18px]">Wed</span>
                            <span className="leading-none mt-[18px]">Fri</span>
                        </div>

                        {/* Grid */}
                        {(() => {
                            const heatmapData = statsList.slice(-365);
                            if (heatmapData.length === 0) return null;
                            
                            // Align starting day
                            const firstDayOfWeek = new Date(heatmapData[0].date).getDay();
                            const paddedData = [...Array(firstDayOfWeek).fill(null), ...heatmapData];
                            
                            const weeks = [];
                            for (let i = 0; i < paddedData.length; i += 7) {
                                weeks.push(paddedData.slice(i, i + 7));
                            }

                            // Inject month labels
                            let lastMonth = -1;
                            
                            return (
                                <div className="flex flex-col w-full">
                                    <div className="flex gap-[3px] mb-1.5 h-3">
                                        {weeks.map((week, i) => {
                                            const firstValidDay = week.find(d => d !== null);
                                            if (firstValidDay) {
                                                const month = new Date(firstValidDay.date).getMonth();
                                                if (month !== lastMonth) {
                                                    lastMonth = month;
                                                    const monthStr = new Date(firstValidDay.date).toLocaleString('default', { month: 'short' });
                                                    return <div key={'m'+i} className="text-[10px] text-[#525252] min-w-[12px]">{monthStr}</div>;
                                                }
                                            }
                                            return <div key={'m'+i} className="min-w-[8px] md:min-w-[10.5px] w-full" />;
                                        })}
                                    </div>
                                    <div className="flex gap-[3px]">
                                        {weeks.map((week, colIndex) => (
                                            <div key={colIndex} className="flex flex-col gap-[3px] shrink-0">
                                                {week.map((s, ri) => {
                                                    if (!s) return <div key={ri} className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-[1px] bg-transparent" />;
                                                    
                                                    let intensityClass = "bg-[#141414] border border-[#262626]/50 hover:border-[#525252]";
                                                    if (s.percentage > 0 && s.percentage <= 30) intensityClass = "bg-[#262626]";
                                                    else if (s.percentage > 30 && s.percentage <= 60) intensityClass = "bg-[#525252]";
                                                    else if (s.percentage > 60 && s.percentage <= 90) intensityClass = "bg-[#A3A3A3]";
                                                    else if (s.percentage > 90) intensityClass = "bg-[#FAFAFA]";

                                                    const isSelected = selectedDate === s.date;
                                                    const isToday = s.date === todayStr;

                                                    return (
                                                        <button 
                                                            key={s.date}
                                                            onClick={() => setSelectedDate(s.date)}
                                                            className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-[1px] transition-all duration-300 focus:outline-none ${intensityClass} ${isSelected ? 'ring-1 ring-offset-[#0A0A0A] ring-offset-1 ring-[#FAFAFA] scale-125 z-10' : 'hover:scale-150 hover:z-10 shadow-sm'} ${isToday && !isSelected ? 'ring-1 ring-[#525252]' : ''}`}
                                                            title={`${s.date}: ${s.percentage}% (${s.completed}/${s.total} Blocks)`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </section>

        {/* DAILY BREAKDOWN PANEL (Tied to selected heatmap day) */}
        {dayData && (
            <section className="bg-[#141414]/20 border border-[#262626] rounded-2xl p-8 md:p-12 animate-in fade-in duration-500">
                <h3 className="text-[10px] uppercase tracking-widest text-[#525252] mb-8">
                    {dayData.date === todayStr ? "Today's Reflection" : `Reflection: ${dayData.date}`}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div>
                        <div className="text-3xl font-light mb-8 text-[#FAFAFA] tracking-tighter">
                            {dayData.percentage}% Executed <span className="text-[#A3A3A3] text-sm ml-2 font-sans tracking-normal">({Math.floor(dayData.focusTime/60)}h {dayData.focusTime%60}m)</span>
                        </div>
                        
                        <div className="space-y-6 text-sm">
                            {(dayData.completedTasks.length > 0 || dayData.missedTasks.length === 0) ? (
                                <div>
                                    <div className="text-[#525252] mb-5 text-[10px] uppercase tracking-widest">Blocks Completed</div>
                                    <ul className="space-y-4">
                                        {dayData.completedTasks.map((t, i) => (
                                            <li key={i} className="text-[#A3A3A3] font-light flex items-center gap-4"><span className="w-1.5 h-1.5 bg-[#525252] rounded-full inline-block"></span>{t}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div>
                        {dayData.missedTasks.length > 0 && (
                            <div>
                                <div className="text-[#525252] mb-5 text-[10px] uppercase tracking-widest">Missed Opportunities</div>
                                <ul className="space-y-4">
                                    {dayData.missedTasks.map((t, i) => (
                                        <li key={i} className="text-[#525252] font-light flex items-center gap-4 line-through decoration-[#262626]"><span className="w-1.5 h-1.5 bg-[#262626] rounded-full inline-block"></span>{t}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        )}

        {/* FOCUS TREND CHART */}
        <section className="space-y-8 pt-8">
            <div className="text-[10px] uppercase tracking-widest text-[#525252]">14-Day Focus Velocity Curve</div>
            <div className="h-64 w-full opacity-80 hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={last7.concat(prev7).reverse().slice(-14)} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#262626', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Line 
                            type="monotone" 
                            dataKey="focusTime" 
                            stroke="#FAFAFA" 
                            strokeWidth={2} 
                            dot={{ r: 3, fill: '#0A0A0A', stroke: '#525252', strokeWidth: 1.5 }}
                            activeDot={{ r: 5, fill: '#FAFAFA', stroke: '#0A0A0A', strokeWidth: 2 }}
                            animationDuration={2000}
                            animationEasing="ease-in-out"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </section>

        {/* MINIMAL INSIGHTS LIST */}
        <section className="border-t border-[#141414] pt-12 pb-32">
             <div className="text-[10px] uppercase tracking-widest text-[#525252] mb-8">Execution Insights</div>
             <div className="space-y-6">
                 {insights.map((insight, idx) => (
                     <p key={idx} className="text-[#A3A3A3] font-light text-lg leading-relaxed max-w-2xl border-l border-[#262626] pl-6 transition-colors hover:border-[#525252] hover:text-[#FAFAFA]">
                         {insight}
                     </p>
                 ))}
             </div>
        </section>
      </div>
    </div>
  );
};
