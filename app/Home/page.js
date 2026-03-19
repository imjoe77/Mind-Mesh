import Header from "../Components/Header";
import Hero from"../Components/Hero";
import HowItWorks from "../Components/HIW";
import CTA from "../Components/CTA";
import Features from "../Components/Features";

import Testimonials from "../Components/Testimonials";




export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-900">
      {/* <Header /> */}
      <Hero />
      <Features/>
     <HowItWorks/>
     <Testimonials/>
      <CTA />
      
    </main>
  );
}
