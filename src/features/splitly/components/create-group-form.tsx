"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import {
  GROUP_ICON_OPTIONS,
  GroupIcon,
  getGroupIconLabel,
} from "@/features/splitly/components/group-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { GroupIcon as GroupIconType } from "@/shared/types";
import { useSplitlyStore } from "@/store/splitly-store";

export function CreateGroupForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const createGroup = useSplitlyStore((state) => state.createGroup);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<GroupIconType>("wallet");
  const [memberNames, setMemberNames] = useState("");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost">
        <Link href="/">
          <ArrowLeft className="size-4" />
          {t("actions.dashboard")}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-md border border-white/20 bg-white/10 text-primary backdrop-blur-xl">
              <Users className="size-5" />
            </span>
            <div>
              <CardTitle className="text-3xl">
                {t("group.createTitle")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("group.createDescription")}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) return;

              const groupId = createGroup({
                name,
                icon,
                memberNames: memberNames.split(/[\n,]+/),
              });
              router.push(`/groups/${groupId}`);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="group-name">{t("group.groupName")}</Label>
              <Input
                id="group-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("group.placeholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("group.icon")}</Label>
              <Select
                value={icon}
                onValueChange={(value) => setIcon(value as GroupIconType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_ICON_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      <span className="flex items-center gap-2">
                        <GroupIcon icon={option} className="size-4" />
                        {getGroupIconLabel(option, t)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="members">{t("group.members")}</Label>
              <Textarea
                id="members"
                value={memberNames}
                onChange={(event) => setMemberNames(event.target.value)}
                placeholder={t("group.membersPlaceholder")}
                className="min-h-32"
              />
              <p className="text-xs text-muted-foreground">
                {t("group.membersHint")}
              </p>
            </div>

            <Button type="submit" className="w-full">
              {t("actions.createGroup")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
