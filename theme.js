// Light/dark theme. Runs in the <head> so a saved choice applies before the
// page paints, then adds a sun/moon toggle to the top right of the nav.
// The site starts dark; a choice made with the toggle is remembered.
(() => {
  const STORAGE_KEY = 'theme';
  const root = document.documentElement;

  const SUN = '<svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
  const MOON = '<svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  function loadTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be blocked; the toggle still works for this page.
    }
  }

  function isLight() {
    return root.dataset.theme === 'light';
  }

  if (loadTheme() === 'light') root.dataset.theme = 'light';

  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    if (!nav) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    button.innerHTML = SUN + MOON;

    function updateLabel() {
      const label = isLight() ? 'Įjungti tamsią temą' : 'Įjungti šviesią temą';
      button.title = label;
      button.setAttribute('aria-label', label);
    }

    button.addEventListener('click', () => {
      const next = isLight() ? 'dark' : 'light';
      if (next === 'light') {
        root.dataset.theme = 'light';
      } else {
        delete root.dataset.theme;
      }
      saveTheme(next);
      updateLabel();
      // Lets bg.js fade the background even when it isn't animating.
      window.dispatchEvent(new Event('themechange'));
    });

    updateLabel();
    nav.append(button);
  });
})();
