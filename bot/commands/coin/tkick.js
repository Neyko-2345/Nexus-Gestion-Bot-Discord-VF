const Discord = require('discord.js');
module.exports = {
    name: "tkick",
    aliases: [],
    description: "Expulse un membre de votre team",
    category: "coin",
    usage: ["tkick <@membre>"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId = message.guild.id;
        const userId = message.author.id;
        const teams = client.db.get(`teams_${guildId}`) || [];
        const idx = teams.findIndex(t => t.members?.includes(userId));
        if (idx === -1) return message.reply(`Vous n'êtes dans aucune team.`);
        const team = teams[idx];
        const rank = team.ranks?.[userId];
        if (!['Fondateur', 'Co-fondateur'].includes(rank)) return message.reply(`Seul le Fondateur ou Co-fondateur peut expulser.`);
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target) return message.reply(`Mentionnez un membre.`);
        if (!team.members.includes(target.id)) return message.reply(`Ce membre n'est pas dans votre team.`);
        if (target.id === team.founder) return message.reply(`Impossible d'expulser le fondateur.`);
        teams[idx].members = teams[idx].members.filter(id => id !== target.id);
        delete teams[idx].ranks[target.id];
        client.db.set(`teams_${guildId}`, teams);
        message.reply(`✅ ${target} a été expulsé de la team **${team.name}**.`);
        target.user.send(`Vous avez été expulsé de la team **${team.name}** sur **${message.guild.name}**.`).catch(() => {});
    }
};
