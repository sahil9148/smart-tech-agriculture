import { useState, useEffect } from 'react'

const FEATURES = [
  { icon: '🏛️', title: 'Gov Connect', desc: 'Discover and apply for 200+ central & state government schemes — PM-KISAN, Kisan Credit Card, subsidies, and more — all from one portal.', tag: 'Subsidies · KCC · PM-KISAN · eNAM', color: 'icon-green' },
  { icon: '🚜', title: 'Equipment Acquisition', desc: 'Browse farm equipment listings — tractors, harvesters, tillers, pumps. Apply for low-interest equipment loans and EMI schemes.', tag: 'Tractor Loans · EMI · Rentals · Subsidized', color: 'icon-amber' },
  { icon: '🛡️', title: 'Crop Insurance', desc: 'Enrol in PMFBY and state crop insurance schemes in minutes. Track claim status, get instant payouts for crop damage.', tag: 'PMFBY · Kharif · Rabi · Claim Tracking', color: 'icon-blue' },
  { icon: '📦', title: 'Market Access', desc: 'List your produce on the digital marketplace. Connect with FPOs, mandis, and direct buyers with logistics support.', tag: 'Direct Selling · FPO · eNAM · Logistics', color: 'icon-teal' },
]

const STEPS = [
  { num: '01', icon: '👤', title: 'Register & Verify', desc: 'Create your farmer profile with land records. Get verified in minutes to access all platform services.' },
  { num: '02', icon: '🏛️', title: 'Access Gov Schemes', desc: 'Browse 200+ central and state government schemes. Apply directly — subsidies, PM-KISAN, KCC and more.' },
  { num: '03', icon: '🌱', title: 'Insure & Equip', desc: 'Get PMFBY crop insurance in minutes. Apply for equipment on easy EMI — tractors, harvesters, pumps.' },
  { num: '04', icon: '💰', title: 'Sell & Earn More', desc: 'List your produce on the marketplace. Connect with FPOs, mandis, and direct buyers with logistics support.' },
]

const TESTIMONIALS = [
  { stars: 5, text: 'PM-KISAN application that used to take weeks now took 10 minutes. The government scheme portal is life-changing for farmers like me.', name: 'Rajesh Kumar', location: 'Punjab, India', avatar: '👨‍🌾' },
  { stars: 5, text: 'Got my PMFBY claim settled in 3 weeks after hailstorm damage. The platform made the entire process completely hassle-free.', name: 'Priya Devi', location: 'Maharashtra, India', avatar: '👩‍🌾' },
  { stars: 5, text: 'Connected directly with buyers in Mumbai — got ₹600 more per quintal than my local mandi. The marketplace is exactly what farmers needed.', name: 'Suresh Patel', location: 'Gujarat, India', avatar: '🧑‍🌾' },
]

const SOLUTIONS = [
  { emoji: '💧', title: 'Smart Irrigation', desc: 'IoT-based soil moisture monitoring and automated irrigation scheduling.' },
  { emoji: '🌡️', title: 'Crop Advisory', desc: 'AI-powered personalized crop recommendations based on soil, weather and market data.' },
  { emoji: '🚛', title: 'Logistics Connect', desc: 'Book transport vehicles for farm produce delivery at competitive rates.' },
  { emoji: '📊', title: 'Market Intelligence', desc: 'Real-time mandi prices, MSP updates, and price trend analysis.' },
  { emoji: '🌦️', title: 'Weather Analytics', desc: 'Hyperlocal 10-day forecast with agriculture-specific weather alerts.' },
  { emoji: '🤝', title: 'FPO Network', desc: 'Connect with Farmer Producer Organizations for collective bargaining power.' },
]

const TECH = [
  { icon: '⚛️', name: 'React 18', desc: 'Fast SPA frontend' },
  { icon: '🟢', name: 'Node.js + Express', desc: 'REST API backend' },
  { icon: '🐘', name: 'PostgreSQL', desc: 'Relational database' },
  { icon: '🤖', name: 'Claude AI', desc: 'AI Farm Advisor' },
]

