/* eslint-disable max-len */

import fsExtra from 'fs-extra';
import needle from 'needle';
import path from 'path';
import { app, config } from '.'; // eslint-disable-line import/no-cycle
import * as ffz from './ffz'; // eslint-disable-line import/no-cycle

interface TwitchDatabase {
  access_token: string; // eslint-disable-line camelcase
  refresh_token: string; // eslint-disable-line camelcase
  name: string;
  id: string;
}

let requestOpts: needle.NeedleOptions;

// eslint-disable-next-line import/no-mutable-exports
export let twitchDB: TwitchDatabase = fsExtra.readJSONSync(
  path.join(process.cwd(), './persistent/twitch_db.json'),
  { throws: false },
);
if (twitchDB) {
  console.log('Loaded Twitch database from file.');
} else {
  twitchDB = {} as TwitchDatabase;
}

function saveDatabase(): void {
  fsExtra.writeJSONSync(
    path.join(process.cwd(), './persistent/twitch_db.json'),
    twitchDB,
  );
}

async function updateToken(): Promise<void> {
  console.log('Twitch access token being refreshed.');
  const resp = await needle('post', 'https://id.twitch.tv/oauth2/token', {
    grant_type: 'refresh_token',
    refresh_token: encodeURI(twitchDB.refresh_token),
    client_id: config.twitch.clientID,
    client_secret: config.twitch.clientSecret,
  });
  if (resp.statusCode === 200) {
    twitchDB.access_token = resp.body.access_token;
    twitchDB.refresh_token = resp.body.refresh_token;
    if (requestOpts.headers) {
      requestOpts.headers.Authorization = `Bearer ${resp.body.access_token}`;
    }
    console.log('Twitch access token successfully refreshed.');
    saveDatabase();
  }
}

export async function checkTokenValidity(): Promise<void> {
  const resp = await needle('get', 'https://id.twitch.tv/oauth2/validate', requestOpts);
  if (resp.statusCode !== 200) {
    await updateToken();
  }
}

async function authTwitch(code: string): Promise<void> {
  const resp1 = await needle(
    'post',
    'https://id.twitch.tv/oauth2/token',
    {
      code,
      client_id: config.twitch.clientID,
      client_secret: config.twitch.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: config.twitch.redirectURI,
    },
  );

  twitchDB.access_token = resp1.body.access_token;
  twitchDB.refresh_token = resp1.body.refresh_token;
  if (requestOpts.headers) {
    requestOpts.headers.Authorization = `Bearer ${resp1.body.access_token}`;
  }
  console.log('Twitch initial tokens obtained.');

  const resp2 = await needle(
    'get',
    'https://id.twitch.tv/oauth2/validate',
    requestOpts,
  );

  twitchDB.id = resp2.body.user_id;
  twitchDB.name = resp2.body.login;
  console.log('Twitch user trying to authorise is %s.', resp2.body.login);
  if (resp2.body.login === config.twitch.channelName) {
    console.log('Twitch authorisation successful.');
    saveDatabase();
    ffz.connectToWS();
  }
}

export function init(): void {
  requestOpts = {
    headers: {
      'Content-Type': 'application/json',
      'Client-ID': config.twitch.clientID,
      Authorization: twitchDB.access_token ? `Bearer ${twitchDB.access_token}` : undefined,
    },
  };

  if (twitchDB.access_token) {
    console.log('Twitch access token available, checking for validity.');
    checkTokenValidity().then(() => {
      console.log('Twitch start up access token validity check done.');
      ffz.connectToWS();
    });
  }

  app.get('/twitchlogin', (req, res) => {
    // tslint:disable-next-line: max-line-length
    const url = `https://id.twitch.tv/oauth2/authorize?client_id=${config.twitch.clientID}&redirect_uri=${config.twitch.redirectURI}&response_type=code&scope=chat:read+chat:edit&force_verify=true`;
    if (twitchDB.name) {
      // tslint:disable-next-line: max-line-length
      res.send(`<a href="${url}">CLICK HERE TO LOGIN</a><br><br>Account already logged in, only use above link if needed.`);
    } else {
      res.send(`<a href="${url}">CLICK HERE TO LOGIN</a>`);
    }
  });

  app.get('/twitchauth', (req, res) => {
    console.log('Someone is trying to authorise with Twitch.');

    if (!req.query.error && req.query.code) {
      authTwitch(req.query.code as string).then(() => {
        // tslint:disable-next-line: max-line-length
        res.send('<b>Twitch authentication is now complete, feel free to close this window/tab.</b>');
      });
    } else {
      console.warn('Issue detected while someone was attempting to authorise with Twitch.');
      res.sendStatus(500);
    }
  });
}
