"use client";
import React from "react";
// import { AnimatedLayout } from "@/components/ui/animated-layout";
// import { LanguageProvider } from "@/contexts/LanguageContext";
// import { NotificationProvider } from "@/contexts/NotificationContext";
// import { NotificationList } from "@/components/ui/notification-list";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {/* <NotificationProvider>
            <AnimatedLayout> */}
              {children}
            {/* </AnimatedLayout>
            <NotificationList />
          </NotificationProvider>*/}
        </LanguageProvider> 
      </body>
    </html>
  );
} 