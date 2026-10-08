import { createContext, useContext, useId, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, ImagePlus, Link2, Loader2, Plus, Trash2, X } from 'lucide-react'
import { IMAGE_LINK_HELP, normalizeImageLink } from './imageLinks.js'

// Shared by every field: image upload and showing not-yet-deployed uploads.
export const AdminContext = createContext({ uploadImage: async () => '', resolveImage: (s) => s })

function Field({ label, help, htmlFor, children, counter, value, required }) {
  const count = counter && typeof value === 'string' ? value.length : null
  return (
    <div className="f">
      {label && (
        <div className="f__label">
          <label htmlFor={htmlFor}>{label}{required && <span className="f__req"> *</span>}</label>
          {count !== null && <span className={`f__count ${count > counter ? 'is-over' : ''}`}>{count}/{counter}</span>}
        </div>
      )}
      {children}
      {help && <p className="f__help">{help}</p>}
    </div>
  )
}

export function TextInput({ label, help, value, onChange, type = 'text', counter, maxLength, required, placeholder }) {
  const id = useId()
  return (
    <Field label={label} help={help} htmlFor={id} counter={counter} value={value} required={required}>
      <input id={id} className="input" type={type} value={value ?? ''} maxLength={maxLength} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
    </Field>
  )
}

export function NumberInput({ label, help, value, onChange }) {
  const id = useId()
  return (
    <Field label={label} help={help} htmlFor={id}>
      <input id={id} className="input" type="number" inputMode="decimal" value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
    </Field>
  )
}

export function TextArea({ label, help, value, onChange, rows = 3, counter }) {
  const id = useId()
  return (
    <Field label={label} help={help} htmlFor={id} counter={counter} value={value}>
      <textarea id={id} className="input input--area" rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </Field>
  )
}

export function Toggle({ label, help, value, onChange }) {
  const id = useId()
  return (
    <div className="f f--toggle">
      <label className="toggle" htmlFor={id}>
        <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle__track" aria-hidden="true"><span /></span>
        <span className="toggle__label">{label}</span>
      </label>
      {help && <p className="f__help">{help}</p>}
    </div>
  )
}

