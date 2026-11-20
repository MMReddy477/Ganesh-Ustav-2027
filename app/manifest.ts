import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ganesh Utsav 2027 · Suryodaya Colony",
    short_name: "Utsav 2027",
    description: "Celebrating faith, culture and community in Suryodaya Colony, Hyderabad.",
    start_url: "/",
    display: "standalone",
    background_color: "#4b1714",
    theme_color: "#4b1714",
    orientation: "portrait-primary",
    icons: [{ src: "/images/ganesh-logo.png", sizes: "192x192", type: "image/png", purpose: "any" }],
  };
}
