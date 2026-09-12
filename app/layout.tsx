import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://clipfetch.in"),
  title: { default: "ClipFetch — YouTube downloads, clearly.", template: "%s · ClipFetch" },
  description: "A privacy-minded YouTube format analyzer and downloader for public videos.",
  keywords: ["YouTube downloader", "YouTube video download", "ClipFetch", "YouTube formats"],
  openGraph: { title: "ClipFetch — YouTube downloads, clearly.", description: "Analyze public YouTube videos and choose an available format.", url: "https://clipfetch.in", siteName: "ClipFetch", type: "website" },
  robots: { index: true, follow: true }
};

const links = [["How it works", "/how-it-works"], ["YouTube formats", "/supported-formats"], ["FAQ", "/faq"], ["About", "/about"]] as const;
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <header className="border-b border-ink/10 bg-cream/90 backdrop-blur sticky top-0 z-20"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
      <Link href="/" className="text-xl font-black tracking-tight">clip<span className="text-emerald-600">fetch</span><span className="text-xs align-top text-emerald-600">.in</span></Link>
      <nav className="hidden items-center gap-7 text-sm font-medium md:flex">{links.map(([label, href]) => <Link className="transition hover:text-emerald-700" href={href} key={href}>{label}</Link>)}<Link href="/contact" className="rounded-full bg-ink px-4 py-2 text-cream transition hover:bg-emerald-800">Contact</Link></nav>
      <Link href="/#analyze" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream md:hidden">Analyze</Link>
    </div></header>
    <main>{children}</main>
    <footer className="border-t border-ink/10 bg-white"><div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-10 text-sm text-ink/65 md:flex-row md:items-center md:justify-between"><p>© {new Date().getFullYear()} ClipFetch.in. Built for clarity.</p><div className="flex flex-wrap gap-5"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></div></div></footer>
  </body></html>;
}
