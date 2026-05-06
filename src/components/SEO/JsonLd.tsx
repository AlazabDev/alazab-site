import React from 'react';

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "مؤسسة العزب للمقاولات والتشطيبات",
  "alternateName": "Al-Azab Construction & Finishing",
  "url": "https://alazab.com",
  "logo": "https://alazab.com/logo.png",
  "description": "مؤسسة رائدة في مجال المقاولات والتشطيبات والتصميم الداخلي وخدمات الصيانة في مصر",
  "foundingDate": "2015",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "EG",
    "addressLocality": "القاهرة"
  },
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["Arabic", "English"]
    }
  ],
  "sameAs": [
    "https://www.facebook.com/alazab.construction",
    "https://www.instagram.com/alazab.construction"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "خدماتنا",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "التشطيبات الفاخرة",
          "description": "خدمات تشطيب داخلي وخارجي بأعلى المعايير"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "الصيانة والتجديد",
          "description": "خدمات صيانة شاملة وتجديد للعقارات"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "الهوية التجارية",
          "description": "تصميم وتنفيذ الهوية البصرية للمحلات والمطاعم"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "التوريدات العامة",
          "description": "توريد مواد البناء والتشطيب بأسعار تنافسية"
        }
      }
    ]
  }
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "مؤسسة العزب",
  "alternateName": "Al-Azab",
  "url": "https://alazab.com",
  "inLanguage": ["ar", "en"],
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://alazab.com/projects-gallery?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const JsonLd: React.FC = () => (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
    />
  </>
);

export default JsonLd;
