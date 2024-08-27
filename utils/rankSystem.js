const RANKS = [
    'Novice',
    'Apprentice',
    'Adept',
    'Expert',
    'Master',
    'Grandmaster',
    'Legendary'
  ];
  
  const RANK_XP_THRESHOLDS = [
    0,      // Novice
    1000,   // Apprentice
    5000,   // Adept
    15000,  // Expert
    50000,  // Master
    100000, // Grandmaster
    250000  // Legendary
  ];
  
  function calculateRank(totalXP) {
    for (let i = RANK_XP_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalXP >= RANK_XP_THRESHOLDS[i]) {
        return {
          rank: RANKS[i],
          progress: i < RANK_XP_THRESHOLDS.length - 1 
            ? (totalXP - RANK_XP_THRESHOLDS[i]) / (RANK_XP_THRESHOLDS[i+1] - RANK_XP_THRESHOLDS[i])
            : 1
        };
      }
    }
    return { rank: 'Novice', progress: 0 };
  }
  
  module.exports = {
    RANKS,
    RANK_XP_THRESHOLDS,
    calculateRank
  };