import { Button, Drawer, Label, Select, Text, toast } from "@medusajs/ui"
import { useEffect, useState, type FormEvent } from "react"
import type { MembershipLevelSummary } from "../../lib/membership/types"

interface AssignLevelDrawerProps {
  levels: MembershipLevelSummary[]
  currentLevelId?: string | null
  isSubmitting?: boolean
  onSubmit: (memberLevelId: string) => Promise<void>
}

export function AssignLevelDrawer({
  levels,
  currentLevelId,
  isSubmitting = false,
  onSubmit,
}: AssignLevelDrawerProps) {
  const [open, setOpen] = useState(false)
  const [selectedLevelId, setSelectedLevelId] = useState(currentLevelId ?? "")

  useEffect(() => {
    if (!open) {
      setSelectedLevelId(currentLevelId ?? "")
    }
  }, [currentLevelId, open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedLevelId) {
      toast.error("Please choose a member level")
      return
    }

    try {
      await onSubmit(selectedLevelId)
      setOpen(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to assign member level"
      toast.error(message)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button type="button" variant="secondary">
          Assign level
        </Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <form className="flex h-full flex-col" onSubmit={handleSubmit}>
          <Drawer.Header className="space-y-1">
            <Drawer.Title>Assign member level</Drawer.Title>
            <Drawer.Description>
              Manually update the linked membership level for this customer.
            </Drawer.Description>
          </Drawer.Header>
          <Drawer.Body className="flex flex-1 flex-col gap-y-5">
            <div className="space-y-2">
              <Label htmlFor="membership-assign-level">Member level</Label>
              <Select
                value={selectedLevelId}
                onValueChange={setSelectedLevelId}
                disabled={isSubmitting}
              >
                <Select.Trigger id="membership-assign-level">
                  <Select.Value placeholder="Select a level" />
                </Select.Trigger>
                <Select.Content>
                  {levels.map((level) => (
                    <Select.Item key={level.id} value={level.id}>
                      {`${level.name} (rank ${level.rank}, min ${level.min_points})`}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <Text className="text-ui-fg-subtle">
              The current linked level will be replaced once you save.
            </Text>
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button type="button" variant="secondary" disabled={isSubmitting}>
                Cancel
              </Button>
            </Drawer.Close>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
              Save
            </Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  )
}
