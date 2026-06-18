const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "createrole",
    aliases: ["crole"],
    description: "Crée un rôle",
    category: "moderation",
    usage: ["createrole <nom> [couleur hex]"],
    run: async (client, message, args, color, prefix, footer, commandName) => {
        let pass = false;
        if (!client.staff.includes(message.author.id) && !client.config.buyers.includes(message.author.id) && client.db.get(`owner_${message.author.id}`) !== true) {
            for (let i = 1; i <= 5; i++) {
                if (client.db.get(`perm_${commandName}.${message.guild.id}`) === String(i) && message.member.roles.cache.some(r => client.db.get(`perm${i}.${message.guild.id}`)?.includes(r.id))) pass = true;
            }
            if (client.db.get(`perm_${commandName}.${message.guild.id}`) === "public") pass = true;
        } else pass = true;
        if (!pass) return message.channel.send(`Vous n'avez pas la permission d'utiliser cette commande.`);

        if (!args[0]) return message.reply(`Veuillez indiquer un nom de rôle.`);
        const roleColor = args[args.length - 1]?.startsWith('#') ? args.pop() : null;
        const name = args.join(' ');

        const role = await message.guild.roles.create({
            name,
            color: roleColor || null,
            reason: `Créé par ${message.author.tag}`,
        });

        message.channel.send({ embeds: [new Discord.EmbedBuilder()
            .setColor(role.hexColor || color)
            .setDescription(`✅ Rôle <@&${role.id}> créé avec succès.`)
            .setTimestamp()
        ]});

        message.guild.channels.cache.get(client.db.get(`modlogs_${message.guild.id}`))?.send({ embeds: [new Discord.EmbedBuilder()
            .setColor(color).setTimestamp()
            .setDescription(`${message.author} a créé le rôle \`${role.name}\``)
        ]});
    }
};
