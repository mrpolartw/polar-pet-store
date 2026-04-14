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
      toast.error("請先選擇要指派的會員等級。")
      return
    }

    try {
      await onSubmit(selectedLevelId)
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "會員等級更新失敗。")
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button type="button" variant="secondary">
          手動調整等級
        </Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <form className="flex h-full flex-col" onSubmit={handleSubmit}>
          <Drawer.Header className="space-y-1">
            <Drawer.Title>手動指派會員等級</Drawer.Title>
            <Drawer.Description>
              後台可直接指定此會員的目前等級，調整結果會寫入稽核紀錄。
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
                      {`${level.name} / 排序 ${level.sort_order} / 升級門檻 ${level.upgrade_threshold}`}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <Text className="text-ui-fg-subtle">
              若之後重新執行自動重算，系統仍會依正式升等規則重新判定適用等級。
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
