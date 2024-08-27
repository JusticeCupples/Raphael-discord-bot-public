const { Client, Message } = require("discord.js");
const { filterBadWords } = require("../utils/badwords");
const giveUserXp = require("../utils/giveUserXp");
const { ping } = require("../utils/ping");

/**
 * Handles the messageCreate event.
 *
 * @param {Client} client
 * @param {Message} message
 */
module.exports = async (client, message) => {
  if (message.author.bot) return;

  console.log(
    `Received message from ${message.author.tag}: ${message.content}`
  );

  await ping(message);

  // Filter out bad words
  await filterBadWords(message);

  // Give user XP
  await giveUserXp(client, message);

  console.log(`Processed message from ${message.author.tag}`);
};