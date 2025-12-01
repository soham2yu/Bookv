import React, { useState } from "react";

const UploadProcess: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [pdfLinks, setPdfLinks] = useState<{ original?: string; digital?: string }>({});

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("video", file);

    try {
      const response = await fetch("http://localhost:5000/api/process-video", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log(result);

      if (!response.ok) {
        setMessage(result.error || "Upload Failed ❌");
      } else {
        setPdfLinks({
          original: result.originalPdf,
          digital: result.digitalPdf,
        });
        setMessage("Upload Complete ✔");
      }
    } catch (err) {
      console.error(err);
      setMessage("Upload Failed ❌");
    }

    setUploading(false);
  };

  return (
    <div style={{
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      width: 400,
    }}>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
      />

      <button
        onClick={handleUpload}
        disabled={uploading}
        style={{ padding: "10px", background: "#000", color: "#fff", cursor: "pointer" }}
      >
        {uploading ? "Processing..." : "Upload & Process"}
      </button>

      {message && <p>{message}</p>}

      {pdfLinks.original && (
        <a href={`http://localhost:5000${pdfLinks.original}`} target="_blank" rel="noreferrer">
          📄 Download Original PDF
        </a>
      )}

      {pdfLinks.digital && (
        <a href={`http://localhost:5000${pdfLinks.digital}`} target="_blank" rel="noreferrer">
          ✨ Download Digital PDF
        </a>
      )}
    </div>
  );
};

export default UploadProcess;
