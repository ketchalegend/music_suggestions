import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import SpotifyWebApi from "spotify-web-api-node";

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

const previousSuggestions = new Set<string>();

async function searchSpotifyTracks(
  query: string,
  accessToken: string
): Promise<SpotifyTrack[]> {
  spotifyApi.setAccessToken(accessToken);
  const results = await spotifyApi.searchTracks(query, { limit: 10 });
  return results.body.tracks?.items || [];
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { weather, mood, location, genre } = await req.json();

    spotifyApi.setAccessToken(session.accessToken);

    // Get user's top tracks
    const topTracks = await spotifyApi.getMyTopTracks({ limit: 10 });
    const topTrackNames = topTracks.body.items
      .map((track) => `${track.name} by ${track.artists[0].name}`)
      .join(", ");

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
          content: `Suggest 3 songs based on the following:
          Weather: ${weather}
          Mood: ${mood}
          Location: ${location}
          Preferred Genre: ${genre}
          User's top tracks: ${topTrackNames}`,
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
        selectedTracks.forEach((track) => previousSuggestions.add(track.id));

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
