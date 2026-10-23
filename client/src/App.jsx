
import React, { useMemo, useState } from "react";
import "./App.css";

const products = [
  {
    id: 1,
    name: "Nothing Headphones",
    category: "Electronics",
    price: 12999,
    oldPrice: 14999,
    tag: "BESTSELLER",
    color: "lavender",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 2,
    name: "Velocity Runner",
    category: "Sports",
    price: 5499,
    oldPrice: 6999,
    tag: "BUILT TO MOVE",
    color: "lime",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 3,
    name: "Everyday Oversized",
    category: "Clothes",
    price: 1899,
    oldPrice: 2499,
    tag: "STAFF PICK",
    color: "peach",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 4,
    name: "Studio Mini Bag",
    category: "Accessories",
    price: 2799,
    oldPrice: null,
    tag: "JUST DROPPED",
    color: "blue",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 5,
    name: "Studio Speaker",
    category: "Electronics",
    price: 3999,
    oldPrice: 4999,
    tag: "SOUND GOOD",
    color: "peach",
    image:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 6,
    name: "Court Club",
    category: "Sports",
    price: 3299,
    oldPrice: null,
    tag: "NEW ENERGY",
    color: "blue",
    image:
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 7,
    name: "Off-Duty Jacket",
    category: "Clothes",
    price: 4299,
    oldPrice: 5499,
    tag: "LIMITED EDITION",
    color: "lavender",
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 8,
    name: "Objects Watch",
    category: "Accessories",
    price: 2199,
    oldPrice: 2999,
    tag: "UNDER ₹3K",
    color: "lime",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",
  },
];

