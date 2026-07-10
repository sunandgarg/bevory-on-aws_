import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import TrendingSection from "@/components/home/TrendingSection";
import PartyPlannerSection from "@/components/home/PartyPlannerSection";
import CompareSection from "@/components/home/CompareSection";
import LearnSection from "@/components/home/LearnSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import DownloadAppSection from "@/components/home/DownloadAppSection";
import AgeVerificationModal from "@/components/home/AgeVerificationModal";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <AgeVerificationModal />
      <Header />
      <main>
        <HeroSection />
        <TrendingSection />
        <CategoriesSection />
        <PartyPlannerSection />
        <CompareSection />
        <LearnSection />
        <DownloadAppSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
