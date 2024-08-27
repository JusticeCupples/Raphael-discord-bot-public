const { Schema, model } = require('mongoose');

const itemSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  type: {
    type: String,
    enum: ['weapon', 'armor', 'artifact', 'consumable'],
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  effects: {
    attack: Number,
    defense: Number,
    health: Number,
    specialEffect: String
  }
});

module.exports = model('Item', itemSchema);