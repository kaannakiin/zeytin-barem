"use client";
import { fetchWrapper } from "@/lib/fetchWrapper";
import { Button, FileInput, NumberInput, Paper, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useRef, useState } from "react";

interface FormValues {
  file: File | null;
  weight: number;
}

interface Prediction {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
  detection_id: string;
}

interface DetectionResult {
  data: {
    success: boolean;
    predictions: Prediction[];
    image: string;
    inference_id: string;
    time: number;
    imageInfo: {
      width: number;
      height: number;
    };
  };
  status: number;
}

const AddForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawDetections = (base64Image: string, predictions: Prediction[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Base64'ü temizle (data:image/jpeg;base64, kısmını kaldır)
    const cleanBase64 = base64Image.replace(
      /^data:image\/(png|jpeg|jpg);base64,/,
      ""
    );

    const image = new Image();
    // Base64'ü URL formatına çevir
    image.src = `data:image/jpeg;base64,${cleanBase64}`;

    // Debug
    console.log("Image source:", image.src.substring(0, 100) + "...");

    image.onload = () => {
      console.log("Image loaded:", image.width, "x", image.height);

      // Canvas boyutunu ayarla
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;

      // Arkaplanı temizle
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Görüntüyü çiz
      ctx.drawImage(image, 0, 0);

      // Debug
      console.log("Drawing predictions:", predictions.length);

      // Tahminleri çiz
      predictions.forEach((pred, index) => {
        // Dikdörtgen çiz
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;

        const x = pred.x - pred.width / 2;
        const y = pred.y - pred.height / 2;

        ctx.strokeRect(x, y, pred.width, pred.height);

        // Numarayı yaz
        ctx.fillStyle = "red";
        ctx.font = "bold 24px Arial";
        ctx.fillText(`#${index + 1}`, x, y - 5);

        // Debug
        console.log(`Drawing box ${index + 1}:`, {
          x,
          y,
          width: pred.width,
          height: pred.height,
        });
      });
    };

    image.onerror = (err) => {
      console.error("Görüntü yüklenirken hata oluştu:", err);
      console.error("Image source length:", image.src.length);
      // Base64'ün geçerli olup olmadığını kontrol et
      try {
        atob(cleanBase64);
        console.log("Base64 is valid");
      } catch (e) {
        console.error("Invalid base64:", e);
      }
    };
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      const formData = new FormData();

      if (values.file) {
        formData.append("image", values.file);
      }
      formData.append("weight", values.weight.toString());

      const response = await fetchWrapper.post<DetectionResult>(
        "/barem",
        formData
      );
      setResult(response);

      if (response.data?.image) {
        console.log("Response received with image data");
        // API yanıtını kontrol et
        console.log("Response data:", {
          imageLength: response.data.image.length,
          predictionsCount: response.data.predictions.length,
        });

        drawDetections(response.data.image, response.data.predictions);
      } else {
        console.error("No image data in response");
      }
    } catch (error) {
      console.error("API Error:", error);
      alert("Bir hata oluştu!");
    } finally {
      setIsLoading(false);
    }
  };

  const form = useForm<FormValues>({
    initialValues: {
      file: null,
      weight: 0,
    },
    validate: {
      file: (value) => (!value ? "Dosya gereklidir" : null),
      weight: (value) => (value <= 0 ? "Ağırlık 0'dan büyük olmalıdır" : null),
    },
  });

  return (
    <div className="max-w-xl w-full mx-auto p-4">
      <Paper shadow="sm" radius="md" p="md" className="mb-6">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <FileInput
            label="Fotoğraf Yükle"
            placeholder="Fotoğraf Seç"
            accept="image/*"
            className="mb-4"
            {...form.getInputProps("file")}
            error={form.errors.file}
          />

          <NumberInput
            label="Ağırlık"
            description="Zeytin ağırlığını gram olarak giriniz"
            min={0}
            className="mb-4"
            {...form.getInputProps("weight")}
            error={form.errors.weight}
          />

          <Button
            fullWidth
            type="submit"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? "İşleniyor..." : "Barem Ölç"}
          </Button>
        </form>
      </Paper>

      {result && (
        <Paper shadow="sm" radius="md" p="md">
          <Text size="lg" className="mb-4">
            Sonuçlar:
          </Text>

          <div className="space-y-4">
            <div>
              <Text color="blue" fw={500}>
                Tespit Edilen Zeytin Sayısı: {result.data.predictions.length}
              </Text>
              <Text color="red">
                Barem:
                {(1000 * result.data.predictions.length) / form.values.weight}
                {"Tane"}
              </Text>
              <Text size="sm" color="gray">
                İşlem Süresi: {result.data.time.toFixed(3)} saniye
              </Text>
            </div>

            <div className="relative w-full max-w-4xl mx-auto">
              <canvas
                ref={canvasRef}
                className="w-full h-auto object-contain rounded-lg shadow-sm"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <div>
              <Text fw={500} className="mb-2">
                Tespit Detayları:
              </Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {result.data.predictions.map((pred, index) => (
                  <Paper key={pred.detection_id} shadow="xs" p="xs">
                    <Text size="sm">
                      Zeytin #{index + 1} - Güven:{" "}
                      {(pred.confidence * 100).toFixed(1)}%
                    </Text>
                  </Paper>
                ))}
              </div>
            </div>
          </div>
        </Paper>
      )}
    </div>
  );
};

export default AddForm;
