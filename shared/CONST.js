var CONST = {
    CALL_STATE:{
        IDLE: 'IDLE',
        OFFHOOK: 'OFFHOOK',
        RING: 'RING'
    },
    CLIENT_TYPE:{
        BROWSER: 'browser',
        MOBILE: 'mobile'
    }
}

var ERROR = {
    OK: 200,
    FAIL: 500,

    ENTRY: {
        CONNECT_CONNECTOR_SERVER_ERROR: 1000,
        ENTRY_FAIL: 1001,
        USER_NOT_EXIST_OR_WRONG_PASSWORD: 1003
    },

    GATE: {
        CONNECT_GATE_SERVER_ERROR: 2000,
        NO_SERVER_AVAILABLE: 2001
    },

    CHAT: {
        REQUEST_ERROR:3000,
        CHANNEL_CREATE: 3001,
        CHANNEL_NOT_EXIST: 3002,
        UNKNOWN_CONNECTOR: 3003,
        NOT_ONLINE: 3004
    }
}

module.exports = {
    ERROR: ERROR,
    CONST: CONST
};