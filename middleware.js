import { withAuth } from "next-auth/middleware";

// ป้องกันหน้า leader/member — ถ้ายังไม่ login เด้งไป /login
export default withAuth({
  callbacks: { authorized: ({ token }) => !!token },
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/leader/:path*", "/member/:path*"],
};
