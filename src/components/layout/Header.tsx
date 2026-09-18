import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import LocationSelector from "@/components/LocationSelector";
import BrandingDisplay from "@/components/layout/BrandingDisplay";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems = [
    { name: "Trending", href: "#trending" },
    { name: "Party Planner", href: "#party-planner" },
    { name: "Compare", href: "#compare" },
    { name: "Learn", href: "#learn" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <BrandingDisplay variant="header" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Location Selector */}
            <div className="hidden sm:block">
              <LocationSelector />
            </div>

            {/* Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors md:hidden"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* CTA Button */}
            <Button variant="gold" className="hidden md:flex">
              Get the App
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pb-4"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search for drinks, brands, or cocktails..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-secondary border border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-background border-b border-border"
          >
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
                <div className="pt-4 mt-2 border-t border-border">
                  <LocationSelector className="w-full justify-start" />
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
