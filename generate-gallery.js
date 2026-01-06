const fs = require('fs');
const path = require('path');

const galleryDir = path.join(__dirname, 'test-results', 'gallery');
const outputFile = path.join(galleryDir, 'index.html');

if (!fs.existsSync(galleryDir)) {
  console.log('Gallery directory does not exist. Creating it...');
  fs.mkdirSync(galleryDir, { recursive: true });
}

// Get all PNG files
const files = fs.readdirSync(galleryDir).filter(f => f.endsWith('.png'));

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>MC Edit Demo - Test Gallery</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; padding: 40px; background: #f5f5f7; }
    .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 24px; }
    .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: transform 0.2s; }
    .card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    img { width: 100%; height: auto; display: block; border-bottom: 1px solid #eee; }
    .info { padding: 16px; }
    h3 { margin: 0 0 8px 0; font-size: 16px; color: #111; }
    p { margin: 0; font-size: 14px; color: #666; font-family: monospace; }
  </style>
</head>
<body>
  <h1>Test Screenshot Gallery</h1>
  <p>Generated at: ${new Date().toLocaleString()}</p>
  <div class="gallery">
    ${files.map(file => `
      <div class="card">
        <a href="${file}" target="_blank"><img src="${file}" alt="${file}" loading="lazy"></a>
        <div class="info">
          <h3>${file.replace(/-/g, ' ').replace('.png', '')}</h3>
          <p>${file}</p>
        </div>
      </div>
    `).join('')}
  </div>
  ${files.length === 0 ? '<p>No screenshots found. Did the tests pass?</p>' : ''}
</body>
</html>
`;

fs.writeFileSync(outputFile, html);
console.log(`Gallery generated at: ${outputFile}`);
