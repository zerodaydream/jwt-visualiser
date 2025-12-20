import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Tinos } from "next/font/google"; 
import "./globals.css";
import { SessionPanel } from "@/components/layout/SessionPanel";
import { JwtTokenBar } from "@/components/layout/JwtTokenBar";
import { RateLimitIndicator } from "@/components/features/RateLimitIndicator";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const serif = Tinos({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "JWT Visualiser",
  description: "Interactive JWT Debugger",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} ${serif.variable} font-sans bg-claude-bg text-claude-text overflow-hidden`}>
        
        {/* Sidebar */}
        <SessionPanel />
        
        {/* Main Content Area */}
        <main className="ml-64 h-screen flex flex-col overflow-hidden relative">
            
            {/* The Token Bar sticks to the top of the main area */}
            <JwtTokenBar />
            
            {/* Page Content (Decode, Ask, etc.) */}
            <div className="flex-1 p-6 overflow-y-auto">
                {children}
            </div>
        </main>

        {/* Rate Limit Indicator - Fixed Bottom Right */}
        <RateLimitIndicator />
      </body>
    </html>
  );
}