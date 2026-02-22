import type { PayloadAction } from "@reduxjs/toolkit"
import { createAppSlice } from "../../app/createAppSlice"
import type { UserOut } from "../../api"

type UserState = {
  user: UserOut | null
}

const initialState: UserState = {
  user: null,
}

export const userSlice = createAppSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserOut | null>) => {
      state.user = action.payload
    },
    clearUser: state => {
      state.user = null
    },
    addPermission: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.permissions ??= []
        if (!state.user.permissions.includes(action.payload)) {
          state.user.permissions.push(action.payload)
        }
      }
    },
    removePermission: (state, action: PayloadAction<string>) => {
      if (state.user?.permissions) {
        state.user.permissions = state.user.permissions.filter(
          perm => perm !== action.payload,
        )
      }
    },
  },
  selectors: {
    selectUser: state => state.user?.user,
    selectPermissions: state => state.user?.permissions,
  },
})

export const { setUser, clearUser, addPermission, removePermission } =
  userSlice.actions
export const { selectUser, selectPermissions } = userSlice.selectors

export default userSlice.reducer
