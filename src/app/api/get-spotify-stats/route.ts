import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { getSpotifyApi } from "../../../lib/spotify";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    console.error("No session or access token found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const spotifyApi = await getSpotifyApi(session);

    // Check if the access token is expired
    if (Date.now() > (session as any).accessTokenExpires) {
      console.log("Access token has expired, attempting to refresh...");
      // You may need to implement a token refresh mechanism here
      // For now, we'll return an error
      return NextResponse.json(
        { error: "Access token expired" },
        { status: 401 }
      );
    }

    console.log("Fetching Spotify stats...");

    const timeRange = (req.nextUrl.searchParams.get('timeRange') || 'medium_term') as "short_term" | "medium_term" | "long_term";
    const timeRangeText = {
      'short_term': 'the last 4 weeks',
      'medium_term': 'the last 6 months',
      'long_term': 'all time'
    }[timeRange];

    // Fetch top artists
    const topArtists = await spotifyApi.getMyTopArtists({
      limit: 5,
      time_range: timeRange,
    });
    console.log("Top artists fetched successfully");

    // Fetch top tracks
    const topTracks = await spotifyApi.getMyTopTracks({
      limit: 5,
      time_range: timeRange,
    });
    console.log("Top tracks fetched successfully");

    // Fetch recently played tracks to estimate listening time (last 50 tracks)
    const recentlyPlayed = await spotifyApi.getMyRecentlyPlayedTracks({
      limit: 50,
    });
    console.log("Recently played tracks fetched successfully");

    // Fetch currently playing track
    const currentlyPlaying = await spotifyApi.getMyCurrentPlayingTrack();
    console.log("Currently playing track fetched successfully");

    // Fetch audio features for top tracks
    const topTrackIds = topTracks.body?.items?.map((track: any) => track.id) || [];
    const audioFeatures = await spotifyApi.getAudioFeaturesForTracks(topTrackIds);
    console.log("Audio features fetched successfully");

    // Process top artists
    const processedTopArtists =
      topArtists.body?.items?.map((artist: any) => ({
        name: artist.name ?? "Unknown Artist",
        playCount: artist.popularity ?? 0,
        genres: artist.genres ?? [],
        image: artist.images?.[0]?.url ?? "",
      })) ?? [];

    // Process top tracks
    const processedTopTracks =
      topTracks.body?.items?.map((track: any) => ({
        name: track.name ?? "Unknown Track",
        artist: track.artists?.[0]?.name ?? "Unknown Artist",
        playCount: track.popularity ?? 0,
        album: track.album?.name ?? "Unknown Album",
        image: track.album?.images?.[0]?.url ?? "",
      })) ?? [];

    // Process favorite genres
    const genreCounts: { [key: string]: number } = {};
    topArtists.body?.items?.forEach((artist: any) => {
      (artist.genres ?? []).forEach((genre: string) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });
    const favoriteGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Process currently playing track
    let nowPlaying = null;
    if (currentlyPlaying.body?.item) {
      if ("artists" in currentlyPlaying.body.item) {
        // It's a track
        nowPlaying = {
          name: currentlyPlaying.body.item.name ?? "Unknown Track",
          artist:
            currentlyPlaying.body.item.artists?.[0]?.name ?? "Unknown Artist",
          album: currentlyPlaying.body.item.album?.name ?? "Unknown Album",
          image: currentlyPlaying.body.item.album?.images?.[0]?.url ?? "",
        };
      } else {
        // It's an episode
        nowPlaying = {
          name: currentlyPlaying.body.item.name ?? "Unknown Episode",
          artist:
            currentlyPlaying.body.item.show?.publisher ?? "Unknown Publisher",
          album: currentlyPlaying.body.item.show?.name ?? "Unknown Show",
          image: currentlyPlaying.body.item.images?.[0]?.url ?? "",
        };
      }
    }

    const totalListeningTime =
      recentlyPlayed.body?.items?.reduce((total: number, item: any) => {
        return total + (item.track?.duration_ms ?? 0);
      }, 0) ?? 0;

    // Calculate average audio features
    const avgAudioFeatures = audioFeatures.body?.audio_features?.reduce(
      (acc: any, feature: any) => {
        Object.keys(feature).forEach((key) => {
          if (typeof feature[key] === 'number') {
            acc[key] = (acc[key] || 0) + feature[key] / audioFeatures.body.audio_features.length;
          }
        });
        return acc;
      },
      {}
    );

    // Count unique artists
    const uniqueArtists = new Set();
    recentlyPlayed.body?.items?.forEach((item: any) => {
      item.track?.artists?.forEach((artist: any) => {
        uniqueArtists.add(artist.id);
      });
    });

    console.log("Spotify stats processed successfully");

    return NextResponse.json({
      topArtists: processedTopArtists,
      topTracks: processedTopTracks,
      totalListeningTime: totalListeningTime,
      favoriteGenres: favoriteGenres,
      nowPlaying: nowPlaying,
      timeRange: timeRange,
      timeRangeText: timeRangeText,
      recentTracksCount: recentlyPlayed.body?.items?.length ?? 0,
      audioFeatures: avgAudioFeatures,
      uniqueArtistsCount: uniqueArtists.size,
    });
  } catch (error: any) {
    console.error("Error fetching Spotify stats:", error);
    console.error("Error details:", error.body);
    let errorMessage = "Failed to fetch Spotify stats";
    let statusCode = 500;

    if (error.statusCode === 401) {
      errorMessage = "Spotify access token expired or invalid";
      statusCode = 401;
    } else if (error.statusCode === 403) {
      errorMessage = "Insufficient permissions for Spotify API";
      statusCode = 403;
    } else if (error.statusCode === 429) {
      errorMessage = "Rate limit exceeded for Spotify API";
      statusCode = 429;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
