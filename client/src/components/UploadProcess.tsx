import React, { useState } from "react";

const UploadProcess: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [pdfLinks, setPdfLinks] = useState<{ original?: string; digital?: string }>({});

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first ❌");
      return;
    }

    setUploading(true);
    setMessage("Uploading & Processing... ⏳");

    try {
      const formData = new FormData();
      formData.append("video", file);

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

        setMessage("Processing Completed ✔ PDFs Ready");
      }
    } catch (err) {
      console.error(err);
      setMessage("Upload Failed ❌");
    }

    setUploading(false);
  };

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>BookVision OCR Processor</h2>

      <input
        type="file"
        accept="video/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setMessage(`Selected: ${e.target.files[0].name}`);
          }
        }}
      />

      <button
        onClick={handleUpload}
        disabled={uploading}
        style={{
          marginTop: 20,
          padding: 12,
          background: "black",
          color: "white",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {uploading ? "Processing..." : "Upload & Process"}
      </button>

      <p>{message}</p>

{pdfLinks.original && (
  <a
    href={`http://localhost:5000${pdfLinks.original}`}
    target="_blank"
    rel="noopener noreferrer"
    style={{ display: "block", marginTop: 10 }}
  >
    📄 View Original PDF
  </a>
)}

{pdfLinks.digital && (
  <a
    href={`http://localhost:5000${pdfLinks.digital}`}
    target="_blank"
    rel="noopener noreferrer"
    style={{ display: "block", marginTop: 10 }}
  >
    ✨ View Digital PDF
  </a>
)}

    </div>
  );
};

export default UploadProcess;
