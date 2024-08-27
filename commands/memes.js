const axios = require('axios');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const SUBREDDITS = {
  animemes: 'animemes',
  dankmemes: 'dankmemes',
  random: ['memes', 'wholesomememes', 'me_irl', 'funny']
};

async function getRandomMeme(subreddit) {
  try {
    const response = await axios.get(`https://www.reddit.com/r/${subreddit}/random.json`);
    const post = response.data[0].data.children[0].data;
    return {
      title: post.title,
      url: post.url,
      author: post.author,
      permalink: post.permalink,
      upvotes: post.ups,
      subreddit: post.subreddit
    };
  } catch (error) {
    console.error(`Error fetching meme from ${subreddit}:`, error);
    return null;
  }
}

async function getMultipleMemes(subreddit, count) {
  try {
    const response = await axios.get(`https://www.reddit.com/r/${subreddit}/hot.json?limit=${count}`);
    return response.data.data.children.map(child => ({
      title: child.data.title,
      url: child.data.url,
      author: child.data.author,
      permalink: child.data.permalink,
      upvotes: child.data.ups,
      subreddit: child.data.subreddit
    }));
  } catch (error) {
    console.error(`Error fetching multiple memes from ${subreddit}:`, error);
    return [];
  }
}

async function getTopWeeklyMemes(subreddit) {
  try {
    const response = await axios.get(`https://www.reddit.com/r/${subreddit}/top.json?sort=top&t=week&limit=10`);
    return response.data.data.children.map(child => ({
      title: child.data.title,
      url: child.data.url,
      author: child.data.author,
      permalink: child.data.permalink,
      upvotes: child.data.ups,
      subreddit: child.data.subreddit
    }));
  } catch (error) {
    console.error(`Error fetching top weekly memes from ${subreddit}:`, error);
    return [];
  }
}

const memeCommand = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Get a random meme')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of meme')
        .setRequired(true)
        .addChoices(
          { name: 'Anime', value: 'animemes' },
          { name: 'Dank', value: 'dankmemes' },
          { name: 'Random', value: 'random' }
        )),
  async execute(interaction) {
    const memeType = interaction.options.getString('type');
    let subreddit = SUBREDDITS[memeType];
    
    if (memeType === 'random') {
      subreddit = subreddit[Math.floor(Math.random() * subreddit.length)];
    }

    const meme = await getRandomMeme(subreddit);
    if (!meme) {
      return interaction.reply('Sorry, I couldn\'t fetch a meme at the moment. Please try again later.');
    }

    const embed = new EmbedBuilder()
      .setTitle(meme.title)
      .setImage(meme.url)
      .setURL(`https://reddit.com${meme.permalink}`)
      .setFooter({ text: `Posted by u/${meme.author} | 👍 ${meme.upvotes} | From r/${meme.subreddit}` });

    await interaction.reply({ embeds: [embed] });
  },
};

const forceWeeklyMemeCommand = {
  data: new SlashCommandBuilder()
    .setName('forceweekmemes')
    .setDescription('Force post the top 10 weekly memes')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of meme')
        .setRequired(true)
        .addChoices(
          { name: 'Anime', value: 'animemes' },
          { name: 'Dank', value: 'dankmemes' },
          { name: 'Random', value: 'random' }
        )),
  async execute(interaction) {
    const memeType = interaction.options.getString('type');
    let subreddit = SUBREDDITS[memeType];
    
    if (memeType === 'random') {
      subreddit = subreddit[Math.floor(Math.random() * subreddit.length)];
    }

    const memes = await getTopWeeklyMemes(subreddit);
    if (memes.length === 0) {
      return interaction.reply('Sorry, I couldn\'t fetch the top weekly memes at the moment. Please try again later.');
    }

    const memeChannel = interaction.guild.channels.cache.find(channel => channel.name === 'memes');
    if (!memeChannel) {
      return interaction.reply('The memes channel doesn\'t exist. Please create a channel named "memes".');
    }

    await interaction.reply('Posting top weekly memes...');

    for (const meme of memes) {
      const embed = new EmbedBuilder()
        .setTitle(meme.title)
        .setImage(meme.url)
        .setURL(`https://reddit.com${meme.permalink}`)
        .setFooter({ text: `Posted by u/${meme.author} | 👍 ${meme.upvotes} | From r/${meme.subreddit}` });

      await memeChannel.send({ embeds: [embed] });
    }

    await interaction.followUp('Top weekly memes have been posted in the memes channel!');
  },
};

