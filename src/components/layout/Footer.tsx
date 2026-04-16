import { Link } from "react-router-dom";
import BrandingDisplay from "@/components/layout/BrandingDisplay";

const Footer = () => {
  const footerLinks = {
    Explore: [
      { label: "Trending", href: "/search" },
      { label: "Party Planner", href: "/party-planner" },
      { label: "Compare", href: "/search" },
      { label: "Categories", href: "/categories" },
    ],
    Learn: [
      { label: "MasterClass", href: "/masterclass" },
      { label: "Cocktails", href: "/cocktails" },
      { label: "Guide", href: "/guide" },
    ],
    Company: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  };

  return (
    <footer className="bg-card border-t border-border/50">
      <div className="px-4 py-8">
        <div className="grid grid-cols-3 gap-6 mb-6">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandingDisplay variant="footer" />
              <span className="text-xs text-muted-foreground hidden sm:inline">Know Before You Drink</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              © 2026 Bevory
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            For adults of legal drinking age only. Drink responsibly.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
