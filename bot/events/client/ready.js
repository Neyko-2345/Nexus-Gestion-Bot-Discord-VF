const { Bot } = require('../../structures/client')

module.exports = {
    name: 'clientReady',

    /**
     * @param {Bot} client 
     */
    run: async (client) => {
        print(`\n✅ BOT EN LIGNE
    > Nom     : ${client.user.username}
    > ID      : ${client.user.id}
    > Version : ${client.version}
    > Cmds    : ${client.commands.size}`)
    }
}
