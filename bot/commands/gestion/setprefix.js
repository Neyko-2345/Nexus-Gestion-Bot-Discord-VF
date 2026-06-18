const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "setprefix",
    aliases: ["prefix"],
    description: "Change le prefix du bot sur ce serveur (owner seulement)",
    category: "gestion",
    ownerOnly: true,
    usage: ["setprefix <nouveau_prefix>"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send(`Cette commande est réservée aux owners.`);

        if (!args[0]) return message.reply(`Veuillez indiquer un prefix.`);
        const newPrefix = args[0];
        client.db.set(`prefix_${message.guild.id}`, newPrefix);

        message.reply({ embeds: [new Discord.EmbedBuilder()
            .setColor(color).setTimestamp()
            .setDescription(`✅ Prefix changé en \`${newPrefix}\``)
        ]});
    }
};
