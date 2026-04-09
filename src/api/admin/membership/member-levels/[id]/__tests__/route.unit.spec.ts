import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { DELETE, PATCH } from "../route"
import { getMembershipService } from "../../../helpers"
import {
  assertMemberLevelCanBeDeleted,
  retrieveAdminMemberLevel,
} from "../../../../../../lib/membership/admin-member-levels"
import type { AdminUpdateMemberLevelType } from "../../../validators"

jest.mock("../../../helpers", () => ({
  getMembershipService: jest.fn(),
}))

jest.mock("../../../../../../lib/membership/admin-member-levels", () => ({
  assertMemberLevelCanBeDeleted: jest.fn(),
  retrieveAdminMemberLevel: jest.fn(),
}))

const getMembershipServiceMock = jest.mocked(getMembershipService)
const assertMemberLevelCanBeDeletedMock = jest.mocked(
  assertMemberLevelCanBeDeleted
)
const retrieveAdminMemberLevelMock = jest.mocked(retrieveAdminMemberLevel)

describe("admin membership member level detail route", () => {
  const membershipService = {
    updateMemberLevel: jest.fn(),
    deleteMemberLevel: jest.fn(),
  }

  function createResponse() {
    const status = jest.fn().mockReturnThis()
    const json = jest.fn()

    return {
      status,
      json,
    } as unknown as MedusaResponse
  }

  beforeEach(() => {
    jest.clearAllMocks()
    getMembershipServiceMock.mockReturnValue(membershipService as never)
  })

  it("returns the refreshed member level after PATCH", async () => {
    retrieveAdminMemberLevelMock.mockResolvedValue({
      id: "level_vip",
      name: "VIP",
      sort_order: 10,
      reward_rate: 2,
      birthday_reward_rate: 3,
      upgrade_gift_points: 500,
      upgrade_threshold: 10000,
      auto_upgrade: true,
      can_join_event: true,
      is_active: false,
      member_count: 5,
    } as never)

    const req = {
      scope: {},
      params: {
        id: "level_vip",
      },
      body: {
        is_active: false,
      },
      validatedBody: {
        is_active: false,
      },
    } as unknown as AuthenticatedMedusaRequest<AdminUpdateMemberLevelType>
    const res = createResponse()

    await PATCH(req, res)

    expect(membershipService.updateMemberLevel).toHaveBeenCalledWith(
      "level_vip",
      {
        is_active: false,
      }
    )
    expect(retrieveAdminMemberLevelMock).toHaveBeenCalledWith(
      req.scope,
      "level_vip"
    )
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(200)
    expect((res.json as jest.Mock).mock.calls[0][0]).toEqual({
      member_level: expect.objectContaining({
        id: "level_vip",
        is_active: false,
        member_count: 5,
      }),
    })
  })

  it("checks delete guard before deleting a member level", async () => {
    const req = {
      scope: {},
      params: {
        id: "level_vip",
      },
    } as unknown as AuthenticatedMedusaRequest
    const res = createResponse()

    await DELETE(req, res)

    expect(assertMemberLevelCanBeDeletedMock).toHaveBeenCalledWith(
      req.scope,
      "level_vip"
    )
    expect(membershipService.deleteMemberLevel).toHaveBeenCalledWith("level_vip")
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(200)
    expect((res.json as jest.Mock).mock.calls[0][0]).toEqual({
      id: "level_vip",
      object: "member_level",
      deleted: true,
    })
  })
})
