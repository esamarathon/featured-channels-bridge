"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.config = void 0;
var body_parser_1 = __importDefault(require("body-parser"));
var express_1 = __importDefault(require("express"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var http_1 = __importDefault(require("http"));
var lodash_1 = __importDefault(require("lodash"));
var path_1 = __importDefault(require("path"));
var ffz = __importStar(require("./ffz"));
var api = __importStar(require("./twitch-api"));
var ext = __importStar(require("./twitch-ext"));
// Configs!
var defaultConfig = fs_extra_1.default.readJSONSync(path_1.default.join(process.cwd(), './default-config.json'), { throws: false });
defaultConfig.http.keys = {};
var extraConfig = fs_extra_1.default.readJSONSync(path_1.default.join(process.cwd(), './config.json'), { throws: false });
var env = process.env;
var envKeys = Object.keys(env).reduce(function (previousValue, currentValue) {
    var obj = previousValue;
    if (env[currentValue] && currentValue.startsWith('HTTP_KEY_')) {
        obj[currentValue.replace('HTTP_KEY_', '')] = env[currentValue] || '';
    }
    return obj;
}, {});
var envPort = Number(env.HTTP_PORT) || undefined;
var envConfig = {
    http: {
        port: envPort,
        keys: envKeys,
    },
    twitch: {
        channelName: env.TWITCH_CHANNELNAME,
        clientID: env.TWITCH_CLIENTID,
        clientSecret: env.TWITCH_CLIENTSECRET,
        redirectURI: env.TWITCH_REDIRECTURI,
        extToken: env.TWITCH_EXTTOKEN,
    },
};
exports.config = lodash_1.default.merge(defaultConfig, extraConfig, envConfig);
// Set up HTTP server.
console.log('HTTP server starting...');
exports.app = express_1.default();
var server = new http_1.default.Server(exports.app);
exports.app.use(body_parser_1.default.json());
server.listen(exports.config.http.port);
console.log("HTTP server listening on port " + exports.config.http.port + ".");
// Sets up some Twitch API stuff.
api.init();
exports.app.get('/', function (req, res) {
    res.send('Running OK');
});
function checkKey(httpKey) {
    var keys = exports.config.http.keys;
    var validKey = Object.keys(keys).find(function (key) { return keys[key] === httpKey; });
    if (validKey) {
        console.log('HTTP key used: %s', validKey);
    }
    return validKey;
}
exports.app.post('/featured_channels', function (req, res) {
    // Reject POSTs without the correct key.
    var validKey = checkKey(req.query.key);
    if (!validKey) {
        res.sendStatus(403);
        return;
    }
    // Return a 400 if the body/channels array is not supplied.
    if (!req.body || !req.body.channels) {
        res.sendStatus(400);
        return;
    }
    var channels = req.body.channels || [];
    ffz.setChannels(channels);
    ext.setChannels(channels);
    res.sendStatus(200);
});
