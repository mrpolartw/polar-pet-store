import { Button, Drawer, Input, Label, Textarea, toast } from "@medusajs/ui"
import { useState, type FormEvent } from "react"

interface AdjustPointsDrawerProps {
  isSubmitting?: boolean
  onSubmit: (payload: { delta: number; note?: string | null }) => Promise<void>
}

export function AdjustPointsDrawer({
  isSubmitting = false,
  onSubmit,
}: AdjustPointsDrawerProps) {
  const [open, setOpen] = useState(false)
  const [delta, setDelta] = useState("")
  const [note, setNote] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const numericDelta = Number(delta)

    if (!Number.isFinite(numericDelta) || numericDelta === 0) {
      toast.error("點數異動必須是非 0 的數字")
      return
    }

    try {
      await onSubmit({
        delta: numericDelta,
        note: note.trim() ? note.trim() : null,
      })
      setDelta("")
      setNote("")
      setOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "更新點數失敗"
      toast.error(message)
    }
  }

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
              請輸入這位顧客的點數增減值，正數代表增加，負數代表扣減。
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
