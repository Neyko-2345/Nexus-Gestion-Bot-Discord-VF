const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "coininfo",
    aliases: ["economie", "economy"],
    description: "Affiche la configuration actuelle du bot coin",
    category: "coin",
    ownerOnly: true,
    usage: ["coininfo"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send(`Cette commande est réservée aux owners.`);

        const guildId = message.guild.id;
        const channels = (client.db.get(`coin_channels_${guildId}`) || []).map(id => `<#${id}>`).join(', ') || 'Aucun';

        const embed = new Discord.EmbedBuilder()
            .setTitle('⚙️ Configuration Bot Coin')
            .setColor(color).setTimestamp()
            .addFields({ name: 'Daily', value: `${client.db.get(`coin_daily_amount_${guildId}`) || 100} coins`, inline: true })
            .addFields({ name: 'Work', value: `${client.db.get(`coin_work_min_${guildId}`) || 30} – ${client.db.get(`coin_work_max_${guildId}`) || 80} coins`, inline: true })
            .addFields({ name: 'Wagon', value: `${client.db.get(`wagon_max_uses_${guildId}`) || 10} utilisations`, inline: true })
            .addFields({ name: 'Salons coin', value: channels, inline: false })
            .addFields({ name: 'Taux Bronze', value: `${client.db.get(`convert_bronze_to_coin_${guildId}`) || 10} coins = 1 Bronze`, inline: true })
            .addFields({ name: 'Taux Argent', value: `${client.db.get(`convert_silver_to_bronze_${guildId}`) || 10} Bronze = 1 Argent`, inline: true })
            .addFields({ name: 'Taux Or', value: `${client.db.get(`convert_gold_to_silver_${guildId}`) || 10} Argent = 1 Or`, inline: true })
            .addFields({ name: 'Taux Céleste', value: `${client.db.get(`convert_celestial_to_gold_${guildId}`) || 10} Or = 1 Pièce Céleste`, inline: true });

        message.channel.send({ embeds: [embed] });
    }
};
