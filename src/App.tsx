import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { PRACTICE_EXAMPLES, type PracticeExample } from './lib/examples'
import { recognizeMathText } from './lib/ocr'
import { parseWorkingText } from './lib/parseWorking'
import {
  checkPaperWorking,
  summarizeChecks,
  type CheckItem,
  type PaperProblem,
  type VariationKind,
} from './lib/variation'

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

function problemFromExample(ex: PracticeExample): PaperProblem {
  return ex.problem
}

export default function App() {
  const first = PRACTICE_EXAMPLES[0]!
  const [mode, setMode] = useState<VariationKind>(first.topic)
  const [activeExampleId, setActiveExampleId] = useState(first.id)
  const [problem, setProblem] = useState<PaperProblem>(problemFromExample(first))
  const [prompt, setPrompt] = useState(first.prompt)
  const [workingText, setWorkingText] = useState(first.sampleWorking)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrBusy, setOcrBusy] = useState(false)
  const [ocrNotes, setOcrNotes] = useState<string[]>([
    'Imbas kertas jalan kerja, atau cuba contoh Sprint di bawah.',
  ])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [parsedPreview, setParsedPreview] = useState(() => parseWorkingText(first.sampleWorking))

  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const checks = useMemo(
    () => checkPaperWorking(problem, parsedPreview),
    [problem, parsedPreview],
  )
  const summary = useMemo(() => summarizeChecks(checks), [checks])

  function applyParsedText(text: string) {
    setWorkingText(text)
    const parsed = parseWorkingText(text)
    setParsedPreview(parsed)
    setOcrNotes(parsed.notes)
    if (parsed.kind) setMode(parsed.kind)
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setOcrBusy(true)
    setOcrProgress(0)
    setOcrNotes(['Sedang membaca tulisan tangan / kertas...'])
    try {
      const text = await recognizeMathText(file, setOcrProgress)
      applyParsedText(text || 'Tiada teks dikesan.')
    } catch {
      setOcrNotes([
        'OCR gagal. Pastikan tulisan jelas, atau taip semula langkah seperti di kertas.',
      ])
    } finally {
      setOcrBusy(false)
    }
  }

  function loadExample(example: PracticeExample, kind: 'betul' | 'salah') {
    setActiveExampleId(example.id)
    setMode(example.topic)
    setProblem(problemFromExample(example))
    setPrompt(example.prompt)
    const text = kind === 'betul' ? example.sampleWorking : example.commonMistake
    applyParsedText(text)
  }

  const filteredExamples = PRACTICE_EXAMPLES.filter((ex) => ex.topic === mode)

  return (
    <div className="app">
      <header className="nav">
        <div className="brand">
          MathKVSA
          <span>Scanner Ubahan</span>
        </div>
        <nav className="nav-links" aria-label="Navigasi utama">
          <a href="#scanner">Imbas kertas</a>
          <a href="#semakan">Semakan langkah</a>
          <a href="#contoh">Contoh Sprint</a>
        </nav>
      </header>

      <section className="hero" aria-label="Hero">
        <div className="hero-bg" />
        <div className="hero-glow" />
        <div className="hero-inner">
          <h1>MathKVSA</h1>
          <p>
            Semak jalan kerja ubahan di atas kertas — langsung, songsang, dan bergabung —
            ikut langkah ∝, persamaan k, cari k, dan jawapan.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#scanner">
              Imbas kertas
            </a>
            <a className="btn btn-ghost" href="#contoh">
              Contoh Sprint
            </a>
          </div>
        </div>
      </section>

      <section className="section" id="scanner">
        <div className="section-head">
          <h2>Imbas jalan kerja kertas</h2>
          <p>
            Pelajar tulis seperti di bilik darjah: kenyataan ∝, y = kx, gantian nilai, k,
            kemudian jawapan. Guru imbas kertas untuk semakan langkah.
          </p>
        </div>

        <div className="panel">
          <div className="tabs" role="tablist" aria-label="Jenis ubahan">
            {(Object.keys(MODE_LABEL) as VariationKind[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`tab ${mode === key ? 'active' : ''}`}
                onClick={() => {
                  setMode(key)
                  const ex = PRACTICE_EXAMPLES.find((item) => item.topic === key)
                  if (ex) loadExample(ex, 'betul')
                }}
              >
                {MODE_LABEL[key]}
              </button>
            ))}
          </div>

          <div className="prompt-box">
            <strong>Soalan rujukan</strong>
            <p>{prompt}</p>
          </div>

          <div className="grid-2">
            <div>
              <div className="dropzone">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => void handleFile(e.target.files?.[0])}
                  aria-label="Muat naik gambar kertas jalan kerja"
                />
                {previewUrl ? (
                  <img className="preview" src={previewUrl} alt="Pratonton kertas jalan kerja" />
                ) : (
                  <div>
                    <strong>Foto kertas jalan kerja</strong>
                    <p>Ambil gambar satu soalan setiap kali untuk OCR lebih tepat</p>
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
                  Semak teks
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
                <label htmlFor="working">Teks jalan kerja (hasil OCR — boleh dibetulkan)</label>
                <textarea
                  id="working"
                  value={workingText}
                  onChange={(e) => setWorkingText(e.target.value)}
                  placeholder={`y ∝ x
y = kx
7 = k(2)
k = 3.5
112 = 3.5x
x = 32`}
                />
              </div>
            </div>

            <div id="semakan">
              <div className="verdict">
                <strong>{summary.verdict}</strong>
                {summary.total > 0
                  ? `${summary.score}/${summary.total} langkah lulus · ${MODE_LABEL[mode]}`
                  : MODE_LABEL[mode]}
              </div>

              <div className="step-guide">
                <strong>Langkah dijangka di kertas</strong>
                <ol>
                  <li>Kenyataan ubahan (∝)</li>
                  <li>Persamaan dengan k</li>
                  <li>Ganti nilai → cari k</li>
                  <li>Persamaan akhir / jawapan</li>
                </ol>
              </div>

              <div className="checks">
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
              y ∝ x → y = kx → ganti → k → jawapan
            </div>
            <div className="formula">
              <strong>Songsang</strong>
              G ∝ 1/√h → G = k/√h → cari k → hubungan
            </div>
            <div className="formula">
              <strong>Bergabung</strong>
              E ∝ f/g → E = kf/g → cari k → nilai E
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="contoh">
        <div className="section-head">
          <h2>Contoh seperti kertas Sprint</h2>
          <p>
            Muat jawapan betul atau kesilapan biasa daripada soalan gaya kelas untuk lihat
            semakan langkah.
          </p>
        </div>

        <div className="examples">
          {(filteredExamples.length ? filteredExamples : PRACTICE_EXAMPLES).map((example) => (
            <div
              key={example.id}
              className={`example ${activeExampleId === example.id ? 'active' : ''}`}
            >
              <h3>{example.title}</h3>
              <p>{example.prompt}</p>
              <div className="actions">
                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={() => loadExample(example, 'betul')}
                >
                  Muat jalan kerja betul
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
        MathKVSA · Semakan jalan kerja ubahan di atas kertas · Langsung · Songsang · Bergabung
      </footer>
    </div>
  )
}
