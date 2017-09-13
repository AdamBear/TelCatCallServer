module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

var handler = Handler.prototype;

//调用用户服务器API来验证用户名或密码是否正确
handler.verify = function (username, password) {
    return true;
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

    if(!this.verify(username,password)){
        next(null, {
            code: 500
        });
        return;
    }

    var rid = username;

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