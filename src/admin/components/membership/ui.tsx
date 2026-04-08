import { Button, Container, Heading, Text } from "@medusajs/ui"
import type { ReactNode } from "react"

interface SectionCardProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

interface StatePanelProps {
  title: string
  message: string
  action?: ReactNode
}

interface PaginationControlsProps {
  count: number
  limit: number
  offset: number
  isLoading?: boolean
  onPrevious: () => void
  onNext: () => void
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: SectionCardProps) {
  return (
    <Container className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <Heading>{title}</Heading>
          {description ? (
            <Text className="text-ui-fg-subtle">{description}</Text>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </Container>
  )
}

export function StatePanel({ title, message, action }: StatePanelProps) {
  return (
    <Container className="flex flex-col gap-y-3 py-8">
      <Heading>{title}</Heading>
      <Text className="text-ui-fg-subtle">{message}</Text>
      {action ? <div>{action}</div> : null}
    </Container>
  )
}

export function PaginationControls({
  count,
  limit,
  offset,
  isLoading = false,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  const page = Math.floor(offset / limit) + 1
  const totalPages = Math.max(1, Math.ceil(count / limit))
  const start = count === 0 ? 0 : offset + 1
  const end = Math.min(offset + limit, count)

  return (
    <div className="flex flex-col gap-y-3 border-t border-ui-border-base pt-4 md:flex-row md:items-center md:justify-between">
      <Text className="text-ui-fg-subtle">
        {count === 0 ? "No results" : `${start}-${end} of ${count}`}
      </Text>
      <div className="flex items-center gap-x-2">
        <Text className="text-ui-fg-subtle">{`Page ${page} / ${totalPages}`}</Text>
        <Button
          type="button"
          variant="secondary"
          size="small"
          disabled={isLoading || offset <= 0}
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="small"
          disabled={isLoading || offset + limit >= count}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
