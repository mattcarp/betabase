// Run this in Safari Web Inspector Console on each AOMA page
// It will download the page HTML automatically

(function() {
  const html = document.documentElement.outerHTML;
  const url = window.location.href;
  const filename = url.replace(/[^a-zA-Z0-9]/g, '_') + '.html';

  // Create blob and download
  const blob = new Blob([html], { type: 'text/html' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();

  console.log(`✅ Downloaded ${filename} (${html.length} chars)`);
  console.log('Now navigate to next page and run this script again');
})();
