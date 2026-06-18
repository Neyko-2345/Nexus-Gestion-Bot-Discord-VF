const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "setxp",
    aliases: ["xpconfig"],
    description: "Configure le gain d'XP par message ou par vocal, et les paliers de niveaux",
    category: "coin",
    ownerOnly: true,
    usage: [
        "setxp msg <gain_par_message>",
        "setxp vocal <gain_par_minute>",
        "setxp off",
        "setxp on",
        "setxp level <niveau> <xp_requis>",
        "setxp listlevels",
    ],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);
        const guildId = message.guild.id;
        const sub = args[0];

        if (!sub) {
            const msgGain = client.db.get(`xp_msg_gain_${guildId}`) ?? 'non configuré';
            const vocalGain = client.db.get(`xp_vocal_gain_${guildId}`) ?? 'non configuré';
            const active = client.db.get(`xp_active_${guildId}`) !== false;
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('📊 Config XP')
                .setColor(color)
                .addFields({ name: 'Statut', value: active ? '✅ Actif' : '❌ Désactivé', inline: true })
                .addFields({ name: 'XP/message', value: String(msgGain), inline: true })
                .addFields({ name: 'XP/min vocal', value: String(vocalGain), inline: true })
                .addFields({ name: 'Niveaux', value: Object.entries(client.db.get(`xp_levels_${guildId}`) || { 1: 0, 2: 100, 3: 250, 4: 500, 5: 1000 })
                    .map(([lvl, xp]) => `Niveau ${lvl} : ${xp} XP`).join('\n'), inline: false })
            ]}));
        }

        if (sub === 'msg') {
            const gain = parseInt(args[1]);
            if (isNaN(gain) || gain < 0) return message.reply(`Gain invalide.`);
            client.db.set(`xp_msg_gain_${guildId}`, gain);
            return message.reply(`✅ XP par message : **${gain}**.`);
        }

        if (sub === 'vocal') {
            const gain = parseInt(args[1]);
            if (isNaN(gain) || gain < 0) return message.reply(`Gain invalide.`);
            client.db.set(`xp_vocal_gain_${guildId}`, gain);
            return message.reply(`✅ XP par minute vocal : **${gain}**.`);
        }

        if (sub === 'off') {
            client.db.set(`xp_active_${guildId}`, false);
            return message.reply(`✅ Système XP **désactivé**.`);
        }

        if (sub === 'on') {
            client.db.set(`xp_active_${guildId}`, true);
            return message.reply(`✅ Système XP **activé**.`);
        }

        if (sub === 'level') {
            const lvl = parseInt(args[1]), xpRequired = parseInt(args[2]);
            if (isNaN(lvl) || isNaN(xpRequired)) return message.reply(`Usage : \`${prefix}setxp level <niveau> <xp_requis>\``);
            const levels = client.db.get(`xp_levels_${guildId}`) || { 1: 0, 2: 100, 3: 250, 4: 500, 5: 1000 };
            levels[lvl] = xpRequired;
            client.db.set(`xp_levels_${guildId}`, levels);
            return message.reply(`✅ Niveau **${lvl}** : **${xpRequired} XP** requis.`);
        }

        if (sub === 'listlevels') {
            const levels = client.db.get(`xp_levels_${guildId}`) || { 1: 0, 2: 100, 3: 250, 4: 500, 5: 1000 };
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('🏅 Paliers de niveaux')
                .setColor(color)
                .setDescription(Object.entries(levels).sort((a,b) => a[0]-b[0]).map(([l, x]) => `Niveau **${l}** — ${x} XP`).join('\n'))
            ]}));
        }

        message.reply(`Sous-commande inconnue. Options : msg, vocal, off, on, level, listlevels`);
    }
};
