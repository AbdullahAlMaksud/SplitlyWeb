"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Languages,
  Moon,
  Plus,
  PlusCircle,
  Sun,
  Users,
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
import { Separator } from "@/components/ui/separator";
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from "@/shared/lib/currency";
import { initials } from "@/shared/lib/formatters";
import type { CurrencyCode } from "@/shared/types";
import { cn } from "@/shared/lib/utils";
import i18n from "@/shared/lib/i18n";
import { useSplitlyStore } from "@/store/splitly-store";
import { AnimatedLogo } from "@/components/ui/animated-logo";

const swatches = ["#7dd3fc", "#5eead4", "#93c5fd", "#a5b4fc", "#67e8f9"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
  const hasHydrated = useSplitlyStore((state) => state.hasHydrated);
  const currentUser = useSplitlyStore((state) => state.currentUser);
  const updateCurrentUser = useSplitlyStore((state) => state.updateCurrentUser);
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileColor, setProfileColor] = useState(currentUser.color);
  const [profileCurrency, setProfileCurrency] = useState<CurrencyCode>(
    currentUser.currency ?? DEFAULT_CURRENCY,
  );
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { href: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/groups/new", label: t("nav.newGroup"), icon: PlusCircle },
  ];

  useEffect(() => {
    Promise.resolve(useSplitlyStore.persist.rehydrate()).finally(() => {
      useSplitlyStore.getState().setHasHydrated(true);
    });
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent text-foreground">
      <header className="shell-enter sticky top-3 z-30 px-3 md:px-6">
        <div className="glass-nav mx-auto flex h-16 w-full max-w-7xl items-center gap-3 rounded-full px-3 md:h-18 md:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <AnimatedLogo size={40} />
            <span className="min-w-0">
              <span className="block text-xl font-semibold leading-none">
                Splitly
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {t("app.tagline")}
              </span>
            </span>
          </Link>

          <nav className="ml-3 hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground transition hover:bg-white/15 hover:text-foreground",
                    active &&
                      "bg-white/20 text-foreground shadow-sm dark:bg-white/10",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <AddExpenseDialog>
              <Button variant="outline" className="hidden sm:inline-flex">
                <Plus className="size-4" />
                {t("actions.expense")}
              </Button>
            </AddExpenseDialog>
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/groups/new">
                <Users className="size-4" />
                {t("actions.group")}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("toggles.language")}
              onClick={() => {
                const nextLanguage =
                  i18n.resolvedLanguage === "bn" ? "en" : "bn";
                void i18n.changeLanguage(nextLanguage);
                window.localStorage.setItem("splitly-language", nextLanguage);
              }}
            >
              <Languages className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("toggles.theme")}
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              <span className="relative size-5">
                <Sun className="absolute inset-0 hidden size-5 dark:block" />
                <Moon className="absolute inset-0 size-5 dark:hidden" />
              </span>
            </Button>
            <Separator
              orientation="vertical"
              className="mx-1 hidden h-8 bg-white/20 sm:block"
            />
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
                  className="rounded-full outline-none ring-ring transition focus-visible:ring-2"
                  aria-label={t("profile.editAria")}
                >
                  <Avatar className="size-10 border border-white/20 shadow-sm">
                    <AvatarFallback
                      style={{ backgroundColor: currentUser.color }}
                      className="text-sm font-semibold text-slate-950"
                    >
                      {initials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
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
                            "size-8 rounded-full border-2 border-transparent",
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
                    className="w-full"
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
          </div>
        </div>
      </header>

      <main className="section-glide mx-auto min-h-[calc(100vh-5rem)] w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">
        {hasHydrated ? (
          children
        ) : (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6">
            <AnimatedLogo size={80} loop={true} />
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold tracking-tight text-foreground/80">
                {i18n.resolvedLanguage === "bn" ? "লোড হচ্ছে..." : "Loading Splitly..."}
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
