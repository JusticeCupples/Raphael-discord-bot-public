const { Client, Message } = require('discord.js');
const { filterBadWords } = require('../commands/badwords');
const giveUserXp = require('../commands/giveUserXp');

/**
 * Handles the messageCreate event.
 *
 * @param {Client} client
 * @param {Message} message
 */
module.exports = async (client, message) => {
  if (message.author.bot) return;

  // Filter out bad words
  await filterBadWords(message);

  // Give user XP
  await giveUserXp(client, message);
};