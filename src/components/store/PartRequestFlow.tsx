import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, FileImage, Plus, Send, Trash2, X } from 'lucide-react';
import { storeCategories } from '@/data/storeCatalog';
import {
  deleteRequest, deleteRequestImages, newRequestId, readRequestImage, readRequests, saveRequest,
  saveRequestImage, type SavedRequest,
} from '@/lib/demoStore';
import './store.css';

export type PartRequestFlowProps = {
  requests: SavedRequest[];
  onRequestsChange: (requests: SavedRequest[]) => void;
};

type DraftImage = { key: string; file: File };
type RequestForm = {
  name: string;
  phone: string;
  partName: string;
  category: string;
  quantity: string;
  description: string;
  brand: string;
  model: string;
  budget: string;
  referenceUrl: string;
  notes: string;
};
type FormErrors = Partial<Record<keyof RequestForm | 'images', string>>;

const emptyForm: RequestForm = {
  name: '', phone: '', partName: '', category: 'cpu', quantity: '1',
  description: '', brand: '', model: '', budget: '', referenceUrl: '', notes: '',
};
const imageLimit = 5 * 1024 * 1024;
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const requestNotice = 'This is a demonstration request only. No seller has been contacted, and the request does not guarantee product availability, pricing, or delivery.';
const inr = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
const dateLabel = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date);
};

