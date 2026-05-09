import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { initials } from "@/lib/formatters"
import type { Member } from "@/lib/types"

export function MemberAvatar({
  member,
  className,
}: {
  member: Member
  className?: string
}) {
  return (
    <Avatar className={className}>
      <AvatarFallback
        style={{ backgroundColor: member.color }}
        className="text-xs font-semibold text-slate-950"
      >
        {initials(member.name)}
      </AvatarFallback>
    </Avatar>
  )
}

