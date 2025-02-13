"use client";
import React from "react";
import { AnimatedLayout } from "@/components/animated-layout";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { NotificationList } from "@/components/notification-list";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ApolloProvider } from "@apollo/client";
import { client } from "@/lib/apolloClient";
import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="h-screen">
        <ApolloProvider client={client}>
          <LanguageProvider>
            <NotificationProvider>
              <AnimatedLayout>
                <div className="absolute top-0 w-full h-screen">
                  {children}
                </div>
              </AnimatedLayout>
              <NotificationList />
            </NotificationProvider>
          </LanguageProvider>
        </ApolloProvider>
        <Toaster />
      </body>
    </html>
  );
} 