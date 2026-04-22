import React, { createContext, useContext, useState, useEffect } from "react";

export type Notification = {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
  date: string;
  read: boolean;
};

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (message: string, type?: "info" | "success" | "warning") => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('nexahr_notifications');
    if (stored) {
      try { setNotifications(JSON.parse(stored)); } catch (e) {}
    }
    
    // Support multi-tab sync for Event-Driven architecture feel
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nexahr_notifications') {
        const val = localStorage.getItem('nexahr_notifications');
        if (val) setNotifications(JSON.parse(val));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const save = (newNotifs: Notification[]) => {
    setNotifications(newNotifs);
    localStorage.setItem('nexahr_notifications', JSON.stringify(newNotifs));
  };

  const addNotification = (message: string, type: "info" | "success" | "warning" = "info") => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      date: new Date().toISOString(),
      read: false
    };
    // Keep last 50 notifications
    save([newNotif, ...notifications].slice(0, 50));
  };

  const markAllAsRead = () => {
    save(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification, markAllAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
}
