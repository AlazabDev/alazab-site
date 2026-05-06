import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ title, lastUpdated, children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <div className="bg-gradient-to-b from-construction-primary to-construction-dark text-white py-14">
          <div className="container mx-auto px-4 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold mb-3"
            >
              {title}
            </motion.h1>
            <p className="text-sm text-white/70">آخر تحديث: {lastUpdated}</p>
          </div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="container mx-auto px-4 py-12 max-w-4xl"
        >
          <div className="bg-card rounded-2xl shadow-lg border p-8 md:p-12 prose prose-lg max-w-none text-foreground leading-relaxed space-y-8">
            {children}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default LegalPageLayout;
