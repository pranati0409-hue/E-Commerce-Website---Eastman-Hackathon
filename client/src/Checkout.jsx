import React, { useMemo, useState } from "react";
import "./Checkout.css";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

/*
  Expected cart item shape:
  { id, name, price, image, quantity }
  If your cart uses a different quantity property, adjust getQuantity below.
*/
const getQuantity = (item) => Number(item.quantity ?? item.qty ?? 1);

export default function Checkout({ cart = [], onBackToShop, onOrderPlaced }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    payment: "cod",
  });
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price || 0) * getQuantity(item), 0),
    [cart]
  );

  const discount = useMemo(() => {
    if (appliedCoupon === "WELCOME10") return Math.min(Math.round(subtotal * 0.1), 500);
    if (appliedCoupon === "SAVE500") return subtotal >= 3000 ? 500 : 0;
    return 0;
  }, [appliedCoupon, subtotal]);

  const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99;
  const total = Math.max(0, subtotal - discount + shipping);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponMessage("Enter a discount code first.");
      return;
    }
    if (code === "WELCOME10") {
      setAppliedCoupon(code);
      setCouponMessage("WELCOME10 applied — 10% off, up to ₹500.");
    } else if (code === "SAVE500") {
      if (subtotal >= 3000) {
        setAppliedCoupon(code);
        setCouponMessage("SAVE500 applied — ₹500 off your order.");
      } else {
        setAppliedCoupon("");
        setCouponMessage("SAVE500 is available on orders of ₹3,000 or more.");
      }
    } else if (code === "FREESHIP") {
      setAppliedCoupon(code);
      setCouponMessage("FREESHIP applied — shipping is free.");
    } else {
      setAppliedCoupon("");
      setCouponMessage("That code isn't valid. Try WELCOME10, SAVE500, or FREESHIP.");
    }
  };

  const effectiveShipping = appliedCoupon === "FREESHIP" ? 0 : shipping;
  const finalTotal = Math.max(0, subtotal - discount + effectiveShipping);

  const placeOrder = (event) => {
    event.preventDefault();
    setFormError("");

    if (cart.length === 0) {
      setFormError("Your bag is empty. Add a product before checking out.");
      return;
    }

    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() ||
        !form.address.trim() || !form.city.trim() || !form.state.trim() ||
        !form.pincode.trim()) {
      setFormError("Please complete all delivery details.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (!/^[0-9]{10}$/.test(form.phone.replace(/\D/g, ""))) {
      setFormError("Enter a valid 10-digit phone number.");
      return;
    }

    if (!/^[0-9]{6}$/.test(form.pincode.trim())) {
      setFormError("Enter a valid 6-digit PIN code.");
      return;
    }

    const order = {
      orderId: `ODD${Date.now().toString().slice(-8)}`,
      customer: form,
      items: cart,
      subtotal,
      discount,
      coupon: appliedCoupon || null,
      shipping: effectiveShipping,
      total: finalTotal,
      createdAt: new Date().toISOString(),
    };

    setSubmitted(true);
    if (typeof onOrderPlaced === "function") onOrderPlaced(order);
  };

  if (submitted) {
    return (
      <main className="oddly-checkout">
        <header className="checkout-header">
          <button className="checkout-logo" onClick={onBackToShop}>oddly<span>.</span></button>
          <span className="checkout-step">ORDER CONFIRMATION</span>
        </header>
        <section className="checkout-success">
          <div className="checkout-success-mark">✓</div>
          <p className="checkout-kicker">THANK YOU, {form.fullName.split(" ")[0].toUpperCase()}!</p>
          <h1>Your order is <em>in the bag.</em></h1>
          <p className="checkout-muted">
            This is a demo confirmation. No payment has been processed and no order has been sent to a server.
          </p>
          <div className="checkout-order-summary">
            <span>Demo order number</span><strong>{`ODD${Date.now().toString().slice(-8)}`}</strong>
            <span>Order total</span><strong>{money(finalTotal)}</strong>
            <span>Payment method</span><strong>{form.payment === "cod" ? "Cash on delivery (demo)" : "Online payment (demo only)"}</strong>
          </div>
          <button className="checkout-primary" onClick={onBackToShop}>CONTINUE EXPLORING ↗</button>
        </section>
      </main>
    );
  }

  return (
    <main className="oddly-checkout">
      <header className="checkout-header">
        <button className="checkout-logo" onClick={onBackToShop}>oddly<span>.</span></button>
        <div className="checkout-progress">
          <span className="checkout-progress-active">01 BAG</span><i />
          <span className="checkout-progress-active">02 DETAILS</span><i />
          <span>03 CONFIRM</span>
        </div>
        <span className="checkout-secure">◇ SECURE CHECKOUT</span>
      </header>

      <div className="checkout-page-heading">
        <p className="checkout-kicker">ALMOST YOURS</p>
        <h1>Make it <em>official.</em></h1>
        <p className="checkout-muted">Your favourites are just a few details away.</p>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={placeOrder}>
          <section className="checkout-panel">
            <div className="checkout-section-heading">
              <span>01</span>
              <div><h2>Your details</h2><p>Who are we sending this to?</p></div>
            </div>
            <div className="checkout-fields">
              <label className="checkout-field checkout-field-full">
                <span>FULL NAME *</span>
                <input name="fullName" value={form.fullName} onChange={updateField} placeholder="Name on the delivery" autoComplete="name" required />
              </label>
              <label className="checkout-field">
                <span>EMAIL ADDRESS *</span>
                <input type="email" name="email" value={form.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" required />
              </label>
              <label className="checkout-field">
                <span>PHONE NUMBER *</span>
                <input type="tel" name="phone" value={form.phone} onChange={updateField} placeholder="10-digit mobile number" autoComplete="tel" maxLength={14} required />
              </label>
            </div>
          </section>

          <section className="checkout-panel">
            <div className="checkout-section-heading">
              <span>02</span>
              <div><h2>Delivery address</h2><p>Where should your ODDLY order land?</p></div>
            </div>
            <div className="checkout-fields">
              <label className="checkout-field checkout-field-full">
                <span>STREET ADDRESS *</span>
                <input name="address" value={form.address} onChange={updateField} placeholder="House number, street, area" autoComplete="street-address" required />
              </label>
              <label className="checkout-field">
                <span>CITY *</span>
                <input name="city" value={form.city} onChange={updateField} placeholder="City" autoComplete="address-level2" required />
              </label>
              <label className="checkout-field">
                <span>STATE *</span>
                <input name="state" value={form.state} onChange={updateField} placeholder="State" autoComplete="address-level1" required />
              </label>
              <label className="checkout-field">
                <span>PIN CODE *</span>
                <input name="pincode" value={form.pincode} onChange={updateField} placeholder="6-digit PIN" inputMode="numeric" maxLength={6} autoComplete="postal-code" required />
              </label>
            </div>
          </section>

          <section className="checkout-panel">
            <div className="checkout-section-heading">
              <span>03</span>
              <div><h2>Payment method</h2><p>Choose how you would like to pay.</p></div>
            </div>
            <label className={`checkout-payment-option ${form.payment === "cod" ? "selected" : ""}`}>
              <input type="radio" name="payment" value="cod" checked={form.payment === "cod"} onChange={updateField} />
              <span><strong>Cash on delivery</strong><small>Demo selection — no real order will be placed.</small></span>
            </label>
            <label className={`checkout-payment-option ${form.payment === "online" ? "selected" : ""}`}>
              <input type="radio" name="payment" value="online" checked={form.payment === "online"} onChange={updateField} />
              <span><strong>Online payment</strong><small>Payment gateway integration required.</small></span>
            </label>
          </section>

          {formError && <p className="checkout-error" role="alert">{formError}</p>}
          <button type="submit" className="checkout-primary checkout-place-order">
            PLACE DEMO ORDER — {money(finalTotal)} ↗
          </button>
          <p className="checkout-disclaimer">Demo checkout only. Connect an order backend and payment gateway before accepting real orders.</p>
        </form>

        <aside className="checkout-summary">
          <div className="checkout-summary-top">
            <div><p className="checkout-kicker">YOUR SELECTION</p><h2>Order summary</h2></div>
            <span>{cart.reduce((sum, item) => sum + getQuantity(item), 0)} ITEMS</span>
          </div>

          {cart.length === 0 ? (
            <div className="checkout-empty">
              <p>Your bag is looking a little empty.</p>
              <button type="button" className="checkout-secondary" onClick={onBackToShop}>BACK TO SHOP</button>
            </div>
          ) : (
            <div className="checkout-items">
              {cart.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <div className="checkout-item-image">
                    {item.image ? <img src={item.image} alt={item.name} /> : <span>ODDLY</span>}
                    <b>{getQuantity(item)}</b>
                  </div>
                  <div className="checkout-item-copy">
                    <strong>{item.name}</strong>
                    <span>{item.category || "ODDLY EDIT"}</span>
                    <b>{money(Number(item.price || 0) * getQuantity(item))}</b>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="checkout-coupon">
            <label htmlFor="coupon-code">DISCOUNT CODE</label>
            <div className="checkout-coupon-row">
              <input id="coupon-code" value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Enter code" />
              <button type="button" onClick={applyCoupon}>APPLY</button>
            </div>
            {couponMessage && <p className={`checkout-coupon-message ${appliedCoupon ? "success" : ""}`}>{couponMessage}</p>}
            <div className="checkout-coupon-hints">
              <button type="button" onClick={() => setCouponInput("WELCOME10")}>WELCOME10</button>
              <button type="button" onClick={() => setCouponInput("SAVE500")}>SAVE500</button>
              <button type="button" onClick={() => setCouponInput("FREESHIP")}>FREESHIP</button>
            </div>
          </div>

          <div className="checkout-totals">
            <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            <div><span>Discount {appliedCoupon && <small>({appliedCoupon})</small>}</span><strong className="checkout-discount">− {money(discount)}</strong></div>
            <div><span>Shipping</span><strong>{effectiveShipping === 0 ? "FREE" : money(effectiveShipping)}</strong></div>
            <div className="checkout-grand-total"><span>Total</span><strong>{money(finalTotal)}</strong></div>
          </div>
          <p className="checkout-shipping-note">
            {subtotal >= 1999 ? "You've unlocked free shipping ✳" : `Add ${money(1999 - subtotal)} more for free shipping.`}
          </p>
        </aside>
      </div>
      <footer className="checkout-footer"><span>oddly<span className="checkout-dot">.</span></span><p>GOOD TASTE IS A PERSONAL THING.</p><button onClick={onBackToShop}>← CONTINUE EXPLORING</button></footer>
    </main>
  );
}
