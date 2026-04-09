import { AdminUpdateCustomerMembership } from "../validators"

describe("AdminUpdateCustomerMembership validator", () => {
  it("accepts phone, birthday, and gender", () => {
    expect(
      AdminUpdateCustomerMembership.parse({
        phone: "0911222333",
        birthday: "1992-06-15",
        gender: "female",
      })
    ).toEqual({
      phone: "0911222333",
      birthday: "1992-06-15",
      gender: "female",
    })
  })

  it("rejects email updates", () => {
    expect(() =>
      AdminUpdateCustomerMembership.parse({
        email: "blocked@example.com",
      })
    ).toThrow()
  })
})
