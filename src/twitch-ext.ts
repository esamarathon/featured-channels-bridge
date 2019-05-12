import needle from 'needle';
import { config } from '.';

export function setChannels(usernames: string[]) {
  const usernamesString = usernames.length ? usernames.join(',') : '';
  console.log('Attempting to update Twitch extension "Featured Channels" information.');
  needle.get(
    `https://api.furious.pro/featuredchannels/bot/${config.twitch.extToken}/${usernamesString}`,
  (err, resp) => { // tslint:disable-line: align
    if (!err && resp.statusCode === 200) {
      console.log('Successfully updated Twitch extension "Featured Channels" information.');
    } else {
      console.log('Error updating Twitch extension "Featured Channels" information.');
    }
  });
}
