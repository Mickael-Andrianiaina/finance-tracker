/* ─── UI HELPERS — toast, hamburger, counter animation ─── */

// ── Toast System ───────────────────────────────────────────
(function () {
  const CONTAINER_ID = 'toast-container';

  function ensureContainer() {
    let c = document.getElementById(CONTAINER_ID);
    if (!c) {
      c = document.createElement('div');
      c.id = CONTAINER_ID;
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(message, type = 'success', duration = 3500) {
    const container = ensureContainer();
    const icons = { success: '✓', error: '✕', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>
      <button class="toast-dismiss" onclick="this.closest('.toast').remove()">✕</button>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  window.toast = {
    success: (msg) => showToast(msg, 'success'),
    error:   (msg) => showToast(msg, 'error'),
    warning: (msg) => showToast(msg, 'warning'),
  };

  // Replace native alert with toast
  window._nativeAlert = window.alert;
  window.alert = function (msg) {
    if (typeof msg !== 'string') { window._nativeAlert(msg); return; }
    if (msg.startsWith('✔') || msg.startsWith('✅')) {
      toast.success(msg.replace(/^[✔✅]\s*/, ''));
    } else if (msg.startsWith('❌')) {
      toast.error(msg.replace(/^[❌]\s*/, ''));
    } else if (msg.startsWith('⚠') || msg.startsWith('⚠️')) {
      toast.warning(msg.replace(/^[⚠️\s]+/, ''));
    } else {
      toast.success(msg);
    }
  };
})();

// ── Hamburger Nav ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav    = document.querySelector('nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close when a link is tapped
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.classList.remove('open');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      nav.classList.remove('open');
      toggle.classList.remove('open');
    }
  });
});

// ── Animated Counter ───────────────────────────────────────
function animateValue(el, endValue, duration = 900) {
  if (!el) return;
  const startValue = 0;
  const startTime  = performance.now();
  const isNeg      = endValue < 0;
  const absEnd     = Math.abs(endValue);

  function step(currentTime) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current  = startValue + (absEnd - startValue) * ease;

    const formatted = new Intl.NumberFormat('fr-MG', {
      style: 'currency', currency: 'MGA', minimumFractionDigits: 2
    }).format(isNeg ? -current : current);

    el.textContent = formatted;
    el.style.animation = 'counterUp 0.3s ease both';

    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

window.animateValue = animateValue;