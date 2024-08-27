const { SlashCommandBuilder } = require('discord.js');
const Character = require('../../models/Character');
const { handleMainMenu, handleDive, handleShop, handleGuild, handleHelp } = require('./rpgHandlersHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rpg')
    .setDescription('Access the RPG game')
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Reset your dive status'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('menu')
        .setDescription('Open the main RPG menu')),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const character = await Character.findOne({ userId: interaction.user.id });
      if (!character) {
        return interaction.editReply('You need to create a character first! Use `/character create` to get started.');
      }

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'reset') {
        character.isDiving = false;
        character.diveEndTime = new Date();
        await character.save();
        return interaction.editReply('Your dive status has been reset. You can start a new dive now.');
      } else if (subcommand === 'menu' || !subcommand) {
        await handleMainMenu(interaction, character);
      }
    } catch (error) {
      console.error('Error in RPG command:', error);
      await interaction.editReply('An error occurred while processing your request. Please try again later.');
    }
  },

  handlers: {
    handleMainMenu,
    handleDive,
    handleShop,
    handleGuild,
    handleHelp,
  }
};