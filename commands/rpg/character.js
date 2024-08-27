const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Character = require('../../models/Character');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('character')
    .setDescription('View or create your character')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View your character information'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new character')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Your character name')
            .setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'view') {
      await viewCharacter(interaction);
    } else if (subcommand === 'create') {
      await createCharacter(interaction);
    }
  }
};

async function viewCharacter(interaction) {
  const userId = interaction.user.id;

  try {
    const character = await Character.findOne({ userId });
    if (!character) {
      return interaction.reply('You don\'t have a character yet! Use `/character create` to make one.');
    }

    const infoEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(character.name)
      .setDescription('Your character information')
      .addFields(
        { name: 'Level', value: character.level.toString(), inline: true },
        { name: 'Experience', value: character.experience.toString(), inline: true },
        { name: 'Rank', value: `${character.rank} (${Math.floor(character.rankProgress * 100)}%)`, inline: true },
        { name: 'Health', value: character.health.toString(), inline: true },
        { name: 'Attack', value: character.attack.toString(), inline: true },
        { name: 'Defense', value: character.defense.toString(), inline: true },
        { name: 'Whistle Rank', value: character.whistleRank, inline: true },
        { name: 'Current Layer', value: character.currentLayer.toString(), inline: true },
        { name: 'Inventory', value: character.inventory.map(item => `${item.quantity}x ${item.item}`).join(', ') || 'Empty', inline: false },
        { name: 'Currency', value: character.currency.toString(), inline: true },
        { name: 'Guild', value: character.guildId ? 'Yes' : 'None', inline: true }
      );

    interaction.reply({ embeds: [infoEmbed] });
  } catch (error) {
    console.error('Error fetching character:', error);
    interaction.reply('There was an error fetching your character information. Please try again later.');
  }
}

async function createCharacter(interaction) {
  const userId = interaction.user.id;
  const name = interaction.options.getString('name');

  try {
    let character = await Character.findOne({ userId });
    if (character) {
      return interaction.reply('You already have a character! Use `/character view` to see your character information.');
    }

    character = new Character({
      userId,
      name,
      level: 1,
      experience: 0,
      rank: 'Novice',
      rankProgress: 0,
      health: 100,
      attack: 10,
      defense: 10,
      whistleRank: 'Red',
      currentLayer: 1,
      inventory: [],
      currency: 0
    });

    await character.save();
    interaction.reply(`Character "${name}" created successfully! Use /character view to see your character information.`);
  } catch (error) {
    console.error('Error creating character:', error);
    interaction.reply('There was an error creating your character. Please try again later.');
  }
}