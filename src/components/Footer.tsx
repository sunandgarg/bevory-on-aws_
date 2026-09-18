import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import BrandingDisplay from "@/components/layout/BrandingDisplay";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground px-4 py-8">
      {/* Links Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground/50 mb-3">Explore</h4>
          <ul className="space-y-2">
            <li><Link to="/search" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Trending</Link></li>
            <li><Link to="/categories" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Categories</Link></li>
            <li><Link to="/brands" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Brands</Link></li>
            <li><Link to="/party-planner" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Party Planner</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground/50 mb-3">Learn</h4>
          <ul className="space-y-2">
            <li><Link to="/masterclass" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">MasterClass</Link></li>
            <li><Link to="/cocktails" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Cocktails</Link></li>
            <li><Link to="/guide" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Guide</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground/50 mb-3">Legal</h4>
          <ul className="space-y-2">
            <li><Link to="/privacy-policy" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/disclaimer" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Disclaimer</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground/50 mb-3">Contact</h4>
          <ul className="space-y-2">
            <li className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-primary-foreground/50" />
              <a href="mailto:bevory.main@gmail.com" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">bevory.main@gmail.com</a>
            </li>
            <li className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-primary-foreground/50" />
              <a href="tel:+918010321712" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">+91 8010321712</a>
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-primary-foreground/50" />
              <span className="text-sm text-primary-foreground/70">Delhi, India</span>
            </li>
            <li>
              <Link to="/contact" className="text-sm text-accent hover:underline">Contact Us →</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Disclaimers */}
      <div className="space-y-2 mb-6 pt-4 border-t border-primary-foreground/10">
        <p className="text-xs text-primary-foreground/50">
          <strong className="text-primary-foreground/70">Pricing Notice:</strong> Prices come from publicly available sources and may vary. Please check with local retailers for the most accurate pricing.
        </p>
        <p className="text-xs text-primary-foreground/50">
          <strong className="text-primary-foreground/70">No Delivery:</strong> Bevory does not offer home delivery services. Be cautious of fraudulent messages claiming otherwise.
        </p>
        <p className="text-xs text-primary-foreground/50">
          <strong className="text-primary-foreground/70">Drink Responsibly:</strong> Excessive alcohol consumption is harmful. Choose quality over quantity. Never drink and drive.
        </p>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-primary-foreground/10">
        <BrandingDisplay variant="footer" className="text-primary-foreground" />
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-[10px] font-bold">
            21+
          </div>
          <p className="text-primary-foreground/50 text-xs">
            © 2026 Bevory. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
