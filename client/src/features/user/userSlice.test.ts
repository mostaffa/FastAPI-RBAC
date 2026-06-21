import type { UserOut } from "@/api"
import { describe, expect, it } from "vitest"
import reducer, {
  addPermission,
  clearUser,
  removePermission,
  setUser,
} from "./userSlice"

// A minimal valid UserOut to seed state. Reducer tests are the easiest unit
// tests to copy: feed a state + action into the reducer, assert the next state.
const makeUser = (permissions: string[] = []): UserOut => ({
  user: {
    id: 1,
    username: "alice",
    email: "alice@example.com",
    active: true,
  },
  permissions,
})

describe("userSlice", () => {
  it("returns the initial state", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({ user: null })
  })

  it("setUser stores the user", () => {
    const user = makeUser()
    const state = reducer(undefined, setUser(user))
    expect(state.user).toEqual(user)
  })

  it("clearUser resets the user to null", () => {
    const state = reducer({ user: makeUser() }, clearUser())
    expect(state.user).toBeNull()
  })

  it("addPermission appends a new permission without duplicating", () => {
    let state = reducer(
      { user: makeUser(["user:read"]) },
      addPermission("user:write"),
    )
    expect(state.user?.permissions).toEqual(["user:read", "user:write"])

    state = reducer(state, addPermission("user:write"))
    expect(state.user?.permissions).toEqual(["user:read", "user:write"])
  })

  it("removePermission drops the matching permission", () => {
    const state = reducer(
      { user: makeUser(["user:read", "user:write"]) },
      removePermission("user:read"),
    )
    expect(state.user?.permissions).toEqual(["user:write"])
  })
})
