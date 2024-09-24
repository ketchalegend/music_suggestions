"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Music,
  Plus,
  Trash2,
  Sun,
  Cloud,
  Snowflake,
  CloudSun,
  CloudRain,
  Clock,
  Disc3,
  Mic2,
  Music2,
  PlayCircle,
  BarChart2,
  Users,
  Calendar,
  Play,
  Pause,
  Headphones,
  RefreshCw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Suggestion {
  trackId: string;
  name: string;
  artist: string;
  album: string;
  albumImageUrl: string;
  previewUrl: string;
  spotifyUrl: string;
}

interface Playlist {
  id: string;
  name: string;
}

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  previewUrl: string | null;
}

interface SpotifyStats {
  topArtists: {
    id: string;
    name: string;
    playCount: number;
    image: string;
    genres: string[];
  }[];
  topTracks: Track[];
  totalListeningTime: number;
  favoriteGenres: { name: string; count: number }[];
  nowPlaying: Track | null;
  timeRange: string;
  timeRangeText: string;
  recentTracksCount: number;
  audioFeatures: { [key: string]: number };
  uniqueArtistsCount: number;
  recommendations: Track[];
  followerCount: number;
  followingCount: number;
  newReleases: {
    id: string;
    name: string;
    artist: string;
    image: string;
    releaseDate: string;
  }[];
  artistTopTracks: Track[];
  featuredPlaylists: {
    id: string;
    name: string;
    description: string;
    image: string;
    tracksTotal: number;
  }[];
  userShows: {
    id: string;
    name: string;
    description: string;
    image: string;
    publisher: string;
  }[];
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [weather, setWeather] = useState("");
  const [mood, setMood] = useState("");
  const [location, setLocation] = useState("");
  const [genre, setGenre] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<Suggestion[]>([]);
  const [playlistCreationStatus, setPlaylistCreationStatus] = useState<
    string | null
  >(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [spotifyStats, setSpotifyStats] = useState<SpotifyStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [timeRange, setTimeRange] = useState<string>("medium_term");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState(null);

  const playPauseTrack = (previewUrl: string | null) => {
    if (!previewUrl) return;

    if (audio) {
      audio.pause();
      setAudio(null);
      setIsPlaying(false);
    } else {
      const newAudio = new Audio(previewUrl);
      newAudio.play();
      setAudio(newAudio);
      setIsPlaying(true);

      newAudio.addEventListener("ended", () => {
        setIsPlaying(false);
        setAudio(null);
      });
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchPlaylists();
      fetchSpotifyStats(timeRange);
    }
  }, [session, timeRange]);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/api/get-playlists");
      const data = await response.json();
      setPlaylists(data.playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };
  const updateSpotifyStats = async () => {
    try {
      const response = await fetch(
        `/api/get-spotify-stats?timeRange=${timeRange}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSpotifyStats(data);
      setIsPlaying(data.nowPlaying !== null);
      setCurrentTrack(data.nowPlaying);
    } catch (error) {
      console.error("Error updating Spotify stats:", error);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      updateSpotifyStats();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(intervalId);
  }, [timeRange]);

  const fetchSpotifyStats = async (selectedTimeRange: string) => {
    if (isLoadingStats) return; // Prevent multiple simultaneous requests
    setIsLoadingStats(true);
    try {
      const response = await fetch(
        `/api/get-spotify-stats?timeRange=${selectedTimeRange}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setSpotifyStats(data);
      setIsPlaying(data.nowPlaying !== null);
      setCurrentTrack(data.nowPlaying);
    } catch (error) {
      console.error("Error fetching Spotify stats:", error);
      setSpotifyStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setSuggestions([]);
    try {
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ weather, mood, location, genre }),
      });
      const data = await response.json();
      if ("error" in data) {
        console.error(data.error);
      } else {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
    setIsLoading(false);
  };

  const handleAddToPlaylist = (track: Suggestion) => {
    setSelectedTracks((prev) => [...prev, track]);
  };

  const handleRemoveFromPlaylist = (trackId: string) => {
    setSelectedTracks((prev) =>
      prev.filter((track) => track.trackId !== trackId)
    );
  };

