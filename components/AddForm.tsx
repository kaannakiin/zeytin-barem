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
  const [result, setResult] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const drawDetections = (base64Image, predictions) => {
    return new Promise<void>((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject("Canvas not found");
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject("Context not found");
        return;
      }

      const cleanBase64 = base64Image.replace(
        /^data:image\/(png|jpeg|jpg);base64,/,
        ""
      );

      const image = new Image();
      image.src = `data:image/jpeg;base64,${cleanBase64}`;
      imageRef.current = image;

      image.onload = () => {
        // Canvas'ı görüntü boyutuna ayarla
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;

        // Görüntüyü çiz
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);

        // Tahminleri çiz
        predictions.forEach((pred, index) => {
          const x = pred.x - pred.width / 2;
          const y = pred.y - pred.height / 2;

          // Dikdörtgen
          ctx.strokeStyle = "blue";
          ctx.lineWidth = 5;
          ctx.strokeRect(x, y, pred.width, pred.height);

          // Numara
          ctx.fillStyle = "red";
          ctx.font = "bold 24px Arial";
          ctx.fillText(`#${index + 1}`, x, y - 5);
        });

        resolve();
      };

      image.onerror = (err) => {
        reject(`Image loading error: ${err}`);
      };
    });
  };
  useEffect(() => {
    if (result?.data?.image && result?.data?.predictions) {
      drawDetections(result.data.image, result.data.predictions).catch(
        console.error
      );
    }
  }, [result]);

  // Window resize olduğunda yeniden çiz
  useEffect(() => {
    const handleResize = () => {
      if (result?.data?.image && result?.data?.predictions) {
        drawDetections(result.data.image, result.data.predictions).catch(
          console.error
        );
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [result]);

  const handleSubmit = async (values) => {
    try {
      setIsLoading(true);
      const formData = new FormData();

      if (values.file) {
        formData.append("image", values.file);
      }
      formData.append("weight", values.weight.toString());

      const response = await fetchWrapper.post("/barem", formData);
      setResult(response);
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
                Barem:{" "}
                {Math.ceil(
                  (1000 * result.data.predictions.length) / form.values.weight
                ) / 10}
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
                  backgroundColor: "#fff",
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
