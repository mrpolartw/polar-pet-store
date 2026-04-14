import { Button, Drawer, Input, Label, Text, Textarea, toast } from "@medusajs/ui"
import { useState, type FormEvent } from "react"

interface AdjustPointsDrawerProps {
  isSubmitting?: boolean
  onSubmit: (payload: {
    delta: number
    note?: string | null
    expired_at?: string | null
  }) => Promise<void>
}

export function AdjustPointsDrawer({
  isSubmitting = false,
  onSubmit,
}: AdjustPointsDrawerProps) {
  const [open, setOpen] = useState(false)
  const [delta, setDelta] = useState("")
  const [note, setNote] = useState("")
  const [expiredAt, setExpiredAt] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const numericDelta = Number(delta)

    if (!Number.isFinite(numericDelta) || numericDelta === 0) {
      toast.error("點數異動不可為 0")
      return
    }

    if (numericDelta > 0 && !expiredAt) {
      toast.error("新增點數時，請選擇到期日期")
      return
    }

    try {
      await onSubmit({
        delta: numericDelta,
        note: note.trim() ? note.trim() : null,
        expired_at: numericDelta > 0 ? expiredAt || null : null,
      })
      setDelta("")
      setNote("")
      setExpiredAt("")
      setOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "調整點數失敗"
      toast.error(message)
    }
  }

  const isPositiveAdjustment = Number(delta) > 0

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button type="button">調整點數</Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <form className="flex h-full flex-col" onSubmit={handleSubmit}>
          <Drawer.Header className="space-y-1">
            <Drawer.Title>調整點數</Drawer.Title>
            <Drawer.Description>
              正數代表新增點數，負數代表扣除點數。新增點數時需指定到期日期，扣點紀錄則會以扣除當天視為異動日期。
            </Drawer.Description>
          </Drawer.Header>
          <Drawer.Body className="flex flex-1 flex-col gap-y-5">
            <div className="space-y-2">
              <Label htmlFor="membership-adjust-points-delta">點數異動</Label>
              <Input
                id="membership-adjust-points-delta"
                type="number"
                value={delta}
                onChange={(event) => setDelta(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="membership-adjust-points-expired-at">
                到期日期
              </Label>
              <Input
                id="membership-adjust-points-expired-at"
                type="date"
                value={expiredAt}
                onChange={(event) => setExpiredAt(event.target.value)}
                disabled={isSubmitting || !isPositiveAdjustment}
              />
              <Text size="small" className="text-ui-fg-subtle">
                {isPositiveAdjustment
                  ? "新增點數時必填。"
                  : "扣除點數不需要設定到期日期。"}
              </Text>
            </div>

            <div className="space-y-2">
              <Label htmlFor="membership-adjust-points-note">備註</Label>
              <Textarea
                id="membership-adjust-points-note"
                rows={6}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
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
