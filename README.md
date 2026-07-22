# MathKVSA — Scanner Ubahan

Aplikasi web untuk **semakan jalan kerja matematik** pelajar bagi tajuk **ubahan**:

- **Ubahan langsung** — \(y \propto x\), \(y = kx\)
- **Ubahan songsang** — \(y \propto 1/x\), \(y = k/x\)
- **Ubahan bergabung** — \(y \propto xz\) atau \(y \propto xz/w\)

## Ciri

- Imbas / muat naik gambar jalan kerja (OCR) atau taip manual
- Semak bentuk persamaan, pemalar **k**, dan nilai **y** baharu
- Tip untuk kesilapan biasa (contoh: guna formula songsang untuk langsung)
- Contoh soalan siap cuba

## Jalankan

```bash
npm install
npm run dev
```

```bash
npm test
npm run build
```

## Format jalan kerja yang mesra OCR

```text
y = kx
k = 5
bila x = 7
jadi y = 35
```
