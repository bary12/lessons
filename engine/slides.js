// engine/slides.js — p5.js slide engine v2
//
// Slide definition:
//   title     string
//   steps     [{ text: string, enter?(p, state, forward: bool): void }]
//   setup?    (p, state) => void   — called in p5 setup()
//   draw?     (p, state) => void   — called every p5 frame
//   resize?   (p, state) => void   — called on canvas resize

const _slides = [];
let _dom    = {};
let _cur    = { slide: -1, step: -1 };
let _p5inst = null;
let _state  = null;
let _tts    = true;

// ── Voice loading ─────────────────────────────────────────────────────────────
// getVoices() returns [] on first call; voices load asynchronously.
let _voice       = null;
let _voiceReady  = false;
let _pendingText = null; // text queued before voices were ready

function _pickVoice() {
    const voices = window.speechSynthesis?.getVoices() ?? [];
    if (!voices.length) return;
    _voice      = voices.find(v => v.lang.startsWith('en-GB') && v.name.includes('Female'))
               ?? voices[0];
    _voiceReady = true;
    if (_pendingText !== null) {
        const t = _pendingText;
        _pendingText = null;
        _speak(t);
    }
}

if (window.speechSynthesis) {
    window.speechSynthesis.addEventListener('voiceschanged', _pickVoice);
    _pickVoice(); // succeeds immediately on Firefox; no-op on Chrome first call
}

// ── Public API ────────────────────────────────────────────────────────────────

export function register(slide) { _slides.push(slide); }
export function current()       { return { ..._cur }; }

export function init(selector = '#app', config = {}) {
    const root = document.querySelector(selector);
    if (!root) throw new Error(`slides: "${selector}" not found`);

    root.classList.add('sl-root');
    root.innerHTML = `
        <div class="sl-layout">
            <aside class="sl-text">
                <div class="sl-text-body">
                    <div class="sl-title"></div>
                    <div class="sl-steps"></div>
                </div>
                <footer class="sl-text-footer">
                    <span class="sl-counter"></span>
                    <button class="sl-tts-btn" title="Toggle narration">&#9654;</button>
                </footer>
            </aside>
            <main class="sl-canvas"></main>
        </div>
        <nav class="sl-nav">
            <button class="sl-prev">&#8592;</button>
            <div class="sl-dots"></div>
            <span class="sl-nav-label"></span>
            <button class="sl-next">&#8594;</button>
        </nav>`;

    _dom = {
        title:   root.querySelector('.sl-title'),
        steps:   root.querySelector('.sl-steps'),
        body:    root.querySelector('.sl-text-body'),
        counter: root.querySelector('.sl-counter'),
        ttsBtn:  root.querySelector('.sl-tts-btn'),
        canvas:  root.querySelector('.sl-canvas'),
        dots:    root.querySelector('.sl-dots'),
        prev:    root.querySelector('.sl-prev'),
        next:    root.querySelector('.sl-next'),
        label:   root.querySelector('.sl-nav-label'),
    };

    _slides.forEach((_, i) => {
        const d = document.createElement('button');
        d.className = 'sl-dot';
        d.setAttribute('aria-label', `Slide ${i + 1}`);
        d.addEventListener('click', () => _goSlide(i));
        _dom.dots.appendChild(d);
    });

    _dom.prev.addEventListener('click', _back);
    _dom.next.addEventListener('click', _advance);
    _dom.ttsBtn.addEventListener('click', () => {
        _tts = !_tts;
        _dom.ttsBtn.classList.toggle('sl-tts-off', !_tts);
        if (!_tts) window.speechSynthesis?.cancel();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); _advance(); }
        if (e.key === 'ArrowLeft')                   { e.preventDefault(); _back(); }
    });

    if (config.intro) {
        _showIntro(root, config.intro);
    } else {
        _goSlide(0);
    }
}

