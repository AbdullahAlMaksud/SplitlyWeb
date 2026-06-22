"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MemberAvatar } from "@/features/splitly/components/member-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSplitlyStore } from "@/store/splitly-store";
import type { Group } from "@/shared/types";

export function MemberList({ group }: { group: Group }) {
  const addMember = useSplitlyStore((state) => state.addMember);
  const removeMember = useSplitlyStore((state) => state.removeMember);
  const updateMember = useSplitlyStore((state) => state.updateMember);
  const currentUserId = useSplitlyStore((state) => state.currentUser.id);
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("members.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {group.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-md border border-white/15 bg-white/10 p-3 backdrop-blur-xl"
            >
              <MemberAvatar member={member} className="size-9" />
              {editingId === member.id ? (
                <Input
                  className="h-7 flex-1 text-sm"
                  value={editingName}
                  autoFocus
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (editingName.trim()) {
                        updateMember(group.id, member.id, {
                          name: editingName,
                          color: member.color,
                        });
                      }
                      setEditingId(null);
                    }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
              ) : (
                <span className="min-w-0 flex-1 font-medium">
                  {member.name}
                </span>
              )}
              {editingId === member.id ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      if (editingName.trim()) {
                        updateMember(group.id, member.id, {
                          name: editingName,
                          color: member.color,
                        });
                      }
                      setEditingId(null);
                    }}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("members.editAria", { name: member.name })}
                    onClick={() => {
                      setEditingId(member.id);
                      setEditingName(member.name);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("members.removeAria", { name: member.name })}
                    disabled={member.id === currentUserId}
                    onClick={() => {
                      const removed = removeMember(group.id, member.id);
                      setMessage(
                        removed
                          ? t("members.removedMessage", { name: member.name })
                          : t("members.cannotRemove"),
                      );
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
        {message ? (
          <p className="text-xs text-muted-foreground">{message}</p>
        ) : null}
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            addMember(group.id, name);
            setName("");
          }}
        >
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("members.addPlaceholder")}
          />
          <Button type="submit" size="icon" aria-label={t("members.addAria")}>
            <Plus className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
