import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Navigation from "@/components/Navigation";
import Chatbot from "@/components/Chatbot";

const inter = Inter({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "EduGlobal AI - Your International Student Planner",
  description: "AI-powered planning for your international degree.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-display antialiased flex flex-col min-h-screen relative`}>
        <Navigation />
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
