import { useState } from "react";
import axios from "axios";

export default function OCRPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return alert("Select a file first");

    setStatus("Processing...");

    const formData = new FormData();
    formData.append("video", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/process-video",
        formData
      );

      console.log(res.data);
      setResult(res.data);
      setStatus("Completed ✔");
    } catch (err) {
      console.error(err);
      setStatus("Upload Failed ❌");
    }
  };

  return (
    <div className="p-6 text-white">
      <input
        type="file"
        accept="video/mp4,image/jpeg,image/png"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        className="bg-black p-2 rounded mx-2"
        onClick={handleUpload}
        disabled={status === "Processing..."}
      >
        {status === "Processing..." ? "Processing..." : "Upload & Process"}
      </button>

      <p>{status}</p>

      {result && (
        <div>
          <a
            href={`http://localhost:5000${result.original_pdf}`}
            target="_blank"
            className="text-green-400"
          >
            View Original PDF
          </a>
          <br />
          <a
            href={`http://localhost:5000${result.digital_pdf}`}
            target="_blank"
            className="text-blue-400"
          >
            View Digital PDF
          </a>
        </div>
      )}
    </div>
  );
}
