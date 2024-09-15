"use client";

import React, { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

interface Suggestion {
  name: string;
  artist: string;
  album: string;
  albumImageUrl: string;
  previewUrl: string;
  spotifyUrl: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [weather, setWeather] = useState("");
  const [mood, setMood] = useState("");
  const [location, setLocation] = useState("");
  const [genre, setGenre] = useState("");
  const [suggestion, setSuggestion] = useState<
    Suggestion | null | { error: string }
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = () => {
    if (session) {
      signOut();
    } else {
      signIn("spotify");
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setSuggestion(null);
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
        setSuggestion({ error: data.error });
      } else {
        setSuggestion(data.suggestion);
      }
    } catch (error) {
      console.error("Error fetching suggestion:", error);
      setSuggestion({ error: "Failed to get a suggestion. Please try again." });
    }
    setIsLoading(false);
  };

  const handleShare = (suggestion: Suggestion) => {
    const shareText = `Check out this song: ${suggestion.name} by ${suggestion.artist}`;
    const shareUrl = suggestion.spotifyUrl;

    if (navigator.share) {
      navigator
        .share({
          title: "Music Suggestion",
          text: shareText,
          url: shareUrl,
        })
        .then(() => console.log("Successful share"))
        .catch((error) => console.log("Error sharing", error));
    } else {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText
        )}&url=${encodeURIComponent(shareUrl)}`,
        "_blank"
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-8 bg-white p-4">
      <h1 className="text-3xl font-bold text-center text-gray-800">
        Discover new music
      </h1>
      <p className="text-md font-bold text-center text-gray-800">
        Get music suggestions from Spotify based on your mood,
        <br />
        weather, music preferences, and genre.
      </p>

      {!session ? (
        <button
          onClick={handleAuth}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Connect with Spotify
        </button>
      ) : (
        <>
          <div className="space-y-4 text-center">
            <h2 className="text-lg text-gray-700">
              What is the weather like today?
            </h2>
            <div className="flex justify-center space-x-4 text-3xl">
              {["☀️", "🌧️", "❄️", "🌥️", "🌤️"].map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => setWeather(emoji)}
                  className={`p-2 rounded-full ${
                    weather === emoji ? "bg-gray-200" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 text-center">
            <h2 className="text-lg text-gray-700">
              How are you feeling in this moment?
            </h2>
            <div className="flex justify-center space-x-4 text-3xl">
              {["😊", "😢", "😴", "😡", "🤓"].map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => setMood(emoji)}
                  className={`p-2 rounded-full ${
                    mood === emoji ? "bg-gray-200" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 text-center">
            <h2 className="text-lg text-gray-700">Where are you right now?</h2>
            <div className="flex justify-center space-x-4 text-3xl">
              {["🏠", "🏢", "🏞️", "🏋️", "🚗"].map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => setLocation(emoji)}
                  className={`p-2 rounded-full ${
                    location === emoji ? "bg-gray-200" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 text-center">
            <h2 className="text-lg text-gray-700">
              What genre of music do you want to listen to?
            </h2>
            <div className="flex flex-wrap justify-center space-x-2 text-gray-700">
              {["Pop", "R&B", "Jazz", "Afro Beats", "Hip Hop", "Country"].map(
                (g, index) => (
                  <button
                    key={index}
                    onClick={() => setGenre(g)}
                    className={`px-4 py-2 border border-gray-300 rounded-lg ${
                      genre === g ? "bg-black text-white" : "hover:bg-gray-100"
                    }`}
                  >
                    {g}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !weather || !mood || !location || !genre}
              className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center disabled:bg-gray-400"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
              )}
            </button>
          </div>

          {suggestion && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                Suggested Song:
              </h3>
              {"error" in suggestion ? (
                <p className="text-red-500">{suggestion.error}</p>
              ) : (
                <div className="flex flex-col items-center">
                  ç
                  <p className="text-gray-700 font-semibold">
                    {suggestion.name}
                  </p>
                  <p className="text-gray-600">{suggestion.artist}</p>
                  <p className="text-gray-500 text-sm">{suggestion.album}</p>
                  {suggestion.previewUrl && (
                    <audio controls className="mt-4 w-full">
                      <source src={suggestion.previewUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  )}
                  <div className="mt-4 space-x-2">
                    <a
                      href={suggestion.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Open in Spotify
                    </a>
                    <button
                      onClick={() => handleShare(suggestion)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Share
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleAuth}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 mt-8"
          >
            Sign Out
          </button>
        </>
      )}
    </div>
  );
}
