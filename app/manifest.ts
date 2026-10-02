import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { themes } from "@/config/themes";
import { assetPath } from "@/lib/urls";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const theme = themes[siteConfig.theme.preset];
  return {
    name: siteConfig.siteName,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: assetPath("/"),
    display: "standalone",
    background_color: siteConfig.theme.background ?? `hsl(${theme?.tokens.background ?? "226 49% 8%"})`,
    theme_color: siteConfig.theme.accent ?? `hsl(${theme?.tokens.primary ?? "25 95% 53%"})`,
    icons: [{ src: assetPath(siteConfig.assets.logo), sizes: "any", type: "image/webp" }],
  };
}
