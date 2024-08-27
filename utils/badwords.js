const badwords = ["tea", "british", "shit", "fuck", "innit", "te(a", "t3a", "!nnit"];

const filterBadWords = async (message) => {
  if (message.author.bot) return;
  const foundWord = badwords.find((word) => message.content.includes(word));
  if (foundWord) {
    await message.delete();
    message.channel.send(`Uh oh! ${message.author.username} said the "${foundWord}" word`);
  }
};

module.exports = { filterBadWords };