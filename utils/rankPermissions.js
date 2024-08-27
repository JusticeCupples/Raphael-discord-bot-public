const { RANKS } = require('./rankSystem');

function canUseCommand(character, requiredRank) {
  const characterRankIndex = RANKS.indexOf(character.rank);
  const requiredRankIndex = RANKS.indexOf(requiredRank);
  return characterRankIndex >= requiredRankIndex;
}

module.exports = { canUseCommand };