function _showIntro(root, intro) {
    const el = document.createElement('div');
    el.className = 'sl-intro';
    el.innerHTML = `
        <div class="sl-intro-inner">
            <h1 class="sl-intro-title">${intro.title ?? ''}</h1>
            ${intro.sub ? `<p class="sl-intro-sub">${intro.sub}</p>` : ''}
            <p class="sl-intro-cta">press &rarr; to begin</p>
        </div>`;
    root.appendChild(el);

    requestAnimationFrame(() => el.classList.add('sl-intro-on'));

    function dismiss() {
        el.classList.add('sl-intro-out');
        _goSlide(0); // start lesson during fade — canvas ready when overlay clears
        el.addEventListener('transitionend', () => el.remove(), { once: true });
        document.removeEventListener('keydown', onKey);
        el.removeEventListener('click', dismiss);
    }

    function onKey(e) {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            dismiss();
        }
    }

    el.addEventListener('click', dismiss);
    document.addEventListener('keydown', onKey);
}

// ── Internal ──────────────────────────────────────────────────────────────────

function _goSlide(i) {
    if (i < 0 || i >= _slides.length) return;

    if (_p5inst) { _p5inst.remove(); _p5inst = null; }

    _cur.slide = i;
    _cur.step  = -1;
    _state     = {};

    const slide = _slides[i];
    const pane  = _dom.canvas;
    const state = _state;

    _dom.title.textContent = slide.title ?? '';
    _dom.steps.innerHTML   = '';
    _dom.dots.querySelectorAll('.sl-dot').forEach((d, j) =>
        d.classList.toggle('sl-dot-active', j === i));
    _dom.label.textContent = `${i + 1} / ${_slides.length}`;

    _p5inst = new p5(p => {
        p.setup = () => {
            p.pixelDensity(window.devicePixelRatio || 1);
            p.createCanvas(pane.clientWidth || 800, pane.clientHeight || 600);
            if (slide.setup) slide.setup(p, state);
        };
        p.draw = () => {
            if (slide.draw) slide.draw(p, state);
        };
        p.windowResized = () => {
            p.resizeCanvas(pane.clientWidth, pane.clientHeight);
            if (slide.resize) slide.resize(p, state);
        };
    }, pane);

    _goStep(0);
}

function _goStep(j) {
    const slide = _slides[_cur.slide];
    const steps = slide.steps ?? [];
    if (j < 0 || j >= steps.length) return;

    const fwd = j > _cur.step;
    _cur.step = j;

    if (fwd) {
        const step = steps[j];
        const el   = document.createElement('p');
        el.className = 'sl-para';
        el.innerHTML = step.text ?? '';
        _dom.steps.appendChild(el);
        requestAnimationFrame(() => el.classList.add('sl-para-on'));
        step.enter?.(_p5inst, _state, true);
        _speak(_strip(step.text ?? ''));
        // scroll new para into view after its fade
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 200);
    } else {
        const paras = _dom.steps.querySelectorAll('.sl-para');
        for (let k = paras.length - 1; k > j; k--) paras[k].remove();
        steps[j].enter?.(_p5inst, _state, false);
    }

    _dom.counter.textContent = `${j + 1} / ${steps.length}`;
    _updateNav();
}

function _advance() {
    if (_cur.slide < 0) return; // lesson not started yet (intro still showing)
    const steps = _slides[_cur.slide]?.steps ?? [];
    if (_cur.step < steps.length - 1) {
        _goStep(_cur.step + 1);
    } else if (_cur.slide < _slides.length - 1) {
        _goSlide(_cur.slide + 1);
    }
}

function _back() {
    if (_cur.slide < 0) return;
    if (_cur.step > 0) {
        _goStep(_cur.step - 1);
    } else if (_cur.slide > 0) {
        _goSlide(_cur.slide - 1);
        const prevSteps = _slides[_cur.slide].steps ?? [];
        if (prevSteps.length > 1) _goStep(prevSteps.length - 1);
    }
}

function _updateNav() {
    const steps = _slides[_cur.slide]?.steps ?? [];
    _dom.prev.disabled = (_cur.slide === 0 && _cur.step === 0);
    _dom.next.disabled = (_cur.slide === _slides.length - 1 && _cur.step === steps.length - 1);
}

function _speak(text) {
    if (!_tts || !window.speechSynthesis) return;
    if (!_voiceReady) { _pendingText = text; return; } // defer until voiceschanged fires
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    if (_voice) utt.voice = _voice;
    window.speechSynthesis.speak(utt);
}

function _strip(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
