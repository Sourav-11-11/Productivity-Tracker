import React, { type ReactNode, useEffect, useState } from 'react';
import { ExternalLink, Code2, Users, Briefcase, GraduationCap, Building2, Terminal, Copy, Check, CheckCircle2 } from 'lucide-react';

export interface AccountItem {
  id: string;
  name: string;
  url: string;
  icon: ReactNode;
  desc: string;
  color: string;
  isVault?: boolean;
}

export interface AccountSection {
  category: string;
  links: AccountItem[];
}

const ACCOUNTS: AccountSection[] = [
  {
    category: "Coding & Development",
    links: [
      { id: "github", name: "GitHub", url: "https://github.com/Sourav-11-11", icon: <Terminal size={16} className="text-[#FAFAFA]" />, desc: "Projects & Repositories", color: "hover:border-[#525252]" },
      { id: "leetcode", name: "LeetCode", url: "https://leetcode.com/Sourav-11-11/", icon: <Code2 size={16} className="text-[#FFA116]" />, desc: "Problem Solving & DSA", color: "hover:border-[#FFA116]/50" }
    ]
  },
  {
    category: "Professional Networking",
    links: [
      { id: "linkedin", name: "LinkedIn", url: "https://www.linkedin.com/in/sourav-vemuru11/", icon: <Users size={16} className="text-[#0A66C2]" />, desc: "Professional Profile", color: "hover:border-[#0A66C2]/50" }
    ]
  },
  {
    category: "Internships & Opportunities",
    links: [
      { id: "unstop", name: "Unstop", url: "https://unstop.com/", icon: <GraduationCap size={16} className="text-[#1C4ED8]" />, desc: "Hackathons & Challenges", color: "hover:border-[#1C4ED8]/50" },
      { id: "internshala", name: "Internshala", url: "https://internshala.com/", icon: <Building2 size={16} className="text-[#127FFF]" />, desc: "Internship Hunting", color: "hover:border-[#127FFF]/50" },
      { id: "wellfound", name: "Wellfound", url: "https://wellfound.com/", icon: <Briefcase size={16} className="text-[#E63F38]" />, desc: "Startup Jobs", color: "hover:border-[#E63F38]/50" }
    ]
  },
  {
    category: "Asset Vault",
    links: [
       { id: "vault-intro-50", name: "50-Word Intro", url: "I am a proactive software engineer focusing on scalable frontend web experiences. With deep expertise in React and TypeScript, I thrive on solving complex technical challenges while delivering highly polished, minimal UI. I am passionate about learning, iterating fast, and building products that users actually love.", icon: <Briefcase size={16} className="text-[#FAFAFA]" />, desc: "Copy Short Intro", color: "hover:border-[#A3A3A3]", isVault: true },
       { id: "vault-resume-fe", name: "Frontend Resume", url: "https://drive.google.com/...", icon: <ExternalLink size={16} className="text-[#FAFAFA]" />, desc: "Drive PDF Link", color: "hover:border-[#A3A3A3]", isVault: true },
       { id: "vault-why-us", name: "Why This Company", url: "I align closely with your mission of building user-first digital products. I noticed your recent technical challenges and believe my background in high-performance React architectures makes me a strong fit to deliver immediate value to your current roadmap.", icon: <Building2 size={16} className="text-[#FAFAFA]" />, desc: "Standard 'Why Us' text", color: "hover:border-[#A3A3A3]", isVault: true }
    ]
  }
];

