import React from 'react';
import { ExternalLink, Code2, Users, Briefcase, GraduationCap, Building2, Terminal } from 'lucide-react';

const ACCOUNTS = [
  {
    category: "Coding & Development",
    links: [
      { name: "GitHub", url: "https://github.com/Sourav-11-11", icon: <Terminal className="w-5 h-5 text-[#FAFAFA]" />, desc: "Projects & Repositories", color: "hover:border-gray-500" },
      { name: "LeetCode", url: "https://leetcode.com/problemset/", icon: <Code2 className="w-5 h-5 text-[#FFA116]" />, desc: "Problem Solving & DSA", color: "hover:border-[#FFA116]/50" }
    ]
  },
  {
    category: "Professional Networking",
    links: [
      { name: "LinkedIn", url: "https://www.linkedin.com/in/sourav-vemuru11/", icon: <Users className="w-5 h-5 text-[#0A66C2]" />, desc: "Professional Profile", color: "hover:border-[#0A66C2]/50" }
    ]
  },
  {
    category: "Internships & Opportunities",
    links: [
      { name: "Unstop", url: "https://unstop.com/", icon: <GraduationCap className="w-5 h-5 text-[#1C4ED8]" />, desc: "Hackathons & Challenges", color: "hover:border-blue-500/50" },
      { name: "Internshala", url: "https://internshala.com/", icon: <Building2 className="w-5 h-5 text-[#127FFF]" />, desc: "Internship Hunting", color: "hover:border-blue-400/50" },
      { name: "Wellfound", url: "https://wellfound.com/", icon: <Briefcase className="w-5 h-5 text-[#E63F38]" />, desc: "Startup Jobs", color: "hover:border-red-500/50" }
    ]
  }
];

export const Accounts: React.FC = () => {
  return (
    <div className="min-h-full bg-transparent py-4 px-8 text-[#FAFAFA] font-sans selection:bg-[#FAFAFA] selection:text-[#0A0A0A] overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col items-start gap-2 animate-in fade-in slide-in-from-bottom-10 duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
          <h1 className="text-[9px] uppercase tracking-[0.5em] text-[#525252] font-medium">Platform Links</h1>   
          <p className="text-2xl md:text-3xl font-light tracking-tighter text-[#FAFAFA] mix-blend-screen leading-tight">
            Quick access to your presence.
          </p>
          <p className="text-[11px] text-[#A3A3A3] tracking-wide mt-1 italic flex items-center gap-2">
            Central hub for coding profiles, networking, and hiring platforms.
          </p>
        </header>

        <div className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-5 duration-[2000ms] delay-300 fill-mode-both ease-[cubic-bezier(0.16,1,0.3,1)]">
          {ACCOUNTS.map((section, idx) => (
            <section key={idx} className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-[9px] uppercase tracking-[0.3em] font-medium text-[#525252]">
                  {section.category}
                </h2>
                <div className="h-[1px] flex-1 bg-[#141414]" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {section.links.map((link, lidx) => (
                  <a
                    key={lidx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex flex-col p-4 bg-[#0A0A0A] hover:bg-[#0F0F0F] border border-[#141414] hover:border-[#262626] rounded-xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${link.color}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 bg-[#0A0A0A] rounded-lg border border-[#141414] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(250,250,250,0.05)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] text-[#FAFAFA]">
                        <div className='w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4'>{link.icon}</div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-[#262626] group-hover:text-[#FAFAFA] opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-x-4 translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[#FAFAFA] group-hover:translate-x-1 transition-transform duration-500 mb-0.5">{link.name}</h3>
                      <p className="text-[10px] leading-tight text-[#525252] group-hover:text-[#A3A3A3] tracking-wide transition-colors duration-500">{link.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};