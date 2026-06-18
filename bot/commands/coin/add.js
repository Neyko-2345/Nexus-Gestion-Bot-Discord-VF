const Discord = require('discord.js');

module.exports = {
    name: "add",
    aliases: ["addcoins", "givecoin"],
    description: "Ajoute des ressources à un joueur (coins, minerais, rep, xp...)",
    category: "coin",
    ownerOnly: true,
    usage: ["add <coins|bank|xp|bronze|silver|gold|celestial|rep> [@membre] <montant>", "add team <teamid> <rep|bank> <montant>"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);
        const guildId = message.guild.id;
        const type = args[0];

        if (type === 'team') {
            const teamId = args[1], subType = args[2], amount = parseInt(args[3]);
            const teams = client.db.get(`teams_${guildId}`) || [];
            const idx = teams.findIndex(t => t.id === teamId);
            if (idx === -1) return message.reply(`Team ID \`${teamId}\` introuvable.`);
            if (subType === 'rep') { teams[idx].rep = (teams[idx].rep || 0) + amount; }
            else if (subType === 'bank') { teams[idx].bank = (teams[idx].bank || 0) + amount; }
            else return message.reply(`Type team inconnu : rep, bank`);
            client.db.set(`teams_${guildId}`, teams);
            return message.reply(`✅ +${amount} **${subType}** ajouté à la team **${teams[idx].name}**.`);
        }

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
        const amount = parseInt(args[2] || args[1]);
        if (!target || isNaN(amount)) return message.reply(`Usage : \`${prefix}add <type> [@membre] <montant>\``);
        const userId = target.id;

        const dbKeys = {
            coins: `coin_hand_${userId}_${guildId}`,
            bank: `coin_bank_${userId}_${guildId}`,
            xp: `xp_${userId}_${guildId}`,
            bronze: `coin_bronze_${userId}_${guildId}`,
            silver: `coin_silver_${userId}_${guildId}`,
            gold: `coin_gold_${userId}_${guildId}`,
            celestial: `coin_celestial_${userId}_${guildId}`,
            rep: `rep_${userId}_${guildId}`,
        };
        if (!(type in dbKeys)) return message.reply(`Type inconnu. Disponibles : ${Object.keys(dbKeys).join(', ')}, team`);
        client.db.add(dbKeys[type], amount);
        message.reply(`✅ +${amount} **${type}** ajouté à ${target}.`);
    }
};
