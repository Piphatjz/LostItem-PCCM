// app/api/ping/route.ts

import { NextResponse } from "next/server"

export async function GET() {
  // ถ้าอยากทดสอบ Supabase ด้วยก็ทำได้ เช่น:
  // const { data } = await supabase.from("users").select("count", { count: "exact" })

  return NextResponse.json({
    status: "ok",
    message: "Supabase is alive!",
    time: new Date().toISOString(),
  })
}
