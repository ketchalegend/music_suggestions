import NextAuth, { NextAuthOptions, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import SpotifyProvider from "next-auth/providers/spotify";

interface ExtendedToken extends JWT {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  user: User;
  error?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID as string,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope:
            "user-read-email user-top-read user-read-recently-played user-read-private playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-follow-read",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }): Promise<ExtendedToken> {
      if (account && user) {
        return {
          accessToken: account.access_token as string,
          refreshToken: account.refresh_token as string,
          accessTokenExpires: (account.expires_at as number) * 1000,
          user,
        } as ExtendedToken;
      }

      const extendedToken = token as ExtendedToken;

      // Return previous token if the access token has not expired yet
      if (Date.now() < extendedToken.accessTokenExpires) {
        return extendedToken;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(extendedToken);
    },
    async session({ session, token }) {
      const extendedToken = token as ExtendedToken;
      session.user = extendedToken.user;
      session.accessToken = extendedToken.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

async function refreshAccessToken(
  token: ExtendedToken
): Promise<ExtendedToken> {
  try {
    const url = "https://accounts.spotify.com/api/token";
    const basicAuth = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error("Error refreshing access token", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
