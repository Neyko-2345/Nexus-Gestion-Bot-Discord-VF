const Discord = require('discord.js');
const RANKS_ORDER = ['Membre', 'Officier', 'Co-fondateur', 'Fondateur'];
module.exports = {
    name: "tdemote",
    aliases: [],
    description: "Baisse le grade d'un membre dans la team",
    category: "coin",
    usage: ["tdemote <@membre>"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId = message.guild.id;
        const userId = message.author.id;
        const teams = client.db.get(`teams_${guildId}`) || [];
        const idx = teams.findIndex(t => t.members?.includes(userId));
        if (idx === -1) return message.reply(`Vous n'êtes dans aucune team.`);
        const team = teams[idx];
        if (!['Fondateur', 'Co-fondateur'].includes(team.ranks?.[userId])) return message.reply(`Seul le Fondateur ou Co-fondateur peut rétrograder.`);
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target || !team.members.includes(target.id)) return message.reply(`Ce membre n'est pas dans votre team.`);
        if (target.id === team.founder) return message.reply(`Impossible de rétrograder le fondateur.`);
        const teamRanks = client.db.get(`team_ranks_${guildId}`) || RANKS_ORDER;
        const currentRankIdx = teamRanks.indexOf(team.ranks[target.id] || 'Membre');
        if (currentRankIdx <= 0) return message.reply(`Ce membre est déjà au rang minimum.`);
        const newRank = teamRanks[currentRankIdx - 1];
        if (newRank !== 'Co-fondateur') teams[idx].coFounders = (teams[idx].coFounders || []).filter(id => id !== target.id);
        teams[idx].ranks[target.id] = newRank;
        client.db.set(`teams_${guildId}`, teams);
        message.reply(`✅ ${target} a été rétrogradé au rang **${newRank}** dans la team **${team.name}**.`);
    }
};
