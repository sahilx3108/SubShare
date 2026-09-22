export type SlotStatus = "AVAILABLE" | "ACTIVE" | "EXPIRED";

export interface SafeUser {
  id: string;
  name: string;
  university_email: string;
  rating: number;
  email_verified: boolean;
  created_at: string;
}

/** A slot listed on the public marketplace grid. */
export interface MarketplaceSlotDto {
  id: string;
  platform_name: string;
  price_per_month: number;
  owner_id: string;
  owner_name: string;
  owner_rating: number;
  session_synced_at: string | null;
  session_stale: boolean;
}

/** A slot owned by the authenticated buyer. */
export interface MySlotDto {
  id: string;
  platform_name: string;
  status: SlotStatus;
  price_per_month: number;
  expires_at: string | null;
  has_session: boolean;
  session_stale: boolean;
  launch_requested_at: string | null;
}

/** Owner dashboard row. */
export interface OwnerSubscriptionDto {
  id: string;
  platform_name: string;
  total_slots_offered: number;
  has_session: boolean;
  session_synced_at: string | null;
  session_stale: boolean;
  monthly_earnings_inr: number;
  slots: {
    id: string;
    status: SlotStatus;
    buyer_name: string | null;
    buyer_rating: number | null;
    price_per_month: number;
    expires_at: string | null;
  }[];
}

/** Delivered to the extension so it can decrypt + inject locally. */
export interface SessionPayloadDto {
  slot_id: string;
  platform_name: string;
  encrypted_session_data: string;
  session_key: string;
}

/** Most recent launch request made from the web app (extension polls this). */
export interface LaunchRequestDto {
  slot_id: string;
  platform_name: string;
  requested_at: string;
}

/** Response for POST /payments/order — feeds Razorpay Checkout on the web app. */
export interface CreateOrderDto {
  order_id: string;
  payment_record_id: string;
  amount_paise: number;
  currency: string;
  key_id: string;
  platform_fee: number;
  owner_payout: number;
}
