const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
    name: "guide",
    aliases: [],
    description: "Guide de configuration complet pour les owners (3 pages)",
    category: "utilitaire",
    ownerOnly: true,
    usage: ["guide"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send(`Cette commande est réservée aux owners.`);

        const P = prefix;

        const pages = [
            // Page 1 — Bot Protect
            new Discord.EmbedBuilder()
                .setTitle('📚 Guide NΞXUS — 1/3 : Bot Protect')
                .setColor(color)
                .setDescription([
                    '**🛡️ Anti-Raid**',
                    `\`${P}antiraid on/off\` — Activer/désactiver l'antiraid`,
                    `\`${P}antibots on/off\` — Bloquer les bots`,
                    `\`${P}antijoin on/off\` — Bloquer les arrivées rapides`,
                    `\`${P}antilinks on/off\` — Bloquer les liens`,
                    `\`${P}antiinvites on/off\` — Bloquer les invitations`,
                    '',
                    '**🔨 Modération**',
                    `\`${P}ban/kick/mute/warn/tempmute @membre [raison]\``,
                    `\`${P}hide #salon\` — Rendre invisible | \`${P}unhide #salon\` — Restaurer`,
                    `\`${P}lock #salon\` — Bloquer messages | \`${P}unlock\` — Débloquer`,
                    `\`${P}renew #salon\` — Purger et recréer le salon à l'identique`,
                    '',
                    '**📋 Logs — Indispensable à configurer !**',
                    `\`${P}modlogs #salon\` — Logs sanctions (ban/kick/mute...)`,
                    `\`${P}joinlogs #salon\` — Arrivées membres`,
                    `\`${P}leavelogs #salon\` — Départs membres`,
                    `\`${P}boostlogs #salon\` — Boosts serveur`,
                    `\`${P}rolelogs #salon\` — Changements de rôles`,
                    `\`${P}ranklogs #salon\` — Attributions de ranks`,
                    '',
                    '**🎭 Système de Ranks/Permissions**',
                    `\`${P}rankcreate <nom> roles:@r1 cmds:cmd1,cmd2\` — Créer un rank`,
                    `\`${P}rank @membre <rank>\` — Attribuer | \`${P}unrank @membre <rank>\` — Retirer`,
                    `\`${P}rankmodify <rank> [+roles:@r|-roles:@r] [+cmds:cmd|-cmds:cmd]\``,
                    `\`${P}ranklist\` — Voir tous les ranks`,
                    `\`${P}perm <commande> <1-5|public>\` — Niveaux de permission`,
                    '',
                    '**📋 Logs Global**',
                    `\`${P}logsall on #salon\` — Active un salon qui reçoit TOUS les logs`,
                    `*(arrivées, départs, boosts, messages, rôles, salons, invitations, serveur, vocal)*`,
                    '',
                    '**🔑 Commandes Owners — Aide**',
                    `\`${P}helpall\` — Menu toutes catégories avec descriptions (owners)`,
                    `\`${P}helpperms\` — Commandes triées par niveau de permission (1-5, public)`,
                    `\`${P}help\` — Aide Bot Coin (seulement dans le salon coin configuré)`,
                    `\`${P}helpfilms\` — Aide Bot Film (seulement dans le salon film configuré)`,
                    `\`${P}guide\` — Ce guide (owners uniquement)`,
                ].join('\n')),

            // Page 2 — Bot Coin
            new Discord.EmbedBuilder()
                .setTitle('📚 Guide NΞXUS — 2/3 : Bot Coin')
                .setColor(color)
                .setDescription([
                    '**⚠️ Config minimale avant ouverture au public :**',
                    `\`${P}coinconfig salon add #salon\` — Définir le salon coin (obligatoire)`,
                    `\`${P}setgain daily <montant>\` — Récompense daily`,
                    `\`${P}setgain work <min> [max]\` — Gain de travail`,
                    '',
                    '**💰 Économie**',
                    `\`${P}settime daily/work/mine/rob <durée>\` — Cooldowns (ex: 24h, 4h, 15m)`,
                    `\`${P}coinconfig wagon <utilisations>\` — Utilisations du wagon`,
                    `\`${P}items add/remove <nom> <prix>\` — Gérer le shop`,
                    `\`${P}add/remove <type> @membre <montant>\` — Modifier les avoirs`,
                    `\`${P}reset @membre\` — Panel de reset (partiel ou total)`,
                    '',
                    '**💱 Monnaies (🪙→🟫→⬜→🟡→✨)**',
                    `\`${P}coinconfig monnaie coin/bronze/silver/gold/celestial name <nom>\``,
                    `\`${P}coinconfig monnaie coin/bronze emoji <emoji>\``,
                    `\`${P}coinconfig convert bronze <taux>\` — Ex: 10 coins = 1 bronze`,
                    '',
                    '**⛏️ Mine**',
                    `\`${P}mineraiconfig add <nom> <emoji> <valeur> <chance/10>\``,
                    '',
                    '**⚔️ Alliance/Teams**',
                    `\`${P}tconfig setcreate <prix>\` — Prix de création d'une team`,
                    `\`${P}tconfig addrank/removerank <nom>\` — Gérer les rangs`,
                    `\`${P}tconfig setarmytype <id> <nom> <prix> <puissance>\``,
                    `\`${P}tconfig addlock <nom> <prix> <puissance> <durée_h>\``,
                    `\`${P}setprice lock_bronze/silver/gold/team/wagon <prix>\``,
                    '',
                    '**🏢 Entreprise**',
                    `\`${P}entconfig addemployee <id> <nom> <prix> <gain/h> <salaire/j> <durée_j>\``,
                    `\`${P}entconfig addcoffre <capacité> <prix>\` — Coffres disponibles`,
                    `\`${P}entconfig settax <montant> <intervalle_h>\` — Impôts automatiques`,
                    `\`${P}entconfig setprice <prix>\` — Prix d'achat d'une entreprise`,
                    `Les impôts sont prélevés automatiquement et un DM est envoyé au patron.`,
                    '',
                    '**🎰 Casino / Config**',
                    `\`${P}setmax blackjack/slots/crash/pfc <mise_max>\``,
                    `\`${P}setxp msg <gain>\` | \`${P}setxp vocal <gain>\` | \`${P}setxp level <niv> <xp>\``,
                ].join('\n')),

            // Page 3 — Bot Film
            new Discord.EmbedBuilder()
                .setTitle('📚 Guide NΞXUS — 3/3 : Bot Film')
                .setColor(color)
                .setDescription([
                    '**⚠️ Config minimale avant ouverture au public :**',
                    `\`${P}filmconfig salon add #salon\` — Définir le salon film (pour \`${P}helpfilms\`)`,
                    `\`${P}filmconfig logs films #salon\` — Logs des films ajoutés`,
                    `\`${P}filmconfig logs suggest #salon\` — Salon réception des suggestions`,
                    '',
                    '**📂 Gestion du Catalogue (owners)**',
                    `\`${P}filmconfig add nom | description | image_url | lien | épisode | catégorie\``,
                    `\`${P}filmconfig remove <titre>\` — Supprimer un film`,
                    `\`${P}filmconfig list [catégorie]\` — Lister tous les films`,
                    `\`${P}filmconfig\` — Voir l'état de la config`,
                    `\`${P}filmconfig help\` — Toutes les sous-commandes`,
                    '',
                    '**🎬 Catégories disponibles :**',
                    `\`comedie\` \`histoire\` \`science-fiction\` \`romance\` \`thriller\` \`cinema\``,
                    `\`drame\` \`horreur\` \`guerre\` \`action\` \`anime\` \`super-heros\` \`animation\` \`fantaisie\``,
                    '',
                    '**👥 Accès Membres — via le Panel uniquement**',
                    `\`${P}panel\` — Affiche le panel Films **(owner — salon film uniquement)**`,
                    `Les membres interagissent via les boutons du panel (pas de commandes directes) :`,
                    `• 🔎 Rechercher un film | 💡 Suggérer | 📋 Catalogue par catégorie`,
                    `Les suggestions sont envoyées au salon logs → les owners acceptent/refusent avec des boutons.`,
                    '',
                    '**⚙️ Système d\'aide**',
                    `\`${P}help\` — Aide Bot Coin **(salon coin uniquement)**`,
                    `\`${P}helpfilms\` — Aide Bot Film **(salon film uniquement)**`,
                    `\`${P}helpall\` — Toutes les commandes par catégorie **(owners)**`,
                    `\`${P}helpperms\` — Commandes par permission 1-5 **(owners)**`,
                    `\`${P}guide\` — Ce guide de configuration **(owners)**`,
                ].join('\n')),
        ];

        let page = 0;
        const buildRow = (p) => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('guide_prev').setLabel('◀ Précédent').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p === 0),
            new ButtonBuilder().setCustomId('guide_close').setLabel('✖ Fermer').setStyle(Discord.ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('guide_next').setLabel('Suivant ▶').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p >= pages.length - 1)
        );

        const msg = await message.channel.send(v2({ embeds: [pages[0]], components: [buildRow(0)] }));
        const col = msg.createMessageComponentCollector({ time: 300000 });
        col.on('collect', async i => {
            if (i.user.id !== message.author.id) return i.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });
            if (i.customId === 'guide_close') { col.stop(); return i.update(v2({ embeds: [pages[page]], components: [] })); }
            if (i.customId === 'guide_prev') page = Math.max(0, page - 1);
            if (i.customId === 'guide_next') page = Math.min(pages.length - 1, page + 1);
            await i.update(v2({ embeds: [pages[page]], components: [buildRow(page)] }));
        });
        col.on('end', () => msg.edit({ components: [] }).catch(() => {}));
    }
};
