import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BookOpen, CheckCircle2, CircleHelp, Globe, Headphones, Mail, MessageCircle,
  MessageSquare, PhoneCall, Radio, Send, ShieldCheck, Sparkles, User, Zap
} from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

export type SupportLanguage = 'mr' | 'en' | 'hi';

interface SupportContent {
  title: string;
  quote: string;
  badge: string;
  role: string;
  highlights: string[];
}

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <section class="page page-enter">
      <!-- HEADER -->
      <div class="page-heading">
        <div>
          <p class="eyebrow">Support & Guidance</p>
          <h1>Help & Customer Support Center</h1>
          <p class="page-subtitle">Get instant technical assistance, user guides, and dedicated support for your MsgFlow workspace.</p>
        </div>
        <div class="header-badges">
          <span class="status-live-badge"><span class="dot"></span>24/7 Dedicated Support</span>
        </div>
      </div>

      <!-- MAIN CONTACT & SUPPORT HERO CARD -->
      <div class="support-hero-card surface">
        <div class="hero-left">
          <div class="avatar-ring">
            <div class="avatar-box">
              <lucide-angular [img]="User" [size]="32" />
            </div>
            <span class="status-badge-ring"></span>
          </div>

          <div class="contact-details">
            <div class="badge-label">Lead Support & Technical Operations</div>
            <h2 class="contact-name">Vinayak Bhoskar</h2>
            <p class="contact-role">MsgFlow Platform Specialist & Multi-Broadcast Lead</p>

            <div class="contact-chips">
              <a href="tel:+917499415916" class="chip-item phone-chip" title="Direct Phone Call">
                <lucide-angular [img]="PhoneCall" [size]="16" />
                <span><strong>+91 7499415916</strong></span>
              </a>

              <a
                href="https://wa.me/917499415916?text=Hello%20Vinayak%2C%20I%20need%20assistance%20with%20MsgFlow%20WhatsApp%20Platform"
                target="_blank"
                class="chip-item whatsapp-chip"
                title="Open WhatsApp Chat"
              >
                <lucide-angular [img]="MessageCircle" [size]="16" />
                <span>Chat on WhatsApp</span>
              </a>

              <div class="chip-item timing-chip">
                <lucide-angular [img]="Headphones" [size]="15" />
                <span>Instant Call / Chat Response (24x7)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="hero-right">
          <!-- OFFICIAL SUPPORT MESSAGE WITH MULTI-LANGUAGE SELECTOR -->
          <div class="executive-message-box">
            <div class="message-quote-header">
              <div class="title-wrap">
                <lucide-angular [img]="Sparkles" [size]="16" />
                <span>{{ currentContent().badge }}</span>
              </div>

              <!-- LANGUAGE SWITCHER PILLS -->
              <div class="lang-selector-group">
                <button
                  type="button"
                  class="lang-pill"
                  [class.lang-pill-active]="selectedLang() === 'mr'"
                  (click)="setLang('mr')"
                >
                  🚩 मराठी
                </button>
                <button
                  type="button"
                  class="lang-pill"
                  [class.lang-pill-active]="selectedLang() === 'en'"
                  (click)="setLang('en')"
                >
                  🌐 English
                </button>
                <button
                  type="button"
                  class="lang-pill"
                  [class.lang-pill-active]="selectedLang() === 'hi'"
                  (click)="setLang('hi')"
                >
                  🇮🇳 हिंदी
                </button>
              </div>
            </div>

            <!-- DYNAMIC QUOTE IN SELECTED LANGUAGE -->
            <div class="quote-content-area">
              <p class="marathi-quote" [innerHTML]="currentContent().quote"></p>
            </div>

            <div class="author-sign">
              <strong>— विनायक भोसकर (Vinayak Bhoskar)</strong>
              <small>{{ currentContent().role }}</small>
            </div>
          </div>

          <!-- DIRECT ACTION BUTTONS -->
          <div class="action-buttons-group">
            <a href="tel:+917499415916" class="button button-primary call-btn">
              <lucide-angular [img]="PhoneCall" [size]="16" />
              <span>Call +91 7499415916</span>
            </a>
            <a
              href="https://wa.me/917499415916?text=Hi%20Vinayak%2C%20I%20have%20a%20query%20regarding%20MsgFlow%20features"
              target="_blank"
              class="button button-secondary wa-btn"
            >
              <lucide-angular [img]="MessageCircle" [size]="16" />
              <span>Direct WhatsApp Message</span>
            </a>
          </div>
        </div>
      </div>

      <!-- QUICK TROUBLESHOOTING & SYSTEM GUIDES -->
      <div class="guides-section">
        <h2 class="section-title">Common Topics & Quick Tutorials</h2>
        <div class="cards-grid">
          <!-- CARD 1 -->
          <div class="guide-card surface">
            <div class="card-icon-wrap icon-green">
              <lucide-angular [img]="Send" [size]="20" />
            </div>
            <h3>Multi-Contact & Group Broadcasting</h3>
            <p>Select 10, 20 or all contacts/groups simultaneously with 1-click select toolbar to blast announcements instantly.</p>
            <a routerLink="/messages/send" class="card-action-link">Open Send Message →</a>
          </div>

          <!-- CARD 2 -->
          <div class="guide-card surface">
            <div class="card-icon-wrap icon-blue">
              <lucide-angular [img]="Zap" [size]="20" />
            </div>
            <h3>50MB Media Attachment Support</h3>
            <p>Send high-res Photos, PDF Documents, MP3/Audio Songs, and Video clips seamlessly with zero compression issues.</p>
            <a routerLink="/messages/send" class="card-action-link">Attach Media →</a>
          </div>

          <!-- CARD 3 -->
          <div class="guide-card surface">
            <div class="card-icon-wrap icon-emerald">
              <lucide-angular [img]="Radio" [size]="20" />
            </div>
            <h3>WhatsApp Connection & Session</h3>
            <p>Scan the QR code once to link your device. The Baileys socket session remains connected even across logouts.</p>
            <a routerLink="/whatsapp" class="card-action-link">WhatsApp Settings →</a>
          </div>

          <!-- CARD 4 -->
          <div class="guide-card surface">
            <div class="card-icon-wrap icon-purple">
              <lucide-angular [img]="ShieldCheck" [size]="20" />
            </div>
            <h3>Account & Privacy Protection</h3>
            <p>Multi-tenant isolated database keeps your customer contacts, groups, and logs secure and strictly private.</p>
            <a routerLink="/settings" class="card-action-link">Security Settings →</a>
          </div>
        </div>
      </div>

      <!-- FAQ ACCORDION SUMMARY -->
      <div class="faq-summary surface">
        <h3>Frequently Asked Questions</h3>
        <div class="faq-list">
          <div class="faq-item">
            <strong>Q: एकाच वेळी १०-२० ग्रुप्स किंवा सर्व कॉन्टॅक्ट्स कसे निवडायचे? (How to select multiple groups?)</strong>
            <p><strong>Send Message</strong> किंवा <strong>Groups</strong> टॅबमध्ये जा, तेथे उपलब्ध असणारे <strong>Select All Groups</strong> बटण दाबा किंवा हव्या त्या ग्रुप्सचे चेकबॉक्स टिक करा आणि थेट मेसेज पाठवा.</p>
          </div>
          <div class="faq-item">
            <strong>Q: 50MB पर्यंत गाणी, ऑडिओ किंवा व्हिडिओ कसे पाठवायचे?</strong>
            <p>Send Message पेजवर <strong>Songs/Audio</strong>, <strong>Photos/Image</strong>, <strong>PDF/Doc</strong>, किंवा <strong>Video</strong> यापैकी योग्य बटणावर क्लिक करून तुमची फाईल जोडा आणि पाठवा.</p>
          </div>
          <div class="faq-item">
            <strong>Q: लॉगआउट केल्यानंतर व्हॉट्सअ‍ॅप डिस्कनेक्ट होईल का?</strong>
            <p>नाही! अकाउंट साइन-आउट केले तरी व्हॉट्सअ‍ॅप कनेक्टेडच राहील. जोपर्यंत तुम्ही Channels टॅबमध्ये जाऊन <strong>Disconnect</strong> करत नाही तोपर्यंत सेशन चालू राहील.</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .header-badges { display: flex; align-items: center; }
    .status-live-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: var(--green-wash);
      color: var(--green);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid rgba(37, 211, 102, 0.25);
    }
    .status-live-badge .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 8px var(--green);
      animation: pulse-dot 2s infinite;
    }
    @keyframes pulse-dot {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }

    /* ---------------- HERO CARD ---------------- */
    .support-hero-card {
      display: grid;
      grid-template-columns: 1.05fr 1.15fr;
      gap: 28px;
      padding: 30px 32px;
      border-radius: 16px;
      margin-bottom: 32px;
      background: linear-gradient(135deg, var(--surface) 0%, var(--surface-muted) 100%);
      border: 1px solid var(--card-border);
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
    }

    .support-hero-card::before {
      content: '';
      position: absolute;
      top: -40px;
      right: -40px;
      width: 220px;
      height: 220px;
      background: radial-gradient(circle, var(--green-wash) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-left {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }

    .avatar-ring {
      position: relative;
      flex-shrink: 0;
    }

    .avatar-box {
      width: 68px;
      height: 68px;
      border-radius: 18px;
      background: linear-gradient(135deg, #25d366 0%, #10b981 100%);
      color: #032014;
      display: grid;
      place-items: center;
      box-shadow: 0 8px 24px rgba(37, 211, 102, 0.35);
    }

    .status-badge-ring {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #25d366;
      border: 3px solid var(--surface);
      box-shadow: 0 0 10px #25d366;
    }

    .contact-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .badge-label {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--green);
    }

    .contact-name {
      font-size: 25px;
      font-weight: 800;
      color: var(--ink);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .contact-role {
      font-size: 12px;
      color: var(--ink-soft);
      margin: 0 0 12px;
    }

    .contact-chips {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .chip-item {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      padding: 7px 13px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      width: fit-content;
    }

    .phone-chip {
      background: var(--green-wash);
      color: var(--green);
      border: 1px solid rgba(37, 211, 102, 0.3);
    }

    .phone-chip:hover {
      transform: translateX(3px);
      background: rgba(37, 211, 102, 0.25);
    }

    .whatsapp-chip {
      background: #25d366;
      color: #041f14;
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(37, 211, 102, 0.3);
    }

    .whatsapp-chip:hover {
      transform: translateX(3px);
      box-shadow: 0 6px 18px rgba(37, 211, 102, 0.45);
    }

    .timing-chip {
      background: var(--surface-muted);
      color: var(--ink-soft);
      border: 1px solid var(--line);
      font-size: 11px;
    }

    .hero-right {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;
    }

    .executive-message-box {
      background: var(--surface-muted);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 16px 18px;
      position: relative;
    }

    .message-quote-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }

    .title-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--green);
    }

    /* LANGUAGE SELECTOR PILLS */
    .lang-selector-group {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 7px;
      padding: 2px;
    }

    .lang-pill {
      border: 0;
      background: transparent;
      color: var(--ink-soft);
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.16s ease;
    }

    .lang-pill:hover {
      color: var(--ink);
      background: var(--surface-hover);
    }

    .lang-pill-active {
      background: var(--green) !important;
      color: #ffffff !important;
      box-shadow: 0 2px 6px rgba(37, 211, 102, 0.3);
    }

    .quote-content-area {
      min-height: 72px;
      display: flex;
      align-items: center;
    }

    .marathi-quote {
      font-size: 13px;
      line-height: 1.65;
      color: var(--ink);
      margin: 0 0 8px;
      animation: text-fade 0.25s ease-in-out;
    }

    @keyframes text-fade {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .author-sign {
      display: flex;
      flex-direction: column;
      font-size: 11px;
      color: var(--ink-soft);
    }

    .author-sign strong {
      color: var(--ink);
      font-size: 12px;
    }

    .action-buttons-group {
      display: flex;
      gap: 10px;
    }

    .call-btn {
      flex: 1;
      height: 42px;
      background: linear-gradient(135deg, #25d366 0%, #10b981 100%);
      color: #032014;
      font-weight: 800;
      box-shadow: 0 4px 14px rgba(37, 211, 102, 0.3);
    }

    .wa-btn {
      flex: 1;
      height: 42px;
      font-weight: 700;
    }

    /* ---------------- COMMON TOPICS / GUIDES ---------------- */
    .guides-section {
      margin-bottom: 30px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 800;
      margin: 0 0 16px;
      color: var(--ink);
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .guide-card {
      padding: 20px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
      transition: all 0.2s;
    }

    .guide-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
      border-color: var(--green);
    }

    .card-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: grid;
      place-items: center;
    }

    .icon-green { background: var(--green-wash); color: var(--green); }
    .icon-blue { background: rgba(56, 189, 248, 0.15); color: #0284c7; }
    .icon-emerald { background: rgba(16, 185, 129, 0.15); color: #059669; }
    .icon-purple { background: rgba(168, 85, 247, 0.15); color: #9333ea; }

    .guide-card h3 {
      font-size: 14px;
      font-weight: 700;
      color: var(--ink);
      margin: 0;
    }

    .guide-card p {
      font-size: 12px;
      color: var(--ink-soft);
      line-height: 1.55;
      margin: 0;
    }

    .card-action-link {
      font-size: 12px;
      font-weight: 700;
      color: var(--green);
      margin-top: 4px;
      text-decoration: none;
      transition: all 0.15s;
    }

    .card-action-link:hover {
      text-decoration: underline;
      transform: translateX(2px);
    }

    /* ---------------- FAQ ---------------- */
    .faq-summary {
      padding: 24px 28px;
      border-radius: 14px;
    }

    .faq-summary h3 {
      font-size: 16px;
      font-weight: 800;
      margin: 0 0 16px;
      color: var(--ink);
    }

    .faq-list {
      display: grid;
      gap: 15px;
    }

    .faq-item strong {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: var(--ink);
      margin-bottom: 4px;
    }

    .faq-item p {
      font-size: 12px;
      color: var(--ink-soft);
      line-height: 1.6;
      margin: 0;
    }

    @media (max-width: 860px) {
      .support-hero-card {
        grid-template-columns: 1fr;
        gap: 22px;
        padding: 22px;
      }
      .action-buttons-group {
        flex-direction: column;
      }
    }
  `],
})
export class HelpCenterComponent {
  readonly User = User;
  readonly PhoneCall = PhoneCall;
  readonly MessageCircle = MessageCircle;
  readonly Headphones = Headphones;
  readonly Sparkles = Sparkles;
  readonly Send = Send;
  readonly Zap = Zap;
  readonly Radio = Radio;
  readonly ShieldCheck = ShieldCheck;
  readonly Globe = Globe;

  readonly selectedLang = signal<SupportLanguage>('mr');

  private readonly contentMap: Record<SupportLanguage, SupportContent> = {
    mr: {
      title: 'मराठी सपोर्ट संदेश',
      badge: 'अधिकृत सपोर्ट संदेश',
      role: 'तांत्रिक ऑपरेशन्स आणि कस्टमर सपोर्ट लीड',
      quote: `"नमस्कार! MsgFlow प्लॅटफॉर्म वापरताना तुम्हाला कोणतीही तांत्रिक मदत हवी असल्यास, ग्रुप किंवा कॉन्टॅक्ट ब्रॉडकास्टिंग तसेच 50MB पर्यंत मीडिया फाईल्स पाठवताना अडचण येत असल्यास खालील नंबरवर थेट कॉल किंवा WhatsApp मेसेज करा. तुमचे काम <strong>एकदम ओके</strong> आणि सुरळीत सुरू ठेवणे ही आमची जबाबदारी आहे!"`,
      highlights: ['२४/७ थेट कॉल सपोर्ट', 'व्हॉट्सअ‍ॅपवर तात्काळ मदत', 'मल्टी-ब्रॉडकास्ट मार्गदर्शन'],
    },
    en: {
      title: 'English Support Message',
      badge: 'Official Support Message',
      role: 'Technical Operations & Customer Support Lead',
      quote: `"Hello! If you need any technical assistance with the MsgFlow platform — including multi-contact group broadcasting, 50MB media delivery (songs, video, PDF), or session connectivity — feel free to reach out directly via call or WhatsApp. We guarantee your operations run <strong>100% OK and seamless</strong>!"`,
      highlights: ['24/7 Dedicated Assistance', 'Instant WhatsApp Response', 'Broadcast Optimization'],
    },
    hi: {
      title: 'हिंदी सपोर्ट संदेश',
      badge: 'आधिकारिक सपोर्ट संदेश',
      role: 'टेक्निकल ऑपरेशंस और कस्टमर सपोर्ट हेड',
      quote: `"नमस्ते! MsgFlow प्लेटफ़ॉर्म का उपयोग करते समय यदि आपको कोई भी तकनीकी सहायता चाहिए, ग्रुप या कॉन्टैक्ट ब्रॉडकास्टिंग और 50MB मीडिया फाइल्स भेजने में कोई समस्या आ रही हो, तो नीचे दिए गए नंबर पर तुरंत कॉल या WhatsApp करें। आपका काम <strong>एकदम ओके और आसान</strong> रखना हमारी सर्वोच्च प्राथमिकता है!"`,
      highlights: ['२४x७ डायरेक्ट कॉल सपोर्ट', 'व्हाट्सएप पर तुरंत समाधान', 'मल्टी-मैसेजिंग सहायता'],
    },
  };

  currentContent(): SupportContent {
    return this.contentMap[this.selectedLang()];
  }

  setLang(lang: SupportLanguage): void {
    this.selectedLang.set(lang);
  }
}
