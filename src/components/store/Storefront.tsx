import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Search, ShoppingBag, Trash2, TriangleAlert, X } from 'lucide-react';
import { storeCategories, storeProducts, type StoreProduct } from '@/data/storeCatalog';
import type { DemoCartLine } from '@/lib/demoStore';
import { HardwareIllustration } from '@/components/HardwareIllustration';
import './store.css';

export type StorefrontProps = {
  cartLines: DemoCartLine[];
  onCartChange: (lines: DemoCartLine[]) => void;
  onCheckout: (lines: DemoCartLine[], source: 'cart' | 'product') => void;
  onViewCart: () => void;
  onContinueShopping: () => void;
  onRequestPart: () => void;
  mode?: 'shop' | 'cart';
};

type SortMode = 'price-low' | 'price-high' | 'alphabetical';
const inr = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

function ProductArt({ product, className = '' }: { product: StoreProduct; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (product.imageUrl && !failed) {
    return <img className={className} src={product.imageUrl} alt={product.imageAlt} onError={() => setFailed(true)} />;
  }
  return <HardwareIllustration category={product.category} name={product.name} className={className} />;
}

export function Storefront({
  cartLines, onCartChange, onCheckout, onViewCart, onContinueShopping, onRequestPart, mode = 'shop',
}: StorefrontProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof storeCategories)[number]['id']>('all');
  const [sort, setSort] = useState<SortMode>('price-low');
  const [feedback, setFeedback] = useState('');
  const [detail, setDetail] = useState<StoreProduct | null>(null);
  const closeDetailRef = useRef<HTMLButtonElement>(null);
  const productsInCart = useMemo(() => cartLines.flatMap((line) => {
    const product = storeProducts.find((item) => item.id === line.productId);
    return product ? [{ line, product }] : [];
  }), [cartLines]);
  const cartCount = productsInCart.reduce((sum, item) => sum + item.line.quantity, 0);
  const cartTotal = productsInCart.reduce((sum, item) => sum + item.product.price * item.line.quantity, 0);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const result = storeProducts.filter((product) => {
      const categoryMatch = category === 'all' || product.category === category;
      const textMatch = !normalized || `${product.name} ${product.brand} ${product.model} ${product.specs} ${product.category}`.toLocaleLowerCase().includes(normalized);
      return categoryMatch && textMatch;
    });
    return result.sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price || a.name.localeCompare(b.name);
      if (sort === 'price-high') return b.price - a.price || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }, [category, query, sort]);

  useEffect(() => {
    if (!detail) return undefined;
    closeDetailRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDetail(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [detail]);

  function addProduct(product: StoreProduct) {
    const existing = cartLines.find((line) => line.productId === product.id);
    if (product.demoStock < 1) {
      setFeedback(`${product.name} has no demo stock remaining.`);
      return;
    }
    if (existing && existing.quantity >= product.demoStock) {
      setFeedback(`Demo stock limit reached for ${product.name}.`);
      return;
    }
    onCartChange(existing
      ? cartLines.map((line) => line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line)
      : [...cartLines, { productId: product.id, quantity: 1 }]);
    setFeedback(`${product.name} added to your demo cart.`);
  }

  function changeQuantity(productId: string, amount: number) {
    const product = storeProducts.find((item) => item.id === productId);
    const line = cartLines.find((item) => item.productId === productId);
    if (!product || !line) return;
    const quantity = Math.max(1, Math.min(product.demoStock, line.quantity + amount));
    onCartChange(cartLines.map((item) => item.productId === productId ? { ...item, quantity } : item));
  }

  function removeProduct(productId: string) {
    onCartChange(cartLines.filter((line) => line.productId !== productId));
  }

  if (mode === 'cart') {
    return (
      <section className="nxs-store" aria-labelledby="nxs-cart-title">
        <div className="nxs-wrap">
          <header className="nxs-heading">
            <div><div className="nxs-kicker">NEXUS PC LAB / DEMO CART</div><h1 id="nxs-cart-title">Review your selected parts.</h1><p>Adjust quantities within the catalogue’s demo stock, or remove a line. Your subtotal is an indicative example only.</p></div>
            <button className="nxs-button secondary" type="button" onClick={onContinueShopping}><ArrowLeft size={14} /> Continue shopping</button>
          </header>
          <div className="nxs-demo-note"><TriangleAlert size={16} aria-hidden="true" /><span><strong>Fictional order exercise.</strong> The cart is stored and managed by this demo interface only; no seller or payment service is involved.</span></div>
          {!productsInCart.length ? (
            <div className="nxs-empty"><div><ShoppingBag size={23} aria-hidden="true" /><strong>Your demo cart is empty</strong><span>Continue to the shop to add hardware and compare the reference prices.</span><button className="nxs-button" type="button" onClick={onContinueShopping}>Browse hardware</button></div></div>
          ) : (
            <div className="nxs-layout">
              <section className="nxs-panel nxs-panel-pad" aria-label="Cart line items">
                <div className="nxs-panel-title"><h2>{cartCount} {cartCount === 1 ? 'item' : 'items'}</h2><span className="nxs-subtle">Demo stock enforced</span></div>
                <div className="nxs-lines">
                  {productsInCart.map(({ line, product }) => (
                    <article className="nxs-line nxs-cart-line" key={product.id}>
                      <div className="nxs-line-art"><ProductArt product={product} /></div>
                      <div className="nxs-cart-line-info">
                        <div className="nxs-product-meta"><span>{product.category}</span><span>{product.brand} · {product.model}</span></div>
                        <h3>{product.name}</h3>
                        <p>{product.specs}</p>
                        <div className="nxs-cart-line-controls">
                          <div className="nxs-quantity" aria-label={`Quantity for ${product.name}`}>
                            <button type="button" onClick={() => changeQuantity(product.id, -1)} disabled={line.quantity <= 1} aria-label={`Decrease ${product.name} quantity`}><Minus size={12} /></button>
                            <output aria-label="Quantity">{line.quantity}</output>
                            <button type="button" onClick={() => changeQuantity(product.id, 1)} disabled={line.quantity >= product.demoStock} aria-label={`Increase ${product.name} quantity`}><Plus size={12} /></button>
                            <span className="nxs-subtle">of {product.demoStock} demo units</span>
                          </div>
                          <button type="button" className="nxs-link-button nxs-remove-line" onClick={() => removeProduct(product.id)}><Trash2 size={13} /> Remove</button>
                        </div>
                      </div>
                      <div className="nxs-line-total"><span>{inr(product.price)} each</span><strong>{inr(product.price * line.quantity)}</strong></div>
                    </article>
                  ))}
                </div>
              </section>
              <aside className="nxs-panel nxs-panel-pad nxs-cart-summary" aria-labelledby="cart-summary-title">
                <div className="nxs-panel-title"><h2 id="cart-summary-title">Cart total</h2><ShoppingBag size={16} aria-hidden="true" /></div>
                <div className="nxs-total-row"><span>Catalogue subtotal</span><strong>{inr(cartTotal)}</strong></div>
                <p className="nxs-subtle">Estimated total uses catalogue example pricing. Taxes, shipping, and live availability are not included or calculated.</p>
                <button className="nxs-button nxs-full-button" type="button" onClick={() => onCheckout(cartLines, 'cart')}>Continue to checkout <ArrowRight size={14} /></button>
                <button className="nxs-button secondary nxs-full-button" type="button" onClick={onContinueShopping}>Continue shopping</button>
              </aside>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="nxs-store" aria-labelledby="nxs-shop-title">
      <div className="nxs-wrap">
        <header className="nxs-heading">
          <div>
            <div className="nxs-kicker">NEXUS PC LAB / COMPONENT SHOP</div>
            <h1 id="nxs-shop-title">Compare the parts. Learn as you go.</h1>
            <p>Explore the same component catalogue used by the builder. Prices and stock are examples for this learning demo, not a retailer offer.</p>
          </div>
          <button className="nxs-button secondary" type="button" onClick={onRequestPart}>Request a specific part</button>
        </header>
        <div className="nxs-demo-note" role="note"><TriangleAlert size={16} aria-hidden="true" /><span><strong>Demo catalogue only.</strong> Prices and stock are demonstration data and may not represent actual market availability. No seller, payment, shipping, or live stock connection exists.</span></div>
        <div className="nxs-toolbar">
          <label className="nxs-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Search catalogue</span>
            <input className="nxs-field" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search model, brand, or specification" />
          </label>
          <label className="nxs-sort-label"><span>Sort</span>
            <select className="nxs-select" value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
              <option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="alphabetical">Alphabetical</option>
            </select>
          </label>
          <span className="nxs-subtle">{filtered.length} catalogue {filtered.length === 1 ? 'item' : 'items'}</span>
        </div>
        <div className="nxs-categories" role="group" aria-label="Filter by category">
          {storeCategories.map((item) => <button key={item.id} className="nxs-category" type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}
        </div>
        <p className="nxs-feedback" role="status" aria-live="polite">{feedback}</p>
        {filtered.length ? (
          <div className="nxs-products">
            {filtered.map((product) => {
              const quantity = cartLines.find((line) => line.productId === product.id)?.quantity ?? 0;
              const full = quantity >= product.demoStock;
              return (
                <article className="nxs-product" key={product.id}>
                  <button className="nxs-product-art nxs-product-art-button" type="button" onClick={() => setDetail(product)} aria-label={`View details for ${product.name}`}><ProductArt product={product} /></button>
                  <div className="nxs-product-body">
                    <div className="nxs-product-meta"><span>{product.category}</span><span>{product.brand}</span></div>
                    <h2>{product.name}</h2>
                    <div className="nxs-product-model">{product.model}</div>
                    <p className="nxs-product-specs">{product.specs}</p>
                    <div className="nxs-product-foot">
                      <div><div className="nxs-price">{inr(product.price)}</div><div className={`nxs-stock${product.demoStock <= 4 ? ' low' : ''}`}>{product.demoStock} demo units · {quantity ? `${quantity} in cart` : 'reference stock'}</div></div>
                      <div className="nxs-product-actions">
                        <button className="nxs-link-button" type="button" onClick={() => setDetail(product)}>View details</button>
                        <button className="nxs-button secondary" type="button" disabled={product.demoStock < 1 || full} onClick={() => addProduct(product)}>{full ? 'Stock limit' : 'Add to cart'}</button>
                        <button className="nxs-button" type="button" disabled={product.demoStock < 1} onClick={() => onCheckout([{ productId: product.id, quantity: 1 }], 'product')}>Order now <ArrowRight size={13} /></button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <div className="nxs-empty"><div><Search size={22} aria-hidden="true" /><strong>No matching components</strong><span>Try a different term or switch to all hardware.</span></div></div>}
        <aside className="nxs-cart-bar" aria-label="Cart summary">
          <div><strong><ShoppingBag size={15} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 7 }} />Your demo cart · {cartCount} {cartCount === 1 ? 'item' : 'items'}</strong><span>{cartCount ? `${inr(cartTotal)} indicative subtotal` : 'Choose catalogue parts to begin.'}</span></div>
          <button className="nxs-button" type="button" onClick={onViewCart}>View cart <ArrowRight size={14} /></button>
        </aside>
      </div>
      {detail && (
        <div className="nxs-detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null); }}>
          <section className="nxs-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="nxs-detail-title">
            <div className="nxs-panel-title"><div><div className="nxs-kicker">COMPONENT DETAILS / {detail.category}</div><h2 id="nxs-detail-title">{detail.name}</h2></div><button ref={closeDetailRef} type="button" className="nxs-icon-button" onClick={() => setDetail(null)} aria-label="Close product details"><X size={16} /></button></div>
            <div className="nxs-detail-content">
              <div className="nxs-detail-art"><ProductArt product={detail} /></div>
              <div>
                <p className="nxs-product-model">{detail.brand} · {detail.model}</p>
                <p className="nxs-product-specs">{detail.specs}</p>
                <div className="nxs-price">{inr(detail.price)}</div>
                <p className={`nxs-stock${detail.demoStock <= 4 ? ' low' : ''}`}>{detail.demoStock} demo units shown</p>
                <div className="nxs-demo-note"><TriangleAlert size={15} aria-hidden="true" /><span>Reference details and price only. Confirm exact revisions, compatibility, and current retailer information before any real-world purchase.</span></div>
                <div className="nxs-detail-actions">
                  <button className="nxs-button secondary" type="button" onClick={() => { addProduct(detail); setDetail(null); }} disabled={detail.demoStock < 1 || (cartLines.find((line) => line.productId === detail.id)?.quantity ?? 0) >= detail.demoStock}><Plus size={14} /> Add to cart</button>
                  <button className="nxs-button" type="button" onClick={() => onCheckout([{ productId: detail.id, quantity: 1 }], 'product')} disabled={detail.demoStock < 1}>Order now <ArrowRight size={14} /></button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
