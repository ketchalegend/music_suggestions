"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
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

export function HomeComponent() {
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchPlaylists();
    }
  }, [session]);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/api/get-playlists");
      const data = await response.json();
      setPlaylists(data.playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
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
          "Failed to add tracks playlist. Please try again."
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-center mb-8 sm:mb-12">
          VibeFlow
        </h1>
        <p className="text-lg sm:text-xl text-center mb-8 sm:mb-12">
          Discover music that matches your mood and vibe. Explore personalized
          playlists crafted just for you.
        </p>

        <Tabs defaultValue="vibe" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vibe">Current Vibe</TabsTrigger>
            <TabsTrigger value="setting">Your Setting</TabsTrigger>
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
                      {[
                        "Pop",
                        "R&B",
                        "Jazz",
                        "Afro Beats",
                        "Hip Hop",
                        "Country",
                      ].map((g) => (
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
        </Tabs>

        <Button
          onClick={handleSubmit}
          disabled={isLoading || !weather || !mood || !location || !genre}
          size="lg"
          className="w-full mb-8"
        >
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
                      <p className="text-sm text-gray-300 truncate">
                        {suggestion.artist}
                      </p>
                      <p className="text-xs text-gray-400 mb-2 truncate">
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
                    className="flex justify-between items-center bg-neutral-100 rounded-lg p-2 dark:bg-neutral-800"
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
                <Select.Trigger className="w-full mb-4">
                  <Select.Value placeholder="Select a playlist" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="">Create New Playlist</Select.Item>
                  {playlists.map((playlist) => (
                    <Select.Item key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </Select.Item>
                  ))}
                </Select.Content>
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
          <div className="text-xl font-semibold text-center bg-neutral-100 rounded-xl p-4 mb-8 animate-pulse dark:bg-neutral-800">
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
