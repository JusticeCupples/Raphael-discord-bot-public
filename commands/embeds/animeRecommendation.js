const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { fetchMalDetails } = require("../../vendor/mal");

const GENRES = {
  'Action': 1, 'Adventure': 2, 'Comedy': 4, 'Drama': 8, 'Sci-Fi': 24, 'Fantasy': 10,
  'Romance': 22, 'Slice of Life': 36, 'Mystery': 7, 'Thriller': 41, 'Horror': 14,
  'Sports': 30, 'Music': 19, 'Mecha': 18, 'Psychological': 40
};

async function getRandomAnime(genre, minEpisodes, maxEpisodes, ageRating) {
  const genreId = GENRES[genre];
  if (!genreId) {
    throw new Error('Invalid genre');
  }

  const baseUrl = `https://api.jikan.moe/v4/anime?genres=${genreId}&order_by=popularity&sort=desc`;
  const params = new URLSearchParams();
  
  if (minEpisodes !== 'Any') {
    params.append('min_episodes', minEpisodes);
  }
  if (maxEpisodes !== 'Any') {
    params.append('max_episodes', maxEpisodes);
  }
  if (ageRating !== 'any') {
    params.append('rating', ageRating);
  }
  
  try {
    let allAnimes = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage && allAnimes.length < 100) {
      const response = await axios.get(`${baseUrl}&${params.toString()}&page=${page}&limit=25`);
      
      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        throw new Error('Invalid response from Jikan API');
      }

      // Filter the anime based on the minimum episodes if it's set
      const filteredAnimes = minEpisodes !== 'Any' 
        ? response.data.data.filter(anime => anime.episodes >= parseInt(minEpisodes))
        : response.data.data;

      allAnimes = allAnimes.concat(filteredAnimes);
      hasNextPage = response.data.pagination.has_next_page;
      page++;

      // Add a delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (allAnimes.length === 0) {
      throw new Error('No anime found matching the specified criteria');
    }

    return allAnimes[Math.floor(Math.random() * allAnimes.length)];
  } catch (error) {
    console.error('Error fetching anime:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch anime. Please try again later.');
  }
}

async function createAnimeEmbed(anime) {
  const details = await fetchMalDetails(anime.title);
  const embed = new EmbedBuilder()
    .setTitle(details.titleEnglish || anime.title || 'Unknown Title')
    .setDescription(`Japanese Title: ${details.titleJapanese || 'Unknown'}`)
    .setImage(details.imageUrl || null)
    .setColor("#C21E56")
    .setTimestamp();

  const fields = [
    { name: "MAL Rating", value: details.rating ? `**${details.rating}**` : 'N/A', inline: true },
    { name: "Genres", value: details.genres || 'N/A', inline: true },
    { name: "Episodes", value: details.episodes ? details.episodes.toString() : 'N/A', inline: true },
    { name: "Duration", value: details.duration || 'N/A', inline: true },
    { name: "Studio", value: details.studio || 'N/A', inline: true },
  ];

  if (details.summary) {
    fields.push({ name: "Summary", value: details.summary.substring(0, 1021) + '...', inline: false });
  }

  if (details.watchLinks && details.watchLinks.official && details.watchLinks.official.length > 0) {
    const watchLinks = details.watchLinks.official.map(link => `[${new URL(link).hostname}](${link})`).join(", ");
    fields.push({ name: "Where to Watch", value: watchLinks, inline: false });
  }

  embed.addFields(fields.filter(field => field.value !== 'N/A' && field.value !== '').map(field => ({
    name: field.name,
    value: field.value.toString(),
    inline: field.inline
  })));

  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anime-recommendation')
    .setDescription('Get a random anime recommendation')
    .addStringOption(option => 
      option
        .setName('genre')
        .setDescription('Choose a genre for the recommendation')
        .setRequired(true)
        .addChoices(...Object.entries(GENRES).map(([name, value]) => ({ name, value: name })))
    )
    .addStringOption(option => 
      option
        .setName('min_episodes')
        .setDescription('Minimum number of episodes')
        .setRequired(false)
        .addChoices(
          { name: 'Any', value: 'Any' },
          { name: '1', value: '1' },
          { name: '12', value: '12' },
          { name: '24', value: '24' },
          { name: '50', value: '50' }
        )
    )
    .addStringOption(option => 
      option
        .setName('max_episodes')
        .setDescription('Maximum number of episodes')
        .setRequired(false)
        .addChoices(
          { name: 'Any', value: 'Any' },
          { name: '12', value: '12' },
          { name: '24', value: '24' },
          { name: '50', value: '50' },
          { name: '100', value: '100' }
        )
    )
    .addStringOption(option => 
      option
        .setName('age_rating')
        .setDescription('Choose the age rating')
        .setRequired(false)
        .addChoices(
          { name: 'Any', value: 'any' },
          { name: 'Kid', value: 'g' },
          { name: 'Teen', value: 'pg13' },
          { name: 'Family', value: 'pg' },
          { name: 'Adult', value: 'r17' },
          { name: 'HOW IS THIS LEGAL', value: 'r' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const genre = interaction.options.getString('genre');
    const minEpisodes = interaction.options.getString('min_episodes') || 'Any';
    const maxEpisodes = interaction.options.getString('max_episodes') || 'Any';
    const ageRating = interaction.options.getString('age_rating') || 'any';
    
    try {
      const randomAnime = await getRandomAnime(genre, minEpisodes, maxEpisodes, ageRating);
      const embed = await createAnimeEmbed(randomAnime);
      
      await interaction.editReply({ content: `Here's a random ${genre} anime recommendation:`, embeds: [embed] });
    } catch (error) {
      console.error('Error in anime recommendation command:', error);
      await interaction.editReply('Sorry, there was an error getting an anime recommendation. ' + error.message);
    }
  },
};