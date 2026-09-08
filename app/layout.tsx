import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mock Card Studio — บัตรข้อมูลทดสอบ",
  description: "สร้างบัตรข้อมูลจำลองสำหรับ QA แก้ไขแต่ละช่อง ดูตัวอย่าง และดาวน์โหลด PNG โดยข้อมูลประมวลผลในเบราว์เซอร์เท่านั้น",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}
