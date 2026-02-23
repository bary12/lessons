import { register, init } from '../../engine/slides.js';

// ── Shared config ─────────────────────────────────────────────────────────────

const COMPS = [
    { f: 1, a: 1.00, color: '#22d3ee' },
    { f: 2, a: 0.50, color: '#fb923c' },
    { f: 3, a: 0.25, color: '#86efac' },
];
const SPEED = 0.38;

// Evaluate component value at position x on screen
function ec(comp, t, x, xRef, scaleX) {
    return comp.a * Math.sin(2 * Math.PI * comp.f * (t + (x - xRef) / scaleX));
}

// ── Slide 0: Introduction ─────────────────────────────────────────────────────

register({
    title: 'Fourier Transform',

    steps: [
        { text: 'Every sound, every image, every signal can be expressed as a sum of simple sine waves. The Fourier transform reveals exactly how.' },
        { text: 'Proposed by Joseph Fourier in 1822, it underpins digital audio, JPEG compression, radio, MRI imaging, and quantum mechanics — quietly, everywhere.' },
    ],

    draw(p, _s) {
        p.background('#07080f');
        const ctx = p.drawingContext;
        const W = p.width, H = p.height;
        const t = p.millis() / 1000;

        const ambient = [
            { f: 0.28, a: 0.11, ph: 0,   color: '#22d3ee', alpha: 0.15 },
            { f: 0.61, a: 0.07, ph: 1.7, color: '#fb923c', alpha: 0.12 },
            { f: 0.97, a: 0.05, ph: 3.2, color: '#86efac', alpha: 0.10 },
        ];

        for (const w of ambient) {
            ctx.save();
            ctx.globalAlpha = w.alpha;
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = w.color;
            ctx.beginPath();
            for (let x = 0; x <= W; x++) {
                const phase = t * SPEED * 0.3 + (x / W) * 4 * Math.PI + w.ph;
                const y = H / 2 + w.a * H * Math.sin(w.f * 2 * Math.PI + phase);
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
        }
    },
});

// ── Slide 1: A Signal ─────────────────────────────────────────────────────────

register({
    title: 'a signal',

    steps: [
        { text: 'A <strong>pure tone</strong> — a signal oscillating at exactly one frequency, forever repeating the same shape. The simplest possible signal.' },
        { text: 'At any instant, the signal has an <em>amplitude</em>: its displacement from zero. The dot traces this value as time flows.' },
        { text: 'This wave completes one full cycle per second — <em>1 Hz</em>. The equation is x(t) = A · sin(2πft). Frequency determines pitch; amplitude determines loudness.' },
    ],

    draw(p, _s) {
        p.background('#07080f');
        const ctx    = p.drawingContext;
        const W      = p.width, H = p.height;
        const t      = p.millis() / 1000 * SPEED;
        const comp   = COMPS[0];
        const cy     = H * 0.48;
        const scaleX = W * 0.22;
        const scaleY = H * 0.28;
        const xRef   = W * 0.15;

        // Axis
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
        ctx.restore();

        // Wave
        ctx.save();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = comp.color;
        ctx.shadowColor = comp.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        for (let x = 0; x <= W; x++) {
            const y = cy - ec(comp, t, x, xRef, scaleX) * scaleY;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();

        // Travelling dot
        const dotX = W * 0.78;
        const dotY = cy - ec(comp, t, dotX, xRef, scaleX) * scaleY;

        ctx.save();
        ctx.strokeStyle = comp.color + '44';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(dotX, cy); ctx.lineTo(dotX, dotY); ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = comp.color;
        ctx.shadowColor = comp.color;
        ctx.shadowBlur = 22;
        ctx.beginPath(); ctx.arc(dotX, dotY, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.font = '300 10px "IBM Plex Mono"';
        ctx.fillText('time →', W * 0.84, cy + 22);
        ctx.restore();
    },
});

// ── Slide 2: Superposition ────────────────────────────────────────────────────

register({
    title: 'superposition',

    steps: [
        { text: 'Real signals contain <strong>many frequencies at once</strong>. Multiple sine waves simply add together at each instant — they don\'t interfere with each other\'s existence.' },
        { text: 'Three pure tones appear one by one: 1 Hz at full amplitude (cyan), 2 Hz at half (orange), 3 Hz at a quarter (green). Each is a simple sine.' },
        { text: 'Their <strong>sum</strong> (white line) is what you\'d actually measure. One complex waveform, secretly built from three simple sines.' },
    ],

    setup(_p, s) {
        s.a0 = 0; s.a1 = 0; s.a2 = 0; s.sumA = 0;
    },

    draw(p, s) {
        p.background('#07080f');
        const ctx    = p.drawingContext;
        const W      = p.width, H = p.height;
        const t      = p.millis() / 1000;
        const raw    = t * SPEED;
        const cy     = H * 0.46;
        const scaleX = W * 0.17;
        const scaleY = H * 0.14;
        const xRef   = W * 0.08;

        // Time-driven reveal of components
        s.a0   = Math.min(1, Math.max(0, (t - 0.5) / 0.7));
        s.a1   = Math.min(1, Math.max(0, (t - 1.5) / 0.7));
        s.a2   = Math.min(1, Math.max(0, (t - 2.5) / 0.7));
        s.sumA = Math.min(1, Math.max(0, (t - 3.8) / 0.8));

        // Axis
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
        ctx.restore();

        // Individual components
        const alphas = [s.a0, s.a1, s.a2];
        COMPS.forEach((comp, i) => {
            const alpha = alphas[i];
            if (alpha <= 0) return;
            ctx.save();
            ctx.globalAlpha = alpha * 0.52;
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = comp.color;
            ctx.beginPath();
            for (let x = 0; x <= W; x++) {
                const y = cy - ec(comp, raw, x, xRef, scaleX) * scaleY;
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
        });

        // Sum
        if (s.sumA > 0) {
            ctx.save();
            ctx.globalAlpha = s.sumA * 0.88;
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = 'white';
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 7;
            ctx.beginPath();
            for (let x = 0; x <= W; x++) {
                const y  = COMPS.reduce((sum, c) => sum + ec(c, raw, x, xRef, scaleX), 0);
                const py = cy - y * scaleY;
                x === 0 ? ctx.moveTo(x, py) : ctx.lineTo(x, py);
            }
            ctx.stroke();
            ctx.restore();
        }
    },
});

// ── Slide 3: The Transform ────────────────────────────────────────────────────

register({
    title: 'the transform',

    steps: [
        { text: 'The Fourier transform maps a signal from the <strong>time domain</strong> to the <strong>frequency domain</strong> — from "how does it change over time?" to "which frequencies does it contain?"' },
        { text: 'Left: the raw signal as you\'d measure it with a microphone. All three frequencies are tangled together into one waveform.' },
        { text: 'Right: the frequency spectrum. Each spike is one component; its height is the amplitude. Three spikes, three frequencies — the signal fully decomposed.' },
    ],

    draw(p, _s) {
        p.background('#07080f');
        const ctx  = p.drawingContext;
        const W    = p.width, H = p.height;
        const t    = p.millis() / 1000;
        const raw  = t * SPEED;
        const pad  = 52;
        const midX = W * 0.5;

        // Bars animate in over the first 1.7 s
        const progress = Math.min(1, t / 1.7);

        // ─ Left: time domain ─
        const cyL    = H * 0.5;
        const scaleX = W * 0.11;
        const scaleY = H * 0.19;

        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad, cyL); ctx.lineTo(midX - pad, cyL); ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.72)';
        ctx.beginPath();
        for (let x = pad; x <= midX - pad; x++) {
            const tl = raw + (x - pad) / scaleX;
            const y  = COMPS.reduce((s, c) => s + c.a * Math.sin(2 * Math.PI * c.f * tl), 0);
            const py = cyL - y * scaleY;
            x === pad ? ctx.moveTo(x, py) : ctx.lineTo(x, py);
        }
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.font = '300 9px "IBM Plex Mono"';
        ctx.fillText('TIME DOMAIN', pad, H * 0.22);
        ctx.restore();

        // ─ Divider ─
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 9]);
        ctx.beginPath(); ctx.moveTo(midX, H * 0.12); ctx.lineTo(midX, H * 0.88); ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.font = 'italic 300 30px "Cormorant Garamond"';
        ctx.textAlign = 'center';
        ctx.fillText('ℱ', midX, H * 0.5 + 11);
        ctx.restore();

        // ─ Right: frequency domain ─
        const rxS     = midX + pad;
        const rxE     = W - pad;
        const ryBase  = H * 0.7;
        const barMaxH = H * 0.44;
        const fMax    = 4.5;
        const rx      = f => rxS + (f / fMax) * (rxE - rxS);
        const barW    = Math.max(7, (rxE - rxS) * 0.032);

        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.13)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(rxS - 8, ryBase); ctx.lineTo(rxE + 8, ryBase); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rxS - 8, ryBase - barMaxH - 16); ctx.lineTo(rxS - 8, ryBase + 1); ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.font = '300 9px "IBM Plex Mono"';
        ctx.textAlign = 'left';
        ctx.fillText('FREQUENCY DOMAIN', rxS, H * 0.22);
        ctx.restore();

        COMPS.forEach(comp => {
            const bx = rx(comp.f);
            const bh = comp.a * barMaxH * progress;

            ctx.save();
            ctx.fillStyle = comp.color;
            ctx.shadowColor = comp.color;
            ctx.shadowBlur = 14 * progress;
            ctx.globalAlpha = 0.82;
            ctx.fillRect(bx - barW / 2, ryBase - bh, barW, bh);
            ctx.restore();

            if (bh > 18 && progress > 0.55) {
                ctx.save();
                ctx.fillStyle = 'rgba(255,255,255,0.42)';
                ctx.globalAlpha = Math.min(1, (progress - 0.55) * 2.2);
                ctx.font = '300 9px "IBM Plex Mono"';
                ctx.textAlign = 'center';
                ctx.fillText(comp.a.toFixed(2), bx, ryBase - bh - 9);
                ctx.restore();
            }

            ctx.save();
            ctx.fillStyle = comp.color;
            ctx.globalAlpha = 0.68 * progress;
            ctx.font = '300 9px "IBM Plex Mono"';
            ctx.textAlign = 'center';
            ctx.fillText(comp.f + ' Hz', bx, ryBase + 18);
            ctx.restore();
        });

        for (let f = 1; f <= 4; f++) {
            const bx = rx(f);
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(bx, ryBase); ctx.lineTo(bx, ryBase + 4); ctx.stroke();
            ctx.restore();
        }
    },
});

