import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { PRACTICE_EXAMPLES, type PracticeExample } from './lib/examples'
import { recognizeMathText } from './lib/ocr'
import { parseWorkingText } from './lib/parseWorking'
import {
  checkDirectWorking,
  checkInverseWorking,
  checkJointWorking,
  summarizeChecks,
  type CheckItem,
  type VariationKind,
} from './lib/variation'

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

const MODE_LABEL: Record<VariationKind, string> = {
  langsung: 'Ubahan langsung',
  songsang: 'Ubahan songsang',
  bergabung: 'Ubahan bergabung',
}

export default function App() {
  const [mode, setMode] = useState<VariationKind>('langsung')
  const [workingText, setWorkingText] = useState(
    `y = kx
k = 5
y = 5x
bila x = 7
jadi y = 35`,
  )
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrBusy, setOcrBusy] = useState(false)
  const [ocrNotes, setOcrNotes] = useState<string[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeExample, setActiveExample] = useState<string | null>('langsung-1')

  // Data soalan
  const [x, setX] = useState<Num>(4)
  const [y, setY] = useState<Num>(20)
  const [z, setZ] = useState<Num>(3)
  const [w, setW] = useState<Num>(1)
  const [x2, setX2] = useState<Num>(7)
  const [y2Expected, setY2Expected] = useState<Num>(35)
  const [z2, setZ2] = useState<Num>(5)
  const [w2, setW2] = useState<Num>(1)

  // Bacaan pelajar
  const [studentEquation, setStudentEquation] = useState('y = kx')
  const [studentK, setStudentK] = useState<Num>(5)
  const [studentY2, setStudentY2] = useState<Num>(35)

  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const checks = useMemo(() => {
    if (mode === 'langsung') {
      return checkDirectWorking({
        x: toNum(x) ?? 0,
        y: toNum(y) ?? 0,
        x2: toNum(x2),
        y2Expected: toNum(y2Expected),
        studentK: toNum(studentK),
        studentEquation,
        studentY2: toNum(studentY2),
      })
    }
    if (mode === 'songsang') {
      return checkInverseWorking({
        x: toNum(x) ?? 0,
        y: toNum(y) ?? 0,
        x2: toNum(x2),
        y2Expected: toNum(y2Expected),
        studentK: toNum(studentK),
        studentEquation,
        studentY2: toNum(studentY2),
      })
    }
    return checkJointWorking({
      x: toNum(x) ?? 0,
      z: toNum(z) ?? 1,
      y: toNum(y) ?? 0,
      w: toNum(w) ?? 1,
      x2: toNum(x2),
      z2: toNum(z2),
      w2: toNum(w2),
      y2Expected: toNum(y2Expected),
      studentK: toNum(studentK),
      studentEquation,
      studentY2: toNum(studentY2),
    })
  }, [
    mode,
    x,
    y,
    z,
    w,
    x2,
    y2Expected,
    z2,
    w2,
    studentK,
    studentEquation,
    studentY2,
  ])

  const summary = useMemo(() => summarizeChecks(checks), [checks])

  function applyParsedText(text: string) {
    setWorkingText(text)
    const parsed = parseWorkingText(text)
    setOcrNotes(parsed.notes)
    if (parsed.kind) setMode(parsed.kind)
    if (parsed.equation) setStudentEquation(parsed.equation)
    if (parsed.k != null) setStudentK(parsed.k)
    if (parsed.y2 != null) setStudentY2(parsed.y2)
    if (parsed.x != null) setX(parsed.x)
    if (parsed.y != null) setY(parsed.y)
    if (parsed.z != null) setZ(parsed.z)
    if (parsed.w != null) setW(parsed.w)
    if (parsed.x2 != null) setX2(parsed.x2)
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
    setMode(example.topic)
    setX(example.x)
    setY(example.y)
    setZ(example.z ?? 1)
    setW(example.w ?? 1)
    setX2(example.x2 ?? '')
    setY2Expected(example.y2 ?? '')
    setZ2(example.z2 ?? '')
    setW2(example.w2 ?? example.w ?? 1)
    const text = kind === 'betul' ? example.sampleWorking : example.commonMistake
    applyParsedText(text)
  }

  function setModeDefaults(next: VariationKind) {
    setMode(next)
    if (next === 'langsung') {
      setX(4)
      setY(20)
      setX2(7)
      setY2Expected(35)
      setStudentEquation('y = kx')
      setStudentK(5)
      setStudentY2(35)
      setWorkingText(`y = kx
k = 5
bila x = 7
jadi y = 35`)
    } else if (next === 'songsang') {
      setX(4)
      setY(6)
      setX2(8)
      setY2Expected(3)
      setStudentEquation('y = k/x')
      setStudentK(24)
      setStudentY2(3)
      setWorkingText(`y = k/x
k = 24
bila x = 8
jadi y = 3`)
    } else {
      setX(2)
      setY(30)
      setZ(3)
      setW(1)
      setX2(4)
      setZ2(5)
      setW2(1)
      setY2Expected(100)
      setStudentEquation('y = kxz')
      setStudentK(5)
      setStudentY2(100)
      setWorkingText(`y = kxz
k = 5
bila x = 4, z = 5
jadi y = 100`)
    }
  }

  return (
    <div className="app">
      <header className="nav">
        <div className="brand">
          MathKVSA
          <span>Scanner Ubahan</span>
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
            Imbas jalan kerja pelajar untuk semak ubahan langsung, songsang, dan
            bergabung — pemalar k, persamaan, dan nilai baharu.
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
            Muat naik gambar atau taip jalan kerja. Sistem semak bentuk persamaan,
            nilai k, dan jawapan y mengikut jenis ubahan.
          </p>
        </div>

        <div className="panel">
          <div className="tabs" role="tablist" aria-label="Jenis ubahan">
            {(Object.keys(MODE_LABEL) as VariationKind[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`tab ${mode === key ? 'active' : ''}`}
                onClick={() => setModeDefaults(key)}
              >
                {MODE_LABEL[key]}
              </button>
            ))}
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
                  placeholder={`Contoh:
y = kx
k = 5
jadi y = 35`}
                />
              </div>
            </div>

            <div id="semakan">
              <div className="verdict">
                <strong>{summary.verdict}</strong>
                {summary.total > 0
                  ? `${summary.score}/${summary.total} semakan lulus · ${MODE_LABEL[mode]}`
                  : `Isi data soalan dan jalan kerja · ${MODE_LABEL[mode]}`}
              </div>

              <h3 style={{ marginTop: 0, color: 'var(--teal)' }}>Data soalan</h3>
              <div className="row-3">
                <div className="field">
                  <label htmlFor="x">x</label>
                  <input
                    id="x"
                    type="number"
                    value={x}
                    onChange={(e) => setX(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="y">y</label>
                  <input
                    id="y"
                    type="number"
                    value={y}
                    onChange={(e) => setY(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                {mode === 'bergabung' && (
                  <>
                    <div className="field">
                      <label htmlFor="z">z</label>
                      <input
                        id="z"
                        type="number"
                        value={z}
                        onChange={(e) =>
                          setZ(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="w">w (1 jika tiada)</label>
                      <input
                        id="w"
                        type="number"
                        value={w}
                        onChange={(e) =>
                          setW(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                  </>
                )}
                <div className="field">
                  <label htmlFor="x2">x baharu</label>
                  <input
                    id="x2"
                    type="number"
                    value={x2}
                    onChange={(e) => setX2(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                {mode === 'bergabung' && (
                  <>
                    <div className="field">
                      <label htmlFor="z2">z baharu</label>
                      <input
                        id="z2"
                        type="number"
                        value={z2}
                        onChange={(e) =>
                          setZ2(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="w2">w baharu</label>
                      <input
                        id="w2"
                        type="number"
                        value={w2}
                        onChange={(e) =>
                          setW2(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </div>
                  </>
                )}
                <div className="field">
                  <label htmlFor="y2e">y jawapan (jika ada)</label>
                  <input
                    id="y2e"
                    type="number"
                    value={y2Expected}
                    onChange={(e) =>
                      setY2Expected(e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                </div>
              </div>

              <h3 style={{ color: 'var(--teal)' }}>Bacaan daripada pelajar</h3>
              <div className="row-3">
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="eq">Persamaan</label>
                  <input
                    id="eq"
                    type="text"
                    value={studentEquation}
                    onChange={(e) => setStudentEquation(e.target.value)}
                    placeholder={
                      mode === 'langsung'
                        ? 'y = kx'
                        : mode === 'songsang'
                          ? 'y = k/x'
                          : 'y = kxz / w'
                    }
                  />
                </div>
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
                  <label htmlFor="sy2">y baharu (pelajar)</label>
                  <input
                    id="sy2"
                    type="number"
                    value={studentY2}
                    onChange={(e) =>
                      setStudentY2(e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                </div>
              </div>

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
              <strong>Langsung</strong>
              y ∝ x → y = kx → k = y / x
            </div>
            <div className="formula">
              <strong>Songsang</strong>
              y ∝ 1/x → y = k/x → k = xy
            </div>
            <div className="formula">
              <strong>Bergabung</strong>
              y ∝ xz/w → y = kxz/w → k = yw/(xz)
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="contoh">
        <div className="section-head">
          <h2>Contoh untuk cuba</h2>
          <p>
            Muat jawapan betul atau kesilapan biasa (contoh: campur formula langsung
            dengan songsang) untuk lihat bagaimana scanner menanda langkah.
          </p>
        </div>

        <div className="examples">
          {PRACTICE_EXAMPLES.map((example) => (
            <div
              key={example.id}
              className={`example ${activeExample === example.id ? 'active' : ''}`}
            >
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
        MathKVSA · Fokus ubahan langsung, songsang & bergabung · Semakan bilik darjah
      </footer>
    </div>
  )
}
