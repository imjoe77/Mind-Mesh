import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./Components/Header";
import { Providers } from "./providers";
import SocketProvider from "./Components/SocketProvider";
import Script from "next/script";

export default function RootLayout({ children }) {
  

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Script src="/api/socketio/socket.io.js" strategy="beforeInteractive" />
        <Providers>
          <SocketProvider>
            <Header />
            {children}
          </SocketProvider>
        </Providers>
      </body>
    </html>
  );
}
