import {
  BUYER_PREMIUM_PER_SLOT_INR,
  SESSION_STALE_AFTER_DAYS,
  type OwnerSubscriptionDto,
} from "@subshare/shared";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/http";
import { randomToken } from "../../lib/tokens";
import type { CreateSubscriptionInput, PutSessionInput } from "@subshare/shared";

export async function createSubscription(
  ownerId: string,
  input: CreateSubscriptionInput,
): Promise<OwnerSubscriptionDto> {
  const created = await prisma.subscription.create({
    data: {
      owner_id: ownerId,
      platform_name: input.platform_name,
      total_slots_offered: input.total_slots_offered,
      slots: {
        create: Array.from({ length: input.total_slots_offered }, () => ({
          price_per_month: BUYER_PREMIUM_PER_SLOT_INR,
          status: "AVAILABLE" as const,
        })),
      },
    },
    include: { slots: true },
  });

  return toOwnerDto(created.id);
}

export async function listMine(ownerId: string): Promise<OwnerSubscriptionDto[]> {
  const subs = await prisma.subscription.findMany({
    where: { owner_id: ownerId },
    select: { id: true },
    orderBy: { created_at: "desc" },
  });
  return Promise.all(subs.map((s) => toOwnerDto(s.id)));
}

export async function ensureSessionKey(subscriptionId: string, ownerId: string): Promise<string> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true, owner_id: true, session_key: true },
  });
  if (!sub || sub.owner_id !== ownerId) throw ApiError.notFound("Subscription not found");

  if (sub.session_key) return sub.session_key;

  // Lazily mint a 256-bit key the first time the owner pushes a session.
  const key = randomToken(32); // 64 hex chars = 32 bytes
  const updated = await prisma.subscription.updateMany({
    where: { id: subscriptionId, session_key: null },
    data: { session_key: key },
  });
  // Another concurrent request won the race — re-read.
  if (updated.count === 0) {
    const fresh = await prisma.subscription.findUniqueOrThrow({
      where: { id: subscriptionId },
      select: { session_key: true },
    });
    if (!fresh.session_key) throw new Error("Failed to allocate session key");
    return fresh.session_key;
  }
  return key;
}

export async function putSessionData(
  subscriptionId: string,
  ownerId: string,
  input: PutSessionInput,
): Promise<void> {
  const result = await prisma.subscription.updateMany({
    where: { id: subscriptionId, owner_id: ownerId },
    data: {
      encrypted_session_data: input.encrypted_session_data,
      session_synced_at: new Date(),
    },
  });
  if (result.count === 0) throw ApiError.notFound("Subscription not found");
}

export async function deleteSubscription(subscriptionId: string, ownerId: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: {
      id: true,
      owner_id: true,
      _count: { select: { slots: { where: { NOT: { status: "EXPIRED" } } } } },
    },
  });
  if (!sub || sub.owner_id !== ownerId) throw ApiError.notFound("Subscription not found");

  const soldCount = await prisma.slot.count({
    where: { subscription_id: subscriptionId, buyer_id: { not: null } },
  });
  if (soldCount > 0) {
    throw ApiError.conflict("Cannot delete a listing that has buyers. Let slots expire instead.");
  }
  await prisma.subscription.delete({ where: { id: subscriptionId } });
}

async function toOwnerDto(subscriptionId: string): Promise<OwnerSubscriptionDto> {
  const sub = await prisma.subscription.findUniqueOrThrow({
    where: { id: subscriptionId },
    select: {
      id: true,
      platform_name: true,
      total_slots_offered: true,
      session_synced_at: true,
      encrypted_session_data: true,
      slots: {
        orderBy: { created_at: "asc" },
        select: {
          id: true,
          status: true,
          price_per_month: true,
          expires_at: true,
          buyer: { select: { name: true, rating: true } },
        },
      },
    },
  });

  const activeSlots = sub.slots.filter((s) => s.status === "ACTIVE");
  const sessionStale =
    sub.session_synced_at !== null &&
    Date.now() - sub.session_synced_at.getTime() >
      SESSION_STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;

  return {
    id: sub.id,
    platform_name: sub.platform_name,
    total_slots_offered: sub.total_slots_offered,
    has_session: Boolean(sub.encrypted_session_data),
    session_synced_at: sub.session_synced_at?.toISOString() ?? null,
    session_stale: sessionStale,
    monthly_earnings_inr:
      Math.round(activeSlots.reduce((sum, s) => sum + s.price_per_month, 0) * 100) / 100,
    slots: sub.slots.map((s) => ({
      id: s.id,
      status: s.status,
      buyer_name: s.buyer?.name ?? null,
      buyer_rating: s.buyer?.rating ?? null,
      price_per_month: s.price_per_month,
      expires_at: s.expires_at?.toISOString() ?? null,
    })),
  };
}
