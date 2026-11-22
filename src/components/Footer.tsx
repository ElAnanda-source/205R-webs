import type { SiteContent } from '../types/trading';

interface FooterProps {
  siteContent: SiteContent;
  onNavigate: (path: string) => void;
}

const FOOTER_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Trading System', path: '/system' },
  { label: 'Methodology', path: '/methodology' },
  { label: 'Performance', path: '/performance' },
  { label: 'Journal', path: '/journal' },
  { label: 'Contact', path: '/contact' },
];

export function Footer({ siteContent, onNavigate }: FooterProps) {
  return (
    <footer className="relative z-10 border-t border-[#168BFF]/15 bg-[#020305]">
      <div className="cyber-hairline-top opacity-45" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5 space-y-3">
            <p className="font-michroma text-sm tracking-[0.22em] text-[#EAF7FF]">
              205R — INDEPENDENT TRADING
            </p>
            <p className="font-inter text-sm leading-relaxed text-[#8194A9]">
              Independent Trading &amp; Market Research across XAUUSD, NASDAQ NQ Futures, and major Forex markets.
            </p>
            {siteContent.socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {siteContent.socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-michroma text-[11px] tracking-[0.12em] text-[#00E5FF] hover:text-[#EAF7FF]"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-7">
            <nav aria-label="Footer Navigation" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {FOOTER_LINKS.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.path);
                  }}
                  className="font-michroma flex min-h-9 items-center text-[11px] tracking-[0.12em] text-[#8194A9] transition-colors hover:text-[#00E5FF]"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="mt-8 border-t border-[#8194A9]/15 pt-5">
              <p className="font-inter text-xs leading-relaxed text-[#8194A9]">
                {siteContent.disclaimer}
              </p>
              <p className="font-inter mt-4 text-xs text-[#8194A9]/75">
                &copy; {new Date().getFullYear()} 205R Independent Trading &amp; Market Research. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
