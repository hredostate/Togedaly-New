
import React from 'react';
import type { Page } from '../App';
import type { LegalDocType } from '../types';

interface LegalProps {
  doc: LegalDocType;
  setPage: (page: Page) => void;
}

const legalContent = {
  terms: {
    title: 'Terms of Service & Risk Disclosure',
    content: `
      <p class="lead">Please read these Terms of Service carefully before using the Togedaly platform.</p>
      
      <h3>1. Nature of Service</h3>
      <p>Togedaly operates as a technology platform facilitating community finance and cooperative schemes. It is important to understand that:</p>
      <ul>
        <li><strong>We are not a bank.</strong> Togedaly is not a financial institution, bank, or insurance carrier.</li>
        <li><strong>Funds Custody.</strong> We do not hold deposits or pay interest. All funds flow directly through licensed Payment Service Providers (PSPs) such as Paystack, regulated by the Central Bank of Nigeria (CBN).</li>
        <li><strong>Fee-on-Flow.</strong> Our revenue model is based on service fees for facilitation. We do not invest user funds for our own profit.</li>
      </ul>

      <h3>2. Risk Disclosure</h3>
      <p>Participating in group ventures (Ajo, GroupBuy, Micro-investment) involves inherent risks:</p>
      <ul>
        <li><strong>Default Risk.</strong> In rotating savings (Ajo), there is a risk that a member may default on their payment. We mitigate this via Trust Scores and collateral, but cannot guarantee 100% compliance.</li>
        <li><strong>Vendor Risk.</strong> In Group Buys, external suppliers may fail to deliver or delay shipments. We vet suppliers, but external logistics are beyond our absolute control.</li>
        <li><strong>No Guaranteed Returns.</strong> Micro-investments are speculative. Past performance is not indicative of future results.</li>
      </ul>

      <h3>3. User Obligations</h3>
      <p>By using this platform, you agree to:</p>
      <ul>
        <li>Provide accurate identity information (KYC) including valid BVN/NIN.</li>
        <li>Maintain sufficient funds in your connected payment method for scheduled contributions.</li>
        <li>Use the platform for lawful purposes only. Fraudulent activity will result in immediate account termination and reporting to authorities.</li>
      </ul>

      <h3>4. Limitation of Liability</h3>
      <p>Togedaly provides its service on an "as is" basis. We shall not be liable for indirect, incidental, or consequential damages arising from platform use, except where required by Nigerian law.</p>

      <h3>5. Dispute Resolution</h3>
      <p>Disputes shall be resolved primarily through our internal mediation center. Unresolved disputes may be referred to the Lagos Multi-Door Courthouse for arbitration under the laws of the Federal Republic of Nigeria.</p>
    `,
  },
  privacy: {
    title: 'Privacy Policy',
    content: `
      <p class="lead">Your privacy is paramount. This policy outlines how we handle your data in compliance with the Nigeria Data Protection Act (NDPA).</p>

      <h3>1. Data Collection</h3>
      <p>We adhere to the principle of data minimization. We collect only what is necessary:</p>
      <ul>
        <li><strong>Identity Data:</strong> Name, Phone, Email, BVN/NIN (hashed/tokenized where possible).</li>
        <li><strong>Financial Data:</strong> Transaction history, Trust Score metrics. We <em>do not</em> store full card numbers.</li>
        <li><strong>Device Data:</strong> IP address and device fingerprints for fraud prevention.</li>
      </ul>

      <h3>2. Data Usage</h3>
      <p>Your data is used for:</p>
      <ul>
        <li>Verifying your identity (KYC).</li>
        <li>Processing payments via our PSP partners.</li>
        <li>Calculating your Trust Score and eligibility for pools.</li>
        <li>Sending transactional notifications (receipts, reminders).</li>
      </ul>

      <h3>3. Data Security</h3>
      <p>We employ enterprise-grade security measures:</p>
      <ul>
        <li>All Personally Identifiable Information (PII) is encrypted at rest (AES-256).</li>
        <li>Data in transit is secured via TLS 1.2+.</li>
        <li>Strict Role-Based Access Control (RBAC) limits internal access to your data.</li>
      </ul>

      <h3>4. Your Rights</h3>
      <p>Under the NDPA, you have the right to:</p>
      <ul>
        <li>Request a copy of your personal data.</li>
        <li>Request correction of inaccurate data.</li>
        <li>Request deletion of your account (subject to financial audit retention laws).</li>
      </ul>
    `,
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    content: `
      <h3>Wallet Top-Ups</h3>
      <p>Successful wallet top-ups are generally non-refundable as they are stored value. However, if a duplicate charge occurs due to a technical error, a full refund will be processed to the original payment method upon verification.</p>

      <h3>Group Buy Cancellations</h3>
      <ul>
        <li><strong>Pre-Lock:</strong> You may cancel your commitment before the deal is "Locked". Funds will be returned to your wallet immediately.</li>
        <li><strong>Post-Lock:</strong> Once a deal is locked and orders are placed with suppliers, cancellations are not permitted unless the supplier fails to deliver.</li>
        <li><strong>Failed Deals:</strong> If a Group Buy fails to reach its minimum target, all reserved funds are automatically refunded to your wallet.</li>
      </ul>

      <h3>Ajo (Savings) Pools</h3>
      <p>Ajo contributions are binding commitments to the group.</p>
      <ul>
        <li><strong>No Refunds:</strong> You cannot withdraw contributed funds until it is your rotation turn.</li>
        <li><strong>Early Exit:</strong> Voluntary exit during an active cycle is treated as a default. You may forfeit your contributions to cover the disruption to other members.</li>
      </ul>
    `,
  },
  support: {
    title: 'Support Policy & SLA',
    content: `
      <h3>Contact Channels</h3>
      <p>We are here to help. Reach us via:</p>
      <ul>
        <li><strong>In-App Support:</strong> Use the "Help" button in your dashboard.</li>
        <li><strong>Email:</strong> <a href="mailto:support@togedaly.com">support@togedaly.com</a></li>
        <li><strong>WhatsApp:</strong> +234 800 000 0000 (Chat Only)</li>
      </ul>

      <h3>Operating Hours</h3>
      <p><strong>Monday – Friday:</strong> 9:00 AM – 6:00 PM (WAT)<br>
      <strong>Weekends & Public Holidays:</strong> Limited support for urgent payment issues.</p>

      <h3>Service Level Agreement (SLA)</h3>
      <ul>
        <li><strong>Urgent Issues:</strong> (e.g., Stuck payments, locked account) - Response within 4 hours.</li>
        <li><strong>General Inquiries:</strong> Response within 24 hours.</li>
        <li><strong>Dispute Resolution:</strong> Initial review within 48 hours.</li>
      </ul>
    `,
  },
  compliance: {
    title: 'Regulatory & Compliance',
    content: `
      <h3>Our Legal Stance</h3>
      <p>Togedaly operates as a <strong>Cooperatives Support Platform</strong>. We provide the technology layer for groups to manage their shared finances.</p>
      
      <h3>Regulatory Alignment</h3>
      <ul>
        <li><strong>Payments:</strong> Processed exclusively by CBN-licensed Payment Service Providers (PSPs).</li>
        <li><strong>Data Privacy:</strong> Compliant with the Nigeria Data Protection Regulation (NDPR) and Nigeria Data Protection Act (NDPA).</li>
        <li><strong>AML/CFT:</strong> We perform rigorous KYC checks to comply with Anti-Money Laundering and Counter-Financing of Terrorism laws.</li>
      </ul>

      <h3>Audits</h3>
      <p>We undergo annual third-party audits for data privacy and security compliance to ensure your information and funds remain safe.</p>
    `
  }
};

const Legal: React.FC<LegalProps> = ({ doc, setPage }) => {
  const { title, content } = legalContent[doc] || { title: 'Document Not Found', content: '<p>The requested legal document could not be found.</p>' };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <button 
          onClick={() => setPage('landing')} 
          className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors mb-6"
        >
          <span className="bg-white border border-gray-200 rounded-full p-1 group-hover:border-brand-200 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </span>
          Back to Home
        </button>

        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-slate-50/80 border-b border-slate-100 px-8 py-10 md:px-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{title}</h1>
            <p className="text-slate-500 mt-3 font-medium">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          {/* Content Section */}
          <div className="px-8 py-10 md:px-12">
            <article className="prose prose-slate prose-lg max-w-none 
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:leading-relaxed prose-p:text-slate-600
              prose-li:text-slate-600 prose-li:marker:text-brand-500
              prose-strong:text-slate-800 prose-strong:font-bold
              prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline">
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </article>
          </div>

          {/* Footer Section of the Card */}
          <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-400">
              If you have any questions about this document, please contact <a href="#" onClick={(e) => { e.preventDefault(); setPage('support' as any); }} className="text-brand-600 font-medium hover:underline">Support</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legal;
