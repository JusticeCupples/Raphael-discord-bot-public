function calculateLevelXp(level) {
  // This is a simple example. Adjust the formula as needed for your game balance.
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

module.exports = calculateLevelXp;