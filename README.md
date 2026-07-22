# MathKVSA — Scanner Pembesaran

Aplikasi web untuk **semakan jalan kerja matematik** pelajar bagi topik **ubahan transformasi pembesaran** dan **luas**.

## Apa yang boleh dibuat

- Imbas / muat naik gambar jalan kerja (OCR dengan Tesseract.js)
- Semak faktor skala linear **k** dan faktor skala luas **k²**
- Semak hubungan `luas imej = k² × luas objek`
- Semak koordinat imej selepas pembesaran dari suatu pusat
- Cuba contoh jawapan betul vs kesilapan biasa (contoh: guna **k** bukan **k²** untuk luas)

## Jalankan secara tempatan

```bash
npm install
npm run dev
```

## Skrip lain

```bash
npm test      # ujian enjin semakan
npm run build # bina produksi
npm run lint  # oxlint
```

## Nota OCR

OCR paling berkesan jika tulisan jelas, kontras tinggi, dan nilai ditulis dalam bentuk seperti:

```text
Luas objek = 12
k = 3
k^2 = 9
Luas imej = 108
```

Anda sentiasa boleh betulkan bacaan OCR secara manual sebelum semakan.
