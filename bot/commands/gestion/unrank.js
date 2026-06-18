const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "unrank",
    aliases: [],
    description: "Retire un rank à un membre (retire les rôles associés)",
    category: "gestion",
    usage: ["unrank <membre> <nom_du_rank>"],
    run: async (client, message, args, color, prefix, footer, commandName) => {
        let pass = false;
        if (!client.staff.includes(message.author.id) && !client.config.buyers.includes(message.author.id) && client.db.get(`owner_${message.author.id}`) !== true) {
            for (let i = 1; i <= 5; i++) {
                if (client.db.get(`perm_${commandName}.${message.guild.id}`) === String(i) && message.member.roles.cache.some(r => client.db.get(`perm${i}.${message.guild.id}`)?.includes(r.id))) pass = true;
            }
            if (client.db.get(`perm_${commandName}.${message.guild.id}`) === "public") pass = true;
        } else pass = true;
        if (!pass) return message.channel.send(`Vous n'avez pas la permission d'utiliser cette commande.`);

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) return message.reply(`Veuillez mentionner un membre.`);

        const rankName = args.slice(1).join(' ');
        if (!rankName) return message.reply(`Veuillez indiquer un nom de rank.`);

        const ranks = client.db.get(`ranks_${message.guild.id}`) || [];
        const rank = ranks.find(r => r.name.toLowerCase() === rankName.toLowerCase());
        if (!rank) return message.reply(`Rank \`${rankName}\` introuvable.`);

        for (const roleId of (rank.roles || [])) {
            try { await member.roles.remove(roleId); } catch (e) {}
        }

        const embed = new Discord.EmbedBuilder()
            .setColor(color).setTimestamp()
            .setDescription(`✅ Le rank **${rank.name}** a été retiré à ${member}.`);
        message.channel.send({ embeds: [embed] });

        const rankLogsChan = client.db.get(`ranklogs_${message.guild.id}`);
        if (rankLogsChan) {
            const logEmbed = new Discord.EmbedBuilder()
                .setColor(color).setTimestamp()
                .setDescription(`${message.author} a retiré le rank **${rank.name}** à ${member}`);
            message.guild.channels.cache.get(rankLogsChan)?.send({ embeds: [logEmbed] });
        }
    }
};
