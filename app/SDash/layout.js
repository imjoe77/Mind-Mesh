import Footer from "../Components/Footer";
import Header2 from "../Components/Header2";
export const metadata = {
  title: "Profile-MindMesh",
  description: "Find and connect with students who match your learning goals.",
  icons: {
    icon: "/logo.png",
  },
};

export default function DiscoverLayout({ children }) {
  return (
    <>
    <Header2/>
      {children}
      <Footer/>
   </>
  );
}