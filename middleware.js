import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // ถ้า login แล้ว ห้ามกลับไปหน้า public auth (homepage / login / signup / ลืมรหัสผ่าน)
    // เด้งเข้า workspace — (session ยังอยู่ครบ) กลับหน้าแรกได้ต่อเมื่อ logout เท่านั้น
    const publicAuthPaths = ["/", "/login", "/signup", "/forgot-password"];
    if (token && publicAuthPaths.includes(pathname)) {
      return NextResponse.redirect(new URL("/leader", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // ตัดสินว่า request ไหน "ผ่าน" เข้า middleware function ด้านบนได้
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // หน้า protected — ยังไม่ login เด้งไป /login
        if (pathname.startsWith("/leader") || pathname.startsWith("/member")) {
          return !!token;
        }
        // หน้า public (/, /login) ให้ผ่านเสมอ แล้วไปจัดการ redirect ใน middleware function
        return true;
      },
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/", "/login", "/signup", "/forgot-password", "/leader/:path*", "/member/:path*"],
};
