import { spawn } from "child_process";
import path from "path";

export async function runProcessVideo(videoPath: string, outputDir: string) {
  console.log("⚙️ Starting Python script...");
  console.log("📁 Video Path:", videoPath);
  console.log("📁 Output Dir:", outputDir);

  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "../script/process_video.py");
    console.log("🐍 Running script:", scriptPath);

    const process = spawn("python", [scriptPath, videoPath, outputDir]);

    let finalJson: any = null;

    process.stdout.on("data", (data) => {
      const text = data.toString().trim();
      console.log("PYTHON STDOUT:", text);

      try {
        finalJson = JSON.parse(text);
      } catch (_) {}
    });

    process.stderr.on("data", (data) => {
      console.error("❌ PYTHON ERROR:", data.toString());
    });

    process.on("close", (code) => {
      console.log("🔚 Python process exited with code:", code);

      if (code === 0 && finalJson) resolve(finalJson);
      else reject("Python script failed");
    });
  });
}
