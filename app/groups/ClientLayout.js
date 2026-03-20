"use client";

import Header2 from "../Components/Header2";
import Footer from "../Components/Footer";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isSession = pathname?.includes("/session/");

  return (
    <>
      {!isSession && <Header2/>}
      {children}
      {!isSession && <Footer/>} 
    </>
  );
}
