import { Noto_Sans_Thai, Prompt } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

// ฟอนต์หัวข้อ — ให้มีคาแรกเตอร์ต่างจาก body
const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
});

export const metadata = {
  title: "TaskHub",
  description: "ระบบติดตามงานและ mood สำหรับทีมทุกประเภท",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${notoSansThai.variable} ${prompt.variable} h-full`}>
      <body className="min-h-full bg-surface text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