const memeSpamCommand = {
  data: new SlashCommandBuilder()
    .setName('memespam')
    .setDescription('Post 30 memes in the meme-spam channel')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of meme')
        .setRequired(true)
        .addChoices(
          { name: 'Anime', value: 'animemes' },
          { name: 'Dank', value: 'dankmemes' },
          { name: 'Random', value: 'random' }
        )),
  async execute(interaction) {
    const memeType = interaction.options.getString('type');
    let subreddit = SUBREDDITS[memeType];
    
    if (memeType === 'random') {
      subreddit = subreddit[Math.floor(Math.random() * subreddit.length)];
    }

    const memeSpamChannel = interaction.guild.channels.cache.find(channel => channel.name === 'meme-spam');
    if (!memeSpamChannel) {
      return interaction.reply('The meme-spam channel doesn\'t exist. Please create a channel named "meme-spam".');
    }

    if (interaction.channel.id !== memeSpamChannel.id) {
      return interaction.reply('This command can only be used in the #meme-spam channel.');
    }

    await interaction.deferReply();

    const memes = await getMultipleMemes(subreddit, 30);
    if (memes.length === 0) {
      return interaction.editReply('Sorry, I couldn\'t fetch any memes at the moment. Please try again later.');
    }

    await interaction.editReply('Posting 30 memes...');

    for (const meme of memes) {
      const embed = new EmbedBuilder()
        .setTitle(meme.title)
        .setImage(meme.url)
        .setURL(`https://reddit.com${meme.permalink}`)
        .setFooter({ text: `Posted by u/${meme.author} | 👍 ${meme.upvotes} | From r/${meme.subreddit}` });

      await memeSpamChannel.send({ embeds: [embed] });
    }

    await interaction.followUp('30 memes have been posted in the meme-spam channel!');
  },
};

async function postWeeklyMemes(client) {
  const memeTypes = ['animemes', 'dankmemes', 'random'];
  const randomMemeType = memeTypes[Math.floor(Math.random() * memeTypes.length)];
  let subreddit = SUBREDDITS[randomMemeType];
  
  if (randomMemeType === 'random') {
    subreddit = subreddit[Math.floor(Math.random() * subreddit.length)];
  }

  const memes = await getTopWeeklyMemes(subreddit);
  if (memes.length === 0) {
    console.error('Failed to fetch top weekly memes');
    return;
  }

  const guild = client.guilds.cache.first();
  const memeChannel = guild.channels.cache.find(channel => channel.name === 'memes');
  if (!memeChannel) {
    console.error('Memes channel not found');
    return;
  }

  await memeChannel.send(`Top 10 ${randomMemeType.charAt(0).toUpperCase() + randomMemeType.slice(1)} Memes of the Week:`);

  for (const meme of memes) {
    const embed = new EmbedBuilder()
      .setTitle(meme.title)
      .setImage(meme.url)
      .setURL(`https://reddit.com${meme.permalink}`)
      .setFooter({ text: `Posted by u/${meme.author} | 👍 ${meme.upvotes} | From r/${meme.subreddit}` });

    await memeChannel.send({ embeds: [embed] });
  }
}

module.exports = {
  memeCommand,
  forceWeeklyMemeCommand,
  memeSpamCommand,
  postWeeklyMemes
};