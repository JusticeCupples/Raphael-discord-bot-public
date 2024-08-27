const ping = async (message) => {
    if (message.author.bot) return false;
    
    if (message.content === "ping") {
      try {
        // Fetching the server (gateway) ping
        const serverPing = message.client.ws.ping;
  
        // Fetching the bot's response time
        const sentMessage = await message.reply("Pinging...");
        const botPing = sentMessage.createdTimestamp - message.createdTimestamp;
  
        // Create a message with the network stats
        const response = `
          **Server Ping:** ${serverPing}ms
          **Bot Ping:** ${botPing}ms
          **API Latency:** ${Math.round(message.client.ws.ping)}ms
        `;
  
        // Edit the message with the network stats
        await sentMessage.edit(response);
      } catch (error) {
        console.error(`Error handling ping command: ${error.message}`);
        message.reply("An error occurred while fetching ping stats.");
      }
    }
  };
  
  module.exports = {ping};