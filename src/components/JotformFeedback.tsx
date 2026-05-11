'use client';

import { useEffect } from 'react';

const FEEDBACK_JS = 'https://cdn.jotfor.ms/s/static/latest/static/feedback2.js';
const EMBED_HANDLER_JS = 'https://cdn.jotfor.ms/s/umd/latest/for-form-embed-handler.js';
const FORM_BASE = 'https://form.jotform.com/';

type JotformFeedbackCtor = new (opts: Record<string, unknown>) => { componentID: string };

type JotformWindow = Window & {
  JotformFeedback?: JotformFeedbackCtor;
  jotformEmbedHandler?: (iframeSelector: string, base: string) => void;
};

let jotformInitPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const sel = `script[src="${src}"]`;
    const existing = document.querySelector<HTMLScriptElement>(sel);
    if (existing) {
      if (existing.dataset.chainpulseLoaded === '1') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }
    const el = document.createElement('script');
    el.src = src;
    el.async = false;
    el.onload = () => {
      el.dataset.chainpulseLoaded = '1';
      resolve();
    };
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(el);
  });
}

function ensureJotformFeedback(): Promise<void> {
  if (!jotformInitPromise) {
    jotformInitPromise = (async () => {
      const w = window as JotformWindow;

      await loadScript(FEEDBACK_JS);
      const Ctor = w.JotformFeedback;
      if (!Ctor) {
        throw new Error('JotformFeedback global missing after loading feedback2.js');
      }

      const { componentID } = new Ctor({
        type: false,
        width: 700,
        height: 500,
        fontColor: '#000000',
        background: '#40E0D0',
        isCardForm: false,
        formId: '261305306491047',
        buttonText: 'Feedback',
        buttonSide: 'right',
        buttonAlign: 'center',
        base: FORM_BASE,
      });

      await loadScript(EMBED_HANDLER_JS);
      if (typeof w.jotformEmbedHandler !== 'function') {
        throw new Error('jotformEmbedHandler missing after loading for-form-embed-handler.js');
      }

      w.jotformEmbedHandler(`iframe[id='${componentID}_iframe']`, FORM_BASE);
    })();
  }
  return jotformInitPromise;
}

export default function JotformFeedback() {
  useEffect(() => {
    ensureJotformFeedback().catch(() => {
      jotformInitPromise = null;
    });
  }, []);

  return null;
}
