const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper: Get personalized system prompt based on user context
function getPersonalizedSystemPrompt(userContext) {
  const { level = 'Beginner', goal = 'Placement', goals = ['Placement'] } = userContext || {};
  
  // Use goal if provided, otherwise use first goal from goals array
  const primaryGoal = goal || (goals[0] ?? 'Placement');
  
  const basePrompt = 'You are an expert productivity and career coach for students. Output ONLY valid JSON.';
  
  const levelGuidance = {
    'Beginner': 'Give foundational advice. Focus on building habits and consistency over speed.',
    'Intermediate': 'Provide balanced advice on skill improvement and practical application.',
    'Advanced': 'Focus on optimization, deep work, and specialized techniques. Assume strong fundamentals.'
  };

  const goalGuidance = {
    'Placement': 'Emphasize job applications, interview prep, and placement outcomes. DSA focus.',
    'DSA': 'Focus on algorithmic mastery, problem patterns, and competitive programming growth.',
    'Productivity': 'Focus on time management, task prioritization, and sustainable work habits.'
  };

  // Build goals summary
  const goalsText = goals.length > 1 ? `${goals.slice(0, -1).join(', ')} and ${goals[goals.length - 1]}` : primaryGoal;

  return `${basePrompt}

User Profile: ${level} developer, Main Goal: ${primaryGoal}, Working on: ${goalsText}

${levelGuidance[level] || levelGuidance['Beginner']}
${goalGuidance[primaryGoal] || goalGuidance['Placement']}`;
}

