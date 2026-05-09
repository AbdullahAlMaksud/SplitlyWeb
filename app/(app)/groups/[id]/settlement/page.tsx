import { SettlementView } from "@/components/splitly/settlement-view"

export default async function SettlementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <SettlementView groupId={id} />
}

