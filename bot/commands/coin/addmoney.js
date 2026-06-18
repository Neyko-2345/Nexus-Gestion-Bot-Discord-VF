const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "addmoney",
    aliases: ["addcoins", "givemoney"],
    description: "Ajoute des coins à un membre (owner seulement)",
    category: "coin",
    ownerOnly: true,
    usage: ["addmoney <@membre> <montant> [coin|bronze|silver|gold|celestial]"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send(`Cette commande est réservée aux owners.`);

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target) return message.reply(`Mentionnez un membre.`);
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) return message.reply(`Montant invalide.`);
        const monnaie = args[2] || 'coin';

        const guildId = message.guild.id;
        const dbKey = monnaie === 'coin' ? `coin_hand_${target.id}_${guildId}` : `coin_${monnaie}_${target.id}_${guildId}`;
        client.db.add(dbKey, amount);
        const newTotal = client.db.get(dbKey) || 0;

        message.channel.send({ embeds: [new Discord.EmbedBuilder()
            .setColor('#57F287').setTimestamp()
            .setDescription(`✅ **${amount}** ${monnaie} ajouté(s) à ${target}.\nNouveau solde : **${newTotal}**`)
        ]});
    }
};
