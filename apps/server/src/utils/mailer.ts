/**
 * MVP mailer: verification emails are logged to the console instead of being
 * sent. Swap the body for Nodemailer/Resend in production.
 */
export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  console.info(
    `\n[subshare mail] Verification email for ${to}:\n${verifyUrl}\n`,
  );
}
