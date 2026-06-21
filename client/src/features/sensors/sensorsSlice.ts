import { createAppSlice } from "@/app/createAppSlice"
import type { PayloadAction } from "@reduxjs/toolkit"

export type SensorsType = {
  sensors: [string] | null
}
export type SensorValueType = Record<
  string,
  {
    values: [number]
  }
>

const initialState: SensorsType = {
  sensors: null,
}

export const sensorsSlice = createAppSlice({
  name: "Sensors",
  initialState,
  reducers: {
    setSensors: (state, action: PayloadAction<[string] | null>) => {
      state.sensors = action.payload
    },
  },
  selectors: {
    selectSensors: state => state.sensors,
  },
})

export const { setSensors } = sensorsSlice.actions
export const { selectSensors } = sensorsSlice.selectors
