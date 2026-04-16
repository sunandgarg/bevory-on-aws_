import { motion } from "framer-motion";
import { Smartphone, CheckCircle2, Scan, Bell, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const DownloadAppSection = () => {
  const features = [
    {
      icon: Scan,
      title: "Scan & Discover",
      description: "Point your camera at any bottle to get instant information",
    },
    {
      icon: MapPin,
      title: "Local Prices",
      description: "Real-time pricing from stores near you",
    },
    {
      icon: Bell,
      title: "Price Alerts",
      description: "Get notified when your favorites go on sale",
    },
  ];

  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative max-w-sm mx-auto">
              {/* Phone Frame */}
              <div className="relative aspect-[9/19] rounded-[3rem] bg-primary p-3 shadow-elevated">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-6 bg-primary rounded-full" />
                <div className="w-full h-full rounded-[2.5rem] bg-card overflow-hidden">
                  {/* App Screen Mock */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
                        <span className="font-bold text-primary">B</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-muted" />
                    </div>
                    <div className="h-10 rounded-xl bg-muted animate-shimmer" />
                    <div className="grid grid-cols-3 gap-2">
                      <div className="aspect-square rounded-xl bg-secondary flex items-center justify-center text-3xl">🥃</div>
                      <div className="aspect-square rounded-xl bg-secondary flex items-center justify-center text-3xl">🍷</div>
                      <div className="aspect-square rounded-xl bg-secondary flex items-center justify-center text-3xl">🍸</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                    <div className="h-24 rounded-xl bg-gradient-gold/10 border border-accent/20" />
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 px-4 py-2 rounded-xl bg-card border border-border shadow-card"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  <span className="font-semibold text-sm">Best Prices</span>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 -left-4 px-4 py-2 rounded-xl bg-card border border-border shadow-card"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">⭐</span>
                  <span className="font-semibold text-sm">4.8 Rating</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-accent" />
              <span className="text-sm font-semibold text-accent uppercase tracking-wider">
                Get the App
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Bevory in Your Pocket
            </h2>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Get real-time prices, scan bottles for instant info, and never miss a deal with our mobile app.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* App Store Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-3 h-14 px-6">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-80">Download on the</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </Button>
              <Button size="lg" variant="outline" className="gap-3 h-14 px-6 border-border hover:bg-secondary">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-80">Get it on</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DownloadAppSection;
