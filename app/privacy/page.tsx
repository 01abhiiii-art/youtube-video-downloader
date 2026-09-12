import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
export const metadata: Metadata = { title: "Privacy | ClipFetch", description: "Read the ClipFetch privacy information for public YouTube URL analysis and downloads.", alternates: { canonical: "https://clipfetch.in/privacy" } };
export default function Page() { return <InfoPage title="Privacy" intro="This app does not include analytics, accounts, or frontend link history."><p className="leading-8 text-ink/70">The configured backend receives public YouTube URLs for analysis or download. Document retention, logging, cookies, and subprocessors in your deployment’s privacy notice. Do not send private, authenticated, or sensitive links.</p></InfoPage>; }
