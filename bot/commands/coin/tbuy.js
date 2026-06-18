const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "tbuy",
    aliases: ["teamshop"],
    description: "Achète des items depuis le shop de team (troupes, cadenas)",
    category: "coin",
    usage: ["tbuy army <type> <nb>", "tbuy lock <type>"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId   = message.guild.id;
        const userId    = message.author.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const teams     = client.db.get(`teams_${guildId}`) || [];
        const idx       = teams.findIndex(t => t.members?.includes(userId));
        if (idx === -1) return message.reply(`Vous n'êtes dans aucune team.`);
        const team = teams[idx];
        if (!['Fondateur', 'Co-fondateur'].includes(team.ranks?.[userId])) {
            return message.reply(`Seul le Fondateur ou Co-fondateur peut acheter depuis la banque de team.`);
        }

        const sub = args[0];
        const P = client.db.get(`prefix_${guildId}`) || '&';

        if (sub === 'army') {
            const armyRanks = client.db.get(`army_ranks_${guildId}`) || [
                { name: 'Recrue', cost: 50,  power: 1  },
                { name: 'Soldat', cost: 150, power: 3  },
                { name: 'Élite',  cost: 500, power: 10 },
            ];
            const typeName  = args[1];
            const nb        = parseInt(args[2]);
            if (!typeName || isNaN(nb) || nb <= 0) return message.reply(`Usage : \`${P}tbuy army <Recrue|Soldat|Élite> <nb>\``);
            const troop = armyRanks.find(r => r.name.toLowerCase() === typeName.toLowerCase());
            if (!troop) return message.reply(`Type inconnu. Disponibles : ${armyRanks.map(r => r.name).join(', ')}`);
            const totalCost = troop.cost * nb;
            if ((team.bank || 0) < totalCost) return message.reply(`Banque insuffisante : **${team.bank||0} ${coinEmoji}** / **${totalCost} ${coinEmoji}** requis.`);
            teams[idx].bank  = (team.bank  || 0) - totalCost;
            teams[idx].army  = (team.army  || 0) + nb;
            client.db.set(`teams_${guildId}`, teams);
            return message.reply(`✅ **${nb} ${troop.name}(s)** recrutés pour **${totalCost} ${coinEmoji}** depuis la banque !`);
        }

        if (sub === 'lock') {
            const locks = client.db.get(`team_locks_${guildId}`) || [
                { id: 'bronze', name: 'Cadenas Bronze', cost: 500,  power: 50,  duration: 24 },
                { id: 'silver', name: 'Cadenas Argent', cost: 1500, power: 150, duration: 48 },
                { id: 'gold',   name: 'Cadenas Or',     cost: 5000, power: 500, duration: 72 },
            ];
            const lockType = args[1];
            if (!lockType) {
                return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('🔒 Cadenas disponibles').setColor('#F1C40F')
                    .setDescription(locks.map(l => `**${l.name}** — ${l.cost} ${coinEmoji} — Puissance: +${l.power} — Durée: ${l.duration}h`).join('\n'))
                ]}));
            }
            const lock = locks.find(l => l.id === lockType || l.name.toLowerCase().includes(lockType.toLowerCase()));
            if (!lock) return message.reply(`Cadenas inconnu.`);
            if ((team.bank || 0) < lock.cost) return message.reply(`Banque insuffisante : **${team.bank||0} ${coinEmoji}** / **${lock.cost} ${coinEmoji}** requis.`);
            teams[idx].bank = (team.bank || 0) - lock.cost;
            teams[idx].lock = lock.id;
            client.db.set(`teams_${guildId}`, teams);
            client.db.set(`lock_power_${lock.id}_${guildId}`, lock.power);
            client.db.set(`lock_${lock.id}_name_${guildId}`, lock.name);
            setTimeout(() => {
                const updatedTeams = client.db.get(`teams_${guildId}`) || [];
                const tIdx = updatedTeams.findIndex(t => t.id === team.id);
                if (tIdx !== -1 && updatedTeams[tIdx].lock === lock.id) {
                    updatedTeams[tIdx].lock = null;
                    client.db.set(`teams_${guildId}`, updatedTeams);
                    message.guild.members.cache.get(team.founder)?.user.send(`⏰ Le cadenas **${lock.name}** de votre team **${team.name}** a expiré !`).catch(() => {});
                }
            }, lock.duration * 3600000);
            return message.reply(`🔒 **${lock.name}** installé sur la banque de **${team.name}** pour **${lock.duration}h** !`);
        }

        message.reply(`Usage : \`${P}tbuy army <type> <nb>\` ou \`${P}tbuy lock [type]\``);
    }
};
