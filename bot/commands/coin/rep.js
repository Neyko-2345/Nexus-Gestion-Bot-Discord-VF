const Discord = require('discord.js');

module.exports = {
    name: "rep",
    aliases: ["reputation", "vote"],
    description: "Vote pour un joueur ou une team — donne 1 point de réputation (cooldown 24h)",
    category: "coin",
    usage: ["rep <@membre|teamid>"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId = message.author.id;
        const guildId = message.guild.id;
        const cooldown = 24 * 60 * 60 * 1000;

        const lastRep = client.db.get(`rep_last_${userId}_${guildId}`) || 0;
        const now = Date.now();
        if (now - lastRep < cooldown) {
            const rem = cooldown - (now - lastRep);
            const h = Math.floor(rem / 3600000), m = Math.floor((rem % 3600000) / 60000);
            return message.reply(`⏳ Vous avez déjà voté aujourd'hui ! Revenez dans **${h}h ${m}min**.`);
        }

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        const teamId = args[0];
        const teams = client.db.get(`teams_${guildId}`) || [];
        const team = teams.find(t => t.id === teamId || t.name.toLowerCase() === teamId?.toLowerCase());

        if (!target && !team) return message.reply(`Mentionnez un membre ou indiquez un ID/nom de team.`);

        client.db.set(`rep_last_${userId}_${guildId}`, now);

        if (target && !target.user.bot) {
            if (target.id === userId) return message.reply(`Vous ne pouvez pas voter pour vous-même.`);
            client.db.add(`rep_${target.id}_${guildId}`, 1);
            const newRep = client.db.get(`rep_${target.id}_${guildId}`) || 0;
            return message.channel.send({ embeds: [new Discord.EmbedBuilder()
                .setColor('#F1C40F').setTimestamp()
                .setDescription(`⭐ ${message.author} a donné **+1 réputation** à ${target} !\nRéputation totale : **${newRep}**`)
            ]});
        }

        if (team) {
            const teamIdx = teams.indexOf(team);
            teams[teamIdx].rep = (teams[teamIdx].rep || 0) + 1;
            client.db.set(`teams_${guildId}`, teams);
            return message.channel.send({ embeds: [new Discord.EmbedBuilder()
                .setColor('#F1C40F').setTimestamp()
                .setDescription(`⭐ ${message.author} a donné **+1 réputation** à la team **${team.name}** !\nRéputation totale : **${teams[teamIdx].rep}**`)
            ]});
        }
    }
};
