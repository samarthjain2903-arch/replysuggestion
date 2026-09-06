const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const placeholder = document.getElementById('placeholder');
const goBtn = document.getElementById('goBtn');
const status = document.getElementById('status');
const resultSection = document.getElementById('resultSection');
const resultList = document.getElementById('resultList');

let base64Image = null;

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target.result; // data:image/png;base64,....
    base64Image = result.split(',')[1];
    preview.src = result;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
    goBtn.disabled = false;
  };
  reader.readAsDataURL(file);
});

goBtn.addEventListener('click', async () => {
  goBtn.disabled = true;
  status.textContent = 'Thinking...';
  status.classList.remove('error');
  resultSection.style.display = 'none';
  resultList.innerHTML = '';

  try {
    const resp = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image })
    });
    const data = await resp.json();

    if (!resp.ok) {
      status.textContent = data.error || 'Something went wrong.';
      status.classList.add('error');
      goBtn.disabled = false;
      return;
    }

    data.suggestions.forEach((text) => {
      const card = document.createElement('div');
      card.className = 'suggestion-card';

      const p = document.createElement('p');
      p.textContent = text;

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      });

      card.appendChild(p);
      card.appendChild(copyBtn);
      resultList.appendChild(card);
    });

    resultSection.style.display = 'block';
    status.textContent = '';
  } catch (err) {
    status.textContent = 'Could not reach the server.';
    status.classList.add('error');
  }

  goBtn.disabled = false;
});
