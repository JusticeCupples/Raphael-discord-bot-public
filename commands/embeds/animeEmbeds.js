const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const AnimeWatchlist = require('../../models/AnimeWatchlist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('watchlist')
    .setDescription('Manage your custom anime watchlist')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add an anime to your watchlist')
        .addStringOption(option =>
          option.setName('title')
            .setDescription('The title of the anime')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('genre')
            .setDescription('The genre of the anime')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('status')
            .setDescription('Your watching status')
            .setRequired(true)
            .addChoices(
              { name: 'Plan to Watch', value: 'plan_to_watch' },
              { name: 'Watching', value: 'watching' },
              { name: 'Completed', value: 'completed' },
              { name: 'On Hold', value: 'on_hold' },
              { name: 'Dropped', value: 'dropped' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove an anime from your watchlist')
        .addStringOption(option =>
          option.setName('title')
            .setDescription('The title of the anime to remove')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View your or someone else\'s anime watchlist')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user whose watchlist you want to view (leave empty for your own)')
            .setRequired(false))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    let watchlist = await AnimeWatchlist.findOne({ userId });
    if (!watchlist) {
      watchlist = new AnimeWatchlist({ userId, animeList: [] });
    }

    switch (subcommand) {
      case 'add':
        const title = interaction.options.getString('title');
        const genre = interaction.options.getString('genre');
        const status = interaction.options.getString('status');

        const existingAnime = watchlist.animeList.find(anime => anime.title.toLowerCase() === title.toLowerCase());
        if (existingAnime) {
          return interaction.reply('This anime is already in your watchlist!');
        }

        watchlist.animeList.push({ title, genre, status });
        await watchlist.save();
        return interaction.reply(`Added "${title}" to your watchlist!`);

      case 'remove':
        const animeToRemove = interaction.options.getString('title');
        const index = watchlist.animeList.findIndex(anime => anime.title.toLowerCase() === animeToRemove.toLowerCase());
        if (index === -1) {
          return interaction.reply('This anime is not in your watchlist!');
        }
        watchlist.animeList.splice(index, 1);
        await watchlist.save();
        return interaction.reply(`Removed "${animeToRemove}" from your watchlist!`);

      case 'view':
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const targetWatchlist = await AnimeWatchlist.findOne({ userId: targetUser.id });
        
        if (!targetWatchlist || targetWatchlist.animeList.length === 0) {
          return interaction.reply(`${targetUser.username}'s watchlist is empty!`);
        }
        
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle(`${targetUser.username}'s Anime Watchlist`)
          .setDescription(targetWatchlist.animeList.map(anime => 
            `**${anime.title}**\nGenre: ${anime.genre}\nStatus: ${anime.status.replace('_', ' ')}`
          ).join('\n\n'))
          .setTimestamp();
        return interaction.reply({ embeds: [embed] });
    }
  },
};