const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "unhide",
    aliases: [],
    description: "Remet un salon visible (inverse de &hide)",
    category: "moderation",
    usage: ["unhide [salon]"],
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
        const saved = client.db.get(`hide_backup_${channel.id}`);

        if (!saved) {
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, { VIEW_CHANNEL: null });
        } else {
            for (const ow of saved) {
                try {
                    await channel.permissionOverwrites.edit(ow.id, {
                        allow: BigInt(ow.allow),
                        deny: BigInt(ow.deny),
                    });
                } catch (e) {}
            }
            client.db.delete(`hide_backup_${channel.id}`);
        }

        const embed = new Discord.EmbedBuilder()
            .setColor(color)
            .setDescription(`✅ ${channel} est à nouveau **visible**.`)
            .setTimestamp();
        message.channel.send({ embeds: [embed] });

        const logsEmbed = new Discord.EmbedBuilder()
            .setColor(color)
            .setDescription(`${message.author} a remis ${channel} visible`)
            .setTimestamp();
        message.guild.channels.cache.get(client.db.get(`modlogs_${message.guild.id}`))?.send({ embeds: [logsEmbed] });
    }
};
