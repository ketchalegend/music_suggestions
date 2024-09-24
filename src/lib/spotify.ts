import SpotifyWebApi from 'spotify-web-api-node';
import { Session } from 'next-auth';

export const getSpotifyApi = async (session: Session | null): Promise<SpotifyWebApi> => {
  if (!session || !session.accessToken) {
    throw new Error('No access token available');
  }

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  spotifyApi.setAccessToken(session.accessToken as string);

  return spotifyApi;
};