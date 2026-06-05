"use client";
import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import { Cropper, CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import {
  Upload,
  X,
  Download,
  Zap,
  Lock,
  Unlock,
  FileType,
  MousePointerClick,
  CheckCircle2,
  Sliders,
  Maximize2,
  FileText,
  Sparkles,
  Image as ImageIcon,
  RefreshCw,
  Crop,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  // State Navigasi Tab (Sekarang Mendukung 3 Tab)
  const [activeTab, setActiveTab] = useState<"img2pdf" | "pdf2img" | "cropper">(
    "img2pdf",
  );

  // ==========================================
  // STATE & LOGIKA FITUR 1: GAMBAR KE PDF
  // ==========================================
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [quality, setQuality] = useState<number>(0.8);
  const [resizeScale, setResizeScale] = useState<number>(1.0);
  const [pasfotoSize, setPasfotoSize] = useState<string>("original");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setImages((prev) => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const processImage = (
    imgSrc: string,
    scale: number,
    imgQuality: number,
    targetRatio: string,
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imgSrc;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let targetWidth = img.width;
        let targetHeight = img.height;
        let sourceX = 0,
          sourceY = 0,
          sourceWidth = img.width,
          sourceHeight = img.height;

        let ratioMultiplier = 0;
        if (targetRatio === "2x3") ratioMultiplier = 2 / 3;
        else if (targetRatio === "3x4") ratioMultiplier = 3 / 4;
        else if (targetRatio === "4x6") ratioMultiplier = 4 / 6;

        if (ratioMultiplier > 0 && ctx) {
          const currentRatio = img.width / img.height;
          if (currentRatio > ratioMultiplier) {
            sourceWidth = img.height * ratioMultiplier;
            sourceX = (img.width - sourceWidth) / 2;
          } else {
            sourceHeight = img.width / ratioMultiplier;
            sourceY = (img.height - sourceHeight) / 2;
          }
          targetWidth = sourceWidth * scale;
          targetHeight = sourceHeight * scale;
        } else {
          targetWidth = img.width * scale;
          targetHeight = img.height * scale;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            targetWidth,
            targetHeight,
          );
          resolve(canvas.toDataURL("image/jpeg", imgQuality));
        } else {
          resolve(imgSrc);
        }
      };
    });
  };

  const convertToPdf = async () => {
    if (images.length === 0) return;
    setIsConverting(true);

    let pdfFormat: [number, number] | string = "a4";
    if (pasfotoSize === "2x3") pdfFormat = [2, 3];
    else if (pasfotoSize === "3x4") pdfFormat = [3, 4];
    else if (pasfotoSize === "4x6") pdfFormat = [4, 6];

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "cm",
      format: pdfFormat,
    });

    for (let i = 0; i < images.length; i++) {
      const imgFile = images[i].file;
      const originalDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imgFile);
      });

      const processedDataUrl = await processImage(
        originalDataUrl,
        resizeScale,
        quality,
        pasfotoSize,
      );
      const imgProps = doc.getImageProperties(processedDataUrl);

      if (i > 0) doc.addPage(pdfFormat, "portrait");

      const pdfMaxW = doc.internal.pageSize.getWidth();
      const pdfMaxH = doc.internal.pageSize.getHeight();

      let renderW = pdfMaxW;
      let renderH = (imgProps.height * renderW) / imgProps.width;

      if (renderH > pdfMaxH) {
        renderH = pdfMaxH;
        renderW = (imgProps.width * renderH) / imgProps.height;
      }

      const posX = (pdfMaxW - renderW) / 2;
      const posY = (pdfMaxH - renderH) / 2;

      doc.addImage(processedDataUrl, "JPEG", posX, posY, renderW, renderH);
    }

    doc.save("dokumen-konversi-img2pdf.pdf");
    setIsConverting(false);
  };

  // ==========================================
  // STATE & LOGIKA FITUR 2: PDF KE GAMBAR
  // ==========================================
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreviews, setPdfPreviews] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [outputFormat, setOutputFormat] = useState<string>("image/png");
  const [renderScale, setRenderScale] = useState<number>(3.0);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      setPdfPreviews([]);
    }
  };

  const processPdfToImages = async () => {
    if (!pdfFile) return;
    setIsExtracting(true);
    setPdfPreviews([]);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const fileReader = new FileReader();
      fileReader.onload = async function () {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        const loadingTask = pdfjs.getDocument({ data: typedarray });
        const pdf = await loadingTask.promise;
        const previewsArray: string[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: renderScale });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            await page.render({ canvasContext: ctx, viewport }).promise;
            previewsArray.push(canvas.toDataURL("image/png"));
          }
        }
        setPdfPreviews(previewsArray);
        setIsExtracting(false);
      };
      fileReader.readAsArrayBuffer(pdfFile);
    } catch (error) {
      console.error("Gagal mengekstrak halaman PDF:", error);
      setIsExtracting(false);
    }
  };

  const downloadImagesFromPdf = () => {
    if (pdfPreviews.length === 0) return;

    pdfPreviews.forEach((dataUrl, index) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0);
          const finalDataUrl = canvas.toDataURL(outputFormat, 1.0);
          const ext = outputFormat.split("/")[1];
          const a = document.createElement("a");
          a.href = finalDataUrl;
          a.download = `halaman-${index + 1}.${ext === "jpeg" ? "jpg" : ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      };
    });
  };

  // ==========================================
  // STATE & LOGIKA FITUR 3: CROPPER ALA ADOBE EXPRESS
  // ==========================================
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropOriginalSize, setCropOriginalSize] = useState<number>(0);
  const [cropNewSize, setCropNewSize] = useState<number>(0);
  const [cropAspectMode, setCropAspectMode] = useState<string>("custom");
  const [cropW, setCropW] = useState<number>(27);
  const [cropH, setCropH] = useState<number>(40);
  const [cropUnit, setCropUnit] = useState<string>("mm");
  const [cropLocked, setCropLocked] = useState<boolean>(true);
  const [cropQuality, setCropQuality] = useState<number>(100);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const cropperRef = useRef<CropperRef>(null);
  const cropperInputRef = useRef<HTMLInputElement>(null);

  const handleCropperFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCropOriginalSize(Math.round(file.size / 1024));
      const reader = new FileReader();
      reader.onload = () => setCropImageSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleZoomSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCropZoom(val);
    if (cropperRef.current) cropperRef.current.zoom(val / cropZoom);
  };

  const updateSizeEstimate = () => {
    if (!cropperRef.current) return;
    const canvas = cropperRef.current.getCanvas();
    if (canvas) {
      canvas.toBlob(
        (blob) => {
          if (blob) setCropNewSize(Math.round(blob.size / 1024));
        },
        "image/jpeg",
        cropQuality / 100,
      );
    }
  };

  useEffect(() => {
    if (cropAspectMode === "3x4") {
      setCropW(3);
      setCropH(4);
    } else if (cropAspectMode === "4x6") {
      setCropW(4);
      setCropH(6);
    }
  }, [cropAspectMode]);

  const downloadCroppedImage = () => {
    if (!cropperRef.current) return;
    const canvas = cropperRef.current.getCanvas();
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/jpeg", cropQuality / 100);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `pangkas-foto-adobe.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const calculatedRatio =
    cropLocked && cropW && cropH ? cropW / cropH : undefined;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navbar & Tab Controllers */}
      <nav className="border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center bg-white sticky top-0 z-50 shadow-sm gap-4">
        <span className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <Zap size={24} fill="currentColor" /> imgconverterpdf
        </span>

        {/* Tab Switcher Controller dengan 3 Pilihan */}
        <div className="flex bg-slate-100 p-1 rounded-xl border flex-wrap justify-center">
          <button
            onClick={() => setActiveTab("img2pdf")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "img2pdf"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <ImageIcon size={14} /> Gambar ke PDF
          </button>
          <button
            onClick={() => setActiveTab("pdf2img")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "pdf2img"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <FileText size={14} /> PDF ke Gambar
          </button>
          <button
            onClick={() => setActiveTab("cropper")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "cropper"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Crop size={14} /> Pangkas Gambar
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto pt-12 px-4 pb-20">
        {/* ==========================================
            TAB 1: GAMBAR KE PDF
           ========================================== */}
        {activeTab === "img2pdf" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                Konversi <span className="text-blue-600">Gambar ke PDF</span>{" "}
                Gratis
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto text-center">
                Gabungkan foto JPG, PNG, dan WebP menjadi satu file PDF
                berkualitas tinggi secara instan.
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="group border-4 border-dashed border-blue-200 bg-white rounded-3xl p-12 text-center cursor-pointer hover:border-blue-500 hover:shadow-xl transition-all"
            >
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div className="bg-blue-600 text-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
                <Upload size={36} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                Pilih Foto atau Seret ke Sini
              </h2>
            </div>

            <AnimatePresence>
              {images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 bg-white rounded-2xl shadow-xl border p-6 border-blue-100"
                >
                  <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h3 className="font-bold text-slate-700">
                      Pratinjau ({images.length} Gambar)
                    </h3>
                    <button
                      onClick={() => setImages([])}
                      className="text-red-500 text-sm hover:underline"
                    >
                      Hapus Semua
                    </button>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
                    {images.map((img, index) => (
                      <div
                        key={index}
                        className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-sm border group"
                      >
                        <img
                          src={img.preview}
                          alt="Pratinjau"
                          className="object-cover w-full h-full"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Toolkit Settings */}
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl border space-y-5">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Sliders size={16} className="text-blue-600" /> Pengaturan
                      Kompresi
                    </h4>
                    <div>
                      <span className="text-xs font-semibold text-slate-600 block mb-1">
                        Potong Rasio Pasfoto Cetak
                      </span>
                      <select
                        value={pasfotoSize}
                        onChange={(e) => setPasfotoSize(e.target.value)}
                        className="w-full p-2 bg-white border rounded-lg text-sm font-semibold"
                      >
                        <option value="original">Asli (Tanpa Potong)</option>
                        <option value="2x3">Pasfoto 2 x 3 cm</option>
                        <option value="3x4">Pasfoto 3 x 4 cm</option>
                        <option value="4x6">Pasfoto 4 x 6 cm</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={convertToPdf}
                    disabled={isConverting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-extrabold py-5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3"
                  >
                    {isConverting ? (
                      "Sedang Memproses..."
                    ) : (
                      <>
                        <Download size={24} /> DOWNLOAD PDF SEKARANG
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ==========================================
            TAB 2: PDF KE GAMBAR (ENHANCED)
           ========================================== */}
        {activeTab === "pdf2img" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                Konversi <span className="text-blue-600">PDF ke Gambar</span>{" "}
                Tajam
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto text-center">
                Ubah berkas dokumen PDF Anda menjadi file gambar beresolusi
                super jernih dengan instan.
              </p>
            </div>

            <div
              onClick={() => pdfInputRef.current?.click()}
              className="group border-4 border-dashed border-emerald-200 bg-white rounded-3xl p-12 text-center cursor-pointer hover:border-emerald-500 hover:shadow-xl transition-all"
            >
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                ref={pdfInputRef}
                onChange={handlePdfChange}
              />
              <div className="bg-emerald-600 text-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
                <FileText size={36} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                {pdfFile ? pdfFile.name : "Pilih Berkas PDF Anda"}
              </h2>
            </div>

            <AnimatePresence>
              {pdfFile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 bg-white rounded-2xl shadow-xl border p-6 border-emerald-100"
                >
                  <div className="grid md:grid-cols-2 gap-6 mb-6 p-4 bg-slate-50 rounded-xl border">
                    <div>
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-2">
                        <Sparkles size={14} className="text-amber-500" />{" "}
                        Tingkat Kejernihan Gambar
                      </label>
                      <select
                        value={renderScale}
                        onChange={(e) =>
                          setRenderScale(parseFloat(e.target.value))
                        }
                        className="w-full p-2 bg-white border rounded-lg text-sm font-semibold"
                      >
                        <option value={1.5}>
                          Standar (Resolusi Rendah - File Kecil)
                        </option>
                        <option value={3.0}>
                          Tajam / Jernih HD (Sangat Direkomendasikan)
                        </option>
                        <option value={4.5}>
                          Super Jernih Ultra HD (Detail Sangat Tinggi)
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">
                        Format Ekspor Gambar
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {["image/png", "image/jpeg", "image/webp"].map(
                          (fmt) => (
                            <button
                              key={fmt}
                              type="button"
                              onClick={() => setOutputFormat(fmt)}
                              className={`p-2 text-xs font-bold rounded-lg border text-center ${outputFormat === fmt ? "bg-emerald-600 text-white" : "bg-white text-slate-600"}`}
                            >
                              {fmt.split("/")[1].toUpperCase()}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  {pdfPreviews.length === 0 && !isExtracting && (
                    <button
                      onClick={processPdfToImages}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-md font-bold py-4 rounded-xl shadow-md transition-all"
                    >
                      MULAI EKSTRAK & JENIHKAN GAMBAR
                    </button>
                  )}

                  {isExtracting && (
                    <div className="text-center py-12 text-slate-500 font-semibold animate-pulse">
                      Sedang memproses resolusi tinggi...
                    </div>
                  )}

                  {pdfPreviews.length > 0 && !isExtracting && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 border-t pt-6">
                        {pdfPreviews.map((src, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-[1/1.4] border bg-slate-50 rounded-xl overflow-hidden shadow-sm"
                          >
                            <img
                              src={src}
                              alt={`Hal ${idx + 1}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={downloadImagesFromPdf}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-extrabold py-5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3"
                      >
                        <Download size={24} /> UNDUH SEMUA GAMBAR
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ==========================================
            TAB 3: CROPPER INTERAKTIF ALA ADOBE EXPRESS
           ========================================== */}
        {activeTab === "cropper" && (
          <div className="w-full">
            <div className="text-center mb-6">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                Pemangkas Gambar{" "}
                <span className="text-blue-600">Express Mode</span>
              </h1>
              <p className="text-sm font-semibold text-slate-600 max-w-2xl mx-auto">
                Ubah gambar Anda ke dimensi centimeter, millimeter, atau pixel
                yang presisi dengan kalkulasi ukuran file real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
              {/* KIRI: Editor Canvas Area */}
              <div className="lg:col-span-2 flex flex-col items-center bg-[#EAEAEA] rounded-3xl p-6 relative justify-center min-h-[450px] border">
                {cropImageSrc ? (
                  <div className="w-full max-h-[400px] overflow-hidden rounded-xl bg-white shadow-inner flex justify-center items-center">
                    <Cropper
                      ref={cropperRef}
                      src={cropImageSrc}
                      onChange={updateSizeEstimate}
                      aspectRatio={calculatedRatio}
                      className="h-[350px] w-full"
                    />
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-400 p-12 rounded-xl bg-white cursor-pointer hover:border-blue-500 transition-colors w-full h-[350px]">
                    <ImageIcon className="text-slate-400 mb-2" size={48} />
                    <span className="text-sm font-bold text-slate-700">
                      Upload Foto Anda Terlebih Dahulu
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={cropperInputRef}
                      onChange={handleCropperFileChange}
                    />
                  </label>
                )}

                {cropImageSrc && (
                  <div className="w-full flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-slate-300 gap-4 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span>Zoom</span>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={cropZoom}
                        onChange={handleZoomSlider}
                        className="h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-slate-800 w-32"
                      />
                      <span>{cropZoom.toFixed(1)}x</span>
                    </div>
                    <button className="px-4 py-2 bg-white rounded-full border shadow-sm hover:bg-slate-100 flex items-center gap-1.5">
                      <Maximize2 size={12} /> Perbandingan Kualitas
                    </button>
                  </div>
                )}
              </div>

              {/* KANAN: Sidebar Controls */}
              <div className="bg-white rounded-3xl p-6 border flex flex-col justify-between shadow-sm">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Rasio aspek
                    </label>
                    <select
                      value={cropAspectMode}
                      onChange={(e) => setCropAspectMode(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-700"
                    >
                      <option value="custom">Kustom</option>
                      <option value="3x4">Pasfoto 3 x 4</option>
                      <option value="4x6">Pasfoto 4 x 6</option>
                    </select>
                  </div>

                  {/* Dimensi Lebar & Tinggi */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Lebar
                      </label>
                      <input
                        type="number"
                        value={cropW}
                        onChange={(e) =>
                          setCropW(parseInt(e.target.value) || 0)
                        }
                        disabled={cropAspectMode !== "custom"}
                        className="w-full p-2 bg-slate-50 border rounded-lg text-sm font-bold disabled:opacity-60"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCropLocked(!cropLocked)}
                      disabled={cropAspectMode !== "custom"}
                      className={`p-2.5 mb-0.5 rounded-lg border ${cropLocked ? "bg-slate-800 text-white" : "bg-white text-slate-500"}`}
                    >
                      {cropLocked ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Tinggi
                      </label>
                      <input
                        type="number"
                        value={cropH}
                        onChange={(e) =>
                          setCropH(parseInt(e.target.value) || 0)
                        }
                        disabled={cropAspectMode !== "custom"}
                        className="w-full p-2 bg-slate-50 border rounded-lg text-sm font-bold disabled:opacity-60"
                      />
                    </div>
                    <select
                      value={cropUnit}
                      onChange={(e) => setCropUnit(e.target.value)}
                      className="p-2 bg-slate-50 border rounded-lg text-sm font-bold text-slate-700"
                    >
                      <option value="mm">mm</option>
                      <option value="px">px</option>
                      <option value="cm">cm</option>
                    </select>
                  </div>

                  {/* Kualitas Slider */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                      <span>Kualitas Kompresi</span>
                      <span>{cropQuality}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={cropQuality}
                      onChange={(e) => setCropQuality(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                    />
                  </div>

                  {/* Real-time File Size Info */}
                  <div className="pt-4 border-t text-xs font-bold text-slate-700 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ukuran asli:</span>
                      <span>
                        {cropOriginalSize ? `${cropOriginalSize} KB` : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ukuran baru:</span>
                      <span
                        className={
                          cropNewSize > cropOriginalSize
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }
                      >
                        {cropImageSrc ? `${cropNewSize} KB` : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-8">
                  <button
                    onClick={downloadCroppedImage}
                    disabled={!cropImageSrc}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold py-3.5 rounded-full shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Unduh Gambar Hasil Crop
                  </button>
                  {cropImageSrc && (
                    <button
                      onClick={() => {
                        setCropImageSrc(null);
                        setCropNewSize(0);
                        setCropOriginalSize(0);
                      }}
                      className="w-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 rounded-full border flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw size={12} /> Reset Editor
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEO & Features Info */}
        <section className="mt-24 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Solusi Terbaik Manipulasi Berkas Digital Online
            </h2>
            <div className="h-1 w-20 bg-blue-600 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 text-slate-700 text-md leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                ✓ Keamanan Data Klien 100%
              </h3>
              <p className="text-justify text-sm">
                Seluruh proses konversi PDF, kompresi gambar, dan pangkas
                pasfoto dikerjakan secara lokal di browser Anda tanpa diunggah
                ke server mana pun. Dokumen sensitif Anda dijamin aman.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                ✓ Sempurna untuk Administrasi Resmi
              </h3>
              <p className="text-justify text-sm">
                Sistem pangkas dengan resolusi HD dan kalkulasi ukuran KB sangat
                ideal untuk mempersiapkan berkas administrasi seperti
                pendaftaran lowongan kerja, CPNS, maupun kelengkapan akademis
                lainnya.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
