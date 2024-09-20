import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import SpotifyWebApi from "spotify-web-api-node";

interface Playlist {
  id: string;
  name: string;
}

interface Session {
  accessToken: string;
  refreshToken: string;
  user: {
    name: string;
    email: string;
  };
}

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

async function refreshAccessToken(token: Session): Promise<Session | null> {
  try {
    spotifyApi.setAccessToken(token.accessToken);
    spotifyApi.setRefreshToken(token.refreshToken);

    const { body: refreshedToken } = await spotifyApi.refreshAccessToken();

    return {
      ...token,
      accessToken: refreshedToken.access_token,
      refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("RefreshAccessTokenError", error);
    return null;
  }
}

export async function GET() {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    let accessToken = session.accessToken;

    // Function to make authenticated requests
    const makeAuthenticatedRequest = async (url: string): Promise<Response> => {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        // Token might have expired, try to refresh
        const newToken = await refreshAccessToken(session);
        if (newToken) {
          accessToken = newToken.accessToken;
          // Retry the request with the new token
          return fetch(url, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
        }
      }

      return response;
    };

    let allPlaylists: Playlist[] = [];
    let nextUrl = "https://api.spotify.com/v1/me/playlists?limit=50";

    while (nextUrl) {
      const playlistsResponse = await makeAuthenticatedRequest(nextUrl);

      if (!playlistsResponse.ok) {
        const errorText = await playlistsResponse.text();
        console.error("Failed to fetch playlists:", errorText);
        throw new Error(`Failed to fetch playlists: ${errorText}`);
      }

      const playlistsData = await playlistsResponse.json();

      // Extract relevant information from playlists
      const playlists: Playlist[] = playlistsData.items.map(
        (playlist: any) => ({
          id: playlist.id,
          name: playlist.name,
        })
      );

      allPlaylists = [...allPlaylists, ...playlists];

      nextUrl = playlistsData.next;
    }

    console.log(`Fetched ${allPlaylists.length} playlists`);
    return NextResponse.json({ playlists: allPlaylists });
  } catch (error) {
    console.error("Error in get-playlists route:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlists", details: error },
      { status: 500 }
    );
  }
}
