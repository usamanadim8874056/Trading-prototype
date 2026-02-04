import "./globals.css";
import BottomNav from "@/components/BottomNav";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="min-h-screen pb-60">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
