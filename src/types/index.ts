export interface BilingualText {
    en: string;
    es: string;
  }
  
  export interface User {
    id: string;
    name: string;
    email: string;
    status: string;
    paymentStatus: string;
  }
  
  export type NotificationType = "success" | "error" | "warning" | "info";
  
  export interface Notification {
    id: string;
    type: NotificationType;
    message: BilingualText | string;
    duration?: number;
  } 