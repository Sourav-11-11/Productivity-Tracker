const mongoose = require('mongoose');

const JobFeedSchema = new mongoose.Schema({
  source: { type: String, required: true },
  company: { type: String, required: true },
  role: { type: String, required: true },
  location: { type: String },
  type: { type: String }, // intern, full-time, contract
  link: { type: String, required: true, unique: true },
  deadline: { type: String },
  postedAt: { type: Date, default: Date.now },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now, expires: '7d' } // Auto-delete older than 7 days
});

// Compound index just in case
JobFeedSchema.index({ company: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('JobFeed', JobFeedSchema);
