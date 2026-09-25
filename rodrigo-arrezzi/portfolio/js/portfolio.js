function showTab(tab) {
      document.getElementById('tab-projects').classList.toggle('hidden-section', tab !== 'projects');
      document.getElementById('tab-certs').classList.toggle('hidden-section', tab !== 'certs');
      document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', (i === 0 && tab === 'projects') || (i === 1 && tab === 'certs'));
      });
    }
