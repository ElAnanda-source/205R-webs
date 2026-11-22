import { ArrowUpRight, Mail } from 'lucide-react';
import type { SiteContent } from '../types/trading';

interface ContactPageProps {
  siteContent: SiteContent;
}

export function ContactPage({ siteContent }: ContactPageProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16 space-y-10">
      <header className="border-b border-[#8194A9]/18 pb-8">
        <p className="font-michroma text-[10px] tracking-[0.2em] text-[#00E5FF]">
          205R OPERATIONS
        </p>
        <h1 className="cyber-page-h1 mt-3 text-[#EAF7FF]">
          CONTACT &amp; DISCLOSURE
        </h1>
        <p className="font-inter mt-3 max-w-2xl text-sm text-[#8194A9]">
          Direct research inquiries, analytical correspondence, and institutional communications regarding 205R market methodologies.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Executive Blackout Illuminated Contact Card */}
        <section
          aria-label="Direct Contact Channel"
          className="cyber-glass-signature rounded-2xl p-6 sm:p-8 lg:col-span-7 flex flex-col justify-between space-y-6"
        >
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#00E5FF]/55 bg-[#020305] shadow-[0_0_24px_-4px_rgba(0,229,255,0.45)]">
                <Mail className="h-5 w-5 text-[#00E5FF]" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <span className="font-michroma text-[10px] tracking-[0.2em] text-[#00E5FF]">
                  205R OFFICIAL DESK
                </span>
                <h2 className="font-michroma mt-1 text-base sm:text-lg tracking-[0.1em] text-[#EAF7FF]">
                  DIRECT ELECTRONIC MAIL
                </h2>
              </div>
            </div>

            <dl className="mt-6 space-y-5 border-t border-[#8194A9]/15 pt-5">
              <div>
                <dt className="font-inter text-xs text-[#8194A9]">Research Desk Address</dt>
                <dd className="font-michroma neon-metric mt-1.5 text-sm sm:text-base text-[#00E5FF] break-all">
                  {siteContent.contactEmail}
                </dd>
              </div>

              <div>
                <dt className="font-inter text-xs text-[#8194A9]">Operational Status</dt>
                <dd className="font-inter mt-1 text-sm text-[#EAF7FF]">
                  {siteContent.contactLocation}
                </dd>
              </div>

              {siteContent.socialLinks.length > 0 && (
                <div>
                  <dt className="font-inter text-xs text-[#8194A9]">Official Channels</dt>
                  <dd className="mt-2 flex flex-wrap gap-3">
                    {siteContent.socialLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-michroma inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#8194A9]/22 bg-[#020305] px-3 py-1.5 text-[11px] text-[#00E5FF] hover:border-[#00E5FF] hover:text-[#EAF7FF]"
                      >
                        {link.label}
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="pt-2">
            <a
              href={`mailto:${siteContent.contactEmail}`}
              className="font-michroma inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl border border-[#00E5FF] bg-[#00E5FF]/14 px-6 py-3 text-xs tracking-[0.12em] text-[#EAF7FF] transition-all hover:bg-[#00E5FF] hover:text-[#020305] shadow-[0_0_28px_-8px_rgba(0,229,255,0.55)]"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              EMAIL 205R DESK
            </a>
          </div>
        </section>

        {/* Risk Disclaimer Column */}
        <section
          aria-label="Official Risk Disclaimer"
          className="cyber-surface-dark rounded-2xl p-6 sm:p-8 lg:col-span-5 flex flex-col justify-between"
        >
          <div>
            <p className="font-michroma text-[10px] tracking-[0.18em] text-[#168BFF]">
              COMPLIANCE &amp; NOTICE
            </p>
            <h2 className="font-michroma mt-2 text-sm sm:text-base tracking-[0.1em] text-[#EAF7FF]">
              RISK DISCLAIMER
            </h2>
            <p className="font-inter mt-4 text-sm leading-relaxed text-[#8194A9]">
              {siteContent.disclaimer}
            </p>
          </div>

          <p className="font-inter mt-6 border-t border-[#8194A9]/15 pt-4 text-xs text-[#8194A9]/80">
            205R does not offer investment advisory services, managed accounts, or guaranteed performance outcomes.
          </p>
        </section>
      </div>
    </div>
  );
}
