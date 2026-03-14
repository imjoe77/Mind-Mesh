import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./Components/Header";
import { Providers } from "./providers";
import SocketProvider from "./Components/SocketProvider";

export default function RootLayout({ children }) {
  

  return (
    <html lang="en">
      <body>
        <Header/>
        {children}
      </body>
    </html>
  );
}
