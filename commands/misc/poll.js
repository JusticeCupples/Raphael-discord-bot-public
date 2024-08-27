const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const EMOJI_OPTIONS = ['🎉', '🎊', '🎈', '🎀', '🎁'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll')
    .addStringOption(option => 
      option.setName('question')
        .setDescription('The poll question')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('options')
        .setDescription('Poll options (comma-separated)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Poll duration in hours (default: 24)')
        .setRequired(false)),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const options = interaction.options.getString('options').split(',').map(option => option.trim());
    const duration = interaction.options.getInteger('duration') || 24;

    if (options.length < 2 || options.length > 5) {
      return interaction.reply({ content: 'Please provide between 2 and 5 options.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📊 ' + question)
      .setDescription(options.map((option, index) => `${EMOJI_OPTIONS[index]} ${option}`).join('\n'))
      .setFooter({ text: `Poll created by ${interaction.user.tag} | Ends in ${duration} hours` });

    try {
      const message = await interaction.reply({ embeds: [embed], fetchReply: true });

      for (let i = 0; i < options.length; i++) {
        await message.react(EMOJI_OPTIONS[i]);
      }

      setTimeout(() => endPoll(message, options, question), duration * 60 * 60 * 1000);
    } catch (error) {
      console.error('Error in poll command:', error);
      await interaction.followUp({ content: 'An error occurred while creating the poll. Please try again later.', ephemeral: true });
    }
  },
};

async function endPoll(message, options, question) {
  const fetchedMessage = await message.fetch();
  const results = options.map((option, index) => {
    const reaction = fetchedMessage.reactions.cache.get(EMOJI_OPTIONS[index]);
    return {
      option,
      votes: reaction ? reaction.count - 1 : 0
    };
  });

  results.sort((a, b) => b.votes - a.votes);

  const resultsEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('📊 Poll Results: ' + question)
    .setDescription(results.map((result, index) => `${index + 1}. ${result.option}: ${result.votes} vote(s)`).join('\n'))
    .setFooter({ text: `Poll ended | Total votes: ${results.reduce((sum, result) => sum + result.votes, 0)}` });

  await message.edit({ embeds: [resultsEmbed] });
  await message.reactions.removeAll();

  const pollsChannel = message.guild.channels.cache.find(channel => channel.name === 'polls');
  if (pollsChannel) {
    await pollsChannel.send({ embeds: [resultsEmbed] });
  }
}
