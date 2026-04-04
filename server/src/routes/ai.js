const express = require('express');
const router = express.Router();
const { analyzeFullSystem, generateDailyPlan } = require('../services/aiService');

router.post('/analyze-full', async (req, res) => {
  const { tasks, jobs, userContext } = req.body;
  const data = { tasks, jobs, userContext };

  try {
    const result = await analyzeFullSystem(data);
    res.status(200).json(result);
  } catch (err) {
    console.log("AI failed, fallback used");
    res.status(200).json({ message: "AI temporarily unavailable" });
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