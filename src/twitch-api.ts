import fsExtra from 'fs-extra';
import needle from 'needle';
import path from 'path';
import { app, config } from '.';

interface TwitchDatabase {
  access_token: string;
  refresh_token: string;
  name: string;
  id: string;
}

let twitchDB: TwitchDatabase = fsExtra.readJSONSync(
  path.join(process.cwd(), './twitch_db.json'),
  { throws: false },
);
if (twitchDB) {
  console.log('Loaded Twitch database from file.');
} else {
  twitchDB = <TwitchDatabase>{};
}

const requestOpts: needle.NeedleOptions = {
  headers: {
    Accept: 'application/vnd.twitchtv.v5+json',
    'Content-Type': 'application/json',
    'Client-ID': config.twitch.clientID,
    Authorization: twitchDB.access_token ? `OAuth ${twitchDB.access_token}` : undefined,
  },
};

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
  res.send('<b>Twitch authentication is now complete, feel free to close this window/tab.</b>');

  if (req.query.error) {
    return;
  }

  needle.post('https://api.twitch.tv/kraken/oauth2/token', {
    client_id: config.twitch.clientID,
    client_secret: config.twitch.clientSecret,
    code: req.query.code,
    grant_type: 'authorization_code',
    redirect_uri: config.twitch.redirectURI,
  }, (err, resp) => { // tslint:disable-line: align
    twitchDB.access_token = resp.body.access_token;
    twitchDB.refresh_token = resp.body.refresh_token;
    requestOpts.headers!.Authorization = `OAuth ${resp.body.access_token}`;
    console.log('Twitch initial tokens obtained.');

    needle.get('https://api.twitch.tv/kraken', requestOpts, (err, resp) => {
      twitchDB.id = resp.body.token.user_id;
      twitchDB.name = resp.body.token.user_name;
      console.log('Twitch user trying to authorise is %s.', resp.body.token.user_name);
      if (resp.body.token.user_name !== config.twitch.channelName) {
        return;
      }
      saveDatabase();
      // connect to FFZ WS here
      console.log('Twitch authorisation successful.');
    });
  });
});

function saveDatabase() {
  fsExtra.writeJSONSync(
    path.join(process.cwd(), './twitch_db.json'),
    twitchDB,
  );
}
