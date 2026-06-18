const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "removerole",
    aliases: ["rrole"],
    description: "Retire un rôle à un membre",
    category: "moderation",
    usage: ["removerole <membre> <rôle>"],
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
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]) || message.guild.roles.cache.find(r => r.name === args.slice(1).join(' '));
        if (!role) return message.reply(`Veuillez mentionner un rôle.`);

        await member.roles.remove(role);

        message.channel.send({ embeds: [new Discord.EmbedBuilder()
            .setColor(color)
            .setDescription(`✅ Rôle <@&${role.id}> retiré à ${member}.`)
            .setTimestamp()
        ]});
    }
};
