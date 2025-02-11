"use client";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationList() {
  const { notifications, removeNotification } = useNotificationContext();
  const { language } = useLanguageContext();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <ul className="flex flex-col gap-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              layout
              style={{ listStyle: 'none' }}
            >
              <div
                className={cn(
                  "p-4 rounded-lg shadow-lg min-w-[300px] max-w-md relative",
                  notification.type === 'success' && "bg-green-100 border border-green-200",
                  notification.type === 'error' && "bg-red-100 border border-red-200",
                  notification.type === 'warning' && "bg-yellow-100 border border-yellow-200",
                  notification.type === 'info' && "bg-blue-100 border border-blue-200"
                )}
              >
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
                <p className={cn(
                  "text-sm",
                  notification.type === 'success' && "text-green-800",
                  notification.type === 'error' && "text-red-800",
                  notification.type === 'warning' && "text-yellow-800",
                  notification.type === 'info' && "text-blue-800"
                )}>
                  {typeof notification.message === 'string' 
                    ? notification.message 
                    : notification.message[language]
                  }
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
} 