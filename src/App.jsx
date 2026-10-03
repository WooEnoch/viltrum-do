'use client';

import { useCallback, useEffect, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ASSET, formatPrice, occasions, socialImages } from './data';

const EMPTY_CART = { items: [], count: 0, subtotal: 0 };

async function api(path, options) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Please try again.');
  return body;
}

function useRoute() {
  const getRoute = () => window.location.hash.replace(/^#\/?/, '') || 'home';
  const [route, setRoute] = useState('home');
  useEffect(() => {
    const update = () => { setRoute(getRoute()); window.scrollTo({ top: 0, behavior: 'instant' }); };
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return route;
}

function IconButton({ src, label, className = '', onClick, pressed }) {
  return (
    <button className={`icon-button ${className}`} type="button" aria-label={label} aria-pressed={pressed} onClick={onClick}>
      <img src={`${ASSET}${src}`} alt="" />
    </button>
  );
}

function Header({ user, cartCount, favoriteCount }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const submitSearch = (event) => {
    event.preventDefault();
    if (query.trim()) window.location.hash = `/shop?q=${encodeURIComponent(query.trim())}`;
    setSearchOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="utility-bar page-width">
        <div className="locale"><img src={`${ASSET}nigeria.svg`} alt="" /><span>Nigeria | English</span></div>
        <a className="wordmark" href="#/home" aria-label="Clothe home">CLOTHE</a>
        <div className="header-actions">
          <a className="sign-in" href={user ? '#/account' : '#/signin'}>
            {user?.image ? <img className="profile-image" src={user.image} alt="" referrerPolicy="no-referrer" /> : <img src={`${ASSET}user.svg`} alt="" />}
            <span>{user ? user.name.split(' ')[0] : 'Sign in'}</span>
          </a>
          <IconButton src="search-store.svg" label="Search" onClick={() => setSearchOpen((value) => !value)} />
          <a className="header-link-icon" href="#/favorites" aria-label={`View ${favoriteCount} saved items`}><img src={`${ASSET}heart.svg`} alt="" />{favoriteCount > 0 && <span>{favoriteCount}</span>}</a>
          <a className="header-link-icon" href="#/cart" aria-label={`Shopping bag with ${cartCount} items`}><img src={`${ASSET}bag.svg`} alt="" />{cartCount > 0 && <span>{cartCount}</span>}</a>
          <button className="menu-toggle" type="button" aria-label="Toggle menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><span /><span /></button>
        </div>
      </div>
      {searchOpen && (
        <form className="header-search page-width" onSubmit={submitSearch}>
          <img src={`${ASSET}search-store.svg`} alt="" />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the collection" aria-label="Search the collection" />
          <button type="submit">SEARCH</button>
        </form>
      )}
      <nav className={`main-nav${menuOpen ? ' open' : ''}`} aria-label="Main navigation">
        <a href="#/home" onClick={closeMenu}>Home</a>
        <a href="#/shop" onClick={closeMenu}>Shops</a>
        <a href="#/collections" onClick={closeMenu}>Collections</a>
        <a href="#/about" onClick={closeMenu}>About</a>
        <a href="#/contact" onClick={closeMenu}>Contacts</a>
      </nav>
    </header>
  );
}

function Footer() {
  const [newsletter, setNewsletter] = useState({ state: 'idle', message: '' });
  const subscribe = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setNewsletter({ state: 'loading', message: '' });
    try {
      const result = await api('/api/newsletter', { method: 'POST', body: JSON.stringify({ email: values.email, marketingConsent: values.marketingConsent === 'on' }) });
      form.reset();
      setNewsletter({ state: 'success', message: result.message });
    } catch (error) { setNewsletter({ state: 'error', message: error.message }); }
  };
  return (
    <footer className="site-footer">
      <div className="footer-top page-width">
        <div className="footer-brand">
          <div className="footer-logo">Nikkibee</div>
          <p>Where style meets your story.</p>
          <div className="social-icons"><a href="https://www.instagram.com/" aria-label="Instagram"><img src={`${ASSET}instagram.svg`} alt="" /></a><a href="https://www.tiktok.com/" aria-label="TikTok"><img src={`${ASSET}tiktok.svg`} alt="" /></a></div>
        </div>
        <div className="footer-links">
          <div><h3>SHOP</h3><a href="#/shop">All product</a><a href="#/shop?new=true">New Arrivals</a><a href="#/collections">Collections</a></div>
          <div><h3>ABOUT</h3><a href="#/about">Our story</a></div>
          <div><h3>HELP</h3><a href="#/faq">FAQs</a></div>
          <div><h3>CONTACT</h3><a href="mailto:nikkitim4190@gmail.com">nikkitim4190@gmail.com</a><p>Jos, Plateau State, Nigeria</p></div>
        </div>
        <form className="newsletter-form" onSubmit={subscribe}>
          <h3>STYLE NOTES</h3>
          <p>New pieces and NikkiBee stories, sent occasionally.</p>
          <label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label>
          <label className="consent-check"><input name="marketingConsent" type="checkbox" required /><span>I agree to receive NikkiBee style updates and marketing emails. I can unsubscribe at any time.</span></label>
          <button className="button secondary" type="submit" disabled={newsletter.state === 'loading'}>{newsletter.state === 'loading' ? 'JOINING…' : 'JOIN THE LIST'}</button>
          {newsletter.message && <p className={`form-message${newsletter.state === 'error' ? ' error' : ''}`}>{newsletter.message}</p>}
        </form>
      </div>
      <div className="copyright page-width">© 2026 NikkiBee. All rights reserved.</div>
    </footer>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      <div>{description && <p>{description}</p>}{action}</div>
    </div>
  );
}

function ProductCard({ product, favorite, onFavorite, onQuickAdd }) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [addingSize, setAddingSize] = useState('');

  const selectSize = async (size) => {
    setAddingSize(size);
    const added = await onQuickAdd(product.id, size);
    setAddingSize('');
    if (added) setQuickAddOpen(false);
  };

  return (
    <article className={`product-card${quickAddOpen ? ' quick-add-open' : ''}`}>
      <div className="product-image">
        <a href={`#/product/${product.id}`} aria-label={`View ${product.name}`}><img src={`${ASSET}${product.image}`} alt={product.name} /></a>
        {product.isNew && <span className="new-badge">NEW</span>}
        <IconButton src="heart-product.svg" label={favorite ? `Remove ${product.name} from saved items` : `Save ${product.name}`} className={`favorite${favorite ? ' active' : ''}`} pressed={favorite} onClick={() => onFavorite(product.id)} />
        {quickAddOpen ? (
          <div className="quick-size-picker" role="group" aria-label={`Choose a size for ${product.name}`}>
            <span>SELECT SIZE</span>
            <div className="size-options">
              {product.sizes.map((size) => <button type="button" key={size} onClick={() => selectSize(size)} disabled={Boolean(addingSize)}>{addingSize === size ? '…' : size}</button>)}
            </div>
          </div>
        ) : (
          <button className="quick-add" type="button" onClick={() => setQuickAddOpen(true)} disabled={!product.sizes.length}>{product.sizes.length ? 'QUICK ADD' : 'SOLD OUT'}</button>
        )}
      </div>
      <div className="product-meta"><div><a href={`#/product/${product.id}`}><h3>{product.name}</h3></a><strong>{formatPrice(product.price)}</strong></div><p>{product.color}</p></div>
    </article>
  );
}

function ProductGrid({ items, favorites, onFavorite, onQuickAdd, emptyMessage = 'No pieces found.' }) {
  if (!items.length) return <div className="empty-state"><p>{emptyMessage}</p><a className="button primary" href="#/shop">SHOP COLLECTION</a></div>;
  return <div className="product-grid">{items.map((product) => <ProductCard key={product.id} product={product} favorite={favorites.includes(product.id)} onFavorite={onFavorite} onQuickAdd={onQuickAdd} />)}</div>;
}

function CollectionFeature() {
  return (
    <section className="collection-section page-width">
      <div className="collection-copy">
        <p className="eyebrow">NEW COLLECTION</p><h2>Sunrise Collection</h2>
        <p>Inspired by the soft hues of dawn and the energy of a new day, our Sunrise Collection brings warmth, light, and optimism to your wardrobe. Think flowing fabrics, gentle pastels, and bold accents that transition seamlessly from morning coffee to evening plans.</p>
        <p>Each piece is designed to mix, match and create your own look, own your day.</p>
        <a className="text-link" href="#/shop?collection=sunrise">EXPLORE COLLECTION <img src={`${ASSET}arrow-right.svg`} alt="" /></a>
      </div>
      <div className="collection-gallery"><img src={`${ASSET}sunrise-one.png`} alt="Cream floral outfit" /><img src={`${ASSET}sunrise-two.png`} alt="Green floral outfit" /><img src={`${ASSET}sunrise-three.png`} alt="Blue summer outfit" /></div>
    </section>
  );
}

function HomePage({ products, favorites, onFavorite, onQuickAdd }) {
  return <>
    <section className="hero page-width">
      <div className="hero-copy"><img className="accent-line" src={`${ASSET}accent-line.svg`} alt="" /><h1>Where <span>Style</span> Meets Your Story</h1><p>Welcome to NikkiBee Stores a curated collection of timeless pieces designed for the modern individual who dares to express themselves. Every garment is crafted with care, blending bold creativity with everyday comfort.</p><div className="hero-actions"><a className="button primary" href="#/shop">Shop Collection</a><a className="button secondary" href="#/about">Our Story</a></div></div>
      <div className="hero-collage" aria-label="NikkiBee fashion collection preview"><figure className="hero-card hero-card-left"><img src={`${ASSET}hero-left.png`} alt="Black chain sandals styled on foot" /></figure><figure className="hero-card hero-card-center"><img src={`${ASSET}hero-center.png`} alt="Two vibrant patterned dresses" /></figure><figure className="hero-card hero-card-right"><img src={`${ASSET}hero-right.png`} alt="Brown leather handbag" /></figure></div>
    </section>
    <CollectionFeature />
    <section className="product-section page-width"><PageHeading title="New Arrivals" description="Discover the latest pieces designed to move with you." action={<a className="text-link compact" href="#/shop">See all</a>} /><ProductGrid items={products.slice(0, 4)} favorites={favorites} onFavorite={onFavorite} onQuickAdd={onQuickAdd} /></section>
    <OccasionSection />
    <SocialSection />
  </>;
}

function OccasionSection() {
  return <section className="occasion-section page-width"><div className="occasion-intro"><p className="eyebrow">STYLE FOR EVERY MOMENT</p><h2>Different occasions,<br />different outfits.</h2><p>Different occasions require different outfits, so we are here to style you.</p></div><div className="occasion-grid">{occasions.map((occasion) => <article className="occasion-card" key={occasion.name}><img src={`${ASSET}${occasion.image}`} alt={`${occasion.name} style`} /><div><h3>{occasion.name}</h3><a href={`#/shop?category=${occasion.category}`}>SHOP NOW</a></div><p>{occasion.description}</p></article>)}</div></section>;
}

function SocialSection() {
  return <section className="social-section"><div className="social-copy"><h2>Follow the NikkiBee Style</h2><p>Discover new looks, styling inspiration and what&apos;s happening at NikkiBee.</p></div><div className="social-grid">{socialImages.map((image, index) => <img src={`${ASSET}${image}`} alt={`NikkiBee style inspiration ${index + 1}`} key={image} />)}</div><a className="button secondary" href="https://www.instagram.com/" target="_blank" rel="noreferrer">FOLLOW US</a></section>;
}

function ShopPage({ route, products, favorites, onFavorite, onQuickAdd }) {
  const params = new URLSearchParams(route.split('?')[1] || '');
  const initialQuery = params.get('q') || '';
  const initialCategory = params.get('category') || 'All';
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const categories = ['All', ...new Set(products.map((product) => product.category))];
  const visible = products.filter((product) => {
    const matchesCategory = category === 'All' || product.category === category;
    const search = query.trim().toLowerCase();
    return matchesCategory && (!search || `${product.name} ${product.color} ${product.category}`.toLowerCase().includes(search));
  });

  return <section className="catalog-page page-width"><PageHeading eyebrow="SHOP" title="All Products" description="Thoughtful pieces for every version of your day." /><div className="catalog-tools"><label className="catalog-search"><img src={`${ASSET}search-store.svg`} alt="" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" /></label><div className="category-links">{categories.map((item) => <button className={category === item ? 'active' : ''} type="button" onClick={() => setCategory(item)} key={item}>{item}</button>)}</div></div><ProductGrid items={visible} favorites={favorites} onFavorite={onFavorite} onQuickAdd={onQuickAdd} emptyMessage="No pieces match your search." /></section>;
}

function CollectionsPage() {
  return <><section className="catalog-page page-width"><PageHeading eyebrow="COLLECTIONS" title="Stories in every piece" description="Explore NikkiBee edits built around color, movement and the moments you dress for." /></section><CollectionFeature /><OccasionSection /></>;
}

function ProductPage({ id, products, favorites, onFavorite, onQuickAdd }) {
  const product = products.find((item) => item.id === id);
  const [size, setSize] = useState(product?.sizes[0] || '');
  if (!product) return <NotFoundPage />;
  const favorite = favorites.includes(id);
  return <><section className="product-detail page-width"><div className="detail-image"><img src={`${ASSET}${product.image}`} alt={product.name} />{product.isNew && <span className="new-badge">NEW</span>}</div><div className="detail-copy"><p className="eyebrow">{product.category.toUpperCase()}</p><h1>{product.name}</h1><p className="detail-price">{formatPrice(product.price)}</p><p className="detail-description">{product.description}</p><div className="detail-option"><span>COLOUR</span><strong>{product.color}</strong></div><div className="detail-option"><span>SELECT SIZE</span><div className="size-options">{product.sizes.map((item) => <button className={size === item ? 'active' : ''} type="button" onClick={() => setSize(item)} key={item}>{item}</button>)}</div></div><div className="detail-actions"><button className="button primary" type="button" onClick={() => onQuickAdd(product.id, size)} disabled={!product.sizes.length}>ADD TO BAG</button><button className={`button secondary save-button${favorite ? ' active' : ''}`} type="button" onClick={() => onFavorite(product.id)}>{favorite ? 'SAVED' : 'SAVE ITEM'}</button></div><p className="detail-note">{product.sizes.length ? `Selected size: ${size}. Delivery is calculated at checkout.` : 'This piece is currently sold out.'}</p></div></section><section className="product-section page-width"><PageHeading title="You may also like" /><ProductGrid items={products.filter((item) => item.id !== id).slice(0, 4)} favorites={favorites} onFavorite={onFavorite} onQuickAdd={onQuickAdd} /></section></>;
}

function FavoritesPage({ products, favorites, onFavorite, onQuickAdd, signedIn }) {
  if (!signedIn) return <section className="auth-page page-width"><div className="auth-panel"><p className="eyebrow">SAVED</p><h1>Sign in to save pieces</h1><p>Your favourites will stay with your account across devices.</p><a className="button primary" href="#/signin">SIGN IN</a></div></section>;
  const saved = products.filter((product) => favorites.includes(product.id));
  return <section className="catalog-page page-width"><PageHeading eyebrow="SAVED" title="Your favourites" description="Keep the pieces that caught your eye close by." /><ProductGrid items={saved} favorites={favorites} onFavorite={onFavorite} onQuickAdd={onQuickAdd} emptyMessage="You have not saved any pieces yet." /></section>;
}

function CartPage({ cart, onQuantity, onRemove }) {
  const entries = cart.items;
  return <section className="catalog-page page-width"><PageHeading eyebrow="YOUR BAG" title="Shopping bag" description={`${cart.count} item${cart.count === 1 ? '' : 's'} selected.`} />{entries.length ? <div className="cart-layout"><div className="cart-items">{entries.map((item) => <article className="cart-item" key={item.id}><a href={`#/product/${item.productId}`}><img src={`${ASSET}${item.image}`} alt={item.name} /></a><div className="cart-item-copy"><div><a href={`#/product/${item.productId}`}><h2>{item.name}</h2></a><strong>{formatPrice(item.price)}</strong></div><p>{item.color} · Size {item.size}</p><div className="quantity-control"><button type="button" onClick={() => onQuantity(item.id, item.quantity - 1)} aria-label={`Reduce ${item.name} quantity`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => onQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}>+</button></div><button className="text-button" type="button" onClick={() => onRemove(item.id)}>REMOVE</button></div></article>)}</div><aside className="order-summary"><h2>Order summary</h2><div><span>Subtotal</span><strong>{formatPrice(cart.subtotal)}</strong></div><div><span>Delivery</span><span>Calculated at checkout</span></div><div className="summary-total"><span>Total</span><strong>{formatPrice(cart.subtotal)}</strong></div><a className="button primary" href="#/checkout">CHECKOUT</a><a className="text-link compact" href="#/shop">Continue shopping</a></aside></div> : <div className="empty-state"><p>Your shopping bag is empty.</p><a className="button primary" href="#/shop">SHOP COLLECTION</a></div>}</section>;
}

function SignInPage({ user, onSignIn, authError, signingIn }) {
  return <section className="auth-page page-width"><div className="auth-panel"><p className="eyebrow">YOUR ACCOUNT</p><h1>{user ? `Welcome, ${user.name.split(' ')[0]}` : 'Sign in to NikkiBee'}</h1><p>{user ? 'Your account is ready. You can continue shopping or view your orders.' : 'Use your Google account to save favourites, check out faster and keep track of your orders.'}</p>{user ? <div className="hero-actions"><a className="button primary" href="#/account">VIEW ACCOUNT</a><a className="button secondary" href="#/shop">CONTINUE SHOPPING</a></div> : <button className="button primary google-button" type="button" onClick={onSignIn} disabled={signingIn}>{signingIn ? 'CONNECTING…' : 'CONTINUE WITH GOOGLE'}</button>}{authError && <p className="form-message error">{authError}</p>}</div></section>;
}

function AccountPage({ user, orders, onSignOut }) {
  if (!user) return <SignInPage user={null} onSignIn={() => { window.location.hash = '/signin'; }} />;
  return <section className="catalog-page page-width"><PageHeading eyebrow="ACCOUNT" title={`Hello, ${user.name.split(' ')[0]}`} description={user.email} action={<button className="text-link compact button-link" type="button" onClick={onSignOut}>Sign out</button>} /><div className="account-grid"><div className="account-card"><h2>Saved pieces</h2><p>Your favourites are linked to your account and available across devices.</p><a className="text-link compact" href="#/favorites">View favourites</a></div><div className="account-card"><h2>Orders</h2><p>{orders.length ? `${orders.length} order${orders.length === 1 ? '' : 's'} placed.` : 'You have not placed an order yet.'}</p>{orders.length > 0 && <a className="text-link compact" href="#/orders">View orders</a>}</div></div></section>;
}

function CheckoutPage({ user, cart, onPlaceOrder }) {
  const entries = cart.items;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  if (!entries.length) return <CartPage cart={EMPTY_CART} onQuantity={() => {}} onRemove={() => {}} />;
  if (!user) return <section className="auth-page page-width"><div className="auth-panel"><p className="eyebrow">CHECKOUT</p><h1>Sign in to continue</h1><p>Connect your Google account before placing your order.</p><a className="button primary" href="#/signin?next=checkout">SIGN IN</a></div></section>;

  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setError('');
    try { await onPlaceOrder(Object.fromEntries(new FormData(event.currentTarget))); }
    catch (orderError) { setError(orderError.message); setSubmitting(false); }
  };
  return <section className="catalog-page page-width"><PageHeading eyebrow="CHECKOUT" title="Delivery details" description="Review your order and tell us where to send it." /><form className="checkout-layout" onSubmit={submit}><div className="checkout-form"><div className="field-row"><label>First name<input name="firstName" defaultValue={user.name.split(' ')[0]} required /></label><label>Last name<input name="lastName" defaultValue={user.name.split(' ').slice(1).join(' ')} required /></label></div><label>Email<input type="email" name="email" defaultValue={user.email} required /></label><label>Phone number<input type="tel" name="phone" placeholder="0800 000 0000" required /></label><label>Delivery address<input name="address" placeholder="Street address" required /></label><div className="field-row"><label>City<input name="city" defaultValue="Jos" required /></label><label>State<input name="state" defaultValue="Plateau State" required /></label></div><label>Order note<textarea name="note" rows="4" placeholder="Optional delivery note" /></label>{error && <p className="form-message error">{error}</p>}</div><aside className="order-summary"><h2>Your order</h2>{entries.map((item) => <div key={item.id}><span>{item.name} × {item.quantity}</span><strong>{formatPrice(item.lineTotal)}</strong></div>)}<div className="summary-total"><span>Total</span><strong>{formatPrice(cart.subtotal)}</strong></div><button className="button primary" type="submit" disabled={submitting}>{submitting ? 'SUBMITTING…' : 'PLACE ORDER'}</button><p className="payment-pending">Payment pending</p><p className="detail-note">Submitting creates an order request. It does not confirm payment or fulfilment.</p></aside></form></section>;
}

