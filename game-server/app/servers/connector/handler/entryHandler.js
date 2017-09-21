module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

var handler = Handler.prototype;

//调用用户服务器API来验证用户名或密码是否正确
//
handler.verify = function (username, password, success, fail) {
    //DONE: only for test
    //return success();

    var http = require("follow-redirects").http;

    var data = require("querystring").stringify({username:username, password:password});
    var opt = {
        method: "POST",
        host: "user.crm.weimao.com",
        port: 80,
        path: "/public/login",
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded',
            "Content-Length": Buffer.byteLength(data)
        }
    };

    var req = http.request(opt, function (serverFeedback) {
        if (serverFeedback.statusCode == 200) {
            var body = "";
            serverFeedback.on('data', function (data) { body += data; })
                .on('end', function () {
                    body = JSON.parse(body);
                    if(body.status == 200){
                        return success();
                    }else{
                        return fail(body.message);
                    }
                });
        }
        else {
            return fail(serverFeedback);
        }
    });

    req.on('error', function (e){
        return fail(e);
    });

    req.write(data);
    req.end();
}

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.enter = function(msg, session, next) {
    var self = this;

    var uid = msg.uid;
    var password = msg.password;

    var parts = uid.split("<-->");
    var username = parts[0];
    var type = parts[1];
    var number = parts[2];

    var rid = username;

    //进入房间函数
    var enterToRoom = function () {
        //将客户端加入到room中
        var addClientToRoom = function () {
            session.bind(uid);

            session.set('rid', rid);
            session.set('type', type);
            session.set('number', number);
            session.pushAll({'rid':rid, 'type':type, 'number':number}, function(err) {
                if(err) {
                    console.error('set rid, type, number for session service failed! error is : %j', err.stack);
                }
            });

            session.on('closed', onUserLeave.bind(null, self.app));

            //put user into channel
            self.app.rpc.chat.chatRemote.add(session, uid, self.app.get('serverId'), rid, true, function(users){
                next(null, {
                    code:200,
                    users:users
                });
            });
        }

        var sessionService = self.app.get('sessionService');
        //duplicate log in check
        var preSession = sessionService.getByUid(uid)
        if( !! preSession) {
            console.info("session duplicated with uid:" + uid + ", closed old session!");
            self.app.rpc.chat.chatRemote.kick(preSession[0], uid, self.app.get('serverId'), rid , addClientToRoom);
        }else{
            addClientToRoom();
        }
    }

    //验证成功后进入房间
    this.verify(username,password, function success() {
        enterToRoom();
        return
    }, function fail(err) {
        next(null, {
            code: 500,
            error:err
        });
        return;
    });

};

handler.kick = function(msg, session, next) {

}
/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function(app, session) {
    if(!session || !session.uid) {
        return;
    }
    app.rpc.chat.chatRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
};