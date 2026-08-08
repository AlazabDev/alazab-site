import React, { lazy, Suspense, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { DirectionProvider } from '@radix-ui/react-direction';
import { LanguageProvider } from './contexts/LanguageContext';
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import ErrorBoundary from "./components/ErrorBoundary";
import JsonLd from "./components/SEO/JsonLd";
import { supabase } from '@/integrations/supabase/client';
import "./App.css";

// Eagerly loaded (critical path)
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import FloatingChatBot from "./components/shared/FloatingChatBot";
import FloatingSocialButton from "./components/shared/FloatingSocialButton";
import ScrollToTop from "./components/shared/ScrollToTop";
import ScrollProgressBar from "./components/shared/ScrollProgressBar";
import StickyMobileCTA from "./components/shared/StickyMobileCTA";
import CommandPalette from "./components/shared/CommandPalette";

// Lazy loaded pages
const MaintenanceRequest = lazy(() => import("./pages/MaintenanceRequest"));
const MaintenanceTracking = lazy(() => import("./pages/MaintenanceTracking"));
const MaintenanceList = lazy(() => import("./pages/MaintenanceList"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectManagement = lazy(() => import("./pages/ProjectManagement"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const PNPage = lazy(() => import("./pages/PNPage"));
const ProjectPortfolioDetails = lazy(() => import("./pages/ProjectPortfolioDetails"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const CEOPage = lazy(() => import("./pages/CEOPage"));
const ChatbotPage = lazy(() => import("./pages/ChatbotPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProjectsShowcase = lazy(() => import("./pages/ProjectsShowcase"));
const MaintenanceRequestDetails = lazy(() => import("./pages/MaintenanceRequestDetails"));
const MaintenanceReports = lazy(() => import("./pages/MaintenanceReports"));
const ProjectStoryPage = lazy(() => import("./pages/ProjectStoryPage"));
const ChatbotTrainingPage = lazy(() => import("./pages/ChatbotTrainingPage"));
const LuxuryFinishingPage = lazy(() => import("./pages/services/LuxuryFinishingPage"));
const BrandIdentityPage = lazy(() => import("./pages/services/BrandIdentityPage"));
const UberFixPage = lazy(() => import("./pages/services/UberFixPage"));
const UberFixSubscriptionsPage = lazy(() => import("./pages/services/UberFixSubscriptionsPage"));
const UberFixSubscriptionRegister = lazy(() => import("./pages/services/UberFixSubscriptionRegister"));
const UberFixSubscriptionComplete = lazy(() => import("./pages/services/UberFixSubscriptionComplete"));
const LabanAlasfourPage = lazy(() => import("./pages/services/LabanAlasfourPage"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const FurnitureGallery = lazy(() => import("./pages/FurnitureGallery"));
const PrivacyPolicyPage = lazy(() => import("./pages/legal/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/legal/TermsOfServicePage"));
const CookiePolicyPage = lazy(() => import("./pages/legal/CookiePolicyPage"));
const DataDeletionPage = lazy(() => import("./pages/legal/DataDeletionPage"));
const LegalContactPage = lazy(() => import("./pages/legal/LegalContactPage"));
const RefundPolicyPage = lazy(() => import("./pages/legal/RefundPolicyPage"));
const AcceptableUsePolicyPage = lazy(() => import("./pages/legal/AcceptableUsePolicyPage"));
const DisclaimerPage = lazy(() => import("./pages/legal/DisclaimerPage"));
const SecurityDisclosurePage = lazy(() => import("./pages/legal/SecurityDisclosurePage"));
const WhatsAppSetupPage = lazy(() => import("./pages/WhatsAppSetupPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const WhatsAppManagementPage = lazy(() => import("./pages/WhatsAppManagementPage"));
const QuotationManagement = lazy(() => import("./pages/QuotationManagement"));
const WebhookMonitorPage = lazy(() => import("./pages/WebhookMonitorPage"));
const FacebookPage = lazy(() => import("./pages/FacebookPage"));
const SitemapPage = lazy(() => import("./pages/SitemapPage"));
const MetaAccountsPage = lazy(() => import("./pages/MetaAccountsPage"));
const InternalWebhookPage = lazy(() => import("./pages/InternalWebhookPage"));
const CostCalculator = lazy(() => import("./pages/CostCalculator"));
const AdminContentManager = lazy(() => import("./pages/AdminContentManager"));
const AdminServerDashboard = lazy(() => import("./pages/AdminServerDashboard"));
const TikTokLinkPage = lazy(() => import("./pages/TikTokLinkPage"));
const ContentSectionPage = lazy(() => import("./content/lib/ContentPages").then((m) => ({ default: m.ContentSectionPage })));
const ContentArticlePage = lazy(() => import("./content/lib/ContentPages").then((m) => ({ default: m.ContentArticlePage })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const RecoveryRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/auth/reset-password', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
};

function App() {
  return (
    <HelmetProvider>
    <DirectionProvider dir="rtl">
    <LanguageProvider>
    <ErrorBoundary>
    <BrowserRouter>
      <RecoveryRedirect />
      <JsonLd />
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/pn" element={<PNPage />} />
        <Route path="/maintenance-request" element={<MaintenanceRequest />} />
        <Route path="/maintenance-tracking" element={<MaintenanceTracking />} />
        <Route path="/maintenance-list" element={
          <ProtectedRoute>
            <MaintenanceList />
          </ProtectedRoute>
        } />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/cost-calculator" element={<CostCalculator />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/chatbot-training" element={
          <AdminRoute>
            <ChatbotTrainingPage />
          </AdminRoute>
        } />
        <Route path="/project-management" element={
          <ProtectedRoute>
            <ProjectManagement />
          </ProtectedRoute>
        } />
        <Route path="/projects/:projectId" element={
          <ProtectedRoute>
            <ProjectDetails />
          </ProtectedRoute>
        } />
        <Route path="/portfolio/:projectId" element={<ProjectPortfolioDetails />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/ceo" element={<CEOPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/admin-dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/content" element={
          <AdminRoute>
            <AdminContentManager />
          </AdminRoute>
        } />
        <Route path="/admin/server" element={
          <AdminRoute>
            <AdminServerDashboard />
          </AdminRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/projects-gallery" element={<ProjectsShowcase />} />
        <Route path="/projects-gallery/:projectId" element={<ProjectStoryPage />} />
        <Route path="/services/luxury-finishing" element={<LuxuryFinishingPage />} />
        <Route path="/services/uberfix" element={<UberFixPage />} />
        <Route path="/uberfix-subscriptions" element={<UberFixSubscriptionsPage />} />
        <Route path="/uberfix-subscriptions/register" element={<UberFixSubscriptionRegister />} />
        <Route path="/uberfix-subscriptions/complete" element={<UberFixSubscriptionComplete />} />
        <Route path="/services/brand-identity" element={<BrandIdentityPage />} />
        <Route path="/services/laban-alasfour" element={<LabanAlasfourPage />} />
        <Route path="/services/general-supplies" element={<LabanAlasfourPage />} />
        <Route path="/services/maintenance-renovation" element={<UberFixPage />} />
        <Route path="/services/luxury-cleaning" element={<LuxuryFinishingPage />} />
        <Route path="/maintenance-request-details/:id" element={
          <ProtectedRoute>
            <MaintenanceRequestDetails />
          </ProtectedRoute>
        } />
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
        <Route path="/whatsapp-setup" element={<WhatsAppSetupPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/whatsapp-management" element={
          <AdminRoute>
            <WhatsAppManagementPage />
          </AdminRoute>
        } />
        <Route path="/quotation-management" element={
          <AdminRoute>
            <QuotationManagement />
          </AdminRoute>
        } />
        <Route path="/webhook-monitor" element={
          <AdminRoute>
            <WebhookMonitorPage />
          </AdminRoute>
        } />
        <Route path="/maintenance-reports" element={
          <ProtectedRoute>
            <MaintenanceReports />
          </ProtectedRoute>
        } />
        <Route path="/meta-accounts" element={
          <AdminRoute>
            <MetaAccountsPage />
          </AdminRoute>
        } />
        <Route path="/internal-webhook" element={
          <AdminRoute>
            <InternalWebhookPage />
          </AdminRoute>
        } />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      <ScrollProgressBar />
      <FloatingChatBot />
      <FloatingSocialButton />
      <ScrollToTop />
      <StickyMobileCTA />
      <CommandPalette />
      <Toaster />
    </BrowserRouter>
    </ErrorBoundary>
    </LanguageProvider>
    </DirectionProvider>
    </HelmetProvider>
  );
}

export default App;