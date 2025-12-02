import React, { useState, useRef } from "react";

const UploadProcess: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [pdfLinks, setPdfLinks] = useState<{ original?: string; digital?: string }>({});
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const handleUpload = () => {
    if (!file) return;

    setUploading(true);
    setMessage("");
    setProgress(0);

    const formData = new FormData();
    formData.append("video", file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setProgress(pct);
      }
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        setUploading(false);
        setProgress(100);

        try {
          const result = JSON.parse(xhr.responseText || "{}");

          if (xhr.status >= 400 || !result.success) {
            setMessage(result.error || result.details || "Upload failed");
            return;
          }

          // Use camelCase fields returned by server for URLs
          const orig = result.originalPdf || result.original_pdf;
          const dig = result.digitalPdf || result.digital_pdf;

          setPdfLinks({ original: orig, digital: dig });
          setMessage("Processing complete ✔");
        } catch (err) {
          setMessage("Unexpected server response");
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setMessage("Upload failed (network error)");
    };

    xhr.open("POST", "http://localhost:5000/api/process-video");
    xhr.send(formData);
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      setUploading(false);
      setMessage("Upload cancelled");
      setProgress(0);
    }
  };

  return (
    <div style={{
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      width: 420,
    }}>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{ padding: "10px", background: "#0b61ff", color: "#fff", cursor: "pointer", border: "none" }}
        >
          {uploading ? "Uploading..." : "Upload & Process"}
        </button>

        {uploading && (
          <button onClick={cancelUpload} style={{ padding: "10px" }}>
            Cancel
          </button>
        )}
      </div>

      {uploading && (
        <div style={{ width: "100%" }}>
          <div style={{ height: 10, background: "#eee", borderRadius: 6 }}>
            <div style={{ width: `${progress}%`, height: 10, background: "#0b61ff", borderRadius: 6 }} />
          </div>
          <small>{progress}%</small>
        </div>
      )}

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
