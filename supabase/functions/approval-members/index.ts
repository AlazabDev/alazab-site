import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://alazab.com",
  "https://www.alazab.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const corsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://alazab.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
};

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });

const VALID_ROLES = new Set(["owner", "admin", "reviewer", "approver", "viewer"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { success: false, error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json(req, { success: false, error: "SERVER_NOT_CONFIGURED" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(req, { success: false, error: "UNAUTHORIZED" }, 401);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.slice(7));
    if (authError || !user) return json(req, { success: false, error: "UNAUTHORIZED" }, 401);

    const { data: actorMembership, error: actorMembershipError } = await admin
      .from("approval_memberships")
      .select("role,active")
      .eq("user_id", user.id)
      .maybeSingle();
    if (actorMembershipError) throw actorMembershipError;

    if (!actorMembership?.active || !["owner", "admin"].includes(actorMembership.role)) {
      return json(req, { success: false, error: "MEMBERSHIP_ADMIN_REQUIRED" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "list");

    if (action === "list") {
      const { data: memberships, error: membershipsError } = await admin
        .from("approval_memberships")
        .select("user_id,role,active,created_at,updated_at")
        .order("created_at", { ascending: true });
      if (membershipsError) throw membershipsError;

      const userIds = (memberships || []).map((item: any) => item.user_id);
      let profiles: any[] = [];
      if (userIds.length) {
        const { data, error } = await admin
          .from("adp_profiles")
          .select("id,full_name,email,phone,avatar_url")
          .in("id", userIds);
        if (error) throw error;
        profiles = data || [];
      }

      const profileById = new Map(profiles.map((profile: any) => [profile.id, profile]));
      const rows = (memberships || []).map((membership: any) => {
        const profile = profileById.get(membership.user_id) || {};
        return {
          userId: membership.user_id,
          fullName: profile.full_name || profile.email || "مستخدم",
          email: profile.email || null,
          phone: profile.phone || null,
          avatarUrl: profile.avatar_url || null,
          role: membership.role,
          active: membership.active,
          createdAt: membership.created_at,
          updatedAt: membership.updated_at,
        };
      });

      return json(req, { success: true, members: rows });
    }

    if (action === "find_user") {
      const email = String(body?.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) return json(req, { success: false, error: "VALID_EMAIL_REQUIRED" }, 400);

      const { data: profile, error } = await admin
        .from("adp_profiles")
        .select("id,full_name,email,phone,avatar_url")
        .ilike("email", email)
        .maybeSingle();
      if (error) throw error;
      if (!profile) return json(req, { success: false, error: "USER_NOT_FOUND" }, 404);

      const { data: membership } = await admin
        .from("approval_memberships")
        .select("role,active")
        .eq("user_id", profile.id)
        .maybeSingle();

      return json(req, {
        success: true,
        user: {
          userId: profile.id,
          fullName: profile.full_name || profile.email,
          email: profile.email,
          phone: profile.phone,
          avatarUrl: profile.avatar_url,
          membership,
        },
      });
    }

    if (action === "upsert") {
      const targetUserId = String(body?.userId || "");
      const role = String(body?.role || "");
      const active = body?.active !== false;

      if (!targetUserId || !VALID_ROLES.has(role)) {
        return json(req, { success: false, error: "INVALID_MEMBERSHIP" }, 400);
      }

      const { data: targetProfile, error: targetProfileError } = await admin
        .from("adp_profiles")
        .select("id,full_name,email")
        .eq("id", targetUserId)
        .maybeSingle();
      if (targetProfileError) throw targetProfileError;
      if (!targetProfile) return json(req, { success: false, error: "USER_NOT_FOUND" }, 404);

      const { data: previous, error: previousError } = await admin
        .from("approval_memberships")
        .select("role,active")
        .eq("user_id", targetUserId)
        .maybeSingle();
      if (previousError) throw previousError;

      if (actorMembership.role !== "owner" && (role === "owner" || previous?.role === "owner")) {
        return json(req, { success: false, error: "OWNER_ROLE_REQUIRES_OWNER" }, 403);
      }

      const removingActiveOwner =
        previous?.role === "owner" &&
        previous?.active === true &&
        (role !== "owner" || !active);

      if (removingActiveOwner) {
        const { count, error: ownersError } = await admin
          .from("approval_memberships")
          .select("*", { count: "exact", head: true })
          .eq("role", "owner")
          .eq("active", true);
        if (ownersError) throw ownersError;
        if ((count || 0) <= 1) return json(req, { success: false, error: "LAST_OWNER_PROTECTED" }, 409);
      }

      const { data: saved, error: saveError } = await admin
        .from("approval_memberships")
        .upsert({
          user_id: targetUserId,
          role,
          active,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
        .select("user_id,role,active,created_at,updated_at")
        .single();
      if (saveError) throw saveError;

      const { data: actorProfile } = await admin
        .from("adp_profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle();

      const { error: auditError } = await admin.from("audit_logs").insert({
        table_name: "approval_memberships",
        action: previous ? "UPDATE" : "INSERT",
        actor_id: user.id,
        actor_email: user.email || actorProfile?.email || null,
        record_id: targetUserId,
        entity_type: "approval_member",
        entity_label: targetProfile.full_name || targetProfile.email,
        old_data: previous,
        new_data: { role, active },
      });
      if (auditError) console.warn("approval-members audit failed", auditError.message);

      return json(req, {
        success: true,
        member: {
          ...saved,
          fullName: targetProfile.full_name || targetProfile.email,
          email: targetProfile.email,
        },
      });
    }

    return json(req, { success: false, error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error("approval-members error", error);
    return json(req, {
      success: false,
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    }, 500);
  }
});
