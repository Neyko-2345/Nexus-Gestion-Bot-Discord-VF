const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "hide",
    aliases: [],
    description: "Rend un salon invisible à tout le monde",
    category: "moderation",
    usage: ["hide [salon]"],
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

        // Sauvegarder les overrides actuels pour pouvoir les restaurer avec &unhide
        const saved = [];
        channel.permissionOverwrites.cache.forEach(ow => {
            saved.push({ id: ow.id, type: ow.type, allow: ow.allow.bitfield.toString(), deny: ow.deny.bitfield.toString() });
        });
        client.db.set(`hide_backup_${channel.id}`, saved);

        await channel.permissionOverwrites.edit(message.guild.roles.everyone, { VIEW_CHANNEL: false });

        const embed = new Discord.EmbedBuilder()
            .setColor(color)
            .setDescription(`✅ ${channel} est maintenant **invisible** pour tout le monde.\nFaites \`${prefix}unhide\` pour le rendre visible à nouveau.`)
            .setTimestamp();
        message.channel.send({ embeds: [embed] });

        const logsEmbed = new Discord.EmbedBuilder()
            .setColor(color)
            .setDescription(`${message.author} a rendu ${channel} invisible`)
            .setTimestamp();
        message.guild.channels.cache.get(client.db.get(`modlogs_${message.guild.id}`))?.send({ embeds: [logsEmbed] });
    }
};
