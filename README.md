# AI Music Suggestion

Get personalized music suggestions based on your mood, weather, location, and preferred genre using Spotify.

## Features

- **User Authentication**: Sign in securely with Spotify.
- **Personalized Music Suggestions**: Get tailored music recommendations based on:
  - Current mood
  - Weather
  - Location
  - Preferred genre
- **Spotify Integration**: 
  - Listen to song previews directly in the app using Spotify's embedded player.
  - Open full tracks in Spotify with a single click.
- **Playlist Creation**: Create custom playlists with your favorite suggested tracks.
- **Share Suggestions**: Share your music discoveries on social media.
- **Responsive Design**: Enjoy a seamless experience on both desktop and mobile devices.

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/musicsuggestion.git
   cd musicsuggestion
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add the following:
   ```
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- NextAuth.js
- Spotify Web API
- OpenAI API

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

Made by Ketchalegend with ❤️ from Cologne, Germany.  
Checkout my website: [ketchalegend.me](https://ketchalegend.me)