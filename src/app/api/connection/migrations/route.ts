import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const files = (await readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const migrations = await Promise.all(
    files.map(async (filename) => {
      const sql = await readFile(path.join(migrationsDir, filename), "utf8");
      return { filename, sql };
    }),
  );

  const combined = migrations
    .map((item) => `-- >>> ${item.filename}\n${item.sql.trim()}\n`)
    .join("\n");

  return NextResponse.json({
    migrations,
    combined,
    rlsNote:
      "RLS policies restrict every row with user_id = auth.uid() (profiles use id = auth.uid()). Apply 00002_rls.sql after tables exist. Never expose the service_role key to the browser.",
  });
}
