import bodyParser from 'body-parser';
import express from 'express';
import fsExtra from 'fs-extra';
import http from 'http';
import path from 'path';
import * as ffz from './ffz';
import * as ext from './twitch-ext';
import * as api from './twitch-api';

interface Config {
  http: {
    port: number;
    key: string;
  };
  twitch: {
    channelName: string;
    clientID: string;
    clientSecret: string;
    redirectURI: string;
    extToken: string;
  };
}

type FeaturedChannels = string[];

// Load config if possible.
export const config: Config = fsExtra.readJSONSync(
  path.join(process.cwd(), './config.json'),
  { throws: false },
);
if (!config) {
  console.log('You have forgotten the config.json file.');
  process.exit();
}

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

app.post('/featured_channels', (req, res) => {
  // Reject POSTs without the correct key.
  if (req.query.key !== config.http.key) {
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
