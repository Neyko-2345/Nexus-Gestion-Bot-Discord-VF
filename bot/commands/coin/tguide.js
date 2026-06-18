const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
    name: "tguide",
    aliases: ["teamguide", "guideteam"],
    description: "Guide complet du système de teams",
    category: "coin",
    usage: ["tguide"],
    run: async (client, message, args, color, prefix, footer) => {
        const p = client.db.get(`prefix_${message.guild.id}`) || prefix;

        const pages = [
            new Discord.EmbedBuilder()
                .setTitle('📖 Guide des Teams — Introduction (1/6)')
                .setDescription(
                    `Bienvenue dans le guide complet du système de **Teams** (Alliances) !\n\n` +
                    `Les teams sont des groupes de joueurs qui collaborent ensemble pour accumuler des richesses, ` +
                    `gagner de la réputation et s'affronter dans des guerres.\n\n` +
                    `**Sommaire :**\n` +
                    `📄 Page 1 — Introduction\n` +
                    `👥 Page 2 — Créer & gérer une team\n` +
                    `🏅 Page 3 — Grades & rôles\n` +
                    `💰 Page 4 — Banque & économie\n` +
                    `⭐ Page 5 — Réputation & classement\n` +
                    `⚔️ Page 6 — Armée & guerres\n\n` +
                    `*Utilisez les boutons ci-dessous pour naviguer.*`
                )
                .setColor('#FEE75C'),

            new Discord.EmbedBuilder()
                .setTitle('📖 Guide des Teams — Créer & Gérer (2/6)')
                .setDescription(
                    `**Créer une team**\n` +
                    `\`${p}tcreate <nom>\` — Crée une nouvelle team (vous devenez fondateur)\n\n` +
                    `**Invitations**\n` +
                    `\`${p}tinvite @membre\` — Inviter quelqu'un dans votre team\n` +
                    `\`${p}tkick @membre\` — Exclure un membre de la team\n` +
                    `\`${p}tleave\` — Quitter votre team\n\n` +
                    `**Informations**\n` +
                    `\`${p}tinfos\` — Voir les infos de votre team\n` +
                    `\`${p}ttop\` — Classement des teams par réputation\n` +
                    `\`${p}tedit <nom>\` — Modifier le nom de la team\n\n` +
                    `**Supprimer**\n` +
                    `\`${p}tdelete\` — Dissoudre la team (fondateur uniquement, confirmation requise)`
                )
                .setColor('#FEE75C'),

            new Discord.EmbedBuilder()
                .setTitle('📖 Guide des Teams — Grades & Rôles (3/6)')
                .setDescription(
                    `Chaque membre d'une team possède un **grade** :\n\n` +
                    `👑 **Fondateur** — Créateur de la team. Accès à toutes les actions :\n` +
                    `> Inviter, exclure, promouvoir, démettre, dissoudre, gérer la banque, convertir en rép.\n\n` +
                    `⚜️ **Co-fondateur** — Nommé par le fondateur. Accès partiel :\n` +
                    `> Inviter, exclure des membres, gérer la banque d'équipe, convertir des coins en rép.\n\n` +
                    `👥 **Membre** — Membre standard :\n` +
                    `> Peut déposer des coins dans la banque d'équipe (\`${p}tdep\`).\n` +
                    `> Peut acheter des articles d'équipe (\`${p}tbuy\`).\n\n` +
                    `**Gestion des grades**\n` +
                    `\`${p}tpromote @membre\` — Promouvoir en co-fondateur\n` +
                    `\`${p}tdemote @membre\` — Rétrograder en membre`
                )
                .setColor('#FEE75C'),

            new Discord.EmbedBuilder()
                .setTitle('📖 Guide des Teams — Banque & Économie (4/6)')
                .setDescription(
                    `Chaque team possède une **banque commune** dans laquelle les membres peuvent cotiser.\n\n` +
                    `**Déposer dans la banque d'équipe**\n` +
                    `\`${p}tdep <montant>\` — Déposer des coins de votre main vers la banque d'équipe\n` +
                    `> ✅ Accessible à tous les membres\n\n` +
                    `**Retirer de la banque d'équipe**\n` +
                    `\`${p}twith <montant>\` — Retirer des coins de la banque (fondateur / co-fondateur)\n\n` +
                    `**Acheter pour l'équipe**\n` +
                    `\`${p}tbuy <article>\` — Acheter un article avec la banque d'équipe\n` +
                    `\`${p}tshop\` — Voir les articles disponibles pour l'équipe\n\n` +
                    `**Convertir en réputation**\n` +
                    `\`${p}trep\` — Convertir des coins de la banque en points de réputation\n` +
                    `> Taux : \`2 000 coins\` = **1 point de réputation** (fondateur/co-fondateur uniquement)`
                )
                .setColor('#FEE75C'),

            new Discord.EmbedBuilder()
                .setTitle('📖 Guide des Teams — Réputation & Classement (5/6)')
                .setDescription(
                    `La **réputation** est la métrique principale de classement des teams.\n\n` +
                    `**Comment gagner de la réputation ?**\n` +
                    `> \`${p}trep\` — Convertir les coins de la banque en rép (**2 000 coins = 1 rép**)\n` +
                    `> ⚔️ Remporter des guerres contre d'autres teams\n\n` +
                    `**Classement**\n` +
                    `\`${p}ttop\` — Affiche le classement des teams par points de réputation\n` +
                    `> Montre les fondateurs, co-fondateurs et membres de chaque team\n` +
                    `> Triées par réputation décroissante\n\n` +
                    `**Pourquoi la réputation ?**\n` +
                    `> Elle reflète l'investissement à long terme de la team.\n` +
                    `> Elle ne peut pas être perdue sauf en guerre.`
                )
                .setColor('#FEE75C'),

            new Discord.EmbedBuilder()
                .setTitle('📖 Guide des Teams — Armée & Guerres (6/6)')
                .setDescription(
                    `Les teams peuvent se battre grâce à leur **armée** !\n\n` +
                    `**Acheter des troupes**\n` +
                    `\`${p}tbuy <type_armée>\` — Acheter des troupes avec la banque d'équipe\n` +
                    `\`${p}tshop\` — Voir les types de troupes et leurs coûts\n\n` +
                    `**Attaque**\n` +
                    `\`${p}tattack <nom_team>\` — Lancer une attaque contre une autre team\n` +
                    `> L'issue dépend du nombre de troupes de chaque côté.\n` +
                    `> Le vainqueur gagne de la réputation, le perdant en perd.\n\n` +
                    `**Envoyer des troupes**\n` +
                    `\`${p}tarmysend @membre <quantité>\` — Envoyer des renforts à un allié\n\n` +
                    `**Voir son armée**\n` +
                    `\`${p}tarmy\` — Voir votre armée actuelle\n\n` +
                    `💡 *Astuce : accumulez de la réputation via \`${p}trep\` avant d'attaquer !*`
                )
                .setColor('#FEE75C'),
        ];

        let page = 0;
        const buildRow = (p) => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('tguide_prev').setLabel('◀ Précédent').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p === 0),
            new ButtonBuilder().setCustomId('tguide_next').setLabel('Suivant ▶').setStyle(Discord.ButtonStyle.Primary).setDisabled(p >= pages.length - 1)
        );

        const msg = await message.channel.send(v2({ embeds: [pages[0]], components: [buildRow(0)] }));
        const col = msg.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 180000 });
        col.on('collect', async i => {
            if (i.customId === 'tguide_prev') page = Math.max(0, page - 1);
            if (i.customId === 'tguide_next') page = Math.min(pages.length - 1, page + 1);
            await i.update(v2({ embeds: [pages[page]], components: [buildRow(page)] }));
        });
        col.on('end', () => msg.edit({ components: [] }).catch(() => {}));
    }
};
