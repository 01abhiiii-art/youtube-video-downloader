import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { return ["", "/how-it-works", "/supported-formats", "/faq", "/about", "/contact", "/privacy", "/terms"].map(path => ({ url: `https://clipfetch.in${path}`, lastModified: new Date() })); }
