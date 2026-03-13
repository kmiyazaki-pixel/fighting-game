'use strict';

function openHelpModal() {
  const modal = document.getElementById('help-modal');
  if (modal) modal.style.display = 'flex';
}

function closeHelpModal() {
  const modal = document.getElementById('help-modal');
  if (modal) modal.style.display = 'none';
}
