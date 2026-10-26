import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LevelUP",
    short_name: "LevelUP",
    description: "LevelUP — The Jeremiah Generation",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#b3202a",
    theme_color: "#b3202a",
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
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
