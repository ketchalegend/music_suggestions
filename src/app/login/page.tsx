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
import Image from "next/image";

// Array of artist image URLs (replace with actual URLs)
const artistImages = [
  "https://imgs.search.brave.com/EzoSkB6VX8eIXjX838r9yjk52lIS71baZZ9VgqyNxSk/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9zMS50/aWNrZXRtLm5ldC9k/YW0vYS8xM2YvNDVj/YjU2OTEtNTdjYi00/MjdjLWJkNjgtZWU4/Yjg4YWYzMTNmX1JF/VElOQV9QT1JUUkFJ/VF8zXzIuanBn",
  "https://imgs.search.brave.com/LUCof02gS92VvC1p4iemXaW2WG2hip0UWm1hR74IYYg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/YmlsbGJvYXJkLmNv/bS93cC1jb250ZW50/L3VwbG9hZHMvMjAy/NC8wOC9RaW5nLU1h/ZGktcHJlc3MtY3Jl/ZGl0LVNpbWR5LUNo/dWt3dW1hLTIwMjQt/YmlsbGJvYXJkLTE1/NDguanBnP3c9OTQy/Jmg9NjIzJmNyb3A9/MQ",
  "https://imgs.search.brave.com/-UmbbONikD33Gozbe76SQ8NmKu9G4KFkZh7yxNUKVUQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJjYXZlLmNv/bS93cC93cDQ0ODU5/MzAuanBn",
  "https://imgs.search.brave.com/dxLmh36yD6ZxmtpzWONsFuKqPlFuIg3rfbqkkGhFED0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnl0/aW1nLmNvbS92aS9k/TnQxUVIxZWN1TS9t/YXhyZXNkZWZhdWx0/LmpwZw",
  "https://imgs.search.brave.com/dWjQDfCUgxJNI2-90lbfj5tkhgdavJ5B-QncdfbBiIY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZS5nYWxhLmRlLzIy/NjAwNjI4L3QvY3Iv/djEzL3c0ODAvcjEv/LS9iZXlvbmNlLWtu/b3dsZXMuanBn",
  "https://imgs.search.brave.com/FtxDngzLQNr3OS86HDHOP_a0FUWV-10oOFQLniMz_3M/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTQ2/MzI1MDAxNC9waG90/by9sb3MtYW5nZWxl/cy1jYWxpZm9ybmlh/LXRheWxvci1zd2lm/dC1hdHRlbmRzLXRo/ZS02NXRoLWdyYW1t/eS1hd2FyZHMtb24t/ZmVicnVhcnktMDUt/MjAyMy1pbi1sb3Mu/anBnP3M9NjEyeDYx/MiZ3PTAmaz0yMCZj/PWFIdHJEMU1FTE1y/SnpCd3ZYVmRhX1RI/UDBWRFpVV3Y2eGFn/X0dOV3NPQ2s9",
  "https://imgs.search.brave.com/GPMyrTZ-fOBEHscg18u67Mcw9kbIU89Y-mBZF-qEF6o/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS1jbGRucnkucy1u/YmNuZXdzLmNvbS9p/bWFnZS91cGxvYWQv/dF9maXQtNTYwdyxm/X2F1dG8scV9hdXRv/OmJlc3Qvcm9ja2Nt/cy8yMDIyLTA4LzIy/MDgwMi1jaHJpcy1i/cm93bi1qbS0xMzAx/LWMyMWQ0Ny5qcGc",
  "https://imgs.search.brave.com/76RGNfr_pmXgx9RW59vEQiJ_8XWxwIzDLCXzAqx3aso/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pY2hl/Zi5iYmNpLmNvLnVr/L25ld3MvNDgwL2Nw/c3Byb2RwYi81NDNF/L3Byb2R1Y3Rpb24v/XzEyNzQ2NjUxMl9n/ZXR0eWltYWdlcy0x/NDE0NTczMjEyXzk3/Ni5wbmcud2VicA",
  "https://imgs.search.brave.com/Axtp_1it2Aog8FdREdexA6DX4vsq5lhyqSeI4BqnqTQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9yb3Zp/bXVzaWMucm92aWNv/cnAuY29tL2ltYWdl/LmpwZz9jPWl5dGNl/NDRjTzVXcGhRV05X/WmJWdTlfTTY5X1VJ/OXJySlNWdldMMi15/QWc9JmY9NA",
  "https://imgs.search.brave.com/Gj15MpEVcjftlT5QXhUbICdgHBpgfK8e4towHjPdpm8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9l/L2U5L09tYWhfTGF5/X3BlcmZvcm1pbmdf/aW5fMjAyMy5qcGc",
  "https://imgs.search.brave.com/WS45MGRmyAiB07csp9mZgqtTHilD1I8VY-uWu1EjCP8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pMC53/cC5jb20vd3d3LmJp/b2dyYXBoeXdlYi5v/cmcvd3AtY29udGVu/dC91cGxvYWRzLzIw/MjIvMDkvVGVtcy1i/aW9ncmFwaHkuanBn/P3Jlc2l6ZT02OTQs/NDU1JnNzbD0x",
  "https://imgs.search.brave.com/sAbUbE1dXhO-DdAXnRkIb9A78D-LHpzJ6IWxWGD-UZA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9sYXN0/Zm0uZnJlZXRscy5m/YXN0bHkubmV0L2kv/dS8zMDB4MzAwLzA5/MThiOGUyYzgxMjFk/OWU0MjA0MGFhZmRm/YzA2MGQwLmpwZw",
  "https://imgs.search.brave.com/zVEFrplq_S8FhHq9IUV8CgJzzvGs_rs1MXMQSR37HLI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5waXRjaGZvcmsu/Y29tL3Bob3Rvcy82/MzQ3MDIwMTA0ZTg4/NzViNDEwMzY0N2Mv/MTY6OS93XzgwMCxo/XzQ1MCxjX2xpbWl0/L3N0b3JtenkuSlBH",
  "https://imgs.search.brave.com/0dIOB4GWpwh_sEUHhHSTQWRKacjqsToGJZhzJCCAMUc/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly94dHRy/YXdhdmUuY29tL3dw/LWNvbnRlbnQvdXBs/b2Fkcy8yMDIxLzA2/L1RvcC0xMC1CZXN0/LVVLLXJhcHBlcnMt/dG8td2F0Y2gtb3V0/LWZvci1pbi0yMDIx/LTEuanBn",
  "https://imgs.search.brave.com/ulJQt-NXZjAKN6O9NbF112F6zHakGabsmBlj_ro1YmY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/ZGF0b2Ntcy1hc3Nl/dHMuY29tLzE3NzQ2/LzE2ODk3ODg1MDYt/am9yZHktdWstcmFw/cGVycy5qcGc",
  "https://imgs.search.brave.com/EHUr0ywWWd2YEGJa8RJ6qih82138_pGCKWZZzaxHmps/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/ZGF0b2Ntcy1hc3Nl/dHMuY29tLzE3NzQ2/LzE2ODk3ODY3OTgt/c3RlcHotdWstcmFw/cGVycy5qcGc",
  "https://imgs.search.brave.com/8SRhY1dU35ApUtKrow1CC8z9vMbbwoGxpUKwnUKwYQw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tdXNp/Y3NzdGFyLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvMjAyMy8w/NC9KYXkxLmpwZw",
  "https://imgs.search.brave.com/skXGfvCqRSHq--OwE2dM0X8cEaIq3T46FNLerRn7xmc/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9sZWRn/ZXJub3RlLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvMjAyMC8w/NC9qYXktei5qcGc",
  "https://imgs.search.brave.com/piSjn4dgLdOCeT0LYKTJvi79iIyIOrsKEF0MZprzWnA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9sZWRn/ZXJub3RlLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvMjAyMi8w/NS9kcmFrZS1lMTY3/OTY2MTkzODk5MC53/ZWJw",
  "https://imgs.search.brave.com/XdPqkm46tvKaY-2cPQIq9oWQetZAB_7xTFXwR0PsPvk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9sZWRn/ZXJub3RlLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvMjAyMC8w/NC9saWwtd2F5bmUu/anBn",
  "https://imgs.search.brave.com/gDJFfc10u4gobkomlKbF_fDFLL_jz9mvf5hXzrYstKo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9sZWRn/ZXJub3RlLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvMjAyMC8w/NC9rZW5kcmljay1s/YW1hci5qcGc",
  "https://imgs.search.brave.com/yCp7k4O619wJdd7ePL8g7I8CKPEHR-QTSMCRoE2Ydnw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9sZWRn/ZXJub3RlLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvMjAyMy8w/My9Tbm9vcC1Eb2dn/LUNyb3BwZWQtU21h/bGwuanBn",

  // Add more image URLs as needed
];

const styles = `
  @keyframes float {
    0% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0); }
  }
`;
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
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      <style>{styles}</style>
      {/* Artist images background */}
      <div className="absolute inset-0 z-0">
        {artistImages.map((src, index) => {
          const size = ["w-12 h-12", "w-16 h-16", "w-20 h-20", "w-24 h-24"][
            index % 4
          ];
          const shape = index % 2 === 0 ? "rounded-full" : "rounded-lg";
          return (
            <div
              key={index}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `translate(-50%, -50%) rotate(${
                  Math.random() * 360
                }deg)`,
                animation: `float ${
                  Math.random() * 2 + 2
                }s ease-in-out infinite`,
              }}
            >
              <div
                className={`${shape} ${size} overflow-hidden shadow-lg transition-all duration-300 ease-in-out hover:scale-110 hover:z-10`}
              >
                <Image
                  src={src}
                  alt={`Artist ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Login card */}
      <Card className="w-full max-w-md relative z-20 bg-white/80 backdrop-blur-md shadow-xl">
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
            <Music2Icon className="h-16 w-16 sm:h-24 sm:w-24 text-primary animate-pulse" />
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
