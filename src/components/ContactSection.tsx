import React, { useState } from 'react';
import type { PortfolioConfig } from '../types/portfolio';

interface ContactSectionProps {
  config?: PortfolioConfig | null;
}

const CURRENT_YEAR = new Date().getFullYear();

export const ContactSection: React.FC<ContactSectionProps> = ({ config }) => {
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');

  const email = config?.email || '';
  const whatsappUrl = config?.whatsapp_url;
  const githubUrl = config?.github_url;
  const instagramUrl = config?.instagram_url;
  const youtubeUrl = config?.youtube_url;
  const letterboxdUrl = config?.letterboxd_url;
  const facebookUrl = config?.facebook;

  const copyEmail = () => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      alert('Email address is currently not configured.');
      return;
    }

    // Trigger direct mailto with subject and body
    const subject = encodeURIComponent(`Portfolio Inquiry from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${senderEmail}\n\nMessage:\n${message}`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

    setSubmitted(true);
    setTimeout(() => {
      setName('');
      setSenderEmail('');
      setMessage('');
      setSubmitted(false);
    }, 4000);
  };

  return (
    <section id="contacts" className="section contact-section">
      <div className="section-container">
        <div className="section-header">
          <span className="section-eyebrow">Summon & Inquire</span>
          <h2 className="section-title gothic-heading">Dispatch a Message</h2>
          <p className="section-subtitle">
            Seeking to forge reliable software or collaborate on an upcoming endeavor?
          </p>
        </div>

        <div className="contact-card-glass">
          <div className="contact-inner">
            <div className="contact-info">
              <h3 className="contact-heading">Direct Correspondence</h3>
              <p className="contact-text">
                Available for software engineering roles, fullstack web applications, and
                architectural consulting.
              </p>

              {email && (
                <div className="email-copy-box">
                  <span className="email-address">{email}</span>
                  <button
                    type="button"
                    className="copy-btn"
                    onClick={copyEmail}
                    aria-label="Copy email address"
                  >
                    {copied ? 'Copied to Clipboard ✓' : 'Copy Email'}
                  </button>
                </div>
              )}

              {/* Dynamic contact and social channels from API config */}
              <div className="social-links-row">
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="social-pill"
                  >
                    GitHub
                  </a>
                )}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="social-pill"
                  >
                    WhatsApp
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="social-pill"
                  >
                    Instagram
                  </a>
                )}
                {youtubeUrl && (
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="social-pill"
                  >
                    YouTube
                  </a>
                )}
                {letterboxdUrl && (
                  <a
                    href={letterboxdUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="social-pill"
                  >
                    Letterboxd
                  </a>
                )}
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="social-pill"
                  >
                    Facebook
                  </a>
                )}
              </div>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="e.g. Lord Julian"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Your Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@organization.com"
                  className="form-input"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="message" className="form-label">
                  Inquiry / Proposition
                </label>
                <textarea
                  id="message"
                  rows={4}
                  required
                  placeholder="Detail your quest or requirements..."
                  className="form-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button type="submit" className="submit-btn">
                {submitted ? 'Dispatch Transmitted ✓' : 'Transmit Dispatch →'}
              </button>
            </form>
          </div>
        </div>

        <footer className="portfolio-footer">
          <p>© {CURRENT_YEAR} {config?.name || 'Portfolio'}. All rights reserved.</p>
          <p className="footer-sub">
            Constructed with Laravel spirit, React, Three.js & Modern Web standards.
          </p>
        </footer>
      </div>
    </section>
  );
};
