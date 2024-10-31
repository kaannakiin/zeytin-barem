// app/api/detect/route.ts
import { NextRequest, NextResponse } from "next/server";

const ROBOFLOW_API_KEY = "S61hDOHqkCQNmMTJQTmm";
const ROBOFLOW_MODEL = "olive-axotr/3";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file = data.get("image");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    const response = await fetch(
      `https://detect.roboflow.com/${ROBOFLOW_MODEL}?api_key=${ROBOFLOW_API_KEY}`,
      {
        method: "POST",
        body: base64Image,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      predictions: result.predictions,
      image: `data:image/jpeg;base64,${base64Image}`,
      inference_id: result.inference_id,
      time: result.time,
      imageInfo: result.image,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Detection failed", details: error.message },
      { status: 500 }
    );
  }
}
