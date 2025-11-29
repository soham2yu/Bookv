import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "@shared/schema";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: documents, isLoading: docsLoading, refetch } = useQuery<Document[]>({
    queryKey: ["/api/documents", user?.uid],
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>;
  }

  if (!user) {
    return null;
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("title", file.name.replace(/\.[^/.]+$/, ""));

      const response = await fetch("/api/upload-video", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${await user.getIdToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      
      toast({
        title: "Success!",
        description: "Video uploaded successfully and is being processed.",
      });

      setFile(null);
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload video. Please try again.",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleDownload = async (url: string | null | undefined, type: string) => {
    if (!url) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "PDF not available yet",
      });
      return;
    }

    try {
      const { data } = await supabase.storage.from("bookvision-docs").createSignedUrl(url, 3600);
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download PDF",
      });
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-pretty-subheading">Upload videos and manage your digitized books</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">Upload Video</h2>
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                  dragActive ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleChange}
                  className="hidden"
                  disabled={uploading}
                  data-testid="input-video"
                />

                {!file ? (
                  <div>
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-accent opacity-60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3m21-9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {dragActive ? "Drop your video here" : "Drag and drop your video"}
                    </h3>
                    <p className="text-muted-foreground mb-6">Supported formats: MP4, MOV, AVI, WebM (Max 5GB)</p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                      data-testid="button-choose-file"
                    >
                      Choose File
                    </Button>
                  </div>
                ) : (
                  <div>
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-filename">{file.name}</h3>
                    <p className="text-muted-foreground mb-6">{formatFileSize(file.size)}</p>

                    {uploading && (
                      <div className="mb-6">
                        <div className="w-full bg-border rounded-full h-2 mb-2">
                          <div
                            className="bg-accent h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-muted-foreground">{uploadProgress}% uploaded</p>
                      </div>
                    )}

                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() => setFile(null)}
                        variant="outline"
                        disabled={uploading}
                        className="border-border"
                        data-testid="button-change-file"
                      >
                        Change File
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                        data-testid="button-upload"
                      >
                        {uploading ? "Uploading..." : "Upload & Process"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="luxury-card border border-border/50">
              <h3 className="font-semibold text-foreground mb-4">Processing Info</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>Videos are processed automatically using AI</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>Frames are extracted every 2 seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>Two PDFs are generated: Original and OCR version</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>Processing typically takes 2-10 minutes depending on video length</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Your Documents</h2>
            {docsLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading documents...</p>
              </div>
            ) : !documents || documents.length === 0 ? (
              <div className="p-12 border border-dashed border-border rounded-2xl text-center bg-muted">
                <svg
                  className="w-16 h-16 mx-auto text-muted-foreground opacity-30 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C6.5 6.253 2 10.753 2 16.253s4.5 10 10 10 10-4.5 10-10c0-5.5-4.5-10-10-10z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-foreground mb-2">No documents yet</h3>
                <p className="text-muted-foreground">Upload your first video to get started</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => (
                  <div key={doc.id} className="luxury-card border border-border/50" data-testid={`card-document-${doc.id}`}>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-foreground text-lg" data-testid={`text-title-${doc.id}`}>{doc.title}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          doc.status === "completed"
                            ? "bg-green-500/20 text-green-600"
                            : doc.status === "processing"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-red-500/20 text-red-600"
                        }`}
                        data-testid={`status-${doc.id}`}
                      >
                        {doc.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4" data-testid={`text-date-${doc.id}`}>
                      Created recently
                    </p>
                    {doc.status === "completed" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDownload(doc.originalPdfUrl, "original")}
                          data-testid={`button-download-original-${doc.id}`}
                        >
                          Original PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDownload(doc.ocrPdfUrl, "ocr")}
                          data-testid={`button-download-ocr-${doc.id}`}
                        >
                          OCR PDF
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
