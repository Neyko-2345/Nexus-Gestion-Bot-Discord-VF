const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "createchannel",
    aliases: ["createchan", "cchan"],
    description: "Crée un salon texte",
    category: "moderation",
    usage: ["createchannel <nom> [catégorie]"],
    run: async (client, message, args, color, prefix, footer, commandName) => {
        let pass = false;
        if (!client.staff.includes(message.author.id) && !client.config.buyers.includes(message.author.id) && client.db.get(`owner_${message.author.id}`) !== true) {
            for (let i = 1; i <= 5; i++) {
                if (client.db.get(`perm_${commandName}.${message.guild.id}`) === String(i) && message.member.roles.cache.some(r => client.db.get(`perm${i}.${message.guild.id}`)?.includes(r.id))) pass = true;
            }
            if (client.db.get(`perm_${commandName}.${message.guild.id}`) === "public") pass = true;
        } else pass = true;
        if (!pass) return message.channel.send(`Vous n'avez pas la permission d'utiliser cette commande.`);

        if (!args[0]) return message.reply(`Veuillez indiquer un nom de salon.`);
        const name = args[0].toLowerCase().replace(/\s+/g, '-');
        const parent = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);

        const chan = await message.guild.channels.create(name, {
            type: 'GUILD_TEXT',
            parent: parent?.id || null,
            reason: `Créé par ${message.author.tag}`,
        });

        const embed = new Discord.EmbedBuilder()
            .setColor(color)
            .setDescription(`✅ Salon ${chan} créé avec succès.`)
            .setTimestamp();
        message.channel.send({ embeds: [embed] });

        const logsEmbed = new Discord.EmbedBuilder()
            .setColor(color).setTimestamp()
            .setDescription(`${message.author} a créé le salon ${chan}`);
        message.guild.channels.cache.get(client.db.get(`modlogs_${message.guild.id}`))?.send({ embeds: [logsEmbed] });
    }
};
