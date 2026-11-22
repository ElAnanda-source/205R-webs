import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MethodologyDiagram } from '../components/MethodologyVisuals';
import type { MethodologyContent, SiteContent } from '../types/trading';

interface MethodologyPageProps {
  siteContent: SiteContent;
}

export function MethodologyPage({ siteContent }: MethodologyPageProps) {
  const [expandedId, setExpandedId] = useState<string | null>('ALCHEMIST');

  const toggle = (item: MethodologyContent) => {
    setExpandedId((prev) => (prev === item.id ? null : item.id));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="max-w-3xl border-b border-[#8194A9]/18 pb-8">
        <p className="font-michroma text-[10px] tracking-[0.2em] text-[#00E5FF]">
          ANALYTICAL DISCIPLINES
        </p>
        <h1 className="cyber-page-h1 mt-3 text-[#EAF7FF]">
          THE SIX PILLARS OF 205R
        </h1>
        <p className="font-inter mt-4 text-sm sm:text-base leading-relaxed text-[#8194A9]">
          Six complementary market frameworks operated as one unified decision hierarchy. Select any pillar below to inspect its structural focus.
        </p>
      </header>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {siteContent.methodologies.map((pillar) => {
          const isOpen = expandedId === pillar.id;
          return (
            <article
              key={pillar.id}
              className={`group flex flex-col justify-between rounded-2xl p-6 cyber-interactive ${
                pillar.isSignature ? 'cyber-glass-signature' : 'cyber-glass'
              }`}
            >
              <div>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="font-michroma text-xs tracking-[0.14em] text-[#00E5FF]">
                    {pillar.number} — {pillar.name}
                  </span>
                  {pillar.isSignature && (
                    <span className="font-michroma text-[10px] tracking-[0.14em] text-[#EAF7FF]">
                      205R SIGNATURE
                    </span>
                  )}
                </div>

                <MethodologyDiagram id={pillar.id} />

                <h2 className="font-michroma mt-5 text-base tracking-[0.08em] text-[#EAF7FF]">
                  {pillar.name}
                </h2>
                <p className="font-inter mt-1 text-xs font-medium text-[#EAF7FF]/85">
                  {pillar.subtitle}
                </p>
                <p className="font-inter mt-3 text-sm leading-relaxed text-[#8194A9]">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-5 border-t border-[#8194A9]/15 pt-3">
                <button
                  type="button"
                  onClick={() => toggle(pillar)}
                  aria-expanded={isOpen}
                  className="font-michroma flex min-h-11 w-full items-center justify-between text-left text-[11px] tracking-[0.12em] text-[#8194A9] hover:text-[#00E5FF]"
                >
                  <span>{isOpen ? 'HIDE FOCUS STRUCTURE' : 'INSPECT FOCUS STRUCTURE'}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                </button>

                {isOpen && (
                  <ul className="mt-2 space-y-2 border-t border-[#8194A9]/15 pt-3 font-inter text-xs text-[#EAF7FF]/90">
                    {pillar.focusPoints.map((pt) => (
                      <li key={pt} className="flex items-start gap-2">
                        <span className="text-[#00E5FF]">·</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
