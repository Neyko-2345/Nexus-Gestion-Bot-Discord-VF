const {bot} = require('./structures/client')

new bot()

let errorsToIgnore = [10008]
let codesToIgnore = ['ABORT_ERR', 'UND_ERR_CONNECT_TIMEOUT']

process.on('unhandledRejection', (reason, p) => {
    if(!reason) return;
    if(errorsToIgnore.includes(reason.code)) return;
    if(codesToIgnore.includes(reason.code)) return;
    console.log(' [antiCrash] :: Unhandled Rejection/Catch');
    console.log(reason, p);
});

process.on('uncaughtException', (err, origin) => {
    if(!err) return;
    if(errorsToIgnore.includes(err.code)) return;
    if(codesToIgnore.includes(err.code)) return;
    console.log(' [antiCrash] :: Uncaught Exception/Catch');
    console.log(err, origin);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
    if(!err) return;
    if(errorsToIgnore.includes(err.code)) return;
    if(codesToIgnore.includes(err.code)) return;
    console.log(' [antiCrash] :: Uncaught Exception/Catch (MONITOR)');
    console.log(err, origin);
});

process.on('multipleResolves', (type, promise, reason) => {
    if(!reason) return;
    if(errorsToIgnore.includes(reason.code)) return;
    if(codesToIgnore.includes(reason.code)) return;
    console.log(' [antiCrash] :: Multiple Resolves');
    console.log(type, promise, reason);
});