import React, { useState } from "react";

const UploadProcess: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [pdfLinks, setPdfLinks] = useState<{ original?: string; digital?: string }>({});

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const form = new FormData();
      form.append("file", file); // IMPORTANT -> matches backend upload.single("file")

      const response = await fetch("http://localhost:5000/api/scan", {
        method: "POST",
        body: form,
      });

      const result = await response.json();
      console.log(result);

      if (!response.ok) {
        setMessage(result.error || "Upload Failed ❌");
        return;
      }

      setPdfLinks({
        original: result.originalPdfUrl,
        digital: result.digitalPdfUrl,
      });

      setMessage("Processing Completed ✔ PDFs Ready to Download");
    } catch (err) {
      console.error(err);
      setMessage("Upload Failed ❌");
    }

    setUploading(false);
  };

  return (
    <div style={{
      padding: 30,
      display: "flex",
      flexDirection: "column",
      gap: 15,
      width: "100%",
      maxWidth: 500,
      margin: "0 auto",
      textAlign: "center"
    }}>
      <h2>BookVision OCR Processor</h2>

      <input
        type="file"
        accept="video/*,image/*"
        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
      />

      <button
        onClick={handleUpload}
        disabled={uploading}
        style={{
          padding: 12,
          background: "black",
          color: "white",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 16
        }}
      >
        {uploading ? "Processing..." : "Upload & Process"}
      </button>

      {message && <p>{message}</p>}

      {pdfLinks.original && (
        <a
          href={`http://localhost:5000${pdfLinks.original}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "blue" }}
        >
          Download Original PDF
        </a>
      )}

      {pdfLinks.digital && (
        <a
          href={`http://localhost:5000${pdfLinks.digital}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "green" }}
        >
          Download Digital PDF (Searchable)
        </a>
      )}
    </div>
  );
};

export default UploadProcess;
