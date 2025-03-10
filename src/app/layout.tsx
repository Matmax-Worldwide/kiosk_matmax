"use client";
import React from "react";
import { AnimatedLayout } from "@/components/animated-layout";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { NotificationList } from "@/components/notification-list";
import "./globals.css";
import "@/styles/safari-fixes.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ApolloProvider } from "@apollo/client";
import { client } from "@/lib/apolloClient";
import { CartProvider } from '@/contexts/CartContext';
import { cn } from "@/lib/utils";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" href="/pwa.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MATMAX Studio" />
        <link rel="apple-touch-icon" href="/pwa.png" />
      </head>
      <body className={cn("relative h-full antialiased")}>
        <CartProvider>
          <ApolloProvider client={client}>
            <LanguageProvider>
              <NotificationProvider>
                <AnimatedLayout>
                  <div className="absolute top-0 w-full h-screen bg-gradient-to-b from-blue-50 to-white">
                    {children}
                  </div>
                </AnimatedLayout>
                <NotificationList />
              </NotificationProvider>
            </LanguageProvider>
          </ApolloProvider>
        </CartProvider>
      </body>
    </html>
  );
} 