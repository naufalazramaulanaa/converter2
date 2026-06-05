"use client";
import { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import {
  Upload,
  X,
  Download,
  Zap,
  Lock,
  FileType,
  MousePointerClick,
  CheckCircle2,
  Sliders,
  Maximize2,
  FileText,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  // State Navigasi Tab
  const [activeTab, setActiveTab] = useState<"img2pdf" | "pdf2img">("img2pdf");

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
  // STATE & LOGIKA FITUR 2: PDF KE GAMBAR (ENHANCED)
  // ==========================================
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreviews, setPdfPreviews] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [outputFormat, setOutputFormat] = useState<string>("image/png"); // png, jpeg, webp
  const [renderScale, setRenderScale] = useState<number>(3.0); // Default: 3.0 (Tajam / HD)
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      setPdfPreviews([]); // Reset pratinjau lama jika ganti file
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

          // Menggunakan renderScale dari state agar kejernihan fleksibel sesuai input pengguna
          const viewport = page.getViewport({ scale: renderScale });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (ctx) {
            // Aktifkan super-sampling smoothing pada level canvas context
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

          // Menggunakan kualitas 1.0 (Maksimal tanpa compression blur)
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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex justify-between items-center bg-white sticky top-0 z-50 shadow-sm">
        <span className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <Zap size={24} fill="currentColor" /> imgconverterpdf
        </span>

        {/* Tab Switcher Controller */}
        <div className="flex bg-slate-100 p-1 rounded-xl border">
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
        </div>
      </nav>

      <div className="max-w-4xl mx-auto pt-12 px-4 pb-20">
        {/* ==========================================
            RENDER TAB 1: GAMBAR KE PDF
           ========================================== */}
        {activeTab === "img2pdf" && (
          <div>
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                Konversi <span className="text-blue-600">Gambar ke PDF</span>{" "}
                Online Gratis & Cepat
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto text-justify md:text-center">
                Gabungkan foto JPG, PNG, dan WebP menjadi satu file PDF
                berkualitas tinggi secara instan. Ideal untuk memenuhi syarat{" "}
                <strong>
                  dokumen CPNS, pasfoto formal, lamaran kerja, dan tugas sekolah
                </strong>
                .
              </p>
            </div>

            {/* Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group relative border-4 border-dashed border-blue-200 bg-white rounded-3xl p-12 text-center cursor-pointer hover:border-blue-500 hover:shadow-2xl transition-all duration-500"
            >
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div className="bg-blue-600 text-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:rotate-12 transition-transform">
                <Upload size={36} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                Pilih Foto atau Seret ke Sini
              </h2>
              <p className="text-slate-500 mt-2 font-medium">
                Mendukung format .jpg, .jpeg, .png, dan .webp
              </p>
            </div>

            {/* Controls Panel */}
            <AnimatePresence>
              {images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 bg-white rounded-2xl shadow-xl border p-6 border-blue-100"
                >
                  <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h3 className="font-bold text-slate-700">
                      Pratinjau Dokumen ({images.length} Gambar)
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
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Settings Toolkit */}
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-5">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Sliders size={16} className="text-blue-600" /> Advanced
                      Toolkit: Kompresi & Resize Pasfoto
                    </h4>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mb-1.5">
                        <Maximize2 size={14} className="text-slate-400" />
                        <span>Ubah Ukuran / Potong Rasio Pasfoto Cetak</span>
                      </div>
                      <select
                        value={pasfotoSize}
                        onChange={(e) => setPasfotoSize(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="original">Asli (Tanpa Potong)</option>
                        <option value="2x3">Pasfoto 2 x 3 cm</option>
                        <option value="3x4">Pasfoto 3 x 4 cm</option>
                        <option value="4x6">Pasfoto 4 x 6 cm</option>
                      </select>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                          <span>Kualitas Gambar (Kompresi)</span>
                          <span className="text-blue-600 font-bold">
                            {Math.round(quality * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={quality}
                          onChange={(e) =>
                            setQuality(parseFloat(e.target.value))
                          }
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                          <span>Skala Resolusi Pixel</span>
                          <span className="text-blue-600 font-bold">
                            {Math.round(resizeScale * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="1.0"
                          step="0.05"
                          value={resizeScale}
                          onChange={(e) =>
                            setResizeScale(parseFloat(e.target.value))
                          }
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={convertToPdf}
                    disabled={isConverting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-extrabold py-6 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    {isConverting ? (
                      "Sedang Memproses & Mengonversi..."
                    ) : (
                      <>
                        <Download size={28} /> DOWNLOAD PDF SEKARANG
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ==========================================
            RENDER TAB 2: PDF KE GAMBAR (ENHANCED)
           ========================================== */}
        {activeTab === "pdf2img" && (
          <div>
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                Konversi <span className="text-blue-600">PDF ke Gambar</span>{" "}
                Ekstrak Halaman Instan
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto text-justify md:text-center">
                Ubah setiap halaman dokumen PDF Anda menjadi file gambar
                beresolusi tinggi dengan format PNG, JPG, JPEG, atau WebP dalam
                hitungan detik tanpa upload ke server.
              </p>
            </div>

            {/* PDF Upload Zone */}
            <div
              onClick={() => pdfInputRef.current?.click()}
              className="group relative border-4 border-dashed border-emerald-200 bg-white rounded-3xl p-12 text-center cursor-pointer hover:border-emerald-500 hover:shadow-2xl transition-all duration-500"
            >
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                ref={pdfInputRef}
                onChange={handlePdfChange}
              />
              <div className="bg-emerald-600 text-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform">
                <FileText size={36} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                {pdfFile ? pdfFile.name : "Pilih Berkas PDF Anda"}
              </h2>
              <p className="text-slate-500 mt-2 font-medium">
                {pdfFile
                  ? "Klik di sini jika ingin mengganti file PDF"
                  : "Klik untuk mencari berkas .pdf dari penyimpanan komputer/hp"}
              </p>
            </div>

            {/* PDF Control Toolkit & Result Previews */}
            <AnimatePresence>
              {pdfFile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 bg-white rounded-2xl shadow-xl border p-6 border-emerald-100"
                >
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                      <Sliders size={18} className="text-emerald-600" /> Toolkit
                      Penjernih & Format Output
                    </h3>
                    <button
                      onClick={() => {
                        setPdfFile(null);
                        setPdfPreviews([]);
                      }}
                      className="text-red-500 text-sm hover:underline"
                    >
                      Hapus Berkas
                    </button>
                  </div>

                  {/* 🟢 FITUR BARU: DROPDOWN RESOLUSI KEJERNIHAN GAMBAR */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-2">
                        <Sparkles size={14} className="text-amber-500" />{" "}
                        Tingkat Kejernihan Gambar (HD/UHD)
                      </label>
                      <select
                        value={renderScale}
                        onChange={(e) =>
                          setRenderScale(parseFloat(e.target.value))
                        }
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value={1.5}>
                          Standar (Resolusi Rendah - File Kecil)
                        </option>
                        <option value={3.0}>
                          Tajam / Jernih HD (Sangat Direkomendasikan)
                        </option>
                        <option value={4.5}>
                          Super Jernih Ultra HD (Detail Sangat Tinggi - Teks
                          Tajam)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-2">
                        <FileType size={14} className="text-slate-400" /> Format
                        Ekspor Gambar Akhir
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "PNG", val: "image/png" },
                          { label: "JPG", val: "image/jpeg" },
                          { label: "WebP", val: "image/webp" },
                        ].map((fmt) => (
                          <button
                            key={fmt.label}
                            type="button"
                            onClick={() => setOutputFormat(fmt.val)}
                            className={`p-2.5 text-xs font-bold rounded-lg border transition-all text-center ${
                              outputFormat === fmt.val
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                                : "bg-white text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {fmt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tombol Ekstrak / Proses Render */}
                  {pdfPreviews.length === 0 && !isExtracting && (
                    <button
                      onClick={processPdfToImages}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles size={20} /> MULAI EKSTRAK & JENIHKAN GAMBAR
                    </button>
                  )}

                  {isExtracting && (
                    <div className="text-center py-12 text-slate-500 font-semibold animate-pulse">
                      Sedang memproses halaman dengan resolusi tinggi, mohon
                      tunggu sebentar...
                    </div>
                  )}

                  {/* Hasil Render Grid & Tombol Download */}
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
                              alt={`Halaman ${idx + 1}`}
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-sm text-white font-mono text-[10px] px-2 py-0.5 rounded-md">
                              Hal {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={downloadImagesFromPdf}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-extrabold py-6 rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                        <Download size={28} /> UNDUH SEMUA HALAMAN SEBAGAI
                        GAMBAR JERNIH
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ==========================================
            RICH SEO CONTENT SECTION
           ========================================== */}
        <section className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Solusi Terbaik Manipulasi Gambar & PDF Tanpa Aplikasi
            </h2>
            <div className="h-1 w-20 bg-blue-600 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-20 text-slate-700 leading-relaxed text-lg">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-green-500" /> Mengapa Memilih
                Platform Kami?
              </h3>
              <p className="mb-4 text-justify">
                Banyak pengguna merasa kesulitan saat mengurus berkas
                pendaftaran <strong>CPNS 2026</strong> atau lowongan kerja
                karena aturan format berkas yang berubah-ubah. Alat konversi
                kami dirancang serbaguna untuk mengubah{" "}
                <strong>Gambar ke PDF</strong> ataupun mengembalikan file{" "}
                <strong>PDF menjadi Gambar semula</strong> secara gratis dan
                instan.
              </p>
              <p className="text-justify">
                Kami menjamin privasi penuh. Pemrosesan dilakukan 100%
                menggunakan teknologi web modern di sisi klien browser Anda,
                sehingga file sensitif seperti ijazah atau KTP tidak akan pernah
                dikirim atau disimpan ke server kami.
              </p>
            </div>
            <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <MousePointerClick className="text-blue-600" /> Fitur Unggulan
                Sistem:
              </h3>
              <ul className="space-y-4 text-base">
                <li className="flex gap-2">
                  🟢 <strong>Dua Arah Instan:</strong> Bisa ubah kumpulan gambar
                  jadi satu PDF rapi, atau pecah halaman PDF menjadi potongan
                  gambar terpisah.
                </li>
                <li className="flex gap-2">
                  🟢 <strong>Smart Cropping Pasfoto:</strong> Konversi cerdas
                  otomatis ke aspek rasio pasfoto resmi instansi (2x3, 3x4, 4x6)
                  tanpa merusak atau membuat wajah menjadi peyang.
                </li>
                <li className="flex gap-2">
                  🟢 <strong>Multi-Format Output & HD:</strong> Ekspor hasil
                  gambar Anda dengan bebas menjadi format PNG berkualitas tinggi
                  atau WebP generasi terbaru disertai opsi penjernih HD/UHD.
                </li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 transition-transform hover:-translate-y-1">
              <Lock className="text-blue-600 mb-4" size={32} />
              <h4 className="font-bold text-xl mb-2 text-black">
                Aman & Privat
              </h4>
              <p className="text-slate-500 text-sm text-justify">
                Semua pemrosesan dilakukan lokal di browser Anda. Dokumen
                rahasia Anda dijamin aman dari kebocoran data server.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 transition-transform hover:-translate-y-1">
              <FileType className="text-blue-600 mb-4" size={32} />
              <h4 className="font-bold text-xl mb-2 text-black">
                Mendukung Banyak Format
              </h4>
              <p className="text-slate-500 text-sm text-justify">
                Kompatibel penuh untuk membaca dan menghasilkan format gambar
                digital populer seperti JPG, JPEG, PNG, dan WebP.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 transition-transform hover:-translate-y-1">
              <Zap className="text-blue-600 mb-4" size={32} />
              <h4 className="font-bold text-xl mb-2 text-black">
                Bebas Watermark 100%
              </h4>
              <p className="text-slate-500 text-sm text-justify">
                Layanan kami murni gratis tanpa embel-embel watermark atau tanda
                air pada hasil akhir dokumen PDF atau gambar Anda.
              </p>
            </div>
          </div>
        </section>

        {/* Iklan Bawah */}
        <div className="w-full bg-slate-100 border rounded-xl mt-16 p-4 flex flex-col items-center justify-center min-h-[250px]">
          <span className="text-[10px] text-slate-400 uppercase mb-1">
            Advertisement
          </span>
          <div className="text-slate-400 text-sm">
            Iklan Display (Native/Multiplex)
          </div>
        </div>
      </div>
    </main>
  );
}
