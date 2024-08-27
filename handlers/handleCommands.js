const levelCommand = require("../commands/economy/level");
const characterCommand = require('../commands/rpg/character');
const duelCommand = require('../commands/rpg/duel');
const diveCommand = require('../commands/rpg/dive');
const storeCommand = require('../commands/rpg/store');
const lootboxCommand = require('../commands/rpg/lootbox');
const { handleAnimeEmbedCommand } = require("../commands/embeds/animeEmbeds");
const { memeCommand, forceWeeklyMemeCommand } = require('../commands/memes');
const rpgCommand = require('../commands/rpg/rpg');

const handleInteraction = async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    console.log(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await interaction.deferReply();
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true }).catch(() => {});
    }
  }
};

module.exports = { handleInteraction };