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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" href="/pwa.png" />
      </head>
      <body className="h-screen">
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
      </body>
    </html>
  );
} 