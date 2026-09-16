import type { MetadataRoute } from "next";
const SITE_URL = "https://clipfetch.in";
const paths = ["/", "/how-it-works/", "/supported-formats/", "/faq/", "/about/", "/contact/", "/privacy/", "/terms/"];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({ url: `${SITE_URL}${path}` }));
}
