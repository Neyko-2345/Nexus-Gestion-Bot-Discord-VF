const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "rankmodify",
    aliases: ["modrank", "rankmod"],
    description: "Modifie un rank existant (owner seulement)",
    category: "gestion",
    usage: ["rankmodify <nom_actuel> name:<nouveau_nom>", "rankmodify <nom> addcmd:<cmd>", "rankmodify <nom> removecmd:<cmd>", "rankmodify <nom> addrole:<@role>", "rankmodify <nom> removerole:<@role>", "rankmodify <nom> order:<numero>"],
    ownerOnly: true,
    run: async (client, message, args, color, prefix, footer, commandName) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send(`Cette commande est réservée aux owners.`);

        if (args.length < 2) return message.reply(`Usage : \`${prefix}rankmodify <nom_rank> <option:valeur>\`\nOptions : name: addcmd: removecmd: addrole: removerole: order:`);

        const rankName = args[0];
        const ranks = client.db.get(`ranks_${message.guild.id}`) || [];
        const rank = ranks.find(r => r.name.toLowerCase() === rankName.toLowerCase());
        if (!rank) return message.reply(`Rank \`${rankName}\` introuvable.`);

        const option = args[1];

        if (option.startsWith('name:')) {
            rank.name = option.replace('name:', '');
        } else if (option.startsWith('addcmd:')) {
            const cmd = option.replace('addcmd:', '');
            if (!rank.commands.includes(cmd)) rank.commands.push(cmd);
            client.db.set(`rank_cmd_${cmd}.${message.guild.id}`, rank.name);
        } else if (option.startsWith('removecmd:')) {
            const cmd = option.replace('removecmd:', '');
            rank.commands = rank.commands.filter(c => c !== cmd);
            client.db.delete(`rank_cmd_${cmd}.${message.guild.id}`);
        } else if (option.startsWith('addrole:')) {
            const match = option.match(/\d+/);
            if (match && !rank.roles.includes(match[0])) rank.roles.push(match[0]);
        } else if (option.startsWith('removerole:')) {
            const match = option.match(/\d+/);
            if (match) rank.roles = rank.roles.filter(id => id !== match[0]);
        } else if (option.startsWith('order:')) {
            rank.order = parseInt(option.replace('order:', '')) || rank.order;
        } else {
            return message.reply(`Option invalide. Options : name: addcmd: removecmd: addrole: removerole: order:`);
        }

        client.db.set(`ranks_${message.guild.id}`, ranks);
        message.reply(`✅ Rank **${rank.name}** modifié avec succès.`);
    }
};
