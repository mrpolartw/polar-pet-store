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
      toast.error("Delta must be a non-zero number")
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
      const message =
        error instanceof Error ? error.message : "Failed to adjust points"
      toast.error(message)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button type="button">Adjust points</Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <form className="flex h-full flex-col" onSubmit={handleSubmit}>
          <Drawer.Header className="space-y-1">
            <Drawer.Title>Adjust points</Drawer.Title>
            <Drawer.Description>
              Add or deduct points for this customer.
            </Drawer.Description>
          </Drawer.Header>
          <Drawer.Body className="flex flex-1 flex-col gap-y-5">
            <div className="space-y-2">
              <Label htmlFor="membership-adjust-points-delta">Delta</Label>
              <Input
                id="membership-adjust-points-delta"
                type="number"
                value={delta}
                onChange={(event) => setDelta(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="membership-adjust-points-note">Note</Label>
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
