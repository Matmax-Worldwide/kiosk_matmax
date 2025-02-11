"use client";
import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { Notification, NotificationType, BilingualText } from "@/types";

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: BilingualText | string, type: NotificationType, duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const removeNotificationRef = useRef((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  });

  const removeNotification = useCallback((id: string) => {
    removeNotificationRef.current(id);
  }, []);

  const addNotification = useCallback((
    message: BilingualText | string,
    type: NotificationType = "info",
    duration = 5000
  ) => {
    const id = Math.random().toString(36).substring(2);
    const notification: Notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotificationRef.current(id);
      }, duration);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
} 