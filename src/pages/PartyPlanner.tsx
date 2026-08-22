import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Wallet, Sparkles, ChevronRight, PartyPopper, Star, Check, Wand2, Loader2, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import MobileLayout from "@/components/layout/MobileLayout";
import { usePartyPlanner } from "@/hooks/usePartyPlanner";
import { useLocation } from "@/hooks/useLocation";
import { Link } from "react-router-dom";
import { apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";

interface AIRecommendation {
  category: string;
  quantity: number;
  estimatedCost: number;
  suggestions: string[];
  reasoning: string;
}

interface AIResponse {
  recommendations: AIRecommendation[];
  totalEstimatedCost: number;
  partyTips: string[];
  budgetAnalysis: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
}

const PartyPlanner = () => {
  const [guests, setGuests] = useState([10]);
  const [budget, setBudget] = useState([5000]);
  const [step, setStep] = useState<"input" | "categories" | "results" | "ai-results">("input");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AIResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [recommendationType, setRecommendationType] = useState<"quick" | "ai">("quick");
  
  const { recommendations, getRecommendations, loading, budgetInfo } = usePartyPlanner();
  const { selectedCity } = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await apiClient
        .from("categories")
        .select("id, name, slug, emoji")
        .order("name");
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleProceedToCategories = (type: "quick" | "ai") => {
    setRecommendationType(type);
    setStep("categories");
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleGetRecommendations = async () => {
    await getRecommendations(guests[0], budget[0], selectedCategories);
    setStep("results");
  };

  const handleGetAIRecommendations = async () => {
    setAiLoading(true);
    try {
      const selectedCategoryNames = categories
        .filter(c => selectedCategories.includes(c.id))
        .map(c => c.name);

      const { data, error } = await apiClient.functions.invoke("party-planner-ai", {
        body: {
          guests: guests[0],
          budget: budget[0],
          city: selectedCity?.name || "Gurgaon",
          categories: selectedCategoryNames,
        },
      });

      if (error) throw error;

      if (data.recommendations) {
        setAiRecommendations(data);
        setStep("ai-results");
      } else {
        toast({
          title: "AI Error",
          description: "Could not generate recommendations. Using standard recommendations instead.",
          variant: "destructive",
        });
        handleGetRecommendations();
      }
    } catch (error) {
      console.error("AI Party Planner error:", error);
      toast({
        title: "Error",
        description: "Failed to get AI recommendations. Try again later.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSharePlan = async () => {
    const planText = step === "ai-results" && aiRecommendations
      ? `🎉 My Party Plan\n\n👥 ${guests[0]} Guests | 💰 ₹${budget[0].toLocaleString()} Budget\n📍 ${selectedCity?.name || "India"}\n\n${aiRecommendations.recommendations.map(r => `${r.category}: ${r.quantity} items - ₹${r.estimatedCost.toLocaleString()}`).join("\n")}\n\n💰 Total: ₹${aiRecommendations.totalEstimatedCost.toLocaleString()}\n\nPlanned with BevOry 🥂`
      : `🎉 My Party Plan\n\n👥 ${guests[0]} Guests | 💰 ₹${budget[0].toLocaleString()} Budget\n📍 ${selectedCity?.name || "India"}\n\n${recommendations.map(r => `${r.category.emoji || "🍷"} ${r.category.name}: ${r.quantity} items - ₹${r.totalCost.toLocaleString()}`).join("\n")}\n\n💰 Total: ₹${totalCost.toLocaleString()}\n\nPlanned with BevOry 🥂`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Party Plan - BevOry",
          text: planText,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(planText);
        toast({
          title: "Plan copied!",
          description: "Party plan copied to clipboard",
        });
      }
    } catch (error) {
      // User cancelled or error - copy to clipboard as fallback
      try {
        await navigator.clipboard.writeText(planText);
        toast({
          title: "Plan copied!",
          description: "Party plan copied to clipboard",
        });
      } catch {
        toast({
          title: "Share failed",
          description: "Could not share the plan",
          variant: "destructive",
        });
      }
    }
  };

  const handleConfirmCategories = () => {
    if (selectedCategories.length === 0) {
      toast({
        title: "Select Categories",
        description: "Please select at least one category",
        variant: "destructive",
      });
      return;
    }

    if (recommendationType === "ai") {
      handleGetAIRecommendations();
    } else {
      handleGetRecommendations();
    }
  };

  const totalCost = recommendations.reduce((sum, rec) => sum + rec.totalCost, 0);

  return (
    <MobileLayout title="Party Planner">
      <div className="p-4">
        <AnimatePresence mode="wait">
          {step === "input" ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="text-center py-6">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <PartyPopper className="w-10 h-10 text-accent" />
                </div>
                <h1 className="text-2xl font-serif font-bold mb-2">
                  Plan Your Perfect Party
                </h1>
                <p className="text-muted-foreground">
                  Tell us about your party and we'll recommend the best drinks
                </p>
              </div>

              {/* Form */}
              <div className="space-y-8 p-6 rounded-2xl bg-card border border-border">
                {/* Guests */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <span className="font-medium">Number of Guests</span>
                    </div>
                    <span className="text-2xl font-bold">{guests[0]}</span>
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
                    <span>2</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>

                {/* Budget */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-accent" />
                      </div>
                      <span className="font-medium">Your Budget</span>
                    </div>
                    <span className="text-2xl font-bold">₹{budget[0].toLocaleString()}</span>
                  </div>
                  <Slider
                    value={budget}
                    onValueChange={setBudget}
                    max={100000}
                    min={1000}
                    step={1000}
                    className="py-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>₹1K</span>
                    <span>₹50K</span>
                    <span>₹1L</span>
                  </div>
                </div>

                {/* City indicator */}
                {selectedCity ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-secondary">
                    <span>📍</span>
                    <span>Prices for {selectedCity.name}</span>
                    <Check className="w-4 h-4 text-green-500 ml-auto" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-yellow-600 p-3 rounded-lg bg-yellow-500/10">
                    <span>📍</span>
                    <span>Select your city for accurate prices</span>
                  </div>
                )}

                {/* CTAs */}
                <div className="space-y-3">
                  <Button 
                    size="lg" 
                    className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white gap-2 text-base"
                    onClick={() => handleProceedToCategories("ai")}
                  >
                    <Wand2 className="w-5 h-5" />
                    Get AI Recommendations
                    <Sparkles className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full h-12 gap-2"
                    onClick={() => handleProceedToCategories("quick")}
                  >
                    Quick Recommendations
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Tips */}
              <div className="p-4 rounded-xl bg-secondary/50">
                <h3 className="font-medium mb-2">💡 Party Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Plan for 2-3 drinks per guest for a 3-hour party</li>
                  <li>• Mix categories: some beer, some spirits, some wine</li>
                  <li>• Don't forget non-alcoholic options!</li>
                </ul>
              </div>
            </motion.div>
          ) : step === "categories" ? (
            <motion.div
              key="categories"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Grid3X3 className="w-5 h-5 text-accent" />
                    <h1 className="text-xl font-serif font-bold">Select Categories</h1>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose what drinks you want for your party
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep("input")}>
                  Back
                </Button>
              </div>

              {/* Party Summary */}
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                <div className="flex items-center justify-between text-sm">
                  <span>{guests[0]} guests</span>
                  <span>•</span>
                  <span>₹{budget[0].toLocaleString()} budget</span>
                  {selectedCity && (
                    <>
                      <span>•</span>
                      <span>📍 {selectedCity.name}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedCategories.length} selected
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedCategories(categories.map(c => c.id))}
                  >
                    Select All
                  </Button>
                </div>
                {categories.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    Loading categories...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pb-2">
                    {categories.map((category) => {
                      const isSelected = selectedCategories.includes(category.id);
                      return (
                        <button
                          key={category.id}
                          onClick={() => toggleCategory(category.id)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            isSelected 
                              ? "border-accent bg-accent/10" 
                              : "border-border bg-card hover:border-accent/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              aria-hidden="true"
                              className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary ${isSelected ? "bg-primary text-primary-foreground" : "bg-background"}`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </span>
                            <div>
                              <span className="text-2xl block mb-1">{category.emoji || "🍷"}</span>
                              <p className="font-medium text-sm">{category.name}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Continue Button */}
              <Button 
                size="lg" 
                className={`w-full h-14 gap-2 ${
                  recommendationType === "ai" 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                    : ""
                }`}
                onClick={handleConfirmCategories}
                disabled={loading || aiLoading}
              >
                {aiLoading || loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Getting Recommendations...
                  </>
                ) : (
                  <>
                    {recommendationType === "ai" ? (
                      <>
                        <Wand2 className="w-5 h-5" />
                        Get AI Recommendations
                      </>
                    ) : (
                      <>
                        Get Recommendations
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </>
                )}
              </Button>
            </motion.div>
          ) : step === "ai-results" && aiRecommendations ? (
            <motion.div
              key="ai-results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Wand2 className="w-5 h-5 text-purple-500" />
                    <h1 className="text-xl font-serif font-bold">AI Party Plan</h1>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {guests[0]} guests • ₹{budget[0].toLocaleString()} budget
                  </p>
                </div>
                <Button variant="outline" onClick={() => setStep("input")}>
                  Edit
                </Button>
              </div>

              {/* Budget Analysis */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-muted-foreground">AI Estimated Cost</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ₹{aiRecommendations.totalEstimatedCost.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Remaining Budget</p>
                    <p className={`text-lg font-bold ${budget[0] - aiRecommendations.totalEstimatedCost >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ₹{(budget[0] - aiRecommendations.totalEstimatedCost).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{aiRecommendations.budgetAnalysis}</p>
              </div>

              {/* AI Recommendations */}
              <div className="space-y-4">
                {aiRecommendations.recommendations.map((rec, index) => (
                  <motion.div
                    key={rec.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl bg-card border border-border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{rec.category}</h3>
                        <p className="text-xs text-muted-foreground">{rec.reasoning}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-accent">₹{rec.estimatedCost.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{rec.quantity} items</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rec.suggestions.map((suggestion, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-secondary text-sm">
                          {suggestion}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Party Tips from AI */}
              {aiRecommendations.partyTips.length > 0 && (
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI Party Tips
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {aiRecommendations.partyTips.map((tip, i) => (
                      <li key={i}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("input")}>
                  Start Over
                </Button>
                <Button 
                  className="flex-1 bg-accent text-accent-foreground"
                  onClick={handleSharePlan}
                >
                  Share Plan
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-serif font-bold">Your Party Plan</h1>
                  <p className="text-sm text-muted-foreground">
                    {guests[0]} guests • ₹{budget[0].toLocaleString()} budget
                  </p>
                </div>
                <Button variant="outline" onClick={() => setStep("input")}>
                  Edit
                </Button>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Estimated Cost</p>
                    <p className="text-2xl font-bold text-accent">
                      ₹{totalCost.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Budget Used</p>
                    <p className={`text-lg font-bold ${budgetInfo && budgetInfo.percentage >= 70 ? "text-green-600" : "text-yellow-600"}`}>
                      {budgetInfo?.percentage || 0}%
                    </p>
                  </div>
                </div>
                {budgetInfo && (
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${budgetInfo.percentage >= 70 ? "bg-green-500" : "bg-yellow-500"}`}
                          style={{ width: `${Math.min(budgetInfo.percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ₹{(budget[0] - totalCost).toLocaleString()} left
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{budgetInfo.message}</p>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <motion.div
                      key={rec.category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl bg-card border border-border"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{rec.category.emoji}</span>
                          <div>
                            <h3 className="font-semibold">{rec.category.name}</h3>
                            <p className="text-xs text-muted-foreground">{rec.notes}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-accent">₹{rec.totalCost.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{rec.quantity} items</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {rec.products.map((product) => {
                          const qty = (product as any).recommendedQuantity || 1;
                          const unitPrice = product.price || 0;
                          return (
                            <Link
                              key={product.id}
                              to={`/product/${(product as any).slug || product.id}`}
                              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <span className="text-2xl">{product.image_emoji || "🥃"}</span>
                                  {qty > 1 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">
                                      {qty}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{product.name}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{product.brand}</span>
                                    {product.rating && (
                                      <>
                                        <span>•</span>
                                        <span className="flex items-center gap-0.5">
                                          <Star className="w-3 h-3 fill-accent text-accent" />
                                          {product.rating}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  ₹{(unitPrice * qty).toLocaleString()}
                                </p>
                                {qty > 1 && (
                                  <p className="text-xs text-muted-foreground">
                                    {qty} × ₹{unitPrice.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 p-4 rounded-xl bg-secondary/50">
                  <div className="text-5xl mb-4">🤷</div>
                  <h3 className="font-semibold mb-2">No Matching Recommendations</h3>
                  <p className="text-muted-foreground text-sm">
                    Try adjusting your guest count, budget, or selected categories.
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

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("input")}>
                  Start Over
                </Button>
                <Button 
                  className="flex-1 bg-accent text-accent-foreground"
                  onClick={handleSharePlan}
                >
                  Share Plan
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
};

export default PartyPlanner;
