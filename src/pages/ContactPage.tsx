
import React from 'react';
import PageLayout from "../components/layout/PageLayout";
import Contact from "../components/Contact";

const ContactPage: React.FC = () => {
  return (
    <PageLayout title="اتصل بنا">
      <Contact />
    </PageLayout>
  );
};

export default ContactPage;
