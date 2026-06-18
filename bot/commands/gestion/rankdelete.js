const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "rankdelete",
    aliases: ["deleterank", "delrank"],
    description: "Supprime un rank (owner seulement)",
    category: "gestion",
    usage: ["rankdelete <nom_du_rank>"],
    ownerOnly: true,
    run: async (client, message, args, color, prefix, footer, commandName) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send(`Cette commande est réservée aux owners.`);

        const rankName = args.join(' ');
        if (!rankName) return message.reply(`Veuillez indiquer un nom de rank.`);

        const ranks = client.db.get(`ranks_${message.guild.id}`) || [];
        const idx = ranks.findIndex(r => r.name.toLowerCase() === rankName.toLowerCase());
        if (idx === -1) return message.reply(`Rank \`${rankName}\` introuvable.`);

        const removed = ranks.splice(idx, 1)[0];
        // Réordonner
        ranks.forEach((r, i) => { r.order = i + 2; });
        client.db.set(`ranks_${message.guild.id}`, ranks);

        for (const cmd of (removed.commands || [])) {
            client.db.delete(`rank_cmd_${cmd}.${message.guild.id}`);
        }

        message.reply(`✅ Rank **${removed.name}** supprimé.`);
    }
};
