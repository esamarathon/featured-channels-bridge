import bodyParser from 'body-parser';
import express from 'express';
import fsExtra from 'fs-extra';
import http from 'http';
import _ from 'lodash';
import path from 'path';
import * as ffz from './ffz';
import * as api from './twitch-api';
import * as ext from './twitch-ext';

interface Config {
  http: {
    port: number;
    keys: {
      [k: string]: string;
    };
  };
  twitch: {
    channelName: string | undefined;
    clientID: string | undefined;
    clientSecret: string | undefined;
    redirectURI: string | undefined;
    extToken: string | undefined;
  };
}

type FeaturedChannels = string[];

// Configs!
const defaultConfig: any = fsExtra.readJSONSync(
  path.join(process.cwd(), './default-config.json'),
  { throws: false },
);
defaultConfig.http.keys = {};
const extraConfig: any = fsExtra.readJSONSync(
  path.join(process.cwd(), './config.json'),
  { throws: false },
);

const { env } = process;
const envKeys = Object.keys(env).reduce((previousValue, currentValue) => {
  const obj = previousValue;
  if (env[currentValue] && currentValue.startsWith('HTTP_KEY_')) {
    obj[currentValue.replace('HTTP_KEY_', '')] = env[currentValue] || '';
  }
  return obj;
}, {} as { [k: string]: string });
const envPort = (
  env.HTTP_PORT && !Number.isNaN(parseInt(env.HTTP_PORT, 0))
) ? parseInt(env.HTTP_PORT, 0) : undefined;

const envConfig: any = {
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
export const config: Config = _.merge(defaultConfig, extraConfig, envConfig);

// Set up HTTP server.
console.log('HTTP server starting...');
export const app = express();
const server = new http.Server(app);
app.use(bodyParser.json());
server.listen(config.http.port);
console.log(`HTTP server listening on port ${config.http.port}.`);

// Sets up some Twitch API stuff.
api.init();

app.get('/', (req, res) => {
  res.send('Running OK');
});

function checkKey(httpKey?: string): string | undefined {
  const { keys } = config.http;
  const validKey = Object.keys(keys).find((key) => keys[key] === httpKey);
  if (validKey) {
    console.log('HTTP key used: %s', validKey);
  }
  return validKey;
}

app.post('/featured_channels', (req, res) => {
  // Reject POSTs without the correct key.
  const validKey = checkKey(req.query.key);
  if (!validKey) {
    res.sendStatus(403);
    return;
  }

  // Return a 400 if the body/channels array is not supplied.
  if (!req.body || !req.body.channels) {
    res.sendStatus(400);
    return;
  }

  const channels: FeaturedChannels = req.body.channels || [];
  ffz.setChannels(channels);
  ext.setChannels(channels);
  res.sendStatus(200);
});
