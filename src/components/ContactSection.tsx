import React, { useState } from 'react';
import type { PortfolioConfig } from '../types/portfolio';

interface ContactSectionProps {
  config?: PortfolioConfig | null;
}

const CURRENT_YEAR = new Date().getFullYear();

export const ContactSection: React.FC<ContactSectionProps> = ({ config }) => {
  const [copied, setCopied] = useState(false);

  const email = config?.email || '';
  const whatsapp = config?.whatsapp;
  const whatsappUrl = config?.whatsapp_url;
  const githubUrl = config?.github_url;
  const githubName = config?.github;
  const instagramUrl = config?.instagram_url;
  const instagramName = config?.instagram;
  const youtubeUrl = config?.youtube_url;
  const youtubeName = config?.youtube;
  const letterboxdUrl = config?.letterboxd_url;
  const letterboxdName = config?.letterboxd;
  const facebookUrl = config?.facebook;

  const copyEmail = () => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const socialLinks = [
    { name: 'GitHub', url: githubUrl, handle: githubName ? `@${githubName}` : '' },
    { name: 'Instagram', url: instagramUrl, handle: instagramName ? `@${instagramName}` : '' },
    { name: 'WhatsApp', url: whatsappUrl, handle: whatsapp || '' },
    { name: 'YouTube', url: youtubeUrl, handle: youtubeName ? `@${youtubeName}` : '' },
    { name: 'Letterboxd', url: letterboxdUrl, handle: letterboxdName ? `@${letterboxdName}` : '' },
    { name: 'Facebook', url: facebookUrl, handle: '' },
  ].filter((item) => Boolean(item.url));

  return (
    <section id="contacts" className="section contact-section">
      <div className="section-container">
        <div className="section-header">
          <span className="section-eyebrow">Summon & Inquire</span>
          <h2 className="section-title gothic-heading">Direct Correspondence</h2>
          <p className="section-subtitle">
            Seeking to forge reliable software or collaborate on an upcoming endeavor?
          </p>
        </div>

        <div className="contact-card-glass">
          <div className="contact-display-layout">
            {/* Top Status & Lead */}
            <div className="contact-header-block">
              
              <p className="contact-lead-text">
                Feel free to reach out directly via electronic dispatch or connect through social channels.
              </p>
            </div>

            {/* Primary Contact Channels */}
            <div className="contact-methods-grid">
              {/* Email Card */}
              {email && (
                <div className="contact-method-card">
                  <div className="method-icon-wrap">✉</div>
                  <div className="method-details">
                    <span className="method-type">Electronic Mail</span>
                    <span className="method-value">{email}</span>
                  </div>
                  <div className="method-actions">
                    <button
                      type="button"
                      className="contact-action-btn copy-btn"
                      onClick={copyEmail}
                      aria-label="Copy email address"
                    >
                      {copied ? 'Copied ✓' : 'Copy Email'}
                    </button>
                    <a
                      href={`mailto:${email}`}
                      className="contact-action-btn mail-btn"
                    >
                      Compose ↗
                    </a>
                  </div>
                </div>
              )}

              {/* WhatsApp Card */}
              {whatsappUrl && (
                <div className="contact-method-card">
                  <div className="method-icon-wrap">💬</div>
                  <div className="method-details">
                    <span className="method-type">Instant Dispatch</span>
                    <span className="method-value">{whatsapp || 'WhatsApp Direct'}</span>
                  </div>
                  <div className="method-actions">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="contact-action-btn wa-btn"
                    >
                      Open WhatsApp ↗
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Social & Portal Channels */}
            {socialLinks.length > 0 && (
              <div className="contact-socials-block">
                <span className="socials-label">Online Channels & Profiles</span>
                <div className="contact-social-grid">
                  {socialLinks.map((item) => (
                    <a
                      key={item.name}
                      href={item.url!}
                      target="_blank"
                      rel="noreferrer"
                      className="contact-social-card"
                    >
                      <div className="social-card-info">
                        <span className="social-card-name">{item.name}</span>
                        {item.handle && <span className="social-card-handle">{item.handle}</span>}
                      </div>
                      <span className="social-card-arrow">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="portfolio-footer">
          <p>© {CURRENT_YEAR} {config?.name || 'Portfolio'}. All rights reserved.</p>
        </footer>
      </div>
    </section>
  );
};
