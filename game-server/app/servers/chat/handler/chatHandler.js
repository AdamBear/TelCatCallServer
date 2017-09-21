var chatRemote = require('../remote/chatRemote');
var CONST = require('../../../../../shared/CONST')

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;


handler.makeCall = function(msg, session, next) {
    var parts = session.uid.split("<-->");
    var username = parts[0];

	var rid = username;

	var channelService = this.app.get('channelService');
	var param = {
		from: msg.from,
		to: msg.to
	};
	channel = channelService.getChannel(rid, false);

	var uids = [];
    var users = channel.getMembers();
    users.forEach(function (user) {
        var parts = user.split("<-->");
        var u_type = parts[1];
        var u_number = parts[2];

        //if(u_type === CONST.CONST.CLIENT_TYPE.BROWSER && u_number === param.from){
			uids.push({
				uid: user,
				sid: channel.getMember(user)['sid']
			});
		//}
	});

    channelService.pushMessageByUids('onCall', param, uids);

	next(null, {
		code:200,
		route: msg.route
	});
};

handler.kick = function(msg, session, next) {
    var uid = msg.uid;
    var parts = uid.split("<-->");
    var username = parts[0];
    ChatRemote.kick(uid, this.app.get('serverId'), username, function () {
        next(null, {
            route: msg.route
        });
    })
}

handler.changeCallState = function(msg, session, next) {
    var parts = session.uid.split("<-->");
    var username = parts[0];
    var rid = username;

    var channelService = this.app.get('channelService');
    var param = {
        user: session.uid,
        from: msg.from,
        state: msg.state,
        number: msg.number
    };
    channel = channelService.getChannel(rid, false);

    var uids = [];
    var users = channel.getMembers();
    users.forEach(function (user) {
        //暂时不考虑限制通知端一定是浏览器
        //var parts = user.split("<-->");
        //var u_type = parts[1];

        //if(u_type === CONST.CONST.CLIENT_TYPE.BROWSER){
			uids.push({
                uid: user,
                sid: channel.getMember(user)['sid']
            });
        //}
    });

    channelService.pushMessageByUids('onCallStateChange', param, uids);

    next(null, {
    	code:200,
        route: msg.route
    });
}

handler.getUsers = function(msg, session, next) {
    var parts = session.uid.split("<-->");
    var username = parts[0];
    var rid = username;

    var channelService = this.app.get('channelService');
    channel = channelService.getChannel(rid, false);

    var users = channel.getMembers();
    next(null, {
    	users:users,
        code:200,
        route: msg.route
    });
}

handler.sendRecordUrl = function(msg, session, next) {
    var parts = session.uid.split("<-->");
    var username = parts[0];
    var rid = username;

    var channelService = this.app.get('channelService');
    var param = {
        user: session.uid,
        from: msg.from,
        to: msg.to,
        url: msg.url
    };
    channel = channelService.getChannel(rid, false);

    var uids = [];
    var users = channel.getMembers();
    users.forEach(function (user) {
        //暂时不考虑限制通知端一定是浏览器
        //var parts = user.split("<-->");
        //var u_type = parts[1];

        //if(u_type === CONST.CONST.CLIENT_TYPE.BROWSER){
        uids.push({
            uid: user,
            sid: channel.getMember(user)['sid']
        });
        //}
    });

    channelService.pushMessageByUids('onRecorded', param, uids);

    next(null, {
        code:200,
        route: msg.route
    });
}