import React, { useState } from 'react';

const P   = '#5B21B6';
const PL  = '#7C3AED';
const PF  = '#EDE9FE';
const T1  = '#111827';
const T2  = '#6B7280';
const T3  = '#9CA3AF';
const BD  = '#E5E7EB';
const BG  = '#F9FAFB';
const W   = '#FFFFFF';
const GR  = '#059669';
const PAGE_SURFACE = 'radial-gradient(circle at top left, rgba(124,58,237,0.16), transparent 32%), linear-gradient(135deg, #f8f5ff 0%, #f9fafb 100%)';

function Icon({ name, size = 15, color = T3 }) {
  const s = { width: size, height: size, flexShrink: 0 };
  const paths = {
    help: <><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" fill="none" /><path d="M9 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" /><line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" /></>,
    menu: <><line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" /><line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" /><line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></>,
    book: <><path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" /><path d="M4 15h16" stroke={color} strokeWidth="1.5" /></>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.5" fill="none" /><path d="M2 6l10 7 10-7" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    search: <><circle cx="11" cy="11" r="8" stroke={color} strokeWidth="1.5" fill="none" /><line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></>,
  };
  return <svg viewBox="0 0 24 24" style={s}>{paths[name]}</svg>;
}

export default function HelpPage({ onBack, onToggleSidebar, isMobile, isTablet }) {
  const isMobileLocal = isMobile !== undefined ? isMobile : (typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const isTabletLocal = isTablet !== undefined ? isTablet : (typeof window !== 'undefined' ? window.innerWidth >= 640 && window.innerWidth < 1024 : false);
  const [expandedId, setExpandedId] = useState(null);

  const faqs = [
    {
      id: 1,
      category: 'Getting Started',
      question: 'How do I get started with Tribes Capital?',
      answer: 'Create an account, complete your profile, and start exploring our courses and resources. Our onboarding guide will walk you through everything you need to know.',
    },
    {
      id: 2,
      category: 'Courses',
      question: 'Can I download course materials?',
      answer: 'Yes, most course materials are available for download. You\'ll find download links in each lesson. Some premium content may have restrictions.',
    },
    {
      id: 3,
      category: 'Courses',
      question: 'What is the course completion timeline?',
      answer: 'Courses are self-paced, so you can complete them at your own speed. Most courses can be completed within 2-6 weeks with regular engagement.',
    },
    {
      id: 4,
      category: 'Community',
      question: 'How can I connect with other members?',
      answer: 'Join our office hours and member circles to connect with peers. You can also participate in our community forums and events.',
    },
    {
      id: 5,
      category: 'Account',
      question: 'How do I reset my password?',
      answer: 'Click "Forgot Password" on the login page and follow the instructions. You\'ll receive an email with a reset link.',
    },
    {
      id: 6,
      category: 'Technical',
      question: 'What browsers are supported?',
      answer: 'Tribes Capital works best on Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience.',
    },
  ];

  const contactMethods = [
    { icon: 'mail', label: 'Email Support', value: 'info@tribescapital', action: 'mailto:info@tribescapital' },
    { icon: 'book', label: 'Documentation', value: 'Knowledge Base', action: '#' },
  ];

  const toggleFaq = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', fontSize: 14, color: T1, background: PAGE_SURFACE }}>
      {/* HEADER */}
      <div style={{ padding: isMobileLocal ? '12px 16px' : '20px 24px', borderBottom: `1px solid rgba(124, 58, 237, 0.16)`, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 12px 40px rgba(91,33,182,0.06)' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: PF, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="help" size={20} color={P} />
        </div>
        <div>
          <h1 style={{ fontSize: isMobileLocal ? 18 : 24, fontWeight: 700, color: T1, margin: '0 0 4px' }}>Help & Support</h1>
          <p style={{ fontSize: 12, color: T2, margin: 0 }}>Find answers and get support when you need it</p>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobileLocal ? '16px' : '24px', background: BG }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Contact Methods */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: T1, margin: '0 0 16px' }}>Get in Touch</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobileLocal ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
              {contactMethods.map((method) => (
                <a
                  key={method.label}
                  href={method.action}
                  style={{
                    background: 'rgba(255,255,255,0.82)',
                    border: '1px solid rgba(124, 58, 237, 0.16)',
                    borderRadius: 16,
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    textDecoration: 'none',
                    color: T1,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
                    backdropFilter: 'blur(18px)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobileLocal) {
                      e.currentTarget.style.background = 'rgba(237,233,254,0.9)';
                      e.currentTarget.style.borderColor = P;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobileLocal) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.82)';
                      e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.16)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div style={{ width: 40, height: 40, background: PF, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={method.icon} size={18} color={P} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T1, margin: '0 0 2px' }}>{method.label}</p>
                    <p style={{ fontSize: 12, color: T2, margin: 0 }}>{method.value}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: T1, margin: '0 0 16px' }}>Frequently Asked Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(124, 58, 237, 0.14)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(18px)',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      color: T1,
                      fontWeight: 500,
                      fontSize: 14,
                      textAlign: 'left',
                      transition: 'background 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isMobileLocal) e.currentTarget.style.background = 'rgba(237,233,254,0.7)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobileLocal) e.currentTarget.style.background = 'none';
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: P, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 4px' }}>{faq.category}</p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: T1, margin: 0 }}>{faq.question}</p>
                    </div>
                    <span style={{ flexShrink: 0, marginLeft: 12, color: T3, fontSize: 12, transition: 'transform 0.3s', transform: expandedId === faq.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      ▼
                    </span>
                  </button>
                  {expandedId === faq.id && (
                    <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${BD}`, background: BG }}>
                      <p style={{ fontSize: 14, color: T2, margin: 0, lineHeight: 1.6 }}>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
