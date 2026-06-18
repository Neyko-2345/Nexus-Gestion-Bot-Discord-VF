const { Bot } = require('../../structures/client')
const ms = require("enhanced-ms")

module.exports = {
    name: 'clientReady',
    run: async (client) => {

        setInterval(() => {

            if (client.db.get(`isActivityOn`) === "remove") {
                client.user.setPresence({ status: 'online' })
            }

            if (client.db.get(`isActivityOn`) === "invisible") {
                client.user.setPresence({ status: 'invisible' })
            }

            if (client.db.get(`isActivityOn`) === true) {
                client.user.setActivity(client.db.get(`texte.activity`), { type: client.db.get(`type.activity`), url: "https://www.twitch.tv/SupremeB0ts" })
            }

            if (!client.db.get(`isActivityOn`) || client.db.get(`isActivityOn`) === null || client.db.get(`isActivityOn`) === undefined) {
                client.user.setActivity(`.gg/n2xus`, { type: "WATCHING" })
            }

        }, ms("5m"))

    }
}
