import type { Metadata } from "next";
import { AppProviders } from "@/lib/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content Studio | Digital Marketing AI Agent",
  description: "Plan, review, and generate AI-powered Instagram content from your marketing strategy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
