const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

const DEFAULT_SHOP = [
    { name: 'Wagon',      emoji: '🚂', price: 200,   description: 'Permet de miner des minerais (3 charges / 15min)', type: 'wagon'      },
    { name: 'Entreprise', emoji: '🏢', price: 10000, description: 'Créez votre propre entreprise et engagez des employés', type: 'entreprise' },
];

module.exports = {
    name: "coinconfig",
    aliases: ["cconfig", "coinset"],
    description: "Configure toutes les valeurs du bot coin (owner seulement)",
    category: "coin",
    ownerOnly: true,
    usage: [
        "coinconfig",
        "coinconfig daily amount <montant>",
        "coinconfig daily cooldown <heures>",
        "coinconfig work <min> <max>",
        "coinconfig work cooldown <minutes>",
        "coinconfig rob success <0-100>",
        "coinconfig rob cooldown <minutes>",
        "coinconfig rob fine <min> <max>",
        "coinconfig wagon <nb_utilisations>",
        "coinconfig salon add/remove/list [#salon]",
        "coinconfig monnaie <coin|bronze|silver|gold|celestial> name <nom>",
        "coinconfig monnaie <coin|bronze|silver|gold|celestial> emoji <emoji>",
        "coinconfig convert <bronze|silver|gold|celestial> <taux>",
        "coinconfig xp level <niveau> <xp_requis>",
        "coinconfig shop add/remove/modify/list ...",
        "coinconfig illegal cult-level <niveau>",
        "coinconfig illegal blanch-level <niveau>",
        "coinconfig illegal recoltmin <nb>",
        "coinconfig illegal recoltmax <nb>",
        "coinconfig illegal cooldown <minutes>",
        "coinconfig illegal price <coins>",
        "coinconfig illegal pricemin <coins>",
        "coinconfig illegal pricemax <coins>",
    ],

    run: async (client, message, args, color, prefix, footer, commandName) => {
        const isOwner = client.staff.includes(message.author.id)
            || client.config.buyers.includes(message.author.id)
            || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send(`Cette commande est réservée aux owners.`);

        const guildId = message.guild.id;
        const sub = args[0]?.toLowerCase();

        // ── Aucun argument → Vue globale ──
        if (!sub) {
            const coinEmoji      = client.db.get(`coin_emoji_${guildId}`)      || '<:coin:1510618513876717709>';
            const dailyAmt       = client.db.get(`coin_daily_amount_${guildId}`) || client.db.get(`gain_daily_${guildId}`) || 100;
            const dailyCd        = Math.floor((client.db.get(`cooldown_daily_${guildId}`) || 86400000) / 3600000);
            const workMin        = client.db.get(`coin_work_min_${guildId}`)   || client.db.get(`gain_work_${guildId}`) || 30;
            const workMax        = client.db.get(`coin_work_max_${guildId}`)   || client.db.get(`gain_work_max_${guildId}`) || 80;
            const workCd         = Math.floor((client.db.get(`cooldown_work_${guildId}`) || 14400000) / 60000);
            const robSuccess     = client.db.get(`rob_success_rate_${guildId}`) ?? 45;
            const robCd          = Math.floor((client.db.get(`cooldown_rob_${guildId}`) || 1800000) / 60000);
            const robFineMin     = client.db.get(`rob_fine_min_${guildId}`) || 20;
            const robFineMax     = client.db.get(`rob_fine_max_${guildId}`) || 70;
            const channels       = (client.db.get(`coin_channels_${guildId}`) || []).map(id => `<#${id}>`).join(', ') || '`Non configuré`';
            const shopItems      = (client.db.get(`shop_items_${guildId}`) || DEFAULT_SHOP).length;
            const illegalCultLvl = client.db.get(`illegal_cult_min_level_${guildId}`) ?? 2;
            const illegalBlanchLvl = client.db.get(`illegal_blanch_min_level_${guildId}`) ?? 3;
            const illegalRecMin  = client.db.get(`illegal_recolt_min_${guildId}`) || 1;
            const illegalRecMax  = client.db.get(`illegal_recolt_max_${guildId}`) || 3;
            const illegalCd      = Math.floor((client.db.get(`illegal_recolt_cooldown_${guildId}`) || 3600000) / 60000);
            const illegalPrice   = client.db.get(`illegal_drug_price_${guildId}`) || 500;
            const illegalPrMin   = client.db.get(`illegal_price_min_${guildId}`) || 300;
            const illegalPrMax   = client.db.get(`illegal_price_max_${guildId}`) || 2000;

            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('⚙️ Coinconfig — Configuration Globale')
                .setColor(color)
                .addFields({ name: '💰 Daily', value: `Montant : **${dailyAmt} ${coinEmoji}** | Cooldown : **${dailyCd}h**`, inline: true })
                .addFields({ name: '💼 Work', value: `**${workMin}–${workMax} ${coinEmoji}** | Cooldown : **${workCd}min**`, inline: true })
                .addFields({ name: '🦹 Rob', value: `Succès : **${robSuccess}%** | Cooldown : **${robCd}min** | Amende : **${robFineMin}–${robFineMax} ${coinEmoji}**`, inline: false })
                .addFields({ name: '🌿 Illégal', value: `🌱 Cultivateur : niv. **${illegalCultLvl}** requis\n` +
                    `🧹 Blanchisseur : niv. **${illegalBlanchLvl}** requis\n` +
                    `💊 Récolte : **${illegalRecMin}–${illegalRecMax}** drogues | Cooldown : **${illegalCd}min**\n` +
                    `💰 Prix actuel : **${illegalPrice} ${coinEmoji}** | Fluctuation : **${illegalPrMin}–${illegalPrMax} ${coinEmoji}**`, inline: false })
                .addFields({ name: '🛒 Shop', value: `**${shopItems}** articles configurés`, inline: true })
                .addFields({ name: '📢 Salons Coin', value: channels, inline: true })
                .setDescription(`*\`${prefix}coinconfig help\` — liste complète des commandes*`)
            ]}));
        }

        if (sub === 'help') {
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('⚙️ Coinconfig — Toutes les commandes')
                .setColor(color)
                .setDescription(module.exports.usage.map(u => `\`${prefix}${u}\``).join('\n'))
            ]}));
        }

        // ── daily ──
        if (sub === 'daily') {
            const action = args[1]?.toLowerCase();
            if (action === 'amount' || (!isNaN(parseInt(args[1])) && !action.match(/[a-z]/))) {
                const amount = parseInt(action === 'amount' ? args[2] : args[1]);
                if (isNaN(amount) || amount <= 0) return message.reply(`Usage : \`${prefix}coinconfig daily amount <montant>\``);
                client.db.set(`coin_daily_amount_${guildId}`, amount);
                client.db.set(`gain_daily_${guildId}`, amount);
                return message.reply(`✅ Récompense daily : **${amount} coins**.`);
            }
            if (action === 'cooldown') {
                const hours = parseFloat(args[2]);
                if (isNaN(hours) || hours <= 0) return message.reply(`Usage : \`${prefix}coinconfig daily cooldown <heures>\` (ex: 24)`);
                client.db.set(`cooldown_daily_${guildId}`, Math.round(hours * 3600000));
                return message.reply(`✅ Cooldown daily : **${hours}h**.`);
            }
            // Rétrocompatibilité : coinconfig daily <montant>
            const amount = parseInt(args[1]);
            if (!isNaN(amount) && amount > 0) {
                client.db.set(`coin_daily_amount_${guildId}`, amount);
                client.db.set(`gain_daily_${guildId}`, amount);
                return message.reply(`✅ Récompense daily : **${amount} coins**.`);
            }
            return message.reply(`Usage : \`${prefix}coinconfig daily amount <montant>\` | \`${prefix}coinconfig daily cooldown <heures>\``);
        }

        // ── work ──
        if (sub === 'work') {
            const action = args[1]?.toLowerCase();
            if (action === 'cooldown') {
                const mins = parseFloat(args[2]);
                if (isNaN(mins) || mins <= 0) return message.reply(`Usage : \`${prefix}coinconfig work cooldown <minutes>\``);
                client.db.set(`cooldown_work_${guildId}`, Math.round(mins * 60000));
                return message.reply(`✅ Cooldown work : **${mins}min**.`);
            }
            const min = parseInt(args[1]), max = parseInt(args[2]);
            if (isNaN(min) || isNaN(max) || min <= 0 || max < min) return message.reply(`Usage : \`${prefix}coinconfig work <min> <max>\` | \`${prefix}coinconfig work cooldown <minutes>\``);
            client.db.set(`coin_work_min_${guildId}`, min);
            client.db.set(`gain_work_${guildId}`, min);
            client.db.set(`coin_work_max_${guildId}`, max);
            client.db.set(`gain_work_max_${guildId}`, max);
            return message.reply(`✅ Work configuré : **${min}–${max} coins**.`);
        }

        // ── rob ──
        if (sub === 'rob') {
            const action = args[1]?.toLowerCase();
            if (action === 'success') {
                const pct = parseInt(args[2]);
                if (isNaN(pct) || pct < 0 || pct > 100) return message.reply(`Usage : \`${prefix}coinconfig rob success <0-100>\` (pourcentage)`);
                client.db.set(`rob_success_rate_${guildId}`, pct);
                return message.reply(`✅ Taux de succès du rob : **${pct}%**.`);
            }
            if (action === 'cooldown') {
                const mins = parseFloat(args[2]);
                if (isNaN(mins) || mins <= 0) return message.reply(`Usage : \`${prefix}coinconfig rob cooldown <minutes>\``);
                client.db.set(`cooldown_rob_${guildId}`, Math.round(mins * 60000));
                return message.reply(`✅ Cooldown rob : **${mins}min**.`);
            }
            if (action === 'fine') {
                const fMin = parseInt(args[2]), fMax = parseInt(args[3]);
                if (isNaN(fMin) || isNaN(fMax) || fMin <= 0 || fMax < fMin) return message.reply(`Usage : \`${prefix}coinconfig rob fine <min> <max>\``);
                client.db.set(`rob_fine_min_${guildId}`, fMin);
                client.db.set(`rob_fine_max_${guildId}`, fMax);
                return message.reply(`✅ Amende en cas d'échec : **${fMin}–${fMax} coins**.`);
            }
            const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
            const robSuccess = client.db.get(`rob_success_rate_${guildId}`) ?? 45;
            const robCd = Math.floor((client.db.get(`cooldown_rob_${guildId}`) || 1800000) / 60000);
            const fMin = client.db.get(`rob_fine_min_${guildId}`) || 20;
            const fMax = client.db.get(`rob_fine_max_${guildId}`) || 70;
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('🦹 Config Rob')
                .setColor(color)
                .setDescription(
                    `Succès : **${robSuccess}%**\nCooldown : **${robCd}min**\nAmende échec : **${fMin}–${fMax} ${coinEmoji}**\n\n` +
                    `\`${prefix}coinconfig rob success <0-100>\`\n\`${prefix}coinconfig rob cooldown <minutes>\`\n\`${prefix}coinconfig rob fine <min> <max>\``
                )
            ]}));
        }

        // ── wagon ──
        if (sub === 'wagon') {
            const uses = parseInt(args[1]);
            if (isNaN(uses) || uses <= 0) return message.reply(`Usage : \`${prefix}coinconfig wagon <nb_utilisations>\``);
            client.db.set(`wagon_max_uses_${guildId}`, uses);
            return message.reply(`✅ Wagon : **${uses} utilisations** par wagon.`);
        }

        // ── salon ──
        if (sub === 'salon') {
            const action  = args[1]?.toLowerCase();
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]);
            const channels = client.db.get(`coin_channels_${guildId}`) || [];

            if (action === 'add') {
                if (!channel) return message.reply(`Mentionnez un salon.`);
                if (!channels.includes(channel.id)) { channels.push(channel.id); client.db.set(`coin_channels_${guildId}`, channels); }
                return message.reply(`✅ ${channel} ajouté comme salon coin.`);
            }
            if (action === 'remove') {
                if (!channel) return message.reply(`Mentionnez un salon.`);
                client.db.set(`coin_channels_${guildId}`, channels.filter(id => id !== channel.id));
                return message.reply(`✅ ${channel} retiré des salons coin.`);
            }
            if (action === 'list') {
                const list = channels.map(id => `<#${id}>`).join(', ') || 'Aucun';
                return message.reply(`Salons coin configurés : ${list}`);
            }
            return message.reply(`Usage : \`${prefix}coinconfig salon add|remove|list [#salon]\``);
        }

        // ── monnaie (emoji + nom → mis à jour partout automatiquement) ──
        if (sub === 'monnaie') {
            const type = args[1]?.toLowerCase();
            const prop = args[2]?.toLowerCase();
            const val  = args.slice(3).join(' ');
            if (!['coin','bronze','silver','gold','celestial'].includes(type) || !['name','emoji'].includes(prop) || !val) {
                return message.reply(
                    `Usage : \`${prefix}coinconfig monnaie <coin|bronze|silver|gold|celestial> <name|emoji> <valeur>\`\n` +
                    `*La modification est prise en compte immédiatement dans \`&balance\`, \`&profile\`, \`&convert\`, etc.*`
                );
            }
            const keyMap = {
                coin:      { name: `coin_name_${guildId}`,      emoji: `coin_emoji_${guildId}`      },
                bronze:    { name: `bronze_name_${guildId}`,    emoji: `bronze_emoji_${guildId}`    },
                silver:    { name: `silver_name_${guildId}`,    emoji: `silver_emoji_${guildId}`    },
                gold:      { name: `gold_name_${guildId}`,      emoji: `gold_emoji_${guildId}`      },
                celestial: { name: `celestial_name_${guildId}`, emoji: `celestial_emoji_${guildId}` },
            };
            client.db.set(keyMap[type][prop], val);
            return message.reply(`✅ **${type}** → \`${prop}\` mis à jour : **${val}**\n*Effectif immédiatement dans toutes les commandes (balance, profile, shop, convert, drop…)*`);
        }

        // ── convert ──
        if (sub === 'convert') {
            const type = args[1]?.toLowerCase();
            const rate = parseInt(args[2]);
            if (!type || isNaN(rate) || rate <= 0) return message.reply(`Usage : \`${prefix}coinconfig convert <bronze|silver|gold|celestial> <taux>\``);
            const keyMap = { bronze: 'convert_bronze_to_coin', silver: 'convert_silver_to_bronze', gold: 'convert_gold_to_silver', celestial: 'convert_celestial_to_gold' };
            if (!keyMap[type]) return message.reply(`Type invalide : bronze, silver, gold, celestial`);
            client.db.set(`${keyMap[type]}_${guildId}`, rate);
            return message.reply(`✅ Taux de conversion **${type}** : **${rate}**.`);
        }

        // ── xp ──
        if (sub === 'xp') {
            if (args[1] === 'level') {
                const lvl = parseInt(args[2]), xpReq = parseInt(args[3]);
                if (isNaN(lvl) || isNaN(xpReq)) return message.reply(`Usage : \`${prefix}coinconfig xp level <niveau> <xp_requis>\``);
                const levels = client.db.get(`xp_levels_${guildId}`) || {};
                levels[lvl] = xpReq;
                client.db.set(`xp_levels_${guildId}`, levels);
                return message.reply(`✅ Niveau **${lvl}** : **${xpReq} XP** requis.`);
            }
            if (args[1] === 'gain') {
                const gain = parseInt(args[2]);
                if (isNaN(gain) || gain < 0) return message.reply(`Usage : \`${prefix}coinconfig xp gain <max_par_message>\``);
                client.db.set(`xp_msg_gain_${guildId}`, gain);
                return message.reply(`✅ XP par message : **0–${gain}** (aléatoire).${gain === 0 ? ' XP par message désactivé.' : ''}`);
            }
            // Afficher config XP
            const levels = client.db.get(`xp_levels_${guildId}`) || { 1: 0, 2: 100, 3: 250, 4: 500, 5: 1000 };
            const gainMsg = client.db.get(`xp_msg_gain_${guildId}`) || 0;
            const lvlCh = client.db.get(`xp_levelup_channel_${guildId}`);
            const lvlLines = Object.entries(levels).sort((a,b)=>parseInt(a)-parseInt(b)).map(([l,x]) => `Niv. **${l}** → ${x} XP`).join('\n');
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('🌟 Config XP')
                .setColor(color)
                .setDescription(
                    `Gain par message : **0–${gainMsg}** XP\nSalon level up : ${lvlCh ? `<#${lvlCh}>` : 'actuel'}\n\n${lvlLines}\n\n` +
                    `\`${prefix}coinconfig xp level <niveau> <xp_requis>\`\n\`${prefix}coinconfig xp gain <max_par_message>\``
                )
            ]}));
        }

        // ── shop ──
        if (sub === 'shop') {
            const action    = args[1]?.toLowerCase();
            const shopItems = client.db.get(`shop_items_${guildId}`) || DEFAULT_SHOP;
            const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';

            if (action === 'add') {
                const name = args[2], price = parseInt(args[3]), emoji = args[4], description = args.slice(5).join(' ');
                if (!name || isNaN(price) || !emoji || !description) return message.reply(`Usage : \`${prefix}coinconfig shop add <nom> <prix> <emoji> <description>\``);
                if (shopItems.find(i => i.name.toLowerCase() === name.toLowerCase())) return message.reply(`Article \`${name}\` existe déjà.`);
                shopItems.push({ name, price, emoji, description, type: 'item' });
                client.db.set(`shop_items_${guildId}`, shopItems);
                return message.reply(`✅ **${emoji} ${name}** ajouté au shop — **${price} ${coinEmoji}**.`);
            }
            if (action === 'remove') {
                const name = args.slice(2).join(' ');
                const idx  = shopItems.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
                if (idx === -1) return message.reply(`Article \`${name}\` introuvable.`);
                const removed = shopItems.splice(idx, 1)[0];
                client.db.set(`shop_items_${guildId}`, shopItems);
                return message.reply(`✅ **${removed.name}** supprimé du shop.`);
            }
            if (action === 'modify') {
                const itemName = args[2], field = args[3]?.toLowerCase(), newVal = args.slice(4).join(' ');
                if (!itemName || !field || !newVal) return message.reply(`Usage : \`${prefix}coinconfig shop modify <nom> <name|price|emoji|description> <valeur>\``);
                if (!['name','price','emoji','description'].includes(field)) return message.reply(`Champ invalide : name, price, emoji, description`);
                const idx = shopItems.findIndex(i => i.name.toLowerCase() === itemName.toLowerCase());
                if (idx === -1) return message.reply(`Article \`${itemName}\` introuvable.`);
                if (field === 'price') {
                    const p = parseInt(newVal);
                    if (isNaN(p) || p <= 0) return message.reply(`Prix invalide.`);
                    shopItems[idx].price = p;
                } else { shopItems[idx][field] = newVal; }
                client.db.set(`shop_items_${guildId}`, shopItems);
                return message.reply(`✅ **${shopItems[idx].name}** mis à jour — champ \`${field}\` : **${newVal}**`);
            }
            if (action === 'list') {
                return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('🛒 Articles du shop').setColor(color)
                    .setDescription(shopItems.length > 0
                        ? shopItems.map(i => `${i.emoji} **${i.name}** — ${i.price} ${coinEmoji}\n*${i.description}*`).join('\n\n')
                        : 'Aucun article.')
                ]}));
            }
            return message.reply(`Usage : \`${prefix}coinconfig shop add|remove|modify|list ...\``);
        }

        // ── illegal ──
        if (sub === 'illegal') {
            const action = args[1]?.toLowerCase();
            const val    = args[2];

            if (action === 'cult-level' || action === 'cultivateur') {
                const lvl = parseInt(val);
                if (isNaN(lvl) || lvl < 1) return message.reply(`Usage : \`${prefix}coinconfig illegal cult-level <niveau>\` (ex: 1)`);
                client.db.set(`illegal_cult_min_level_${guildId}`, lvl);
                return message.reply(`✅ Niveau XP minimum pour **Cultivateur** : **niv. ${lvl}**.`);
            }
            if (action === 'blanch-level' || action === 'blanchisseur') {
                const lvl = parseInt(val);
                if (isNaN(lvl) || lvl < 1) return message.reply(`Usage : \`${prefix}coinconfig illegal blanch-level <niveau>\` (ex: 2)`);
                client.db.set(`illegal_blanch_min_level_${guildId}`, lvl);
                return message.reply(`✅ Niveau XP minimum pour **Blanchisseur** : **niv. ${lvl}**.`);
            }
            if (action === 'recoltmin') {
                const nb = parseInt(val);
                if (isNaN(nb) || nb < 1) return message.reply(`Usage : \`${prefix}coinconfig illegal recoltmin <nb>\``);
                client.db.set(`illegal_recolt_min_${guildId}`, nb);
                return message.reply(`✅ Minimum de drogues par récolte : **${nb}**.`);
            }
            if (action === 'recoltmax') {
                const nb = parseInt(val);
                if (isNaN(nb) || nb < 1) return message.reply(`Usage : \`${prefix}coinconfig illegal recoltmax <nb>\``);
                client.db.set(`illegal_recolt_max_${guildId}`, nb);
                return message.reply(`✅ Maximum de drogues par récolte : **${nb}**.`);
            }
            if (action === 'cooldown') {
                const mins = parseFloat(val);
                if (isNaN(mins) || mins < 1) return message.reply(`Usage : \`${prefix}coinconfig illegal cooldown <minutes>\``);
                client.db.set(`illegal_recolt_cooldown_${guildId}`, Math.round(mins * 60000));
                return message.reply(`✅ Cooldown de récolte : **${mins} minutes**.`);
            }
            if (action === 'price') {
                const p = parseInt(val);
                if (isNaN(p) || p < 1) return message.reply(`Usage : \`${prefix}coinconfig illegal price <coins>\``);
                client.db.set(`illegal_drug_price_${guildId}`, p);
                return message.reply(`✅ Prix actuel de la drogue : **${p} coins** (jusqu'à la prochaine mise à jour automatique).`);
            }
            if (action === 'pricemin') {
                const p = parseInt(val);
                if (isNaN(p) || p < 1) return message.reply(`Usage : \`${prefix}coinconfig illegal pricemin <coins>\``);
                client.db.set(`illegal_price_min_${guildId}`, p);
                return message.reply(`✅ Prix minimum de la drogue : **${p} coins**.`);
            }
            if (action === 'pricemax') {
                const p = parseInt(val);
                if (isNaN(p) || p < 1) return message.reply(`Usage : \`${prefix}coinconfig illegal pricemax <coins>\``);
                client.db.set(`illegal_price_max_${guildId}`, p);
                return message.reply(`✅ Prix maximum de la drogue : **${p} coins**.`);
            }

            // Afficher la config illégale actuelle
            const coinEmoji    = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
            const cultLvl      = client.db.get(`illegal_cult_min_level_${guildId}`) ?? 1;
            const blanchLvl    = client.db.get(`illegal_blanch_min_level_${guildId}`) ?? 2;
            const recMin       = client.db.get(`illegal_recolt_min_${guildId}`) || 1;
            const recMax       = client.db.get(`illegal_recolt_max_${guildId}`) || 3;
            const cdMs         = client.db.get(`illegal_recolt_cooldown_${guildId}`) || 3600000;
            const curPrice     = client.db.get(`illegal_drug_price_${guildId}`) || 500;
            const prMin        = client.db.get(`illegal_price_min_${guildId}`) || 300;
            const prMax        = client.db.get(`illegal_price_max_${guildId}`) || 2000;

            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('🌿 Config Illégal')
                .setColor(color)
                .setDescription(
                    `🌱 **Cultivateur** — Niveau XP requis : **${cultLvl}**\n` +
                    `🧹 **Blanchisseur** — Niveau XP requis : **${blanchLvl}**\n` +
                    `💊 **Récolte** : **${recMin} – ${recMax}** drogues par récolte\n` +
                    `⏱️ **Cooldown récolte** : **${Math.floor(cdMs / 60000)} min**\n` +
                    `💰 **Prix actuel** : **${curPrice} ${coinEmoji}** (auto-fluctuant)\n` +
                    `📉 **Fluctuation** : **${prMin} – ${prMax} ${coinEmoji}**\n\n` +
                    `\`${prefix}coinconfig illegal cult-level <niveau>\`\n` +
                    `\`${prefix}coinconfig illegal blanch-level <niveau>\`\n` +
                    `\`${prefix}coinconfig illegal recoltmin <nb>\`\n` +
                    `\`${prefix}coinconfig illegal recoltmax <nb>\`\n` +
                    `\`${prefix}coinconfig illegal cooldown <minutes>\`\n` +
                    `\`${prefix}coinconfig illegal price <coins>\`\n` +
                    `\`${prefix}coinconfig illegal pricemin <coins>\`\n` +
                    `\`${prefix}coinconfig illegal pricemax <coins>\``
                )
            ]}));
        }

        message.reply(`Sous-commande inconnue. Utilisez \`${prefix}coinconfig help\` pour voir les options.`);
    }
};
