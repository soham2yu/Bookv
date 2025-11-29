import React, { useState } from "react";

const Upload = ({ onResult }: { onResult: (text: string) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an image first");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://127.0.0.1:8080/htr", {
        method: "POST",
        body: formData,
      });

      // Read raw response text
      const textResponse = await response.text();
      console.log("RAW RESPONSE:", textResponse);

      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (err) {
        console.error("JSON PARSE ERROR:", err);
        onResult(textResponse);
        return;
      }

      onResult(data.text);
    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      onResult("Error: Unable to process. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded-md">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        onClick={handleUpload}
        disabled={loading}
        className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md"
      >
        {loading ? "Processing..." : "Upload & Process"}
      </button>
    </div>
  );
};

export default Upload;
