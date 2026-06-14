import "./globals.css";

export const metadata = {
  title: "Jessie's internship journey in Bytedance",
  description: "Jessie's internship journey in Bytedance"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
