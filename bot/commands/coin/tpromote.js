const Discord = require('discord.js');
const RANKS_ORDER = ['Membre', 'Officier', 'Co-fondateur', 'Fondateur'];
module.exports = {
    name: "tpromote",
    aliases: [],
    description: "Augmente le grade d'un membre dans la team",
    category: "coin",
    usage: ["tpromote <@membre>"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId = message.guild.id;
        const userId = message.author.id;
        const teams = client.db.get(`teams_${guildId}`) || [];
        const idx = teams.findIndex(t => t.members?.includes(userId));
        if (idx === -1) return message.reply(`Vous n'êtes dans aucune team.`);
        const team = teams[idx];
        if (!['Fondateur', 'Co-fondateur'].includes(team.ranks?.[userId])) return message.reply(`Seul le Fondateur ou Co-fondateur peut promouvoir.`);
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target || !team.members.includes(target.id)) return message.reply(`Ce membre n'est pas dans votre team.`);
        if (target.id === team.founder) return message.reply(`Le fondateur est déjà au rang maximum.`);
        const teamRanks = client.db.get(`team_ranks_${guildId}`) || RANKS_ORDER;
        const currentRankIdx = teamRanks.indexOf(team.ranks[target.id] || 'Membre');
        const maxIdx = userId === team.founder ? teamRanks.length - 2 : teamRanks.indexOf('Officier');
        if (currentRankIdx >= maxIdx) return message.reply(`Ce membre est déjà au rang maximum que vous pouvez attribuer.`);
        const newRank = teamRanks[currentRankIdx + 1];
        teams[idx].ranks[target.id] = newRank;
        if (newRank === 'Co-fondateur') teams[idx].coFounders = [...(teams[idx].coFounders || []), target.id];
        client.db.set(`teams_${guildId}`, teams);
        message.reply(`✅ ${target} a été promu **${newRank}** dans la team **${team.name}** !`);
    }
};
