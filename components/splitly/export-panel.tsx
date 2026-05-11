"use client";

import { useMemo, useState } from "react";
import { Check, Clipboard, Download, FileText, LinkIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { downloadTextFile } from "@/lib/export/download";
import { generateMarkdownReport } from "@/lib/export/markdown";
import { downloadPdfReport } from "@/lib/export/pdf";
import type { Expense, Group, SettlementTransaction } from "@/lib/types";
import { useSplitlyStore } from "@/store/splitly-store";

export function ExportPanel({
  group,
  expenses,
  settlements,
}: {
  group: Group;
  expenses: Expense[];
  settlements: SettlementTransaction[];
}) {
  const { t } = useTranslation();
  const currency = useSplitlyStore(
    (state) => state.currentUser.currency ?? DEFAULT_CURRENCY,
  );
  const [copied, setCopied] = useState<"markdown" | "link" | null>(null);
  const markdown = useMemo(
    () => generateMarkdownReport({ group, expenses, settlements, currency }),
    [currency, group, expenses, settlements],
  );
  const filename = `${group.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-splitly-report.md`;

  const markCopied = (value: "markdown" | "link") => {
    setCopied(value);
    window.setTimeout(() => setCopied(null), 1400);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("export.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Button
            onClick={() =>
              downloadTextFile(
                filename,
                markdown,
                "text/markdown;charset=utf-8",
              )
            }
          >
            <FileText className="size-4" />
            {t("actions.downloadMd")}
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(markdown);
              markCopied("markdown");
            }}
          >
            {copied === "markdown" ? (
              <Check className="size-4" />
            ) : (
              <Clipboard className="size-4" />
            )}
            {copied === "markdown" ? t("actions.copied") : t("actions.copyMd")}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              downloadPdfReport({ group, expenses, settlements, currency })
            }
          >
            <Download className="size-4" />
            {t("actions.downloadPdf")}
          </Button>
        </div>

        <div className="rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{t("export.shareLink")}</p>
              <p className="text-sm text-muted-foreground">
                {t("export.shareHint")}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                const path = `/groups/${group.id}`;
                const url = `${window.location.origin}${path}`;
                await navigator.clipboard.writeText(url);
                markCopied("link");
              }}
            >
              {copied === "link" ? (
                <Check className="size-4" />
              ) : (
                <LinkIcon className="size-4" />
              )}
              {copied === "link" ? t("actions.copied") : t("actions.copyLink")}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">
              {t("export.markdownPreview")}
            </TabsTrigger>
            <TabsTrigger value="raw">{t("export.raw")}</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="mt-4">
            <pre className="max-h-105 overflow-auto rounded-md border border-white/15 bg-black/20 p-4 text-sm leading-6 text-muted-foreground backdrop-blur-xl">
              {markdown}
            </pre>
          </TabsContent>
          <TabsContent value="raw" className="mt-4">
            <textarea
              readOnly
              value={markdown}
              className="min-h-105 w-full resize-none rounded-md border border-white/15 bg-black/20 p-4 font-mono text-sm text-foreground backdrop-blur-xl"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
