import type { Metadata } from "next";
import Navbar from "./components/layouts/Navbar";
import Footer from "./components/layouts/Footer";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MovieScope - Découvrez votre prochain film",
  description:
    "MovieScope est une application web moderne de découverte de films...",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head />
      <body>
        <Navbar />
        <div className="pt-16">{children}</div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
