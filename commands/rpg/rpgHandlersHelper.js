const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Character = require('../../models/Character');
const Guild = require('../../models/Guild');
const { weightedRandomChoice, EVENTS, ENCOUNTERS } = require('./diveUtilsHelper');

async function handleMainMenu(interaction, character) {
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('RPG Menu')
    .setDescription(`Welcome, ${character.name}!`);

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('rpg_dive')
        .setLabel('Dive')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('rpg_shop')
        .setLabel('Shop')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('rpg_guild')
        .setLabel('Guild')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('rpg_help')
        .setLabel('Help')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.editReply({ embeds: [embed], components: [row] });
}

async function handleDive(interaction, character) {
  try {
    if (character.isDiving) {
      return await interaction.editReply('You are already on a dive!');
    }

    const now = new Date();
    if (character.diveEndTime && now < character.diveEndTime) {
      const timeLeft = Math.ceil((character.diveEndTime - now) / 1000);
      return await interaction.editReply(`You need to wait ${timeLeft} seconds before diving again.`);
    }

    character.isDiving = true;
    await character.save();

    const diveEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Dive Started')
      .setDescription(`${character.name} has started a dive into the Abyss!`);

    await interaction.editReply({ embeds: [diveEmbed] });

    let currentLayer = 1;
    let rewards = { gold: 0, experience: 0, items: [] };

    while (currentLayer <= character.currentLayer) {
      const eventType = weightedRandomChoice(EVENTS);
      const result = await handleEncounter(interaction, character, eventType, currentLayer);
      if (!result.continueDiving) {
        break;
      }
      currentLayer++;
      rewards.gold += Math.floor(Math.random() * 50) + 10;
      rewards.experience += Math.floor(Math.random() * 20) + 5;
      if (Math.random() < 0.1) {
        rewards.items.push('Random Item');
      }
    }

    character.isDiving = false;
    character.diveEndTime = new Date(Date.now() + 15000); // 15 seconds cooldown
    character.currency += rewards.gold;
    character.experience += rewards.experience;
    if (!Array.isArray(character.inventory)) {
      character.inventory = [];
    }
    rewards.items.forEach(item => {
      const existingItem = character.inventory.find(i => i.item === item);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        character.inventory.push({ item: item, quantity: 1 });
      }
    });
    await character.save();

    const rewardEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Dive Rewards')
      .setDescription(`Your dive has ended. Here are your rewards:`)
      .addFields(
        { name: 'Gold', value: rewards.gold.toString(), inline: true },
        { name: 'Experience', value: rewards.experience.toString(), inline: true },
        { name: 'Items', value: rewards.items.length > 0 ? rewards.items.join(', ') : 'None', inline: true }
      );

    await interaction.followUp({ embeds: [rewardEmbed] });
  } catch (error) {
    console.error('Error in handleDive:', error);
    await interaction.editReply('An error occurred during your dive. Please try again later.');
  }
}

async function handleShop(interaction, character) {
  const STORE_ITEMS = [
    { name: 'Health Potion', price: 50, description: 'Restores 50 HP' },
    { name: 'Strength Elixir', price: 100, description: 'Temporarily increases attack by 10' },
    { name: 'Defense Charm', price: 100, description: 'Temporarily increases defense by 10' },
  ];

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Shop')
    .setDescription(`Your current balance: ${character.currency} gold`)
    .addFields(
      STORE_ITEMS.map(item => ({
        name: `${item.name} - ${item.price} gold`,
        value: item.description
      }))
    );

  const buttons = STORE_ITEMS.map((item, index) => 
    new ButtonBuilder()
      .setCustomId(`buy_${index}`)
      .setLabel(`Buy ${item.name}`)
      .setStyle(ButtonStyle.Primary)
  );

  const backButton = new ButtonBuilder()
    .setCustomId('back_to_rpg')
    .setLabel('Back')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents([...buttons, backButton]);

  await interaction.editReply({ embeds: [embed], components: [row] });
}

async function handleGuild(interaction, character) {
  const guild = await Guild.findOne({ members: character.userId });

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Guild Menu');

  const row = new ActionRowBuilder();

  if (guild) {
    embed.setDescription(`You are a member of ${guild.name}`);
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('guild_info')
        .setLabel('Guild Info')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('guild_treasury')
        .setLabel('Treasury')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('guild_research')
        .setLabel('Research')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('guild_planned_dive')
        .setLabel('Planned Dive')
        .setStyle(ButtonStyle.Primary)
    );
  } else {
    embed.setDescription('You are not a member of any guild');
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('guild_create')
        .setLabel('Create Guild (1000 gold)')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('guild_join')
        .setLabel('Join Guild')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  const backButton = new ButtonBuilder()
    .setCustomId('back_to_rpg')
    .setLabel('Back')
    .setStyle(ButtonStyle.Secondary);

  row.addComponents(backButton);

  await interaction.editReply({ embeds: [embed], components: [row] });
}

async function handleHelp(interaction, character) {
  const helpEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('RPG Help')
    .setDescription('Here are the available RPG actions:')
    .addFields(
      { name: 'Dive', value: 'Start a dive into the Abyss' },
      { name: 'Shop', value: 'Access the in-game shop' },
      { name: 'Guild', value: 'Access guild-related actions' },
      { name: 'Help', value: 'Show this help message' }
    )
    .setFooter({ text: 'Use the buttons to interact with the RPG game!' });

  await interaction.editReply({ embeds: [helpEmbed] });
}

async function handleEncounter(interaction, character, eventType, currentLayer) {
  if (!ENCOUNTERS[eventType] || ENCOUNTERS[eventType].length === 0) {
    console.warn(`No encounters found for event type: ${eventType}`);
    return { continueDiving: true };
  }

  const encounter = ENCOUNTERS[eventType][Math.floor(Math.random() * ENCOUNTERS[eventType].length)];
  
  const encounterEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`Layer ${currentLayer} Encounter`)
    .setDescription(encounter.description);

  await interaction.followUp({ embeds: [encounterEmbed] });

  // For simplicity, we're always continuing the dive
  // You might want to add more complex logic here based on the encounter outcome
  return { continueDiving: true };
}

module.exports = {
  handleMainMenu,
  handleDive,
  handleShop,
  handleGuild,
  handleHelp,
  handleEncounter, // Add this line to export the new function
};