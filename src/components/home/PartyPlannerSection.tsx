import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Wallet, Sparkles, ChevronRight, PartyPopper, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePartyPlanner } from "@/hooks/usePartyPlanner";
import { useLocation } from "@/hooks/useLocation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PartyPlannerSection = () => {
  const [guests, setGuests] = useState([10]);
  const [budget, setBudget] = useState([5000]);
  const [showResults, setShowResults] = useState(false);
  const { recommendations, getRecommendations, loading } = usePartyPlanner();
  const { selectedCity } = useLocation();

  const handleGetRecommendations = async () => {
    await getRecommendations(guests[0], budget[0]);
    setShowResults(true);
  };

  const totalCost = recommendations.reduce((sum, rec) => sum + rec.totalCost, 0);

  return (
    <>
      <section id="party-planner" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <PartyPopper className="w-5 h-5 text-accent" />
                <span className="text-sm font-semibold text-accent uppercase tracking-wider">
                  Party Planner
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                Plan Your Perfect Party
              </h2>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Tell us about your gathering and budget, and we'll recommend the perfect selection of drinks for your celebration.
              </p>

              {/* Planner Form */}
              <div className="space-y-8 p-6 rounded-2xl bg-card border border-border">
                {/* Guests Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-accent" />
                      <span className="font-medium">Number of Guests</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground">{guests[0]}</span>
                  </div>
                  <Slider
                    value={guests}
                    onValueChange={setGuests}
                    max={100}
                    min={2}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>2 people</span>
                    <span>100 people</span>
                  </div>
                </div>

                {/* Budget Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-accent" />
                      <span className="font-medium">Your Budget</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground">₹{budget[0].toLocaleString()}</span>
                  </div>
                  <Slider
                    value={budget}
                    onValueChange={setBudget}
                    max={50000}
                    min={1000}
                    step={500}
                    className="py-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>₹1,000</span>
                    <span>₹50,000</span>
                  </div>
                </div>

                {/* Location indicator */}
                {selectedCity && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>📍</span>
                    <span>Prices for {selectedCity.name}</span>
                  </div>
                )}

                {/* CTA */}
                <Button 
                  variant="gold" 
                  size="xl" 
                  className="w-full gap-2"
                  onClick={handleGetRecommendations}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Getting Recommendations...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Get Recommendations
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Right - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-square max-w-lg mx-auto">
                {/* Decorative circles */}
                <div className="absolute inset-0 rounded-full bg-accent/5 animate-pulse" />
                <div className="absolute inset-8 rounded-full bg-accent/10" />
                <div className="absolute inset-16 rounded-full bg-secondary" />

                {/* Center content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">🎉</div>
                    <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
                      Party Shopping
                    </h3>
                    <p className="text-muted-foreground">Made Simple</p>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-10 left-10 text-5xl"
                >
                  🍾
                </motion.div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="absolute top-20 right-10 text-5xl"
                >
                  🥂
                </motion.div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute bottom-20 left-5 text-5xl"
                >
                  🍸
                </motion.div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                  className="absolute bottom-10 right-20 text-5xl"
                >
                  🥃
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-accent" />
              Party Recommendations for {guests[0]} Guests
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary */}
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Your Budget</p>
                  <p className="text-xl font-bold">₹{budget[0].toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Estimated Total</p>
                  <p className="text-xl font-bold text-accent">₹{totalCost.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <motion.div
                  key={rec.category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl bg-card border border-border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{rec.category.emoji}</span>
                      <div>
                        <h4 className="font-semibold">{rec.category.name}</h4>
                        <p className="text-sm text-muted-foreground">{rec.notes}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{rec.quantity} items</p>
                      <p className="font-bold text-accent">₹{rec.totalCost.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {rec.products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{product.image_emoji}</span>
                          <div>
                            <p className="font-medium text-sm">{product.brand} {product.name}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="w-3 h-3 fill-accent text-accent" />
                              <span>{product.rating}</span>
                              <span>•</span>
                              <span>{product.volume}</span>
                            </div>
                          </div>
                        </div>
                        <p className="font-semibold">
                          {product.price ? `₹${Number(product.price).toLocaleString()}` : "Price N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No recommendations found for this combination. Try adjusting your guest count or budget.
                </p>
              </div>
            )}

            {!selectedCity && (
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  💡 Select your city for accurate pricing in your area!
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PartyPlannerSection;
