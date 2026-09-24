import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const createClient = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.cookies.toString());
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const headerValue = serializeCookieHeader(name, value, options);
          supabaseResponse.headers.append("Set-Cookie", headerValue);
        });
        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        }
      },
    },
  });

  await supabase.auth.getClaims();

  return { supabase, response: supabaseResponse };
};
