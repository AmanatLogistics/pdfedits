import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Download, ExternalLink, Eye, EyeOff, Loader2, LogOut, Menu as MenuIcon,
  Monitor, RotateCcw, Smartphone, Upload, X,
} from 'lucide-react'
import { PAGES } from './schema.js'
import { PAGES as SITE_PAGES, PAGE_NAMES, pageOfSection } from '../site/pages.js'
import { LABEL_GROUPS } from '../site/labels.js'
import { Emblem } from '../site/Logo.jsx'
import Dashboard from './Dashboard.jsx'
import RecordsEditor from './RecordsEditor.jsx'
import { AdminContext, FieldFor, TextInput, Toggle } from './fields.jsx'
import { ApiError, api, getToken, setToken } from './api.js'
import { prepareImage } from './image.js'
import { getAt, mapImages, setAt } from './util.js'

const DRAFT_KEY = 'faiz-admin-draft'
const readDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') } catch { return null } }
const writeDraft = (d) => { try { d ? localStorage.setItem(DRAFT_KEY, JSON.stringify(d)) : localStorage.removeItem(DRAFT_KEY) } catch { /* storage full or blocked */ } }
const SECTION_NAMES = {
  record: 'Track record', shipments: 'Recent shipments', products: 'Products', destinations: 'Shipping & map', about: 'About us',
  certifications: 'Certifications', testimonials: 'Testimonials', faq: 'Questions & answers', contact: 'Contact & partnership',
  gallery: 'Photo gallery', partner: 'Logistics partner',
}

/* ---------------- Login ---------------- */

function SetupHelp({ status }) {
  if (!status) return null
  const missing = []
  if (!status.adminPassword) missing.push(<li key="pw"><code>ADMIN_PASSWORD</code>: the password for this admin panel.</li>)
  if (!status.publishing) {
    missing.push(<li key="gh"><code>GITHUB_TOKEN</code>: a GitHub fine-grained token with <b>Contents: Read and write</b> access to this website’s repository, so changes can be published.</li>)
  }
  if (!missing.length) return null
  return (
    <div className="setup">
      <h2><AlertTriangle size={18} /> One-time setup needed</h2>
      <p>In Vercel, open this project → <b>Settings → Environment Variables</b>, add:</p>
      <ul>{missing}</ul>
      <p>Then redeploy the project. Full instructions are in the README.</p>
    </div>
  )
}

function Login({ status, onLoggedIn }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { token } = await api('login', { method: 'POST', body: { password } })
      setToken(token)
      onLoggedIn()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <div className="login__brand"><Emblem size={44} className="login__mark" /><div><strong>Website admin</strong><span>Faiz Fayez LTD</span></div></div>
        <label className="f__label" htmlFor="pw">Password</label>
        <input id="pw" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
        {error && <p className="f__error">{error}</p>}
        <button type="submit" className="b b--primary b--block" disabled={busy || !status?.adminPassword}>
          {busy ? <Loader2 className="spin" size={18} /> : null} Log in
        </button>
        <a className="login__site" href="/">← Back to the website</a>
      </form>
      <SetupHelp status={status} />
    </div>
  )
}

/* ---------------- Special editors ---------------- */

