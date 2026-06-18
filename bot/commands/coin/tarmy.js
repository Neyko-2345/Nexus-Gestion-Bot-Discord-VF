const Discord = require('discord.js');

module.exports = {
    name: "tarmy",
    aliases: ["armyteam"],
    description: "Gère l'armée de votre team",
    category: "coin",
    usage: ["tarmy"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId   = message.guild.id;
        const userId    = message.author.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const teams     = client.db.get(`teams_${guildId}`) || [];
        const team      = teams.find(t => t.members?.includes(userId));
        if (!team) return message.reply(`Vous n'êtes dans aucune team.`);

        const armyRanks = client.db.get(`army_ranks_${guildId}`) || [
            { name: 'Recrue', cost: 50,  power: 1  },
            { name: 'Soldat', cost: 150, power: 3  },
            { name: 'Élite',  cost: 500, power: 10 },
        ];

        const embed = new Discord.EmbedBuilder()
            .setTitle(`⚔️ Armée — ${team.name}`)
            .setDescription(
                `**Troupes actuelles : ${team.army || 0}**\n` +
                `Banque de la team : **${team.bank || 0} ${coinEmoji}**\n\n` +
                `**Types de troupes disponibles :**\n` +
                armyRanks.map(r => `${r.name} — ${r.cost} ${coinEmoji}/troupe — Puissance: ${r.power}`).join('\n') +
                `\n\nPour recruter : \`${client.db.get(`prefix_${guildId}`) || '&'}tbuy army <type> <nb>\``
            )
            .setColor('#F1C40F').setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
