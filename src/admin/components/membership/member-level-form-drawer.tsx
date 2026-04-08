import {
  Button,
  Drawer,
  Input,
  Label,
  Switch,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useEffect, useState, type FormEvent } from "react"
import { parseOptionalJson, stringifyJson } from "../../lib/membership/utils"
import type {
  MemberLevelPayload,
  MemberLevelUpdatePayload,
  MembershipLevel,
} from "../../lib/membership/types"

interface MemberLevelFormDrawerProps {
  title: string
  description: string
  triggerLabel: string
  initialValue?: MembershipLevel | null
  isSubmitting?: boolean
  onSubmit: (
    payload: MemberLevelPayload | MemberLevelUpdatePayload
  ) => Promise<void>
}

export function MemberLevelFormDrawer({
  title,
  description,
  triggerLabel,
  initialValue,
  isSubmitting = false,
  onSubmit,
}: MemberLevelFormDrawerProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initialValue?.name ?? "")
  const [rank, setRank] = useState(String(initialValue?.rank ?? 0))
  const [minPoints, setMinPoints] = useState(
    String(initialValue?.min_points ?? 0)
  )
  const [discountRate, setDiscountRate] = useState(
    String(initialValue?.discount_rate ?? 0)
  )
  const [benefits, setBenefits] = useState(
    initialValue?.benefits ? stringifyJson(initialValue.benefits) : ""
  )
  const [isActive, setIsActive] = useState(initialValue?.is_active ?? true)

  useEffect(() => {
    if (!open) {
      setName(initialValue?.name ?? "")
      setRank(String(initialValue?.rank ?? 0))
      setMinPoints(String(initialValue?.min_points ?? 0))
      setDiscountRate(String(initialValue?.discount_rate ?? 0))
      setBenefits(initialValue?.benefits ? stringifyJson(initialValue.benefits) : "")
      setIsActive(initialValue?.is_active ?? true)
    }
  }, [initialValue, open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      toast.error("Name is required")
      return
    }

    try {
      const payload = {
        name: name.trim(),
        rank: Number(rank || 0),
        min_points: Number(minPoints || 0),
        discount_rate: Number(discountRate || 0),
        benefits: parseOptionalJson(benefits),
        is_active: isActive,
      }

      await onSubmit(payload)
      setOpen(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save member level"
      toast.error(message)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button type="button" variant={initialValue ? "secondary" : "primary"}>
          {triggerLabel}
        </Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <form className="flex h-full flex-col" onSubmit={handleSubmit}>
          <Drawer.Header className="space-y-1">
            <Drawer.Title>{title}</Drawer.Title>
            <Drawer.Description>{description}</Drawer.Description>
          </Drawer.Header>
          <Drawer.Body className="flex flex-1 flex-col gap-y-5">
            <div className="space-y-2">
              <Label htmlFor={`${title}-name`}>Name</Label>
              <Input
                id={`${title}-name`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`${title}-rank`}>Rank</Label>
                <Input
                  id={`${title}-rank`}
                  type="number"
                  value={rank}
                  onChange={(event) => setRank(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${title}-min-points`}>Min points</Label>
                <Input
                  id={`${title}-min-points`}
                  type="number"
                  value={minPoints}
                  onChange={(event) => setMinPoints(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${title}-discount-rate`}>Discount rate</Label>
                <Input
                  id={`${title}-discount-rate`}
                  type="number"
                  value={discountRate}
                  onChange={(event) => setDiscountRate(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${title}-benefits`}>Benefits JSON</Label>
              <Textarea
                id={`${title}-benefits`}
                rows={8}
                value={benefits}
                onChange={(event) => setBenefits(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-ui-border-base px-4 py-3">
              <div>
                <Label htmlFor={`${title}-is-active`}>Active</Label>
              </div>
              <Switch
                id={`${title}-is-active`}
                checked={isActive}
                onCheckedChange={setIsActive}
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
