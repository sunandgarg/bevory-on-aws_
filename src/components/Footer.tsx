import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
const Footer = () => {
  return <footer className="bg-primary text-primary-foreground px-4 py-6">
      {/* Disclaimer */}
      <div className="space-y-3 mb-6 text-xs text-primary-foreground/70">
        <div className="flex items-start gap-2">
          <span className="font-bold">1.</span>
          <p className="text-sm">Pricing Notice:
Prices come from publicly available sources and may vary from one store to another. Please check with local retailers for the most accurate and current pricing.        </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold">2.</span>
          <p className="text-sm">Delivery Disclaimer: BevOry does not offer home delivery services. Please be cautious and avoid any fraudulent messages that say otherwise.    </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold">3.</span>
          <p className="text-sm">Responsible Consumption:
Drink mindfully. Choose quality over quantity. Always drink responsibly.            </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold">4.</span>
          <p className="text-sm">
            Reach out to us:{" "}
            <a href="mailto:contact@bevory.io" className="text-accent hover:underline">
              contact@bevory.io
            </a>
            {" "}or{" "}
            <a href="mailto:bevory.main@gmail.com" className="text-accent hover:underline">
              bevory.main@gmail.com
            </a>
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div className="flex items-center justify-between pt-4 border-t border-primary-foreground/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
            <span className="text-sm font-bold text-primary">B</span>
          </div>
          <span className="font-serif font-bold">Bevory</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-[10px] font-bold">
            21+
          </div>
          <p className="text-primary-foreground/50 text-xs">
            © 2026 BevOry. All rights reserved.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;