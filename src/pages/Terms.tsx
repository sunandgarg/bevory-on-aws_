import Header from "@/components/layout/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <SEOHead title="Terms & Conditions | Bevory" description="Read Bevory's terms and conditions for using our beverage discovery platform." />
    <Header />
    <main className="px-4 py-8 max-w-3xl mx-auto prose prose-sm dark:prose-invert">
      <h1 className="text-2xl font-bold mb-6">Terms & Conditions</h1>
      <p className="text-muted-foreground text-xs mb-4">Last updated: April 2026</p>

      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using Bevory (bevory.in), you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the platform.</p>

      <h2>2. Eligibility</h2>
      <p>You must be of legal drinking age in your jurisdiction (minimum 21 years in India) to access this website. By using Bevory, you confirm that you meet this requirement.</p>

      <h2>3. Nature of Service</h2>
      <p>Bevory is a beverage discovery and price comparison platform. We do <strong>not</strong> sell, distribute, or deliver any alcoholic beverages. All prices displayed are sourced from publicly available information and may vary by retailer.</p>

      <h2>4. User Accounts</h2>
      <ul>
        <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
        <li>You agree to provide accurate and current information.</li>
        <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
      </ul>

      <h2>5. User Content</h2>
      <p>When you submit reviews, ratings, or other content, you grant Bevory a non-exclusive, royalty-free licence to use, display, and distribute that content on our platform.</p>

      <h2>6. Intellectual Property</h2>
      <p>All content on Bevory — including text, images, logos, and design — is owned by Bevory or its licensors and protected by intellectual property laws. You may not reproduce or redistribute without written permission.</p>

      <h2>7. Prohibited Conduct</h2>
      <ul>
        <li>Scraping or automated data extraction without permission</li>
        <li>Submitting false, misleading, or harmful content</li>
        <li>Attempting to gain unauthorised access to our systems</li>
        <li>Using the platform for any illegal purpose</li>
      </ul>

      <h2>8. Limitation of Liability</h2>
      <p>Bevory is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>

      <h2>9. Governing Law</h2>
      <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Delhi, India.</p>

      <h2>10. Contact</h2>
      <p>Email: <a href="mailto:bevory.main@gmail.com" className="text-primary">bevory.main@gmail.com</a><br />Phone: +91 8010321712<br />Location: Delhi, India</p>
    </main>
    <Footer />
  </div>
);

export default Terms;
