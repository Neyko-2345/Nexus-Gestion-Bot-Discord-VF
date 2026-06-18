const Discord = require('discord.js');
module.exports = {
    name: "tleave",
    aliases: ["teamleave"],
    description: "Quitte votre team actuelle",
    category: "coin",
    usage: ["tleave"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId = message.guild.id;
        const userId = message.author.id;
        const teams = client.db.get(`teams_${guildId}`) || [];
        const idx = teams.findIndex(t => t.members?.includes(userId));
        if (idx === -1) return message.reply(`Vous n'êtes dans aucune team.`);
        const team = teams[idx];
        if (team.founder === userId) return message.reply(`Vous êtes fondateur. Transférez d'abord la team ou supprimez-la avec \`${client.db.get(`prefix_${guildId}`) || '&'}tdelete\`.`);
        teams[idx].members = teams[idx].members.filter(id => id !== userId);
        delete teams[idx].ranks[userId];
        teams[idx].coFounders = (teams[idx].coFounders || []).filter(id => id !== userId);
        client.db.set(`teams_${guildId}`, teams);
        message.reply(`✅ Vous avez quitté la team **${team.name}**.`);
    }
};
