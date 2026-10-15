import { useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, ClipboardList, Trash2, X } from 'lucide-react';
import type { DemoOrder, SavedOrderLine } from '@/lib/demoStore';
import { HardwareIllustration } from '@/components/HardwareIllustration';
import './store.css';

export type MyOrdersProps = {
  orders: DemoOrder[];
  onClearOrders: () => void;
  onGoShop: () => void;
};

const inr = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
const displayDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

function OrderLineArt({ line }: { line: SavedOrderLine }) {
  const [failed, setFailed] = useState(false);
  return line.imageUrl && !failed
    ? <img src={line.imageUrl} alt={line.imageAlt} onError={() => setFailed(true)} />
    : <HardwareIllustration category={line.category} name={line.name} />;
}

export function MyOrders({ orders, onClearOrders, onGoShop }: MyOrdersProps) {
  const [selectedId, setSelectedId] = useState<string | null>(() => orders[0]?.id ?? null);
  const [dismissed, setDismissed] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const selected = useMemo(() => (
    orders.find((order) => order.id === selectedId) ?? (!dismissed ? orders[0] ?? null : null)
  ), [orders, selectedId, dismissed]);

  function clearOrders() {
    onClearOrders();
    setConfirmClear(false);
    setSelectedId(null);
    setDismissed(true);
  }

  return (
    <section className="nxs-store" aria-labelledby="orders-title">
      <div className="nxs-wrap">
        <header className="nxs-heading">
          <div><div className="nxs-kicker">LOCAL RECORDS / MY ORDERS</div><h1 id="orders-title">Your demo order history.</h1><p>Saved orders stay in this browser. They are learning records, not retailer orders.</p></div>
          {orders.length > 0 && <button className="nxs-button danger" type="button" onClick={() => setConfirmClear((open) => !open)}><Trash2 size={14} /> Clear demo orders</button>}
        </header>
        <div className="nxs-demo-note"><ClipboardList size={16} aria-hidden="true" /><span>These records are stored locally on this device. Clearing them permanently removes the local demo history; no real order is cancelled.</span></div>
        {confirmClear && (
          <section className="nxs-confirm" aria-labelledby="clear-orders-title">
            <p id="clear-orders-title"><strong>Clear all demo order records?</strong> This permanently removes the locally stored demo order history from this browser. This cannot be undone.</p>
            <div className="nxs-confirm-actions">
              <button className="nxs-button danger" type="button" onClick={clearOrders}>Clear demo orders</button>
              <button className="nxs-button secondary" type="button" onClick={() => setConfirmClear(false)}>Keep history</button>
            </div>
          </section>
        )}

        {!orders.length ? (
          <div className="nxs-empty"><div><ClipboardList size={24} aria-hidden="true" /><strong>No demo orders yet. Explore the hardware store and create your first demo order.</strong><button className="nxs-button" type="button" onClick={onGoShop}>Go to shop <ArrowRight size={14} /></button></div></div>
        ) : (
          <div className="nxs-layout">
            <section aria-label="Order history">
              <div className="nxs-order-grid">
                {orders.map((order) => (
                  <article className="nxs-order-card" key={order.id}>
                    <div className="nxs-order-card-top"><span className="nxs-order-id">{order.id}</span><span className="nxs-status">{order.status}</span></div>
                    <p>{displayDate(order.createdAt)}</p>
                    <div className="nxs-order-thumbnails" aria-label={`${order.lines.length} ordered products`}>
                      {order.lines.slice(0, 4).map((line, index) => <div className="nxs-order-thumb" key={`${line.productId}-${index}`}><OrderLineArt line={line} /></div>)}
                      {order.lines.length > 4 && <span className="nxs-thumb-count">+{order.lines.length - 4}</span>}
                    </div>
                    <p><strong>{order.lines.length} {order.lines.length === 1 ? 'line item' : 'line items'}</strong> · {inr(order.total)}</p>
                    <button className="nxs-button secondary nxs-view-details" type="button" aria-pressed={order.id === selected?.id} onClick={() => { setSelectedId(order.id); setDismissed(false); }}>View details <ChevronRight size={13} /></button>
                  </article>
                ))}
              </div>
            </section>
            {selected ? (
              <aside className="nxs-panel nxs-panel-pad nxs-order-detail" aria-labelledby="order-detail-title">
                <div className="nxs-panel-title"><div><div className="nxs-kicker">ORDER DETAIL</div><h2 id="order-detail-title" className="nxs-order-id">{selected.id}</h2></div><button type="button" className="nxs-icon-button" onClick={() => { setSelectedId(null); setDismissed(true); }} aria-label="Close order detail"><X size={15} /></button></div>
                <div className="nxs-subtle">{displayDate(selected.createdAt)}</div>
                <p><span className="nxs-status">{selected.status}</span>{selected.buildOrder && <span className="nxs-subtle"> · Started from PC Builder</span>}</p>
                <ul className="nxs-detail-list">
                  {selected.lines.map((line, index) => (
                    <li className="nxs-order-detail-line" key={`${line.productId}-${index}`}>
                      <div className="nxs-order-detail-thumb"><OrderLineArt line={line} /></div>
                      <span><strong>{line.name}</strong><br />{line.brand} · {line.model}<br />{line.specs}<br />{line.quantity} × {inr(line.unitPrice)}</span>
                      <strong>{inr(line.unitPrice * line.quantity)}</strong>
                    </li>
                  ))}
                </ul>
                <div className="nxs-total-row"><span>Indicative total</span><strong>{inr(selected.total)}</strong></div>
                <hr className="nxs-divider" />
                <h3 style={{ fontSize: 11 }}>Recorded contact</h3>
                <p className="nxs-subtle">{selected.customer.fullName}<br />{selected.customer.phone}<br />{selected.customer.email || 'No email provided'}<br />{[selected.customer.address1, selected.customer.address2, selected.customer.landmark, selected.customer.city, selected.customer.state, selected.customer.pinCode].filter(Boolean).join(', ')}</p>
                {selected.compatibilityNotes.length > 0 && <><h3 style={{ fontSize: 11 }}>Builder notes</h3><ul className="nxs-subtle">{selected.compatibilityNotes.map((note, index) => <li key={`${note}-${index}`}>{note}</li>)}</ul></>}
                <p className="nxs-subtle">No payment, order fulfilment, or seller contact was initiated.</p>
              </aside>
            ) : <aside className="nxs-empty"><div><strong>Select an order to inspect it</strong><span>Choose a saved record to see its line items and details.</span></div></aside>}
          </div>
        )}
      </div>
    </section>
  );
}
