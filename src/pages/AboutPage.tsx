
import React from 'react';
import PageLayout from "../components/layout/PageLayout";
import About from "../components/About";

const AboutPage: React.FC = () => {
  return (
    <PageLayout title="من نحن">
      <About />
    </PageLayout>
  );
};

export default AboutPage;
