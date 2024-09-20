import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import SpotifyWebApi from "spotify-web-api-node";

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

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { trackIds, playlistId } = await req.json();

  if (!Array.isArray(trackIds) || trackIds.length === 0) {
    return NextResponse.json({ error: "Invalid track IDs" }, { status: 400 });
  }

  try {
    let accessToken = session.accessToken;

    // Function to make authenticated requests
    const makeAuthenticatedRequest = async (
      url: string,
      options: RequestInit
    ): Promise<Response> => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
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
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${accessToken}`,
            },
          });
        }
      }

      return response;
    };

    let targetPlaylistId = playlistId;

    if (!targetPlaylistId) {
      // Create a new playlist if playlistId is not provided
      const userResponse = await makeAuthenticatedRequest(
        "https://api.spotify.com/v1/me",
        {
          method: "GET",
        }
      );

      if (!userResponse.ok) {
        console.error("Failed to fetch user data:", await userResponse.text());
        throw new Error("Failed to fetch user data");
      }

      const userData = await userResponse.json();

      const createPlaylistResponse = await makeAuthenticatedRequest(
        `https://api.spotify.com/v1/users/${userData.id}/playlists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "VibeFlow Playlist",
            description: "Created by VibeFlow (@ketchalegend)",
            public: false,
          }),
        }
      );

      if (!createPlaylistResponse.ok) {
        console.error(
          "Failed to create playlist:",
          await createPlaylistResponse.text()
        );
        throw new Error("Failed to create playlist");
      }

      const playlistData = await createPlaylistResponse.json();
      targetPlaylistId = playlistData.id;
    }

    // Add tracks to the playlist
    const addTracksResponse = await makeAuthenticatedRequest(
      `https://api.spotify.com/v1/playlists/${targetPlaylistId}/tracks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: trackIds.map((id: string) => `spotify:track:${id}`),
        }),
      }
    );

    if (!addTracksResponse.ok) {
      const errorText = await addTracksResponse.text();
      console.error("Failed to add tracks to playlist:", errorText);
      return NextResponse.json(
        { error: "Failed to add tracks to playlist", details: errorText },
        { status: addTracksResponse.status }
      );
    }

    return NextResponse.json({ success: true, playlistId: targetPlaylistId });
  } catch (error) {
    console.error("Error in create-playlist route:", error);
    return NextResponse.json(
      {
        error: "Failed to add tracks to playlist",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
