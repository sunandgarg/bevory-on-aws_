import Header from "@/components/layout/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Mail, Phone, MapPin } from "lucide-react";

const Contact = () => (
  <div className="min-h-screen bg-background">
    <SEOHead title="Contact Us | Bevory" description="Get in touch with Bevory — India's smart beverage discovery platform." />
    <Header />
    <main className="px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Contact Us</h1>
      <p className="text-muted-foreground text-sm mb-8">We'd love to hear from you. Reach out for feedback, partnerships, or support.</p>

      <div className="space-y-6">
        <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
          <div className="p-2.5 rounded-lg bg-primary/10"><Mail className="h-5 w-5 text-primary" /></div>
          <div>
            <h3 className="font-semibold text-sm mb-1">Email</h3>
            <a href="mailto:bevory.main@gmail.com" className="text-sm text-primary hover:underline">bevory.main@gmail.com</a>
            <br />
            <a href="mailto:contact@bevory.io" className="text-sm text-muted-foreground hover:underline">contact@bevory.io</a>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
          <div className="p-2.5 rounded-lg bg-primary/10"><Phone className="h-5 w-5 text-primary" /></div>
          <div>
            <h3 className="font-semibold text-sm mb-1">Phone</h3>
            <a href="tel:+918010321712" className="text-sm text-foreground">+91 8010321712</a>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
          <div className="p-2.5 rounded-lg bg-primary/10"><MapPin className="h-5 w-5 text-primary" /></div>
          <div>
            <h3 className="font-semibold text-sm mb-1">Location</h3>
            <p className="text-sm text-foreground">Delhi, India</p>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border/50">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Bevory does not offer home delivery services. Please be cautious of any fraudulent messages claiming delivery in our name. For any concerns, contact us directly using the information above.
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Contact;
