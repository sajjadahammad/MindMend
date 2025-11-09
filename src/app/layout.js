import { DM_Mono } from "next/font/google";
import "./globals.css";

const dmMono = DM_Mono({
  weight: ['300', '400', '500'],
  variable: "--font-dm-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MindMend - AI Emotional Support",
  description: "A compassionate AI chatbot providing emotional support and mental wellness guidance",
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${dmMono.variable} font-mono antialiased`}>
        
        {children}
      </body>
    </html>
  );
}
