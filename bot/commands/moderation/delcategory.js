const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "delcategory",
    aliases: ["deletecat", "dcat"],
    description: "Supprime une catégorie de salons",
    category: "moderation",
    usage: ["delcategory <nom ou ID>"],
    run: async (client, message, args, color, prefix, footer, commandName) => {
        let pass = false;
        if (!client.staff.includes(message.author.id) && !client.config.buyers.includes(message.author.id) && client.db.get(`owner_${message.author.id}`) !== true) {
            for (let i = 1; i <= 5; i++) {
                if (client.db.get(`perm_${commandName}.${message.guild.id}`) === String(i) && message.member.roles.cache.some(r => client.db.get(`perm${i}.${message.guild.id}`)?.includes(r.id))) pass = true;
            }
            if (client.db.get(`perm_${commandName}.${message.guild.id}`) === "public") pass = true;
        } else pass = true;
        if (!pass) return message.channel.send(`Vous n'avez pas la permission d'utiliser cette commande.`);

        if (!args[0]) return message.reply(`Veuillez indiquer un nom ou ID de catégorie.`);
        const name = args.join(' ').toLowerCase();
        const cat = message.guild.channels.cache.get(args[0]) || message.guild.channels.cache.find(c => c.type === 'GUILD_CATEGORY' && c.name.toLowerCase() === name);
        if (!cat || cat.type !== 'GUILD_CATEGORY') return message.reply(`Catégorie introuvable.`);

        const catName = cat.name;
        await cat.delete(`Supprimé par ${message.author.tag}`);

        message.channel.send({ embeds: [new Discord.EmbedBuilder()
            .setColor(color)
            .setDescription(`✅ Catégorie **${catName}** supprimée.`)
            .setTimestamp()
        ]});
    }
};
