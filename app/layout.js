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
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Script src="/api/socketio/socket.io.js" strategy="beforeInteractive" />
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
