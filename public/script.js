const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const thumbGrid = document.getElementById('thumbGrid');
const placeholder = document.getElementById('placeholder');
const goBtn = document.getElementById('goBtn');
const status = document.getElementById('status');
const resultSection = document.getElementById('resultSection');
const resultList = document.getElementById('resultList');
const modelUsed = document.getElementById('modelUsed');

let imageData = []; // [{ data: base64string, mimeType: 'image/jpeg' }, ...]

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  const files = Array.from(fileInput.files);
  if (!files.length) return;

  imageData = [];
  thumbGrid.innerHTML = '';
  placeholder.style.display = 'none';
  thumbGrid.style.display = 'grid';

  let loaded = 0;
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target.result; // data:image/jpeg;base64,....
      imageData.push({
        data: result.split(',')[1],
        mimeType: file.type || 'image/png' // real type from the actual file
      });

      const img = document.createElement('img');
      img.src = result;
      img.className = 'thumb';
      thumbGrid.appendChild(img);

      loaded++;
      if (loaded === files.length) {
        goBtn.disabled = false;
      }
    };
    reader.readAsDataURL(file);
  });
});

goBtn.addEventListener('click', async () => {
  goBtn.disabled = true;
  status.textContent = 'Thinking...';
  status.classList.remove('error');
  resultSection.style.display = 'none';
  resultList.innerHTML = '';
  modelUsed.innerHTML = '';

  try {
    const resp = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: imageData })
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

    let infoHtml = '';
    if (data.usedModel) {
      infoHtml += `Powered by ${data.usedProvider}: ${data.usedModel}`;
    }
    if (data.fallbackNote) {
      infoHtml += `<br><span style="color:#C2185B;">Fell back after: ${data.fallbackNote}</span>`;
    }
    modelUsed.innerHTML = infoHtml;

    resultSection.style.display = 'block';
    status.textContent = '';
  } catch (err) {
    status.textContent = 'Could not reach the server.';
    status.classList.add('error');
  }

  goBtn.disabled = false;
});