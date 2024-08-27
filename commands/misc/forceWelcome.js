const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { generateWelcomeText } = require('../../utils/welcomeTextGenerator');
const { createWelcomeEmbed } = require('../../events/guildMemberAdd');

const ADMIN_IDS = ["380722114623438852", "418901867297505290"];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('force-welcome')
    .setDescription('Force send a welcome message (Admin only)'),

  async execute(interaction) {
    if (!ADMIN_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: 'This command is for administrators only.', ephemeral: true });
    }

    const welcomeChannel = interaction.guild.channels.cache.find(channel => channel.name === 'welcome');
    if (!welcomeChannel) {
      return interaction.reply({ content: 'Welcome channel not found. Please create a channel named "welcome".', ephemeral: true });
    }

    const welcomeText = generateWelcomeText(interaction.member);
    const welcomeEmbed = createWelcomeEmbed(interaction.member, welcomeText);

    try {
      const welcomeMessage = await welcomeChannel.send({ content: `Welcome to our server!`, embeds: [welcomeEmbed] });
      
      // Add reaction roles
      const reactionRoles = {
        '🎭': 'RPG',
        '😂': 'Memes',
        '📺': 'Anime News',
        '🎉': 'Events',
        '💬': 'Discussions'
      };

      for (const emoji of Object.keys(reactionRoles)) {
        await welcomeMessage.react(emoji);
      }

      // Set up a collector for reaction roles
      const filter = (reaction, user) => Object.keys(reactionRoles).includes(reaction.emoji.name) && !user.bot;
      const collector = welcomeMessage.createReactionCollector({ filter, time: 24 * 60 * 60 * 1000 }); // 24 hours

      collector.on('collect', async (reaction, user) => {
        console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
        const roleName = reactionRoles[reaction.emoji.name];
        if (roleName) {
          const role = interaction.guild.roles.cache.find(r => r.name === roleName);
          if (role) {
            try {
              const member = await interaction.guild.members.fetch(user.id);
              await member.roles.add(role);
              console.log(`Added ${roleName} role to ${user.tag}`);
              try {
                await user.send(`You've been given the ${roleName} role!`);
              } catch (error) {
                console.error(`Couldn't send DM to ${user.tag}.`, error);
              }
            } catch (error) {
              console.error(`Error adding role ${roleName} to ${user.tag}:`, error);
            }
          } else {
            console.error(`Role ${roleName} not found in the server.`);
          }
        }
      });

      collector.on('end', () => {
        welcomeMessage.reactions.removeAll().catch(error => console.error('Failed to clear reactions:', error));
      });

      await interaction.reply({ content: 'Welcome message sent successfully!', ephemeral: true });
    } catch (error) {
      console.error('Error sending welcome message:', error);
      await interaction.reply({ content: 'An error occurred while sending the welcome message.', ephemeral: true });
    }
  },
};
