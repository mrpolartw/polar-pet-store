import {
  Button,
  Drawer,
  Input,
  Label,
  Switch,
  toast,
} from "@medusajs/ui"
import { useEffect, useState, type FormEvent } from "react"
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
  const [sortOrder, setSortOrder] = useState(
    String(initialValue?.sort_order ?? 0)
  )
  const [rewardRate, setRewardRate] = useState(
    String(initialValue?.reward_rate ?? 0)
  )
  const [birthdayRewardRate, setBirthdayRewardRate] = useState(
    String(initialValue?.birthday_reward_rate ?? 0)
  )
  const [upgradeGiftPoints, setUpgradeGiftPoints] = useState(
    String(initialValue?.upgrade_gift_points ?? 0)
  )
  const [upgradeThreshold, setUpgradeThreshold] = useState(
    String(initialValue?.upgrade_threshold ?? 0)
  )
  const [autoUpgrade, setAutoUpgrade] = useState(
    initialValue?.auto_upgrade ?? false
  )
  const [canJoinEvent, setCanJoinEvent] = useState(
    initialValue?.can_join_event ?? false
  )
  const [isActive, setIsActive] = useState(initialValue?.is_active ?? true)

  useEffect(() => {
    if (!open) {
      setName(initialValue?.name ?? "")
      setSortOrder(String(initialValue?.sort_order ?? 0))
      setRewardRate(String(initialValue?.reward_rate ?? 0))
      setBirthdayRewardRate(String(initialValue?.birthday_reward_rate ?? 0))
      setUpgradeGiftPoints(String(initialValue?.upgrade_gift_points ?? 0))
      setUpgradeThreshold(String(initialValue?.upgrade_threshold ?? 0))
      setAutoUpgrade(initialValue?.auto_upgrade ?? false)
      setCanJoinEvent(initialValue?.can_join_event ?? false)
      setIsActive(initialValue?.is_active ?? true)
    }
  }, [initialValue, open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      toast.error("請輸入會員等級名稱")
      return
    }

    try {
      const payload = {
        name: name.trim(),
        sort_order: Number(sortOrder || 0),
        reward_rate: Number(rewardRate || 0),
        birthday_reward_rate: Number(birthdayRewardRate || 0),
        upgrade_gift_points: Number(upgradeGiftPoints || 0),
        upgrade_threshold: Number(upgradeThreshold || 0),
        auto_upgrade: autoUpgrade,
        can_join_event: canJoinEvent,
        is_active: isActive,
      }

      await onSubmit(payload)
      setOpen(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "儲存會員等級失敗"
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
              <Label htmlFor={`${title}-name`}>等級名稱</Label>
              <Input
                id={`${title}-name`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${title}-sort-order`}>排序</Label>
                <Input
                  id={`${title}-sort-order`}
                  type="number"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${title}-upgrade-threshold`}>升級門檻</Label>
                <Input
                  id={`${title}-upgrade-threshold`}
                  type="number"
                  value={upgradeThreshold}
                  onChange={(event) => setUpgradeThreshold(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`${title}-reward-rate`}>回饋倍率</Label>
                <Input
                  id={`${title}-reward-rate`}
                  type="number"
                  value={rewardRate}
                  onChange={(event) => setRewardRate(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${title}-birthday-reward-rate`}>
                  生日回饋倍率
                </Label>
                <Input
                  id={`${title}-birthday-reward-rate`}
                  type="number"
                  value={birthdayRewardRate}
                  onChange={(event) =>
                    setBirthdayRewardRate(event.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${title}-upgrade-gift-points`}>
                  升級贈點
                </Label>
                <Input
                  id={`${title}-upgrade-gift-points`}
                  type="number"
                  value={upgradeGiftPoints}
                  onChange={(event) => setUpgradeGiftPoints(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg border border-ui-border-base px-4 py-3">
                <div>
                  <Label htmlFor={`${title}-auto-upgrade`}>自動升級</Label>
                </div>
                <Switch
                  id={`${title}-auto-upgrade`}
                  checked={autoUpgrade}
                  onCheckedChange={setAutoUpgrade}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-ui-border-base px-4 py-3">
                <div>
                  <Label htmlFor={`${title}-can-join-event`}>
                    可參與活動
                  </Label>
                </div>
                <Switch
                  id={`${title}-can-join-event`}
                  checked={canJoinEvent}
                  onCheckedChange={setCanJoinEvent}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-ui-border-base px-4 py-3">
                <div>
                  <Label htmlFor={`${title}-is-active`}>啟用</Label>
                </div>
                <Switch
                  id={`${title}-is-active`}
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={isSubmitting}
                />
              </div>
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
