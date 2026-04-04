const express = require('express');
const router = express.Router();
const { analyzeFullSystem, generateDailyPlan } = require('../services/aiService');

router.post('/analyze-full', async (req, res) => {
  try {
    const { tasks, jobs, userContext } = req.body;

    const analysis = await analyzeFullSystem({ tasks, jobs, userContext });

    res.status(200).json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze system', details: error.message });
  }
});

router.post('/generate-plan', async (req, res) => {
  try {
    const { tasks, jobs, userContext } = req.body;
    const plan = await generateDailyPlan({ tasks, jobs, userContext });
    res.status(200).json(plan);
  } catch (error) {
    console.error('Plan generation error:', error);
    res.status(500).json({ error: 'Failed to generate plan', details: error.message });
  }
});

module.exports = router;