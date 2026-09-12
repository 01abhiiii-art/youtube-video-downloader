import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
export const metadata: Metadata = { title: "Terms | ClipFetch", description: "Read the terms for using ClipFetch with public YouTube content you are authorized to save.", alternates: { canonical: "https://clipfetch.in/terms" } };
export default function Page() { return <InfoPage title="Terms" intro="Use ClipFetch responsibly and only with public YouTube content you’re authorized to access and save."><p className="leading-8 text-ink/70">You are responsible for complying with applicable laws, YouTube’s terms, and rights holders’ requests. Private, authenticated, and DRM-protected videos are not supported.</p></InfoPage>; }
