"use client";
import { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import {
  Upload,
  X,
  Download,
  ShieldCheck,
  Zap,
  Lock,
  FileType,
  MousePointerClick,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [isConverting, setIsConverting] = useState(false);
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

  const convertToPdf = async () => {
    setIsConverting(true);
    const doc = new jsPDF();

    for (let i = 0; i < images.length; i++) {
      const img = images[i].file;
      const imgData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(img);
      });

      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (i > 0) doc.addPage();
      doc.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    }

    doc.save("dokumen-konversi-img2pdf.pdf");
    setIsConverting(false);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex justify-between items-center bg-white sticky top-0 z-50 shadow-sm">
        <span className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <Zap size={24} fill="currentColor" /> imgconverterpdf
        </span>
        <div className="hidden md:flex gap-4 text-sm font-medium text-slate-600">
          <span>JPG ke PDF</span>
          <span>PNG ke PDF</span>
          <span>WebP ke PDF</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto pt-12 px-4 pb-20">
        {/* Header SEO Optimized */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
            Konversi <span className="text-blue-600">Gambar ke PDF</span> Online
            Gratis & Cepat
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto text-justify md:text-center">
            Gabungkan foto JPG, PNG, dan WebP menjadi satu file PDF berkualitas
            tinggi secara instan. Ideal untuk memenuhi syarat{" "}
            <strong>dokumen CPNS, lamaran kerja, dan tugas sekolah</strong>{" "}
            tanpa perlu instal aplikasi tambahan atau registrasi.
          </p>
        </div>

        {/* Iklan Atas */}
        <div className="w-full bg-white border rounded-xl mb-8 p-2 flex flex-col items-center justify-center min-h-[100px]">
          <span className="text-[10px] text-slate-400 uppercase mb-1">
            Advertisement
          </span>
          <div className="text-slate-300 text-xs italic">
            Slot Iklan AdSense Anda
          </div>
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

        {/* Preview Area */}
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
                      alt="Hasil konversi gambar ke pdf"
                      className="object-cover w-full h-full"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={convertToPdf}
                disabled={isConverting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-extrabold py-6 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                {isConverting ? (
                  "Sedang Mengonversi..."
                ) : (
                  <>
                    <Download size={28} /> DOWNLOAD PDF SEKARANG
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rich SEO Content Section */}
        <section className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Solusi Terbaik Ubah Foto ke PDF Tanpa Aplikasi
            </h2>
            <div className="h-1 w-20 bg-blue-600 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-20 text-slate-700 leading-relaxed text-lg">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-green-500" /> Mengapa Memilih
                Img2PDF?
              </h3>
              <p className="mb-4 text-justify">
                Banyak pengguna merasa kesulitan saat harus mengunggah berkas
                pendaftaran <strong>CPNS 2026</strong> atau{" "}
                <strong>PPPK</strong> karena syarat dokumen yang harus dalam
                format PDF. Alat konversi kami dirancang khusus untuk
                menyelesaikan masalah ini dengan sekali klik secara gratis.
              </p>
              <p className="text-justify">
                Kami menjamin kualitas gambar tetap tajam namun dengan ukuran
                file yang tetap optimal untuk diunggah. Anda tidak perlu khawatir 
                dengan keamanan data, karena privasi Anda adalah prioritas kami 
                dengan sistem tanpa simpan di server.
              </p>
            </div>
            <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <MousePointerClick className="text-blue-600" /> Cara Pakai
                Sangat Mudah:
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-1">
                    1
                  </span>
                  <span className="text-justify">
                    <strong>Unggah Gambar:</strong> Pilih foto ijazah, KTP, atau
                    dokumen lainnya dari galeri ponsel atau komputer Anda.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-1">
                    2
                  </span>
                  <span className="text-justify">
                    <strong>Urutkan:</strong> Pastikan urutan foto sudah benar
                    sesuai dengan halaman dokumen yang ingin digabungkan.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-1">
                    3
                  </span>
                  <span className="text-justify">
                    <strong>Unduh:</strong> Klik tombol konversi dan simpan file
                    PDF hasil gabungan foto Anda secara instan.
                  </span>
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
                Semua pemrosesan dilakukan di sisi klien (browser). Gambar Anda
                tidak pernah meninggalkan perangkat Anda, menjamin kerahasiaan dokumen.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 transition-transform hover:-translate-y-1">
              <FileType className="text-blue-600 mb-4" size={32} />
              <h4 className="font-bold text-xl mb-2 text-black">
                Banyak Format
              </h4>
              <p className="text-slate-500 text-sm text-justify">
                Mendukung konversi JPG ke PDF, PNG ke PDF, dan bahkan format
                WebP terbaru dari Google dengan kualitas hasil yang jernih.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 transition-transform hover:-translate-y-1">
              <Zap className="text-blue-600 mb-4" size={32} />
              <h4 className="font-bold text-xl mb-2 text-black">
                Tanpa Watermark
              </h4>
              <p className="text-slate-500 text-sm text-justify">
                Kami menyediakan layanan gratis 100% tanpa watermark atau tanda
                air pada hasil dokumen PDF Anda, siap pakai untuk keperluan resmi.
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