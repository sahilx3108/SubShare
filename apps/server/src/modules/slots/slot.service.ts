import {
  SESSION_STALE_AFTER_DAYS,
  type LaunchRequestDto,
  type MarketplaceSlotDto,
  type MySlotDto,
  type SessionPayloadDto,
} from "@subshare/shared";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/http";

const LAUNCH_REQUEST_WINDOW_MS = 10 * 60 * 1000;

function isStale(syncedAt: Date | null): boolean {
  if (!syncedAt) return false;
  return Date.now() - syncedAt.getTime() > SESSION_STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

/** Public marketplace grid: only sellable slots with a synced session are listed. */
export async function listMarketplace(): Promise<MarketplaceSlotDto[]> {
  const slots = await prisma.slot.findMany({
    where: {
      status: "AVAILABLE",
      subscription: { encrypted_session_data: { not: null } },
    },
    orderBy: { created_at: "desc" },
    take: 100,
    select: {
      id: true,
      price_per_month: true,
      subscription: {
        select: {
          platform_name: true,
          session_synced_at: true,
          owner: { select: { id: true, name: true, rating: true } },
        },
      },
    },
  });

  return slots.map((slot) => ({
    id: slot.id,
    platform_name: slot.subscription.platform_name,
    price_per_month: slot.price_per_month,
    owner_id: slot.subscription.owner.id,
    owner_name: maskName(slot.subscription.owner.name),
    owner_rating: Math.round(slot.subscription.owner.rating * 10) / 10,
    session_synced_at: slot.subscription.session_synced_at?.toISOString() ?? null,
    session_stale: isStale(slot.subscription.session_synced_at),
  }));
}

export async function listMine(buyerId: string): Promise<MySlotDto[]> {
  const slots = await prisma.slot.findMany({
    where: { buyer_id: buyerId, status: { not: "EXPIRED" } },
    orderBy: { updated_at: "desc" },
    select: {
      id: true,
      status: true,
      price_per_month: true,
      expires_at: true,
      launch_requested_at: true,
      subscription: {
        select: {
          platform_name: true,
          encrypted_session_data: true,
          session_synced_at: true,
        },
      },
    },
  });

  return slots.map((slot) => ({
    id: slot.id,
    platform_name: slot.subscription.platform_name,
    status: slot.status,
    price_per_month: slot.price_per_month,
    expires_at: slot.expires_at?.toISOString() ?? null,
    has_session: Boolean(slot.subscription.encrypted_session_data),
    session_stale: isStale(slot.subscription.session_synced_at),
    launch_requested_at: slot.launch_requested_at?.toISOString() ?? null,
  }));
}

export async function requestLaunch(slotId: string, buyerId: string): Promise<void> {
  const result = await prisma.slot.updateMany({
    where: { id: slotId, buyer_id: buyerId, status: "ACTIVE" },
    data: { launch_requested_at: new Date() },
  });
  if (result.count === 0) throw ApiError.notFound("Active purchased slot not found");
}

export async function latestLaunchRequest(buyerId: string): Promise<LaunchRequestDto> {
  const cutoff = new Date(Date.now() - LAUNCH_REQUEST_WINDOW_MS);
  const slot = await prisma.slot.findFirst({
    where: { buyer_id: buyerId, status: "ACTIVE", launch_requested_at: { gt: cutoff } },
    orderBy: { launch_requested_at: "desc" },
    select: {
      id: true,
      launch_requested_at: true,
      subscription: { select: { platform_name: true } },
    },
  });
  if (!slot) throw ApiError.notFound("No pending launch request", "NO_LAUNCH_REQUEST");

  return {
    slot_id: slot.id,
    platform_name: slot.subscription.platform_name,
    requested_at: slot.launch_requested_at!.toISOString(),
  };
}

export async function getSessionPayload(
  slotId: string,
  buyerId: string,
): Promise<SessionPayloadDto> {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    select: {
      buyer_id: true,
      status: true,
      subscription: {
        select: {
          platform_name: true,
          encrypted_session_data: true,
          session_key: true,
          session_synced_at: true,
        },
      },
    },
  });

  if (!slot || slot.buyer_id !== buyerId || slot.status !== "ACTIVE") {
    throw ApiError.forbidden("This slot is not an active purchase");
  }
  const sub = slot.subscription;
  if (!sub.encrypted_session_data || !sub.session_key) {
    throw ApiError.conflict("The owner has not synced a session yet");
  }

  return {
    slot_id: slotId,
    platform_name: sub.platform_name,
    encrypted_session_data: sub.encrypted_session_data,
    session_key: sub.session_key,
  };
}

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? "Student";
  const initial = parts[1]?.[0];
  return initial ? `${first} ${initial}.` : first;
}
