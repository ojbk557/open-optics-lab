import type { Metadata } from "vinext/shims/metadata";
import { headers } from "vinext/shims/headers";
import "./globals.css";

const description =
  "面向光学学习、预研与实验准备的透明计算工具：成像系统、衍射、MTF 与高斯光束传播。";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const imageUrl = new URL("/og.png", metadataBase);

  return {
    metadataBase,
    title: {
      default: "OpenOptics Lab · 成像与激光计算",
      template: "%s · OpenOptics Lab",
    },
    description,
    openGraph: {
      title: "OpenOptics Lab · 成像与激光计算",
      description,
      type: "website",
      images: [{ url: imageUrl, width: 1731, height: 909, alt: "OpenOptics Lab 成像与激光计算工作台" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "OpenOptics Lab · 成像与激光计算",
      description,
      images: [imageUrl],
    },
  };
}

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
