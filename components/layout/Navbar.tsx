"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="flex items-center justify-between border-b border-border px-6 py-4">
      <Link href="/" className="text-lg font-semibold text-medical-800">
        MedLens AI
      </Link>
      <div className="flex gap-4 text-sm text-muted-foreground items-center">
        <Link href="/upload" className="hover:text-foreground">
          Upload
        </Link>
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <Link href="/history" className="hover:text-foreground">
          History
        </Link>
        <button
          onClick={handleLogout}
          className="hover:text-foreground text-red-400 hover:text-red-600"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}