import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import SpotifyWebApi from "spotify-web-api-node";
import { kv } from "@vercel/kv";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  preview_url: string | null;
  external_urls: { spotify: string };
}

async function getPreviousSuggestions(
  userIdentifier: string
): Promise<Set<string>> {
  const result = await kv.get(`previousSuggestions:${userIdentifier}`);

  console.log(`Raw result for ${userIdentifier}:`, result);

  if (result === null || result === undefined) {
    console.log(`No previous suggestions found for user: ${userIdentifier}`);
    return new Set();
  }

  if (Array.isArray(result)) {
    return new Set(result);
  }

  if (typeof result === "string") {
    try {
      const parsed = JSON.parse(result);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    } catch (e) {
      console.error("Error parsing stored suggestions:", e);
    }
  }

  console.warn(`Unexpected type for previous suggestions: ${typeof result}`);
  return new Set();
}

async function addToPreviousSuggestions(
  userIdentifier: string,
  trackIds: string[]
): Promise<void> {
  const suggestions = await getPreviousSuggestions(userIdentifier);
  trackIds.forEach((id) => suggestions.add(id));
  await kv.set(
    `previousSuggestions:${userIdentifier}`,
    JSON.stringify(Array.from(suggestions))
  );
}

async function searchSpotifyTracks(
  query: string,
  accessToken: string
): Promise<SpotifyTrack[]> {
  spotifyApi.setAccessToken(accessToken);
  const results = await spotifyApi.searchTracks(query, { limit: 50 });
  return results.body.tracks?.items || [];
}

async function getUserMusicProfile(accessToken: string) {
  spotifyApi.setAccessToken(accessToken);

  const [topTracks, recentTracks, followedArtists, featuredPlaylists] =
    await Promise.all([
      spotifyApi.getMyTopTracks({ limit: 10 }),
      spotifyApi.getMyRecentlyPlayedTracks({ limit: 10 }),
      spotifyApi.getFollowedArtists({ limit: 10 }),
      spotifyApi.getFeaturedPlaylists({ limit: 5 }),
    ]);

  return {
    topTracks: topTracks.body.items.map(
      (track) => `${track.name} by ${track.artists[0].name}`
    ),
    recentTracks: recentTracks.body.items.map(
      (item) => `${item.track.name} by ${item.track.artists[0].name}`
    ),
    followedArtists: followedArtists.body.artists.items.map(
      (artist) => artist.name
    ),
    featuredPlaylists: featuredPlaylists.body.playlists.items.map(
      (playlist) => playlist.name
    ),
  };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { weather, mood, location, genre } = await req.json();

    const userProfile = await getUserMusicProfile(session.accessToken);

    const prompt = `As a music recommendation expert, suggest 3 songs based on the following:
      Weather: ${weather}
      Mood: ${mood}
      Location: ${location}
      Preferred Genre: ${genre}
      User's top tracks: ${userProfile.topTracks.join(", ")}
      User's recently played tracks: ${userProfile.recentTracks.join(", ")}
      User's followed artists: ${userProfile.followedArtists.join(", ")}
      Featured playlists: ${userProfile.featuredPlaylists.join(", ")}
  
      Consider the user's current mood and weather conditions, and how they might influence music preferences. 
      Factor in the user's listening history and favorite artists to personalize the recommendations. 
      Aim for a mix of familiar and new songs that match the user's taste profile and current situation. 
      For each suggestion, provide a brief explanation of why it's a good fit.
  
      Format your response as a JSON object with an array of 3 song suggestions, each containing:
      - songName: The name of the song
      - artistName: The name of the artist
      - explanation: A brief explanation of why this song is recommended
      `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a music recommendation expert. Based on the user's input and their music preferences, suggest 3 songs that fit their current situation and taste. You will use the provided function to search for songs on Spotify.",
        },
        {
          role: "user",
          content: `${prompt}`,
        },
      ],
      functions: [
        {
          name: "search_spotify_tracks",
          description: "Search for tracks on Spotify",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query for Spotify tracks",
              },
            },
            required: ["query"],
          },
        },
      ],
      function_call: "auto",
    });

    const message = completion.choices[0].message;

    if (message.function_call) {
      const { name, arguments: args } = message.function_call;
      if (name === "search_spotify_tracks") {
        const query = JSON.parse(args).query;
        const tracks = await searchSpotifyTracks(query, session.accessToken);

        if (tracks.length === 0) {
          return NextResponse.json(
            { error: "No matching tracks found on Spotify" },
            { status: 404 }
          );
        }
        const previousSuggestions = await getPreviousSuggestions(
          session.user.email
        );
        // Filter out previously suggested tracks
        const newTracks = tracks.filter(
          (track) => !previousSuggestions.has(track.id)
        );

        if (newTracks.length === 0) {
          return NextResponse.json(
            { error: "No new matching tracks found on Spotify" },
            { status: 404 }
          );
        }
        // Select up to 3 new tracks from the results
        const selectedTracks = newTracks.slice(0, 3);

        // Add the new tracks to the list of previous suggestions
        await addToPreviousSuggestions(
          session.user.email,
          selectedTracks.map((track) => track.id)
        );

        const suggestions = selectedTracks.map((track) => ({
          trackId: track.id,
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          albumImageUrl: track.album.images[0]?.url,
          previewUrl: track.preview_url,
          spotifyUrl: track.external_urls.spotify,
        }));

        return NextResponse.json({ suggestions });
      }
    }

    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error in music suggestion:", error);
    return NextResponse.json(
      { error: "Failed to generate music suggestions" },
      { status: 500 }
    );
  }
}
