const Discord = require('discord.js');
const {bot} = require('../../structures/client'); 

module.exports = {
    name: "serverinfo",
    aliases: ["si", "guildinfo"],
    description: "Permet d'obtenir des informations sur le serveur",
    category: "utilitaire" ,
    usage: ["serverinfo"],

    /**
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} commandName 
     */

    run: async (client, message, args, color, prefix, footer, commandName) => {

let pass = false

let staff = client.staff
if(!staff.includes(message.author.id) && !client.config.buyers.includes(message.author.id) && client.db.get(`owner_${message.author.id}`) !== true){
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "1" && message.member.roles.cache.some(r => client.db.get(`perm1.${message.guild.id}`)?.includes(r.id))) pass = true;
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "2" && message.member.roles.cache.some(r => client.db.get(`perm2.${message.guild.id}`)?.includes(r.id))) pass = true;
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "3" && message.member.roles.cache.some(r => client.db.get(`perm3.${message.guild.id}`)?.includes(r.id))) pass = true;
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "4" && message.member.roles.cache.some(r => client.db.get(`perm4.${message.guild.id}`)?.includes(r.id))) pass = true;
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "5" && message.member.roles.cache.some(r => client.db.get(`perm5.${message.guild.id}`)?.includes(r.id))) pass = true; 
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "public") pass = "oui";   
} else pass = true;

if (pass === false) return message.channel.send(`Vous n'avez pas la permission d'utiliser cette commande.`)

const verificationLevels = {
    NONE: '0',
    LOW: 'Faible',
    MEDIUM: 'Moyen',
    HIGH: 'Elevé',
    VERY_HIGH: 'Très élevé',
};
const regions = {
    brazil: 'Brésil :flag_br:',
    europe: 'Europe :flag_eu:',
    hongkong: 'Hong Kong :flag_hk:',
    india: 'India :flag_in:',
    japan: 'Japan :flag_jp:',
    russia: 'Russia :flag_ru:',
    singapore: 'Singapore :flag_sg:',
    southafrica: 'South Africa :flag_za:',
    sydeny: 'Sydeny :flag_au:',
    'us-central': 'US Central :flag_us:',
    'us-east': 'US East :flag_us:',
    'us-west': 'US West :flag_us:',
    'us-south': 'US South :flag_us:'
};
const rolesGuild = message.guild.roles.cache.sort((a, b) => b.position - a.position).map(role => role.toString());
const membersGuild = await message.guild.members.fetch();
const channelsGuild = message.guild.channels.cache;
const emojisGuild = message.guild.emojis.cache;

let rolemap = message.guild.roles.cache
    .sort((a, b) => b.position - a.position)
    .map(r => r)
    .slice(0, 10)
    .join("\n");
if (rolemap.length > 1024) rolemap = "Trop de rôles";
if (!rolemap) rolemap = "Aucun rôle";

let humains = membersGuild.filter(m => !m.user.bot).size;
let bots = membersGuild.filter(m => m.user.bot).size;
let total = membersGuild.size;
let owner = message.guild.members.cache.get(message.guild.ownerId);

const embed = new Discord.EmbedBuilder()
    .setTitle(`${message.guild.name}`)
    .setColor(color)
    .addFields({ name: `**Propriétaire**:`, value: `👑 ${owner}`, inline: true })
    .addFields({ name: `**Channels**:`, value: `✍️ Textuels: ${channelsGuild.filter(channel => channel.isTextBased()).size}\n🎙️ Vocaux: ${channelsGuild.filter(channel => channel.type === Discord.ChannelType.GuildVoice).size}`, inline: true })
    .addFields({ name: `**Niveau de vérification**`, value: `${verificationLevels[message.guild.verificationLevel]}`, inline: true })
    .addFields({ name: `**Boosts**`, value: `${message.guild.premiumSubscriptionCount || '0'} (${message.guild.premiumTier ? `Niveau ${message.guild.premiumTier}` : 'Aucun'})`, inline: true })
    .addFields({ name: `**Crée le**`, value: `<t:${Math.round(parseInt(message.guild.createdTimestamp) / 1000)}:F>\n<t:${Math.round(parseInt(message.guild.createdTimestamp) / 1000)}:R>`, inline: true })
    .addFields({ name: `**Emojis (${emojisGuild.size}):**`, value: `Emojis normaux: ${emojisGuild.filter(emoji => !emoji.animated).size}\nEmojis nitro: ${emojisGuild.filter(emoji => emoji.animated).size}`, inline: true })
    .addFields({ name: `**Roles (${rolesGuild.length}):**`, value: `${rolemap}`, inline: false })
    .addFields({ name: `**Membres (${total}):**`, value: `Humains: ${humains}\nBots: ${bots}\nTotal: ${total}`, inline: true })
    .setThumbnail(message.guild.iconURL())
    .setImage(message.guild.bannerURL({size: 1024}))
    .setTimestamp();

message.channel.send({ embeds: [embed]}); 

    }
}