export function Select({ label, help, value, onChange, options }) {
  const id = useId()
  const known = options.some((o) => o.value === value)
  return (
    <Field label={label} help={help} htmlFor={id}>
      <select id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {!known && <option value={value ?? ''}>{value || 'Choose…'}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
}

export function ColorInput({ label, help, value, onChange }) {
  const id = useId()
  const valid = /^#[0-9a-f]{6}$/i.test(value || '')
  return (
    <Field label={label} help={help} htmlFor={id}>
      <div className="color">
        <input type="color" aria-label={`${label} picker`} value={valid ? value : '#000000'} onChange={(e) => onChange(e.target.value)} />
        <input id={id} className={`input ${valid ? '' : 'is-invalid'}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="#6b3a1a" maxLength={7} />
      </div>
    </Field>
  )
}

function useUpload(onDone) {
  const { uploadImage } = useContext(AdminContext)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const pick = () => inputRef.current?.click()
  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    try {
      onDone(await uploadImage(file), file)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  const input = <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={onFile} />
  return { busy, error, pick, input }
}

// A backup address and photographer credit belong to one photo, so they are dropped when it changes.
const newPhoto = (img, patch) => {
  const next = { ...img, ...patch }
  delete next.fallback
  delete next.credit
  delete next.creditUrl
  return next
}

// The box for pasting a photo link, with page links (Pexels, Unsplash,
// Google Images) converted to the photo itself.
function LinkBox({ value, onApply }) {
  const shown = value && !/^\/uploads\//.test(value) ? value : ''
  const [draft, setDraft] = useState(shown)
  const [last, setLast] = useState(shown)
  const [msg, setMsg] = useState(null)
  if (shown !== last) { setLast(shown); setDraft(shown); setMsg(null) }
  const apply = (text) => {
    setDraft(text)
    const r = normalizeImageLink(text)
    if (r.error) { setMsg({ type: 'error', text: r.error }); return }
    setMsg(r.note ? { type: 'note', text: r.note } : null)
    if (r.src !== value) { setLast(r.src); onApply(r.src) }
    if (r.src !== text) setDraft(r.src)
  }
  return (
    <>
      <input className="input input--sm" placeholder="Paste a photo link: https://…" value={draft} aria-label="Photo link"
        onChange={(e) => apply(e.target.value)} />
      {msg && <p className={msg.type === 'error' ? 'f__error' : 'f__help'}>{msg.text}</p>}
    </>
  )
}

// The thumbnail, which also notices links that do not show a picture and
// pictures that are too small to look sharp (see PhotoStatus).
function usePhotoStatus(src) {
  const [state, setState] = useState({ src: '', status: '' })
  return [state.src === src ? state.status : '', (status) => setState({ src, status })]
}

function Thumb({ src, empty, busy, contain, dark, onStatus }) {
  const { resolveImage } = useContext(AdminContext)
  return (
    <div className={`img__thumb ${dark ? 'img__thumb--dark' : ''}`}>
      {src ? <img src={resolveImage(src)} alt="" style={contain ? { objectFit: 'contain' } : undefined}
        onLoad={(e) => onStatus(e.currentTarget.naturalWidth < 800 && !contain ? `small:${e.currentTarget.naturalWidth}` : 'ok')}
        onError={() => onStatus('error')} /> : <span>{empty}</span>}
      {busy && <span className="img__busy"><Loader2 className="spin" size={22} /></span>}
    </div>
  )
}

function PhotoStatus({ status }) {
  if (status === 'error') return <p className="f__error">This link does not show a picture (the website may block it). Use “Copy image address” on the photo, or upload it.</p>
  if (status.startsWith('small:')) return <p className="f__help img__warn">This picture is small ({status.slice(6)} px wide) and may look blurry in large spaces. A photo at least 1200 px wide works best.</p>
  return null
}

// An image with alt text: { src, alt } (plus an optional credit for photos that need one).
export function ImageInput({ label, help, value, onChange }) {
  const img = value && typeof value === 'object' ? value : { src: '', alt: '' }
  const up = useUpload((path, file) => onChange(newPhoto(img, { src: path, alt: img.alt || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') })))
  const [status, setStatus] = usePhotoStatus(img.src)
  return (
    <Field label={label} help={help}>
      <div className="img">
        <div className="img__left"><Thumb src={img.src} empty="No photo" busy={up.busy} onStatus={setStatus} /></div>
        <div className="img__side">
          <div className="img__buttons">
            <button type="button" className="b b--soft" onClick={up.pick} disabled={up.busy}><ImagePlus size={16} /> {img.src ? 'Upload a new photo' : 'Upload a photo'}</button>
            {img.src && <button type="button" className="b b--ghost b--danger" onClick={() => onChange(newPhoto(img, { src: '' }))} aria-label="Remove photo"><X size={16} /></button>}
          </div>
          <LinkBox value={img.src} onApply={(src) => onChange(newPhoto(img, { src }))} />
          <PhotoStatus status={status} />
          <p className="f__help"><Link2 size={13} /> {IMAGE_LINK_HELP}</p>
          <input className="input input--sm" placeholder="Describe the photo (for Google and screen readers)" value={img.alt ?? ''}
            onChange={(e) => onChange({ ...img, alt: e.target.value })} aria-label="Photo description" />
          {img.credit && <p className="f__help">Photo: {img.credit} (credited in the footer)</p>}
          {up.error && <p className="f__error">{up.error}</p>}
        </div>
        {up.input}
      </div>
    </Field>
  )
}

// A single image address (logo, share picture).
export function ImageSrcInput({ label, help, value, onChange, dark }) {
  const up = useUpload((path) => onChange(path))
  const [status, setStatus] = usePhotoStatus(value)
  return (
    <Field label={label} help={help}>
      <div className="img img--small">
        <div className="img__left"><Thumb src={value} empty="None" busy={up.busy} contain dark={dark} onStatus={setStatus} /></div>
        <div className="img__side">
          <div className="img__buttons">
            <button type="button" className="b b--soft" onClick={up.pick} disabled={up.busy}><ImagePlus size={16} /> {value ? 'Upload a new one' : 'Upload'}</button>
            {value && <button type="button" className="b b--ghost b--danger" onClick={() => onChange('')}><X size={16} /> Remove</button>}
          </div>
          <LinkBox value={value} onApply={onChange} />
          <PhotoStatus status={status} />
          {up.error && <p className="f__error">{up.error}</p>}
        </div>
        {up.input}
      </div>
    </Field>
  )
}

export function StringList({ label, help, value, onChange, addLabel = 'Add' }) {
  const list = Array.isArray(value) ? value : []
  const update = (i, v) => onChange(list.map((x, j) => (j === i ? v : x)))
  const move = (i, d) => {
    const next = [...list]
    const [x] = next.splice(i, 1)
    next.splice(i + d, 0, x)
    onChange(next)
  }
  return (
    <Field label={label} help={help}>
      <div className="slist">
        {list.map((item, i) => (
          <div className="slist__row" key={i}>
            <input className="input" value={item} onChange={(e) => update(i, e.target.value)} aria-label={`${label} ${i + 1}`} />
            <button type="button" className="icon-b" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={15} /></button>
            <button type="button" className="icon-b" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down"><ArrowDown size={15} /></button>
            <button type="button" className="icon-b icon-b--danger" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 size={15} /></button>
          </div>
        ))}
        <button type="button" className="b b--add" onClick={() => onChange([...list, ''])}><Plus size={16} /> {addLabel}</button>
      </div>
    </Field>
  )
}

export function ListInput({ field, value, onChange }) {
  const list = Array.isArray(value) ? value : []
  const [open, setOpen] = useState(() => (list.length <= 1 ? 0 : -1))
  const update = (i, key, v) => onChange(list.map((x, j) => (j === i ? { ...x, [key]: v } : x)))
  const move = (i, d) => {
    const next = [...list]
    const [x] = next.splice(i, 1)
    next.splice(i + d, 0, x)
    onChange(next)
    if (open === i) setOpen(i + d)
  }
  const remove = (i) => {
    const title = list[i]?.[field.titleKey]
    if (!window.confirm(`Remove ${field.itemLabel.toLowerCase()}${title ? ` “${title}”` : ''}?`)) return
    onChange(list.filter((_, j) => j !== i))
    setOpen(-1)
  }
  const add = () => {
    onChange([...list, JSON.parse(JSON.stringify(field.newItem))])
    setOpen(list.length)
  }
  return (
    <div className="f">
      <div className="f__label"><span className="f__label-text">{field.label}</span><span className="f__count">{list.length}</span></div>
      <div className={`list ${field.compact ? 'list--compact' : ''}`}>
        {list.map((item, i) => {
          const title = item?.[field.titleKey]
          const isOpen = open === i
          return (
            <div className={`list__item ${isOpen ? 'is-open' : ''}`} key={i}>
              <div className="list__head">
                <button type="button" className="list__toggle" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
                  <span className="list__n">{i + 1}</span>
                  <span className="list__title">{title !== undefined && title !== '' ? String(title) : <em>Untitled {field.itemLabel.toLowerCase()}</em>}</span>
                  <ChevronDown size={18} className="list__chev" />
                </button>
                <button type="button" className="icon-b" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={15} /></button>
                <button type="button" className="icon-b" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down"><ArrowDown size={15} /></button>
                <button type="button" className="icon-b icon-b--danger" onClick={() => remove(i)} aria-label={`Remove ${field.itemLabel.toLowerCase()}`}><Trash2 size={15} /></button>
              </div>
              {isOpen && (
                <div className={`list__body ${field.compact ? 'list__body--row' : ''}`}>
                  {field.fields.map((sub) => (
                    <FieldFor key={sub.key} field={sub} value={item?.[sub.key]} onChange={(v) => update(i, sub.key, v)} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
        <button type="button" className="b b--add" onClick={add}><Plus size={16} /> Add {field.itemLabel.toLowerCase()}</button>
      </div>
    </div>
  )
}

export function FieldFor({ field, value, onChange }) {
  const common = { label: field.label, help: field.help, value, onChange }
  switch (field.type) {
    case 'heading': return <div className="f__group"><h2>{field.label}</h2>{field.help && <p className="f__help">{field.help}</p>}</div>
    case 'textarea': return <TextArea {...common} rows={field.rows} counter={field.counter} />
    case 'number': return <NumberInput {...common} />
    case 'email': return <TextInput {...common} type="email" />
    case 'url': return <TextInput {...common} type="url" placeholder="https://" />
    case 'toggle': return <Toggle {...common} />
    case 'select': return <Select {...common} options={field.options} />
    case 'color': return <ColorInput {...common} />
    case 'image': return <ImageInput {...common} />
    case 'imageSrc': return <ImageSrcInput {...common} dark={field.dark} />
    case 'stringList': return <StringList {...common} addLabel={field.addLabel} />
    case 'list': return <ListInput field={field} value={value} onChange={onChange} />
    default: return <TextInput {...common} counter={field.counter} maxLength={field.maxLength} required={field.required} />
  }
}
