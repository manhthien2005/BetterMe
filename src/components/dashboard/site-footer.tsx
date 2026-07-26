import { Github, Heart } from "lucide-react";

const GITHUB_URL = "https://github.com/manhthien2005";

/** The dashboard footer: a warm credit line with an embedded GitHub link. */
export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-wafer/70 pt-6">
      <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-sm font-semibold text-mauve">
        <span className="font-display font-bold text-plum">BetterMe</span>
        <span>© 2026</span>
        <span aria-hidden="true" className="text-wafer">
          ·
        </span>
        <span className="inline-flex items-center gap-1">
          Build with love
          <Heart aria-hidden="true" className="h-4 w-4 fill-sakura-deep text-sakura-deep" />
          by
        </span>
        <a
          aria-label="manhthien2005 on GitHub (opens in a new tab)"
          className="squishy inline-flex items-center gap-1 rounded-full border border-wafer bg-mochi px-2.5 py-1 font-bold text-matcha-deep shadow-mochi transition hover:bg-rice focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep focus-visible:ring-offset-2"
          href={GITHUB_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Github aria-hidden="true" className="h-4 w-4" />
          manhthien2005
        </a>
      </p>
    </footer>
  );
}
