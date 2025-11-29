import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FloatingElements } from "@/components/floating-elements";
import { ParticleBackground } from "@/components/particle-background";
import { signUpWithEmail, signInWithGoogle } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    agreeTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.password.length < 6) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Password must be at least 6 characters long.",
        });
        return;
      }

      if (!formData.agreeTerms) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please agree to the Terms of Service and Privacy Policy.",
        });
        return;
      }

      await signUpWithEmail(formData.email, formData.password);
      toast({ title: "Success!", description: "Account created successfully!" });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Google sign up failed. Please try again.",
      });
      setLoading(false);
    }
  };

  return (
    <>
      <ParticleBackground />
      <FloatingElements />
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background relative">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 mb-12 transition-all duration-300 hover:scale-105 ai-glow rounded-lg px-2 py-1"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-yellow-400 rounded-lg flex items-center justify-center text-accent-foreground text-white font-bold pulse-glow">
              <img
                src="/9.png"
                alt="BookVision Logo"
                className="relative h-full w-full object-cover rounded-2xl"
              />
            </div>
            <span className="font-bold text-xl text-gradient">BookVision</span>
          </Link>

          <div className="luxury-card-premium border border-accent/20 rounded-2xl p-8 bg-card/95 backdrop-blur-md shadow-2xl golden-glow">
            <h1 className="text-3xl font-bold mb-2 text-gradient">Create account</h1>
            <p className="text-muted-foreground mb-8">Start digitizing your books today</p>

            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-background/50 border-accent/20 focus:border-accent/50 focus:ring-accent/30"
                  data-testid="input-email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="bg-background/50 border-accent/20 focus:border-accent/50 focus:ring-accent/30"
                  data-testid="input-password"
                />
                <p className="text-xs text-muted-foreground mt-2">At least 6 characters</p>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="agree"
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="mt-1 rounded border-accent/30 bg-background/50"
                  required
                  data-testid="checkbox-agree"
                />
                <label htmlFor="agree" className="text-sm text-muted-foreground">
                  I agree to the Terms of Service and Privacy Policy
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-accent to-yellow-400 text-accent-foreground hover:from-accent/90 hover:to-yellow-400/90 ai-glow"
                disabled={loading || !formData.agreeTerms}
                data-testid="button-signup"
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card/80 text-muted-foreground rounded-full">Or sign up with</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mb-6 bg-transparent border-accent/30 hover:bg-accent/5 glass-effect"
              onClick={handleGoogleSignup}
              disabled={loading}
              data-testid="button-google-signup"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login">
                <a className="text-accent hover:underline font-medium ai-glow rounded px-1">Sign in</a>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
