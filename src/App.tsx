import { useCallback, useEffect, useRef, useState } from 'react';
import { CyberRainCanvas } from './components/CyberRainCanvas';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { PageTransitionOverlay, type TransitionPhase } from './components/PageTransition';
import { AboutPage } from './pages/AboutPage';
import { AdminPage } from './pages/AdminPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { JournalPage } from './pages/JournalPage';
import { LoginPage } from './pages/LoginPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { PerformancePage } from './pages/PerformancePage';
import { SystemPage } from './pages/SystemPage';
import type { AuthStatus } from './types/trading';
import { api, type PortfolioPayload } from './utils/api';

const DEFAULT_AUTH: AuthStatus = {
  authenticated: false,
  requiresSetup: false,
  envPinConfigured: false,
  isLocked: false,
  failedAttempts: 0,
  maxAttempts: 3,
  attemptsRemaining: 3,
};

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const cleaned = pathname.replace(/\/+$/, '');
  return cleaned || '/';
}

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() =>
    normalizePath(window.location.pathname)
  );
  const [portfolio, setPortfolio] = useState<PortfolioPayload | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(DEFAULT_AUTH);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>('idle');

  const currentPathRef = useRef<string>(currentPath);
  currentPathRef.current = currentPath;

  const exitTimerRef = useRef<number | null>(null);
  const enterTimerRef = useRef<number | null>(null);

  const clearTransitionTimers = useCallback(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (enterTimerRef.current !== null) {
      window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
  }, []);

  const runTransitionTo = useCallback(
    (nextPath: string, pushHistory: boolean) => {
      const normalized = normalizePath(nextPath);
      if (
        normalized === currentPathRef.current &&
        normalized === normalizePath(window.location.pathname)
      ) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      clearTransitionTimers();

      if (prefersReducedMotion) {
        if (pushHistory && normalized !== window.location.pathname) {
          window.history.pushState({}, '', normalized);
        }
        setCurrentPath(normalized);
        setTransitionPhase('idle');
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }

      setTransitionPhase('exiting');

      exitTimerRef.current = window.setTimeout(() => {
        exitTimerRef.current = null;
        if (pushHistory && normalized !== window.location.pathname) {
          window.history.pushState({}, '', normalized);
        }
        setCurrentPath(normalized);
        window.scrollTo({ top: 0, behavior: 'auto' });
        setTransitionPhase('entering');

        enterTimerRef.current = window.setTimeout(() => {
          enterTimerRef.current = null;
          setTransitionPhase('idle');
        }, 380);
      }, 220);
    },
    [clearTransitionTimers]
  );

  const navigate = useCallback(
    (targetPath: string) => {
      runTransitionTo(targetPath, true);
    },
    [runTransitionTo]
  );

  useEffect(() => {
    const onPopState = () => {
      runTransitionTo(window.location.pathname, false);
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [runTransitionTo]);

  useEffect(() => clearTransitionTimers, [clearTransitionTimers]);

  const refreshPortfolio = useCallback(async () => {
    const data = await api.getPortfolio();
    setPortfolio(data);
  }, []);

  const refreshAuthStatus = useCallback(async () => {
    const status = await api.getAuthStatus();
    setAuthStatus(status);
    return status;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [port, auth] = await Promise.all([api.getPortfolio(), api.getAuthStatus()]);
        if (!active) return;
        setPortfolio(port);
        setAuthStatus(auth);
      } catch (err) {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Unable to connect to 205R server.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loading && currentPath.startsWith('/admin') && !authStatus.authenticated) {
      navigate('/login');
    }
  }, [loading, currentPath, authStatus.authenticated, navigate]);

  const handleAuthSuccess = async () => {
    await Promise.all([refreshAuthStatus(), refreshPortfolio()]);
    navigate('/admin');
  };

  const handleLogout = async () => {
    await api.logout();
    await Promise.all([refreshAuthStatus(), refreshPortfolio()]);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020305] text-[#EAF7FF]">
        <div className="text-center space-y-3">
          <p className="font-michroma text-lg tracking-[0.26em] text-[#00E5FF] neon-primary">205R</p>
          <p className="font-inter text-xs text-[#8194A9]">Initializing Blackout Neo-Cyber Terminal...</p>
        </div>
      </div>
    );
  }

  if (loadError || !portfolio) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020305] px-4 text-center">
        <div className="cyber-glass max-w-md rounded-xl p-6">
          <h1 className="font-michroma text-base text-[#EAF7FF]">TERMINAL UNAVAILABLE</h1>
          <p className="mt-2 text-xs text-[#8194A9]">{loadError || 'Database offline.'}</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    if (currentPath === '/') {
      return (
        <HomePage
          authenticated={portfolio.authenticated}
          siteContent={portfolio.siteContent}
          performance={portfolio.performance}
          publicSummary={portfolio.publicSummary}
          currency={portfolio.currency}
          onNavigate={navigate}
        />
      );
    }
    if (currentPath === '/about') {
      return <AboutPage siteContent={portfolio.siteContent} onNavigate={navigate} />;
    }
    if (currentPath === '/system') {
      return (
        <SystemPage
          siteContent={portfolio.siteContent}
          riskParameters={portfolio.riskParameters}
        />
      );
    }
    if (currentPath === '/methodology') {
      return <MethodologyPage siteContent={portfolio.siteContent} />;
    }
    if (currentPath === '/performance') {
      return (
        <PerformancePage
          authenticated={portfolio.authenticated}
          performance={portfolio.performance}
          account={portfolio.account}
          transactions={portfolio.transactions}
          publicSummary={portfolio.publicSummary}
          onNavigateLogin={() => navigate('/login')}
        />
      );
    }
    if (currentPath === '/journal') {
      return (
        <JournalPage
          authenticated={portfolio.authenticated}
          transactions={portfolio.transactions}
          currency={portfolio.currency}
          onNavigateLogin={() => navigate('/login')}
        />
      );
    }
    if (currentPath === '/contact') {
      return <ContactPage siteContent={portfolio.siteContent} />;
    }
    if (currentPath === '/login') {
      if (authStatus.authenticated) {
        return (
          <AdminPage
            authStatus={authStatus}
            onRefreshPublic={refreshPortfolio}
            onLogout={handleLogout}
          />
        );
      }
      return (
        <LoginPage
          authStatus={authStatus}
          onAuthSuccess={handleAuthSuccess}
          onRefreshStatus={async () => {
            await refreshAuthStatus();
          }}
        />
      );
    }
    if (currentPath.startsWith('/admin')) {
      if (!authStatus.authenticated) {
        return (
          <LoginPage
            authStatus={authStatus}
            onAuthSuccess={handleAuthSuccess}
            onRefreshStatus={async () => {
              await refreshAuthStatus();
            }}
          />
        );
      }
      return (
        <AdminPage
          authStatus={authStatus}
          onRefreshPublic={refreshPortfolio}
          onLogout={handleLogout}
        />
      );
    }

    return (
      <HomePage
        authenticated={portfolio.authenticated}
        siteContent={portfolio.siteContent}
        performance={portfolio.performance}
        publicSummary={portfolio.publicSummary}
        currency={portfolio.currency}
        onNavigate={navigate}
      />
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#020305] text-[#EAF7FF]">
      {currentPath !== '/' && (
        <CyberRainCanvas
          intensity="subtle"
          className="fixed inset-0 z-0 h-full w-full opacity-55"
        />
      )}

      <Navbar
        currentPath={currentPath}
        onNavigate={navigate}
        isOwnerAuthenticated={authStatus.authenticated}
      />

      <main
        key={currentPath}
        className={`relative z-10 flex-1 transition-all duration-200 ${
          transitionPhase === 'exiting'
            ? 'opacity-15 scale-[0.992]'
            : transitionPhase === 'entering'
              ? 'cyber-page-enter'
              : 'opacity-100'
        }`}
      >
        {renderPage()}
      </main>

      <Footer siteContent={portfolio.siteContent} onNavigate={navigate} />

      <PageTransitionOverlay phase={transitionPhase} />
    </div>
  );
}
