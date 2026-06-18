const Discord = require('discord.js');
const { bot } = require('../../structures/client');

// Usage: &rankcreate <nom> roles:<@r1,@r2> cmds:<cmd1,cmd2>
// Exemple: &rankcreate Modérateur roles:@Modo cmds:mute,kick,ban
module.exports = {
    name: "rankcreate",
    aliases: ["createrank"],
    description: "Crée un nouveau rank (owner seulement)",
    category: "gestion",
    usage: ["rankcreate <nom> roles:<@role1,...> cmds:<commande1,...>"],
    ownerOnly: true,
    run: async (client, message, args, color, prefix, footer, commandName) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send(`Cette commande est réservée aux owners.`);

        if (args.length < 1) return message.reply(`Usage : \`${prefix}rankcreate <nom> roles:<@role,...> cmds:<commande,...>\`\nExemple : \`${prefix}rankcreate Modérateur roles:@Modo cmds:mute,kick,ban\``);

        const name = args[0];
        const rolesArg = args.find(a => a.startsWith('roles:'));
        const cmdsArg = args.find(a => a.startsWith('cmds:'));

        const roleIds = [];
        if (rolesArg) {
            const roleStr = rolesArg.replace('roles:', '');
            const roleParts = roleStr.split(',');
            for (const rp of roleParts) {
                const match = rp.match(/\d+/);
                if (match) roleIds.push(match[0]);
            }
        }

        const commands = cmdsArg ? cmdsArg.replace('cmds:', '').split(',').map(c => c.trim()).filter(Boolean) : [];

        const ranks = client.db.get(`ranks_${message.guild.id}`) || [];
        if (ranks.find(r => r.name.toLowerCase() === name.toLowerCase())) {
            return message.reply(`Un rank nommé \`${name}\` existe déjà.`);
        }

        const order = ranks.length + 2; // Permission 1 est réservée au rôle de base
        const newRank = { name, roles: roleIds, commands, order, createdAt: Date.now() };
        ranks.push(newRank);
        client.db.set(`ranks_${message.guild.id}`, ranks);

        // Enregistrer les permissions pour chaque commande
        for (const cmd of commands) {
            client.db.set(`rank_cmd_${cmd}.${message.guild.id}`, name);
        }

        const embed = new Discord.EmbedBuilder()
            .setColor(color).setTimestamp()
            .setTitle(`✅ Rank créé`)
            .addFields({ name: 'Nom', value: name, inline: true })
            .addFields({ name: 'Ordre', value: `#${order}`, inline: true })
            .addFields({ name: 'Rôles', value: roleIds.length > 0 ? roleIds.map(id => `<@&${id}>`).join(', ') : 'Aucun', inline: false })
            .addFields({ name: 'Commandes autorisées', value: commands.length > 0 ? commands.map(c => `\`${prefix}${c}\``).join(', ') : 'Aucune', inline: false });
        message.channel.send({ embeds: [embed] });
    }
};
