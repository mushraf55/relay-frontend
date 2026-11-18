"use client";

import { ExternalLink, FileText, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { BrandMark, Icon } from "@/components/icon";
import "./core-home.css";

const frontendRepository = "https://github.com/mushraf55/relay-frontend";
const backendRepository = "https://github.com/mushraf55/relay-backend";

function Arrow() { return <Icon name="arrow" size={17} />; }
function GitHubMark({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .7A11.3 11.3 0 0 0 8.4 22.8c.6.1.8-.2.8-.6v-2.1c-3.4.7-4.1-1.4-4.1-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6A4.7 4.7 0 0 1 5.7 8c-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.6 1.3a12.4 12.4 0 0 1 6.5 0c2.5-1.7 3.6-1.3 3.6-1.3.6 1.7.2 3 .1 3.3a4.7 4.7 0 0 1 1.3 3.3c0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.2c0 .4.2.7.8.6A11.3 11.3 0 0 0 12 .7Z" /></svg>;
}

function RepositoryMenu() {
  return <details className="home-repositories">
    <summary aria-label="Open Relay GitHub repositories"><GitHubMark /><span>GitHub</span></summary>
    <div className="home-repositories__menu"><p>Source code</p>
      <a href={frontendRepository} target="_blank" rel="noreferrer"><span><b>Frontend</b><small>Next.js application</small></span><ExternalLink size={15} /></a>
      <a href={backendRepository} target="_blank" rel="noreferrer"><span><b>Backend</b><small>Express API</small></span><ExternalLink size={15} /></a>
    </div>
  </details>;
}

function ProductStage() {
  return <div className="product-stage" aria-label="Relay answering a question from connected knowledge">
    <div className="product-stage__topbar"><span><BrandMark className="size-6" />Relay workspace</span><b>Knowledge ready</b></div>
    <div className="product-stage__body">
      <aside className="source-rail"><p>Connected knowledge</p>
        <div className="source-rail__item is-active"><FileText size={16} /><span><b>Returns policy.pdf</b><small>18 chunks · Ready</small></span></div>
        <div className="source-rail__item"><Globe2 size={16} /><span><b>acme.example/help</b><small>10 pages · Ready</small></span></div>
        <div className="source-rail__status"><i />2 sources searchable</div>
      </aside>
      <section className="stage-chat"><div className="stage-chat__header"><span>Website support bot</span><b>Live preview</b></div>
        <div className="stage-chat__messages"><div className="message message--customer"><small>Customer</small>Can I return an opened item?</div>
          <div className="message message--relay"><span className="message__author"><BrandMark className="size-5" />Relay</span><p>Opened items can be returned within 14 days when they are complete and undamaged.</p><a href="#evidence"><FileText size={13} />Returns policy.pdf</a></div>
        </div>
        <div className="stage-chat__composer"><span>Ask from connected knowledge</span><Icon name="send" size={16} /></div>
      </section>
      <aside className="evidence-panel" id="evidence"><span>Evidence</span><h3>Returns policy.pdf</h3><p>“Opened products remain eligible within 14 days when all original parts are included and the item is undamaged.”</p><div><b>Match found</b><small>Answer grounded in source</small></div></aside>
    </div>
  </div>;
}

export default function CoreHome() {
  return <div className="relay-home">
    <header className="home-nav"><div className="home-shell home-nav__inner">
      <Link href="#top" className="home-logo" aria-label="Relay home"><BrandMark className="size-8" /><span>Relay.</span></Link>
      <nav className="home-nav__links" aria-label="Main navigation"><Link href="#product">Product</Link><Link href="#how">How it works</Link><Link href="#build">Engineering</Link></nav>
      <div className="home-nav__actions"><RepositoryMenu /><Link href="/login" className="home-sign-in">Sign in</Link><Link href="/signup" className="home-button home-button--small">Build a chatbot <Arrow /></Link></div>
    </div></header>

    <main id="top">
      <section className="home-hero"><div className="home-shell">
        <div className="home-hero__copy"><h1>Answers your customers can verify.</h1><p>Turn your documents and web pages into a support chatbot that answers from your knowledge, cites the source, and knows when it does not have enough information.</p>
          <div className="home-hero__actions"><Link href="/signup" className="home-button">Start building free <Arrow /></Link><Link href="#product" className="home-button home-button--quiet">See Relay work</Link></div>
          <div className="home-hero__facts"><span><ShieldCheck size={16} />Grounded answers</span><span><FileText size={16} />PDF and text</span><span><Globe2 size={16} />Up to 15 web pages</span></div>
        </div>
        <ProductStage />
      </div></section>

      <section className="proof-strip" aria-label="Relay product capabilities"><div className="home-shell"><p><b>From source to published chatbot</b><span>Ingest</span><i /><span>Retrieve</span><i /><span>Answer</span><i /><span>Cite</span><i /><span>Publish</span></p></div></section>

      <section className="home-section product-proof" id="product"><div className="home-shell">
        <div className="section-intro"><h2>A useful answer is only half the job.</h2><p>Relay keeps the supporting evidence close enough to inspect. Small teams get a practical support tool; visitors can see why an answer deserves trust.</p></div>
        <div className="proof-layout"><article className="proof-answer"><div className="proof-answer__question">What does the warranty cover?</div><div className="proof-answer__reply"><span><BrandMark className="size-6" />Relay</span><p>The warranty covers manufacturing defects for 12 months from the purchase date. Accidental damage is excluded.</p><a href="#product"><FileText size={14} />Warranty guide.pdf</a></div></article>
          <div className="proof-notes"><article><span>01</span><div><h3>Evidence stays visible</h3><p>Every grounded response can name the document or webpage that supported it.</p></div></article><article><span>02</span><div><h3>Weak matches stop safely</h3><p>When retrieval confidence is poor, Relay uses the configured fallback instead of unrelated context.</p></div></article><article><span>03</span><div><h3>Publish where people need it</h3><p>Share a hosted page or add the chatbot to a website with an embed.</p></div></article></div>
        </div>
      </div></section>

      <section className="home-section workflow" id="how"><div className="home-shell">
        <div className="section-intro section-intro--compact"><h2>Build the knowledge once. Test before you publish.</h2><p>The workflow keeps setup understandable for a small team without hiding what is happening to its content.</p></div>
        <div className="workflow-track"><article><span>Connect</span><h3>Add useful knowledge</h3><p>Upload a text-based PDF, paste text, or scrape a public HTTPS website.</p><div className="workflow-file"><FileText size={18} /><span><b>Service handbook.pdf</b><small>Uploading · 72%</small></span><i style={{ "--progress": "72%" } as CSSProperties} /></div></article>
          <article><span>Verify</span><h3>Ask real questions</h3><p>Test the chatbot and check the cited source before anyone else sees it.</p><div className="workflow-check"><Sparkles size={18} /><span><b>Answer grounded</b><small>2 relevant chunks retrieved</small></span></div></article>
          <article><span>Publish</span><h3>Choose the right surface</h3><p>Open a public share page or copy the website embed when the answers are ready.</p><div className="workflow-actions"><span>Share page</span><span>Copy embed</span></div></article>
        </div>
      </div></section>

      <section className="home-section engineering" id="build"><div className="home-shell engineering__grid">
        <div className="engineering__copy"><h2>Built as a real full-stack product.</h2><p>Relay is also a portfolio project by Mushraf Moosa Shaikh. The interface, API, retrieval pipeline, storage, authentication, and production safeguards are implemented as separate, inspectable layers.</p>
          <div className="engineering__links"><a href={frontendRepository} target="_blank" rel="noreferrer"><GitHubMark size={18} /><span><b>Frontend repository</b><small>Next.js 16 · React 19 · TypeScript</small></span><ExternalLink size={15} /></a><a href={backendRepository} target="_blank" rel="noreferrer"><GitHubMark size={18} /><span><b>Backend repository</b><small>Express 5 · PostgreSQL · pgvector</small></span><ExternalLink size={15} /></a></div>
        </div>
        <div className="architecture" aria-label="Relay technical architecture"><div><span>01</span><b>Client</b><small>Next.js, React, Clerk</small></div><i /><div><span>02</span><b>API</b><small>Express, Zod, rate limits</small></div><i /><div><span>03</span><b>Retrieval</b><small>Embeddings, PostgreSQL, pgvector</small></div><i /><div><span>04</span><b>Delivery</b><small>Private files, share page, embed</small></div></div>
      </div></section>

      <section className="home-section home-faq"><div className="home-shell"><div className="section-intro section-intro--compact"><h2>Know the boundaries before you connect a source.</h2></div><div className="home-faq__grid"><article><h3>Which files work?</h3><p>Relay accepts text-based PDF and TXT content. Scanned PDFs need text recognition before indexing.</p></article><article><h3>How much can a website scrape?</h3><p>Choose 5, 10, or 15 pages for a public HTTPS website.</p></article><article><h3>Where is retrieval stored?</h3><p>Knowledge chunks and embeddings are stored in PostgreSQL with pgvector.</p></article><article><h3>What happens without a strong match?</h3><p>Relay returns the chatbot’s configured fallback instead of passing unrelated context to the model.</p></article></div></div></section>
    </main>

    <footer className="home-footer"><div className="home-shell"><div className="home-footer__lead"><h2>Give your knowledge a useful front door.</h2><p>Connect one source, test one real question, and publish only when the answer is ready.</p><Link href="/signup" className="home-button home-button--dark">Build your first chatbot <Arrow /></Link></div><div className="home-footer__bottom"><Link href="#top" className="home-logo"><BrandMark className="size-8" /><span>Relay.</span></Link><nav aria-label="Footer navigation"><Link href="#product">Product</Link><Link href="#how">How it works</Link><Link href="#build">Engineering</Link><Link href="/login">Sign in</Link></nav><span>© 2026 Relay</span></div></div></footer>
  </div>;
}
