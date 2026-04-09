export const CUSTOMER_MEMBERSHIP_UPDATED_EVENT = "customer-membership:updated"

export type CustomerMembershipUpdatedDetail = {
  customerId: string
}

export function dispatchCustomerMembershipUpdated(customerId: string): void {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent<CustomerMembershipUpdatedDetail>(
      CUSTOMER_MEMBERSHIP_UPDATED_EVENT,
      {
        detail: {
          customerId,
        },
      }
    )
  )
}
