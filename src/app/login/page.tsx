"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Music2Icon } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleLogin = () => {
    signIn("spotify", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            VibeFlow
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Find the perfect soundtrack for your mood
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Music2Icon className="h-16 w-16 sm:h-24 sm:w-24 text-primary" />
          </div>
          <Button
            onClick={handleLogin}
            className="w-full text-base sm:text-lg font-semibold"
            size="lg"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 0C4.477 0 0 4.477 0 10c0 5.523 4.477 10 10 10 5.523 0 10-4.477 10-10C20 4.477 15.523 0 10 0zm4.586 14.424c-.2.292-.518.463-.85.463-.23 0-.46-.076-.65-.23-1.63-1.32-3.68-1.62-6.08-1.62-1.25 0-2.48.14-3.67.41-.24.06-.49-.01-.67-.18-.18-.17-.27-.42-.23-.67.04-.25.2-.46.43-.56 1.37-.33 2.78-.5 4.14-.5 2.68 0 5.02.36 6.94 1.89.46.37.53 1.04.16 1.5zm1.22-2.72c-.25.34-.64.52-1.04.52-.24 0-.48-.07-.69-.21-1.96-1.46-4.43-1.79-7.34-1.79-1.51 0-2.99.17-4.42.51-.29.07-.59-.01-.81-.22-.22-.21-.33-.51-.28-.81.05-.3.24-.56.51-.68 1.61-.39 3.28-.58 4.99-.58 3.25 0 6.06.39 8.35 2.08.55.41.67 1.19.26 1.74zm1.39-3.14c-.3.4-.76.62-1.23.62-.27 0-.54-.07-.78-.22-2.24-1.68-5.65-2.06-8.33-2.06-1.7 0-3.39.19-5.01.57-.33.08-.67-.02-.92-.25-.25-.24-.38-.58-.33-.92.05-.34.27-.63.58-.76 1.81-.44 3.69-.66 5.59-.66 3.01 0 6.79.44 9.4 2.42.63.47.76 1.36.29 1.99z" />
            </svg>
            Connect with Spotify
          </Button>
          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            Get ready to vibe with personalized music recommendations!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
