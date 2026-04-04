const fs = require('fs');
let content = fs.readFileSync('client/src/pages/JobTracker.tsx', 'utf8');

// remove states up to fetch
const stateRegex = /  const \[aiData, setAiData\] = useState<any>\(null\);\n[\s\S]*?setIsAnalyzing\(false\);\n    }\n  };\n/;
content = content.replace(stateRegex, '');

// take out the AI analysis div
const divRegex = /          <div className="bg-gray-900\/40 border border-white\/5 rounded-2xl p-5 flex flex-col relative overflow-hidden backdrop-blur-xl h-full max-h-\[500px\]">[\s\S]*?<\/div>[\s]*<\/div>\n/;
content = content.replace(divRegex, '      </div>\n');

fs.writeFileSync('client/src/pages/JobTracker.tsx', content);
console.log('Removed AI sections from JobTracker!');