import React, { lazy, Suspense, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { DirectionProvider } from '@radix-ui/react-direction';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from './components/ui/toaster';
import ErrorBoundary from './components/ErrorBoundary';
import JsonLd from './components/SEO/JsonLd';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import ScrollToTop from './components/shared/ScrollToTop';
import { PublicShell, OperationalShell, AdminShell } from './components/layout/AppShells';
import { supabase } from '@/integrations/supabase/client';
import './App.css';

import Index from './pages/Index';
import AuthPage from './pages/AuthPage';
import NotFound from './pages/NotFound';

const MaintenanceRequest = lazy(() => import('./pages/MaintenanceRequest'));
const MaintenanceTracking = lazy(() => import('./pages/MaintenanceTracking'));
const MaintenanceList = lazy(() => import('./pages/MaintenanceList'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectManagement = lazy(() => import('./pages/ProjectManagement'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const PNPage = lazy(() => import('./pages/PNPage'));
const ProjectPortfolioDetails = lazy(() => import('./pages/ProjectPortfolioDetails'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const CEOPage = lazy(() => import('./pages/CEOPage'));
const ChatbotPage = lazy(() => import('./pages/ChatbotPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const ProjectsShowcase = lazy(() => import('./pages/ProjectsShowcase'));
const MaintenanceRequestDetails = lazy(() => import('./pages/MaintenanceRequestDetails'));
const MaintenanceReports = lazy(() => import('./pages/MaintenanceReports'));
const ProjectStoryPage = lazy(() => import('./pages/ProjectStoryPage'));
const ChatbotTrainingPage = lazy(() => import('./pages/ChatbotTrainingPage'));
const LuxuryFinishingPage = lazy(() => import('./pages/services/LuxuryFinishingPage'));
const LuxuryCleaningPage = lazy(() => import('./pages/services/LuxuryCleaningPage'));
const BrandIdentityPage = lazy(() => import('./pages/services/BrandIdentityPage'));
const UberFixPage = lazy(() => import('./pages/services/UberFixPage'));
const MaintenanceRenovationPage = lazy(() => import('./pages/services/MaintenanceRenovationPage'));
const GeneralSuppliesPage = lazy(() => import('./pages/services/GeneralSuppliesPage'));
const UberFixSubscriptionsPage = lazy(() => import('./pages/services/UberFixSubscriptionsPage'));
const UberFixSubscriptionRegister = lazy(() => import('./pages/services/UberFixSubscriptionRegister'));
const UberFixSubscriptionComplete = lazy(() => import('./pages/services/UberFixSubscriptionComplete'));
const LabanAlasfourPage = lazy(() => import('./pages/services/LabanAlasfourPage'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const FurnitureGallery = lazy(() => import('./pages/FurnitureGallery'));
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/legal/TermsOfServicePage'));
const CookiePolicyPage = lazy(() => import('./pages/legal/CookiePolicyPage'));
const DataDeletionPage = lazy(() => import('./pages/legal/DataDeletionPage'));
const LegalContactPage = lazy(() => import('./pages/legal/LegalContactPage'));
const RefundPolicyPage = lazy(() => import('./pages/legal/RefundPolicyPage'));
const AcceptableUsePolicyPage = lazy(() => import('./pages/legal/AcceptableUsePolicyPage'));
const DisclaimerPage = lazy(() => import('./pages/legal/DisclaimerPage'));
const SecurityDisclosurePage = lazy(() => import('./pages/legal/SecurityDisclosurePage'));
const WhatsAppSetupPage = lazy(() => import('./pages/WhatsAppSetupPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const WhatsAppManagementPage = lazy(() => import('./pages/WhatsAppManagementPage'));
const QuotationManagement = lazy(() => import('./pages/QuotationManagement'));
const WebhookMonitorPage = lazy(() => import('./pages/WebhookMonitorPage'));
const FacebookPage = lazy(() => import('./pages/FacebookPage'));
const SitemapPage = lazy(() => import('./pages/SitemapPage'));
const MetaAccountsPage = lazy(() => import('./pages/MetaAccountsPage'));
const InternalWebhookPage = lazy(() => import('./pages/InternalWebhookPage'));
const CostCalculator = lazy(() => import('./pages/CostCalculator'));
const AdminContentManager = lazy(() => import('./pages/AdminContentManager'));
const AdminServerDashboard = lazy(() => import('./pages/AdminServerDashboard'));
const TikTokLinkPage = lazy(() => import('./pages/TikTokLinkPage'));
const ReceiptsPage = lazy(() => import('./pages/ReceiptsPage'));
const FormsManagerPage = lazy(() => import('./pages/FormsManagerPage'));
const ContentSectionPage = lazy(() => import('./content/lib/ContentPages').then((m) => ({ default: m.ContentSectionPage })));
const ContentArticlePage = lazy(() => import('./content/lib/ContentPages').then((m) => ({ default: m.ContentArticlePage })));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
  </div>
);

const AppDirectionProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isRTL } = useLanguage();
  return <DirectionProvider dir={isRTL ? 'rtl' : 'ltr'}>{children}</DirectionProvider>;
};

const RecoveryRedirect: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') navigate('/auth/reset-password', { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  return null;
};

const protectedPage = (page: React.ReactNode) => <ProtectedRoute>{page}</ProtectedRoute>;
const adminPage = (page: React.ReactNode) => <AdminRoute>{page}</AdminRoute>;

function App() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <AppDirectionProvider>
          <AuthProvider>
            <UserProfileProvider>
              <ErrorBoundary>
                <BrowserRouter>
                  <RecoveryRedirect />
                  <JsonLd />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

                      <Route element={<PublicShell />}>
                        <Route path="/" element={<Index />} />
                        <Route path="/maintenance-request" element={<MaintenanceRequest />} />
                        <Route path="/maintenance-tracking" element={<MaintenanceTracking />} />
                        <Route path="/services" element={<ServicesPage />} />
                        <Route path="/cost-calculator" element={<CostCalculator />} />
                        <Route path="/fm" element={<FormsManagerPage />} />
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="/portfolio/:projectId" element={<ProjectPortfolioDetails />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/ceo" element={<CEOPage />} />
                        <Route path="/chatbot" element={<ChatbotPage />} />
                        <Route path="/projects-gallery" element={<ProjectsShowcase />} />
                        <Route path="/projects-gallery/:projectId" element={<ProjectStoryPage />} />
                        <Route path="/services/luxury-finishing" element={<LuxuryFinishingPage />} />
                        <Route path="/services/luxury-cleaning" element={<LuxuryCleaningPage />} />
                        <Route path="/services/brand-identity" element={<BrandIdentityPage />} />
                        <Route path="/services/uberfix" element={<UberFixPage />} />
                        <Route path="/services/maintenance-renovation" element={<MaintenanceRenovationPage />} />
                        <Route path="/services/general-supplies" element={<GeneralSuppliesPage />} />
                        <Route path="/services/laban-alasfour" element={<LabanAlasfourPage />} />
                        <Route path="/uberfix-subscriptions" element={<UberFixSubscriptionsPage />} />
                        <Route path="/uberfix-subscriptions/register" element={<UberFixSubscriptionRegister />} />
                        <Route path="/uberfix-subscriptions/complete" element={<UberFixSubscriptionComplete />} />
                        <Route path="/portfolio" element={<Portfolio />} />
                        <Route path="/furniture-gallery" element={<FurnitureGallery />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                        <Route path="/cookie-policy" element={<CookiePolicyPage />} />
                        <Route path="/data-deletion" element={<DataDeletionPage />} />
                        <Route path="/legal-contact" element={<LegalContactPage />} />
                        <Route path="/refund-policy" element={<RefundPolicyPage />} />
                        <Route path="/acceptable-use" element={<AcceptableUsePolicyPage />} />
                        <Route path="/disclaimer" element={<DisclaimerPage />} />
                        <Route path="/security" element={<SecurityDisclosurePage />} />
                        <Route path="/facebook" element={<FacebookPage />} />
                        <Route path="/sitemap" element={<SitemapPage />} />
                        <Route path="/blogs" element={<ContentSectionPage section="blogs" />} />
                        <Route path="/blogs/:slug" element={<ContentArticlePage section="blogs" />} />
                        <Route path="/knowledge" element={<ContentSectionPage section="knowledge" />} />
                        <Route path="/knowledge/:slug" element={<ContentArticlePage section="knowledge" />} />
                        <Route path="/brands" element={<ContentSectionPage section="brands" />} />
                        <Route path="/brands/:slug" element={<ContentArticlePage section="brands" />} />
                        <Route path="/guidance" element={<ContentSectionPage section="guidance" />} />
                        <Route path="/guidance/:slug" element={<ContentArticlePage section="guidance" />} />
                        <Route path="/faq" element={<ContentSectionPage section="faq" />} />
                        <Route path="/faq/:slug" element={<ContentArticlePage section="faq" />} />
                        <Route path="/maintenance-services" element={<ContentSectionPage section="services" />} />
                        <Route path="/maintenance-services/:slug" element={<ContentArticlePage section="services" />} />
                        <Route path="/services/:slug" element={<ContentArticlePage section="services" />} />
                        <Route path="/tiktok-link" element={<TikTokLinkPage />} />
                      </Route>

                      <Route element={<OperationalShell />}>
                        <Route path="/pn" element={<PNPage />} />
                        <Route path="/search" element={protectedPage(<SearchPage />)} />
                        <Route path="/messages" element={protectedPage(<MessagesPage />)} />
                        <Route path="/maintenance-list" element={protectedPage(<MaintenanceList />)} />
                        <Route path="/project-management" element={protectedPage(<ProjectManagement />)} />
                        <Route path="/projects/:projectId" element={protectedPage(<ProjectDetails />)} />
                        <Route path="/dashboard" element={protectedPage(<DashboardPage />)} />
                        <Route path="/profile" element={protectedPage(<ProfilePage />)} />
                        <Route path="/settings" element={protectedPage(<SettingsPage />)} />
                        <Route path="/maintenance-request-details/:id" element={protectedPage(<MaintenanceRequestDetails />)} />
                        <Route path="/maintenance-reports" element={protectedPage(<MaintenanceReports />)} />
                        <Route path="/whatsapp-setup" element={<WhatsAppSetupPage />} />
                        <Route path="/receipts" element={<ReceiptsPage />} />
                      </Route>

                      <Route element={<AdminShell />}>
                        <Route path="/chatbot-training" element={adminPage(<ChatbotTrainingPage />)} />
                        <Route path="/admin-dashboard" element={adminPage(<AdminDashboard />)} />
                        <Route path="/admin/content" element={adminPage(<AdminContentManager />)} />
                        <Route path="/admin/server" element={adminPage(<AdminServerDashboard />)} />
                        <Route path="/whatsapp-management" element={adminPage(<WhatsAppManagementPage />)} />
                        <Route path="/quotation-management" element={adminPage(<QuotationManagement />)} />
                        <Route path="/webhook-monitor" element={adminPage(<WebhookMonitorPage />)} />
                        <Route path="/meta-accounts" element={adminPage(<MetaAccountsPage />)} />
                        <Route path="/internal-webhook" element={adminPage(<InternalWebhookPage />)} />
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  <ScrollToTop />
                  <Toaster />
                </BrowserRouter>
              </ErrorBoundary>
            </UserProfileProvider>
          </AuthProvider>
        </AppDirectionProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
