import twitchJs from 'twitch-js';
import WebSocket from 'ws';
import { checkTokenValidity, twitchDB } from './twitch-api'; // eslint-disable-line import/no-cycle

let messageNo = 1;
let wsConn: WebSocket;
let pingTimeout: NodeJS.Timeout;

async function sendMessage(message: string): Promise<string> {
  // console.log(`[DEBUG-SEND]: ${messageNo} ${message}`);
  wsConn.send(`${messageNo} ${message}`);
  const thisMessageNo = messageNo;
  messageNo += 1;

  return new Promise((resolve) => {
    const msgEvt = (data: WebSocket.RawData): void => {
      if (data.toString().includes(`${thisMessageNo} ok`)) {
        wsConn.removeListener('message', msgEvt);
        resolve(data.toString().substring(data.toString().indexOf(' ') + 1));
      }
    };
    wsConn.on('message', msgEvt);
  });
}

// Used to send the authorisation code for updating the following buttons/emotes when needed.
function sendAuthThroughTwitchChat(auth: string): void {
  console.log('Attempting to authenticate with FrankerFaceZ.');
  checkTokenValidity().then(() => {
    const client = new twitchJs.Client({
      options: {
        // debug: true,
      },
      connection: {
        secure: true,
      },
      identity: {
        username: twitchDB.name,
        password: twitchDB.access_token,
      },
    });
    client.connect();

    client.once('connected', () => {
      console.log('Connected to Twitch chat to authenticate with FrankerFaceZ.');
      client.say('frankerfacezauthorizer', `AUTH ${auth}`).then(() => client.disconnect());
    });
  });
}

// Initial messages to send on connection.
async function sendInitMessages(): Promise<void> {
  const messagesToSend = [
    'hello ["esamarathon/featured-channels-bridge",false]',
    `setuser "${twitchDB.name}"`,
    `sub "room.${twitchDB.name}"`,
    `sub "channel.${twitchDB.name}"`,
    'ready 0',
  ];
  for (const msg of messagesToSend) {
    await sendMessage(msg);
  }
}

// Picks a server randomly, 1-2-2-2 split in which it picks.
function pickServer(): string {
  const randomInt = Math.floor(Math.random() * 7);
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

function ping(): void {
  let pongWaitTimeout: NodeJS.Timeout;
  wsConn.ping();

  const pongEvt = (): void => {
    clearTimeout(pongWaitTimeout);
    pingTimeout = setTimeout(ping, 60000);
    wsConn.removeListener('pong', pongEvt);
  };
  wsConn.on('pong', pongEvt);

  // Disconnect if a PONG was not received within 10 seconds.
  pongWaitTimeout = setTimeout(() => {
    console.log('FrankerFaceZ PING/PONG failed, terminating connection.');
    wsConn.removeListener('pong', pongEvt);
    wsConn.terminate();
  }, 10000); // tslint:disable-line: align
}

export async function connectToWS(): Promise<void> {
  messageNo = 1;
  const serverURL = pickServer();
  wsConn = new WebSocket(serverURL);
  console.log('Connecting to FrankerFaceZ (%s).', serverURL);

  // Catching any errors with the connection. The "close" event is also fired if it's a disconnect.
  wsConn.on('error', (err) => {
    console.log('Error occurred on the FrankerFaceZ connection: %s', err);
  });

  wsConn.once('open', async () => {
    console.log('Connection to FrankerFaceZ successful.');
    await sendInitMessages();
    pingTimeout = setTimeout(ping, 60000);
  });

  // If we disconnect, just run this function again after a delay to reconnect.
  wsConn.once('close', () => {
    console.log('Connection to FrankerFaceZ closed, will reconnect in 10 seconds.');
    clearTimeout(pingTimeout);
    setTimeout(connectToWS, 10000);
  });

  // For -1 messages.
  wsConn.on('message', (data) => {
    // console.log(`[DEBUG-RECV]: ${data}`);
    if (data.toString().startsWith('-1')) {
      // If we need to authorize with FFZ, gets the auth code and does that.
      // Original command will still be executed once authed, so no need for any other checking.
      if (data.toString().includes('do_authorize')) {
        const authCode = JSON.parse(data.toString().substring(16));
        sendAuthThroughTwitchChat(authCode);
      }

      if (data.toString().includes('follow_buttons')) {
        console.log('Got follow_buttons from FrankerFaceZ connection.');
      }
    }
  });
}

export function setChannels(usernames: string[]): void {
  console.log('Attempting to set FrankerFaceZ Twitch names.');
  if (wsConn && wsConn.readyState === 1) {
    console.log('Sent FrankerFaceZ Twitch names.');
    sendMessage(`update_follow_buttons ${JSON.stringify([twitchDB.name, usernames])}`)
      .then((msg) => {
        const updatedClients = JSON.parse(msg.substr(3)).updated_clients;
        console.log(`FrankerFaceZ buttons have been updated for ${updatedClients} viewers.`);
      });
  }
}
