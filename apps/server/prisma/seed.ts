/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BUYER_PREMIUM_PER_SLOT_INR } from "@subshare/shared";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding subshare…");
  const password = await bcrypt.hash("Password123!", 12);

  const owner = await prisma.user.upsert({
    where: { university_email: "aarav@iitb.ac.in" },
    update: {},
    create: {
      name: "Aarav Sharma",
      university_email: "aarav@iitb.ac.in",
      password_hash: password,
      rating: 4.7,
      email_verified: true,
    },
  });

  await prisma.user.upsert({
    where: { university_email: "diya@iitd.ac.in" },
    update: {},
    create: {
      name: "Diya Patel",
      university_email: "diya@iitd.ac.in",
      password_hash: password,
      rating: 4.2,
      email_verified: true,
    },
  });

  const existing = await prisma.subscription.findFirst({
    where: { owner_id: owner.id },
    select: { id: true },
  });
  if (!existing) {
    await prisma.subscription.create({
      data: {
        owner_id: owner.id,
        platform_name: "Netflix",
        total_slots_offered: 3,
        slots: {
          create: [
            { price_per_month: BUYER_PREMIUM_PER_SLOT_INR, status: "AVAILABLE" },
            { price_per_month: BUYER_PREMIUM_PER_SLOT_INR, status: "AVAILABLE" },
            { price_per_month: BUYER_PREMIUM_PER_SLOT_INR, status: "AVAILABLE" },
          ],
        },
      },
    });
    console.log("Created demo Netflix listing with 3 slots");
  }

  console.log("Seed complete. Demo logins (password: Password123!):");
  console.log("  aarav@iitb.ac.in  (owner)");
  console.log("  diya@iitd.ac.in   (buyer)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
