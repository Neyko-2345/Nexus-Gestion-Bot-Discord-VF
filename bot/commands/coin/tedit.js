const Discord = require('discord.js');
module.exports = {
    name: "tedit",
    aliases: ["teamrename"],
    description: "Modifie les informations de la team (fondateur)",
    category: "coin",
    usage: ["tedit name <nouveau_nom>", "tedit description <texte>"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId = message.guild.id;
        const userId = message.author.id;
        const teams = client.db.get(`teams_${guildId}`) || [];
        const idx = teams.findIndex(t => t.founder === userId || t.members?.includes(userId) && t.ranks?.[userId] === 'Co-fondateur');
        if (idx === -1) return message.reply(`Vous devez être fondateur ou co-fondateur de votre team.`);
        const sub = args[0];
        const val = args.slice(1).join(' ');
        if (!sub || !val) return message.reply(`Usage : \`${prefix}tedit name <nouveau_nom>\` ou \`${prefix}tedit description <texte>\``);
        if (sub === 'name') {
            if (teams.find((t, i) => i !== idx && t.name.toLowerCase() === val.toLowerCase())) return message.reply(`Ce nom est déjà utilisé.`);
            teams[idx].name = val;
        } else if (sub === 'description') {
            teams[idx].description = val;
        } else return message.reply(`Option inconnue. Utilisez : name, description`);
        client.db.set(`teams_${guildId}`, teams);
        message.reply(`✅ Team modifiée : **${sub}** → **${val}**`);
    }
};
