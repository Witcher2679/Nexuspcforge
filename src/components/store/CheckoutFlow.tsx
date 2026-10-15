import { useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShieldAlert } from 'lucide-react';
import { storeProducts, type StoreProduct } from '@/data/storeCatalog';
import {
  makeOrder, saveOrder, validateCustomer, type CustomerDetails, type DemoCartLine, type DemoOrder,
} from '@/lib/demoStore';
import { HardwareIllustration } from '@/components/HardwareIllustration';
import './store.css';

export type CheckoutFlowProps = {
  lines: DemoCartLine[];
  buildOrder?: boolean;
  compatibilityNotes?: string[];
  onBack: () => void;
  onOrderCreated: (order: DemoOrder) => void;
};

type CheckoutStep = 'details' | 'review';
const confirmationNotice = 'This is a demonstration order created for the NEXUS PC FORGE student project. No real purchase, payment, retailer contact, shipment, or delivery has been initiated.';
const blankCustomer: CustomerDetails = {
  fullName: '', phone: '', address1: '', address2: '', landmark: '',
  city: '', state: '', pinCode: '', email: '', notes: '',
};
const inr = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
const displayDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

function ProductArt({ product, alt = product.imageAlt }: { product: StoreProduct; alt?: string }) {
  const [failed, setFailed] = useState(false);
  return product.imageUrl && !failed
    ? <img src={product.imageUrl} alt={alt} onError={() => setFailed(true)} />
    : <HardwareIllustration category={product.category} name={product.name} />;
}

