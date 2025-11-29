import { useState } from "react";
import axios from "axios";

export default function OCRPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("UPLOAD RESPONSE:", res.data);
      setStatus("Uploaded successfully");
    } catch (err) {
      console.error(err);
      setStatus("Failed to upload");
    }
  };

  return (
    <div className="p-6 text-white">
      <input
        type="file"
        accept="video/mp4,image/jpeg,image/png"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button className="bg-black p-2 rounded mx-2" onClick={handleUpload}>
        Upload & Process
      </button>
      <p>{status}</p>
    </div>
  );
}
