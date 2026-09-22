import { z } from "zod";
import {
  MAX_SLOTS_PER_SUBSCRIPTION,
  PLATFORMS,
  isUniversityEmail,
} from "./constants";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(60),
  university_email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .refine(isUniversityEmail, {
      message: "Only university emails (.ac.in or .edu) are allowed",
    }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(/[A-Za-z]/, "Password needs at least one letter")
    .regex(/[0-9]/, "Password needs at least one number"),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  university_email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createSubscriptionSchema = z.object({
  platform_name: z.enum(PLATFORMS),
  total_slots_offered: z
    .number()
    .int()
    .min(1, "Share at least 1 slot")
    .max(MAX_SLOTS_PER_SUBSCRIPTION, `Max ${MAX_SLOTS_PER_SUBSCRIPTION} slots`),
});
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const putSessionSchema = z.object({
  encrypted_session_data: z.string().min(24).max(60_000),
});
export type PutSessionInput = z.infer<typeof putSessionSchema>;

export const createOrderSchema = z.object({
  slot_id: z.string().cuid(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
