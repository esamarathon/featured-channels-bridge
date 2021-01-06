# featured-channels-bridge

A bridge that can be used to set [FrankerFaceZ](https://www.frankerfacez.com/) featured channels  (and emoticons if enabled on the channel) and optionally featured channels on the ["Featured Channels" Twitch extension](https://www.twitch.tv/ext/3zorofke3r7bu8pd0mb7s86qtfrgzj) without needing direct access to the account.

## Installation/Usage

```
cmd
git clone https://github.com/esamarathon/featured-channels-bridge.git
npm install
npm run build
npm start
```

A Docker container is also available [on Docker Hub](https://hub.docker.com/r/esamarathon/featured-channels-bridge).

## Configuration

You can either configure the settings through a `config.json` file (see `default-config.json`) or by using environment variables.

```
HTTP_PORT=1234
HTTP_KEY_CUSTOMNAME=CUSTOM_KEY
TWITCH_CHANNELNAME=CHANNEL_NAME
TWITCH_CLIENTID=CLIENT_ID
TWITCH_CLIENTSECRET=CLIENT_SECRET
TWITCH_REDIRECTURI=URI
TWITCH_EXTTOKEN=TOKEN
```
