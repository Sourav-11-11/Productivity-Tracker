const fs = require('fs');
let txt = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const tpl = `
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
`;

txt = txt.replace('{/* AI Analysis Result Section */}', tpl + '{/* AI Analysis Result Section */}');
fs.writeFileSync('src/pages/Dashboard.tsx', txt);
console.log('Added tomorrow plan section!');
