export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto py-20 px-6 prose">
      <h1>Kebijakan Privasi</h1>
      <p>Kami sangat menghargai privasi Anda. Aplikasi <strong>Img2PDF</strong> beroperasi sepenuhnya di browser pengguna.</p>
      <ul>
        <li><strong>Data Gambar:</strong> Kami tidak menyimpan atau melihat gambar yang Anda proses.</li>
        <li><strong>Cookies:</strong> Kami menggunakan Google AdSense yang mungkin menggunakan cookies untuk menampilkan iklan yang relevan.</li>
        <li><strong>Keamanan:</strong> Seluruh proses konversi menggunakan library JavaScript lokal (jsPDF).</li>
      </ul>
      <a href="/" className="text-blue-600 no-underline font-bold mt-10 inline-block">← Kembali ke Beranda</a>
    </div>
  )
}