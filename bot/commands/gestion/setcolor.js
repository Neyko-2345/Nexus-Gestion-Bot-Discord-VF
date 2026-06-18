const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "setcolor",
    aliases: ["color", "couleur"],
    description: "Change la couleur des embeds (owner seulement)",
    category: "gestion",
    ownerOnly: true,
    usage: ["setcolor <#hex>"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send(`Cette commande est réservée aux owners.`);

        if (!args[0]) return message.reply(`Indiquez une couleur hex (ex: #FF0000).`);
        const newColor = args[0].startsWith('#') ? args[0] : `#${args[0]}`;
        if (!/^#[0-9A-Fa-f]{6}$/.test(newColor)) return message.reply(`Couleur invalide. Format : \`#RRGGBB\``);

        client.db.set(`color_${message.guild.id}`, newColor);
        message.reply({ embeds: [new Discord.EmbedBuilder()
            .setColor(newColor).setTimestamp()
            .setDescription(`✅ Couleur des embeds changée en \`${newColor}\``)
        ]});
    }
};
