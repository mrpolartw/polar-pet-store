import { AdminUpdateCustomerMembership } from "../validators"

describe("AdminUpdateCustomerMembership validator", () => {
  it("accepts phone, birthday, and notion-aligned gender values", () => {
    expect(
      AdminUpdateCustomerMembership.parse({
        phone: "0911222333",
        birthday: "1992-06-15",
        gender: "undisclosed",
      })
    ).toEqual({
      phone: "0911222333",
      birthday: "1992-06-15",
      gender: "undisclosed",
    })
  })

  it("rejects email updates", () => {
    expect(() =>
      AdminUpdateCustomerMembership.parse({
        email: "blocked@example.com",
      })
    ).toThrow()
  })

  it("rejects legacy gender values", () => {
    expect(() =>
      AdminUpdateCustomerMembership.parse({
        gender: "unknown",
      })
    ).toThrow()

    expect(() =>
      AdminUpdateCustomerMembership.parse({
        gender: "other",
      })
    ).toThrow()
  })
})
