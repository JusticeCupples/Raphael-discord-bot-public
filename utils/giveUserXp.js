const { Client, Message } = require("discord.js");
const calculateLevelXp = require("./calculateLevelXp");
const Level = require("../models/Level");
const cooldowns = new Set();

const COOLDOWN_DURATION = 15000; // 15 seconds for all users

function getRandomXp(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 *
 * @param {Client} client
 * @param {Message} message
 */
module.exports = async (client, message) => {
  if (
    !message.inGuild() ||
    message.author.bot ||
    cooldowns.has(message.author.id)
  )
    return;

  const xpToGive = getRandomXp(1, 100);

  const query = {
    userId: message.author.id,
    guildId: message.guild.id,
  };

  try {
    const level = await Level.findOne(query);

    if (level) {
      level.xp += xpToGive;

      if (level.xp > calculateLevelXp(level.level)) {
        level.xp = 0;
        level.level += 1;

        message.channel.send(
          `${message.member} you have leveled up to **level ${level.level}**.`
        );
      }

      await level.save().catch((e) => {
        console.log(`Error saving updated level ${e}`);
        return;
      });
    } else {
      // create new level
      const newLevel = new Level({
        userId: message.author.id,
        guildId: message.guild.id,
        xp: xpToGive,
      });

      await newLevel.save();
    }

    cooldowns.add(message.author.id);
    setTimeout(() => {
      cooldowns.delete(message.author.id);
    }, COOLDOWN_DURATION);
  } catch (error) {
    console.log(`Error giving xp: ${error}`);
  }
};