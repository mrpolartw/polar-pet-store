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
      toast.error("請先選擇會員等級")
      return
    }

    try {
      await onSubmit(selectedLevelId)
      setOpen(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "更新會員等級失敗"
      toast.error(message)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button type="button" variant="secondary">
          指派等級
        </Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <form className="flex h-full flex-col" onSubmit={handleSubmit}>
          <Drawer.Header className="space-y-1">
            <Drawer.Title>指派會員等級</Drawer.Title>
            <Drawer.Description>
              請選擇要套用到這位顧客的會員等級。
            </Drawer.Description>
          </Drawer.Header>
          <Drawer.Body className="flex flex-1 flex-col gap-y-5">
            <div className="space-y-2">
              <Label htmlFor="membership-assign-level">會員等級</Label>
              <Select
                value={selectedLevelId}
                onValueChange={setSelectedLevelId}
                disabled={isSubmitting}
              >
                <Select.Trigger id="membership-assign-level">
                  <Select.Value placeholder="請選擇會員等級" />
                </Select.Trigger>
                <Select.Content>
                  {levels.map((level) => (
                    <Select.Item key={level.id} value={level.id}>
                      {`${level.name}（排序 ${level.sort_order} / 門檻 ${level.upgrade_threshold}）`}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <Text className="text-ui-fg-subtle">
              儲存後會立刻更新顧客目前綁定的會員等級。
            </Text>
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button type="button" variant="secondary" disabled={isSubmitting}>
                取消
              </Button>
            </Drawer.Close>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
              儲存
            </Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  )
}
