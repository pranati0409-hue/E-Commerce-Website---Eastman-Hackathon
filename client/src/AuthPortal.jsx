import { useEffect, useState } from "react";
import "./AuthPortal.css";

function Field({ label, error, id, ...inputProps }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
      {error && <span className="auth-field-error" id={`${id}-error`}>{error}</span>}
    </div>
  );
}

function PasswordField({ label, id, error, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-input">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />
        <button
          type="button"
          className="auth-password-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? "HIDE" : "SHOW"}
        </button>
      </div>
      {error && <span className="auth-field-error" id={`${id}-error`}>{error}</span>}
    </div>
  );
}

function AuthLink({ to, navigate, children, ...props }) {
  return (
    <a
      href={to}
      onClick={(event) => {
        event.preventDefault();
        navigate(to);
      }}
      {...props}
    >
      {children}
    </a>
  );
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function AuthPortal({ path, navigate, authUser, onAuthenticated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(authUser);
  const isSignup = path === "/signup";

  useEffect(() => {
    if (path === "/account" && !authUser) navigate("/login");
  }, [path, authUser, navigate]);

  function validate() {
    const nextErrors = {};
    const normalizedEmail = email.trim();

    if (isSignup && !name.trim()) nextErrors.name = "Enter your full name.";
    if (!validateEmail(normalizedEmail)) nextErrors.email = "Enter a valid email address.";
    if (
      !password ||
      password.length > 72 ||
      new TextEncoder().encode(password).length > 72 ||
      (isSignup && password.length < 12)
    ) {
      nextErrors.password = isSignup
        ? "Use a password between 12 and 72 characters."
        : "Enter your password.";
    }
    if (isSignup && confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    if (!validate()) return;

    const normalizedEmail = email.trim().toLowerCase();
    const emailName = normalizedEmail.split("@")[0];
    const displayName = isSignup
      ? name.trim()
      : emailName.charAt(0).toUpperCase() + emailName.slice(1);
    const demoUser = {
      name: displayName,
      email: normalizedEmail,
    };
    setUser(demoUser);
    onAuthenticated(demoUser);
    navigate("/");
  }

  function handleLogout() {
    setMessage("");
    setUser(null);
    onAuthenticated(null);
    navigate("/login");
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <a className="auth-brand" href="/" onClick={(event) => {
          event.preventDefault();
          navigate("/");
        }} aria-label="Oddly home">
          oddly<span>.</span>
        </a>
        <span className="auth-header-note">DEMO ACCESS / LOCAL ONLY</span>
        <AuthLink className="auth-header-link" to="/" navigate={navigate}>BACK TO STORE ↗</AuthLink>
      </header>

      <div className="auth-demo-notice" role="status">
        <strong>DEMO MODE</strong>
        <span>
          No database connection is used. Sign-in accepts any valid email and password;
          demo accounts are temporary and are cleared when you refresh the page.
        </span>
      </div>

      <div className="auth-main">
        <aside className="auth-aside">
          <div className="auth-aside-kicker"><span /> ODDLY COMMERCE</div>
          <h1>Built for<br />what comes<br /><em>next.</em></h1>
          <div className="auth-aside-rule" />
          <div className="auth-aside-foot">
            <span>DEMO ACCOUNT ACCESS</span>
            <span>01 / 03</span>
          </div>
        </aside>

        <section className="auth-card" aria-labelledby="auth-title">
          {path === "/account" ? (
            user ? (
              <div className="account-panel">
                <div className="auth-card-kicker">ACCOUNT / PROFILE</div>
                <h2 id="auth-title">Welcome back,<br /><em>{user.name}</em></h2>
                <p className="auth-account-copy">Your temporary demo profile. It is not saved to a database.</p>
                <div className="account-detail">
                  <span>EMAIL ADDRESS</span>
                  <strong>{user.email}</strong>
                </div>
                {message && <div className="auth-message auth-message-error" role="alert">{message}</div>}
                <button className="auth-submit" type="button" onClick={handleLogout}>
                  SIGN OUT <span>↗</span>
                </button>
              </div>
            ) : (
              <div className="auth-message auth-message-error" role="alert">{message || "Your temporary demo session has ended."}</div>
            )
          ) : (
            <>
              <div className="auth-card-kicker">{isSignup ? "NEW CUSTOMER / 01" : "CUSTOMER ACCESS / 02"}</div>
              <h2 id="auth-title">{isSignup ? <>Create your<br /><em>account.</em></> : <>Welcome<br /><em>back.</em></>}</h2>
              <p className="auth-intro">
                {isSignup ? "Create a temporary demo profile." : "Continue with a temporary demo profile."}
              </p>

              {message && <div className="auth-message auth-message-error" role="alert" aria-live="polite">{message}</div>}

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                {isSignup && (
                  <Field
                    id="auth-name"
                    label="Full name"
                    type="text"
                    autoComplete="name"
                    maxLength={100}
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    error={errors.name}
                    required
                  />
                )}
                <Field
                  id="auth-email"
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  error={errors.email}
                  required
                />
                <PasswordField
                  id="auth-password"
                  label="Password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  maxLength={72}
                  placeholder={isSignup ? "At least 12 characters" : "Enter your password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  error={errors.password}
                  required
                />
                {isSignup && (
                  <PasswordField
                    id="auth-confirm-password"
                    label="Confirm password"
                    autoComplete="new-password"
                    maxLength={72}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    error={errors.confirmPassword}
                    required
                  />
                )}
                <button className="auth-submit" type="submit">
                  {isSignup ? "CREATE ACCOUNT" : "SIGN IN"} <span>↗</span>
                </button>
              </form>
              <p className="auth-switch">
                {isSignup ? "Already have an account?" : "New to Oddly Commerce?"}{" "}
                <AuthLink to={isSignup ? "/login" : "/signup"} navigate={navigate}>
                  {isSignup ? "Sign in" : "Create an account"}
                </AuthLink>
              </p>
            </>
          )}
        </section>
      </div>

      <footer className="auth-footer">
        <span>ODDLY COMMERCE</span>
        <span>Independent storefront and demo brand.</span>
        <span>DEMO ACCOUNT ACCESS</span>
      </footer>
    </main>
  );
}
