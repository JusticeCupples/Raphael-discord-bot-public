const { handlers } = require('../commands/rpg/rpg');
const Character = require('../models/Character');
const Guild = require('../models/Guild');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

async function handleButton(interaction) {
  try {
    await interaction.deferUpdate().catch(() => {}); // Defer update once at the beginning
    const buttonId = interaction.customId;

    if (buttonId.startsWith('rpg_')) {
      await handleRpgButton(interaction);
      return;
    }

    if (buttonId === 'guild_create') {
      await handleGuildCreate(interaction);
      return;
    }

    if (buttonId === 'back_to_rpg') {
      await handleBackToRpg(interaction);
      return;
    }

    if (buttonId.startsWith('buy_')) {
      await handleShopBuy(interaction);
      return;
    }

    if (buttonId === 'guild_info' || buttonId === 'guild_treasury' || buttonId === 'guild_research' || buttonId === 'guild_planned_dive' || buttonId === 'guild_join') {
      await handleGuildAction(interaction, buttonId);
      return;
    }

    if (buttonId.startsWith('poll_')) {
      // The poll voting logic is handled in the poll command itself
      return;
    }

    console.warn(`Unhandled button interaction: ${buttonId}`);
    await interaction.editReply({ content: 'This feature is not implemented yet.', ephemeral: true });
  } catch (error) {
    console.error('Error handling button interaction:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
    } else {
      await interaction.editReply({ content: 'An error occurred while processing your request.', ephemeral: true });
    }
  }
}

async function handleRpgButton(interaction) {
  const [_, action] = interaction.customId.split('_');
  const character = await Character.findOne({ userId: interaction.user.id });

  if (!character) {
    return interaction.editReply('You need to create a character first! Use `/character create` to get started.');
  }

  try {
    switch (action) {
      case 'dive':
        await handlers.handleDive(interaction, character);
        break;
      case 'shop':
        await handlers.handleShop(interaction, character);
        break;
      case 'guild':
        await handlers.handleGuild(interaction, character);
        break;
      case 'help':
        await handlers.handleHelp(interaction, character);
        break;
      default:
        await interaction.editReply({ content: 'Unknown RPG action', ephemeral: true });
    }
  } catch (error) {
    console.error('Error handling RPG button interaction:', error);
    await interaction.editReply({ content: 'An error occurred while processing your request. Please try again later.', ephemeral: true });
  }
}

async function handleGuildCreate(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('create_guild_modal')
    .setTitle('Create a Guild');

  const guildNameInput = new TextInputBuilder()
    .setCustomId('guildName')
    .setLabel('Enter the name for your guild')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(50);

  const firstActionRow = new ActionRowBuilder().addComponents(guildNameInput);
  modal.addComponents(firstActionRow);

  await interaction.showModal(modal);
}

async function handleBackToRpg(interaction) {
  const character = await Character.findOne({ userId: interaction.user.id });
  if (character) {
    await handlers.handleMainMenu(interaction, character);
  } else {
    await interaction.editReply('You need to create a character first! Use `/character create` to get started.');
  }
}

async function handleShopBuy(interaction) {
  const itemIndex = parseInt(interaction.customId.split('_')[1]);
  const character = await Character.findOne({ userId: interaction.user.id });

  if (!character) {
    return interaction.editReply('You need to create a character first! Use `/character create` to get started.');
  }

  const STORE_ITEMS = [
    { name: 'Health Potion', price: 50, description: 'Restores 50 HP' },
    { name: 'Strength Elixir', price: 100, description: 'Temporarily increases attack by 10' },
    { name: 'Defense Charm', price: 100, description: 'Temporarily increases defense by 10' },
  ];

  const item = STORE_ITEMS[itemIndex];

  if (!item) {
    return interaction.editReply('Invalid item selection.');
  }

  if (character.currency < item.price) {
    return interaction.editReply(`You don't have enough gold to buy ${item.name}. You need ${item.price} gold.`);
  }

  character.currency -= item.price;
  
  // Add the item to the character's inventory
  if (!character.inventory) {
    character.inventory = [];
  }
  const existingItem = character.inventory.find(i => i.name === item.name);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    character.inventory.push({ name: item.name, quantity: 1 });
  }

  await character.save();

  await interaction.editReply(`You have successfully purchased ${item.name} for ${item.price} gold.`);
}

async function handleGuildAction(interaction, buttonId) {
  const character = await Character.findOne({ userId: interaction.user.id });
  if (!character) {
    return interaction.editReply('You need to create a character first! Use `/character create` to get started.');
  }

  switch (buttonId) {
    case 'guild_info':
      // Implement guild info logic here
      await interaction.editReply('Guild info feature coming soon!');
      break;
    case 'guild_treasury':
      // Implement guild treasury logic here
      await interaction.editReply('Guild treasury feature coming soon!');
      break;
    case 'guild_research':
      // Implement guild research logic here
      await interaction.editReply('Guild research feature coming soon!');
      break;
    case 'guild_planned_dive':
      // Implement planned dive logic here
      await interaction.editReply('Planned dive feature coming soon!');
      break;
    case 'guild_join':
      // Implement guild join logic here
      await interaction.editReply('Guild join feature coming soon!');
      break;
    default:
      await interaction.editReply({ content: 'Unknown guild action', ephemeral: true });
  }
}

module.exports = { handleButton, handleModalSubmit: handleGuildCreate };