document.addEventListener('DOMContentLoaded', () => {
  const intro = document.getElementById('intro');
  if (!intro) return;

  intro.querySelectorAll('[data-intro-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.introTarget;
      document.querySelector(`.nav-item[data-target="${target}"]`)?.click();
    });
  });
});

