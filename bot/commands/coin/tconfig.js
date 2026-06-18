const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "tconfig",
    aliases: ["teamconfig", "allianceconfig"],
    description: "Configure le système de teams/alliances (owner)",
    category: "coin",
    ownerOnly: true,
    usage: [
        "tconfig setcreate <prix>",
        "tconfig addrank <nom>",
        "tconfig removerank <nom>",
        "tconfig listranks",
        "tconfig setarmytype <id> <nom> <prix> <puissance>",
        "tconfig removearmytype <id>",
        "tconfig setpointprice <prix_en_coins>",
        "tconfig addlock <nom> <prix> <puissance> <durée_heures>",
        "tconfig removelock <id>",
        "tconfig listlocks",
    ],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id)
            || client.config.buyers.includes(message.author.id)
            || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);

        const guildId   = message.guild.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const sub       = args[0];

        if (!sub) {
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('⚙️ TConfig — Options')
                .setColor(color)
                .setDescription(module.exports.usage.map(u => `\`${prefix}${u}\``).join('\n'))
            ]}));
        }

        if (sub === 'setcreate') {
            const prix = parseInt(args[1]);
            if (isNaN(prix)) return message.reply(`Usage : \`${prefix}tconfig setcreate <prix>\``);
            client.db.set(`team_create_price_${guildId}`, prix);
            return message.reply(`✅ Prix de création de team : **${prix} ${coinEmoji}**.`);
        }

        if (sub === 'addrank') {
            const nom = args.slice(1).join(' ');
            if (!nom) return message.reply(`Indiquez un nom de rang.`);
            const ranks = client.db.get(`team_ranks_${guildId}`) || ['Membre', 'Officier', 'Co-fondateur', 'Fondateur'];
            if (ranks.includes(nom)) return message.reply(`Ce rang existe déjà.`);
            ranks.splice(ranks.length - 1, 0, nom);
            client.db.set(`team_ranks_${guildId}`, ranks);
            return message.reply(`✅ Rang **${nom}** ajouté.`);
        }

        if (sub === 'removerank') {
            const nom   = args.slice(1).join(' ');
            const fixed = ['Membre', 'Fondateur'];
            if (fixed.includes(nom)) return message.reply(`Impossible de supprimer les rangs de base.`);
            const ranks = (client.db.get(`team_ranks_${guildId}`) || []).filter(r => r !== nom);
            client.db.set(`team_ranks_${guildId}`, ranks);
            return message.reply(`✅ Rang **${nom}** supprimé.`);
        }

        if (sub === 'listranks') {
            const ranks = client.db.get(`team_ranks_${guildId}`) || ['Membre', 'Officier', 'Co-fondateur', 'Fondateur'];
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('⚔️ Rangs de team')
                .setColor(color)
                .setDescription(ranks.map((r, i) => `**${i + 1}.** ${r}`).join('\n'))
            ]}));
        }

        if (sub === 'setarmytype') {
            const [, id, nom, prix, puissance] = args;
            if (!id || !nom || !prix || !puissance) return message.reply(`Usage : \`${prefix}tconfig setarmytype <id> <nom> <prix> <puissance>\``);
            const army  = client.db.get(`army_ranks_${guildId}`) || [
                { id: 'recrue', name: 'Recrue', cost: 50,  power: 1  },
                { id: 'soldat', name: 'Soldat', cost: 150, power: 3  },
                { id: 'elite',  name: 'Élite',  cost: 500, power: 10 },
            ];
            const idx     = army.findIndex(a => a.id === id);
            const updated = { id, name: nom, cost: parseInt(prix), power: parseInt(puissance) };
            if (idx !== -1) army[idx] = updated; else army.push(updated);
            client.db.set(`army_ranks_${guildId}`, army);
            return message.reply(`✅ Type d'armée **${nom}** configuré.`);
        }

        if (sub === 'removearmytype') {
            const id = args[1];
            client.db.set(`army_ranks_${guildId}`, (client.db.get(`army_ranks_${guildId}`) || []).filter(a => a.id !== id));
            return message.reply(`✅ Type d'armée \`${id}\` supprimé.`);
        }

        if (sub === 'setpointprice') {
            const prix = parseInt(args[1]);
            if (isNaN(prix)) return message.reply(`Indiquez un prix.`);
            client.db.set(`team_point_price_${guildId}`, prix);
            return message.reply(`✅ 1 point de team = **${prix} ${coinEmoji}** depuis la banque.`);
        }

        if (sub === 'addlock') {
            const [, nom, prix, puissance, duree] = args;
            if (!nom || !prix || !puissance || !duree) return message.reply(`Usage : \`${prefix}tconfig addlock <nom> <prix> <puissance> <durée_heures>\``);
            const { v4: uuidv4 } = require('uuid');
            const locks = client.db.get(`team_locks_${guildId}`) || [
                { id: 'bronze', name: 'Cadenas Bronze', cost: 500,  power: 50,  duration: 24 },
                { id: 'silver', name: 'Cadenas Argent', cost: 1500, power: 150, duration: 48 },
                { id: 'gold',   name: 'Cadenas Or',     cost: 5000, power: 500, duration: 72 },
            ];
            locks.push({ id: uuidv4().substring(0, 6), name: nom, cost: parseInt(prix), power: parseInt(puissance), duration: parseInt(duree) });
            client.db.set(`team_locks_${guildId}`, locks);
            return message.reply(`✅ Cadenas **${nom}** ajouté.`);
        }

        if (sub === 'removelock') {
            client.db.set(`team_locks_${guildId}`, (client.db.get(`team_locks_${guildId}`) || []).filter(l => l.id !== args[1]));
            return message.reply(`✅ Cadenas supprimé.`);
        }

        if (sub === 'listlocks') {
            const locks = client.db.get(`team_locks_${guildId}`) || [];
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('🔒 Cadenas disponibles')
                .setColor(color)
                .setDescription(locks.length > 0
                    ? locks.map(l => `\`${l.id}\` **${l.name}** — ${l.cost} ${coinEmoji} | Puissance: ${l.power} | Durée: ${l.duration}h`).join('\n')
                    : 'Aucun cadenas.')
            ]}));
        }

        message.reply(`Sous-commande inconnue. Tapez \`${prefix}tconfig\` pour voir les options.`);
    }
};
