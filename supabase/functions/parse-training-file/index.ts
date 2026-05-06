import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is admin/manager
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "manager"]);

    if (!roles?.length) throw new Error("Access denied: admin or manager role required");

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const category = (formData.get("category") as string) || "عام";

    if (!file) throw new Error("No file provided");

    const fileName = file.name;
    const fileText = await file.text();

    // Parse based on file type
    const entries: { title: string; content: string }[] = [];

    if (fileName.endsWith(".csv")) {
      // CSV: each row becomes an entry
      const lines = fileText.split("\n").filter((l) => l.trim());
      const headers = lines[0]?.split(",").map((h) => h.trim());
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        const title = values[0] || `سطر ${i}`;
        const content = headers
          ? headers.map((h, idx) => `${h}: ${values[idx] || ""}`).join("\n")
          : values.join(" | ");
        entries.push({ title, content });
      }
    } else if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      // Split by double newlines into sections
      const sections = fileText.split(/\n\n+/).filter((s) => s.trim());
      for (let i = 0; i < sections.length; i++) {
        const lines = sections[i].trim().split("\n");
        const title = lines[0].replace(/^#+\s*/, "").substring(0, 100);
        entries.push({ title, content: sections[i].trim() });
      }
    } else {
      // Treat as plain text - single entry
      entries.push({ title: fileName, content: fileText.substring(0, 50000) });
    }

    // Upload file to storage
    const storagePath = `training/${Date.now()}_${fileName}`;
    await supabase.storage.from("chatbot-files").upload(storagePath, file);

    // Insert knowledge entries
    const knowledgeEntries = entries.map((e) => ({
      title: e.title,
      content: e.content,
      source_type: "file" as const,
      file_name: fileName,
      category,
      created_by: user.id,
      is_active: true,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("chatbot_knowledge")
      .insert(knowledgeEntries)
      .select();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        entries_count: inserted?.length || 0,
        file_name: fileName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("parse-training-file error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
