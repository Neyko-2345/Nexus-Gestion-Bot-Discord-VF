const fs   = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../data/boosterConfig.json');

const DEFAULTS = {
    classique:  { min: 450,   max: 2050  },
    premium:    { min: 4800,  max: 20200 },
    legendaire: { min: 19500, max: 70500 },
};

function getConfig() {
    try {
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch {
        return DEFAULTS;
    }
}

function getCartes() {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../data/cartes.json'), 'utf8'));
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function tirerBooster(type, attempt = 0) {
    if (attempt > 100) return shuffle(getCartes()).slice(0, 10);

    const config   = getConfig();
    const cartes   = getCartes();
    const { min, max } = config[type] || DEFAULTS[type];
    const MIN_CARD = Math.min(...cartes.map(c => c.valeur));
    const MAX_CARD = Math.max(...cartes.map(c => c.valeur));

    const picked     = [];
    const pickedKeys = new Set();
    let sum    = 0;
    let failed = false;

    for (let i = 0; i < 10; i++) {
        const remaining = 10 - i - 1;
        const needMin   = min - sum - remaining * MAX_CARD;
        const needMax   = max - sum - remaining * MIN_CARD;
        const cardMin   = Math.max(MIN_CARD, needMin);
        const cardMax   = Math.min(MAX_CARD, needMax);

        if (cardMin > cardMax) { failed = true; break; }

        let pool = cartes.filter(c => {
            const key = `${c.nom}|${c.image}|${c.valeur}`;
            return c.valeur >= cardMin && c.valeur <= cardMax && !pickedKeys.has(key);
        });

        if (pool.length === 0) {
            pool = cartes.filter(c => c.valeur >= cardMin && c.valeur <= cardMax);
        }

        if (type === 'legendaire') {
            const normal = pool.filter(c => c.valeur <= 55000);
            const high   = pool.filter(c => c.valeur > 55000);
            if (normal.length > 0) pool = [...normal, ...normal, ...normal, ...high];
        }

        if (pool.length === 0) { failed = true; break; }

        const card = pool[Math.floor(Math.random() * pool.length)];
        const key  = `${card.nom}|${card.image}|${card.valeur}`;
        pickedKeys.add(key);
        picked.push(card);
        sum += card.valeur;
    }

    if (failed) return tirerBooster(type, attempt + 1);

    const sorted = [...picked].sort((a, b) => b.valeur - a.valeur);
    const best5  = shuffle(sorted.slice(0, 5));
    const rest5  = shuffle(sorted.slice(5));
    return [...rest5, ...best5];
}

module.exports = { tirerBooster, getConfig, DEFAULTS };
