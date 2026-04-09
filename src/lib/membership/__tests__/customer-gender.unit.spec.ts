import { CUSTOMER_GENDERS } from "../customer-gender"

describe("customer gender contract", () => {
  it("matches the notion-aligned enum values", () => {
    expect(CUSTOMER_GENDERS).toEqual(["male", "female", "undisclosed"])
  })
})
