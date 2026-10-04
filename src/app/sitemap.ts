import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: [string, number][] = [
    ["/", 1],
    ["/pricing", 0.9],
    ["/portfolio", 0.8],
    ["/pro", 0.8],
    ["/estimate", 0.7],
    ["/register", 0.5],
    ["/legal/privacy", 0.2],
    ["/legal/terms", 0.2],
    ["/legal/refund", 0.2],
    ["/legal/cookies", 0.2],
  ];
  return routes.map(([path, priority]) => ({ url: appUrl(path), lastModified: now, changeFrequency: "weekly", priority }));
}
