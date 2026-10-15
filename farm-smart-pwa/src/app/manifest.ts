import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SinchAI — Smart Irrigation",
    short_name: "SinchAI",
    description: "SinchAI helps farmers plan irrigation and monitor field conditions.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#15803D",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
