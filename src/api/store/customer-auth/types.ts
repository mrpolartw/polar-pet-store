export interface StoreCustomerRegisterResponse {
  customer_id: string
  email: string
  verification_sent: boolean
  message: string
}

export interface StoreCustomerLoginResponse {
  success: boolean
  customer_id: string
}

export interface StoreCustomerAuthStatusResponse {
  customer_id: string
  email_verified: boolean
  email_verified_at: string | null
  line_linked: boolean
  line_display_name: string | null
  line_bound_at: string | null
}

export interface StoreCustomerEmailVerificationRequestResponse {
  sent: boolean
  email_verified: boolean
  message: string
}

export interface StoreCustomerEmailVerificationConfirmResponse {
  status:
    | "verified"
    | "already_verified"
    | "invalid_token"
    | "token_expired"
    | "token_used"
  message: string
}

export interface StoreCustomerPasswordResetRequestResponse {
  message: string
}

export interface StoreCustomerPasswordResetValidateResponse {
  status: "valid" | "invalid_token" | "token_expired" | "token_used"
  message: string
}

export interface StoreCustomerPasswordResetConfirmResponse {
  status: "reset" | "invalid_token" | "token_expired" | "token_used"
  message: string
}

export interface StoreCustomerLineCompleteResponse {
  customer_id: string
  redirect_to: string
}

export interface StoreCustomerProfileResponse {
  customer: ({
    id: string
    email: string | null
    phone: string | null
    first_name: string | null
    last_name: string | null
    metadata?: Record<string, unknown> | null
    name: string
    birthday: string | null
    gender: "male" | "female" | "undisclosed"
    avatar: string | null
  } & Record<string, unknown>) | null
}
