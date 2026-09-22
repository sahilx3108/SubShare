import { createHmac } from "crypto";
import Razorpay from "razorpay";
import type { Request } from "express";
import {
  SLOT_DURATION_DAYS,
  computeSplit,
  type CreateOrderDto,
} from "@subshare/shared";
import { env, assertPaymentConfigured } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/http";
import { addDays, safeEqual } from "../../lib/tokens";

let client: Razorpay | null = null;

function razorpay(): Razorpay {
  if (!assertPaymentConfigured()) {
    throw ApiError.conflict(
      "Payment gateway is not configured. Add Razorpay test keys to the environment.",
    );
  }
  client ??= new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
  });
  return client;
}

export async function createOrder(slotId: string, buyerId: string): Promise<CreateOrderDto> {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    select: {
      id: true,
      status: true,
      price_per_month: true,
      subscription: {
        select: { owner_id: true, encrypted_session_data: true },
      },
    },
  });

  if (!slot) throw ApiError.notFound("Slot not found");
  if (slot.status !== "AVAILABLE") throw ApiError.conflict("This slot has already been taken");
  if (slot.subscription.owner_id === buyerId) {
    throw ApiError.forbidden("You cannot buy your own slot");
  }
  if (!slot.subscription.encrypted_session_data) {
    throw ApiError.conflict("Owner has not synced this account yet");
  }

  const amountPaise = Math.round(slot.price_per_month * 100);
  let order;
  try {
    order = await razorpay().orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `slot:${slot.id}`.slice(0, 40),
      notes: { slot_id: slot.id, user_id: buyerId },
    });
  } catch (e) {
    // Gateway unreachable / auth failure must never bubble as a 500.
    console.error("[razorpay] order creation failed:", e);
    throw ApiError.conflict("Payment gateway unavailable. Please try again shortly.");
  }

  const { platformFee, ownerPayout } = computeSplit(slot.price_per_month);
  const payment = await prisma.payment.create({
    data: {
      slot_id: slot.id,
      buyer_id: buyerId,
      razorpay_order_id: order.id,
      amount: slot.price_per_month,
      platform_fee: platformFee,
      owner_payout: ownerPayout,
      status: "CREATED",
    },
    select: { id: true },
  });

  return {
    order_id: order.id,
    payment_record_id: payment.id,
    amount_paise: amountPaise,
    currency: "INR",
    key_id: env.razorpayKeyId,
    platform_fee: platformFee,
    owner_payout: ownerPayout,
  };
}

interface WebhookEntity {
  id?: string;
  order_id?: string;
  notes?: Record<string, string>;
}

/**
 * Verifies the signature over the RAW request body, then activates the slot.
 * Slot activation happens exclusively here — never in the checkout callback —
 * so that a dropped/forged client response can't grant access for free.
 */
export function verifyWebhookSignature(rawBody: Buffer, signature: unknown): boolean {
  if (!env.razorpayWebhookSecret || typeof signature !== "string") return false;
  const expected = createHmac("sha256", env.razorpayWebhookSecret)
    .update(rawBody)
    .digest("hex");
  return safeEqual(expected, signature);
}

export async function processCaptureEvent(entity: WebhookEntity): Promise<
  "ACTIVATED" | "ALREADY_DONE" | "REFUND_NEEDED" | "IGNORED"
> {
  const orderId = entity.order_id;
  if (!orderId) return "IGNORED";

  const payment = await prisma.payment.findUnique({
    where: { razorpay_order_id: orderId },
    select: { id: true, status: true, slot_id: true, buyer_id: true },
  });
  if (!payment) {
    console.warn(`[webhook] payment record missing for order ${orderId}`);
    return "IGNORED";
  }

  if (payment.status === "CAPTURED") return "ALREADY_DONE"; // idempotent redelivery
  if (payment.status === "NEEDS_REFUND") return "REFUND_NEEDED";

  // Conditional update = race-safe claim of the slot. Only ONE webhook wins.
  const claimed = await prisma.slot.updateMany({
    where: { id: payment.slot_id, status: "AVAILABLE", buyer_id: null },
    data: {
      status: "ACTIVE",
      buyer_id: payment.buyer_id,
      expires_at: addDays(new Date(), SLOT_DURATION_DAYS),
      launch_requested_at: null,
    },
  });

  if (claimed.count === 0) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "NEEDS_REFUND" },
    });
    console.error(
      `[webhook] Slot ${payment.slot_id} unavailable at capture time for order ${orderId}. Refund required.`,
    );
    return "REFUND_NEEDED";
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "CAPTURED", razorpay_payment_id: entity.id ?? null },
  });
  return "ACTIVATED";
}

export async function expireStaleSlots(): Promise<number> {
  const result = await prisma.slot.updateMany({
    where: { status: "ACTIVE", expires_at: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
  return result.count;
}

export function extractCaptureEntity(body: unknown): WebhookEntity | null {
  const event = body as {
    event?: string;
    payload?: {
      payment?: { entity?: WebhookEntity };
      order?: { entity?: WebhookEntity & { notes?: Record<string, string> } };
    };
  };
  if (!event?.event || !event.payload) return null;

  const supported = ["payment.captured", "order.paid"];
  if (!supported.includes(event.event)) return null;

  const paymentEntity = event.payload.payment?.entity;
  const orderEntity = event.payload.order?.entity;
  // Merge so we always end up with order_id, payment id and notes.
  const merged: WebhookEntity = {
    ...orderEntity,
    ...paymentEntity,
    notes: paymentEntity?.notes ?? orderEntity?.notes ?? {},
  };
  return merged;
}
