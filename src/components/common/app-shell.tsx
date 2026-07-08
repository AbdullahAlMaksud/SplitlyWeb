"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Languages,
  Plus,
  PlusCircle,
  Users,
  Palette,
  Check,
  Pin,
  PinOff,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AddExpenseDialog } from "@/features/splitly/components/add-expense-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from "@/shared/lib/currency";
import { initials } from "@/shared/lib/formatters";
import type { CurrencyCode } from "@/shared/types";
import { cn } from "@/shared/lib/utils";
import i18n from "@/shared/lib/i18n";
import { useSplitlyStore } from "@/store/splitly-store";
import { BontonLogo } from "@/components/ui/bonton-logo";

const swatches = ["#7dd3fc", "#5eead4", "#93c5fd", "#a5b4fc", "#67e8f9"];

const themesList = [
  { id: "light", color: "#10b981", label: "লাইট" },
  { id: "dark", color: "#34d399", label: "ডার্ক" },
  { id: "sepia", color: "#c25e00", label: "সেপিয়া" },
  { id: "forest", color: "#15803d", label: "ফরেস্ট" },
  { id: "ocean", color: "#1976d2", label: "ওশান" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
  const hasHydrated = useSplitlyStore((state) => state.hasHydrated);
  const currentUser = useSplitlyStore((state) => state.currentUser);
  const updateCurrentUser = useSplitlyStore((state) => state.updateCurrentUser);

  const [isPinned, setIsPinned] = useState(true);
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileColor, setProfileColor] = useState(currentUser.color);
  const [profileCurrency, setProfileCurrency] = useState<CurrencyCode>(
    currentUser.currency ?? DEFAULT_CURRENCY,
  );
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    Promise.resolve(useSplitlyStore.persist.rehydrate()).finally(() => {
      useSplitlyStore.getState().setHasHydrated(true);
    });
  }, []);

  // Keyboard hotkeys handler (P: pin, D: cycle theme, L: toggle language)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs/textareas
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "p") {
        e.preventDefault();
        setIsPinned((prev) => !prev);
      } else if (key === "d") {
        e.preventDefault();
        const themes = ["light", "dark", "sepia", "forest", "ocean"];
        const currentIndex = themes.indexOf(resolvedTheme || "light");
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
      } else if (key === "l") {
        e.preventDefault();
        const nextLanguage = i18n.resolvedLanguage === "bn" ? "en" : "bn";
        void i18n.changeLanguage(nextLanguage);
        window.localStorage.setItem("splitly-language", nextLanguage);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [resolvedTheme, setTheme]);

  const tooltipClass =
    "absolute right-14 bg-slate-950 text-slate-50 text-[11px] px-2.5 py-1.5 rounded-md font-semibold shadow-md transition-all duration-200 opacity-0 translate-x-2 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 pointer-events-none whitespace-nowrap z-50 border border-slate-800";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent text-foreground">
      {/* Centered Logo and branding (No top header navbar) */}
      <div className="flex flex-col items-center justify-center pt-8 pb-4 gap-2.5 shell-enter select-none">
        <BontonLogo size={48} />
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight text-foreground">Bonton</h1>
          <p className="text-[10px] font-bold text-muted-foreground/75 tracking-widest uppercase mt-0.5">
            {t("app.tagline")}
          </p>
        </div>
      </div>

      {/* Floating Vertical Capsule Pill Bar (Pinnable & Auto-hide) */}
      <nav
        className={cn(
          "fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3 py-4 px-2 rounded-full border border-border bg-card shadow-[0_4px_16px_rgba(0,0,0,0.04)] select-none transition-all duration-300 ease-in-out",
          isPinned
            ? "translate-x-0 opacity-100"
            : "translate-x-[38px] opacity-30 hover:translate-x-0 hover:opacity-100"
        )}
      >
        {/* Pin/Unpin Toggle Button */}
        <button
          type="button"
          onClick={() => setIsPinned(!isPinned)}
          className={cn(
            "flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition relative group cursor-pointer",
            isPinned && "text-primary hover:text-primary-foreground"
          )}
        >
          {isPinned ? <Pin className="size-4.5" /> : <PinOff className="size-4.5" />}
          <span className={tooltipClass}>
            {isPinned
              ? i18n.resolvedLanguage === "bn"
                ? "সাইডবার আনপিন করুন (P)"
                : "Unpin Sidebar (P)"
              : i18n.resolvedLanguage === "bn"
                ? "সাইডবার পিন করুন (P)"
                : "Pin Sidebar (P)"}
          </span>
        </button>

        {/* Dashboard/Home Button */}
        <Link
          href="/"
          className={cn(
            "flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition relative group cursor-pointer",
            pathname === "/" && "bg-primary/10 text-primary hover:bg-primary/15"
          )}
        >
          <LayoutDashboard className="size-4.5" />
          <span className={tooltipClass}>
            {t("nav.dashboard")}
          </span>
        </Link>

        {/* Add Expense Button */}
        <AddExpenseDialog>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition relative group cursor-pointer"
          >
            <Plus className="size-4.5" />
            <span className={tooltipClass}>
              {t("actions.addExpense")}
            </span>
          </button>
        </AddExpenseDialog>

        {/* Create Group Button */}
        <Link
          href="/groups/new"
          className={cn(
            "flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition relative group cursor-pointer",
            pathname.startsWith("/groups/new") && "bg-primary/10 text-primary hover:bg-primary/15"
          )}
        >
          <Users className="size-4.5" />
          <span className={tooltipClass}>
            {t("nav.newGroup")}
          </span>
        </Link>

        {/* Theme Select Popover Wrapper */}
        <div className="relative group/theme flex items-center justify-center size-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition cursor-pointer">
          <Palette className="size-4.5" />
          <span className={tooltipClass}>
            {t("toggles.theme")} (D)
          </span>
          
          {/* Swatch panel showing to the left on hover */}
          <div className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-card border border-border p-2 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-300 opacity-0 translate-x-2 pointer-events-none group-hover/theme:opacity-100 group-hover/theme:translate-x-0 group-hover/theme:pointer-events-auto z-50">
            {themesList.map((tItem) => {
              const isActive = resolvedTheme === tItem.id;
              return (
                <button
                  key={tItem.id}
                  type="button"
                  aria-label={`Switch to ${tItem.id} theme`}
                  onClick={() => setTheme(tItem.id)}
                  className={cn(
                    "size-7 rounded-full border border-transparent transition-all flex items-center justify-center cursor-pointer",
                    isActive ? "border-foreground ring-2 ring-primary/35 scale-110" : "opacity-80 hover:opacity-100 hover:scale-105"
                  )}
                  style={{ backgroundColor: tItem.color }}
                >
                  {isActive && <Check className="size-3 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Button */}
        <button
          type="button"
          onClick={() => {
            const nextLanguage = i18n.resolvedLanguage === "bn" ? "en" : "bn";
            void i18n.changeLanguage(nextLanguage);
            window.localStorage.setItem("splitly-language", nextLanguage);
          }}
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition relative group cursor-pointer"
        >
          <Languages className="size-4.5" />
          <span className={tooltipClass}>
            {t("toggles.language")} (L)
          </span>
        </button>

        {/* User Profile Dialog Trigger (Avatar) */}
        <Dialog
          open={profileOpen}
          onOpenChange={(nextOpen) => {
            if (nextOpen) {
              setProfileName(currentUser.name);
              setProfileColor(currentUser.color);
              setProfileCurrency(currentUser.currency ?? DEFAULT_CURRENCY);
            }
            setProfileOpen(nextOpen);
          }}
        >
          <DialogTrigger asChild>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full transition relative group cursor-pointer focus:outline-none"
            >
              <Avatar className="size-8 border border-border shadow-none">
                <AvatarFallback
                  style={{ backgroundColor: currentUser.color }}
                  className="text-[10px] font-bold text-slate-950"
                >
                  {initials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <span className={tooltipClass}>
                {t("profile.title")}
              </span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("profile.title")}</DialogTitle>
              <DialogDescription>
                {t("profile.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="profile-name">{t("profile.name")}</Label>
                <Input
                  id="profile-name"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("profile.avatarColor")}</Label>
                <div className="flex gap-2">
                  {swatches.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      aria-label={t("profile.useColor", { color: swatch })}
                      onClick={() => setProfileColor(swatch)}
                      className={cn(
                        "size-8 rounded-full border-2 border-transparent cursor-pointer",
                        swatch === profileColor && "border-foreground",
                      )}
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("profile.currency")}</Label>
                <Select
                  value={profileCurrency}
                  onValueChange={(value) =>
                    setProfileCurrency(value as CurrencyCode)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.shortLabel} · {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full cursor-pointer"
                onClick={() => {
                  updateCurrentUser({
                    name: profileName,
                    color: profileColor,
                    currency: profileCurrency,
                  });
                  setProfileOpen(false);
                }}
              >
                {t("actions.saveProfile")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </nav>

      {/* Main Content Area */}
      <main className="section-glide mx-auto min-h-[calc(100vh-8rem)] w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        {hasHydrated ? (
          children
        ) : (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6">
            <BontonLogo size={80} className="animate-spin duration-3000 ease-in-out" />
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold tracking-tight text-foreground/80">
                {i18n.resolvedLanguage === "bn" ? "বন্টন প্রস্তুত করা হচ্ছে..." : "Loading Bonton..."}
              </h3>
              <p className="text-sm text-muted-foreground/60 max-w-[250px]">
                {i18n.resolvedLanguage === "bn"
                  ? "আপনার লোকাল হিসাব-নিকাশ প্রস্তুত করা হচ্ছে"
                  : "Preparing your local-first balance sheets"}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