export const Accounts: React.FC = () => {
  const [stats, setStats] = useState<Record<string, string>>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [visitedToday, setVisitedToday] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem('endel_daily_accounts_tracker');
    if (stored) {
      setVisitedToday(JSON.parse(stored));
    }

    const fetchStats = async () => {
      try {
        fetch('https://api.github.com/users/Sourav-11-11')
          .then(res => res.json())
          .then(data => {
            if (data && data.public_repos !== undefined) {
              setStats(prev => ({ ...prev, github: data.public_repos + ' Repos • ' + data.followers + ' Followers' }));
            }
          })
          .catch(() => {});

        fetch('https://leetcode-stats-api.herokuapp.com/Sourav-11-11')
          .then(res => res.json())
          .then(data => {
            if (data && data.status === "success") {
              setStats(prev => ({ ...prev, leetcode: data.totalSolved + ' Solved (' + data.ranking + ' Rank)' }));
            }
          })
          .catch(() => {});
      } catch (err) {}
    };

    fetchStats();
  }, []);

  const handleLinkVisit = (id: string) => {
    const today = new Date().toDateString();
    const newVisited = { ...visitedToday, [id]: today };
    setVisitedToday(newVisited);
    localStorage.setItem('endel_daily_accounts_tracker', JSON.stringify(newVisited));
  };

  const handleCopy = (e: React.MouseEvent, textToCopy: string, linkId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(textToCopy);
    
    if (linkId) {
      setCopiedLink(linkId);
      setTimeout(() => setCopiedLink(null), 2000);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const generateCopyAllText = () => {
    return ACCOUNTS.map(section => {
      const linksText = section.links.map(link => '- ' + link.name + ': ' + link.url).join('\n');
      return '[' + section.category.toUpperCase() + ']\n' + linksText;
    }).join('\n\n');
  };

  return (
    <div className="min-h-full bg-transparent py-4 px-8 text-[#FAFAFA] font-sans selection:bg-[#FAFAFA] selection:text-[#0A0A0A] overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col items-start gap-2 animate-in fade-in slide-in-from-bottom-10 duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-[9px] uppercase tracking-[0.5em] text-[#525252] font-medium">Platform Links</h1>
            <button 
              onClick={(e) => handleCopy(e, generateCopyAllText())}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#0A0A0A] border border-[#262626] hover:border-[#525252] text-[#A3A3A3] hover:text-[#FAFAFA] rounded-md transition-all text-[10px] uppercase tracking-widest tracking-widest cursor-pointer"
            >
              {copiedAll ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              {copiedAll ? 'COPIED TO CLIPBOARD' : 'COPY ALL LINKS'}
            </button>
          </div>
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
                {section.links.map((link, lidx) => {
                   const isVisitedToday = visitedToday[link.id] === new Date().toDateString();
                   const containerClass = "group relative flex flex-col p-4 bg-[#0A0A0A] hover:bg-[#0F0F0F] border border-[#141414] rounded-xl animate-custom " + link.color + (isVisitedToday ? " opacity-75 hover:opacity-100 border-[#262626]/40" : "");

                   return (
                     <a
                       key={lidx}
                       href={link.url}
                       target="_blank"
                       rel="noopener noreferrer"
                       onClick={() => handleLinkVisit(link.id)}
                       className={containerClass}
                     >
                       {isVisitedToday && (
                         <div className="absolute -top-1.5 -right-1.5 p-0.5 bg-[#0A0A0A] rounded-full border border-[#262626]">
                            <CheckCircle2 size={12} className="text-green-500/80" />
                         </div>
                       )}

                       <div className="flex items-center justify-between mb-3">
                         <div className="p-2.5 bg-[#0A0A0A] rounded-lg border border-[#141414] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(250,250,250,0.05)] animate-custom text-[#FAFAFA]">
                           <div className="w-4 h-4 flex items-center justify-center">{link.icon}</div>
                         </div>
                         <div className="flex gap-2">
                            <button 
                              onClick={(e) => handleCopy(e, link.url, link.id)}
                              className="text-[#262626] group-hover:text-[#A3A3A3] hover:!text-[#FAFAFA] opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                              title="Copy URL"
                            >
                              {copiedLink === link.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                            <ExternalLink className="w-3.5 h-3.5 text-[#262626] group-hover:text-[#FAFAFA] opacity-50 group-hover:opacity-100 transition-all duration-500" />
                         </div>
                       </div>
                       <div>
                         <h3 className="text-sm font-medium text-[#FAFAFA] group-hover:translate-x-1 transition-transform duration-500 mb-0.5">{link.name}</h3>
                         <p className="text-[10px] leading-tight text-[#525252] group-hover:text-[#A3A3A3] tracking-wide transition-colors duration-500">
                           {stats[link.id] || link.desc}
                         </p>
                       </div>
                     </a>
                   );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};


