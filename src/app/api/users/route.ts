import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

// Helper to authenticate user and check if they are an agent
async function verifyAgent() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Kimlik doğrulaması başarısız.", status: 401 };
  }

  // Fetch role info
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "agent") {
    return { error: "Bu işlem için yetkiniz yok.", status: 403 };
  }

  return { currentUserId: user.id };
}

// POST: Create a new user (Agent & Customer)
export async function POST(request: Request) {
  try {
    const authCheck = await verifyAgent();
    if ("error" in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { email, password, name, role } = body;

    // Validation
    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Lütfen tüm alanları doldurun." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
    }

    if (role !== "customer" && role !== "agent") {
      return NextResponse.json({ error: "Geçersiz rol seçildi." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Create auth user with auto-confirmed email
    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true,
      user_metadata: { name: name.trim() }
    });

    if (createError || !authData?.user) {
      return NextResponse.json({ error: createError?.message || "Kullanıcı oluşturulamadı." }, { status: 400 });
    }

    // 2. Create the associated profile row
    const { data: profileData, error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: authData.user.id,
        name: name.trim(),
        email: email.trim(),
        role: role
      })
      .select()
      .single();

    if (profileError) {
      // Clean up the auth user since profile creation failed
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: `Profil oluşturulamadı: ${profileError.message}` }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      profile: profileData 
    });
  } catch (error: any) {
    console.error("User creation API error:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}

// DELETE: Remove a user
export async function DELETE(request: Request) {
  try {
    const authCheck = await verifyAgent();
    if ("error" in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("id");

    if (!targetUserId) {
      return NextResponse.json({ error: "Kullanıcı ID belirtilmedi." }, { status: 400 });
    }

    // Prevent agents from deleting themselves
    if (targetUserId === authCheck.currentUserId) {
      return NextResponse.json({ error: "Kendi hesabınızı silemezsiniz." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Delete user from auth.users (public.profiles will be deleted automatically due to CASCADE constraint)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message || "Kullanıcı silinemedi." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("User deletion API error:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}
