const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { token, mongoURI } = require('../config/secret.js');
const messageCreateHandler = require('../events/messageCreate');
const { memeCommand, forceWeeklyMemeCommand, postWeeklyMemes, memeSpamCommand } = require('../commands/memes');
const { postAnimeNews, forceUpdateCommand, executeForceUpdate } = require('../commands/animeNews');
const animeRecommendationCommand = require('../commands/embeds/animeRecommendation');
const cron = require('node-cron');
const giveUserXp = require('../utils/giveUserXp');
const { filterBadWords } = require('../utils/badwords');
const { ping } = require('../utils/ping');
const { handleButton, handleModalSubmit } = require('../handlers/buttonHandler');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Discord bot is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.commands = new Collection();

// Register all commands
const commandsPath = path.join(__dirname, '..', 'commands');
const commandFiles = fs.readdirSync(commandsPath);

function loadCommand(filePath) {
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[INFO] Skipping ${filePath} as it's not a slash command.`);
  }
}

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const stat = fs.statSync(filePath);

  if (stat.isDirectory()) {
    // If it's a directory, load commands from it
    const folderFiles = fs.readdirSync(filePath).filter(file => file.endsWith('.js'));
    for (const folderFile of folderFiles) {
      loadCommand(path.join(filePath, folderFile));
    }
  } else if (file.endsWith('.js')) {
    // If it's a JavaScript file, try to load it as a command
    loadCommand(filePath);
  }
}

// Add special commands
if (memeCommand && memeCommand.data) {
  client.commands.set(memeCommand.data.name, memeCommand);
}
if (forceWeeklyMemeCommand && forceWeeklyMemeCommand.data) {
  client.commands.set(forceWeeklyMemeCommand.data.name, forceWeeklyMemeCommand);
}
if (memeSpamCommand && memeSpamCommand.data) {
  client.commands.set(memeSpamCommand.data.name, memeSpamCommand);
}
if (animeRecommendationCommand && animeRecommendationCommand.data) {
  client.commands.set(animeRecommendationCommand.data.name, animeRecommendationCommand);
}

// Handle forceUpdateCommand separately
if (forceUpdateCommand && forceUpdateCommand.data) {
  client.commands.set(forceUpdateCommand.data.name, {
    data: forceUpdateCommand,
    execute: executeForceUpdate
  });
}

const rpgCommand = require('../commands/rpg/rpg');
if (rpgCommand && rpgCommand.data) {
  client.commands.set(rpgCommand.data.name, rpgCommand);
}

// Add forceWelcomeCommand
const forceWelcomeCommand = require('../commands/misc/forceWelcome');
if (forceWelcomeCommand && forceWelcomeCommand.data) {
  client.commands.set(forceWelcomeCommand.data.name, forceWelcomeCommand);
}

// Load special commands
const specialCommands = [
  forceUpdateCommand,
  // ... (other special commands)
];

specialCommands.forEach(command => {
  if (command && command.data && command.execute) {
    console.log(`Registering special command: ${command.data.name}`);
    client.commands.set(command.data.name, command);
  } else {
    console.log(`Failed to register special command: ${command?.data?.name || 'unknown'}`);
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("Listening to Lofi girl", { type: "LISTENING" });

  // Add these lines
  const guildMemberAddHandler = require('../events/guildMemberAdd');
  client.on('guildMemberAdd', (member) => guildMemberAddHandler.execute(member));

  // Schedule the anime news post daily at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    postAnimeNews(client);
  });

  // Schedule the weekly meme post every Sunday at 12:00 PM
  cron.schedule('0 12 * * 0', () => {
    postWeeklyMemes(client);
  });
});

client.on("messageCreate", async (message) => {
  await messageCreateHandler(client, message);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.log(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    console.log(`Executing command: ${interaction.commandName}`);
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true }).catch(console.error);
  }
});

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Login to Discord with error handling
client.login(token).catch(error => {
  console.error('Failed to log in to Discord:', error);
  process.exit(1);
});

// Add global error handlers
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});