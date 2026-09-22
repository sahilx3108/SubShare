export interface PushSessionMessage {
  type: "PUSH_SESSION";
  subscriptionId: string;
}

export interface LaunchMessage {
  type: "LAUNCH";
}

export interface CheckAuthMessage {
  type: "CHECK_AUTH";
}

export type ExtensionMessage = PushSessionMessage | LaunchMessage | CheckAuthMessage;

export interface WorkerResponse {
  ok: boolean;
  message?: string;
}

/* Local mirrors of the API DTOs — keeps the extension build standalone. */
export interface LaunchRequestDto {
  slot_id: string;
  platform_name: string;
  requested_at: string;
}

export interface SessionPayloadDto {
  slot_id: string;
  platform_name: string;
  encrypted_session_data: string;
  session_key: string;
}
