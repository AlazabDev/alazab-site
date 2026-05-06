
import React from 'react';
import PageLayout from "../components/layout/PageLayout";
import Services from "../components/Services";

const ServicesPage: React.FC = () => {
  return (
    <PageLayout title="خدماتنا">
      <Services />
    </PageLayout>
  );
};

export default ServicesPage;
