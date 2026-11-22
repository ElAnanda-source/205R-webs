import { useState } from 'react';
import { Lock, Menu, ShieldCheck, X } from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'HOME', path: '/' },
  { label: 'ABOUT', path: '/about' },
  { label: 'TRADING SYSTEM', path: '/system' },
  { label: 'METHODOLOGY', path: '/methodology' },
  { label: 'PERFORMANCE', path: '/performance' },
  { label: 'JOURNAL', path: '/journal' },
  { label: 'CONTACT', path: '/contact' },
];

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOwnerAuthenticated: boolean;
}

export function Navbar({ currentPath, onNavigate, isOwnerAuthenticated }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (path: string) => {
    setMobileOpen(false);
    onNavigate(path);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#168BFF]/18 bg-[#020305]/90 backdrop-blur-xl">
      <div className="cyber-hairline-top opacity-70" aria-hidden="true" />
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('/');
          }}
          className="font-michroma text-base tracking-[0.26em] text-[#EAF7FF] transition-colors hover:text-[#00E5FF] whitespace-nowrap shrink-0"
        >
          205R
        </a>

        {/* Zone 2: Primary Desktop Navigation */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-5 xl:gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              item.path === '/'
                ? currentPath === '/'
                : currentPath.startsWith(item.path);
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.path);
                }}
                className={`font-michroma text-[11px] tracking-[0.15em] py-1.5 transition-all whitespace-nowrap shrink-0 border-b ${
                  active
                    ? 'border-[#00E5FF] text-[#00E5FF]'
                    : 'border-transparent text-[#8194A9] hover:text-[#EAF7FF] hover:border-[#168BFF]/60'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Discreet Owner Access + Mobile Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick(isOwnerAuthenticated ? '/admin' : '/login')}
            aria-label={isOwnerAuthenticated ? 'Open Owner Admin Dashboard' : 'Owner Login'}
            title={isOwnerAuthenticated ? 'Owner Admin Dashboard' : 'Owner Login'}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-md border transition-all focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
              currentPath.startsWith('/admin') || currentPath === '/login'
                ? 'border-[#00E5FF]/70 bg-[#090F18] text-[#00E5FF] shadow-[0_0_16px_-4px_rgba(0,229,255,0.45)]'
                : isOwnerAuthenticated
                  ? 'border-[#168BFF]/45 bg-[#090F18] text-[#00E5FF] hover:border-[#00E5FF]'
                  : 'border-[#8194A9]/25 bg-[#05080D] text-[#8194A9] hover:border-[#168BFF]/60 hover:text-[#EAF7FF]'
            }`}
          >
            {isOwnerAuthenticated ? (
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Lock className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#8194A9]/25 bg-[#05080D] text-[#EAF7FF] transition-colors hover:border-[#00E5FF]/60 hover:text-[#00E5FF] lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="border-t border-[#168BFF]/20 bg-[#020305]/98 px-4 py-4 backdrop-blur-xl lg:hidden"
        >
          <div className="flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active =
                item.path === '/'
                  ? currentPath === '/'
                  : currentPath.startsWith(item.path);
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.path);
                  }}
                  className={`font-michroma flex min-h-11 items-center justify-between rounded-md px-3.5 text-xs tracking-[0.14em] transition-all ${
                    active
                      ? 'border border-[#00E5FF]/40 bg-[#090F18] text-[#00E5FF]'
                      : 'text-[#8194A9] hover:bg-[#090F18]/70 hover:text-[#EAF7FF]'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF]" aria-hidden="true" />}
                </a>
              );
            })}
            <a
              href={isOwnerAuthenticated ? '/admin' : '/login'}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(isOwnerAuthenticated ? '/admin' : '/login');
              }}
              className="font-michroma mt-2 flex min-h-11 items-center gap-2.5 rounded-md border border-[#168BFF]/25 bg-[#05080D] px-3.5 text-xs tracking-[0.14em] text-[#8194A9] hover:border-[#00E5FF]/50 hover:text-[#00E5FF]"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              {isOwnerAuthenticated ? 'OWNER ADMIN' : 'OWNER LOGIN'}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
