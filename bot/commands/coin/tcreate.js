const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    name: "tcreate",
    aliases: ["teamcreate", "createteam"],
    description: "Crée une nouvelle alliance/team",
    category: "coin",
    usage: ["tcreate <nom_team>"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId   = message.guild.id;
        const userId    = message.author.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';

        if (!args[0]) return message.reply(`Indiquez un nom pour votre team.`);
        const name = args.join(' ');

        const teams = client.db.get(`teams_${guildId}`) || [];
        const existing = teams.find(t => t.members?.includes(userId));
        if (existing) return message.reply(`Vous êtes déjà dans la team **${existing.name}**. Quittez-la d'abord avec \`${prefix}tleave\`.`);
        if (teams.find(t => t.name.toLowerCase() === name.toLowerCase())) return message.reply(`Une team nommée **${name}** existe déjà.`);

        const price = client.db.get(`team_create_price_${guildId}`) || 0;
        const hand  = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
        if (price > 0 && hand < price) return message.reply(`Créer une team coûte **${price} ${coinEmoji}**. Vous n'en avez pas assez.`);
        if (price > 0) client.db.subtract(`coin_hand_${userId}_${guildId}`, price);

        const team = {
            id:         uuidv4().substring(0, 6).toUpperCase(),
            name,
            bank:       0,
            rep:        0,
            lock:       null,
            army:       0,
            founder:    userId,
            coFounders: [],
            members:    [userId],
            ranks:      { [userId]: 'Fondateur' },
            createdAt:  Date.now()
        };
        teams.push(team);
        client.db.set(`teams_${guildId}`, teams);

        message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
            .setColor('#F1C40F').setTimestamp()
            .setTitle(`⚔️ Team créée !`)
            .setDescription(`La team **${name}** a été créée !\nID : \`${team.id}\`\n${price > 0 ? `Coût : -${price} ${coinEmoji}` : ''}`)
        ]}));
    }
};
