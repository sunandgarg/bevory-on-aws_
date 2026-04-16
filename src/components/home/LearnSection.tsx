import { motion } from "framer-motion";
import { GraduationCap, Play, Clock, ArrowRight, BookOpen, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

const LearnSection = () => {
  const masterclasses = [
    {
      id: 1,
      title: "The Art of Whisky Tasting",
      author: "Ajit Balgi",
      duration: "8 min",
      category: "Whisky 101",
      image: "🥃",
      color: "from-amber-500/20 to-amber-600/10",
    },
    {
      id: 2,
      title: "Gin Botanicals Explained",
      author: "Mix it with Mendi",
      duration: "6 min",
      category: "Gin Guide",
      image: "🍸",
      color: "from-emerald-500/20 to-emerald-600/10",
    },
    {
      id: 3,
      title: "Perfect Old Fashioned",
      author: "Cocktail Academy",
      duration: "5 min",
      category: "Mixology",
      image: "🍹",
      color: "from-rose-500/20 to-rose-600/10",
    },
  ];

  const hangoverTips = [
    {
      title: "Prevention Tips",
      description: "Best practices before and during drinking",
      icon: "🛡️",
    },
    {
      title: "Quick Remedies",
      description: "Science-backed recovery methods",
      icon: "⚡",
    },
    {
      title: "Hydration Guide",
      description: "The right way to stay hydrated",
      icon: "💧",
    },
  ];

  return (
    <section id="learn" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-accent" />
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">
              Learn & Discover
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Master the Art of Drinking
          </h2>
          <p className="text-muted-foreground">
            Expert-led content on tasting, mixing, and enjoying beverages responsibly.
          </p>
        </div>

        {/* Masterclass Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {masterclasses.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group cursor-pointer"
            >
              <div className={`relative aspect-video rounded-2xl bg-gradient-to-br ${item.color} overflow-hidden mb-4`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-7xl group-hover:scale-110 transition-transform duration-300">
                    {item.image}
                  </span>
                </div>
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary-foreground fill-current ml-1" />
                  </div>
                </div>
                {/* Duration Badge */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-primary/80 backdrop-blur-sm text-primary-foreground text-xs">
                  <Clock className="w-3 h-3" />
                  {item.duration}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-accent uppercase tracking-wider">
                  {item.category}
                </span>
                <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">By {item.author}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Hangover Helpdesk */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-primary text-primary-foreground p-8 md:p-12"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-accent" />
                <span className="text-sm font-semibold text-accent uppercase tracking-wider">
                  Hangover Helpdesk
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold mb-4">
                Feel Better, Faster
              </h3>
              <p className="text-primary-foreground/70 mb-6">
                Science-backed tips and remedies to help you recover and prevent hangovers.
              </p>
              <Button variant="gold" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Explore Tips
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid gap-4">
              {hangoverTips.map((tip, index) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-primary-foreground/10 hover:bg-primary-foreground/15 transition-colors cursor-pointer"
                >
                  <span className="text-3xl">{tip.icon}</span>
                  <div>
                    <h4 className="font-semibold mb-1">{tip.title}</h4>
                    <p className="text-sm text-primary-foreground/70">{tip.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LearnSection;
