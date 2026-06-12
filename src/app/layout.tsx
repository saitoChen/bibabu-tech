import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bibabu 日报",
  description: "Bibabu 日报数据展示",
  icons: {
    icon: "/avator.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