  const handleCreatePlaylist = async () => {
    setPlaylistCreationStatus("Adding tracks to playlist...");
    try {
      const response = await fetch("/api/create-playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackIds: selectedTracks.map((track) => track.trackId),
          playlistId: selectedPlaylist,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPlaylistCreationStatus("Tracks added to playlist successfully!");
        setSelectedTracks([]);
        fetchPlaylists();
      } else {
        setPlaylistCreationStatus(
          "Failed to add tracks to playlist. Please try again."
        );
      }
    } catch (error) {
      console.error("Error creating/updating playlist:", error);
      setPlaylistCreationStatus(
        "An error occurred while adding tracks to the playlist."
      );
    }
    setTimeout(() => setPlaylistCreationStatus(null), 5000);
  };

  const weatherIcons = [
    { icon: Sun, label: "Sunny" },
    { icon: CloudRain, label: "Rainy" },
    { icon: Snowflake, label: "Snowy" },
    { icon: CloudSun, label: "Partly Cloudy" },
    { icon: Cloud, label: "Cloudy" },
  ];

  const moodIcons = [
    { icon: "😊", label: "Happy" },
    { icon: "😢", label: "Sad" },
    { icon: "😴", label: "Sleepy" },
    { icon: "😡", label: "Angry" },
    { icon: "🤓", label: "Focused" },
  ];

  const locationIcons = [
    { icon: "🏠", label: "Home" },
    { icon: "🏢", label: "Work" },
    { icon: "🏞️", label: "Outdoors" },
    { icon: "🏋️", label: "Gym" },
    { icon: "🚗", label: "Commuting" },
  ];