export default function Landing({ navigate }) {
  const [navScrolled, setNavScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <>
      <nav className={`navbar ${navScrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="logo-icon">🌾</div>AgriTech
          </div>
          <div className="nav-links">
            <a onClick={() => scrollTo('features')}>Features</a>
            <a onClick={() => scrollTo('how-it-works')}>How it Works</a>
            <a onClick={() => scrollTo('solutions')}>Solutions</a>
            <a onClick={() => scrollTo('tech')}>Tech Stack</a>
          </div>
          <div className="nav-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('login')}>Sign In</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('register')}>Get Started</button>
          </div>
          <button className="hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Menu"><span /><span /><span /></button>
        </div>
        <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
          <a onClick={() => scrollTo('features')}>Features</a>
          <a onClick={() => scrollTo('how-it-works')}>How it Works</a>
          <a onClick={() => scrollTo('solutions')}>Solutions</a>
          <a onClick={() => scrollTo('tech')}>Tech Stack</a>
          <hr />
          <a onClick={() => { navigate('login'); setMobileOpen(false) }}>Sign In</a>
          <a className="mobile-cta" onClick={() => { navigate('register'); setMobileOpen(false) }}>Get Started Free</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-badge">🌾 Empowering Farmers Across India</div>
        <h1>One Platform for<br /><span className="gradient-text">Every Farmer's Need</span></h1>
        <p className="hero-sub">Access government schemes, acquire equipment on easy credit, protect your crop with insurance, and sell directly to buyers — everything a farmer needs, in one place.</p>
        <div className="hero-buttons">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('register')}>🌱 Register as a Farmer</button>
          <button className="btn btn-outline btn-lg" onClick={() => scrollTo('how-it-works')}>See How it Works ↓</button>
        </div>
        <div className="hero-stats">
          {[{ val: '2.4L+', label: 'Registered Farmers' }, { val: '200+', label: 'Govt Schemes Listed' }, { val: '₹48Cr+', label: 'Claims Settled' }, { val: '5000+', label: 'Equipment Listings' }].map(s => (
            <div className="hero-stat" key={s.label}><strong>{s.val}</strong><span>{s.label}</span></div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="section">
        <div className="section-label">HOW IT WORKS</div>
        <h2 className="section-title">Four Steps to Farmer Empowerment</h2>
        <p className="section-sub">From registration to better income — we support every stage of a farmer's journey.</p>
        <div className="steps-grid">
          {STEPS.map(s => (
            <div className="step-card" key={s.num}>
              <div className="step-num">{s.num}</div>
              <div className="step-icon"><span style={{ fontSize: 24 }}>{s.icon}</span></div>
              <h3>{s.title}</h3><p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-full">
        <div className="section-inner" id="features">
          <div className="section-label">FEATURES</div>
          <h2 className="section-title">Everything a Farmer Needs</h2>
          <p className="section-sub">Four powerful pillars designed to transform farming income and reduce risk for every farmer.</p>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div className="feature-card" key={f.title}>
                <div className={`feature-icon ${f.color}`}>{f.icon}</div>
                <h3>{f.title}</h3><p>{f.desc}</p>
                <div className="feature-tag">{f.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="section" id="solutions">
        <div className="section-label">SOLUTIONS</div>
        <h2 className="section-title">Complete Farming Ecosystem</h2>
        <p className="section-sub">Beyond the core modules — a full suite of tools designed for modern Indian agriculture.</p>
        <div className="solutions-grid">
          {SOLUTIONS.map(s => (
            <div className="solution-card" key={s.title}>
              <span className="solution-emoji">{s.emoji}</span><h3>{s.title}</h3><p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-full">
        <div className="section-inner">
          <div className="section-label">TESTIMONIALS</div>
          <h2 className="section-title">Farmers Trust AgriTech</h2>
          <p className="section-sub">Real stories from farmers across India who transformed their livelihood with our platform.</p>
          <div className="testimonials-grid">
            {TESTIMONIALS.map(t => (
              <div className="testimonial-card" key={t.name}>
                <div className="testimonial-stars">{'★'.repeat(t.stars)}</div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{t.avatar}</div>
                  <div className="author-info"><strong>{t.name}</strong><span>{t.location}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="section" id="tech">
        <div className="section-label">TECH STACK</div>
        <h2 className="section-title">Built for Scale & Reliability</h2>
        <p className="section-sub">Enterprise-grade technology stack designed to serve millions of farmers.</p>
        <div className="tech-grid">
          {TECH.map(t => (
            <div className="tech-card" key={t.name}><div className="tech-icon">{t.icon}</div><h4>{t.name}</h4><p>{t.desc}</p></div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Transform Your Farm?</h2>
        <p>Join 2.4 lakh farmers already using Smart AgriTech Platform</p>
        <div className="cta-buttons">
          <button className="btn btn-white btn-lg" onClick={() => navigate('register')}>🌱 Get Started Free</button>
          <button className="btn btn-white-outline btn-lg" onClick={() => navigate('login')}>Sign In →</button>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="logo" style={{ color: 'white', marginBottom: 12 }}><div className="logo-icon">🌾</div>AgriTech</div>
              <p>Smart Agriculture Technology Platform — IoT monitoring, AI crop advisory, weather analytics, and marketplace for modern farming.</p>
            </div>
            <div className="footer-col"><h4>Platform</h4><a>Gov Connect</a><a>Equipment Finance</a><a>Crop Insurance</a><a>Marketplace</a></div>
            <div className="footer-col"><h4>Resources</h4><a>Documentation</a><a>API Reference</a><a>Blog</a><a>Help Center</a></div>
            <div className="footer-col"><h4>Company</h4><a>About Us</a><a>Careers</a><a>Privacy Policy</a><a>Terms of Service</a></div>
          </div>
          <div className="footer-bottom">
            <span>© 2025 Smart AgriTech Platform. Built for Indian Farmers. 🇮🇳</span>
            <span>Made with ❤️ by Sahil Arora — IILM University, Greater Noida</span>
          </div>
        </div>
      </footer>
    </>
  )
}