const categories = [
  { name: "All objects", icon: "✳", count: "08" },
  { name: "Electronics", icon: "⌁", count: "02" },
  { name: "Sports", icon: "↗", count: "02" },
  { name: "Clothes", icon: "◉", count: "02" },
  { name: "Accessories", icon: "◇", count: "02" },
];

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function App() {
  const [category, setCategory] = useState("All objects");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [notice, setNotice] = useState("");

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        category === "All objects" || product.category === category;
      const matchesSearch =
        `${product.name} ${product.category}`
          .toLowerCase()
          .includes(search.toLowerCase().trim());

      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  function addToCart(product) {
    setCart((current) => {
      const exists = current.find((item) => item.id === product.id);

      return exists
        ? current.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...current, { ...product, quantity: 1 }];
    });

    setNotice(`${product.name} added to your bag`);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function toggleWishlist(id) {
    setWishlist((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function scrollToProducts() {
    document.getElementById("discover")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  return (
    <div className="oddly">
      <div className="announcement">
        <span>GOOD TASTE. NO RULES.</span>
        <span>FREE SHIPPING ON ORDERS ABOVE ₹1,999 ↗</span>
      </div>

      <header className="navbar">
        <a className="brand" href="#" aria-label="Oddly home">
          oddly<span className="brand-dot">.</span>
        </a>

        <nav className="nav-links">
          <a href="#discover">Discover</a>
          <a href="#categories">Categories</a>
          <a href="#about">Our point of view</a>
        </nav>

        <div className="nav-actions">
          <label className="nav-search">
            <span>⌕</span>
            <input
              aria-label="Search products"
              placeholder="Find your thing..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                document.getElementById("discover")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            />
            <kbd>/</kbd>
          </label>

          <button className="icon-button account-button" aria-label="Account" onClick={() => setNotice("Login and signup coming soon")}>
            ♙
          </button>

          <button
            className="bag-button"
            onClick={() =>
              document.getElementById("mini-cart")?.showModal()
            }
          >
            BAG <span>{cartCount}</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" />
              THE NEW EVERYDAY / VOL. 001
            </div>

            <h1>
              Less
              <br />
              ordinary<span className="hero-star">✳</span>
              <br />
              <span className="outline-text">more you.</span>
            </h1>

            <p className="hero-description">
              Objects with personality. Essentials with a little extra.
              Find the things you didn't know you needed.
            </p>

            <button className="primary-button" onClick={scrollToProducts}>
              EXPLORE THE DROP <span>↗</span>
            </button>

            <div className="hero-footnote">
              <span>01 — 04</span>
              <span>CURATED FOR THE CURIOUS</span>
            </div>
          </div>

          <div className="hero-art">
            <div className="hero-art-top">
              <span>THE OBJECT EDIT</span>
              <span>NO. 001 / 2026</span>
            </div>

            <div className="hero-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1100&q=90"
                alt="Minimal statement watch from the Oddly edit"
                className="hero-image"
              />
              <div className="hero-sticker">
                <span>NOT</span>
                <span>HERE TO</span>
                <span>BLEND IN.</span>
                <span className="sticker-star">✳</span>
              </div>
              <div className="hero-image-caption">
                <span>THE EVERYDAY ICON</span>
                <span>₹2,199 ↗</span>
              </div>
            </div>

            <div className="hero-art-bottom">
              <span>FUNCTION MEETS FEELING.</span>
              <span>SCROLL TO EXPLORE ↓</span>
            </div>
          </div>

          <div className="hero-side-note">INDEPENDENT TASTE CLUB — EST. 2026</div>
        </section>

        <section className="ticker" aria-label="Store highlights">
          <div className="ticker-track">
            {Array.from({ length: 2 }, (_, i) => (
              <span key={i}>
                GOOD OBJECTS ONLY <b>✳</b> NO BORING FINDS <b>✳</b> MADE FOR
                YOUR NEXT ERA <b>✳</b> YOUR TASTE, YOUR RULES <b>✳</b>
              </span>
            ))}
          </div>
        </section>

        <section className="category-section" id="categories">
          <div className="section-heading">
            <div>
              <div className="eyebrow">FOUR WORLDS. ONE GOOD TASTE.</div>
              <h2>What's your <span>thing?</span></h2>
            </div>
            <p>
              Different moods. Different obsessions.
              <br />
              Pick a lane — or don't.
            </p>
          </div>

          <div className="category-grid">
            {[
              {
                name: "Electronics",
                number: "01",
                caption: "TECH WITH TASTE",
                icon: "⌁",
                color: "cat-lilac",
              },
              {
                name: "Sports",
                number: "02",
                caption: "MADE TO MOVE",
                icon: "↗",
                color: "cat-lime",
              },
              {
                name: "Clothes",
                number: "03",
                caption: "WEAR YOUR MOOD",
                icon: "◉",
                color: "cat-peach",
              },
              {
                name: "Accessories",
                number: "04",
                caption: "THE FINISHING TOUCH",
                icon: "◇",
                color: "cat-blue",
              },
            ].map((item) => (
              <button
                key={item.name}
                className={`category-tile ${item.color} ${
                  category === item.name ? "category-selected" : ""
                }`}
                onClick={() => {
                  setCategory(item.name);
                  scrollToProducts();
                }}
              >
                <div className="tile-top">
                  <span>{item.number} / 04</span>
                  <span className="tile-arrow">↗</span>
                </div>
                <span className="tile-symbol">{item.icon}</span>
                <div className="tile-bottom">
                  <div>
                    <span className="tile-caption">{item.caption}</span>
                    <h3>{item.name}</h3>
                  </div>
                  <span className="tile-circle">↗</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="product-section" id="discover">
          <div className="section-heading product-heading">
            <div>
              <div className="eyebrow">THE GOOD STUFF / HAND-PICKED</div>
              <h2>
                Objects of <span>desire.</span>
              </h2>
            </div>
            <span className="result-count">
              {String(visibleProducts.length).padStart(2, "0")} OBJECTS FOUND
            </span>
          </div>

          <div className="filter-row">
            <div className="filter-pills">
              {categories.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setCategory(item.name)}
                  className={`filter-pill ${
                    category === item.name ? "active" : ""
                  }`}
                >
                  <span>{item.icon}</span> {item.name}
                </button>
              ))}
            </div>
            <span className="sort-note">CURATED, NOT COMPLICATED ↘</span>
          </div>

          {visibleProducts.length ? (
            <div className="product-grid">
              {visibleProducts.map((product, index) => (
                <article className="product-card" key={product.id}>
                  <div
                    className={`product-image-box product-${product.color}`}
                  >
                    <img src={product.image} alt={product.name} loading="lazy" />
                    <span className="product-tag">{product.tag}</span>
                    <button
                      className={`wishlist-button ${
                        wishlist.includes(product.id) ? "wishlisted" : ""
                      }`}
                      aria-label={
                        wishlist.includes(product.id)
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                      onClick={() => toggleWishlist(product.id)}
                    >
                      {wishlist.includes(product.id) ? "♥" : "♡"}
                    </button>
                    <span className="product-index">
                      NO. {String(index + 1).padStart(2, "0")}
                    </span>
                    <button
                      className="quick-add"
                      onClick={() => addToCart(product)}
                    >
                      ADD TO BAG <span>+</span>
                    </button>
                  </div>

                  <div className="product-info">
                    <div>
                      <span className="product-category">
                        {product.category.toUpperCase()}
                      </span>
                      <h3>{product.name}</h3>
                    </div>
                    <div className="product-price">
                      <strong>{money(product.price)}</strong>
                      {product.oldPrice && (
                        <del>{money(product.oldPrice)}</del>
                      )}
                    </div>
                  </div>
                  {product.oldPrice && (
                    <div className="saving-label">
                      YOU SAVE {money(product.oldPrice - product.price)}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-results">
              <span>✳</span>
              <h3>Nothing here. Yet.</h3>
              <p>Try another search or explore all the good stuff.</p>
              <button
                className="primary-button"
                onClick={() => {
                  setSearch("");
                  setCategory("All objects");
                }}
              >
                RESET DISCOVERY ↗
              </button>
            </div>
          )}
        </section>

        <section className="manifesto" id="about">
          <span className="manifesto-label">A LITTLE POINT OF VIEW / 001</span>
          <h2>
            Your taste.
            <br />
            <span>Your rules.</span>
            <br />
            Never just stuff.
          </h2>
          <div className="manifesto-bottom">
            <span>BUY LESS BORING.</span>
            <p>
              We believe everyday things deserve a little more thought.
              Good design, useful details, and objects that feel like you.
            </p>
            <button onClick={scrollToProducts}>FIND YOUR NEXT FAVOURITE ↗</button>
          </div>
          <span className="manifesto-decoration">✳</span>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#">
          oddly<span className="brand-dot">.</span>
        </a>
        <span>GOOD TASTE IS A PERSONAL THING.</span>
        <span>MADE FOR THE UNORDINARY © 2026</span>
      </footer>

      <dialog id="mini-cart" className="cart-dialog">
        <div className="cart-dialog-header">
          <div>
            <span className="eyebrow">YOUR CURRENT OBSESSIONS</span>
            <h2>Your bag <span>({cartCount})</span></h2>
          </div>
          <button
            className="close-cart"
            onClick={() =>
              document.getElementById("mini-cart")?.close()
            }
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        <div className="cart-dialog-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <span>↗</span>
              <h3>Your bag is feeling lonely.</h3>
              <p>Go find something worth obsessing over.</p>
              <button
                className="primary-button"
                onClick={() => {
                  document.getElementById("mini-cart")?.close();
                  scrollToProducts();
                }}
              >
                EXPLORE OBJECTS ↗
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div className="cart-line" key={item.id}>
                <img src={item.image} alt={item.name} />
                <div className="cart-line-info">
                  <span>{item.category.toUpperCase()}</span>
                  <h3>{item.name}</h3>
                  <div className="quantity-control">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() =>
                        setCart((current) =>
                          current
                            .map((p) =>
                              p.id === item.id
                                ? { ...p, quantity: p.quantity - 1 }
                                : p
                            )
                            .filter((p) => p.quantity > 0)
                        )
                      }
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() =>
                        setCart((current) =>
                          current.map((p) =>
                            p.id === item.id
                              ? { ...p, quantity: p.quantity + 1 }
                              : p
                          )
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
                <strong>{money(item.price * item.quantity)}</strong>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-dialog-footer">
            <div>
              <span>SUBTOTAL</span>
              <strong>{money(cartTotal)}</strong>
            </div>
            <p>Shipping and coupons calculated at checkout.</p>
            <button
              className="primary-button checkout-button"
              onClick={() => {
                setNotice("Connect your checkout page to continue");
                document.getElementById("mini-cart")?.close();
              }}
            >
              CONTINUE TO CHECKOUT ↗
            </button>
          </div>
        )}
      </dialog>

      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}
