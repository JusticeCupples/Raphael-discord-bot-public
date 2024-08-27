const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Submit a suggestion')
    .addStringOption(option => 
      option.setName('suggestion')
        .setDescription('Your suggestion')
        .setRequired(true)),

  async execute(interaction) {
    const suggestion = interaction.options.getString('suggestion');
    const suggestionsChannel = interaction.guild.channels.cache.find(channel => channel.name === 'suggestions');

    if (!suggestionsChannel) {
      return interaction.reply({ content: 'Suggestions channel not found. Please ask an admin to create a channel named "suggestions".', ephemeral: true });
    }

    // Check if the bot has permission to send messages in the suggestions channel
    if (!suggestionsChannel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.SendMessages)) {
      return interaction.reply({ content: 'I don\'t have permission to send messages in the suggestions channel. Please ask an admin to grant me the necessary permissions.', ephemeral: true });
    }

    const suggestionEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('New Suggestion')
      .setDescription(suggestion)
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    try {
      const message = await suggestionsChannel.send({ embeds: [suggestionEmbed] });
      await message.react('👍');
      await message.react('👎');

      await interaction.reply({ content: 'Your suggestion has been submitted!', ephemeral: true });
    } catch (error) {
      console.error('Error in suggest command:', error);
      await interaction.reply({ content: 'An error occurred while submitting your suggestion. Please try again later or contact an admin.', ephemeral: true });
    }
  }
};
