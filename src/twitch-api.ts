import fsExtra from 'fs-extra';
import needle from 'needle';
import path from 'path';
import { app, config } from '.';
import * as ffz from './ffz';

interface TwitchDatabase {
  access_token: string;
  refresh_token: string;
  name: string;
  id: string;
}

export let twitchDB: TwitchDatabase = fsExtra.readJSONSync(
  path.join(process.cwd(), './twitch_db.json'),
  { throws: false },
);
if (twitchDB) {
  console.log('Loaded Twitch database from file.');
} else {
  twitchDB = <TwitchDatabase>{};
}

let requestOpts: needle.NeedleOptions;
export function init() {
  requestOpts = {
    headers: {
      Accept: 'application/vnd.twitchtv.v5+json',
      'Content-Type': 'application/json',
      'Client-ID': config.twitch.clientID,
      Authorization: twitchDB.access_token ? `OAuth ${twitchDB.access_token}` : undefined,
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
    const url = `https://api.twitch.tv/kraken/oauth2/authorize?client_id=${config.twitch.clientID}&redirect_uri=${config.twitch.redirectURI}&response_type=code&scope=chat:read+chat:edit&force_verify=true`;
    if (twitchDB.name) {
      // tslint:disable-next-line: max-line-length
      res.send(`<a href="${url}">CLICK HERE TO LOGIN</a><br><br>Account already logged in, only use above link if needed.`);
    } else {
      res.send(`<a href="${url}">CLICK HERE TO LOGIN</a>`);
    }
  });

  app.get('/twitchauth', (req, res) => {
    console.log('Someone is trying to authorise with Twitch.');

    if (!req.query.error) {
      authTwitch(req.query.code).then(() => {
        // tslint:disable-next-line: max-line-length
        res.send('<b>Twitch authentication is now complete, feel free to close this window/tab.</b>');
      });
    } else {
      res.sendStatus(500);
    }
  });
}

async function authTwitch(code: string) {
  const resp1 = await needle(
    'post',
    'https://api.twitch.tv/kraken/oauth2/token',
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
  requestOpts.headers!.Authorization = `OAuth ${resp1.body.access_token}`;
  console.log('Twitch initial tokens obtained.');

  const resp2 = await needle(
    'get',
    'https://api.twitch.tv/kraken',
    requestOpts,
  );

  twitchDB.id = resp2.body.token.user_id;
  twitchDB.name = resp2.body.token.user_name;
  console.log('Twitch user trying to authorise is %s.', resp2.body.token.user_name);
  if (resp2.body.token.user_name === config.twitch.channelName) {
    saveDatabase();
    ffz.connectToWS();
    console.log('Twitch authorisation successful.');
  }
  return;
}

export async function checkTokenValidity() {
  const resp = await needle('get', 'https://api.twitch.tv/kraken', requestOpts);
  if (resp.statusCode === 200) {
    if (!resp.body.token || !resp.body.token.valid) {
      await updateToken();
    }
    return;
  }
}

async function updateToken() {
  console.log('Twitch access token being refreshed.');
  const resp = await needle('post', 'https://api.twitch.tv/kraken/oauth2/token', {
    grant_type: 'refresh_token',
    refresh_token: encodeURI(twitchDB.refresh_token),
    client_id: config.twitch.clientID,
    client_secret: config.twitch.clientSecret,
  });
  if (resp.statusCode === 200) {
    twitchDB.access_token = resp.body.access_token;
    twitchDB.refresh_token = resp.body.refresh_token;
    requestOpts.headers!.Authorization = `OAuth ${resp.body.access_token}`;
    console.log('Twitch access token successfully refreshed.');
    saveDatabase();
    return;
  }
}

function saveDatabase() {
  fsExtra.writeJSONSync(
    path.join(process.cwd(), './twitch_db.json'),
    twitchDB,
  );
}