async function analyzeFullSystem(data) {
  const { tasks = [], jobs = [], userContext = {} } = data;
  const { goal = 'Placement', goals = ['Placement'], level = 'Beginner', availableTime = '4–8h' } = userContext;

  // Use goal if provided, otherwise use first goal from goals array
  const primaryGoal = goal || (goals[0] ?? 'Placement');

  const levelRequirements = {
    'Beginner': 'Focus on building consistency and mastering fundamentals. Suggest starting with 2-3 daily tasks, basic learning resources.',
    'Intermediate': 'Suggest progressive skill development. Balance theory with practice. Recommend 4-5 daily tasks with increasing difficulty.',
    'Advanced': 'Optimize for efficiency and specialization. Push toward mastery and optimization. Handle 6+ daily tasks with focus on quality.'
  };

  const goalContext = {
    'Placement': 'Emphasize job application pace, interview readiness, and DSA preparation. Track conversion rates and application timeline.',
    'DSA': 'Focus on problem-solving progress, algorithm mastery, and competitive logic. Track difficulty progression.',
    'Productivity': 'Focus on workflow optimization, habit formation, and sustainable long-term progress. Track consistency.'
  };

  const timeConstraints = {
    '<2h': 'Limited time: prioritize high-impact tasks only. Suggest batching and micro-learning.',
    '2–4h': 'Moderate time: balance breadth and depth. Suggest focused blocks with clear goals.',
    '4–8h': 'Good available time: allow deeper work and skill building.',
  };

  // Build goals summary
  const goalsText = goals.length > 1 ? `${goals.slice(0, -1).join(', ')} and ${goals[goals.length - 1]}` : primaryGoal;

  const prompt = `Analyze this ${level} developer's productivity and ${primaryGoal} journey:
Working on: ${goalsText}
Daily available time: ${availableTime}
${timeConstraints[availableTime] || timeConstraints['4–8h']}

${levelRequirements[level] || levelRequirements['Beginner']}
${goalContext[primaryGoal] || goalContext['Placement']}

Tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, duration: t.duration, completed: t.completed, category: t.category })))}
Jobs: ${JSON.stringify(jobs.map(j => ({ company: j.company, role: j.role, status: j.status, deadline: j.deadline })))}

Provide analysis on:
1. Productivity: Completion rate, overplanning risk, pace sustainability
2. ${primaryGoal} Progress: Application volume, quality, timeline progress
3. Time Efficiency: Are they using their ${availableTime} effectively for ${goalsText}?
4. Multi-goal Balance: How well are they balancing ${goalsText}?

Return STRICT JSON:
{
  "summary": "short overall evaluation (2-3 sentences)",
  "productivity": { 
    "insights": ["insight 1", "insight 2"],
    "improvements": ["specific improvement 1", "specific improvement 2"]
  },
  "goals": { 
    "insights": ["insight on goal balance"],
    "improvements": ["improvement for multi-goal management"]
  },
  "nextActions": ["action 1", "action 2", "action 3"]
}

All text must be concise, actionable, and tailored to their ${level} level.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: getPersonalizedSystemPrompt(userContext) },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 600,
  });

  return JSON.parse(response.choices[0].message.content);
}

async function generateDailyPlan(data) {
  const { tasks = [], jobs = [], userContext = {} } = data;
  const { availableTime = '4–8h', level = 'Beginner', goal = 'Placement', goals = ['Placement'] } = userContext;

  // Use goal if provided, otherwise use first goal from goals array
  const primaryGoal = goal || (goals[0] ?? 'Placement');

  // Realistic productive hours (accounting for breaks, context switching)
  const timeMap = {
    '<2h': { max: 1.5, productive: 1.25, taskCount: 2, depth: 'surface-level' },
    '2–4h': { max: 3, productive: 2.5, taskCount: 3, depth: 'moderate' },
    '4–8h': { max: 6, productive: 5, taskCount: 5, depth: 'deep' }
  };
  const timeConfig = timeMap[availableTime] || timeMap['4–8h'];

  const levelStrategy = {
    'Beginner': {
      approach: 'Start with single focus areas. Include learning resources. Keep complexity low.',
      taskPerBlock: 1,
      breakFreq: 'Every 45 min',
      recommendation: 'Recommend 25-30 min focused work blocks with 5 min breaks. Build consistency first.'
    },
    'Intermediate': {
      approach: 'Multi-task balance with progressive difficulty. Push slightly outside comfort zone.',
      taskPerBlock: 1.5,
      breakFreq: 'Every 50-60 min',
      recommendation: 'Recommend 50-60 min focused blocks. Mix easy + hard tasks. Allow for problem-solving flow.'
    },
    'Advanced': {
      approach: 'Deep work focus. Optimization and specialization. Minimize context switching.',
      taskPerBlock: 2,
      breakFreq: 'Every 90 min',
      recommendation: 'Recommend 90-120 min deep work blocks. Batch similar work. Focus on quality output.'
    }
  };

  const strategy = levelStrategy[level] || levelStrategy['Beginner'];

  // Build goals summary
  const goalsText = goals.length > 1 ? `${goals.slice(0, -1).join(', ')} and ${goals[goals.length - 1]}` : primaryGoal;

  const prompt = `You are a ${level}-level productivity coach. Generate a realistic next-day schedule for a student working on ${goalsText} (main focus: ${primaryGoal}).

CONSTRAINTS:
- Available time: ${availableTime} (realistically ~${timeConfig.productive} hours of focused work)
- User level: ${level}
- Primary goal: ${primaryGoal}
- All goals: ${goalsText}

${strategy.approach}
${strategy.recommendation}

TASKS TO SCHEDULE:
${JSON.stringify(tasks.map(t => ({ 
  title: t.title, 
  duration: t.duration, 
  completed: t.completed, 
  category: t.category 
})))}

URGENT JOBS (deadlines):
${JSON.stringify(jobs.filter(j => j.deadline).map(j => ({ 
  company: j.company, 
  role: j.role, 
  status: j.status, 
  deadline: j.deadline 
})))}

CREATE A REALISTIC SCHEDULE:
1. Start with URGENT job deadlines first
2. Fill remaining time with incomplete tasks (prioritize DSA if Placement goal)
3. Keep total tasks = ${timeConfig.taskCount} per day for ${level} level
4. Add suggested break timing: ${strategy.breakFreq}
5. Match time blocks to available schedule (Morning 2-3h, Afternoon 2-3h, Evening 1h)

Return STRICT JSON:
{
  "summary": "brief reasoning for this schedule",
  "focus": "main focus area for the day",
  "timeBlocks": [
    {
      "label": "Morning Session",
      "duration": "estimate in minutes",
      "tasks": ["specific task with objective"],
      "tip": "brief tip for ${level} level"
    },
    {
      "label": "Afternoon Session",
      "duration": "estimate in minutes",
      "tasks": ["specific task with objective"],
      "tip": "brief tip for success"
    },
    {
      "label": "Evening Review",
      "duration": "estimate in minutes",
      "tasks": ["reflection or light task"],
      "tip": "consolidation strategy"
    }
  ]
}

For ${level} level: ${level === 'Beginner' ? 'Include learning resources.' : level === 'Intermediate' ? 'Balance theory and practice.' : 'Optimize for deep work quality.'}
Keep tasks specific and actionable. Respect the ${availableTime} constraint strictly.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: getPersonalizedSystemPrompt(userContext) },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 700,
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = {
  analyzeFullSystem,
  generateDailyPlan
};