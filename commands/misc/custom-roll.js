const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const ADMIN_IDS = ["380722114623438852", "418901867297505290"];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('custom-roll')
    .setDescription('Create a custom roll role with gradients (Admin only)')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to assign the role to')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('name')
        .setDescription('Name for the custom roll role')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('color1')
        .setDescription('First color for gradient (hex code)')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('color2')
        .setDescription('Second color for gradient (hex code)')
        .setRequired(true)),

  async execute(interaction) {
    if (!ADMIN_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: 'This command is for administrators only.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const name = interaction.options.getString('name');
    const color1 = interaction.options.getString('color1');
    const color2 = interaction.options.getString('color2');

    if (!color1.match(/^#[0-9A-Fa-f]{6}$/) || !color2.match(/^#[0-9A-Fa-f]{6}$/)) {
      return interaction.reply({ content: 'Invalid color format. Please use hex codes (e.g., #FF0000).', ephemeral: true });
    }

    try {
      const role = await interaction.guild.roles.create({
        name: name,
        color: color1,
        permissions: [],
        hoist: true,
        reason: 'Custom roll role'
      });

      // Move the role to the top of the role list (just below the bot's highest role)
      const botMember = interaction.guild.members.me;
      const highestBotRole = botMember.roles.highest;
      await role.setPosition(highestBotRole.position - 1);

      const member = await interaction.guild.members.fetch(user.id);
      await member.roles.add(role);

      await interaction.reply({ content: `Custom roll role "${name}" has been created and assigned to ${user.tag}!`, ephemeral: true });
    } catch (error) {
      console.error('Error creating custom roll role:', error);
      await interaction.reply({ content: 'An error occurred while creating the custom roll role. Please try again later.', ephemeral: true });
    }
  },
};
