import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { PRACTICE_EXAMPLES, type PracticeExample } from './lib/examples'
import {
  checkAreaWorking,
  checkPointWorking,
  summarizeChecks,
  type CheckItem,
} from './lib/enlargement'
import { recognizeMathText } from './lib/ocr'
import { parseWorkingText } from './lib/parseWorking'

type Mode = 'luas' | 'koordinat'
type Num = number | ''

function toNum(value: Num): number | undefined {
  return value === '' || Number.isNaN(Number(value)) ? undefined : Number(value)
}

function statusLabel(status: CheckItem['status']): string {
  if (status === 'betul') return 'Betul'
  if (status === 'salah') return 'Salah'
  if (status === 'separa') return 'Separa'
  return 'Tiada'
}

export default function App() {
  const [mode, setMode] = useState<Mode>('luas')
  const [workingText, setWorkingText] = useState(
    `Luas objek = 12
k = 3
k^2 = 9
Luas imej = 108`,
  )
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrBusy, setOcrBusy] = useState(false)
  const [ocrNotes, setOcrNotes] = useState<string[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeExample, setActiveExample] = useState<string | null>('luas-1')

  // Soalan / jawapan jangkaan
  const [objectArea, setObjectArea] = useState<Num>(12)
  const [imageArea, setImageArea] = useState<Num>(108)
  const [ox, setOx] = useState<Num>(2)
  const [oy, setOy] = useState<Num>(3)
  const [ix, setIx] = useState<Num>(4)
  const [iy, setIy] = useState<Num>(6)
  const [cx, setCx] = useState<Num>(0)
  const [cy, setCy] = useState<Num>(0)

  // Nilai daripada jalan kerja pelajar (boleh diedit selepas OCR)
  const [studentK, setStudentK] = useState<Num>(3)
  const [studentK2, setStudentK2] = useState<Num>(9)
  const [studentObjectArea, setStudentObjectArea] = useState<Num>(12)
  const [studentImageArea, setStudentImageArea] = useState<Num>(108)
  const [studentIx, setStudentIx] = useState<Num>('')
  const [studentIy, setStudentIy] = useState<Num>('')

  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const checks = useMemo(() => {
    if (mode === 'luas') {
      return checkAreaWorking({
        objectArea: toNum(objectArea) ?? 0,
        imageArea: toNum(imageArea) ?? 0,
        studentScaleFactor: toNum(studentK),
        studentAreaScaleFactor: toNum(studentK2),
        studentObjectArea: toNum(studentObjectArea),
        studentImageArea: toNum(studentImageArea),
      })
    }
    return checkPointWorking({
      object: { x: toNum(ox) ?? 0, y: toNum(oy) ?? 0 },
      image: { x: toNum(ix) ?? 0, y: toNum(iy) ?? 0 },
      center: { x: toNum(cx) ?? 0, y: toNum(cy) ?? 0 },
      studentScaleFactor: toNum(studentK),
      studentImage:
        toNum(studentIx) == null || toNum(studentIy) == null
          ? undefined
          : { x: toNum(studentIx)!, y: toNum(studentIy)! },
    })
  }, [
    mode,
    objectArea,
    imageArea,
    studentK,
    studentK2,
    studentObjectArea,
    studentImageArea,
    ox,
    oy,
    ix,
    iy,
    cx,
    cy,
    studentIx,
    studentIy,
  ])

  const summary = useMemo(() => summarizeChecks(checks), [checks])

  function applyParsedText(text: string) {
    setWorkingText(text)
    const parsed = parseWorkingText(text)
    setOcrNotes(parsed.notes)
    if (parsed.scaleFactor != null) setStudentK(parsed.scaleFactor)
    if (parsed.areaScaleFactor != null) setStudentK2(parsed.areaScaleFactor)
    if (parsed.objectArea != null) setStudentObjectArea(parsed.objectArea)
    if (parsed.imageArea != null) setStudentImageArea(parsed.imageArea)
    if (parsed.imagePoint) {
      setStudentIx(parsed.imagePoint.x)
      setStudentIy(parsed.imagePoint.y)
      setMode('koordinat')
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setOcrBusy(true)
    setOcrProgress(0)
    setOcrNotes(['Sedang membaca tulisan...'])
    try {
      const text = await recognizeMathText(file, setOcrProgress)
      applyParsedText(text || 'Tiada teks dikesan.')
    } catch {
      setOcrNotes([
        'OCR gagal dibaca. Cuba gambar lebih terang/jelas, atau taip jalan kerja secara manual.',
      ])
    } finally {
      setOcrBusy(false)
    }
  }

  function loadExample(example: PracticeExample, kind: 'betul' | 'salah') {
    setActiveExample(example.id)
    setMode(example.topic === 'luas' ? 'luas' : 'koordinat')
    if (example.objectArea != null) setObjectArea(example.objectArea)
    if (example.imageArea != null) setImageArea(example.imageArea)
    if (example.object) {
      setOx(example.object.x)
      setOy(example.object.y)
    }
    if (example.image) {
      setIx(example.image.x)
      setIy(example.image.y)
    }
    if (example.center) {
      setCx(example.center.x)
      setCy(example.center.y)
    }
    const text = kind === 'betul' ? example.sampleWorking : example.commonMistake
    applyParsedText(text)
  }

  return (
    <div className="app">
      <header className="nav">
        <div className="brand">
          MathKVSA
          <span>Scanner Pembesaran</span>
        </div>
        <nav className="nav-links" aria-label="Navigasi utama">
          <a href="#scanner">Scanner</a>
          <a href="#semakan">Semakan</a>
          <a href="#contoh">Contoh</a>
        </nav>
      </header>

      <section className="hero" aria-label="Hero">
        <div className="hero-bg" />
        <div className="hero-glow" />
        <div className="hero-inner">
          <h1>MathKVSA</h1>
          <p>
            Imbas jalan kerja pelajar untuk semak faktor skala dan luas transformasi
            pembesaran — cepat, jelas, dan fokusulasikan.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#scanner">
              Mula imbas
            </a>
            <a className="btn btn-ghost" href="#contoh">
              Cuba contoh
            </a>
          </div>
        </div>
      </section>

      <section className="section" id="scanner">
        <div className="section-head">
          <h2>Scanner jalan kerja</h2>
          <p>
            Muat naik gambar atau gunakan kamera. OCR akan cuba baca nilai k, k², dan
            luas. Anda boleh betulkan bacaan sebelum semakan.
          </p>
        </div>

        <div className="panel">
          <div className="tabs" role="tablist" aria-label="Jenis soalan">
            <button
              type="button"
              className={`tab ${mode === 'luas' ? 'active' : ''}`}
              onClick={() => setMode('luas')}
            >
              Luas & faktor skala
            </button>
            <button
              type="button"
              className={`tab ${mode === 'koordinat' ? 'active' : ''}`}
              onClick={() => setMode('koordinat')}
            >
              Koordinat pembesaran
            </button>
          </div>

          <div className="grid-2">
            <div>
              <div className="dropzone">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => void handleFile(e.target.files?.[0])}
                  aria-label="Muat naik atau ambil gambar jalan kerja"
                />
                {previewUrl ? (
                  <img className="preview" src={previewUrl} alt="Pratonton jalan kerja" />
                ) : (
                  <div>
                    <strong>Letak gambar di sini</strong>
                    <p>JPG/PNG · kamera atau galeri</p>
                  </div>
                )}
              </div>

              <div className="actions">
                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={ocrBusy}
                >
                  Buka kamera
                </button>
                <button
                  type="button"
                  className="btn btn-line"
                  onClick={() => applyParsedText(workingText)}
                  disabled={ocrBusy}
                >
                  Parse teks
                </button>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />

              {ocrBusy && (
                <div className="progress" aria-label="Kemajuan OCR">
                  <span style={{ width: `${Math.round(ocrProgress * 100)}%` }} />
                </div>
              )}

              <ul className="notes">
                {ocrNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>

              <div className="field">
                <label htmlFor="working">Teks jalan kerja (OCR / manual)</label>
                <textarea
                  id="working"
                  value={workingText}
                  onChange={(e) => setWorkingText(e.target.value)}
                  placeholder="Contoh: Luas objek = 12&#10;k = 3&#10;k^2 = 9&#10;Luas imej = 108"
                />
              </div>
            </div>

            <div id="semakan">
              <div className="verdict">
                <strong>{summary.verdict}</strong>
                {summary.total > 0
                  ? `${summary.score}/${summary.total} semakan lulus`
                  : 'Isi nilai soalan dan jalan kerja untuk mula'}
              </div>

              {mode === 'luas' ? (
                <>
                  <h3 style={{ marginTop: 0, color: 'var(--teal)' }}>Data soalan</h3>
                  <div className="row-3">
                    <div className="field">
                      <label htmlFor="obj-area">Luas objek</label>
                      <input
                        id="obj-area"
                        type="number"
                        value={objectArea}
                        onChange={(e) =>
                          setObjectArea(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="img-area">Luas imej (jawapan)</label>
                      <input
                        id="img-area"
                        type="number"
                        value={imageArea}
                        onChange={(e) =>
                          setImageArea(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <h3 style={{ color: 'var(--teal)' }}>Bacaan daripada pelajar</h3>
                  <div className="row-3">
                    <div className="field">
                      <label htmlFor="sk">k</label>
                      <input
                        id="sk"
                        type="number"
                        value={studentK}
                        onChange={(e) =>
                          setStudentK(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="sk2">k²</label>
                      <input
                        id="sk2"
                        type="number"
                        value={studentK2}
                        onChange={(e) =>
                          setStudentK2(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="soa">Luas objek (pelajar)</label>
                      <input
                        id="soa"
                        type="number"
                        value={studentObjectArea}
                        onChange={(e) =>
                          setStudentObjectArea(
                            e.target.value === '' ? '' : Number(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="sia">Luas imej (pelajar)</label>
                      <input
                        id="sia"
                        type="number"
                        value={studentImageArea}
                        onChange={(e) =>
                          setStudentImageArea(
                            e.target.value === '' ? '' : Number(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ marginTop: 0, color: 'var(--teal)' }}>Data soalan</h3>
                  <div className="row-3">
                    <div className="field">
                      <label htmlFor="ox">Objek x</label>
                      <input
                        id="ox"
                        type="number"
                        value={ox}
                        onChange={(e) =>
                          setOx(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="oy">Objek y</label>
                      <input
                        id="oy"
                        type="number"
                        value={oy}
                        onChange={(e) =>
                          setOy(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="cx">Pusat x</label>
                      <input
                        id="cx"
                        type="number"
                        value={cx}
                        onChange={(e) =>
                          setCx(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="cy">Pusat y</label>
                      <input
                        id="cy"
                        type="number"
                        value={cy}
                        onChange={(e) =>
                          setCy(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="ix">Imej x (jawapan)</label>
                      <input
                        id="ix"
                        type="number"
                        value={ix}
                        onChange={(e) =>
                          setIx(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="iy">Imej y (jawapan)</label>
                      <input
                        id="iy"
                        type="number"
                        value={iy}
                        onChange={(e) =>
                          setIy(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <h3 style={{ color: 'var(--teal)' }}>Bacaan daripada pelajar</h3>
                  <div className="row-3">
                    <div className="field">
                      <label htmlFor="pk">k</label>
                      <input
                        id="pk"
                        type="number"
                        value={studentK}
                        onChange={(e) =>
                          setStudentK(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="pix">Imej x (pelajar)</label>
                      <input
                        id="pix"
                        type="number"
                        value={studentIx}
                        onChange={(e) =>
                          setStudentIx(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="piy">Imej y (pelajar)</label>
                      <input
                        id="piy"
                        type="number"
                        value={studentIy}
                        onChange={(e) =>
                          setStudentIy(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="checks" style={{ marginTop: '1rem' }}>
                {checks.map((item) => (
                  <article key={item.id} className={`check ${item.status}`}>
                    <div className="check-top">
                      <h3>{item.label}</h3>
                      <span className={`badge ${item.status}`}>{statusLabel(item.status)}</span>
                    </div>
                    {(item.expected || item.found) && (
                      <p>
                        Dijangka: {item.expected ?? '—'} · Pelajar: {item.found ?? '—'}
                      </p>
                    )}
                    {item.tip && <p>{item.tip}</p>}
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="formula-strip">
            <div className="formula">
              <strong>k</strong>
              Faktor skala linear: jarak imej ÷ jarak objek dari pusat.
            </div>
            <div className="formula">
              <strong>k²</strong>
              Faktor skala luas = k² = luas imej ÷ luas objek.
            </div>
            <div className="formula">
              <strong>Imej</strong>
              I = C + k(O − C) untuk setiap koordinat.
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="contoh">
        <div className="section-head">
          <h2>Contoh untuk cuba</h2>
          <p>
            Pilih soalan, kemudian muat jalan kerja betul atau kesilapan biasa supaya
            anda nampak bagaimana scanner menanda langkah.
          </p>
        </div>

        <div className="examples">
          {PRACTICE_EXAMPLES.map((example) => (
            <div key={example.id} className={`example ${activeExample === example.id ? 'active' : ''}`}>
              <h3>{example.title}</h3>
              <p>{example.prompt}</p>
              <div className="actions">
                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={() => loadExample(example, 'betul')}
                >
                  Muat jawapan betul
                </button>
                <button
                  type="button"
                  className="btn btn-line"
                  onClick={() => loadExample(example, 'salah')}
                >
                  Muat kesilapan biasa
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        MathKVSA · Fokus topik ubahan pembesaran & luas · Dibina untuk semakan bilik darjah
      </footer>
    </div>
  )
}
