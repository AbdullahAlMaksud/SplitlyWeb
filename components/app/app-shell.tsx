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
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AddExpenseDialog } from "@/components/splitly/add-expense-dialog";
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
import { Separator } from "@/components/ui/separator";
import { initials } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import i18n from "@/lib/i18n";
import { useSplitlyStore } from "@/store/splitly-store";

const swatches = ["#7dd3fc", "#5eead4", "#93c5fd", "#a5b4fc", "#67e8f9"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
  const splitly = useSplitlyStore();
  const { hasHydrated, currentUser, updateCurrentUser } = splitly;
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileColor, setProfileColor] = useState(currentUser.color);
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
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cyan-200 text-slate-950 shadow-lg shadow-cyan-950/15">
              <WalletCards className="size-5" />
            </span>
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
                  <Button
                    className="w-full"
                    onClick={() => {
                      updateCurrentUser({
                        name: profileName,
                        color: profileColor,
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
          <div className="space-y-6">
            <div className="h-10 w-48 rounded-full bg-white/15 backdrop-blur-xl" />
            <div className="glass-panel h-64 rounded-2xl" />
          </div>
        )}
      </main>
    </div>
  );
}
