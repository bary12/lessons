import { register, init } from '../../engine/slides.js';

// ── Shared config ─────────────────────────────────────────────────────────────

const COMPS = [
    { f: 1, a: 1.00, color: '#22d3ee' },
    { f: 2, a: 0.50, color: '#fb923c' },
    { f: 3, a: 0.25, color: '#86efac' },
];
const SPEED = 0.38;

function ec(comp, t, x, xRef, scaleX) {
    return comp.a * Math.sin(2 * Math.PI * comp.f * (t + (x - xRef) / scaleX));
}

function signal(t) {
    return COMPS.reduce((sum, c) => sum + c.a * Math.sin(2 * Math.PI * c.f * t), 0);
}

// Trigger MathJax to re-render the text pane after a new step is added
function typeset() {
    const el = document.querySelector('.sl-steps');
    if (el && window.MathJax) MathJax.typesetPromise([el]);
}

// ── Slide 0: Introduction ─────────────────────────────────────────────────────

register({
    title: 'Fourier Transform',

    steps: [
        { text: 'Every sound, image, and signal is secretly a sum of pure sine waves. The Fourier transform is the tool that finds them.' },
        { text: 'Proposed by Fourier in 1822 for heat flow, it now underpins MP3 audio, JPEG images, radio transmission, and MRI scanners — one of the most useful ideas in all of mathematics.' },
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

// ── Slide 1: A pure tone ──────────────────────────────────────────────────────

register({
    title: 'a pure tone',

    steps: [
        { text: 'A <strong>pure tone</strong> oscillates at a single frequency, repeating the same shape forever. It is the atom from which all signals are built.' },
        { text: 'Written as \\(x(t) = A\\sin(2\\pi ft)\\). Amplitude \\(A\\) sets the peak height; frequency \\(f\\) (in Hz) counts full cycles per second. Here \\(f = 1\\) Hz: one cycle every second.',
          enter: () => typeset() },
        { text: 'Phase \\(\\phi\\) shifts it sideways: \\(x(t) = A\\sin(2\\pi ft + \\phi)\\). The Fourier transform recovers both \\(A\\) and \\(f\\) — the two numbers that fully characterise a pure tone.',
          enter: () => typeset() },
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

        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
        ctx.restore();

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
        { text: 'Real signals contain <strong>many frequencies at once</strong>. Sine waves add point by point — they don\'t interfere with each other\'s existence, they simply sum.' },
        { text: 'Our example signal: \\[x(t) = \\sin(2\\pi t) + \\tfrac{1}{2}\\sin(4\\pi t) + \\tfrac{1}{4}\\sin(6\\pi t)\\] Three pure tones at 1 Hz, 2 Hz, and 3 Hz, with decreasing amplitudes.',
          enter: () => typeset() },
        { text: 'The <strong>white curve</strong> is the sum — what a microphone would record. One complex waveform, secretly three simple sines. The Fourier transform unmixes them.',
          enter: () => typeset() },
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

        s.a0   = Math.min(1, Math.max(0, (t - 0.5) / 0.7));
        s.a1   = Math.min(1, Math.max(0, (t - 1.5) / 0.7));
        s.a2   = Math.min(1, Math.max(0, (t - 2.5) / 0.7));
        s.sumA = Math.min(1, Math.max(0, (t - 3.8) / 0.8));

        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
        ctx.restore();

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

// ── Slide 3: Euler's Formula ──────────────────────────────────────────────────

register({
    title: "euler's formula",

    steps: [
        { text: 'The Fourier transform is built on <strong>complex exponentials</strong>. Euler\'s formula connects them to sinusoids: \\[e^{i\\theta} = \\cos\\theta + i\\sin\\theta\\]',
          enter: () => typeset() },
        { text: 'Think of \\(e^{i\\theta}\\) as a point on the unit circle in the complex plane. As \\(\\theta\\) grows, it rotates counter-clockwise. The <span style="color:#fb923c">real part</span> traces a cosine; the <span style="color:#86efac">imaginary part</span> traces a sine.',
          enter: () => typeset() },
        { text: 'At frequency \\(f\\), set \\(\\theta = 2\\pi ft\\). Then \\(e^{2\\pi ift}\\) completes exactly \\(f\\) full rotations per second — a pure oscillation in the complex plane, cleaner than sine and cosine separately.',
          enter: () => typeset() },
    ],

    draw(p, _s) {
        p.background('#07080f');
        const ctx = p.drawingContext;
        const W = p.width, H = p.height;
        const t = p.millis() / 1000 * SPEED;

        const cx = W * 0.28, cy = H * 0.5;
        const R  = Math.min(W * 0.19, H * 0.28);
        const theta = 2 * Math.PI * t;
        const px = cx + R * Math.cos(theta);
        const py = cy - R * Math.sin(theta);

        // Unit circle
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();

        // Axes
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - R - 14, cy); ctx.lineTo(cx + R + 14, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - R - 14); ctx.lineTo(cx, cy + R + 14); ctx.stroke();
        ctx.restore();

        // Axis labels
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.font = '300 9px "IBM Plex Mono"';
        ctx.textAlign = 'center';
        ctx.fillText('Re', cx + R + 22, cy + 4);
        ctx.fillText('Im', cx, cy - R - 18);
        ctx.restore();

        // Radius arm
        ctx.save();
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.75;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
        ctx.restore();

        // Real projection: dashed vertical from point to x-axis
        ctx.save();
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, cy); ctx.stroke();
        ctx.restore();

        // Imaginary projection: dashed horizontal from point to y-axis
        ctx.save();
        ctx.strokeStyle = '#86efac';
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(cx, py); ctx.stroke();
        ctx.restore();

        // Waves on the right
        const waveX0 = cx + R + 28;
        const waveX1 = W - 16;
        const wLen   = waveX1 - waveX0;
        const wCycles = 2.5;

        // cos wave (real part) — orange
        ctx.save();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#fb923c';
        ctx.globalAlpha = 0.65;
        ctx.setLineDash([]);
        ctx.beginPath();
        for (let x = 0; x <= wLen; x++) {
            const th = theta - (x / wLen) * wCycles * 2 * Math.PI;
            const wy = cy - R * Math.cos(th);
            x === 0 ? ctx.moveTo(waveX0 + x, wy) : ctx.lineTo(waveX0 + x, wy);
        }
        ctx.stroke();
        ctx.restore();

        // sin wave (imaginary part) — green
        ctx.save();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#86efac';
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        for (let x = 0; x <= wLen; x++) {
            const th = theta - (x / wLen) * wCycles * 2 * Math.PI;
            const wy = cy - R * Math.sin(th);
            x === 0 ? ctx.moveTo(waveX0 + x, wy) : ctx.lineTo(waveX0 + x, wy);
        }
        ctx.stroke();
        ctx.restore();

        // Connector: x-projection → cos wave leading edge
        ctx.save();
        ctx.strokeStyle = '#fb923c';
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 7]);
        ctx.beginPath();
        ctx.moveTo(px, cy);
        ctx.lineTo(waveX0, cy - R * Math.cos(theta));
        ctx.stroke();
        ctx.restore();

        // Dot on cos wave at leading edge
        ctx.save();
        ctx.fillStyle = '#fb923c';
        ctx.shadowColor = '#fb923c';
        ctx.shadowBlur = 10;
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(waveX0, cy - R * Math.cos(theta), 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Dot on sin wave at leading edge
        ctx.save();
        ctx.fillStyle = '#86efac';
        ctx.shadowColor = '#86efac';
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(waveX0, cy - R * Math.sin(theta), 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Rotating point
        ctx.save();
        ctx.fillStyle = '#22d3ee';
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(px, py, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Wave labels
        ctx.save();
        ctx.font = 'italic 300 10px "IBM Plex Mono"';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fb923c';
        ctx.globalAlpha = 0.55;
        ctx.fillText('cos θ', waveX1 - 38, cy - R * 0.55);
        ctx.fillStyle = '#86efac';
        ctx.fillText('sin θ', waveX1 - 38, cy + R * 0.62);
        ctx.restore();
    },
});

// ── Slide 4: The Transform ────────────────────────────────────────────────────

register({
    title: 'the transform',

    steps: [
        { text: 'The <strong>Fourier transform</strong>: \\[\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(t)\\, e^{-2\\pi i\\xi t}\\, dt\\] It takes a time-domain signal \\(f(t)\\) and outputs \\(\\hat{f}(\\xi)\\) — a complex number for every frequency \\(\\xi\\).',
          enter: () => typeset() },
        { text: '\\(e^{-2\\pi i\\xi t}\\) is a unit-circle rotation at rate \\(\\xi\\). Multiplying \\(f(t)\\) by it <em>winds</em> the signal around a circle. The integral then computes the centre of mass of that coil.',
          enter: () => typeset() },
        { text: 'The magnitude \\(|\\hat{f}(\\xi)|\\) is the amplitude of frequency \\(\\xi\\) in the signal; the argument \\(\\arg\\hat{f}(\\xi)\\) is its phase. Three spikes, three frequencies — the signal fully decoded.',
          enter: () => typeset() },
    ],

    draw(p, _s) {
        p.background('#07080f');
        const ctx  = p.drawingContext;
        const W    = p.width, H = p.height;
        const t    = p.millis() / 1000;
        const raw  = t * SPEED;
        const pad  = 52;
        const midX = W * 0.5;

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

// ── Slide 5: The Winding Machine ──────────────────────────────────────────────

register({
    title: 'the winding machine',

    steps: [
        { text: 'The geometric heart of the Fourier transform: for each test frequency \\(\\xi\\), multiply \\(f(t)\\) by \\(e^{2\\pi i\\xi t}\\). Each sample \\(f(t)\\) becomes a complex number rotating at rate \\(\\xi\\) — winding the signal around a circle.',
          enter: () => typeset() },
        { text: 'As \\(\\xi\\) sweeps from 0 to 4 Hz, the coil shifts shape. At most frequencies the winding is incoherent — the <span style="color:#fbbf24">centre of mass</span> stays near the origin, so \\(|\\hat{f}(\\xi)| \\approx 0\\).',
          enter: () => typeset() },
        { text: 'At \\(\\xi = 1, 2, 3\\) Hz the coil aligns and the centre of mass jumps. Three spikes grow in the spectrum on the right — each one revealing a frequency hidden in the signal.',
          enter: () => typeset() },
    ],

    setup(_p, s) {
        s.spectrum     = [];
        s.lastXiPushed = -1;
    },

    resize(_p, s) {
        s.spectrum     = [];
        s.lastXiPushed = -1;
    },

    draw(p, s) {
        p.background('#07080f');
        const ctx = p.drawingContext;
        const W = p.width, H = p.height;
        const t = p.millis() / 1000;

        const sweepPeriod = 14; // seconds per full sweep 0 → 4.5 Hz
        const xi = ((t % sweepPeriod) / sweepPeriod) * 4.5;

        // Reset spectrum when a new sweep begins
        if (xi < s.lastXiPushed - 0.5) {
            s.spectrum     = [];
            s.lastXiPushed = -1;
        }

        // Accumulate spectrum ~every 0.025 Hz step
        if (xi - s.lastXiPushed > 0.025) {
            const N = 512, T = 6;
            let cx2 = 0, cy2 = 0;
            for (let k = 0; k < N; k++) {
                const tk = (k / N) * T;
                const ft = signal(tk);
                cx2 += ft * Math.cos(2 * Math.PI * xi * tk);
                cy2 += ft * Math.sin(2 * Math.PI * xi * tk);
            }
            const mag = Math.sqrt((cx2 / N) ** 2 + (cy2 / N) ** 2);
            s.spectrum.push({ xi, mag });
            s.lastXiPushed = xi;
        }

        // ─ Left: winding circle ─
        const circX = W * 0.27, circY = H * 0.5;
        const circR = Math.min(W * 0.19, H * 0.27);
        const sigMax   = 1.75; // max |signal(t)|
        const wndScale = circR / sigMax;

        // Circle and axes
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(circX, circY, circR, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.moveTo(circX - circR, circY); ctx.lineTo(circX + circR, circY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(circX, circY - circR); ctx.lineTo(circX, circY + circR); ctx.stroke();
        ctx.restore();

        // Compute wound curve and centre of mass for display
        const ND = 600, TD = 6;
        let wcmX = 0, wcmY = 0;
        const woundPts = new Float32Array(ND * 2);
        for (let k = 0; k < ND; k++) {
            const tk = (k / ND) * TD;
            const ft = signal(tk);
            const wx = ft * wndScale * Math.cos(2 * Math.PI * xi * tk);
            const wy = ft * wndScale * Math.sin(2 * Math.PI * xi * tk);
            woundPts[k * 2]     = circX + wx;
            woundPts[k * 2 + 1] = circY - wy; // screen y is flipped
            wcmX += wx;
            wcmY += wy;
        }
        const cmX = circX + wcmX / ND;
        const cmY = circY - wcmY / ND;

        const isNear = COMPS.some(c => Math.abs(xi - c.f) < 0.18);

        // Wound curve
        ctx.save();
        ctx.lineWidth   = 1.5;
        ctx.strokeStyle = isNear ? '#fbbf24' : '#22d3ee';
        ctx.globalAlpha = isNear ? 0.82 : 0.48;
        ctx.beginPath();
        for (let k = 0; k < ND; k++) {
            const x = woundPts[k * 2], y = woundPts[k * 2 + 1];
            k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();

        // Centre of mass dot
        ctx.save();
        ctx.fillStyle   = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur  = isNear ? 22 : 9;
        ctx.globalAlpha = isNear ? 1 : 0.75;
        ctx.beginPath(); ctx.arc(cmX, cmY, isNear ? 6.5 : 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Current ξ readout
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.font = '300 10px "IBM Plex Mono"';
        ctx.textAlign = 'center';
        ctx.fillText('ξ = ' + xi.toFixed(2) + ' Hz', circX, H * 0.88);
        ctx.restore();

        // Divider
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(W * 0.5, H * 0.06); ctx.lineTo(W * 0.5, H * 0.94); ctx.stroke();
        ctx.restore();

        // ─ Right: spectrum plot ─
        const rxS = W * 0.54, rxE = W - 22;
        const rxW = rxE - rxS;
        const ryBase = H * 0.76, specH = H * 0.54;
        const fMax   = 4.5;
        const specScale = specH / 0.55; // map mag ≈ 0.5 → near top

        // Axes
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(rxS, ryBase); ctx.lineTo(rxE, ryBase); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rxS, ryBase); ctx.lineTo(rxS, ryBase - specH - 8); ctx.stroke();
        ctx.restore();

        // Freq ticks + labels
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.font = '300 9px "IBM Plex Mono"';
        ctx.textAlign = 'center';
        [1, 2, 3, 4].forEach(f => {
            const sx = rxS + (f / fMax) * rxW;
            ctx.fillText(f + ' Hz', sx, ryBase + 15);
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(sx, ryBase); ctx.lineTo(sx, ryBase + 4); ctx.stroke();
            ctx.restore();
        });
        ctx.textAlign = 'left';
        ctx.fillText('|f̂(ξ)|', rxS + 3, ryBase - specH - 10);
        ctx.restore();

        // Accumulated spectrum trace
        if (s.spectrum.length > 1) {
            ctx.save();
            ctx.lineWidth   = 1.8;
            ctx.strokeStyle = '#22d3ee';
            ctx.globalAlpha = 0.78;
            ctx.beginPath();
            s.spectrum.forEach(({ xi: xf, mag }, i) => {
                const sx = rxS + (xf / fMax) * rxW;
                const sy = ryBase - mag * specScale;
                i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
            });
            ctx.stroke();
            ctx.restore();
        }

        // Moving frequency cursor
        const curSx = rxS + (xi / fMax) * rxW;
        ctx.save();
        ctx.strokeStyle = '#fbbf24';
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(curSx, ryBase); ctx.lineTo(curSx, ryBase - specH); ctx.stroke();
        ctx.restore();
    },
});

// ── Slide 6: Epicycles ────────────────────────────────────────────────────────

register({
    title: 'rotating circles',

    steps: [
        { text: 'One more view: each sinusoidal component \\(A_k\\sin(2\\pi f_k t)\\) becomes a <em>rotating vector</em> — radius \\(A_k\\), spin rate \\(2\\pi f_k\\) radians per second.',
          enter: () => typeset() },
        { text: 'Chain them tip to tail: 1 Hz (cyan), 2 Hz (orange), 3 Hz (green). Each arm spins at its own frequency, carrying its amplitude in its length.' },
        { text: 'The tip traces a path. Projected vertically, it <strong>recreates the original signal exactly</strong>. Epicycles and the Fourier transform are the same idea — just different ways of writing the same sum.',
          enter: () => typeset() },
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

        // Chain endpoints
        const pts = [[cx, cy]];
        for (const comp of COMPS) {
            const angle = 2 * Math.PI * comp.f * t;
            const prev  = pts[pts.length - 1];
            pts.push([
                prev[0] + comp.a * scale * Math.cos(angle),
                prev[1] - comp.a * scale * Math.sin(angle),
            ]);
        }

        const tipX = pts[pts.length - 1][0];
        const tipY = pts[pts.length - 1][1]; // equals cy − sumVal*scale

        s.trace.push({ t, y: tipY });
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
        ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(penX, tipY); ctx.stroke();
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
        ctx.beginPath(); ctx.arc(penX, tipY, 4.5, 0, Math.PI * 2); ctx.fill();
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
