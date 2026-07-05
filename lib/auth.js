import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyPassword } from "@/lib/password";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // เข้าระบบด้วยอีเมล + รหัสผ่าน (สมัครไว้แล้วผ่าน /signup)
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;
        const supabase = getSupabaseAdmin();
        const { data: user } = await supabase
          .from("users")
          .select("id, email, name, avatar_url, password_hash")
          .eq("email", email)
          .maybeSingle();
        // ไม่มี user หรือ user นี้สมัครด้วย Google (ไม่มีรหัสผ่าน) → เข้าไม่ได้
        if (!user || !user.password_hash) return null;
        if (!verifyPassword(password, user.password_hash)) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.avatar_url };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    // upsert ผู้ใช้ลงตาราง users หลัง login ด้วย Google สำเร็จ
    // (เฉพาะ Google — user แบบอีเมลถูกสร้างไว้แล้วตอนสมัคร ไม่ต้อง upsert ทับ)
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from("users")
          .upsert(
            { email: user.email, name: user.name, avatar_url: user.image },
            { onConflict: "email" }
          );
      } catch (e) {
        // ถ้า DB ยังไม่พร้อมก็ยังให้ login ผ่าน (ค่อยเชื่อมทีหลัง)
        console.error("user upsert failed:", e.message);
      }
      return true;
    },
    async session({ session, token }) {
      if (token?.sub) session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
