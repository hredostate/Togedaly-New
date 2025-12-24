
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from './supabaseClient';
import { SWRConfig } from 'swr';
import { idbCache } from './lib/swr-idb-cache';
import { AnimatePresence } from 'framer-motion';

// Components
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import { ToastHost, useToasts } from './components/ToastHost';
import Footer from './components/Footer';
import NotificationsTray from './components/NotificationsTray'; // Replaced InboxWidget
import PageMotion from './components/motion/PageMotion';
import { ToastProvider as SimpleToastProvider } from './components/useToast';
import { PinProvider } from './components/security/PinContext';
import { SettingsProvider } from './components/SettingsContext';
import ChatWidget from './components/chat/ChatWidget';
import AIToast from './components/ai/AIToast';
import PwaInstallBanner from './components/PwaInstallBanner';
import { TourProvider } from './components/onboarding/TourContext';
import { TourOverlay } from './components/onboarding/TourOverlay';
import { Confetti } from './components/ui/Confetti';
import { CommandPalette } from './components/ui/CommandPalette';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/ui/LoadingScreen';

// Lazy Loaded Pages to improve initial load performance
const Landing = lazy(() => import('./pages/Landing'));
const Explore = lazy(() => import('./pages/Explore'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Wallet = lazy(() => import('./pages/Wallet'));
const MyStanding = lazy(() => import('./pages/MyStanding'));
const Security = lazy(() => import('./pages/Security'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Auth = lazy(() => import('./pages/Auth'));
const Admin = lazy(() => import('./pages/Admin'));
const Kyc = lazy(() => import('./pages/Kyc'));
const PoolDetails = lazy(() => import('./pages/PoolDetails'));
const VentureDetails = lazy(() => import('./pages/VentureDetails'));
const Legal = lazy(() => import('./pages/Legal'));
const AjoHealth = lazy(() => import('./pages/AjoHealth'));
const AjoGroupDetail = lazy(() => import('./pages/AjoGroupDetail'));
const AjoMemberDetail = lazy(() => import('./pages/AjoMemberDetail'));
const TtfLeaderboard = lazy(() => import('./pages/TtfLeaderboard'));
const TemplateManager = lazy(() => import('./pages/TemplateManager'));
const Status = lazy(() => import('./pages/Status'));
const Ops = lazy(() => import('./pages/Ops'));
const Treasury = lazy(() => import('./pages/Treasury'));
const PoolHealth = lazy(() => import('./pages/PoolHealth'));
const Disbursements = lazy(() => import('./pages/RotationPayouts'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const GroupBuys = lazy(() => import('./pages/GroupBuys'));
const Settlements = lazy(() => import('./pages/Settlements'));
const CycleRotationPage = lazy(() => import('./pages/CycleRotation'));
const ReconciliationPage = lazy(() => import('./pages/Reconciliation'));
const DataBI = lazy(() => import('./pages/DataBI'));
const LoanRequest = lazy(() => import('./pages/LoanRequest'));
const Owambe = lazy(() => import('./pages/Owambe'));
const Disputes = lazy(() => import('./pages/Disputes'));
const OrgDashboardPage = lazy(() => import('./pages/admin/OrgDashboardPage'));


// Types
import type { PoolTP, LegalDocType, LegacyPool } from './types';
import { getPoolWithDetails, getLegacyPoolById } from './services/poolService';
import { useNudges } from './hooks/useNudges';

export type Page = 
  'landing' | 'explore' | 'dashboard' | 'wallet' | 'standing' | 'security' | 'notifications' | 'auth' | 
  'admin' | 'kyc' | 'poolDetails' | 'ventureDetails' | 'legal' | 'ajoHealth' | 'ajoGroupDetail' | 'ajoMemberDetail' | 
  'ttfLeaderboard' | 'templateManager' | 'ops' | 'status' | 'treasury' | 'poolHealth' | 'rotationPayouts' | 'suppliers' | 'groupbuys' | 'settlements' | 'cycleRotation' | 'reconciliation' | 'dataBI' | 'loanRequest' | 'owambe' | 'disputes' | 'orgDashboard';

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('landing');
    const [pageContext, setPageContext] = useState<any>(null);
    const [user, setUser] = useState<any | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isTrayOpen, setIsTrayOpen] = useState(false); // Changed from isInboxOpen
    const [loadingPage, setLoadingPage] = useState(false);
    const { add: addToast } = useToasts();
    const { toast: nudgeToast } = useNudges(user?.id);
    const [cmdOpen, setCmdOpen] = useState(false);


    useEffect(() => {
        // Supabase v2 Auth State Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                setIsAdmin(session.user.email?.endsWith('@togedaly.com') ?? false);
                if (page === 'landing' || page === 'auth') {
                    handleSetPage('dashboard');
                }
            } else {
                setIsAdmin(false);
                if (page !== 'poolDetails' && page !== 'ventureDetails') { // Allow staying on details if shared
                    handleSetPage('landing');
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Deep Link Handling (Share URL)
    useEffect(() => {
        const handleDeepLink = async () => {
            const params = new URLSearchParams(window.location.search);
            const shareId = params.get('share');
            if (shareId) {
                setLoadingPage(true);
                // Attempt to find as Ajo Pool first
                let poolData = await getPoolWithDetails(shareId, user?.id || null);
                
                if (poolData) {
                    setPageContext({ poolData });
                    setPage('poolDetails');
                } else {
                    // Try as Legacy/Venture
                    const legacyPool = await getLegacyPoolById(shareId);
                    if (legacyPool) {
                        setPageContext({ pool: legacyPool });
                        setPage('ventureDetails');
                    } else {
                        addToast({ title: 'Not Found', desc: 'The shared link is invalid or expired.', emoji: '🚫' });
                    }
                }
                setLoadingPage(false);
                // Clean URL
                window.history.replaceState({}, '', '/');
            }
        };
        handleDeepLink();
    }, [user, addToast]); // Depend on user to re-fetch with auth details if login happens

    // Global Keyboard Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCmdOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSetPage = useCallback((newPage: Page, context?: any) => {
        setPage(newPage);
        setPageContext(context);
        window.scrollTo(0, 0);
    }, []);
    
    const handleLogout = async () => {
        await supabase.auth.signOut();
        handleSetPage('landing');
    };

    // Data fetching for pages that need it
    useEffect(() => {
        const fetchPoolDetails = async (pool: PoolTP, userId: string) => {
            setLoadingPage(true);
            try {
                const details = await getPoolWithDetails(pool.id, userId);
                if (details) {
                    setPageContext({ poolData: details });
                } else {
                    addToast({ title: "Error", desc: "Could not load pool details.", emoji: "😥" });
                    handleSetPage('explore');
                }
            } catch (e: any) {
                addToast({ title: "Error", desc: e.message, emoji: "😥" });
                handleSetPage('explore');
            } finally {
                setLoadingPage(false);
            }
        };

        if (page === 'poolDetails' && pageContext?.pool && user) {
            fetchPoolDetails(pageContext.pool, user.id);
        }
    }, [page, pageContext?.pool, user, addToast, handleSetPage]);


    const renderPage = () => {
        if (loadingPage) {
            return <LoadingScreen />;
        }
        
        switch (page) {
            case 'landing': return <Landing setPage={handleSetPage} />;
            case 'explore': return <Explore setPage={handleSetPage} filter={pageContext?.filter} onPoolClick={(pool, type) => handleSetPage(type === 'ajo' ? 'poolDetails' : 'ventureDetails', { pool })} />;
            case 'dashboard': return <Dashboard setPage={handleSetPage} />;
            case 'wallet': return <Wallet />;
            case 'standing': return <MyStanding setPage={handleSetPage} />;
            case 'security': return <Security setPage={handleSetPage} />;
            case 'notifications': return <Notifications setPage={handleSetPage} />;
            case 'auth': return <Auth />;
            case 'admin': return <Admin setPage={handleSetPage} />;
            case 'kyc': return <Kyc setPage={handleSetPage} />;
            case 'poolDetails':
                return pageContext?.poolData ? <PoolDetails poolData={pageContext.poolData} onBack={() => handleSetPage('explore')} isAuthenticated={!!user} setPage={handleSetPage} /> : <LoadingScreen />;
            case 'ventureDetails':
                return pageContext?.pool ? <VentureDetails pool={pageContext.pool as LegacyPool} onBack={() => handleSetPage('explore')} isAuthenticated={!!user} setPage={handleSetPage} /> : <LoadingScreen />;
            case 'legal': return <Legal doc={pageContext.doc as LegalDocType} setPage={handleSetPage} />;
            case 'ajoHealth': return <AjoHealth setPage={handleSetPage} />;
            case 'ajoGroupDetail': return <AjoGroupDetail group={pageContext.group} setPage={handleSetPage} />;
            case 'ajoMemberDetail': return <AjoMemberDetail member={pageContext.member} setPage={handleSetPage} />;
            case 'ttfLeaderboard': return <TtfLeaderboard setPage={handleSetPage} />;
            case 'templateManager': return <TemplateManager setPage={handleSetPage} />;
            case 'status': return <Status />;
            case 'ops': return <Ops setPage={handleSetPage} />;
            case 'treasury': return <Treasury setPage={handleSetPage} poolId={pageContext?.poolId} orgId={pageContext?.orgId} />;
            case 'poolHealth': return <PoolHealth setPage={handleSetPage} />;
            case 'rotationPayouts': return <Disbursements setPage={handleSetPage} />;
            case 'suppliers': return <Suppliers setPage={handleSetPage} />;
            case 'groupbuys': return <GroupBuys setPage={handleSetPage} />;
            case 'settlements': return <Settlements setPage={handleSetPage} />;
            case 'cycleRotation': return <CycleRotationPage setPage={handleSetPage} poolId={pageContext?.poolId} cycleId={pageContext?.cycleId} />;
            case 'reconciliation': return <ReconciliationPage orgId={pageContext?.orgId || '1'} setPage={handleSetPage} />;
            case 'dataBI': return <DataBI setPage={handleSetPage} />;
            case 'loanRequest': return <LoanRequest setPage={handleSetPage} />;
            case 'owambe': return <Owambe setPage={handleSetPage} />;
            case 'disputes': return <Disputes setPage={handleSetPage} />;
            case 'orgDashboard': return <OrgDashboardPage setPage={handleSetPage} orgId={pageContext?.orgId} />;
            default: return <Landing setPage={handleSetPage} />;
        }
    };
    
    return (
        <div className="bg-slate-50 min-h-screen text-gray-900 font-sans flex flex-col">
            <Navbar 
                setPage={handleSetPage} 
                isAuthenticated={!!user} 
                isAdmin={isAdmin}
                onLogout={handleLogout}
                onInboxToggle={() => setIsTrayOpen(!isTrayOpen)}
            />
            {/* Add bottom padding for mobile nav */}
            <main className="max-w-6xl mx-auto px-4 py-6 flex-grow w-full pb-24 md:pb-6">
                <ErrorBoundary>
                    <Suspense fallback={<LoadingScreen />}>
                        <AnimatePresence mode="wait">
                            <PageMotion key={page}>
                               {renderPage()}
                            </PageMotion>
                        </AnimatePresence>
                    </Suspense>
                </ErrorBoundary>
            </main>
            <Footer setPage={(doc) => handleSetPage('legal', { doc })} setStatusPage={() => handleSetPage('status')} />
            
            {!!user && (
                <MobileNav setPage={handleSetPage} activePage={page} />
            )}

            <NotificationsTray isOpen={isTrayOpen} onClose={() => setIsTrayOpen(false)} />
            {!!user && <ChatWidget />}
            {nudgeToast && <AIToast msg={nudgeToast} />}
            <PwaInstallBanner />
            <TourOverlay />
            <Confetti />
            <CommandPalette setPage={handleSetPage} isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
        </div>
    );
};


const AppWrapper: React.FC = () => {
    // Initialize offline cache on mount
    useEffect(() => {
        idbCache.initialize();
    }, []);

    return (
        <SWRConfig value={{
            provider: () => idbCache as any, // Use our IDB-backed cache
            revalidateOnFocus: true,
            shouldRetryOnError: false,
            dedupingInterval: 2000,
        }}>
            <SettingsProvider>
                <SimpleToastProvider>
                    <ToastHost>
                        <PinProvider>
                            <TourProvider>
                                <App />
                            </TourProvider>
                        </PinProvider>
                    </ToastHost>
                </SimpleToastProvider>
            </SettingsProvider>
        </SWRConfig>
    );
};

export default AppWrapper;
