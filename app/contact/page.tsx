import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
export const metadata: Metadata = { title: "Contact ClipFetch", description: "Contact the ClipFetch team about the YouTube-only downloader.", alternates: { canonical: "https://clipfetch.in/contact" } };
export default function Page() { return <InfoPage title="Contact" intro="Have a question, accessibility note, or partnership idea? We’d love to hear from you."><a href="mailto:hello@clipfetch.in" className="inline-flex rounded-full bg-ink px-5 py-3 font-bold text-white hover:bg-emerald-800">hello@clipfetch.in</a><p className="mt-6 text-sm text-ink/50">For production deployments, replace this address with your support channel.</p></InfoPage>; }
