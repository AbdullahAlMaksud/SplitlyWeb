import { ExportView } from "@/components/splitly/export-view"

export default async function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <ExportView groupId={id} />
}

