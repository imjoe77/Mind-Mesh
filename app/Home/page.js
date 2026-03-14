import Header from "../Components/Header";
import Hero from"../Components/Hero";

import CTA from "../Components/CTA";

import Footer from "../Components/Footer";


export const metadata = {
  title: 'Mind-Mesh - Connect, Learn, Grow',
  description:
    'Collaborative learning platform that brings students together to form meaningful study groups and master any subject through peer learning.',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-900">
      {/* <Header /> */}
      <Hero />
      
     
      <CTA />
      <Footer />
    </main>
  );
}
