import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, destroySessionByToken, sessionCookieOptions } from "@/lib/auth/session";

/** Déconnexion : révoque la session en base et efface le cookie. */
export async function POST(request: Request) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) await destroySessionByToken(token);

  const response = NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return response;
}
