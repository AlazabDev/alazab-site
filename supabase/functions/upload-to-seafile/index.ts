import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SEAFILE_TOKEN = Deno.env.get('SEAFILE_API_TOKEN')!;
    const SEAFILE_REPO = Deno.env.get('SEAFILE_REPO_ID')!;
    const SEAFILE_URL = Deno.env.get('SEAFILE_SERVER_URL')!;

    if (!SEAFILE_TOKEN || !SEAFILE_REPO || !SEAFILE_URL) {
      return new Response(
        JSON.stringify({ error: 'Seafile not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || '/whatsapp';

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Get upload link
    const uploadLinkRes = await fetch(
      `${SEAFILE_URL}/api2/repos/${SEAFILE_REPO}/upload-link/?p=${encodeURIComponent(folder)}`,
      { headers: { 'Authorization': `Token ${SEAFILE_TOKEN}` } }
    );

    if (!uploadLinkRes.ok) {
      const errText = await uploadLinkRes.text();
      console.error('Failed to get upload link:', errText);
      return new Response(
        JSON.stringify({ error: 'Failed to get Seafile upload link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uploadUrl = (await uploadLinkRes.text()).replace(/"/g, '');

    // Step 2: Upload file
    const timestamp = Date.now();
    const safeName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const uploadForm = new FormData();
    uploadForm.append('file', file, safeName);
    uploadForm.append('parent_dir', folder);
    uploadForm.append('replace', '0');

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Authorization': `Token ${SEAFILE_TOKEN}` },
      body: uploadForm,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('Upload failed:', errText);
      return new Response(
        JSON.stringify({ error: 'Upload to Seafile failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Create share link for public access
    const shareLinkRes = await fetch(`${SEAFILE_URL}/api/v2.1/share-links/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${SEAFILE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repo_id: SEAFILE_REPO,
        path: `${folder}/${safeName}`,
        permissions: { can_download: true },
      }),
    });

    let publicUrl = '';
    if (shareLinkRes.ok) {
      const shareData = await shareLinkRes.json();
      // Direct download link
      publicUrl = shareData.link ? `${shareData.link}?dl=1` : '';
    }

    // Fallback: construct direct file URL
    if (!publicUrl) {
      publicUrl = `${SEAFILE_URL}/lib/${SEAFILE_REPO}/file${folder}/${safeName}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        file_name: safeName,
        path: `${folder}/${safeName}`,
        public_url: publicUrl,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
