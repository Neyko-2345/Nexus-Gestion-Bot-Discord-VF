const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "setfooter",
    aliases: ["footer"],
    description: "Change le footer des embeds (owner seulement)",
    category: "gestion",
    ownerOnly: true,
    usage: ["setfooter <texte>"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send(`Cette commande est réservée aux owners.`);

        if (!args[0]) return message.reply(`Indiquez un texte de footer.`);
        const newFooter = args.join(' ');
        client.db.set(`footer_${message.guild.id}`, newFooter);
        message.reply(`✅ Footer changé en : **${newFooter}**`);
    }
};