function PagesEditor({ content, setContent, setPreviewPage }) {
  const list = content.sections
  const update = (i, patch) => setContent((c) => ({ ...c, sections: c.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) }))
  const move = (i, d) => setContent((c) => {
    const next = [...c.sections]
    const [x] = next.splice(i, 1)
    next.splice(i + d, 0, x)
    return { ...c, sections: next }
  })
  const field = (path, f) => <FieldFor key={path} field={{ path, ...f }} value={getAt(content, path)} onChange={(v) => setContent((c) => setAt(c, path, v))} />
  return (
    <div className="pages">
      <h2 className="pages__h">Pages</h2>
      <p className="f__help">Each page has its own address and a banner at the top. Its sections are the same ones you edit under “Website sections”.</p>
      {SITE_PAGES.map((pg) => {
        const sections = pg.sections.map((id) => SECTION_NAMES[id] || id).join(', ')
        return (
          <div className="page-card" key={pg.id} onFocusCapture={() => setPreviewPage(pg.id)}>
            <div className="page-card__head">
              <div><strong>{PAGE_NAMES[pg.id]}</strong><span>{pg.path} · {sections}</span></div>
              <button type="button" className="b b--soft" onClick={() => setPreviewPage(pg.id)}><Eye size={15} /> Preview</button>
            </div>
            <div className="page-card__grid">
              {field(`pages.${pg.id}.label`, { type: 'text', label: 'Menu name' })}
              {pg.id !== 'contact'
                ? field(`pages.${pg.id}.inNav`, { type: 'toggle', label: 'Show in the top menu' })
                : <p className="f__help">The Contact page is linked from the main button in the top menu.</p>}
            </div>
            {field(`pages.${pg.id}.title`, { type: 'text', label: 'Banner title' })}
            {field(`pages.${pg.id}.text`, { type: 'textarea', label: 'Banner text', rows: 2 })}
            {field(`pages.${pg.id}.image`, { type: 'image', label: 'Banner photo', help: 'A wide landscape photo works best.' })}
          </div>
        )
      })}

      <h2 className="pages__h">Sections on the pages</h2>
      <p className="f__help">Show or hide each section, and set the order of the sections within each page. The home page has its own sections, under “Home page”.</p>
      <div className="sections">
        {list.map((s, i) => (
          <div className={`sections__row ${s.visible ? '' : 'is-hidden'}`} key={s.id}>
            <span className="sections__n">{i + 1}</span>
            <div className="sections__main">
              <strong>{SECTION_NAMES[s.id] || s.id} <span className="sections__page">{PAGE_NAMES[pageOfSection(s.id)?.id] ? `· ${PAGE_NAMES[pageOfSection(s.id)?.id]} page` : ''}</span></strong>
              <div className="sections__toggles">
                <Toggle label="Show on website" value={s.visible} onChange={(v) => update(i, { visible: v })} />
              </div>
            </div>
            <div className="sections__move">
              <button type="button" className="icon-b" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={16} /></button>
              <button type="button" className="icon-b" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down"><ArrowDown size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LabelsEditor({ content, setContent }) {
  const set = (key, v) => setContent((c) => ({ ...c, labels: { ...(c.labels || {}), [key]: v } }))
  return (
    <div className="labels">
      {LABEL_GROUPS.map((g) => (
        <section key={g.title} className="labels__group">
          <h2 className="pages__h">{g.title}</h2>
          {Object.entries(g.items).map(([key, [text, where]]) => (
            <TextInput key={key} label={where} placeholder={text} value={content.labels?.[key] ?? ''} onChange={(v) => set(key, v)} />
          ))}
        </section>
      ))}
    </div>
  )
}

function BackupEditor({ content, setContent }) {
  const [msg, setMsg] = useState('')
  const download = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `website-content-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  const restore = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (!data?.company || !data?.sections || !data?.hero) throw new Error('This file is not a website content backup.')
      setContent(data)
      setMsg('Backup loaded. Check the preview, then press Publish to make it live.')
    } catch (err) {
      setMsg(err.message || 'Could not read the file.')
    }
  }
  return (
    <div className="backup">
      <div className="backup__card">
        <h3>Download a backup</h3>
        <p>Saves all texts, numbers and settings (including unpublished changes) to a file on your computer.</p>
        <button type="button" className="b b--soft" onClick={download}><Download size={16} /> Download backup</button>
      </div>
      <div className="backup__card">
        <h3>Restore a backup</h3>
        <p>Loads a backup file into the editor. Nothing changes on the live website until you publish.</p>
        <label className="b b--soft"><Upload size={16} /> Choose backup file<input type="file" accept="application/json,.json" hidden onChange={restore} /></label>
      </div>
      {msg && <p className="backup__msg">{msg}</p>}
      <p className="f__help">Every published change is also saved in the website’s GitHub history, so earlier versions can always be recovered.</p>
    </div>
  )
}

function SeoPreview({ content }) {
  const url = (content.meta?.siteUrl || 'https://www.yourwebsite.com').replace(/^https?:\/\//, '').replace(/\/$/, '')
  return (
    <div className="serp">
      <p className="serp__label">Google preview</p>
      <div className="serp__box">
        <span className="serp__url">{url}</span>
        <span className="serp__title">{content.meta?.title || content.company?.name}</span>
        <span className="serp__desc">{content.meta?.description}</span>
      </div>
    </div>
  )
}

/* ---------------- Preview ---------------- */

function Preview({ content, previewMap, scrollTo, page, device, setDevice, onClose }) {
  const frame = useRef(null)
  const box = useRef(null)
  const [ready, setReady] = useState(false)
  const [size, setSize] = useState({ w: 600, h: 800 })

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onMsg = (e) => { if (e.origin === window.location.origin && e.data?.type === 'faiz:preview-ready') setReady(true) }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  const post = useCallback((extra) => {
    frame.current?.contentWindow?.postMessage({ type: 'faiz:preview', content: mapImages(content, previewMap), page, ...extra }, window.location.origin)
  }, [content, previewMap, page])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => post(), 120)
    return () => clearTimeout(t)
  }, [ready, post])

  useEffect(() => {
    if (ready) post({ scrollTo: scrollTo || 'top' })
    // Only scroll when the editor page changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, scrollTo, page])

  const width = device === 'mobile' ? 390 : 1280
  const scale = Math.min(1, size.w / width)
  return (
    <aside className="preview">
      <div className="preview__bar">
        <span className="preview__title"><Eye size={16} /> Live preview</span>
        <div className="seg" role="group" aria-label="Preview size">
          <button type="button" className={device === 'desktop' ? 'is-on' : ''} onClick={() => setDevice('desktop')} aria-pressed={device === 'desktop'}><Monitor size={15} /> Desktop</button>
          <button type="button" className={device === 'mobile' ? 'is-on' : ''} onClick={() => setDevice('mobile')} aria-pressed={device === 'mobile'}><Smartphone size={15} /> Phone</button>
        </div>
        <button type="button" className="icon-b preview__close" onClick={onClose} aria-label="Hide preview"><X size={16} /></button>
      </div>
      <div className="preview__stage" ref={box}>
        <div className="preview__frame" style={{ width, height: size.h / scale, transform: `scale(${scale})` }}>
          <iframe ref={frame} title="Website preview" src="/?preview=1" />
        </div>
        {!ready && <div className="preview__loading"><Loader2 className="spin" size={22} /></div>}
      </div>
    </aside>
  )
}

/* ---------------- Main editor ---------------- */

export default function AdminApp() {
  const [status, setStatus] = useState(null)
  const [phase, setPhase] = useState(() => (getToken() ? 'checking' : 'login'))
  const [loadError, setLoadError] = useState('')
  const [content, setContent] = useState(null)
  const [published, setPublished] = useState('')
  const [version, setVersion] = useState('')
  const [uploads, setUploads] = useState([])
  const [previewMap, setPreviewMap] = useState({})
  const [pageId, setPageId] = useState('dashboard')
  const [pasting, setPasting] = useState(false)
  const [pagePreview, setPagePreview] = useState(null)
  const [device, setDevice] = useState('desktop')
  const [showPreview, setShowPreview] = useState(() => window.innerWidth > 1180)
  const [navOpen, setNavOpen] = useState(false)
  const [publish, setPublish] = useState({ state: 'idle', message: '' })
  const [draftOffer, setDraftOffer] = useState(null)

  const dirty = content !== null && JSON.stringify(content) !== published

  const load = useCallback(() => api('content').then((data) => {
    const text = JSON.stringify(data.content)
    setContent(data.content)
    setPublished(text)
    setVersion(data.version)
    setPhase('ready')
    const draft = readDraft()
    if (draft?.content && JSON.stringify(draft.content) !== text) setDraftOffer(draft)
    else writeDraft(null)
  }, (err) => {
    if (err instanceof ApiError && err.status === 401) {
      setToken('')
      setPhase('login')
    } else {
      setLoadError(err.message)
      setPhase('error')
    }
  }), [])

  useEffect(() => {
    api('status').then((s) => setStatus(s), () => setStatus({ adminPassword: false, publishing: null, offline: true }))
    if (getToken()) load()
  }, [load])

  // Keep unpublished edits in this browser so a refresh does not lose them.
  useEffect(() => {
    if (phase !== 'ready' || draftOffer) return
    writeDraft(dirty ? { content, version, uploads, savedAt: Date.now() } : null)
  }, [content, dirty, version, uploads, phase, draftOffer])

  useEffect(() => {
    if (!dirty) return
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const uploadImage = useCallback(async (file) => {
    const { type, dataUrl } = await prepareImage(file)
    const res = await api('upload', { method: 'POST', body: { name: file.name, type, data: dataUrl.split(',')[1] } })
    setUploads((u) => [...u, { name: res.name, blob: res.blob }])
    setPreviewMap((m) => ({ ...m, [res.path]: dataUrl }))
    return res.path
  }, [])
  const resolveImage = useCallback((src) => previewMap[src] ?? src, [previewMap])
  const ctx = useMemo(() => ({ uploadImage, resolveImage }), [uploadImage, resolveImage])

  const doPublish = async () => {
    setPublish({ state: 'busy', message: '' })
    try {
      const res = await api('content', { method: 'POST', body: { content, uploads, version } })
      setPublished(JSON.stringify(content))
      setVersion(res.version)
      setUploads([])
      writeDraft(null)
      setPublish({
        state: 'done',
        message: res.mode === 'github'
          ? 'Published. The live website updates automatically in about 1–2 minutes.'
          : res.unchanged ? 'Nothing to publish: no changes.' : 'Saved to the project files.',
        url: res.url,
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) { setToken(''); setPhase('login') }
      setPublish({ state: 'error', message: err.message })
    }
  }

  const goTo = (page, action) => {
    if (action === 'add') {
      setContent((c) => {
        const last = c.records?.[0] || {}
        const row = { date: new Date().toISOString().slice(0, 7), product: last.product || c.products?.items?.[0]?.title || '', country: last.country || 'India', direction: last.direction || 'export', tonnes: 0, orders: 1, transport: last.transport || 'road' }
        return { ...c, records: [row, ...(c.records || [])] }
      })
    }
    setPasting(action === 'paste')
    setPagePreview(null)
    setPageId(page)
    document.querySelector('.editor')?.scrollTo(0, 0)
  }

  const discard = () => {
    if (!window.confirm('Discard all changes that have not been published?')) return
    setContent(JSON.parse(published))
    setUploads([])
    writeDraft(null)
  }

  const logout = () => {
    if (dirty && !window.confirm('You have unpublished changes. They stay saved in this browser. Log out anyway?')) return
    setToken('')
    setPhase('login')
  }

  if (phase === 'checking') return <div className="center"><Loader2 className="spin" size={28} /></div>
  if (phase === 'login') return <Login status={status} onLoggedIn={() => { setPhase('checking'); load() }} />
  if (phase === 'error') {
    return (
      <div className="center">
        <div className="login__card">
          <h2 className="err-title"><AlertTriangle size={20} /> Could not load the website content</h2>
          <p>{loadError}</p>
          <button type="button" className="b b--primary" onClick={() => { setPhase('checking'); load() }}>Try again</button>
          <SetupHelp status={status} />
        </div>
      </div>
    )
  }

  const page = PAGES.find((p) => p.id === pageId) ?? PAGES[0]
  const groups = [...new Set(PAGES.map((p) => p.group))]
  const sectionIndex = (id) => content.sections.findIndex((s) => s.id === id)

  return (
    <AdminContext.Provider value={ctx}>
      <div className={`admin ${showPreview ? 'with-preview' : ''} ${page.special === 'records' || page.special === 'dashboard' ? 'is-wide' : ''}`}>
        <header className="topbar-a">
          <button type="button" className="icon-b topbar-a__menu" onClick={() => setNavOpen((o) => !o)} aria-label="Menu"><MenuIcon size={18} /></button>
          <div className="topbar-a__brand"><Emblem size={32} className="login__mark" /><strong>Website admin</strong></div>
          <span className={`pill ${dirty ? 'pill--warn' : 'pill--ok'}`}>{dirty ? 'Unpublished changes' : 'Up to date'}</span>
          <div className="topbar-a__actions">
            <a className="b b--ghost" href="/" target="_blank" rel="noreferrer"><ExternalLink size={16} /> <span className="hide-sm">View website</span></a>
            <button type="button" className="b b--ghost" onClick={() => setShowPreview((s) => !s)}>{showPreview ? <EyeOff size={16} /> : <Eye size={16} />} <span className="hide-sm">{showPreview ? 'Hide preview' : 'Preview'}</span></button>
            <button type="button" className="b b--ghost" onClick={discard} disabled={!dirty}><RotateCcw size={16} /> <span className="hide-sm">Discard</span></button>
            <button type="button" className="b b--primary" onClick={doPublish} disabled={!dirty || publish.state === 'busy'}>
              {publish.state === 'busy' ? <Loader2 className="spin" size={16} /> : <Upload size={16} />} Publish
            </button>
            <button type="button" className="icon-b" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={16} /></button>
          </div>
        </header>

        <div className="notices">
          {(publish.state === 'done' || publish.state === 'error') && (
            <div className={`notice notice--${publish.state === 'done' ? 'ok' : 'err'}`} role="status">
              {publish.state === 'done' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{publish.message} {publish.url && <a href={publish.url} target="_blank" rel="noreferrer">View change</a>}</span>
              <button type="button" className="icon-b" onClick={() => setPublish({ state: 'idle', message: '' })} aria-label="Close"><X size={15} /></button>
            </div>
          )}
          {draftOffer && (
            <div className="notice notice--warn" role="status">
              <AlertTriangle size={18} />
              <span>You have unpublished changes saved in this browser from {new Date(draftOffer.savedAt).toLocaleString()}.</span>
              <button type="button" className="b b--soft" onClick={() => { setContent(draftOffer.content); setUploads(draftOffer.uploads || []); if (draftOffer.version) setVersion(draftOffer.version); setDraftOffer(null) }}>Restore them</button>
              <button type="button" className="b b--ghost" onClick={() => { writeDraft(null); setDraftOffer(null) }}>Discard</button>
            </div>
          )}
          {status && !status.publishing && (
            <div className="notice notice--warn"><AlertTriangle size={18} /><span>Publishing is not set up on this deployment yet, so changes cannot be saved. Add <code>GITHUB_TOKEN</code> in Vercel (see README).</span></div>
          )}
        </div>

        <nav className={`side ${navOpen ? 'is-open' : ''}`} aria-label="Admin sections">
          {groups.map((g) => (
            <div className="side__group" key={g}>
              <p>{g}</p>
              {PAGES.filter((p) => p.group === g).map((p) => {
                const idx = p.preview ? sectionIndex(p.preview) : -1
                const hidden = idx >= 0 && !content.sections[idx].visible
                return (
                  <button type="button" key={p.id} className={`side__item ${p.id === pageId ? 'is-on' : ''}`} onClick={() => { goTo(p.id); setNavOpen(false) }}>
                    <p.icon size={17} /> <span>{p.title}</span>{hidden && <EyeOff size={14} className="side__hidden" aria-label="hidden" />}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <main className="editor">
          <div className="editor__head">
            <h1>{page.title}</h1>
            {page.intro && <p>{page.intro}</p>}
          </div>
          <div className={`editor__body ${page.special === 'records' || page.special === 'dashboard' ? 'editor__body--wide' : ''}`}>
            {page.special === 'dashboard' && <Dashboard content={content} status={status} dirty={dirty} goTo={goTo} />}
            {page.special === 'records' && <RecordsEditor content={content} setContent={setContent} pasting={pasting} setPasting={setPasting} />}
            {page.special === 'pages' && <PagesEditor content={content} setContent={setContent} setPreviewPage={setPagePreview} />}
            {page.special === 'backup' && <BackupEditor content={content} setContent={setContent} />}
            {page.special === 'labels' && <LabelsEditor content={content} setContent={setContent} />}
            {page.fields?.map((field, i) => {
              if (field.type === 'sectionToggle') {
                const idx = sectionIndex(field.section)
                if (idx < 0) return null
                return (
                  <div className="editor__show" key={`t${i}`}>
                    <Toggle label={field.label} value={content.sections[idx].visible}
                      onChange={(v) => setContent((c) => ({ ...c, sections: c.sections.map((s) => (s.id === field.section ? { ...s, visible: v } : s)) }))} />
                  </div>
                )
              }
              return <FieldFor key={field.path || `h${i}`} field={field} value={getAt(content, field.path)} onChange={(v) => setContent((c) => setAt(c, field.path, v))} />
            })}
            {page.seoPreview && <SeoPreview content={content} />}
          </div>
        </main>

        {showPreview && (
          <Preview content={content} previewMap={previewMap} scrollTo={page.preview} page={pagePreview || page.sitePage || pageOfSection(page.preview)?.id || 'home'}
            device={device} setDevice={setDevice} onClose={() => setShowPreview(false)} />
        )}
      </div>
    </AdminContext.Provider>
  )
}

