import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-gradient-to-t from-background to-card/20 py-12 md:py-16 relative overflow-hidden">
      <div className="absolute inset-0 ai-circuit opacity-10"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg mb-4 ai-glow rounded-lg px-2 py-1">
              <div className="relative h-6 lg:h-24 w-7 lg:w-58">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl" />
                <img
                  src="/9.png"
                  alt="BookVision Logo"
                  className="relative h-full w-full object-cover rounded-3xl"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered digitization for books and knowledge preservation.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm text-foreground">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/#how-it-works" className="hover:text-accent transition-all duration-300" data-testid="link-footer-howitworks">
                  How It Works
                </a>
              </li>
              <li>
                <Link href="/pricing">
                  <a className="hover:text-accent transition-all duration-300" data-testid="link-footer-pricing">Pricing</a>
                </Link>
              </li>
              <li>
                <Link href="/dashboard">
                  <a className="hover:text-accent transition-all duration-300" data-testid="link-footer-dashboard">Dashboard</a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm text-foreground">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#docs" className="hover:text-accent transition-all duration-300" data-testid="link-footer-docs">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#blog" className="hover:text-accent transition-all duration-300" data-testid="link-footer-blog">
                  Blog
                </a>
              </li>
              <li>
                <a href="#support" className="hover:text-accent transition-all duration-300" data-testid="link-footer-support">
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm text-foreground">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#privacy" className="hover:text-accent transition-all duration-300" data-testid="link-footer-privacy">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-accent transition-all duration-300" data-testid="link-footer-terms">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>&copy; 2025 BookVision. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-accent transition-all duration-300" data-testid="link-footer-twitter">
              Twitter
            </a>
            <a href="#" className="hover:text-accent transition-all duration-300" data-testid="link-footer-github">
              GitHub
            </a>
            <a href="#" className="hover:text-accent transition-all duration-300" data-testid="link-footer-linkedin">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
