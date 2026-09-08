import React, { useState } from 'react'
import { FileText, Layers, Info, Lock, Droplets, EyeOff, Palette } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePdfStore } from '../../store/pdfStore.js'
import { addWatermark, downloadBytes, exportPdf } from '../../lib/pdfExporter.js'
import {
  MIME,
  downloadFile,
  exportDocx,
  exportPageImages,
  exportPlainText,
} from '../../lib/docExporter.js'
import styles from './PropertiesPanel.module.css'

export default function PropertiesPanel() {
  const {
    selectedElement, selectedElementPage,
    file, fileName, pageCount, editLayers, extractedEdits,
    pageBgs, blockBgs,
    updateTextBlock, commitExtractedEdit,
  } = usePdfStore()

  const [busyFormat, setBusyFormat] = useState(null)

  /** Filename stem, without the .pdf extension. */
  const baseName = (fileName || 'document').replace(/\.pdf$/i, '')

  /**
   * Runs one of the document exports, keeping the button disabled and the
   * toast in sync. These used to be placeholders that only showed a message.
   */
  const runExport = async (format, label, task) => {
    if (!file) { toast.error('No PDF loaded'); return }
    if (busyFormat) return
    setBusyFormat(format)
    const tid = toast.loading(`Exporting ${label}...`)
    try {
      await task()
      toast.success(`${label} downloaded`, { id: tid })
    } catch (err) {
      console.error(`${label} export failed`, err)
      toast.error(`${label} export failed: ${err.message}`, { id: tid })
    } finally {
      setBusyFormat(null)
    }
  }

  // 'exact' reproduces the page; 'flow' rebuilds it as reflowable paragraphs
  // and tables. Forms want the first, prose wants the second.
  const handleDocxExport = () => runExport('docx', 'Word document', async () => {
    const blob = await exportDocx(pageCount, extractedEdits, editLayers, {
      title: baseName,
      mode: 'exact',
    })
    downloadFile(blob, `${baseName}.docx`, MIME.docx)
  })

  const handleDocxFlowExport = () => runExport('docxflow', 'Reflowable Word document', async () => {
    const blob = await exportDocx(pageCount, extractedEdits, editLayers, {
      title: baseName,
      mode: 'flow',
    })
    downloadFile(blob, `${baseName}-reflowable.docx`, MIME.docx)
  })

  const handleImageExport = () => runExport('png', 'Page images', async () => {
    const { bytes, filename, mimeType } = await exportPageImages(pageCount, baseName)
    downloadFile(bytes, filename, mimeType)
  })

  /**
   * The old behaviour, kept as a deliberate choice rather than the default:
   * every edited page becomes a picture, which matches the preview pixel for
   * pixel but leaves no selectable text behind.
   */
  const handleFlattenedExport = () => runExport('flat', 'Flattened PDF', async () => {
    const bytes = await exportPdf(file, editLayers, pageCount, pageBgs, blockBgs, { flatten: true })
    downloadBytes(bytes, `${baseName}-flattened.pdf`)
  })

  const handleTextExport = () => runExport('txt', 'Plain text', async () => {
    const text = await exportPlainText(pageCount, extractedEdits, editLayers)
    if (!text.trim()) {
      throw new Error('no text found — this PDF may be scanned, so try OCR first')
    }
    downloadFile(new TextEncoder().encode(text), `${baseName}.txt`, MIME.txt)
  })

  const totalEdits = Object.values(editLayers).reduce(
    (sum, layer) => sum + (layer.texts?.length || 0) + (layer.annotations?.length || 0), 0
  )

  // Update a property on the selected element (works for both store & extracted)
  const updateProp = (updates) => {
    if (!selectedElement || !selectedElementPage) return
    const targetId = selectedElement.isExtracted && !selectedElement.isEdited
      ? `edited-${selectedElement.id}`
      : selectedElement.id
    // For extracted blocks that haven't been committed yet, commitExtractedEdit
    // For store blocks (user-added or already-committed), updateTextBlock
    if (selectedElement.isExtracted && !selectedElement.isEdited) {
      commitExtractedEdit(selectedElementPage, selectedElement, selectedElement.str)
    }
    updateTextBlock(selectedElementPage, targetId, updates)
    // Also update selectedElement in store so UI reflects immediately
  }

  const handleWatermark = async () => {
    if (!file) return
    const text = window.prompt('Watermark text:', 'CONFIDENTIAL')
    if (!text) return
    const tid = toast.loading('Adding watermark...')
    try {
      const bytes = await addWatermark(file, text)
      downloadBytes(bytes, `watermarked-${fileName}`)
      toast.success('Downloaded!', { id: tid })
    } catch { toast.error('Failed', { id: tid }) }
  }

  // Clean font name for display
  const displayFont = (name) => {
    if (!name) return 'Unknown'
    return name
      .replace(/^[A-Z]{6}\+/, '')
      .replace(/-(Bold|Italic|Oblique|Regular)/gi, '')
      .replace(/^g_[a-z0-9]+_/i, '')
      .slice(0, 22)
  }

  return (
    <div className={styles.panel}>

      {/* Document info */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}><Info size={12} /> Document</div>
        <div className={styles.row}><span className={styles.lbl}>Pages</span><span className={styles.val}>{pageCount || '—'}</span></div>
        <div className={styles.row}><span className={styles.lbl}>Edits</span><span className={styles.val}>{totalEdits}</span></div>
        <div className={styles.row}><span className={styles.lbl}>File</span><span className={styles.val} style={{ fontSize: 10, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName || '—'}</span></div>
      </div>

      {/* Selection properties — only when something is selected */}
      {selectedElement ? (
        <div className={styles.section}>
          <div className={styles.sectionTitle}><Layers size={12} /> Selection</div>

          {/* Detected font badge */}
          <div className={styles.detectedFont}>
            <Palette size={11} />
            {displayFont(selectedElement.fontName)}
            {selectedElement.isExtracted && !selectedElement.isEdited && (
              <span className={styles.extractedBadge}>PDF original</span>
            )}
          </div>

          {/* Text preview */}
          <div className={styles.textPreview}>
            {selectedElement.str?.slice(0, 60) || '(empty)'}
            {(selectedElement.str?.length || 0) > 60 ? '…' : ''}
          </div>

          {/* Font family */}
          <div className={styles.row}>
            <span className={styles.lbl}>Font</span>
            <select
              className={styles.ctrl}
              defaultValue="Helvetica"
              onChange={e => updateProp({ fontName: e.target.value })}
            >
              {['Helvetica', 'Times New Roman', 'Times-Roman', 'Courier New', 'Courier', 'Georgia', 'Arial'].map(f => (
                <option key={f} value={f}>{f.replace('Times-Roman','Times Roman')}</option>
              ))}
            </select>
          </div>

          {/* Font size */}
          <div className={styles.row}>
            <span className={styles.lbl}>Size</span>
            <input
              type="number" min={4} max={200}
              className={styles.numCtrl}
              defaultValue={Math.round(selectedElement.fontSize || 12)}
              onChange={e => updateProp({ fontSize: Math.max(4, Number(e.target.value)) })}
            />
          </div>

          {/* Color — shows the DETECTED color from PDF */}
          <div className={styles.row}>
            <span className={styles.lbl}>Color</span>
            <div className={styles.colorRow}>
              <input
                type="color"
                className={styles.colorCtrl}
                defaultValue={selectedElement.color || '#000000'}
                onChange={e => updateProp({ color: e.target.value })}
              />
              <span className={styles.colorHex}>{selectedElement.color || '#000000'}</span>
            </div>
          </div>

          {/* Position readout */}
          <div className={styles.row}>
            <span className={styles.lbl}>X</span>
            <span className={styles.val} style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(selectedElement.x)}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.lbl}>Y</span>
            <span className={styles.val} style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(selectedElement.y)}</span>
          </div>
        </div>
      ) : (
        <div className={styles.section}>
          <div className={styles.sectionTitle}><Layers size={12} /> Selection</div>
          <div className={styles.emptyHint}>
            Click any text in the PDF to select it, then double-click to edit
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}><FileText size={12} /> Actions</div>
        <div className={styles.actionList}>
          <button className={styles.actionBtn} onClick={handleWatermark}>
            <Droplets size={13} /> Add watermark
          </button>
          <button className={styles.actionBtn} onClick={() => toast('Switch to Redact tool in toolbar, then drag over content', { icon: '🔲' })}>
            <EyeOff size={13} /> Redact content
          </button>
          <button className={styles.actionBtn} onClick={() => toast('Password protection — use the Tools page', { icon: '🔒' })}>
            <Lock size={13} /> Password protect
          </button>
        </div>
      </div>

      {/* Export as */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Export as</div>
        <div className={styles.actionList}>
          <button
            className={styles.actionBtn}
            data-testid="export-docx"
            disabled={!file || Boolean(busyFormat)}
            onClick={handleDocxExport}
          >
            📄 {busyFormat === 'docx' ? 'Exporting…' : 'Word — same layout'}
          </button>
          <button
            className={styles.actionBtn}
            data-testid="export-docx-flow"
            disabled={!file || Boolean(busyFormat)}
            title="Rebuilds the page as normal Word paragraphs and tables. Text reflows when edited, but the layout will not match the PDF exactly."
            onClick={handleDocxFlowExport}
          >
            📝 {busyFormat === 'docxflow' ? 'Exporting…' : 'Word — reflowable'}
          </button>
          <button
            className={styles.actionBtn}
            data-testid="export-png"
            disabled={!file || Boolean(busyFormat)}
            onClick={handleImageExport}
          >
            🖼 {busyFormat === 'png' ? 'Exporting…' : `Images (PNG${pageCount > 1 ? ', zipped' : ''})`}
          </button>
          <button
            className={styles.actionBtn}
            data-testid="export-txt"
            disabled={!file || Boolean(busyFormat)}
            onClick={handleTextExport}
          >
            📋 {busyFormat === 'txt' ? 'Exporting…' : 'Plain text'}
          </button>
          <button
            className={styles.actionBtn}
            data-testid="export-flat"
            disabled={!file || Boolean(busyFormat)}
            title="Rasterises edited pages. Matches the preview exactly, but the result has no selectable text."
            onClick={handleFlattenedExport}
          >
            🧊 {busyFormat === 'flat' ? 'Exporting…' : 'Flattened PDF (image)'}
          </button>
        </div>
      </div>

    </div>
  )
}
