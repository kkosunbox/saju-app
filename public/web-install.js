window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  window.woonpickInstallPrompt = event;
});

window.addEventListener('appinstalled', () => {
  delete window.woonpickInstallPrompt;
  window.woonpickWebInstalled = true;
});
