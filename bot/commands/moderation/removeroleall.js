const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "removeroleall",
    aliases: [],
    description: "Retire un rôle à tous les membres",
    category: "moderation",
    usage: ["removeroleall <rôle>"],
    run: async (client, message, args, color, prefix, footer, commandName) => {
        let pass = false;
        if (!client.staff.includes(message.author.id) && !client.config.buyers.includes(message.author.id) && client.db.get(`owner_${message.author.id}`) !== true) {
            for (let i = 1; i <= 5; i++) {
                if (client.db.get(`perm_${commandName}.${message.guild.id}`) === String(i) && message.member.roles.cache.some(r => client.db.get(`perm${i}.${message.guild.id}`)?.includes(r.id))) pass = true;
            }
            if (client.db.get(`perm_${commandName}.${message.guild.id}`) === "public") pass = true;
        } else pass = true;
        if (!pass) return message.channel.send(`Vous n'avez pas la permission d'utiliser cette commande.`);

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role) return message.reply(`Veuillez mentionner un rôle.`);

        const msg = await message.channel.send({ embeds: [new Discord.EmbedBuilder().setColor(color).setDescription(`⏳ Retrait de <@&${role.id}> à tous les membres...`)] });
        let count = 0;
        await message.guild.members.fetch();
        for (const [, member] of message.guild.members.cache) {
            if (member.user.bot) continue;
            try { await member.roles.remove(role); count++; } catch (e) {}
        }
        msg.edit({ embeds: [new Discord.EmbedBuilder().setColor(color).setDescription(`✅ Rôle <@&${role.id}> retiré à **${count}** membres.`).setTimestamp()] });
    }
};
