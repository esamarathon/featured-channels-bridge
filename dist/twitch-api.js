"use strict";
/* eslint-disable max-len */
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_extra_1 = __importDefault(require("fs-extra"));
var needle_1 = __importDefault(require("needle"));
var path_1 = __importDefault(require("path"));
var _1 = require(".");
var ffz = __importStar(require("./ffz"));
var requestOpts;
// eslint-disable-next-line import/no-mutable-exports
exports.twitchDB = fs_extra_1.default.readJSONSync(path_1.default.join(process.cwd(), './persistent/twitch_db.json'), { throws: false });
if (exports.twitchDB) {
    console.log('Loaded Twitch database from file.');
}
else {
    exports.twitchDB = {};
}
function saveDatabase() {
    fs_extra_1.default.writeJSONSync(path_1.default.join(process.cwd(), './persistent/twitch_db.json'), exports.twitchDB);
}
function updateToken() {
    return __awaiter(this, void 0, void 0, function () {
        var resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Twitch access token being refreshed.');
                    return [4 /*yield*/, needle_1.default('post', 'https://api.twitch.tv/kraken/oauth2/token', {
                            grant_type: 'refresh_token',
                            refresh_token: encodeURI(exports.twitchDB.refresh_token),
                            client_id: _1.config.twitch.clientID,
                            client_secret: _1.config.twitch.clientSecret,
                        })];
                case 1:
                    resp = _a.sent();
                    if (resp.statusCode === 200) {
                        exports.twitchDB.access_token = resp.body.access_token;
                        exports.twitchDB.refresh_token = resp.body.refresh_token;
                        if (requestOpts.headers) {
                            requestOpts.headers.Authorization = "OAuth " + resp.body.access_token;
                        }
                        console.log('Twitch access token successfully refreshed.');
                        saveDatabase();
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function checkTokenValidity() {
    return __awaiter(this, void 0, void 0, function () {
        var resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, needle_1.default('get', 'https://api.twitch.tv/kraken', requestOpts)];
                case 1:
                    resp = _a.sent();
                    if (!(resp.statusCode === 200)) return [3 /*break*/, 3];
                    if (!(!resp.body.token || !resp.body.token.valid)) return [3 /*break*/, 3];
                    return [4 /*yield*/, updateToken()];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.checkTokenValidity = checkTokenValidity;
function authTwitch(code) {
    return __awaiter(this, void 0, void 0, function () {
        var resp1, resp2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, needle_1.default('post', 'https://api.twitch.tv/kraken/oauth2/token', {
                        code: code,
                        client_id: _1.config.twitch.clientID,
                        client_secret: _1.config.twitch.clientSecret,
                        grant_type: 'authorization_code',
                        redirect_uri: _1.config.twitch.redirectURI,
                    })];
                case 1:
                    resp1 = _a.sent();
                    exports.twitchDB.access_token = resp1.body.access_token;
                    exports.twitchDB.refresh_token = resp1.body.refresh_token;
                    if (requestOpts.headers) {
                        requestOpts.headers.Authorization = "OAuth " + resp1.body.access_token;
                    }
                    console.log('Twitch initial tokens obtained.');
                    return [4 /*yield*/, needle_1.default('get', 'https://api.twitch.tv/kraken', requestOpts)];
                case 2:
                    resp2 = _a.sent();
                    exports.twitchDB.id = resp2.body.token.user_id;
                    exports.twitchDB.name = resp2.body.token.user_name;
                    console.log('Twitch user trying to authorise is %s.', resp2.body.token.user_name);
                    if (resp2.body.token.user_name === _1.config.twitch.channelName) {
                        console.log('Twitch authorisation successful.');
                        saveDatabase();
                        ffz.connectToWS();
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function init() {
    requestOpts = {
        headers: {
            Accept: 'application/vnd.twitchtv.v5+json',
            'Content-Type': 'application/json',
            'Client-ID': _1.config.twitch.clientID,
            Authorization: exports.twitchDB.access_token ? "OAuth " + exports.twitchDB.access_token : undefined,
        },
    };
    if (exports.twitchDB.access_token) {
        console.log('Twitch access token available, checking for validity.');
        checkTokenValidity().then(function () {
            console.log('Twitch start up access token validity check done.');
            ffz.connectToWS();
        });
    }
    _1.app.get('/twitchlogin', function (req, res) {
        // tslint:disable-next-line: max-line-length
        var url = "https://api.twitch.tv/kraken/oauth2/authorize?client_id=" + _1.config.twitch.clientID + "&redirect_uri=" + _1.config.twitch.redirectURI + "&response_type=code&scope=chat:read+chat:edit&force_verify=true";
        if (exports.twitchDB.name) {
            // tslint:disable-next-line: max-line-length
            res.send("<a href=\"" + url + "\">CLICK HERE TO LOGIN</a><br><br>Account already logged in, only use above link if needed.");
        }
        else {
            res.send("<a href=\"" + url + "\">CLICK HERE TO LOGIN</a>");
        }
    });
    _1.app.get('/twitchauth', function (req, res) {
        console.log('Someone is trying to authorise with Twitch.');
        if (!req.query.error && req.query.code) {
            authTwitch(req.query.code).then(function () {
                // tslint:disable-next-line: max-line-length
                res.send('<b>Twitch authentication is now complete, feel free to close this window/tab.</b>');
            });
        }
        else {
            console.warn('Issue detected while someone was attempting to authorise with Twitch.');
            res.sendStatus(500);
        }
    });
}
exports.init = init;
