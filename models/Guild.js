const mongoose = require('mongoose');

const GuildSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  leader: { type: String, required: true },
  members: [{ type: String }],
  level: { type: Number, default: 1 },
  treasury: { type: Number, default: 0 },
  researchPoints: { type: Number, default: 0 },
  plannedDives: [{
    level: Number,
    startTime: Date,
    endTime: Date,
    reward: Number
  }]
});

module.exports = mongoose.model('Guild', GuildSchema);