import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import FeaturesSection from "@/components/landing/FeaturesSection";
import AIBuilderShowcase from "@/components/landing/AIBuilderShowcase";
import BulkGenShowcase from "@/components/landing/BulkGenShowcase";
import TemplatesSection from "@/components/landing/TemplatesSection";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#060810]">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <AIBuilderShowcase />
      <BulkGenShowcase />
      <TemplatesSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
