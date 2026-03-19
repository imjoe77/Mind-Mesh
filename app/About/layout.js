import Header from "../Components/Header";
import Footer from "../Components/Footer";
export const metadata = {
  title: "About-MindMesh",
  description: "Find and connect with students who match your learning goals.",
  icons: {
    icon: "/logo.png",
  },
};

export default function DiscoverLayout({ children }) {
  return (
    <>
    <Header/>
      {children}
     <Footer/> 
   </>
  );
}