export function PartRequestFlow({ requests, onRequestsChange }: PartRequestFlowProps) {
  const [form, setForm] = useState<RequestForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [images, setImages] = useState<DraftImage[]>([]);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [replaceAt, setReplaceAt] = useState<number | null>(null);
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const partNameRef = useRef<HTMLInputElement>(null);
  const selected = useMemo(() => requests.find((request) => request.id === selectedId) ?? null, [requests, selectedId]);
  const categories = storeCategories.filter((category) => category.id !== 'all');
  const previews = useMemo(() => images.map((image) => ({ ...image, url: URL.createObjectURL(image.file) })), [images]);

  useEffect(() => () => { previews.forEach((preview) => URL.revokeObjectURL(preview.url)); }, [previews]);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    async function loadImages() {
      setDetailImages([]);
      if (!selected?.imageIds.length) {
        return;
      }
      try {
        const blobs = await Promise.all(selected.imageIds.map((id) => readRequestImage(id)));
        blobs.forEach((blob) => { if (blob) urls.push(URL.createObjectURL(blob)); });
        if (!cancelled) setDetailImages(urls);
        else urls.forEach((url) => URL.revokeObjectURL(url));
      } catch {
        if (!cancelled) setDetailImages([]);
      }
    }
    void loadImages();
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selected?.id]);

  function update(field: keyof RequestForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateFile(file: File) {
    if (!allowedImageTypes.includes(file.type)) return `${file.name}: choose a JPEG, PNG, or WebP image.`;
    if (file.size > imageLimit) return `${file.name}: each image must be 5 MB or smaller.`;
    return '';
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (!chosen.length) return;
    setFeedback('');
    if (replaceAt !== null) {
      const next = chosen[0];
      const validation = validateFile(next);
      if (validation) {
        setErrors((current) => ({ ...current, images: validation }));
        setReplaceAt(null);
        return;
      }
      setImages((current) => current.map((image, index) => index === replaceAt ? { ...image, file: next } : image));
      setReplaceAt(null);
      setErrors((current) => ({ ...current, images: undefined }));
      return;
    }
    const good: DraftImage[] = [];
    const rejected: string[] = [];
    chosen.forEach((file) => {
      const validation = validateFile(file);
      if (validation) rejected.push(validation);
      else good.push({ key: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`, file });
    });
    setImages((current) => {
      const room = Math.max(0, 5 - current.length);
      if (good.length > room) rejected.push('You can attach up to five images.');
      return [...current, ...good.slice(0, room)];
    });
    setErrors((current) => ({ ...current, images: rejected.join(' ') || undefined }));
  }

  function validateForm() {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = 'Enter your name.';
    if (!/^(?:\+91[\s-]?)?[6-9]\d{9}$/.test(form.phone.replace(/[()\s-]/g, ''))) next.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (!form.partName.trim()) next.partName = 'Enter the component or model you are looking for.';
    if (!form.description.trim()) next.description = 'Describe the requested component or the reason you need it.';
    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) next.quantity = 'Enter a whole quantity from 1 to 99.';
    if (form.budget.trim() && (!Number.isFinite(Number(form.budget)) || Number(form.budget) <= 0)) next.budget = 'Enter a positive budget amount or leave this blank.';
    if (form.referenceUrl.trim()) {
      try {
        const url = new URL(form.referenceUrl);
        if (!['http:', 'https:'].includes(url.protocol)) next.referenceUrl = 'Use a complete http or https link.';
      } catch {
        next.referenceUrl = 'Enter a complete http or https link.';
      }
    }
    if (images.length > 5) next.images = 'You can attach up to five images.';
    return next;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm();
    setErrors(nextErrors);
    setFeedback('');
    if (Object.keys(nextErrors).length) {
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`request-${first}`)?.focus();
      return;
    }
    setSaving(true);
    const imageIds: string[] = [];
    try {
      for (const image of images) imageIds.push(await saveRequestImage(image.file));
      const request: SavedRequest = {
        id: newRequestId(requests),
        createdAt: new Date().toISOString(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        partName: form.partName.trim(),
        category: form.category,
        quantity: Number(form.quantity),
        description: form.description.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        budget: form.budget.trim() ? Number(form.budget) : null,
        referenceUrl: form.referenceUrl.trim(),
        notes: form.notes.trim(),
        imageIds,
        status: 'Demo Request Submitted',
      };
      saveRequest(request);
      onRequestsChange(readRequests());
      setSelectedId(request.id);
      setForm(emptyForm);
      setImages([]);
      setErrors({});
      setFeedback(`Request ${request.id} saved locally. No seller has been contacted.`);
    } catch {
      if (imageIds.length) {
        try { await deleteRequestImages(imageIds); } catch { /* Keep request error visible if storage is unavailable. */ }
      }
      setFeedback('The request could not be saved in this browser. Check local storage permissions and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function removeRequest(request: SavedRequest) {
    try {
      deleteRequest(request.id);
      await deleteRequestImages(request.imageIds);
      onRequestsChange(readRequests());
      if (selectedId === request.id) setSelectedId(null);
      setDeleteId(null);
      setFeedback('Demo request removed from this browser.');
    } catch {
      onRequestsChange(readRequests());
      setFeedback('The request record was removed, but some local image data could not be cleared.');
      setDeleteId(null);
    }
  }

  function createAnotherRequest() {
    setForm(emptyForm);
    setImages([]);
    setErrors({});
    setFeedback('');
    setSelectedId(null);
    setDeleteId(null);
    partNameRef.current?.focus();
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const error = (key: keyof FormErrors) => errors[key] && <span className="nxs-error" id={`request-${key}-error`}>{errors[key]}</span>;
  const textField = (key: keyof RequestForm, label: string, options: { required?: boolean; type?: string; wide?: boolean; min?: string; max?: string } = {}) => (
    <div className={`nxs-form-field${options.wide ? ' span-2' : ''}`}>
      <label htmlFor={`request-${key}`}>{label}{options.required && <span aria-hidden="true"> *</span>}</label>
      <input
        className="nxs-field" id={`request-${key}`} name={key} type={options.type ?? 'text'} value={form[key]}
        required={options.required} min={options.min} max={options.max}
        onChange={(event) => update(key, event.target.value)}
        aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `request-${key}-error` : undefined}
      />
      {error(key)}
    </div>
  );

  return (
    <main className="nxs-store" aria-labelledby="request-title">
      <div className="nxs-wrap">
        <header className="nxs-heading">
          <div><div className="nxs-kicker">LOCAL RECORDS / MY REQUESTS</div><h1 id="request-title">Looking for a specific part?</h1><p>Describe what you want to learn about. This form creates a private demo note in your browser; it does not contact a retailer or seller.</p></div>
          <span className="nxs-status">No seller contact</span>
        </header>
        <div className="nxs-request-layout">
          <section className="nxs-panel nxs-panel-pad" aria-labelledby="request-form-title">
            <div className="nxs-panel-title"><h2 id="request-form-title">Describe your request</h2><span className="nxs-subtle">* required</span></div>
            <form ref={formRef} onSubmit={submit} noValidate>
              <div className="nxs-form">
                {textField('name', 'Your name', { required: true })}
                {textField('phone', 'Indian mobile number', { required: true, type: 'tel' })}
                <div className="nxs-form-field span-2">
                  <label htmlFor="request-partName">Part or model name *</label>
                  <input ref={partNameRef} className="nxs-field" id="request-partName" name="partName" value={form.partName} onChange={(event) => update('partName', event.target.value)} aria-invalid={!!errors.partName} aria-describedby={errors.partName ? 'request-partName-error' : undefined} />
                  {error('partName')}
                </div>
                <div className="nxs-form-field">
                  <label htmlFor="request-category">Closest category *</label>
                  <select id="request-category" className="nxs-select" value={form.category} onChange={(event) => update('category', event.target.value)}>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                    <option value="other">Other</option>
                  </select>
                </div>
                {textField('quantity', 'Quantity (1–99)', { required: true, type: 'number', min: '1', max: '99' })}
                {textField('brand', 'Brand (optional)')}
                {textField('model', 'Model (optional)')}
                {textField('budget', 'Indicative budget in ₹ (optional)', { type: 'number', min: '1' })}
                {textField('referenceUrl', 'Reference URL (optional)', { type: 'url', wide: true })}
                <div className="nxs-form-field span-2"><label htmlFor="request-description">Description *</label><textarea required id="request-description" className="nxs-textarea" value={form.description} onChange={(event) => update('description', event.target.value)} aria-invalid={!!errors.description} aria-describedby={errors.description ? 'request-description-error' : undefined} placeholder="Share the specifications, compatibility question, or use case that matters to you." />{error('description')}</div>
                <div className="nxs-form-field span-2"><label htmlFor="request-notes">Additional notes (optional)</label><textarea id="request-notes" className="nxs-textarea" value={form.notes} onChange={(event) => update('notes', event.target.value)} /></div>
                <div className="nxs-form-field span-2">
                  <label>Reference images (optional)</label>
                  <div className="nxs-file-drop">
                    <span className="nxs-subtle">JPEG, PNG, or WebP · up to 5 MB each · maximum five images</span>
                    <input ref={inputRef} className="sr-only" id="request-images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileChange} aria-label="Choose reference images" />
                    <div><button className="nxs-button secondary" type="button" onClick={() => { setReplaceAt(null); inputRef.current?.click(); }} disabled={images.length >= 5}><Plus size={14} /> Add images</button></div>
                    {error('images')}
                    {!!previews.length && <div className="nxs-file-list">{previews.map((preview, index) => (
                      <div className="nxs-file-preview" key={preview.key}>
                        <img src={preview.url} alt={`Preview of ${preview.file.name}`} />
                        <button type="button" onClick={() => { setReplaceAt(index); inputRef.current?.click(); }} aria-label={`Replace ${preview.file.name}`} title="Replace image"><FileImage size={13} /></button>
                        <button type="button" onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${preview.file.name}`} title="Remove image" style={{ top: 36 }}><X size={13} /></button>
                      </div>
                    ))}</div>}
                  </div>
                </div>
              </div>
              <p className="nxs-feedback" role="alert">{feedback}</p>
              <button className="nxs-button" type="submit" disabled={saving}><Send size={14} /> {saving ? 'Saving locally…' : 'Save demo request'}</button>
            </form>
          </section>

          <aside className="nxs-panel nxs-panel-pad" aria-labelledby="my-requests-title">
            <div className="nxs-panel-title"><div><div className="nxs-kicker">THIS DEVICE</div><h2 id="my-requests-title">My requests</h2></div><span className="nxs-subtle">{requests.length} saved</span></div>
            {requests.length ? (
              <div className="nxs-request-list">
                {requests.map((request) => (
                  <div className="nxs-request-item" key={request.id}>
                    <button type="button" className="nxs-link-button" onClick={() => { setSelectedId(selectedId === request.id ? null : request.id); setDeleteId(null); }} aria-expanded={selectedId === request.id}>
                      <strong>{request.partName}</strong><small>{request.category} · {dateLabel(request.createdAt)} · Qty {request.quantity}</small>
                    </button>
                    <button className="nxs-icon-button" type="button" onClick={() => setDeleteId(deleteId === request.id ? null : request.id)} aria-label={`Remove request for ${request.partName}`}><Trash2 size={14} /></button>
                    {deleteId === request.id && <div className="nxs-confirm" style={{ gridColumn: '1 / -1', width: '100%' }}>
                      <p>Remove this local request and its saved images?</p>
                      <div className="nxs-confirm-actions"><button type="button" className="nxs-button danger" onClick={() => void removeRequest(request)}>Remove</button><button type="button" className="nxs-button secondary" onClick={() => setDeleteId(null)}>Keep</button></div>
                    </div>}
                  </div>
                ))}
              </div>
            ) : <div className="nxs-empty"><div><FileImage size={22} aria-hidden="true" /><strong>No custom requests yet. Tell us which component you are looking for.</strong><button className="nxs-button" type="button" onClick={() => { partNameRef.current?.focus(); formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Create a request <ArrowRight size={14} /></button></div></div>}
            {selected && (
              <section className="nxs-panel nxs-panel-pad" aria-label="Selected request detail" style={{ marginTop: 14, padding: 14 }}>
                <div className="nxs-panel-title"><div><div className="nxs-kicker">REQUEST RECORD</div><h3>{selected.partName}</h3></div><button className="nxs-icon-button" type="button" onClick={() => setSelectedId(null)} aria-label="Close request detail"><X size={14} /></button></div>
                <span className="nxs-status">{selected.status}</span>
                <p className="nxs-subtle">{selected.id} · {dateLabel(selected.createdAt)}<br />{selected.category} · Quantity {selected.quantity}<br />{selected.brand} {selected.model}</p>
                <div className="nxs-demo-note"><FileImage size={15} aria-hidden="true" /><span>{requestNotice}</span></div>
                {selected.budget !== null && <p className="nxs-subtle">Indicative budget: {inr(selected.budget)}</p>}
                {!!selected.description && <p className="nxs-subtle">{selected.description}</p>}
                {selected.referenceUrl && <p><a href={selected.referenceUrl} target="_blank" rel="noreferrer" className="nxs-link-button">Open reference link</a></p>}
                {!!selected.notes && <p className="nxs-subtle">Notes: {selected.notes}</p>}
                {!!detailImages.length && <div className="nxs-file-list">{detailImages.map((url, index) => <div className="nxs-file-preview" key={`${selected.id}-${index}`}><img src={url} alt={`Saved reference image ${index + 1}`} /></div>)}</div>}
                {selected.imageIds.length > 0 && detailImages.length === 0 && <p className="nxs-subtle">Saved reference images are unavailable in this browser session.</p>}
                <button className="nxs-button secondary" type="button" style={{ marginTop: 14 }} onClick={createAnotherRequest}><Plus size={14} /> Create another request</button>
              </section>
            )}
          </aside>
        </div>
        <p className="nxs-subtle" style={{ marginTop: 16 }}>Local record only. No request is sent or fulfilled by NEXUS PC LAB.</p>
      </div>
    </main>
  );
}
