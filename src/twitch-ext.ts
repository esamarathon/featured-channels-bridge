import needle from 'needle';
import { config } from '.'; // eslint-disable-line import/no-cycle

// eslint-disable-next-line import/prefer-default-export
export async function setChannels(usernames: string[]): Promise<void> {
  if (!config.twitch.extToken) {
    return;
  }
  const usernamesString = usernames.length ? usernames.join(',') : '';
  console.log('Attempting to update Twitch extension "Featured Channels" information.');
  const resp = await needle(
    'get',
    `https://api.furious.pro/featuredchannels/bot/${config.twitch.extToken}/${usernamesString}`,
  );
  if (resp.statusCode === 200) {
    console.log('Successfully updated Twitch extension "Featured Channels" information.');
  } else {
    console.log('Error updating Twitch extension "Featured Channels" information.');
  }
}
