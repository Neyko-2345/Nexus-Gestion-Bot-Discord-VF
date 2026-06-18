const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "delchannel",
    aliases: ["deletechan", "dchan"],
    description: "Supprime un salon",
    category: "moderation",
    usage: ["delchannel [salon]"],
    run: async (client, message, args, color, prefix, footer, commandName) => {
        let pass = false;
        if (!client.staff.includes(message.author.id) && !client.config.buyers.includes(message.author.id) && client.db.get(`owner_${message.author.id}`) !== true) {
            for (let i = 1; i <= 5; i++) {
                if (client.db.get(`perm_${commandName}.${message.guild.id}`) === String(i) && message.member.roles.cache.some(r => client.db.get(`perm${i}.${message.guild.id}`)?.includes(r.id))) pass = true;
            }
            if (client.db.get(`perm_${commandName}.${message.guild.id}`) === "public") pass = true;
        } else pass = true;
        if (!pass) return message.channel.send(`Vous n'avez pas la permission d'utiliser cette commande.`);

        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;
        const name = channel.name;

        const logsEmbed = new Discord.EmbedBuilder()
            .setColor(color).setTimestamp()
            .setDescription(`${message.author} a supprimé le salon \`#${name}\``);
        message.guild.channels.cache.get(client.db.get(`modlogs_${message.guild.id}`))?.send({ embeds: [logsEmbed] });

        if (channel.id !== message.channel.id) {
            message.channel.send({ embeds: [new Discord.EmbedBuilder().setColor(color).setDescription(`✅ Salon \`#${name}\` supprimé.`)] });
        }
        await channel.delete(`Supprimé par ${message.author.tag}`);
    }
};
