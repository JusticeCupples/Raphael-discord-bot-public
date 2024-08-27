const welcomeMessages = [
  "Welcome to our vibrant community!",
  "We're thrilled to have you join us!",
  "A new adventurer has arrived!",
  "Welcome aboard! Your journey begins now.",
  "Greetings, traveler! You've found your new home."
];

function generateWelcomeText(member) {
  const welcomeMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  
  return `${welcomeMessage}

We're excited to have you join our diverse and friendly community. Whether you're here for anime discussions, meme sharing, or engaging in our unique RPG experience, you've come to the right place!

Our server is designed to be a hub for entertainment, creativity, and friendship. We encourage you to explore the various channels and participate in our many activities. From weekly anime news updates to thrilling RPG adventures, there's something for everyone here.

To get started, please take a moment to familiarize yourself with our server rules in the #rules channel. We strive to maintain a respectful and inclusive environment for all members, so your cooperation is greatly appreciated.

Don't forget to introduce yourself in the #introductions channel! Tell us a bit about yourself, your interests, and what brought you here. It's a great way to connect with fellow members who share your passions.

We have several special features that make our server unique:
1. An immersive RPG system where you can create a character and embark on exciting adventures.
2. Regular anime news updates and discussions.
3. A dedicated meme channel for sharing laughs.
4. Weekly polls and community events to keep things lively.

To customize your experience, please use the reaction roles below to access specific channels that interest you. This helps us tailor your server experience to your preferences.

If you have any questions or need assistance, don't hesitate to ask in the #help channel or reach out to our friendly moderators. We're here to ensure you have a great time in our community.

Once again, welcome to our server! We look forward to getting to know you and hope you'll find a home away from home here. Enjoy your stay and let the adventures begin!`;
}

module.exports = { generateWelcomeText };
