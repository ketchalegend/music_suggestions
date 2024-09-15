# Music Suggestion App

This is a Next.js project that provides personalized music suggestions based on the user's mood, weather, location, and preferred genre using Spotify and OpenAI APIs.

## Getting Started

1. **Run the development server:**
   ```bash
   npm install
   #
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

2. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

# NextAuth configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Spotify API credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# OpenAI API key
OPENAI_API_KEY=your_openai_api_key

# Note: Make sure to add http://localhost:3000/api/auth/callback/spotify
# as a Redirect URI in your Spotify Developer Dashboard

## Features

- **User Authentication**: Sign in with Spotify.
- **Music Suggestions**: Get music suggestions based on mood, weather, location, and genre.
- **Share Suggestions**: Share suggested music on social media.



## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

## Deploy on Vercel

Deploy your app using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.