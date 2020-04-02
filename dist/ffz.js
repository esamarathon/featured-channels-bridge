"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var twitch_js_1 = __importDefault(require("twitch-js"));
var ws_1 = __importDefault(require("ws"));
var twitch_api_1 = require("./twitch-api");
var messageNo = 1;
var wsConn;
var pingTimeout;
function sendMessage(message) {
    return __awaiter(this, void 0, void 0, function () {
        var thisMessageNo;
        return __generator(this, function (_a) {
            // console.log(`[DEBUG-SEND]: ${messageNo} ${message}`);
            wsConn.send(messageNo + " " + message);
            thisMessageNo = messageNo;
            messageNo += 1;
            return [2 /*return*/, new Promise(function (resolve) {
                    var msgEvt = function (data) {
                        if (data.includes(thisMessageNo + " ok")) {
                            wsConn.removeListener('message', msgEvt);
                            resolve(data.substr(data.indexOf(' ') + 1));
                        }
                    };
                    wsConn.on('message', msgEvt);
                })];
        });
    });
}
// Used to send the authorisation code for updating the following buttons/emotes when needed.
function sendAuthThroughTwitchChat(auth) {
    console.log('Attempting to authenticate with FrankerFaceZ.');
    twitch_api_1.checkTokenValidity().then(function () {
        var client = new twitch_js_1.default.Client({
            options: {
            // debug: true,
            },
            connection: {
                secure: true,
            },
            identity: {
                username: twitch_api_1.twitchDB.name,
                password: twitch_api_1.twitchDB.access_token,
            },
        });
        client.connect();
        client.once('connected', function () {
            console.log('Connected to Twitch chat to authenticate with FrankerFaceZ.');
            client.say('frankerfacezauthorizer', "AUTH " + auth).then(function () { return client.disconnect(); });
        });
    });
}
// Initial messages to send on connection.
function sendInitMessages() {
    return __awaiter(this, void 0, void 0, function () {
        var messagesToSend, _i, messagesToSend_1, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    messagesToSend = [
                        'hello ["esamarathon/featured-channels-bridge",false]',
                        "setuser \"" + twitch_api_1.twitchDB.name + "\"",
                        "sub \"room." + twitch_api_1.twitchDB.name + "\"",
                        "sub \"channel." + twitch_api_1.twitchDB.name + "\"",
                        'ready 0',
                    ];
                    _i = 0, messagesToSend_1 = messagesToSend;
                    _a.label = 1;
                case 1:
                    if (!(_i < messagesToSend_1.length)) return [3 /*break*/, 4];
                    msg = messagesToSend_1[_i];
                    return [4 /*yield*/, sendMessage(msg)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Picks a server randomly, 1-2-2-2 split in which it picks.
function pickServer() {
    var randomInt = Math.floor(Math.random() * 7);
    switch (randomInt) {
        default:
        case 0:
            return 'wss://catbag.frankerfacez.com/';
        case 1:
        case 2:
            return 'wss://andknuckles.frankerfacez.com/';
        case 3:
        case 4:
            return 'wss://tuturu.frankerfacez.com/';
        case 5:
        case 6:
            return 'wss://lilz.frankerfacez.com/';
    }
}
function ping() {
    var pongWaitTimeout;
    wsConn.ping();
    var pongEvt = function () {
        clearTimeout(pongWaitTimeout);
        pingTimeout = setTimeout(ping, 60000);
        wsConn.removeListener('pong', pongEvt);
    };
    wsConn.on('pong', pongEvt);
    // Disconnect if a PONG was not received within 10 seconds.
    pongWaitTimeout = setTimeout(function () {
        console.log('FrankerFaceZ PING/PONG failed, terminating connection.');
        wsConn.removeListener('pong', pongEvt);
        wsConn.terminate();
    }, 10000); // tslint:disable-line: align
}
function connectToWS() {
    return __awaiter(this, void 0, void 0, function () {
        var serverURL;
        return __generator(this, function (_a) {
            messageNo = 1;
            serverURL = pickServer();
            wsConn = new ws_1.default(serverURL);
            console.log('Connecting to FrankerFaceZ (%s).', serverURL);
            // Catching any errors with the connection. The "close" event is also fired if it's a disconnect.
            wsConn.on('error', function (err) {
                console.log('Error occurred on the FrankerFaceZ connection: %s', err);
            });
            wsConn.once('open', function () {
                console.log('Connection to FrankerFaceZ successful.');
                sendInitMessages().then(function () {
                    pingTimeout = setTimeout(ping, 60000);
                    return new Promise(function (resolve) { return resolve(); });
                });
            });
            // If we disconnect, just run this function again after a delay to reconnect.
            wsConn.once('close', function () {
                console.log('Connection to FrankerFaceZ closed, will reconnect in 10 seconds.');
                clearTimeout(pingTimeout);
                setTimeout(connectToWS, 10000);
            });
            // For -1 messages.
            wsConn.on('message', function (data) {
                // console.log(`[DEBUG-RECV]: ${data}`);
                if (data.startsWith('-1')) {
                    // If we need to authorize with FFZ, gets the auth code and does that.
                    // Original command will still be executed once authed, so no need for any other checking.
                    if (data.includes('do_authorize')) {
                        var authCode = JSON.parse(data.substr(16));
                        sendAuthThroughTwitchChat(authCode);
                    }
                    if (data.includes('follow_buttons')) {
                        console.log('Got follow_buttons from FrankerFaceZ connection.');
                    }
                }
            });
            return [2 /*return*/];
        });
    });
}
exports.connectToWS = connectToWS;
function setChannels(usernames) {
    console.log('Attempting to set FrankerFaceZ Twitch names.');
    if (wsConn && wsConn.readyState === 1) {
        console.log('Sent FrankerFaceZ Twitch names.');
        sendMessage("update_follow_buttons " + JSON.stringify([twitch_api_1.twitchDB.name, usernames]))
            .then(function (msg) {
            var updatedClients = JSON.parse(msg.substr(3)).updated_clients;
            console.log("FrankerFaceZ buttons have been updated for " + updatedClients + " viewers.");
        });
    }
}
exports.setChannels = setChannels;
