"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "next-themes";

import { TooltipProvider } from "@/components/ui/tooltip";
import i18n from "@/shared/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("splitly-language");
    if (savedLanguage === "bn" || savedLanguage === "en") {
      void i18n.changeLanguage(savedLanguage);
    }
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
