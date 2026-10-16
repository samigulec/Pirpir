// Supabase ayarları. İkisi de tanımlı değilse giriş "örnek mod"da çalışır
// (e-posta doğrulaması yok, veriler yalnızca bu tarayıcıda tutulur).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Başlıktaki "Hesabım" bağlantısı için (httpOnly değil; içinde gizli bilgi yok). */
export const SIGNED_IN_COOKIE = "rotala_signed_in";
