import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <nav className="sticky top-3 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-foreground transition-all duration-300 hover:scale-105 ai-glow rounded-lg px-2 py-1"
            data-testid="link-home-logo"
          >
            <div className="flex items-center gap-2 font-bold text-lg ai-glow rounded-lg px-2 py-1">
              <div className="relative h-6 lg:h-10 w-9 lg:w-35">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-green-100 rounded-3xl" />
                <img
                  src="/9.png"
                  alt="BookVision Logo"
                  className="relative h-full w-full object-cover rounded-3xl"
                />
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="/#how-it-works"
              className="text-sm text-muted-foreground hover:text-accent transition-all duration-300"
              data-testid="link-howitworks"
            >
              How It Works
            </a>
            <Link href="/pricing">
              <a className="text-sm text-muted-foreground hover:text-accent transition-all duration-300" data-testid="link-pricing">
                Pricing
              </a>
            </Link>
            <a
              href="/#features"
              className="text-sm text-muted-foreground hover:text-accent transition-all duration-300"
              data-testid="link-features"
            >
              Features
            </a>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" asChild className="text-muted-foreground hover:text-accent" data-testid="link-dashboard">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" onClick={signOut} className="text-muted-foreground hover:text-accent" data-testid="button-signout">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="text-muted-foreground hover:text-accent" data-testid="link-signin">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90" data-testid="link-getstarted">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-all duration-300"
            data-testid="button-mobile-menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-border">
            <a
              href="/#how-it-works"
              className="block px-4 py-2 text-sm text-muted-foreground hover:text-accent transition-all duration-300"
              data-testid="link-mobile-howitworks"
            >
              How It Works
            </a>
            <Link href="/pricing">
              <a className="block px-4 py-2 text-sm text-muted-foreground hover:text-accent transition-all duration-300" data-testid="link-mobile-pricing">
                Pricing
              </a>
            </Link>
            <div className="flex gap-2 pt-2 px-4">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" asChild className="flex-1" data-testid="button-mobile-dashboard">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={signOut} className="flex-1" data-testid="button-mobile-signout">
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="flex-1" data-testid="button-mobile-signin">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button size="sm" asChild className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" data-testid="button-mobile-getstarted">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