// ── Slide 4: Epicycles ────────────────────────────────────────────────────────

register({
    title: 'rotating circles',

    steps: [
        { text: 'A geometric view of the Fourier transform. Each frequency becomes a <em>rotating circle</em>: its radius equals the amplitude, its spin rate equals the frequency.' },
        { text: 'Chain the circles together — 1 Hz, 2 Hz, 3 Hz. The first spins slowest, the last fastest. Each arm is a rotating vector.' },
        { text: 'The tip of the chain traces a path through 2D space. Projected vertically, it <strong>recreates our original signal exactly</strong>. Circles, all the way down.' },
    ],

    setup(_p, s) {
        s.trace = [];
    },

    resize(_p, s) {
        s.trace = [];
    },

    draw(p, s) {
        p.background('#07080f');
        const ctx         = p.drawingContext;
        const W           = p.width, H = p.height;
        const t           = p.millis() / 1000 * SPEED;
        const cx          = W * 0.25;
        const cy          = H * 0.44;
        const scale       = Math.min(W, H) * 0.125;
        const traceStartX = W * 0.52;
        const pxPerSec    = (W * 0.44) / (3.2 * SPEED);
        const penX        = traceStartX + W * 0.03;

        // Chain of endpoints
        const pts = [[cx, cy]];
        for (const comp of COMPS) {
            const angle = 2 * Math.PI * comp.f * t;
            const prev  = pts[pts.length - 1];
            pts.push([
                prev[0] + comp.a * scale * Math.cos(angle),
                prev[1] - comp.a * scale * Math.sin(angle),
            ]);
        }

        const tipX   = pts[pts.length - 1][0];
        const tipY   = pts[pts.length - 1][1];
        const sumVal = COMPS.reduce((sum, c) => sum + c.a * Math.sin(2 * Math.PI * c.f * t), 0);
        const penY   = cy - sumVal * scale;

        s.trace.push({ t, y: penY });
        if (s.trace.length > 4000) s.trace.shift();

        // Circles and arms
        COMPS.forEach((comp, i) => {
            const [ox, oy] = pts[i];
            const [nx, ny] = pts[i + 1];
            const r = comp.a * scale;

            ctx.save();
            ctx.strokeStyle = comp.color;
            ctx.globalAlpha = 0.18;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.strokeStyle = comp.color;
            ctx.globalAlpha = 0.72;
            ctx.lineWidth = 1.8;
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(nx, ny); ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.fillStyle = comp.color;
            ctx.shadowColor = comp.color;
            ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.arc(nx, ny, 3, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        });

        // Dashed connector: tip → pen
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 7]);
        ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(penX, penY); ctx.stroke();
        ctx.restore();

        // Divider
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(W * 0.5, H * 0.08); ctx.lineTo(W * 0.5, H * 0.88); ctx.stroke();
        ctx.restore();

        // Trace with gradient fade
        if (s.trace.length > 1) {
            const grad = ctx.createLinearGradient(traceStartX, 0, penX, 0);
            grad.addColorStop(0,    'rgba(255,255,255,0)');
            grad.addColorStop(0.25, 'rgba(255,255,255,0.35)');
            grad.addColorStop(1,    'rgba(255,255,255,0.85)');

            ctx.save();
            ctx.lineWidth = 2.2;
            ctx.strokeStyle = grad;
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            let started = false;
            for (const pt of s.trace) {
                const px = penX - (t - pt.t) * pxPerSec;
                if (px < traceStartX) continue;
                if (!started) { ctx.moveTo(px, pt.y); started = true; }
                else ctx.lineTo(px, pt.y);
            }
            ctx.stroke();
            ctx.restore();
        }

        // Pen dot
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(penX, penY, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    },
});

// ── Boot ──────────────────────────────────────────────────────────────────────
init('#app', {
    intro: {
        title: 'Fourier Transform',
        sub:   'an animated lesson',
    },
});