function OrdersPage({ orders }) {
  return <section className="catalog-page page-width"><PageHeading eyebrow="ACCOUNT" title="Your orders" description="Order requests connected to your NikkiBee account." />{orders.length ? <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.id}><div><h2>Order {order.orderNumber}</h2><p>{new Date(order.createdAt).toLocaleDateString('en-NG', { dateStyle: 'long' })}</p></div><div><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span><strong>{formatPrice(order.total)}</strong></div><span className="payment-status">{order.paymentLabel}</span></article>)}</div> : <div className="empty-state"><p>No orders yet.</p><a className="button primary" href="#/shop">SHOP COLLECTION</a></div>}</section>;
}

function AboutPage() {
  return <><section className="about-hero page-width"><div className="collection-copy"><p className="eyebrow">OUR STORY</p><h1>Style that feels like you</h1><p>NikkiBee is a Nigerian fashion store built around expressive pieces, easy confidence and the belief that getting dressed should feel personal.</p><p>We curate color, comfort and detail for real days, memorable evenings and every story in between.</p><a className="text-link" href="#/shop">SHOP THE COLLECTION <img src={`${ASSET}arrow-right.svg`} alt="" /></a></div><div className="about-image"><img src={`${ASSET}hero-center.png`} alt="NikkiBee patterned dresses" /></div></section><OccasionSection /></>;
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  return <section className="catalog-page page-width"><PageHeading eyebrow="CONTACT" title="We would love to hear from you" description="Questions about a piece, an order or styling? Send us a note." /><div className="contact-layout"><div className="collection-copy"><h2>Visit or write</h2><p>Jos, Plateau State, Nigeria</p><p><a href="mailto:nikkitim4190@gmail.com">nikkitim4190@gmail.com</a></p><a className="text-link" href="#/faq">READ FAQs <img src={`${ASSET}arrow-right.svg`} alt="" /></a></div><form className="checkout-form" onSubmit={(event) => { event.preventDefault(); event.currentTarget.reset(); setSent(true); }}><label>Name<input name="name" required /></label><label>Email<input type="email" name="email" required /></label><label>Message<textarea name="message" rows="6" required /></label><button className="button primary" type="submit">SEND MESSAGE</button>{sent && <p className="form-message">Thanks. Your message is ready for the NikkiBee team.</p>}</form></div></section>;
}

