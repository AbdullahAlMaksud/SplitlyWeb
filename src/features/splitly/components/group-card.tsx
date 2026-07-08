"use client";

import Link from "next/link";
import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { formatDate } from "@/shared/lib/formatters";
import type { Expense, Group } from "@/shared/types";
import { GroupIcon } from "@/features/splitly/components/group-icon";
import { MemberAvatar } from "@/features/splitly/components/member-avatar";

export const GroupCard = memo(function GroupCard({
  group,
  expenses,
  balanceCents,
}: {
  group: Group;
  expenses: Expense[];
  balanceCents: number;
}) {
  const { t } = useTranslation();
  const visibleMembers = group.members.slice(0, 3);
  const hiddenCount = Math.max(group.members.length - visibleMembers.length, 0);
  const lastActivity = expenses[0]?.createdAt ?? group.createdAt;

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="section-glide h-full border-border bg-card hover:bg-accent/40 transition-colors duration-200 motion-safe:[animation-delay:180ms]">
        <CardContent className="flex h-full min-h-48 flex-col p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md border border-border bg-muted text-primary">
                <GroupIcon icon={group.icon} className="size-5" />
              </span>
              <div>
                <h3 className="text-xl font-semibold leading-7">
                  {group.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("group.lastActive", { date: formatDate(lastActivity) })}
                </p>
              </div>
            </div>
            {balanceCents === 0 ? (
              <Badge variant="secondary">{t("group.settled")}</Badge>
            ) : balanceCents > 0 ? (
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                {t("table.owedStatus")} <CurrencyAmount cents={balanceCents} />
              </Badge>
            ) : (
              <Badge className="bg-red-500/15 text-red-200 hover:bg-red-500/15">
                {t("table.owesStatus")}{" "}
                <CurrencyAmount cents={Math.abs(balanceCents)} />
              </Badge>
            )}
          </div>

          <div className="mt-auto flex items-center pt-8">
            <div className="flex -space-x-2">
              {visibleMembers.map((member) => (
                <MemberAvatar
                  key={member.id}
                  member={member}
                  className="size-8 border-2 border-background"
                />
              ))}
              {hiddenCount > 0 ? (
                <span className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold">
                  +{hiddenCount}
                </span>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});
