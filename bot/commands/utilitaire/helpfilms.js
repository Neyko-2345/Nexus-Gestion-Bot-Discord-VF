const Discord = require('discord.js');

module.exports = {
    name: "helpfilms",
    aliases: ["hf", "helpfilm"],
    description: "Informations sur le Bot Film (salon film uniquement)",
    category: "utilitaire",
    ownerOnly: false,
    usage: ["helpfilms"],

    run: async (client, message, args, color, prefix, footer) => {
        const guildId      = message.guild.id;
        const filmChannels = client.db.get(`film_channels_${guildId}`) || [];

        // Uniquement dans le salon film configuré
        if (filmChannels.length > 0 && !filmChannels.includes(message.channel.id)) {
            return message.channel.send({ embeds: [
                new Discord.EmbedBuilder()
                    .setColor('#5865F2')
                    .setDescription(`❌ Cette commande n'est disponible que dans le salon **Film** configuré.\n\nConfigurez le salon : \`${prefix}filmconfig salon add #salon\``)
            ]});
        }

        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;

        const embed = new Discord.EmbedBuilder()
            .setTitle('🎬 Bot Film — Comment ça marche ?')
            .setColor('#5865F2')
            .setDescription(
                `Le Bot Film fonctionne via un **panel interactif**.\n\n` +
                `**🍿 Pour les membres :**\n` +
                `Utilisez les boutons du panel qui est posté dans ce salon :\n` +
                `• 🔎 **Rechercher** — Trouver un film par son titre\n` +
                `• 💡 **Suggérer** — Proposer un film à ajouter au catalogue\n` +
                `• 📋 **Catalogue** — Parcourir les films par catégorie\n\n` +
                (isOwner ? (
                    `**⚙️ Pour les owners :**\n` +
                    `\`${prefix}panel\` — Affiche le panel (dans ce salon uniquement)\n` +
                    `\`${prefix}filmadd\` — Ajouter un film/série au catalogue (multi-genres)\n` +
                    `\`${prefix}filmconfig\` — Config complète du bot film\n` +
                    `\`${prefix}filmconfig salon add #salon\` — Définir le salon film\n` +
                    `\`${prefix}filmconfig suggestions set #salon\` — Salon de suggestions membres\n` +
                    `\`${prefix}filmconfig logs suggestion/films/avis #salon\` — Salons de logs\n` +
                    `\`${prefix}filmconfig logsrecherches set #salon\` — Logs des recherches membres\n` +
                    `\`${prefix}filmconfig categories add/remove/list\` — Gérer les catégories\n` +
                    `\`${prefix}filmconfig filmembed color/title/description\` — Config embed résultat\n` +
                    `\`${prefix}filmconfig filmembed variables\` — Variables disponibles pour l'embed\n` +
                    `\`${prefix}filmconfig buttons <rechercher|suggerer|catalogue> <style> <label>\` — Config boutons\n` +
                    `\`${prefix}filmconfig panelconfig title/description/color/...\` — Config panel\n`
                ) : '')
            );

        message.channel.send({ embeds: [embed] });
    }
};
