const EVENTS = [
  { type: 'monster', weight: 50 },
  { type: 'npc', weight: 20 },
  { type: 'special', weight: 10 },
  { type: 'boss', weight: 5 },
  { type: 'empty', weight: 15 }
];

function weightedRandomChoice(choices) {
  const totalWeight = choices.reduce((sum, choice) => sum + choice.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const choice of choices) {
    if (random < choice.weight) {
      return choice.type;
    }
    random -= choice.weight;
  }
}

const ENCOUNTERS = {
  monster: [
    {
      description: "A massive, six-legged beast with glowing red eyes emerges from the shadows. Its chitinous armor gleams in the dim light, and acidic saliva drips from its razor-sharp mandibles.",
      options: [
        "Attempt to blind it by throwing dirt in its eyes",
        "Look for weak spots in its armor",
        "Try to lure it into a narrow passage to restrict its movement"
      ],
      results: [
        "You successfully blind the beast, giving you an opportunity to escape or attack.",
        "You spot a weak point in its armor, allowing for a precise strike.",
        "You successfully lure the beast into a narrow passage, limiting its movement."
      ]
    },
    // Add more monster encounters here
  ],
  npc: [
    {
      description: "You encounter a disheveled explorer, their equipment in tatters. They mutter incoherently about a 'hidden paradise' deeper in the Abyss.",
      options: [
        "Offer them some of your supplies in exchange for information",
        "Attempt to calm them and learn more about their experience",
        "Quietly observe them to see if they lead you to something valuable"
      ],
      results: [
        "They accept your offer and share valuable information.",
        "You manage to calm them down and learn about their experiences.",
        "You observe them and gather useful information."
      ]
    },
    // Add more NPC encounters here
  ],
  empty: [
    {
      description: "You find nothing of interest in this area.",
      options: ["Continue exploring", "Take a short rest", "Search more carefully"],
      results: [
        "You move on to the next area.",
        "You take a moment to catch your breath, recovering some energy.",
        "Your careful search reveals nothing new, but you feel more aware of your surroundings."
      ]
    }
  ],
  boss: [
    {
      description: "You encounter a fearsome boss monster guarding a treasure!",
      options: ["Fight the boss", "Try to sneak past", "Retreat"],
      results: [
        "You engage in an epic battle with the boss.",
        "You attempt to sneak past the boss.",
        "You decide to retreat and live to fight another day."
      ]
    }
  ],
  special: [
    {
      description: "You stumble upon a hidden treasure chest!",
      options: ["Open the chest", "Leave it alone"],
      results: [
        "You open the chest and find valuable loot!",
        "You decide it's safer to leave the chest untouched and continue your journey."
      ]
    },
    {
      description: "You discover a mysterious portal shimmering before you.",
      options: ["Enter the portal", "Ignore it and move on"],
      results: [
        "You step through the portal and find yourself in a strange new area.",
        "You decide not to risk it and continue on your current path."
      ]
    }
  ]
};

module.exports = {
  EVENTS,
  weightedRandomChoice,
  ENCOUNTERS
};
