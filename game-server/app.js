var pomelo = require('pomelo');
var dispatcher = require('./app/util/dispatcher');
var abuseFilter = require('./app/servers/chat/filter/abuseFilter');

var useSocketIO = false;

// route definition for chat server
var chatRoute = function (session, msg, app, cb) {
    var chatServers = app.getServersByType('chat');

    if (!chatServers || chatServers.length === 0) {
        cb(new Error('can not find chat servers.'));
        return;
    }

    var res = dispatcher.dispatch(session.get('rid'), chatServers);

    cb(null, res.id);
};

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'TelCatCallServer');

// app configuration
app.configure('production|development', 'connector', function () {
    if (useSocketIO) {
        app.set('connectorConfig',
            {
                connector: pomelo.connectors.sioconnector,
                // 'websocket', 'polling-xhr', 'polling-jsonp', 'polling'
                transports: ['websocket', 'polling'],
                heartbeats: true,
                closeTimeout: 60 * 1000,
                heartbeatTimeout: 60 * 1000,
                heartbeatInterval: 25 * 1000
            });
    } else {
        app.set('connectorConfig',
            {
                connector: pomelo.connectors.hybridconnector,
                heartbeat: 3,
                useDict: false,
                useProtobuf: true
            });
    }
});

app.configure('production|development', 'gate', function () {
    if (useSocketIO) {
        app.set('connectorConfig',
            {
                connector: pomelo.connectors.sioconnector,
                // 'websocket', 'polling-xhr', 'polling-jsonp', 'polling'
                transports: ['websocket', 'polling'],
                heartbeats: false
            });
    } else {
        app.set('connectorConfig',
            {
                connector: pomelo.connectors.hybridconnector,
                useDict: true,
                useProtobuf: true
            });
    }
});

// app configure
app.configure('production|development', function () {
    // route configures

    app.enable('systemMonitor');

    app.filter(pomelo.filters.time()); //开启conn日志，对应pomelo-admin模块下conn request
    app.rpcFilter(pomelo.rpcFilters.rpcLog());//开启rpc日志，对应pomelo-admin模块下rpc request

    // var sceneInfo = require('./app/modules/sceneInfo');
    var onlineUser = require('./app/modules/onlineUser');
    if (typeof app.registerAdmin === 'function') {
        // app.registerAdmin(sceneInfo, {app: app});
        app.registerAdmin(onlineUser, {app: app});
    }
    app.route('chat', chatRoute);
    //app.route('time', timeRoute);

    app.filter(pomelo.filters.timeout());
});


// start app
app.start();

process.on('uncaughtException', function (err) {
    console.error(' Caught exception: ' + err.stack);
});
