import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { FloatingElements } from "@/components/floating-elements";
import { ParticleBackground } from "@/components/particle-background";

export default function Home() {
  return (
    <>
      <ParticleBackground />
      <FloatingElements />
      <Navbar />
      <main className="min-h-screen bg-background relative">
        <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 border-b border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 ai-circuit opacity-5"></div>
          <div className="max-w-7xl mx-auto relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              <div className="space-y-6">
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-accent/20 to-blue-500/20 border border-accent/30 text-accent rounded-full text-sm font-semibold ai-glow">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                    AI-Powered Digitization Platform
                  </span>
                </div>
                <h1 className="text-pretty-display text-gradient leading-tight">
                  Where Books become data.
                </h1>
                <p className="text-pretty-subheading max-w-xl">
                  Record books with your smartphone. AI extracts pages, removes glare, and generates searchable PDFs
                  with ownership proof.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    size="lg"
                    asChild
                    className="bg-gradient-to-r from-accent to-yellow-400 text-accent-foreground hover:from-accent/90 hover:to-yellow-400/90 transition-all duration-300 hover:scale-105 ai-glow"
                    data-testid="button-get-started-hero"
                  >
                    <Link href="/signup">Get Started Free</Link>
                  </Button>
                </div>
              </div>

              <div className="relative h-96 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-blue-500/10 to-purple-500/10 rounded-3xl blur-3xl floating-element"></div>
                <div className="relative group">
                  <div className="w-107 h-130 bg-gradient-to-br from-accent/20 via-blue-500/10 to-purple-500/10 rounded-2xl border border-accent/30 shadow-2xl flex items-center justify-center transform hover:scale-102 transition-all duration-500  ai-glow">
                    <div className="absolute left-5 top-4 bottom-4 w-2 book-spine rounded-l-lg"></div>
                    <div className="relative w-96 h-130 flex items-center justify-center">
                      <div className="text-center relative z-10">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-accent to-yellow-400 rounded-full flex items-center justify-center pulse-glow">
                          <svg
                            className="w-12 h-12 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C6.5 6.253 2 10.753 2 16.253s4.5 10 10 10 10-4.5 10-10c0-5.5-4.5-10-10-10z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">AI Processing</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-border/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gradient">How BookVision Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Simple steps to digitize your entire book collection in minutes
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: 1, title: "Record Video", desc: "Flip through your book with your smartphone camera" },
                { step: 2, title: "Upload", desc: "Submit your video file to BookVision" },
                { step: 3, title: "AI Processing", desc: "Automatic page detection and glare removal" },
                { step: 4, title: "Download", desc: "Get your searchable PDF instantly" },
              ].map((item) => (
                <div key={item.step} className="text-center group">
                  <div className="mb-6 relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-yellow-400 border border-white/20 flex items-center justify-center mx-auto text-3xl ai-glow shadow-2xl transform group-hover:scale-110 transition-all duration-500">
                      {item.step}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="inline-block px-3 py-1 bg-accent/10 rounded-full text-accent text-sm font-semibold">
                      Step {item.step}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
