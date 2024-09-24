import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { getSpotifyApi } from "../../../lib/spotify";

let cache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    console.error("No session or access token found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json(cache.data);
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

    const timeRange = (req.nextUrl.searchParams.get("timeRange") ||
      "medium_term") as "short_term" | "medium_term" | "long_term";
    const timeRangeText = {
      short_term: "the last 4 weeks",
      medium_term: "the last 6 months",
      long_term: "all time",
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
    const topTrackIds =
      topTracks.body?.items?.map((track: any) => track.id) || [];
    const audioFeatures = await spotifyApi.getAudioFeaturesForTracks(
      topTrackIds
    );
    console.log("Audio features fetched successfully");

    // Fetch recommendations based on top tracks and artists
    const recommendations = await spotifyApi.getRecommendations({
      seed_tracks: topTrackIds.slice(0, 2),
      seed_artists:
        topArtists.body?.items?.slice(0, 3).map((artist: any) => artist.id) ||
        [],
      limit: 5,
    });
    console.log("Recommendations fetched successfully");

    // Fetch user profile to get follower count
    const userProfile = await spotifyApi.getMe();
    console.log("User profile fetched successfully");

    // Fetch user's followed artists count
    const followedArtists = await spotifyApi.getFollowedArtists({ limit: 1 });
    console.log("Followed artists fetched successfully");

    const featuredPlaylists = await spotifyApi.getFeaturedPlaylists({
      limit: 5,
    });
    console.log("Featured playlists fetched successfully");

    const userShows = await spotifyApi.getMySavedShows({ limit: 5 });
    console.log("User's saved shows fetched successfully");

    // Fetch new releases
    const newReleases = await spotifyApi.getNewReleases({
      limit: 5,
      country: "de",
    });
    console.log("New releases fetched successfully");

    // Fetch top tracks for the user's top artist
    const topArtistId = topArtists.body?.items?.[0]?.id;
    let artistTopTracks = null;
    if (topArtistId) {
      artistTopTracks = await spotifyApi.getArtistTopTracks(topArtistId, "US");
      console.log("Artist top tracks fetched successfully");
    }

    // Process top artists
    const processedTopArtists = topArtists.body.items.map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      playCount: artist.popularity,
      genres: artist.genres,
      image: artist.images[0]?.url || "",
    }));

    // Process top tracks
    const processedTopTracks = topTracks.body.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || "Unknown Artist",
      playCount: track.popularity,
      album: track.album?.name || "Unknown Album",
      image: track.album?.images[0]?.url || "",
      previewUrl: track.preview_url,
    }));

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
          id: currentlyPlaying.body.item.id,
          name: currentlyPlaying.body.item.name ?? "Unknown Track",
          artist:
            currentlyPlaying.body.item.artists?.[0]?.name ?? "Unknown Artist",
          album: currentlyPlaying.body.item.album?.name ?? "Unknown Album",
          image: currentlyPlaying.body.item.album?.images?.[0]?.url ?? "",
          previewUrl: currentlyPlaying.body.item.preview_url,
        };
      } else {
        // It's an episode
        nowPlaying = {
          id: currentlyPlaying.body.item.id,
          name: currentlyPlaying.body.item.name ?? "Unknown Episode",
          artist:
            currentlyPlaying.body.item.show?.publisher ?? "Unknown Publisher",
          album: currentlyPlaying.body.item.show?.name ?? "Unknown Show",
          image: currentlyPlaying.body.item.images?.[0]?.url ?? "",
          previewUrl: null,
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
          if (typeof feature[key] === "number") {
            acc[key] =
              (acc[key] || 0) +
              feature[key] / audioFeatures.body.audio_features.length;
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

    // Process recommendations
    const processedRecommendations = recommendations.body?.tracks?.map(
      (track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists?.[0]?.name ?? "Unknown Artist",
        album: track.album?.name ?? "Unknown Album",
        image: track.album?.images?.[0]?.url ?? "",
        previewUrl: track.preview_url,
      })
    );

    // Process new releases
    const processedNewReleases = newReleases.body.albums.items.map(
      (album: any) => ({
        id: album.id,
        name: album.name,
        artist: album.artists[0]?.name || "Unknown Artist",
        image: album.images[0]?.url || "",
        releaseDate: album.release_date,
      })
    );

    // Process artist top tracks
    const processedArtistTopTracks = artistTopTracks?.body?.tracks?.map(
      (track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists?.[0]?.name ?? "Unknown Artist",
        album: track.album?.name ?? "Unknown Album",
        image: track.album?.images?.[0]?.url ?? "",
        previewUrl: track.preview_url,
      })
    );

    console.log("Spotify stats processed successfully");

    const responseData = {
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
      recommendations: processedRecommendations,
      followerCount: userProfile.body?.followers?.total ?? 0,
      followingCount: followedArtists.body?.artists?.total ?? 0,
      newReleases: processedNewReleases,
      artistTopTracks: processedArtistTopTracks,
      featuredPlaylists: featuredPlaylists.body.playlists.items.map(
        (playlist: any) => ({
          id: playlist.id,
          name: playlist.name,
          description:
            playlist.description.length > 50
              ? playlist.description.substring(0, 50) + "..."
              : playlist.description,
          image: playlist.images[0]?.url || "",
          tracksTotal: playlist.tracks.total,
        })
      ),
      userShows: userShows.body.items.map((item: any) => ({
        id: item.show.id,
        name: item.show.name,
        description:
          item.show.description.length > 50
            ? item.show.description.substring(0, 50) + "..."
            : item.show.description,
        image: item.show.images[0]?.url || "",
        publisher: item.show.publisher,
      })),
    };

    cache = {
      data: responseData,
      timestamp: Date.now(),
    };

    return NextResponse.json(responseData);
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
