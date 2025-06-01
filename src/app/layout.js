import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Brain } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sentiment Analysis Chatbot",
  description: "This is a chatbot to analyze user emotion through emoji",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
         <div className="flex items-center gap-3 absolute top-3 left-3 font-sans">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">MindMend</h1>
          </div>
        {children}
      </body>
    </html>
  );
}
