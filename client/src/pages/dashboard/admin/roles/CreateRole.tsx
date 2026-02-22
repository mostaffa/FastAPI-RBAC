import { useState } from "react"
import Grid from "@mui/material/Grid"
import Button from "@mui/material/Button"
import { useForm, Controller } from "react-hook-form"
import type { RoleCreate } from "../../../../api"
import FormControl from "@mui/material/FormControl"
import TextField from "@mui/material/TextField"
import useNotifications from "../../../../hooks/useNotifications/useNotifications"
import { RolesService } from "../../../../api"
import { rolesApiSlice } from "../../../../features/user/rolesApiSlice"
import { useAppDispatch } from "../../../../app/hooks"

type CreateRoleProps = {
  onDone?: () => void
  refreshRoles?: boolean
}

const CreateRole = ({ onDone, refreshRoles }: CreateRoleProps) => {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const notifications = useNotifications()
  const { control, handleSubmit, setError } = useForm<RoleCreate>({
    defaultValues: {
      name: "",
    },
  })

  const getErrorDetail = (error: unknown): string | null => {
    if (error && typeof error === "object" && "data" in error) {
      const data = (error as { data?: unknown }).data
      if (data && typeof data === "object" && "detail" in data) {
        const detail = (data as { detail?: unknown }).detail
        if (typeof detail === "string") {
          return detail
        }
        if (typeof detail === "number" || typeof detail === "boolean") {
          return String(detail)
        }
        if (detail && typeof detail === "object") {
          try {
            return JSON.stringify(detail)
          } catch {
            return null
          }
        }
      }
    }
    return null
  }

  const onSubmit = async (data: RoleCreate) => {
    setLoading(true)
    try {
      const createdRole = await RolesService.createRoleApiV1RolesPost({
        requestBody: data,
      })
      if (onDone) {
        onDone()
      }
      notifications.show("Role created successfully!", {
        severity: "success",
        autoHideDuration: 3000,
      })
      if (refreshRoles) {
        console.warn(
          "WebSocket is not connected. Role creation will not be reflected in real-time.",
        )
        dispatch(
          rolesApiSlice.util.updateQueryData("getRoles", undefined, draft => {
            draft.push(createdRole)
          }),
        )
      }
    } catch (error) {
      console.error("Failed to create role:", error)
      const detail = getErrorDetail(error)
      if (detail) {
        notifications.show(`Failed to create role: ${detail}`, {
          severity: "error",
          autoHideDuration: 5000,
        })
        setError("name", { type: "server", message: detail })
      } else {
        notifications.show("Failed to create role. Please try again.", {
          severity: "error",
          autoHideDuration: 3000,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid sx={{ p: 3, mt: 0 }}>
      <form
        onSubmit={e => {
          e.preventDefault()
          void (async () => {
            await handleSubmit(onSubmit)()
          })()
        }}
      >
        <FormControl fullWidth margin="normal">
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Role Name"
                variant="outlined"
                error={!!fieldState.error}
                helperText={fieldState.error ? fieldState.error.message : ""}
                required
              />
            )}
          />
        </FormControl>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          loading={loading}
        >
          Create Role
        </Button>
      </form>
    </Grid>
  )
}

export default CreateRole
