const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const calculateLevelXp = require('../../utils/calculateLevelXp');
const Level = require('../../models/Level');
const Character = require('../../models/Character');
const { calculateRank } = require('../../utils/rankSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription("Shows your/someone's level.")
    .addUserOption(option =>
      option.setName('target-user')
        .setDescription('The user whose level you want to see.')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply("You can only run this command inside a server.");
      return;
    }

    await interaction.deferReply();

    const mentionedUserId = interaction.options.getUser('target-user')?.id;
    const targetUserId = mentionedUserId || interaction.user.id;
    const targetUserObj = await interaction.guild.members.fetch(targetUserId);

    const fetchedLevel = await Level.findOne({
      userId: targetUserId,
      guildId: interaction.guild.id,
    });

    if (!fetchedLevel) {
      await interaction.editReply(
        mentionedUserId
          ? `${targetUserObj.user.tag} doesn't have any levels yet. Try again when they chat a little more.`
          : "You don't have any levels yet. Chat a little more and try again."
      );
      return;
    }

    let allLevels = await Level.find({ guildId: interaction.guild.id }).select(
      '-_id userId level xp'
    );

    allLevels.sort((a, b) => {
      if (a.level === b.level) {
        return b.xp - a.xp;
      } else {
        return b.level - a.level;
      }
    });

    let currentRank = allLevels.findIndex((lvl) => lvl.userId === targetUserId) + 1;

    const fetchedCharacter = await Character.findOne({
      userId: targetUserId,
    });

    let rankInfo = 'N/A';
    if (fetchedCharacter) {
      const { rank, progress } = calculateRank(fetchedCharacter.experience);
      rankInfo = `${rank} (${Math.floor(progress * 100)}%)`;
    }

    const requiredXp = calculateLevelXp(fetchedLevel.level);
    const xpProgress = (fetchedLevel.xp / requiredXp) * 100;
    const progressBar = createGradientProgressBar(xpProgress);

    const levelEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`${targetUserObj.user.tag}'s Level Information`)
      .setThumbnail(targetUserObj.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: 'Level', value: fetchedLevel.level.toString(), inline: true },
        { name: 'Rank', value: `#${currentRank}`, inline: true },
        { name: 'Character Rank', value: rankInfo, inline: true },
        { name: 'XP Progress', value: progressBar, inline: false },
        { name: 'XP', value: `${Math.round(fetchedLevel.xp)}/${Math.round(requiredXp)}`, inline: true },
        { name: 'XP to Next Level', value: `${Math.round(requiredXp - fetchedLevel.xp)}`, inline: true }
      )
      .setFooter({ text: 'Keep chatting to gain more XP!' })
      .setTimestamp();

    await interaction.editReply({ embeds: [levelEmbed] });
  },
};

function createGradientProgressBar(percent) {
  const gradientChars = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪'];
  const filledSquares = Math.round(percent / 10);
  const emptySquares = 10 - filledSquares;
  
  let gradientBar = '';
  for (let i = 0; i < filledSquares; i++) {
    gradientBar += gradientChars[Math.floor(i / 2)];
  }
  gradientBar += '⬜'.repeat(emptySquares);
  
  return gradientBar;
}