import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "./providers";
import SocketProvider from "./Components/SocketProvider";
import MittarChat from "./Components/MittarChat";
import Script from "next/script";

export const metadata = {
  title: "Mind Mesh",
  description: "MindMesh is an AI-powered collaborative study platform featuring live study rooms, AI module generation, and interactive tools.",
  icons: {
    icon: "/favicon.ico",
    apple:"/favicon.ico"
  },
};

export default function RootLayout({ children }) {
  
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/MindMeshLogo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Script src={`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/socketio/socket.io.js`} strategy="beforeInteractive" />
        <Providers>
          <SocketProvider>
            {children}
            <MittarChat />
          </SocketProvider>
        </Providers>
      </body>
    </html>
  );
}
