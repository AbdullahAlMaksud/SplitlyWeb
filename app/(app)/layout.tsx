import { AppShell } from "@/components/app/app-shell"

export default function SplitlyLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <AppShell>{children}</AppShell>
}

