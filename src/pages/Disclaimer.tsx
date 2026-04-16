import Header from "@/components/layout/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Disclaimer = () => (
  <div className="min-h-screen bg-background">
    <SEOHead title="Disclaimer | Bevory" description="Important disclaimers about Bevory's beverage information and pricing data." />
    <Header />
    <main className="px-4 py-8 max-w-3xl mx-auto prose prose-sm dark:prose-invert">
      <h1 className="text-2xl font-bold mb-6">Disclaimer</h1>
      <p className="text-muted-foreground text-xs mb-4">Last updated: April 2026</p>

      <h2>1. Pricing Information</h2>
      <p>All prices displayed on Bevory are sourced from publicly available government excise records and retailer data. Prices may vary from store to store and are subject to change without notice. Always verify with your local retailer before making a purchase.</p>

      <h2>2. No Sales or Delivery</h2>
      <p>Bevory does <strong>not</strong> sell, distribute, or deliver alcoholic beverages. We are purely an informational and discovery platform. Be cautious of any fraudulent messages claiming delivery services in our name.</p>

      <h2>3. Product Information</h2>
      <p>Product descriptions, tasting notes, ABV percentages, and other details are provided for informational purposes only. We strive for accuracy but cannot guarantee that all information is complete or error-free.</p>

      <h2>4. Health & Responsibility</h2>
      <p>Excessive consumption of alcohol is harmful to health. Bevory encourages responsible drinking. Choose quality over quantity. Never drink and drive. If you or someone you know has a drinking problem, seek professional help.</p>

      <h2>5. Third-Party Links</h2>
      <p>Our platform may contain links to third-party websites. We are not responsible for the content, accuracy, or practices of these external sites.</p>

      <h2>6. Reviews & Opinions</h2>
      <p>User reviews and ratings represent individual opinions and do not reflect the views of Bevory. We do not endorse or verify the accuracy of user-submitted content.</p>

      <h2>7. Legal Compliance</h2>
      <p>Users are responsible for ensuring compliance with local laws regarding the purchase and consumption of alcoholic beverages in their jurisdiction.</p>

      <h2>8. Contact</h2>
      <p>For questions or concerns, reach us at:<br />
        Email: <a href="mailto:bevory.main@gmail.com" className="text-primary">bevory.main@gmail.com</a><br />
        Phone: +91 8010321712<br />
        Location: Delhi, India
      </p>
    </main>
    <Footer />
  </div>
);

export default Disclaimer;
