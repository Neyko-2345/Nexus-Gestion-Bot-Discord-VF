const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "ranklist",
    aliases: ["ranks"],
    description: "Affiche la liste des ranks disponibles sur le serveur",
    category: "gestion",
    usage: ["ranklist"],
    run: async (client, message, args, color, prefix, footer, commandName) => {
        let pass = false;
        if (!client.staff.includes(message.author.id) && !client.config.buyers.includes(message.author.id) && client.db.get(`owner_${message.author.id}`) !== true) {
            for (let i = 1; i <= 5; i++) {
                if (client.db.get(`perm_${commandName}.${message.guild.id}`) === String(i) && message.member.roles.cache.some(r => client.db.get(`perm${i}.${message.guild.id}`)?.includes(r.id))) pass = true;
            }
            if (client.db.get(`perm_${commandName}.${message.guild.id}`) === "public") pass = true;
        } else pass = true;
        if (!pass) return message.channel.send(`Vous n'avez pas la permission d'utiliser cette commande.`);

        const ranks = client.db.get(`ranks_${message.guild.id}`) || [];

        const embed = new Discord.EmbedBuilder()
            .setTitle(`📋 Ranks disponibles — ${message.guild.name}`)
            .setColor(color).setTimestamp();

        if (ranks.length === 0) {
            embed.setDescription(`Aucun rank configuré.\nUtilisez \`${prefix}rankcreate <nom> <@role1> [@role2...] <commande1> [commande2...]\` pour en créer un.`);
        } else {
            // Trier par ordre hiérarchique (numéro)
            const sorted = [...ranks].sort((a, b) => (a.order || 0) - (b.order || 0));
            sorted.forEach((r, i) => {
                const roles = (r.roles || []).map(id => `<@&${id}>`).join(', ') || 'Aucun rôle';
                const cmds = (r.commands || []).length > 0 ? (r.commands || []).map(c => `\`${prefix}${c}\``).join(', ') : 'Aucune commande';
                embed.addFields({ name: `#${r.order || i+1} — ${r.name}`, value: `**Rôles :** ${roles}\n**Commandes :** ${cmds}`, inline: false });
            });
        }

        message.channel.send({ embeds: [embed] });
    }
};
