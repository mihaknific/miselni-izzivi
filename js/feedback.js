let toastHost = null;

function ensureToastHost() {
  if (toastHost && document.body.contains(toastHost)) return toastHost;
  toastHost = document.createElement('div');
  toastHost.className = 'toast-host';
  toastHost.setAttribute('aria-live', 'polite');
  toastHost.setAttribute('aria-atomic', 'true');
  document.body.appendChild(toastHost);
  return toastHost;
}

export function showToast(message, { type = 'info', timeout = 3000 } = {}) {
  if (!message || !document.body) return;

  const host = ensureToastHost();
  const toast = document.createElement('div');
  toast.className = `app-toast app-toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  host.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  const dismiss = () => {
    toast.classList.remove('visible');
    window.setTimeout(() => toast.remove(), 180);
  };

  toast.addEventListener('click', dismiss);

  if (timeout !== Infinity) {
    window.setTimeout(dismiss, timeout);
  }
}

export function showConfetti({ duration = 900, count = 28 } = {}) {
  if (!document.body || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.style.cssText =
    'position:fixed; inset:0; width:100%; height:100%; pointer-events:none; z-index:9999;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
  }
  resize();
  const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
  const parts = Array.from({ length: count }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 120,
    y: window.innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 10,
    vy: -Math.random() * 8 - 4,
    r: 4 + Math.random() * 5,
    rot: Math.random() * 360,
    vr: (Math.random() - 0.5) * 12,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 1,
  }));
  let start = performance.now();
  let removed = false;
  function frame(now) {
    if (removed) return;
    const elapsed = now - start;
    const t = elapsed / duration;
    if (t >= 1) {
      removed = true;
      canvas.remove();
      return;
    }
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    parts.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45;
      p.vx *= 0.99;
      p.rot += p.vr;
      p.life = 1 - t;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
      ctx.restore();
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  setTimeout(() => {
    if (!removed) {
      removed = true;
      canvas.remove();
    }
  }, duration + 100);
}
