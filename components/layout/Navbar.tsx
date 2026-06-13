import Link from "next/link";

export function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-border px-6 py-4">
      <Link href="/" className="text-lg font-semibold text-medical-800">
        MedLens AI
      </Link>
      <div className="flex gap-4 text-sm text-muted-foreground">
        <Link href="/upload" className="hover:text-foreground">
          Upload
        </Link>
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
      </div>
    </nav>
  );
}
