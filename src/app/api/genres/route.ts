import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Genre } from "@/types";

export async function GET() {
  const supabase = createAnonClient();

  const { data, error } = await supabase.from("genres").select("id, name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []) as Genre[] });
}
