module.exports = {
    name: 'clientReady',
    run: async (client) => {
        const updatePrices = () => {
            client.guilds.cache.forEach(guild => {
                const min   = client.db.get(`illegal_price_min_${guild.id}`) || 500;
                const max   = client.db.get(`illegal_price_max_${guild.id}`) || 2000;
                const price = Math.floor(Math.random() * (max - min + 1)) + min;
                client.db.set(`illegal_drug_price_${guild.id}`, price);
            });
        };

        // Initialisation immédiate
        updatePrices();

        // Mise à jour toutes les heures
        setInterval(updatePrices, 3600000);

        console.log('[Illegal] Prix des drogues initialisés et mis à jour toutes les heures.');
    }
};
