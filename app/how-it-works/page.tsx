import { Link as LinkIcon, Search, Download } from "lucide-react";
import InfoPage from "@/components/InfoPage";
const steps = [
  { icon: LinkIcon, number: "01", title: "Paste YouTube", description: "Start with a public watch, Shorts, embed, or youtu.be URL you’re allowed to use." },
  { icon: Search, number: "02", title: "Analyze", description: "yt-dlp checks the public YouTube video and reports the formats available." },
  { icon: Download, number: "03", title: "Choose", description: "Pick one of the formats found for that video and download it through the configured API." }
];
export default function Page() { return <InfoPage title="How it works" intro="A small, transparent YouTube-only workflow. No mystery buttons, no pretending a download happened."><div className="grid gap-5 md:grid-cols-3">{steps.map(({ icon: Icon, number, title, description }) => <div className="rounded-2xl border border-ink/10 bg-white p-6" key={number}><Icon className="text-emerald-600" /><b className="mt-8 block text-xs text-ink/40">{number}</b><h2 className="mt-2 text-xl font-bold">{title}</h2><p className="mt-2 leading-7 text-ink/60">{description}</p></div>)}</div></InfoPage>; }
