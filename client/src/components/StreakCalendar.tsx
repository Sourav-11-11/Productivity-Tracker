import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';

const generateRealDays = () => {
    const days = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayStr = now.toISOString().split('T')[0];
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Adjust to Monday start
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    // Fill previous month blank days if needed
    for(let i = 0; i < startOffset; i++) {
        days.push({ date: null, dateStr: null, isToday: false });
    }

    // Fill current month
    for(let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        // Correct timezone offset for accurate day matching
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        const dStr = d.toISOString().split('T')[0];
        
        days.push({
            date: i,
            dateStr: dStr,
            isToday: dStr === todayStr
        });
    }

    return days;
};

export const StreakCalendar = () => {
    const weekDays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    const [days, setDays] = useState<any[]>([]);
    const [streakHistory, setStreakHistory] = useState<string[]>([]);
    
    const countStreak = (history: string[]) => {
        let count = 0;
        let d = new Date();
        const todayStr = d.toISOString().split('T')[0];
        d.setDate(d.getDate() - 1);
        const yesterdayStr = d.toISOString().split('T')[0];

        // Is today active? (doesn't break streak if not, just means we haven't done it yet)
        if (history.includes(todayStr)) {
            count++;
            d = new Date();
            d.setDate(d.getDate() - 1);
        } else if (history.includes(yesterdayStr)) {
            // Still active from yesterday
            d = new Date();
            d.setDate(d.getDate() - 1);
        } else {
            return 0; // broken
        }

        while (true) {
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            const str = d.toISOString().split('T')[0];
            if (history.includes(str)) {
                count++;
                d.setDate(d.getDate() - 1);
            } else {
                break;
            }
        }
        return count;
    };

    const [, setRefresh] = useState(0);

    const updateData = () => {
        setDays(generateRealDays());
        const data = JSON.parse(localStorage.getItem('streak_history') || '[]');
        setStreakHistory(data);
        setRefresh(r => r + 1); // Force re-render
    };

    useEffect(() => {
        updateData();
        window.addEventListener('streak_updated', updateData);
        return () => window.removeEventListener('streak_updated', updateData);
    }, []);

    const streakCount = countStreak(streakHistory);

    return (
        <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-sm p-6 shadow-2xl mx-auto my-12 transition-all">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xs text-[#525252] tracking-widest uppercase mb-1">{new Date().getFullYear()}</h2>
                    <h1 className="text-2xl font-light text-[#FAFAFA] tracking-tighter">
                        {new Date().toLocaleString('default', { month: 'long' })}
                    </h1>
                </div>
            </div>

            <div className="px-3 py-1.5 rounded-lg border border-orange-900/50 bg-orange-950/20 text-orange-400 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 mb-8">
                <Flame className="w-3 h-3 text-orange-500" /> Active Progress
            </div>

            <div className="grid grid-cols-7 gap-y-6 gap-x-2 text-center mb-8">
                {weekDays.map(d => (
                    <div key={d} className="text-[10px] text-[#525252] tracking-widest">{d}</div>
                ))}
                
                {days.map((d, i) => (
                    <div key={i} className="flex justify-center items-center h-8">
                        {d.date === null ? (
                            <span />
                        ) : d.isToday ? (
                            <div className={`w-8 h-8 rounded-full border border-[#FAFAFA]/20 flex items-center justify-center text-sm ${streakHistory.includes(d.dateStr) ? 'bg-[#FAFAFA] text-[#0A0A0A]' : 'bg-transparent text-[#FAFAFA]'}`}>
                                {d.date}
                            </div>
                        ) : streakHistory.includes(d.dateStr) ? (
                            <Flame className="w-5 h-5 text-orange-500" />
                        ) : (
                            <span className="text-sm text-[#525252]">{d.date}</span>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-6 border-t border-[#262626] flex items-center gap-3 text-xs text-[#A3A3A3]">
                <Flame className={`w-4 h-4 ${streakCount > 0 ? 'text-orange-500' : 'text-[#525252]'}`} />
                <span>You are on a <strong className="text-[#FAFAFA] font-medium">{streakCount}-day streak</strong> today.</span>
            </div>
        </div>
    );
};