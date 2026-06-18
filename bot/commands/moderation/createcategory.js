const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "createcategory",
    aliases: ["createcat"],
    description: "Crée une catégorie de salons",
    category: "moderation",
    usage: ["createcategory <nom>"],
    run: async (client, message, args, color, prefix, footer, commandName) => {
        let pass = false;
        if (!client.staff.includes(message.author.id) && !client.config.buyers.includes(message.author.id) && client.db.get(`owner_${message.author.id}`) !== true) {
            for (let i = 1; i <= 5; i++) {
                if (client.db.get(`perm_${commandName}.${message.guild.id}`) === String(i) && message.member.roles.cache.some(r => client.db.get(`perm${i}.${message.guild.id}`)?.includes(r.id))) pass = true;
            }
            if (client.db.get(`perm_${commandName}.${message.guild.id}`) === "public") pass = true;
        } else pass = true;
        if (!pass) return message.channel.send(`Vous n'avez pas la permission d'utiliser cette commande.`);

        if (!args[0]) return message.reply(`Veuillez indiquer un nom de catégorie.`);
        const name = args.join(' ');

        const cat = await message.guild.channels.create(name, { type: 'GUILD_CATEGORY', reason: `Créé par ${message.author.tag}` });

        message.channel.send({ embeds: [new Discord.EmbedBuilder()
            .setColor(color)
            .setDescription(`✅ Catégorie **${cat.name}** créée avec succès.`)
            .setTimestamp()
        ]});
    }
};