function FaqPage() {
  const faqs = [['How long does delivery take?', 'Orders within Nigeria are prepared after confirmation. Delivery timing depends on your location and is shared before dispatch.'], ['Can I change my order?', 'Contact the NikkiBee team as soon as possible with your order number.'], ['How do I choose a size?', 'Available sizes appear on each product page. Select a size before adding the piece to your bag.'], ['Can I save items for later?', 'Yes. Use the heart button on any product card and find the piece again under Favourites.']];
  return <section className="catalog-page page-width"><PageHeading eyebrow="HELP" title="Frequently asked questions" description="Quick answers about shopping with NikkiBee." /><div className="faq-list">{faqs.map(([question, answer]) => <article key={question}><h2>{question}</h2><p>{answer}</p></article>)}</div></section>;
}

function NotFoundPage() {
  return <section className="auth-page page-width"><div className="auth-panel"><p className="eyebrow">404</p><h1>Page not found</h1><p>The page you requested is not part of this collection.</p><a className="button primary" href="#/home">BACK HOME</a></div></section>;
}

function App() {
  const route = useRoute();
  const { data: session, status: sessionStatus } = useSession();
  const user = session?.user || null;
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(EMPTY_CART);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appError, setAppError] = useState('');
  const [authError, setAuthError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const loadAccount = useCallback(async () => {
    if (sessionStatus !== 'authenticated') { setFavorites([]); setOrders([]); return; }
    const [saved, history] = await Promise.all([api('/api/favourites'), api('/api/orders')]);
    setFavorites(saved.favourites); setOrders(history.orders);
  }, [sessionStatus]);

  const loadStore = useCallback(async () => {
    setAppError('');
    try {
      const [catalogue, bag] = await Promise.all([api('/api/products'), api('/api/cart')]);
      setProducts(catalogue.products); setCart(bag);
    } catch (error) { setAppError(error.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStore(); }, [loadStore, sessionStatus]);
  useEffect(() => { loadAccount().catch((error) => setAppError(error.message)); }, [loadAccount]);

  const cartCount = cart.count;
  const routePath = route.split('?')[0];

  const toggleFavorite = async (id) => {
    if (!user) { window.location.hash = '/signin'; return; }
    const saved = favorites.includes(id);
    try {
      const result = await api('/api/favourites', { method: saved ? 'DELETE' : 'POST', body: JSON.stringify({ productId: id }) });
      setFavorites(result.favourites);
    } catch (error) { setAppError(error.message); }
  };
  const addToCart = async (id, size) => {
    const product = products.find((item) => item.id === id);
    if (!product?.sizes.length) { setAppError('This piece is currently sold out.'); return false; }
    try {
      setCart(await api('/api/cart', { method: 'POST', body: JSON.stringify({ productId: id, size: size || product.sizes[0], quantity: 1 }) }));
      return true;
    } catch (error) {
      setAppError(error.message);
      return false;
    }
  };
  const updateQuantity = async (itemId, quantity) => {
    try { setCart(await api('/api/cart', { method: 'PATCH', body: JSON.stringify({ itemId, quantity }) })); }
    catch (error) { setAppError(error.message); }
  };
  const removeFromCart = async (itemId) => {
    try { setCart(await api(`/api/cart?itemId=${encodeURIComponent(itemId)}`, { method: 'DELETE' })); }
    catch (error) { setAppError(error.message); }
  };

  const handleSignIn = async () => {
    setSigningIn(true); setAuthError('');
    try {
      const next = new URLSearchParams(route.split('?')[1] || '').get('next');
      await signIn('google', { redirectTo: `/auth/complete${next === 'checkout' ? '?next=checkout' : ''}` });
    } catch (error) { setAuthError(error.message); }
    finally { setSigningIn(false); }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    setFavorites([]);
    setOrders([]);
    try { setCart(await api('/api/cart')); }
    catch { setCart(EMPTY_CART); }
    window.location.hash = '/home';
  };
  const placeOrder = async (delivery) => {
    await api('/api/orders', { method: 'POST', body: JSON.stringify(delivery) });
    const [bag, history] = await Promise.all([api('/api/cart'), api('/api/orders')]);
    setCart(bag); setOrders(history.orders); window.location.hash = '/orders';
  };

  let page;
  if (loading) page = <div className="app-loading page-width" role="status">Loading the collection…</div>;
  else if (routePath === 'home') page = <HomePage products={products} favorites={favorites} onFavorite={toggleFavorite} onQuickAdd={addToCart} />;
  else if (routePath === 'shop') page = <ShopPage route={route} products={products} favorites={favorites} onFavorite={toggleFavorite} onQuickAdd={addToCart} />;
  else if (routePath === 'collections') page = <CollectionsPage />;
  else if (routePath.startsWith('product/')) page = <ProductPage id={routePath.split('/')[1]} products={products} favorites={favorites} onFavorite={toggleFavorite} onQuickAdd={addToCart} />;
  else if (routePath === 'favorites') page = <FavoritesPage products={products} favorites={favorites} signedIn={Boolean(user)} onFavorite={toggleFavorite} onQuickAdd={addToCart} />;
  else if (routePath === 'cart') page = <CartPage cart={cart} onQuantity={updateQuantity} onRemove={removeFromCart} />;
  else if (routePath === 'checkout') page = <CheckoutPage user={user} cart={cart} onPlaceOrder={placeOrder} />;
  else if (routePath === 'signin') page = <SignInPage user={user} onSignIn={handleSignIn} authError={authError} signingIn={signingIn} />;
  else if (routePath === 'account') page = <AccountPage user={user} orders={orders} onSignOut={handleSignOut} />;
  else if (routePath === 'orders') page = <OrdersPage orders={orders} />;
  else if (routePath === 'about') page = <AboutPage />;
  else if (routePath === 'contact') page = <ContactPage />;
  else if (routePath === 'faq') page = <FaqPage />;
  else page = <NotFoundPage />;

  return <main className="storefront"><Header user={user} cartCount={cartCount} favoriteCount={favorites.length} />{appError && <div className="app-alert page-width" role="alert"><span>{appError}</span><button type="button" onClick={() => setAppError('')}>Dismiss</button></div>}{page}<Footer /></main>;
}

export default App;
