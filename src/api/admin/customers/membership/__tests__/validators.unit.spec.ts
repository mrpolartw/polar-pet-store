import { AdminUpdateCustomerMembership } from "../validators"

describe("AdminUpdateCustomerMembership validator", () => {
  it("accepts phone, birthday, and notion-aligned gender values", () => {
    expect(
      AdminUpdateCustomerMembership.parse({
        phone: "0911222333",
        birthday: "1992-06-15",
        gender: "other",
      })
    ).toEqual({
      phone: "0911222333",
      birthday: "1992-06-15",
      gender: "other",
    })
  })

  it("rejects email updates", () => {
    expect(() =>
      AdminUpdateCustomerMembership.parse({
        email: "blocked@example.com",
      })
    ).toThrow()
  })

  it("rejects the legacy unknown gender value", () => {
    expect(() =>
      AdminUpdateCustomerMembership.parse({
        gender: "unknown",
      })
    ).toThrow()
  })
})
