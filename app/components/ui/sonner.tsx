"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-center"
      expand={false}
      richColors={false}
      closeButton={false}
      offset={100} // Position above bottom navigation
      toastOptions={{
        style: {
          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(126, 34, 206, 0.2))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(147, 51, 234, 0.3)',
          borderRadius: '16px',
          color: 'rgb(196, 181, 253)',
          fontSize: '14px',
          fontWeight: '500',
          padding: '16px',
          boxShadow: '0 8px 32px rgba(147, 51, 234, 0.3)',
          marginBottom: '8px',
        },
        className: 'toast-custom',
      }}
      {...props}
    />
  );
};

export { Toaster };
