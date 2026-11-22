import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashIp } from "@/lib/auth/session";
import { attemptKey, isRateLimited, recordAttempt } from "@/lib/auth/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Formulaire de contact.
 * 1. Le message est D ABORD enregistre en base (table `messages`) : source de verite, consultable
 *    dans l ADMIN meme si l e-mail echoue.
 * 2. L envoi Resend est tente ensuite, en meilleur effort : son echec n annule pas le message.
 * 3. Aucun envoi n est jamais simule : la reponse indique si l e-mail est reellement parti.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
  }

  if (clean(body.website, 200)) return NextResponse.json({ ok: true }); // champ piege : bot

  const name = clean(body.name, 100);
  const email = clean(body.email, 200);
  const subject = clean(body.subject, 150);
  const text = clean(body.message, 2000);
  if (name.length < 2 || !EMAIL.test(email) || subject.length < 3 || text.length < 10) {
    return NextResponse.json({ ok: false, code: "invalid" }, { status: 422 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "inconnue";
  const ipHash = hashIp(ip);
  const limitKey = attemptKey("contact", ip);
  if (await isRateLimited(limitKey).catch(() => false)) {
    return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429 });
  }

  let stored = false;
  try {
    await query(
      `insert into messages (name, email, subject, body, is_read, ip_hash, created_at) values ($1, $2, $3, $4, false, $5, now())`,
      [name, email, subject, text, ipHash],
    );
    stored = true;
  } catch (error) {
    console.error("[contact] enregistrement impossible :", error instanceof Error ? error.message : error);
  }
  await recordAttempt(limitKey).catch(() => undefined);

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  let emailed = false;
  let emailError: string | null = !key || !to ? "not_configured" : null;

  if (key && to) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
          to: [to],
          reply_to: email,
          subject: `[Portfolio] ${subject}`,
          text: `Nom : ${name}\nE-mail : ${email}\n\n${text}`,
        }),
      });
      if (res.ok) {
        emailed = true;
      } else {
        emailError = `provider_error_${res.status}`;
        console.error("[contact] Resend a refuse l envoi :", res.status, (await res.text()).slice(0, 200));
      }
    } catch (error) {
      emailError = "network";
      console.error("[contact] reseau :", error instanceof Error ? error.message : error);
    }
  }

  if (stored) return NextResponse.json({ ok: true, emailed, emailError });
  if (emailed) return NextResponse.json({ ok: true, emailed: true, emailError: null });
  return NextResponse.json({ ok: false, code: "unavailable" }, { status: 503 });
}
