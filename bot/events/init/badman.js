const { Bot } = require('../../structures/client')
const ms = require("enhanced-ms")

// Intervalle de collecte automatique des gains d'entreprise et des impôts
function startEntrepriseScheduler(client) {
    setInterval(async () => {
        try {
            // Récupère tous les guilds enregistrés
            client.guilds.cache.forEach(guild => {
                const guildId = guild.id;
                const coffreConfig = client.db.get(`ent_coffre_config_${guildId}`) || [
                    { rank: 1, capacity: 5000, price: 0 },
                    { rank: 2, capacity: 20000, price: 2000 },
                    { rank: 3, capacity: 100000, price: 10000 },
                ];
                // Trouve tous les patrons d'entreprise
                const allData = client.db.all ? client.db.all() : [];
                const entKeys = Array.isArray(allData)
                    ? allData.filter(d => d.key && d.key.startsWith(`ent_`) && d.key.endsWith(`_${guildId}`) && !d.key.includes('_employees_') && !d.key.includes('_coffre_config_') && !d.key.includes('_price_') && !d.key.includes('_tax_'))
                    : [];

                for (const entry of entKeys) {
                    try {
                        const parts = entry.key.split('_');
                        if (parts.length < 3) continue;
                        const userId = parts[1];
                        const ent = client.db.get(entry.key);
                        if (!ent || typeof ent !== 'object') continue;

                        const now = Date.now();
                        const lastCollect = ent.lastCollect || ent.createdAt || now;
                        const hoursElapsed = Math.floor((now - lastCollect) / 3600000);
                        if (hoursElapsed < 1) continue;

                        const employees = client.db.get(`ent_employees_${guildId}`) || [
                            { id: 'stagiaire', name: 'Stagiaire', salary: 10, gain: 5, price: 100, duration: 7 },
                        ];

                        const activeEmployees = (ent.hiredEmployees || []).filter(e =>
                            e.hiredAt && (now - e.hiredAt) < (e.duration || 14) * 24 * 3600000
                        );

                        let gainedCoins = 0;
                        let totalDailySalary = 0;
                        for (const emp of activeEmployees) {
                            gainedCoins += (emp.gain || 0) * hoursElapsed;
                            totalDailySalary += (emp.salary || 0) / 24 * hoursElapsed;
                        }

                        // Capacité coffre
                        const coffreRank = ent.coffreRank || 1;
                        const coffreData = coffreConfig.find(c => c.rank === coffreRank) || coffreConfig[0];
                        const maxCapacity = coffreData.capacity;

                        const currentCoffre = ent.coffre || 0;
                        const netGain = Math.max(0, gainedCoins - Math.floor(totalDailySalary));
                        const newCoffre = Math.min(currentCoffre + netGain, maxCapacity);

                        ent.coffre = newCoffre;
                        ent.lastCollect = now;
                        client.db.set(entry.key, ent);
                    } catch {}
                }
            });
        } catch (err) {
            console.log('Entreprise scheduler error:', err.message);
        }
    }, 60 * 60 * 1000); // Toutes les heures

    // Impôts : toutes les 2 jours (vérification toutes les heures)
    setInterval(async () => {
        try {
            client.guilds.cache.forEach(guild => {
                const guildId   = guild.id;
                const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
                const taxAmount = client.db.get(`ent_tax_amount_${guildId}`);
                if (!taxAmount) return;
                const taxInterval = (client.db.get(`ent_tax_interval_${guildId}`) || 48) * 3600000;
                const lastTax = client.db.get(`ent_last_tax_${guildId}`) || 0;
                const now = Date.now();
                if (now - lastTax < taxInterval) return;
                client.db.set(`ent_last_tax_${guildId}`, now);

                const allData = client.db.all ? client.db.all() : [];
                const entKeys = Array.isArray(allData)
                    ? allData.filter(d => d.key && d.key.startsWith(`ent_`) && d.key.endsWith(`_${guildId}`) && !d.key.includes('_employees_') && !d.key.includes('_coffre_config_') && !d.key.includes('_price_') && !d.key.includes('_tax_'))
                    : [];

                for (const entry of entKeys) {
                    try {
                        const parts = entry.key.split('_');
                        if (parts.length < 3) continue;
                        const userId = parts[1];
                        const ent = client.db.get(entry.key);
                        if (!ent || typeof ent !== 'object') continue;

                        const tax = Math.min(taxAmount, ent.coffre || 0);
                        ent.coffre = Math.max(0, (ent.coffre || 0) - tax);
                        client.db.set(entry.key, ent);

                        // DM au patron
                        guild.members.cache.get(userId)?.user.send(
                            `💸 **Impôts** : **${tax} ${coinEmoji}** ont été prélevés du coffre de votre entreprise **${ent.name || 'Votre Entreprise'}**.\nSolde coffre : **${ent.coffre} ${coinEmoji}**`
                        ).catch(() => {});
                    } catch {}
                }
            });
        } catch (err) {
            console.log('Tax scheduler error:', err.message);
        }
    }, 60 * 60 * 1000);
}

module.exports = {
    name: 'clientReady',
    run: async (client) => {

        if (client.db.get(`isActivityOn`) === "remove") {
            client.user.setPresence({ status: 'online' })
        } else if (client.db.get(`isActivityOn`) === "invisible") {
            client.user.setPresence({ status: 'invisible' })
        } else if (client.db.get(`isActivityOn`) === "dnd") {
            client.user.setPresence({ status: 'dnd' })
        } else if (client.db.get(`isActivityOn`) === "idle") {
            client.user.setPresence({ status: 'idle' })
        } else if (client.db.get(`isActivityOn`) === true) {
            client.user.setActivity(client.db.get(`texte.activity`), { type: client.db.get(`type.activity`), url: "https://www.twitch.tv/nxthael_04" })
        } else {
            client.user.setActivity(`.gg/n2xus`, { type: "WATCHING" })
        }

        // Lancer le scheduler d'entreprise
        startEntrepriseScheduler(client);

        console.log(`\n>> Bot lancé`)
        console.log(`    > Nom: ${client.user.tag}`)
        console.log(`    > ID: ${client.user.id}`)
        console.log(`    > Version: ${client.version}`)
        console.log(`    > Il y a ${client.commands.size} commandes`)
    }
}
