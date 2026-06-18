const fs   = require('fs');
const path = require('path');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');

const CARTES_PATH = path.join(__dirname, '../../data/cartes.json');

function getCategory(valeur) {
    if (valeur === 50)                          return 'Catégorie 1 (50)';
    if (valeur >= 200   && valeur <= 300)       return 'Catégorie 2 (200-300)';
    if (valeur >= 500   && valeur <= 750)       return 'Catégorie 3 (500-750)';
    if (valeur >= 1000  && valeur <= 3000)      return 'Catégorie 4 (1 000-3 000)';
    if (valeur >= 5000  && valeur <= 10000)     return 'Catégorie 5 (5 000-10 000)';
    if (valeur >= 20000 && valeur <= 70000)     return 'Catégorie 6 (20 000-70 000)';
    return null;
}

module.exports = {
    name: 'cartadd',
    description: 'Ajoute des cartes depuis un fichier texte (owner seulement)',
    category: 'cartes',
    usage: ['cartadd [fichier joint]'],

    run: async (client, message) => {
        const isOwner = client.staff.includes(message.author.id) ||
                        (client.config.buyers || []).includes(message.author.id) ||
                        client.db.get(`owner_${message.author.id}`) === true;

        if (!isOwner) {
            return message.reply('❌ Commande réservée aux owners.');
        }

        const attachment = message.attachments.first();
        if (!attachment) {
            return message.reply('❌ Joins un fichier texte au message.\nFormat de chaque ligne : `Nom - lien_image - valeur_en_coins`');
        }

        let content;
        try {
            const res  = await fetch(attachment.url);
            content = await res.text();
        } catch {
            return message.reply('❌ Impossible de lire le fichier joint.');
        }

        const cartes = JSON.parse(fs.readFileSync(CARTES_PATH, 'utf8'));
        const existingKeys = new Set(cartes.map(c => `${c.nom}|${c.image}|${c.valeur}`));

        const ajoutees  = [];
        const ignorees  = [];
        const horscat   = [];
        const invalides = [];

        const lines = content.split('\n');
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || line.startsWith('Carte') || line.startsWith('━')) continue;

            let m = line.match(/^(.+?)\s+-\s+(https?:\/\/\S+)\s+-\s*(\d+)\s+coins?\s*$/i);
            if (!m) m = line.match(/^(.+?)\s+(https?:\/\/\S+)\s+-\s*(\d+)\s+coins?\s*$/i);

            if (!m) { invalides.push(line.substring(0, 60)); continue; }

            const nom    = m[1].trim();
            const image  = m[2].trim();
            const valeur = parseInt(m[3]);
            const key    = `${nom}|${image}|${valeur}`;

            if (existingKeys.has(key)) { ignorees.push(nom); continue; }

            const cat = getCategory(valeur);
            if (!cat) horscat.push({ nom, image, valeur });

            existingKeys.add(key);
            cartes.push({ nom, image, valeur });
            ajoutees.push({ nom, valeur, cat: cat || `Hors catégorie (${valeur})` });
        }

        fs.writeFileSync(CARTES_PATH, JSON.stringify(cartes, null, 2));

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 🔧 Résultat — cartadd')
        );
        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

        let desc = `✅ **${ajoutees.length}** carte(s) ajoutée(s)\n⏭️ **${ignorees.length}** carte(s) ignorée(s) (déjà existantes)\n`;
        if (invalides.length > 0) desc += `⚠️ **${invalides.length}** ligne(s) invalide(s)\n`;

        if (ajoutees.length > 0) {
            const catGroups = {};
            for (const c of ajoutees) {
                catGroups[c.cat] = catGroups[c.cat] || [];
                catGroups[c.cat].push(c.nom);
            }
            desc += '\n**Cartes ajoutées par catégorie :**\n';
            for (const [cat, noms] of Object.entries(catGroups)) {
                desc += `\`${cat}\` — ${noms.join(', ')}\n`;
            }
        }

        if (ignorees.length > 0 && ignorees.length <= 20) {
            desc += `\n**Cartes ignorées :** ${ignorees.join(', ')}`;
        }

        if (horscat.length > 0) {
            desc += `\n\n⚠️ **${horscat.length}** carte(s) hors catégorie officielle (ajoutées quand même) : ${horscat.map(c => `${c.nom} (${c.valeur})`).join(', ')}`;
        }

        desc += `\n\n**Total cartes en base : ${cartes.length}**`;

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));

        await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
