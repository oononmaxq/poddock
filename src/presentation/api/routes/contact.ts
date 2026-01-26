import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../types";
import { AppError } from "../middleware/error-handler";
import { sendEmail } from "@infrastructure/email/resend";

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.enum(["general", "bug", "feature", "billing", "other"]),
  message: z.string().min(1).max(5000),
});

const subjectLabels: Record<string, string> = {
  general: "一般的なお問い合わせ",
  bug: "不具合の報告",
  feature: "機能のリクエスト",
  billing: "お支払いについて",
  other: "その他",
};

export const contactRoutes = new Hono<AppEnv>();

contactRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const data = contactSchema.parse(body);

  const adminEmail = c.env.RESEND_FROM; // Send to same address for now

  if (!c.env.RESEND_API_KEY) {
    console.log("Contact form submission (no email configured):", data);
    return c.json({ success: true });
  }

  const result = await sendEmail(
    {
      apiKey: c.env.RESEND_API_KEY,
      from: c.env.RESEND_FROM,
    },
    {
      to: adminEmail,
      subject: `[PODDOCK] ${subjectLabels[data.subject]}: ${data.name}`,
      html: `
        <h2>お問い合わせがありました</h2>
        <p><strong>お名前:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>メールアドレス:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>件名:</strong> ${subjectLabels[data.subject]}</p>
        <p><strong>メッセージ:</strong></p>
        <pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(data.message)}</pre>
      `,
    },
  );

  if (!result.success) {
    console.error("Failed to send contact email:", result.error);
    throw new AppError(500, "send_failed", "Failed to send message");
  }

  return c.json({ success: true });
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
