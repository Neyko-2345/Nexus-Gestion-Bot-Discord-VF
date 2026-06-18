const Discord = require('discord.js');

module.exports = {
    name: "tinfos",
    aliases: ["tinfo", "teaminfo"],
    description: "Affiche les informations d'une team",
    category: "coin",
    usage: ["tinfos [nom_team|id]"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId   = message.guild.id;
        const userId    = message.author.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const teams     = client.db.get(`teams_${guildId}`) || [];

        let team;
        if (args[0]) {
            team = teams.find(t => t.id === args[0] || t.name.toLowerCase() === args.join(' ').toLowerCase());
        } else {
            team = teams.find(t => t.members?.includes(userId));
        }
        if (!team) return message.reply(`Team introuvable. Indiquez un nom ou un ID, ou rejoignez une team.`);

        const memberList = (team.members || []).slice(0, 10).map(id => {
            const rank = team.ranks?.[id] || 'Membre';
            return `<@${id}> — ${rank}`;
        }).join('\n') || 'Aucun membre';

        const lockName  = team.lock ? (client.db.get(`lock_${team.lock}_name_${guildId}`) || team.lock) : 'Aucun';

        const embed = new Discord.EmbedBuilder()
            .setTitle(`⚔️ Team — ${team.name}`)
            .setColor('#F1C40F').setTimestamp()
            .addFields({ name: 'ID', value: `\`${team.id}\``, inline: true })
            .addFields({ name: 'Réputation', value: `⭐ ${team.rep   || 0}`, inline: true })
            .addFields({ name: 'Banque', value: `💰 ${team.bank  || 0} ${coinEmoji}`, inline: true })
            .addFields({ name: 'Fondateur', value: `<@${team.founder}>`, inline: true })
            .addFields({ name: 'Cadenas', value: lockName, inline: true })
            .addFields({ name: 'Armée', value: `⚔️ ${team.army  || 0} troupes`, inline: true })
            .addFields({ name: `Membres (${(team.members || []).length})`, value: memberList, inline: false });
        message.channel.send({ embeds: [embed] });
    }
};
