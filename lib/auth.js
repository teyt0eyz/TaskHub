import GoogleProvider from "next-auth/providers/google";
import { getSupabaseAdmin } from "@/lib/supabase";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    // upsert ผู้ใช้ลงตาราง users หลัง login ด้วย Google สำเร็จ
    async signIn({ user }) {
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
