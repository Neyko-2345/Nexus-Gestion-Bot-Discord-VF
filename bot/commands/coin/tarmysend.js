const Discord = require('discord.js');
module.exports = {
    name: "tarmysend",
    aliases: [],
    description: "Envoie des troupes à une autre team (renforcement)",
    category: "coin",
    usage: ["tarmysend <teamid> <nb_troupes>"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId = message.guild.id;
        const userId = message.author.id;
        const teams = client.db.get(`teams_${guildId}`) || [];
        const myTeamIdx = teams.findIndex(t => t.members?.includes(userId));
        if (myTeamIdx === -1) return message.reply(`Vous n'êtes dans aucune team.`);
        const myTeam = teams[myTeamIdx];
        if (!['Fondateur', 'Co-fondateur'].includes(myTeam.ranks?.[userId])) return message.reply(`Seul le Fondateur ou Co-fondateur peut envoyer des troupes.`);
        const targetId = args[0];
        const nb = parseInt(args[1]);
        if (!targetId || isNaN(nb) || nb <= 0) return message.reply(`Usage : \`${client.db.get(`prefix_${guildId}`)||'&'}tarmysend <teamid> <nb_troupes>\``);
        const targetIdx = teams.findIndex(t => t.id === targetId);
        if (targetIdx === -1) return message.reply(`Team ID \`${targetId}\` introuvable.`);
        if ((myTeam.army || 0) < nb) return message.reply(`Votre armée n'a que **${myTeam.army||0}** troupes.`);
        teams[myTeamIdx].army = (myTeam.army || 0) - nb;
        teams[targetIdx].army = (teams[targetIdx].army || 0) + nb;
        client.db.set(`teams_${guildId}`, teams);
        // Notif au fondateur de la team cible
        const targetFounder = teams[targetIdx].founder;
        const targetMember = message.guild.members.cache.get(targetFounder);
        targetMember?.user.send(`⚔️ La team **${myTeam.name}** vous a envoyé **${nb} troupes** en renforcement !`).catch(() => {});
        message.reply(`✅ **${nb} troupes** envoyées à la team **${teams[targetIdx].name}**.`);
    }
};
