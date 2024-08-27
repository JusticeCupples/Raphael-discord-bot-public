const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token, GUILD_ID, CLIENT_ID } = require("../secret");
const fs = require('fs');
const path = require('path');

const commands = [];
const commandFolders = ['economy', 'rpg', 'embeds', 'misc'];

for (const folder of commandFolders) {
  const folderPath = path.join(__dirname, folder);
  if (fs.existsSync(folderPath)) {
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      } else {
        console.log(`[INFO] Skipping ${filePath} as it's not a slash command.`);
      }
    }
  } else {
    console.log(`[INFO] Folder ${folderPath} does not exist. Skipping.`);
  }
}

// Add special commands
const { forceUpdateCommand } = require('./animeNews');
const { memeCommand, forceWeeklyMemeCommand, memeSpamCommand } = require('./memes');
const animeRecommendationCommand = require('./embeds/animeRecommendation');
const customRollCommand = require('./misc/custom-roll');

const specialCommands = [
  forceUpdateCommand,
  memeCommand,
  forceWeeklyMemeCommand,
  memeSpamCommand,
  animeRecommendationCommand,
  customRollCommand
];

// Use a Set to ensure unique command names
const uniqueCommands = new Set(commands.map(cmd => cmd.name));

specialCommands.forEach(command => {
  if (command && command.data && !uniqueCommands.has(command.data.name)) {
    commands.push(command.data.toJSON());
    uniqueCommands.add(command.data.name);
  }
});

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();