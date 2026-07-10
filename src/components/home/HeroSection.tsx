import { motion } from "framer-motion";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const categories = [
    { name: "Whisky", emoji: "🥃" },
    { name: "Wine", emoji: "🍷" },
    { name: "Gin", emoji: "🍸" },
    { name: "Rum", emoji: "🥥" },
    { name: "Vodka", emoji: "❄️" },
    { name: "Beer", emoji: "🍺" },
  ];

  return (
    <section className="relative min-h-screen pt-20 flex items-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-warm" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-bevory-cream rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-12 lg:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Know Before You Drink</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight mb-6">
              Discover, Compare &{" "}
              <span className="text-gradient-gold">Celebrate</span>{" "}
              Every Pour
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Your ultimate guide to the world of beverages. Compare prices, explore brands, and make informed choices for every occasion.
            </p>

            {/* Search Bar */}
            <div className="relative mb-8">
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-card border border-border shadow-soft">
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search brands, drinks, or cocktails..."
                    className="flex-1 py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
                <Button variant="gold" className="px-6 py-6 rounded-xl">
                  Explore
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Quick Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat, index) => (
                <motion.button
                  key={cat.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary hover:bg-muted border border-border transition-all hover:border-accent/30"
                >
                  <span>{cat.emoji}</span>
                  <span className="text-sm font-medium">{cat.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Feature Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Price Card */}
              <motion.div
                whileHover={{ y: -4 }}
                className="col-span-2 p-6 rounded-2xl glass-card hover-lift"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Featured</p>
                    <h3 className="font-serif text-xl font-bold">Johnnie Walker Blue</h3>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-bold">
                    ★ 4.8
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Starting from</p>
                    <p className="text-2xl font-bold text-foreground">₹18,000</p>
                  </div>
                  <div className="text-3xl">🥃</div>
                </div>
              </motion.div>

              {/* Stats Cards */}
              <motion.div
                whileHover={{ y: -4 }}
                className="p-5 rounded-2xl glass-card hover-lift"
              >
                <p className="text-3xl font-bold text-foreground mb-1">500+</p>
                <p className="text-sm text-muted-foreground">Brands Listed</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="p-5 rounded-2xl glass-card hover-lift"
              >
                <p className="text-3xl font-bold text-foreground mb-1">50+</p>
                <p className="text-sm text-muted-foreground">Cities Covered</p>
              </motion.div>

              {/* Compare Card */}
              <motion.div
                whileHover={{ y: -4 }}
                className="col-span-2 p-6 rounded-2xl bg-primary text-primary-foreground hover-lift"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Compare Prices</h3>
                    <p className="text-sm text-primary-foreground/70">Find the best deals near you</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
