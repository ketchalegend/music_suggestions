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
- **No Repeat Suggestions**: The app now remembers previously suggested songs and avoids repeating them, ensuring a fresh experience every time.

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/ketchalegend/music_suggestions.git
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
   KV_URL=your_vercel_kv_url
   KV_REST_API_URL=your_vercel_kv_rest_api_url
   KV_REST_API_TOKEN=your_vercel_kv_rest_api_token
   KV_REST_API_READ_ONLY_TOKEN=your_vercel_kv_rest_api_read_only_token
   ```

4. Set up Vercel KV:
   - If you're using Vercel for deployment, you need to set up Vercel KV for persistent storage of previously suggested songs.
   - Follow the [Vercel KV documentation](https://vercel.com/docs/storage/vercel-kv) to create a new KV database.
   - After setting up, you'll receive the necessary environment variables (KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN, KV_REST_API_READ_ONLY_TOKEN). Add these to your `.env.local` file and to your Vercel project settings.

5. Run the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- NextAuth.js
- Spotify Web API
- OpenAI API
- Vercel KV

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

Made by Ketchalegend with ❤️ from Cologne, Germany.  
Checkout my website: [ketchalegend.me](https://ketchalegend.me)
