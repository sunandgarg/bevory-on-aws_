import Header from "@/components/layout/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <SEOHead title="Privacy Policy | Bevory" description="Bevory's privacy policy — how we collect, use, and protect your data." />
    <Header />
    <main className="px-4 py-8 max-w-3xl mx-auto prose prose-sm dark:prose-invert">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-muted-foreground text-xs mb-4">Last updated: April 2026</p>

      <h2>1. Information We Collect</h2>
      <p>We collect information you provide directly — such as your name, email address, and city — when you create an account, submit reviews, or contact us. We also automatically collect device information, IP addresses, and usage data through cookies and analytics tools.</p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide, maintain, and improve our services</li>
        <li>To personalise your experience (e.g., city-based pricing)</li>
        <li>To send notifications, updates, and promotional communications (with your consent)</li>
        <li>To detect, prevent, and address technical issues or fraud</li>
      </ul>

      <h2>3. Data Sharing</h2>
      <p>We do not sell your personal data. We may share anonymised, aggregated data with partners for analytics. We may disclose information if required by law or to protect our rights.</p>

      <h2>4. Cookies & Tracking</h2>
      <p>We use cookies and similar technologies to analyse traffic, remember preferences, and improve performance. You can control cookies through your browser settings.</p>

      <h2>5. Data Security</h2>
      <p>We implement industry-standard security measures including encryption, secure servers, and access controls. However, no method of electronic transmission is 100% secure.</p>

      <h2>6. Your Rights</h2>
      <p>You may access, update, or delete your personal data at any time through your account settings. To request data deletion, email us at <a href="mailto:bevory.main@gmail.com" className="text-primary">bevory.main@gmail.com</a>.</p>

      <h2>7. Children's Privacy</h2>
      <p>Bevory is intended for adults of legal drinking age (21+). We do not knowingly collect data from minors.</p>

      <h2>8. Changes to This Policy</h2>
      <p>We may update this policy from time to time. We will notify you of significant changes via email or in-app notification.</p>

      <h2>9. Contact Us</h2>
      <p>Email: <a href="mailto:bevory.main@gmail.com" className="text-primary">bevory.main@gmail.com</a><br />Phone: +91 8010321712<br />Location: Delhi, India</p>
    </main>
    <Footer />
  </div>
);

export default PrivacyPolicy;
