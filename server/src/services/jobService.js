const axios = require('axios');
const JobFeed = require('../models/JobFeed');

const fetchRemotiveJobs = async () => {
  try {
    const { data } = await axios.get('https://remotive.com/api/remote-jobs?category=software-dev&limit=50');
    if (!data || !data.jobs) return [];
    
    return data.jobs.map(job => ({
      source: 'Remotive',
      company: job.company_name,
      role: job.title,
      location: job.candidate_required_location || 'Remote',
      type: job.job_type || 'full-time',
      link: job.url,
      postedAt: new Date(job.publication_date),
      tags: job.tags || [],
    }));
  } catch (error) {
    console.error('Error fetching from Remotive:', error.message);
    return [];
  }
};

const fetchArbeitnowJobs = async () => {
  try {
    const { data } = await axios.get('https://arbeitnow.com/api/job-board-api');
    if (!data || !data.data) return [];
    
    return data.data.map(job => ({
      source: 'Arbeitnow',
      company: job.company_name,
      role: job.title,
      location: job.location || job.remote ? 'Remote' : 'Anywhere',
      type: job.job_types?.join(', ') || 'full-time',
      link: job.url,
      postedAt: new Date(job.created_at * 1000),
      tags: job.tags || [],
    }));
  } catch (error) {
    console.error('Error fetching from Arbeitnow:', error.message);
    return [];
  }
};

const syncJobs = async () => {
  console.log('â³ Syncing jobs from providers...', new Date().toLocaleString());
  
  const remotiveJobs = await fetchRemotiveJobs();
  const arbeitnowJobs = await fetchArbeitnowJobs();
  
  let allJobs = [...remotiveJobs, ...arbeitnowJobs];
  
  // Filter for relevant tech roles
  const filterRegex = /software|developer|intern|frontend|backend|engineer|fullstack/i;
  allJobs = allJobs.filter(j => filterRegex.test(j.role));
  
  let addedCount = 0;
  
  for (const job of allJobs) {
    try {
      // Validate link
      if (!job.link || !job.role || !job.company) continue;
      
      // Upsert: Try to create, ignore if already exists (by link or company+role index)
      await JobFeed.updateOne({ link: job.link }, { $setOnInsert: job }, { upsert: true });
      addedCount++;
    } catch (e) {
       // Ignore duplicate key errors 
    }
  }
  
  console.log(âœ… Sycned jobs. Attempted inserts/upserts: );
};

module.exports = { syncJobs };
