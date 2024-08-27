const { EmbedBuilder } = require('discord.js');
const { generateWelcomeText } = require('../utils/welcomeTextGenerator');

async function execute(member) {
  const welcomeChannel = member.guild.channels.cache.find(channel => channel.name === 'welcome');
  if (!welcomeChannel) return;

  const welcomeText = generateWelcomeText(member);

  const welcomeEmbed = createWelcomeEmbed(member, welcomeText);

  const message = await welcomeChannel.send({
    content: `Welcome ${member}!`,
    embeds: [welcomeEmbed]
  });

  // Add reaction roles
  const reactionRoles = {
    '🎭': 'RPG',
    '😂': 'Memes',
    '📺': 'Anime News',
    '🎉': 'Events',
    '💬': 'Discussions'
  };

  for (const emoji of Object.keys(reactionRoles)) {
    await message.react(emoji);
  }

  // Set up a collector for reaction roles
  const filter = (reaction, user) => Object.keys(reactionRoles).includes(reaction.emoji.name) && user.id === member.id;
  const collector = message.createReactionCollector({ filter, time: 24 * 60 * 60 * 1000 }); // 24 hours

  collector.on('collect', async (reaction, user) => {
    const roleName = reactionRoles[reaction.emoji.name];
    if (roleName) {
      const role = member.guild.roles.cache.find(r => r.name === roleName);
      if (role) {
        await member.roles.add(role);
        try {
          await user.send(`You've been given the ${roleName} role!`);
        } catch (error) {
          console.error(`Couldn't send DM to ${user.tag}.`, error);
        }
      }
    }
  });

  collector.on('end', () => {
    message.reactions.removeAll().catch(error => console.error('Failed to clear reactions:', error));
  });
}

function createWelcomeEmbed(member, welcomeText) {
  return new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`Welcome to ${member.guild.name}!`)
    .setDescription(welcomeText)
    .addFields(
      { name: 'Role Selection', value: 'React to this message to get access to specific channels:' },
      { name: '🎭 RPG', value: 'Access to RPG-related channels and events', inline: true },
      { name: '😂 Memes', value: 'Access to meme channels', inline: true },
      { name: '📺 Anime News', value: 'Receive anime news updates', inline: true },
      { name: '🎉 Events', value: 'Be notified about server events', inline: true },
      { name: '💬 Discussions', value: 'Participate in general discussions', inline: true }
    )
    .setTimestamp();
}

module.exports = {
  name: 'guildMemberAdd',
  execute,
  createWelcomeEmbed
};
