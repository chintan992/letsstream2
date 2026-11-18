import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared shell for the unauthenticated screens (sign in, sign up, password
 * reset).
 *
 * These routes render outside the Navbar, so they provide their own landmark
 * and a way back into the site instead of stranding the visitor on a dead end.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back to Let&apos;s Stream
      </Link>
      {children}
    </main>
  );
}
