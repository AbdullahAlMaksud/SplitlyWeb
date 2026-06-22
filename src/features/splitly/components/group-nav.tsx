"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Download, ListChecks, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";

export function GroupNav({ groupId }: { groupId: string }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const items = [
    {
      href: `/groups/${groupId}`,
      label: t("nav.detail"),
      icon: ReceiptText,
      active: pathname === `/groups/${groupId}`,
    },
    {
      href: `/groups/${groupId}/settlement`,
      label: t("nav.settlement"),
      icon: ListChecks,
      active: pathname === `/groups/${groupId}/settlement`,
    },
    {
      href: `/groups/${groupId}/export`,
      label: t("nav.export"),
      icon: Download,
      active: pathname === `/groups/${groupId}/export`,
    },
  ];

  return (
    <div className="glass-nav flex flex-wrap gap-1 rounded-full p-1">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Button
            key={item.href}
            asChild
            variant={item.active ? "secondary" : "ghost"}
            size="sm"
          >
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
