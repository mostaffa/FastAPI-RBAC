import type { Action, ThunkAction } from "@reduxjs/toolkit"
import { combineSlices, configureStore } from "@reduxjs/toolkit"
import { setupListeners } from "@reduxjs/toolkit/query"
import { userSlice } from "@/features/user/userSlice"
import { usersApiSlice } from "@/features/user/usersApiSlice"
import { rolesApiSlice } from "@/features/user/rolesApiSlice"
import { permissionApiSlice } from "@/features/user/permissionApiSlice"
import { sensorsSlice } from "@/features/sensors/sensorsSlice"
import { servicesApiSlice } from "@/features/sensors/servicesApiSlice"
import { systemApiSlice } from "@/features/sensors/systemApiSlice"

// `combineSlices` automatically combines the reducers using
// their `reducerPath`s, therefore we no longer need to call `combineReducers`.
const rootReducer = combineSlices(
  userSlice,
  usersApiSlice,
  rolesApiSlice,
  permissionApiSlice,
  sensorsSlice,
  systemApiSlice,
  servicesApiSlice,
)
// Infer the `RootState` type from the root reducer
export type RootState = ReturnType<typeof rootReducer>

// The store setup is wrapped in `makeStore` to allow reuse
// when setting up tests that need the same store config
export const makeStore = (preloadedState?: Partial<RootState>) => {
  const store = configureStore({
    reducer: rootReducer,
    // Adding the api middleware enables caching, invalidation, polling,
    // and other useful features of `rtk-query`.
    middleware: getDefaultMiddleware => {
      return getDefaultMiddleware().concat(
        rolesApiSlice.middleware,
        permissionApiSlice.middleware,
        usersApiSlice.middleware,
        systemApiSlice.middleware,
        servicesApiSlice.middleware,
      )
    },
    preloadedState,
    devTools: false,
    duplicateMiddlewareCheck: false, // Disable duplicate middleware check for better performance
    enhancers: undefined, // No enhancers for better performance
  })
  // configure listeners using the provided defaults
  // optional, but required for `refetchOnFocus`/`refetchOnReconnect` behaviors
  setupListeners(store.dispatch)
  return store
}

// export const store = configureStore({
//   reducer: {
//     user: userSlice,
//     // Add other slices here

//   },

//   // Optimize middleware for better performance
//   middleware: getDefaultMiddleware =>
//     getDefaultMiddleware({
//       // Disable serializable check for better performance in dev
//       serializableCheck: false,
//       // Enable thunk middleware only when needed
//       thunk: true,
//     }),

//   // Enable Redux DevTools only in development
//   devTools: false,
// })

export const store = makeStore()

// Infer the type of `store`
export type AppStore = typeof store
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = AppStore["dispatch"]
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>