export function CheckoutFlow({ lines, buildOrder = false, compatibilityNotes = [], onBack, onOrderCreated }: CheckoutFlowProps) {
  const [customer, setCustomer] = useState<CustomerDetails>(blankCustomer);
  const [submittedErrors, setSubmittedErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});
  const [formError, setFormError] = useState('');
  const [step, setStep] = useState<CheckoutStep>('details');
  const [saving, setSaving] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<DemoOrder | null>(null);
  const submissionLock = useRef(false);
  const [orderLines, setOrderLines] = useState<DemoCartLine[]>(() => lines.map((line) => ({ ...line })));
  const products = useMemo(() => orderLines.map((line) => ({
    line, product: storeProducts.find((item) => item.id === line.productId),
  })), [orderLines]);
  const available = products.length > 0 && products.every(({ line, product }) => !!product && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= product.demoStock);
  const total = products.reduce((sum, { line, product }) => sum + (product?.price ?? 0) * line.quantity, 0);

  function setField(field: keyof CustomerDetails, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
    setSubmittedErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  }

  function changeQuantity(productId: string, amount: number) {
    const product = storeProducts.find((item) => item.id === productId);
    if (!product) return;
    setOrderLines((current) => current.map((line) => line.productId === productId
      ? { ...line, quantity: Math.max(1, Math.min(product.demoStock, line.quantity + amount)) }
      : line));
  }

  function reviewDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateCustomer(customer);
    setSubmittedErrors(errors);
    setFormError('');
    if (Object.keys(errors).length) {
      document.getElementById(`checkout-${Object.keys(errors)[0]}`)?.focus();
      return;
    }
    if (!available) {
      setFormError('This order is empty or a quantity exceeds the available demo stock. Go back and check the selected items.');
      return;
    }
    setStep('review');
  }

  function placeDemoOrder() {
    if (submissionLock.current || saving || placedOrder) return;
    submissionLock.current = true;
    setSaving(true);
    setFormError('');
    const errors = validateCustomer(customer);
    setSubmittedErrors(errors);
    if (Object.keys(errors).length || !available) {
      setFormError(Object.keys(errors).length
        ? 'Review the customer details and correct the marked fields before placing this demo order.'
        : 'This order is empty or exceeds the current demo stock. Return to the order details and review the items.');
      setSaving(false);
      submissionLock.current = false;
      if (Object.keys(errors).length) setStep('details');
      return;
    }
    let order: DemoOrder | null = null;
    try {
      order = makeOrder(orderLines, storeProducts, customer, buildOrder, compatibilityNotes);
      if (!order) {
        setFormError('This demo order could not be prepared. Check the selected quantities and try again.');
        setSaving(false);
        submissionLock.current = false;
        return;
      }
      saveOrder(order);
    } catch {
      setFormError('Local browser storage could not save this demo order. Check browser storage permissions and try again.');
      setSaving(false);
      submissionLock.current = false;
      return;
    }
    setPlacedOrder(order);
    setSaving(false);
    onOrderCreated(order);
  }

  const error = (field: keyof CustomerDetails) => submittedErrors[field] && <span className="nxs-error" id={`checkout-${field}-error`}>{submittedErrors[field]}</span>;
  const field = (name: keyof CustomerDetails, label: string, options: { required?: boolean; type?: string; wide?: boolean; autoComplete?: string } = {}) => (
    <div className={`nxs-form-field${options.wide ? ' span-2' : ''}`}>
      <label htmlFor={`checkout-${name}`}>{label}{options.required && <span aria-hidden="true"> *</span>}</label>
      <input
        className="nxs-field" id={`checkout-${name}`} name={name} type={options.type ?? 'text'}
        autoComplete={options.autoComplete} required={options.required}
        value={customer[name]} onChange={(event) => setField(name, event.target.value)}
        aria-invalid={!!submittedErrors[name]} aria-describedby={submittedErrors[name] ? `checkout-${name}-error` : undefined}
      />
      {error(name)}
    </div>
  );
  const itemLines = (showQuantityControls = false) => (
    <div className="nxs-lines">
      {products.map(({ line, product }) => product && (
        <article className="nxs-line" key={product.id}>
          <div className="nxs-line-art"><ProductArt product={product} /></div>
          <div>
            <h3>{product.name}</h3><p>{product.brand} · {product.model}</p><p>{product.specs}</p>
            {showQuantityControls ? (
              <div className="nxs-quantity" aria-label={`Quantity for ${product.name}`}>
                <button type="button" disabled={line.quantity <= 1} aria-label={`Decrease ${product.name} quantity`} onClick={() => changeQuantity(product.id, -1)}><Minus size={12} /></button>
                <output aria-label="Quantity">{line.quantity}</output>
                <button type="button" disabled={line.quantity >= product.demoStock} aria-label={`Increase ${product.name} quantity`} onClick={() => changeQuantity(product.id, 1)}><Plus size={12} /></button>
                <span className="nxs-subtle">× {inr(product.price)} each</span>
              </div>
            ) : <p>Quantity {line.quantity} · {inr(product.price)} each</p>}
          </div>
          <div className="nxs-line-total">{inr(product.price * line.quantity)}</div>
        </article>
      ))}
    </div>
  );
  const customerAddress = [
    customer.address1, customer.address2, customer.landmark,
    customer.city, customer.state, customer.pinCode,
  ].filter(Boolean).join(', ');

  if (placedOrder) {
    return (
      <section className="nxs-store" aria-labelledby="checkout-done-title">
        <div className="nxs-wrap">
          <div className="nxs-checkout-confirm">
            <div className="nxs-confirm-mark"><Check size={22} aria-hidden="true" /></div>
            <div className="nxs-kicker">LOCAL DEMO ORDER SAVED</div>
            <h1 id="checkout-done-title">Order record created.</h1>
            <div className="nxs-confirm-meta">
              <div><span>Order ID</span><strong className="nxs-order-id">{placedOrder.id}</strong></div>
              <div><span>Date and time</span><strong>{displayDate(placedOrder.createdAt)}</strong></div>
              <div><span>Status</span><strong className="nxs-status">{placedOrder.status}</strong></div>
            </div>
            <div className="nxs-demo-note"><ShieldAlert size={17} aria-hidden="true" /><span>{confirmationNotice}</span></div>
            <h2 className="nxs-review-section-title">Order items</h2>
            <div className="nxs-lines">
              {placedOrder.lines.map((line, index) => {
                const product = storeProducts.find((item) => item.id === line.productId);
                return <article className="nxs-line" key={`${line.productId}-${index}`}>
                  <div className="nxs-line-art">{product ? <ProductArt product={product} alt={line.imageAlt} /> : <HardwareIllustration category={line.category} name={line.name} />}</div>
                  <div><h3>{line.name}</h3><p>{line.brand} · {line.model}</p><p>{line.specs}</p><p>Quantity {line.quantity} · {inr(line.unitPrice)} each</p></div>
                  <div className="nxs-line-total">{inr(line.unitPrice * line.quantity)}</div>
                </article>;
              })}
            </div>
            <div className="nxs-total-row"><span>Indicative estimated total</span><strong>{inr(placedOrder.total)}</strong></div>
            <button className="nxs-button secondary" type="button" onClick={onBack}><ArrowLeft size={14} /> Return to shop</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="nxs-store" aria-labelledby="checkout-title">
      <div className="nxs-wrap">
        <header className="nxs-heading">
          <div><div className="nxs-kicker">DEMO CHECKOUT / {step === 'details' ? 'STEP 01 OF 02' : 'STEP 02 OF 02'}</div><h1 id="checkout-title">{step === 'details' ? 'Enter fictional test details.' : 'Review before you record.'}</h1><p>{step === 'details' ? 'Use made-up contact details for this student-project exercise. This information stays in this browser.' : 'Check the saved contact details and every item before creating a local demo order record.'}</p></div>
          <button className="nxs-button secondary" type="button" onClick={onBack}><ArrowLeft size={14} /> Back to cart</button>
        </header>
        <div className="nxs-checkout-steps" aria-label={`Checkout step ${step === 'details' ? '1' : '2'} of 2`}>
          <span className={step === 'details' ? 'current' : 'complete'}><b>01</b> Customer details</span><span className={step === 'review' ? 'current' : ''}><b>02</b> Review order</span>
        </div>
        <div className="nxs-demo-note"><ShieldAlert size={16} aria-hidden="true" /><span><strong>Fictional test details only.</strong> Please do not enter sensitive or real-world personal information. Do not enter passwords, payment details, OTPs, or identity numbers.</span></div>
        {step === 'details' ? (
          <div className="nxs-layout">
            <section className="nxs-panel nxs-panel-pad" aria-labelledby="customer-details-title">
              <div className="nxs-panel-title"><h2 id="customer-details-title">Customer details</h2><span className="nxs-subtle">Required fields marked *</span></div>
              <form onSubmit={reviewDetails} noValidate>
                <div className="nxs-form">
                  {field('fullName', 'Full name', { required: true, autoComplete: 'name' })}
                  {field('phone', 'Indian mobile number', { required: true, type: 'tel', autoComplete: 'tel' })}
                  {field('email', 'Email (optional)', { type: 'email', autoComplete: 'email' })}
                  {field('pinCode', 'Six-digit PIN code', { required: true, autoComplete: 'postal-code' })}
                  {field('address1', 'Address line 1', { required: true, wide: true, autoComplete: 'address-line1' })}
                  {field('address2', 'Address line 2 (optional)', { wide: true, autoComplete: 'address-line2' })}
                  {field('landmark', 'Landmark (optional)')}
                  {field('city', 'City', { required: true, autoComplete: 'address-level2' })}
                  {field('state', 'State', { required: true, autoComplete: 'address-level1' })}
                  <div className="nxs-form-field span-2"><label htmlFor="checkout-notes">Order notes (optional)</label><textarea className="nxs-textarea" id="checkout-notes" value={customer.notes} onChange={(event) => setField('notes', event.target.value)} /></div>
                </div>
                <p className="nxs-feedback" role="alert">{formError}</p>
                <button className="nxs-button" type="submit" disabled={!available}>Review order <ArrowRight size={14} /></button>
              </form>
            </section>
            <aside className="nxs-panel nxs-panel-pad">
              <div className="nxs-panel-title"><h2>Selected items</h2><span className="nxs-subtle">{buildOrder ? 'Builder selection' : 'Demo cart'}</span></div>
              {available ? itemLines(true) : <div className="nxs-empty"><div><strong>No valid order items</strong><span>Return to the cart or builder and select available demo stock.</span></div></div>}
              <div className="nxs-total-row"><span>Indicative subtotal</span><strong>{inr(total)}</strong></div>
              {!available && <p className="nxs-error" role="alert">One or more lines are empty or exceed this catalogue's demo stock.</p>}
            </aside>
          </div>
        ) : (
          <div className="nxs-layout">
            <section className="nxs-panel nxs-panel-pad" aria-labelledby="review-title">
              <div className="nxs-panel-title"><h2 id="review-title">Order review</h2><span className="nxs-subtle">No payment step</span></div>
              <section className="nxs-review-customer" aria-labelledby="review-customer-title">
                <div className="nxs-panel-title"><h3 id="review-customer-title">Customer details</h3><button className="nxs-link-button" type="button" onClick={() => setStep('details')}>Edit details</button></div>
                <p><strong>{customer.fullName}</strong><br />{customer.phone}{customer.email && <><br />{customer.email}</>}<br />{customerAddress}</p>
                {customer.notes && <p><span className="nxs-subtle">Order notes:</span> {customer.notes}</p>}
              </section>
              <h3 className="nxs-review-section-title">Selected products</h3>
              {available ? itemLines() : <p className="nxs-error" role="alert">The selected items exceed demo stock. Return to the order details and correct quantities.</p>}
              {buildOrder && compatibilityNotes.length > 0 && <div className="nxs-warning-box"><strong>Builder compatibility notes</strong><ul>{compatibilityNotes.map((note, index) => <li key={`${note}-${index}`}>{note}</li>)}</ul></div>}
              <div className="nxs-total-row"><span>Estimated demo total</span><strong>{inr(total)}</strong></div>
              <p className="nxs-feedback" role="alert">{formError}</p>
              <div className="nxs-review-actions">
                <button className="nxs-button secondary" type="button" onClick={() => setStep('details')}><ArrowLeft size={14} /> Edit order</button>
                <button className="nxs-button" type="button" disabled={!available || saving} onClick={placeDemoOrder}>{saving ? 'Saving order…' : 'Place demo order'} <Check size={14} /></button>
              </div>
            </section>
            <aside className="nxs-panel nxs-panel-pad nxs-order-detail"><div className="nxs-panel-title"><h2>Totals at a glance</h2></div>
              <div className="nxs-summary-breakdown"><span>Items</span><strong>{orderLines.reduce((sum, line) => sum + line.quantity, 0)}</strong></div>
              <div className="nxs-summary-breakdown"><span>Catalogue subtotal</span><strong>{inr(total)}</strong></div>
              <div className="nxs-total-row"><span>Estimated total</span><strong>{inr(total)}</strong></div>
              <p className="nxs-subtle">This is an indicative catalogue total only; no taxes, shipping, or live availability are included.</p>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
