const axios = require('axios');
const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const cheerio = require('cheerio');

const ANIME_STUDIOS = ['Studio Ghibli', 'Kyoto Animation', 'Madhouse', 'Bones', 'Ufotable', 'A-1 Pictures', 'Production I.G', 'MAPPA', 'Wit Studio', 'Trigger'];
const ANIME_GENRES = ['Action', 'Romance', 'Comedy', 'Sci-Fi', 'Fantasy', 'Slice of Life', 'Mystery', 'Horror', 'Mecha', 'Sports'];

const ADMIN_IDS = ["380722114623438852", "418901867297505290"];

function generateFakeAnimeNews() {
    const newsItems = [];
    const newsCount = Math.floor(Math.random() * 11) + 10; // 10 to 20 news items

    for (let i = 0; i < newsCount; i++) {
        const newsType = Math.random();
        let newsItem;

        if (newsType < 0.4) {
            // New anime in development
            newsItem = `"${generateAnimeName()}" announced by ${ANIME_STUDIOS[Math.floor(Math.random() * ANIME_STUDIOS.length)]}. A ${ANIME_GENRES[Math.floor(Math.random() * ANIME_GENRES.length)]} series coming next year.`;
        } else if (newsType < 0.7) {
            // Upcoming release dates
            const releaseDate = new Date(Date.now() + Math.random() * 10000000000);
            newsItem = `"${generateAnimeName()}" set to premiere on ${releaseDate.toDateString()}.`;
        } else {
            // Studio news
            const studio = ANIME_STUDIOS[Math.floor(Math.random() * ANIME_STUDIOS.length)];
            newsItem = `${studio} announces plans to expand their production capacity for upcoming projects.`;
        }

        newsItems.push(newsItem);
    }

    return newsItems;
}

function generateAnimeName() {
    const adjectives = ['Eternal', 'Mystic', 'Radiant', 'Shadowy', 'Celestial', 'Whimsical', 'Chaotic', 'Serene'];
    const nouns = ['Blade', 'Heart', 'Dream', 'Destiny', 'Chronicle', 'Odyssey', 'Realm', 'Legend'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
}

async function fetchTopAnime() {
    try {
        const response = await axios.get('https://api.jikan.moe/v4/top/anime');
        return response.data.data.slice(0, 10); // Get the top 10 anime
    } catch (error) {
        console.error('Error fetching top anime data:', error);
        return [];
    }
}

async function postAnimeNews(client) {
    console.log('postAnimeNews function called');
    
    // Find all guilds with an 'anime-updates' channel
    const guildsWithAnimeChannel = client.guilds.cache.filter(guild => 
        guild.channels.cache.some(channel => channel.name === 'anime-updates')
    );

    for (const guild of guildsWithAnimeChannel.values()) {
        const channel = guild.channels.cache.find(ch => ch.name === 'anime-updates');
        console.log(`Found anime-updates channel in guild: ${guild.name}`);
        
        const newsRole = guild.roles.cache.find(role => role.name === 'news');
        
        if (!channel) {
            console.error(`Anime updates channel not found in guild: ${guild.name}`);
            continue;
        }

        console.log('Sending initial message');
        await channel.send(`${newsRole ? newsRole.toString() : '@animeNews'} Good morning degenerates! Here's what's new in the world of anime!`);

        console.log('Generating fake news');
        const newsItems = generateFakeAnimeNews();
        for (const item of newsItems) {
            console.log('Sending news item:', item.substring(0, 50) + '...');
            await channel.send(item);
        }

        // Weekly top anime update
        const today = new Date();
        if (today.getDay() === 0) { // Sunday
            console.log('It\'s Sunday, fetching top anime');
            const topAnime = await fetchTopAnime();
            if (topAnime.length > 0) {
                console.log('Creating top anime embed');
                const topAnimeEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Top Anime of the Week!')
                    .setDescription('Here are the current top 10 anime according to MyAnimeList:')
                    .setTimestamp();

                topAnime.forEach((anime, index) => {
                    topAnimeEmbed.addFields({ 
                        name: `${index + 1}. ${anime.title}`, 
                        value: `Rating: ${anime.score} | Episodes: ${anime.episodes || 'N/A'}\n[More info](${anime.url})`
                    });
                });

                console.log('Sending top anime embed');
                await channel.send({ content: "Here is the top anime of the week!", embeds: [topAnimeEmbed] });
            }
        }
    }
    console.log('postAnimeNews function completed');
}

const forceUpdateCommand = {
    data: new SlashCommandBuilder()
        .setName('force-anime-news')
        .setDescription('Force an anime news update (Admin only)'),
    execute: async function(interaction) {
        console.log('Force anime news command triggered');
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            console.log('User not authorized:', interaction.user.id);
            return interaction.reply({ content: 'This command is for administrators only.', ephemeral: true });
        }

        console.log('User authorized, deferring reply');
        await interaction.deferReply();
        
        console.log('Calling postAnimeNews');
        await postAnimeNews(interaction.client);
        
        console.log('Anime news posted, editing reply');
        await interaction.editReply('Anime news update has been forced.');
        console.log('Force anime news command completed');
    }
};

module.exports = { postAnimeNews, forceUpdateCommand };