  const GENRES = [
    "Pop",
    "R&B",
    "Jazz",
    "Afro Beats",
    "Hip Hop",
    "Country",
    "Love",
    "Classical",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 text-primary-foreground p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-center mb-8 sm:mb-12">
          VibeFlow
        </h1>
        <p className="text-sm sm:text-xl text-center mb-8 sm:mb-12">
          Discover music that matches your mood and vibe 🎶 🎧
        </p>

        <Tabs defaultValue="vibe" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vibe">Current Vibe</TabsTrigger>
            <TabsTrigger value="setting">Your Setting</TabsTrigger>
            <TabsTrigger value="stats">Spotify Stats</TabsTrigger>
          </TabsList>
          <TabsContent value="vibe">
            <Card>
              <CardHeader>
                <CardTitle>Set Your Vibe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Weather</h3>
                    <div className="flex flex-wrap gap-2">
                      {weatherIcons.map(({ icon: Icon, label }) => (
                        <Button
                          key={label}
                          variant={weather === label ? "secondary" : "outline"}
                          size="lg"
                          className="flex-1"
                          onClick={() => setWeather(label)}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Mood</h3>
                    <div className="flex flex-wrap gap-2">
                      {moodIcons.map(({ icon, label }) => (
                        <Button
                          key={label}
                          variant={mood === label ? "secondary" : "outline"}
                          size="lg"
                          className="flex-1"
                          onClick={() => setMood(label)}
                        >
                          <span className="mr-2">{icon}</span>
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="setting">
            <Card>
              <CardHeader>
                <CardTitle>Your Setting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Location</h3>
                    <div className="flex flex-wrap gap-2">
                      {locationIcons.map(({ icon, label }) => (
                        <Button
                          key={label}
                          variant={location === label ? "secondary" : "outline"}
                          size="lg"
                          className="flex-1"
                          onClick={() => setLocation(label)}
                        >
                          <span className="mr-2">{icon}</span>
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Preferred Genre
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map((g) => (
                        <Button
                          key={g}
                          variant={genre === g ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setGenre(g)}
                        >
                          {g}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="stats" className="space-y-8">
            {(() => {
              console.log("Current spotifyStats:", spotifyStats);
              return null;
            })()}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-3xl font-bold text-gray-800">
                    Your Spotify Insights
                  </CardTitle>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[180px] bg-white/10 text-gray-800 border-none">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short_term">Last 4 Weeks</SelectItem>
                      <SelectItem value="medium_term">Last 6 Months</SelectItem>
                      <SelectItem value="long_term">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => fetchSpotifyStats(timeRange)}
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </div>
                {spotifyStats && (
                  <p className="text-sm text-gray-600">
                    Unveiling your musical journey from{" "}
                    {spotifyStats.timeRangeText}
                  </p>
                )}
                {/* Add this line */}
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-gray-800" />
                  </div>
                ) : spotifyStats ? (
                  <div className="space-y-8">
                    {spotifyStats.nowPlaying && (
                      <Card className="bg-white/10 backdrop-blur-lg">
                        <CardContent className="p-6 relative">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute inset-0 transform translate-y-1/2 opacity-20"
                              style={{
                                animation: `wave ${
                                  3 + i * 0.5
                                }s ease-in-out infinite alternate`,
                                backgroundImage:
                                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='1' d='M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,128C672,128,768,160,864,181.3C960,203,1056,213,1152,202.7C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E\")",
                                backgroundSize: "cover",
                                backgroundPosition: "bottom",
                              }}
                            />
                          ))}
                          <h3 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                            {isPlaying ? (
                              <Music className="mr-2 text-green-400 animate-pulse" />
                            ) : (
                              <Music className="mr-2 text-yellow-400" />
                            )}
                            Now Playing
                          </h3>
                          <div className="flex items-center space-x-4">
                            <img
                              src={spotifyStats.nowPlaying.image}
                              alt={spotifyStats.nowPlaying.album}
                              className="w-24 h-24 rounded-md object-cover shadow-lg"
                            />
                            <div className="flex-grow">
                              <p className="font-semibold text-xl text-gray-800">
                                {spotifyStats.nowPlaying.name}
                              </p>
                              <p className="text-gray-800">
                                {spotifyStats.nowPlaying.artist}
                              </p>
                              <p className="text-sm text-gray-600">
                                {spotifyStats.nowPlaying.album}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                playPauseTrack(
                                  spotifyStats?.nowPlaying?.previewUrl ?? null
                                )
                              }
                              className="rounded-full"
                            >
                              {isPlaying ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                              <span className="sr-only">Play/Pause</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-white/5 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <h3 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                            <Mic2 className="mr-2 text-pink-400" /> Top Artists
                          </h3>
                          <ScrollArea className="h-[300px] overflow-y-auto pr-4">
                            <div className="space-y-4">
                              {spotifyStats.topArtists &&
                              spotifyStats.topArtists.length > 0 ? (
                                spotifyStats.topArtists.map((artist, index) => (
                                  <div
                                    key={artist.id}
                                    className="flex items-center space-x-4 group"
                                  >
                                    <img
                                      src={artist.image}
                                      alt={artist.name}
                                      className="w-16 h-16 rounded-full object-cover shadow-md group-hover:scale-105 transition-transform"
                                    />
                                    <div>
                                      <p className="font-semibold text-gray-800 group-hover:text-pink-400 transition-colors">
                                        {artist.name}
                                      </p>
                                      <p className="text-sm text-gray-800">
                                        {artist.playCount} plays
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {artist.genres.slice(0, 3).join(", ")}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-800">
                                  No top artists data available.
                                </p>
                              )}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/5 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <h3 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                            <Music2 className="mr-2 text-blue-400" /> Top Tracks
                          </h3>
                          <ScrollArea className="h-[300px] overflow-y-auto pr-4">
                            <div className="space-y-4">
                              {spotifyStats.topTracks &&
                              spotifyStats.topTracks.length > 0 ? (
                                spotifyStats.topTracks.map((track, index) => (
                                  <div
                                    key={track.id}
                                    className="flex items-center space-x-4 group"
                                  >
                                    <img
                                      src={track.image}
                                      alt={track.album}
                                      className="w-16 h-16 rounded-md object-cover shadow-md group-hover:scale-105 transition-transform"
                                    />
                                    <div className="flex-grow">
                                      <p className="font-semibold text-gray-800 group-hover:text-blue-400 transition-colors">
                                        {track.name}
                                      </p>
                                      <p className="text-sm text-gray-800">
                                        {track.artist}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {track.album}
                                      </p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() =>
                                        playPauseTrack(track.previewUrl)
                                      }
                                      className="rounded-full"
                                    >
                                      <Play className="h-4 w-4" />
                                      <span className="sr-only">Play</span>
                                    </Button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-800">
                                  No top tracks data available.
                                </p>
                              )}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-white/5 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <h3 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                            <Clock className="mr-2 text-yellow-400" /> Listening
                            Snapshot
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-white/10 rounded-lg p-4">
                              <p className="text-4xl font-bold text-yellow-400">
                                {Math.round(
                                  spotifyStats.totalListeningTime / 3600000
                                )}
                              </p>
                              <p className="text-gray-800">hours of music</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                              <p className="text-4xl font-bold text-yellow-400">
                                {spotifyStats.recentTracksCount}
                              </p>
                              <p className="text-gray-800">
                                tracks in last session
                              </p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                              <p className="text-4xl font-bold text-yellow-400">
                                {spotifyStats.uniqueArtistsCount}
                              </p>
                              <p className="text-gray-800">
                                unique artists explored
                              </p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                              <p className="text-4xl font-bold text-yellow-400">
                                {spotifyStats.followerCount}
                              </p>
                              <p className="text-gray-800">followers</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/5 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <h3 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                            <Disc3 className="mr-2 text-green-400" /> Genre
                            Palette
                          </h3>
                          <div className="space-y-2">
                            {spotifyStats.favoriteGenres.map((genre, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2"
                              >
                                <div className="w-full bg-white/20 rounded-full h-4">
                                  <div
                                    className="bg-green-400 h-4 rounded-full"
                                    style={{
                                      width: `${
                                        (genre.count /
                                          spotifyStats.favoriteGenres[0]
                                            .count) *
                                        100
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-800 min-w-[100px]">
                                  {genre.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-white/5 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <h3 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                            <Calendar className="mr-2 text-orange-400" />
                            Latest Releases
                          </h3>
                          <ScrollArea className="h-[300px] overflow-y-auto pr-4">
                            <div className="space-y-4">
                              {spotifyStats.newReleases &&
                              spotifyStats.newReleases.length > 0 ? (
                                spotifyStats.newReleases.map((release) => (
                                  <div
                                    key={release.id}
                                    className="flex items-center space-x-4 group"
                                  >
                                    <img
                                      src={release.image}
                                      alt={release.name}
                                      className="w-16 h-16 rounded-md object-cover shadow-md group-hover:scale-105 transition-transform"
                                    />
                                    <div>
                                      <p className="font-semibold text-gray-800 group-hover:text-orange-400 transition-colors">
                                        {release.name}
                                      </p>
                                      <p className="text-sm text-gray-800">
                                        {release.artist}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {release.releaseDate}
                                      </p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() =>
                                        window.open(
                                          `https://open.spotify.com/album/${release.id}`,
                                          "_blank"
                                        )
                                      }
                                      className="rounded-full"
                                    >
                                      <Play className="h-4 w-4" />
                                      <span className="sr-only">
                                        Open in Spotify
                                      </span>
                                    </Button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-800">
                                  No new releases data available.
                                </p>
                              )}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/5 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <h3 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                            <Music className="mr-2 text-green-400" /> Featured
                            Playlists
                          </h3>
                          <ScrollArea className="h-[300px] overflow-y-auto pr-4">
                            <div className="space-y-4">
                              {spotifyStats?.featuredPlaylists &&
                              spotifyStats.featuredPlaylists.length > 0 ? (
                                spotifyStats.featuredPlaylists.map(
                                  (playlist) => (
                                    <div
                                      key={playlist.id}
                                      className="flex items-center space-x-4 group"
                                    >
                                      <img
                                        src={playlist.image}
                                        alt={playlist.name}
                                        className="w-16 h-16 rounded-md object-cover shadow-md group-hover:scale-105 transition-transform"
                                      />
                                      <div className="flex-grow">
                                        <p className="font-semibold text-gray-800 group-hover:text-green-400 transition-colors">
                                          {playlist.name}
                                        </p>
                                        <p className="text-sm text-gray-800">
                                          {playlist.tracksTotal} tracks
                                        </p>
                                        <p className="text-xs text-gray-600 truncate">
                                          {playlist.description}
                                        </p>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          window.open(
                                            `https://open.spotify.com/playlist/${playlist.id}`,
                                            "_blank"
                                          )
                                        }
                                        className="rounded-full"
                                      >
                                        Open
                                      </Button>
                                    </div>
                                  )
                                )
                              ) : (
                                <p className="text-gray-800">
                                  No featured playlists available.
                                </p>
                              )}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>

                      <Card className="bg-white/5 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <h3 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                            <Headphones className="mr-2 text-purple-400" /> Your
                            Shows
                          </h3>
                          <ScrollArea className="h-[300px] overflow-y-auto pr-4">
                            <div className="space-y-4">
                              {spotifyStats?.userShows &&
                              spotifyStats.userShows.length > 0 ? (
                                spotifyStats.userShows.map((show) => (
                                  <div
                                    key={show.id}
                                    className="flex items-center space-x-4 group"
                                  >
                                    <img
                                      src={show.image}
                                      alt={show.name}
                                      className="w-16 h-16 rounded-md object-cover shadow-md group-hover:scale-105 transition-transform"
                                    />
                                    <div className="flex-grow">
                                      <p className="font-semibold text-gray-800 group-hover:text-purple-400 transition-colors">
                                        {show.name}
                                      </p>
                                      <p className="text-sm text-gray-800">
                                        {show.publisher}
                                      </p>
                                      <p className="text-xs text-gray-600 truncate">
                                        {show.description}
                                      </p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() =>
                                        window.open(
                                          `https://open.spotify.com/show/${show.id}`,
                                          "_blank"
                                        )
                                      }
                                      className="rounded-full"
                                    >
                                      <Play className="h-4 w-4" />
                                      <span className="sr-only">
                                        Open in Spotify
                                      </span>
                                    </Button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-800">
                                  No saved shows available.
                                </p>
                              )}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/5 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <h3 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                            <Users className="mr-2 text-indigo-400" /> Social
                            Stats
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-white/10 rounded-lg p-4">
                              <p className="text-4xl font-bold text-indigo-400">
                                {spotifyStats.followerCount}
                              </p>
                              <p className="text-gray-800">Followers</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                              <p className="text-4xl font-bold text-indigo-400">
                                {spotifyStats.followingCount}
                              </p>
                              <p className="text-gray-800">Following</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <Card className="bg-white/5 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <h3 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                          <BarChart2 className="mr-2 text-purple-400" /> Musical
                          Mood Board
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {Object.entries(
                            spotifyStats?.audioFeatures || {}
                          ).map(([feature, value]) => (
                            <div key={feature} className="text-center">
                              <div
                                className="radial-progress text-purple-400 mx-auto"
                                style={
                                  {
                                    "--value": value * 100,
                                    "--size": "8rem",
                                    "--thickness": "0.5rem",
                                  } as React.CSSProperties
                                }
                                role="progressbar"
                              >
                                {Math.round(value * 100)}%
                              </div>
                              <p className="mt-2 text-sm text-gray-800 capitalize">
                                {feature.replace(/_/g, " ")}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center text-gray-800">
                    <p className="mb-4">
                      Oops! We couldn't tune into your Spotify stats right now.
                      Let's try again?
                    </p>
                    <Button
                      onClick={() => fetchSpotifyStats(timeRange)}
                      variant="secondary"
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleSubmit}
          disabled={isLoading || !weather || !mood || !location || !genre}
          size="lg"
          className="w-full mb-8"
          style={{
            backgroundColor: !isLoading && weather && mood && location && genre ? '#10B981' : '',
            color: !isLoading && weather && mood && location && genre ? 'white' : ''
          }}        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Finding your perfect tracks...
            </>
          ) : (
            "Get Suggestions"
          )}
        </Button>

        {suggestions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Perfect Tracks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.trackId} className="overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={suggestion.albumImageUrl}
                        alt={`${suggestion.album} cover`}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Button asChild variant="secondary">
                          <a
                            href={suggestion.spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open in Spotify
                          </a>
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold truncate">
                        {suggestion.name}
                      </h3>
                      <p className="text-sm text-gray-800 truncate">
                        {suggestion.artist}
                      </p>
                      <p className="text-xs text-gray-600 mb-2 truncate">
                        {suggestion.album}
                      </p>
                      <audio
                        src={suggestion.previewUrl}
                        controls
                        className="w-full mb-2"
                      />
                      <Button
                        onClick={() => handleAddToPlaylist(suggestion)}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add to Playlist
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTracks.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Selected Tracks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {selectedTracks.map((track) => (
                  <div
                    key={track.trackId}
                    className="flex justify-between items-center bg-secondary rounded-lg p-2"
                  >
                    <span className="truncate">
                      {track.name} - {track.artist}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromPlaylist(track.trackId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Select
                value={selectedPlaylist || ""}
                onValueChange={(value) => setSelectedPlaylist(value)}
              >
                <SelectTrigger className="w-full mb-4">
                  <SelectValue placeholder="Select a playlist" />
                </SelectTrigger>
                <SelectContent>
                  {playlists
                    .filter((playlist) => playlist.id)
                    .map((playlist) => (
                      <SelectItem key={playlist.id} value={playlist.id}>
                        {playlist.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreatePlaylist} className="w-full">
                <Music className="mr-2 h-4 w-4" />
                {selectedPlaylist
                  ? "Add to Selected Playlist"
                  : "Create New Playlist"}{" "}
                ({selectedTracks.length} tracks)
              </Button>
            </CardContent>
          </Card>
        )}

        {playlistCreationStatus && (
          <div className="text-xl font-semibold text-center bg-secondary rounded-xl p-4 mb-8 animate-pulse">
            {playlistCreationStatus}
          </div>
        )}

        <Button
          onClick={() => signOut()}
          variant="secondary"
          className="w-full"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}