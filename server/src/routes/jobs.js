const express = require('express');
const router = express.Router();
const JobFeed = require('../models/JobFeed');
const { syncJobs } = require('../services/jobService');

// GET /api/jobs -> Retrieve latest jobs
router.get('/', async (req, res) => {
  try {
    const { role, type, location } = req.query;
    
    let filter = {};
    if (role) filter.role = new RegExp(role, 'i');
    if (type) filter.type = new RegExp(type, 'i');
    if (location) filter.location = new RegExp(location, 'i');

    const jobs = await JobFeed.find(filter)
      .sort({ postedAt: -1, createdAt: -1 })
      .limit(50);
      
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/jobs/sync -> Manually force a sync (testing)
router.get('/sync', async (req, res) => {
  try {
    await syncJobs();
    res.json({ message: 'Sync triggered successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
