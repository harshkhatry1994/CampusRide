import React from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ChatBot } from "@/components/site/ChatBot";

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <ChatBot />
    </div>
  );
}
