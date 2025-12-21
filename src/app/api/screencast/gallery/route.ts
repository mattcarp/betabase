// src/app/api/screencast/gallery/route.ts
// API for managing the screencast gallery

import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir, readdir, stat } from "fs/promises";
import { join, basename } from "path";
import { homedir } from "os";

const GALLERY_DIR = join(homedir(), "Desktop/playwright-screencasts");
const GALLERY_FILE = join(GALLERY_DIR, "gallery.html");

interface GalleryItem {
  type: "video" | "image";
  src: string;
  title: string;
  description: string;
  duration?: string;
  timestamp: string;
}

// Gallery HTML template
function generateGalleryHTML(items: GalleryItem[], errors: string[] = []): string {
  const timestamp = new Date().toLocaleString();
  const itemsHTML = items
    .map((item) => {
      if (item.type === "video") {
        return `
      <div class="gallery-item video" data-type="video" data-src="${item.src}" data-title="${item.title}" onclick="openLightbox(this)">
        <div class="item-header">
          <div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
          </div>
          <span class="badge video">VIDEO</span>
        </div>
        <div class="item-preview">
          <div class="video-thumbnail">
            <div class="play-icon"></div>
          </div>
          ${item.duration ? `<span class="video-duration">${item.duration}</span>` : ""}
        </div>
      </div>`;
      } else {
        return `
      <div class="gallery-item image" data-type="image" data-src="${item.src}" data-title="${item.title}" onclick="openLightbox(this)">
        <div class="item-header">
          <div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
          </div>
          <span class="badge image">IMG</span>
        </div>
        <div class="item-preview">
          <img src="${item.src}" alt="${item.title}" loading="lazy">
        </div>
      </div>`;
      }
    })
    .join("\n");

  const errorsHTML =
    errors.length > 0
      ? `<div class="errors"><h3>Console Errors (Latest Recording)</h3><pre>${errors.join("\n")}</pre></div>`
      : `<div class="no-errors">No console errors in latest recording</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Screencast Gallery</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      padding: 40px 20px;
      color: #e0e0e0;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 10px;
      background: linear-gradient(90deg, #ef4444, #f97316);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle { text-align: center; color: #888; margin-bottom: 30px; }
    .metadata {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
    .metadata-item { }
    .metadata-label { color: #888; font-size: 0.85rem; margin-bottom: 4px; }
    .metadata-value { color: #ef4444; font-family: monospace; }
    .errors {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .errors h3 { color: #ef4444; margin-bottom: 10px; }
    .errors pre { color: #fca5a5; font-size: 0.85rem; white-space: pre-wrap; max-height: 200px; overflow-y: auto; }
    .no-errors {
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 12px;
      padding: 15px 20px;
      margin-bottom: 30px;
      color: #22c55e;
    }
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
    }
    .gallery-item {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }
    .gallery-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.3);
      border-color: rgba(0, 217, 255, 0.3);
    }
    .gallery-item.video:hover {
      border-color: rgba(239, 68, 68, 0.5);
    }
    .item-header {
      padding: 16px;
      background: rgba(0,0,0,0.2);
      border-bottom: 1px solid rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .item-header h3 { font-size: 1rem; color: #fff; margin-bottom: 4px; flex: 1; }
    .item-header p { font-size: 0.8rem; color: #888; }
    .item-header .badge {
      font-size: 0.7rem;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 500;
      text-transform: uppercase;
    }
    .badge.image { background: rgba(0, 217, 255, 0.2); color: #00d9ff; }
    .badge.video { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .item-preview {
      padding: 12px;
      background: #0a0a0a;
      position: relative;
    }
    .item-preview img,
    .item-preview .video-thumbnail {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .video-thumbnail {
      background: linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .play-icon {
      width: 64px;
      height: 64px;
      background: rgba(239, 68, 68, 0.9);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, background 0.2s;
    }
    .gallery-item:hover .play-icon {
      transform: scale(1.1);
      background: rgba(239, 68, 68, 1);
    }
    .play-icon::after {
      content: '';
      width: 0;
      height: 0;
      border-left: 20px solid white;
      border-top: 12px solid transparent;
      border-bottom: 12px solid transparent;
      margin-left: 4px;
    }
    .video-duration {
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: rgba(0,0,0,0.8);
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-family: monospace;
    }
    .lightbox {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.95);
      z-index: 9999;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .lightbox.active { display: flex; }
    .lightbox img,
    .lightbox video {
      max-width: 95%;
      max-height: 85%;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .lightbox video { background: #000; }
    .lightbox-close {
      position: absolute;
      top: 20px;
      right: 30px;
      color: #fff;
      font-size: 2rem;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
      z-index: 10001;
    }
    .lightbox-close:hover { opacity: 1; }
    .lightbox-caption {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      color: #fff;
      background: rgba(0,0,0,0.7);
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 0.9rem;
      max-width: 80%;
      text-align: center;
    }
    .lightbox-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      color: #fff;
      font-size: 3rem;
      cursor: pointer;
      opacity: 0.5;
      transition: opacity 0.2s;
      user-select: none;
      padding: 20px;
    }
    .lightbox-nav:hover { opacity: 1; }
    .lightbox-nav.prev { left: 10px; }
    .lightbox-nav.next { right: 10px; }
    footer {
      text-align: center;
      margin-top: 50px;
      padding-top: 25px;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: #666;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Screencast Gallery</h1>
    <p class="subtitle">AI Test Generator Recordings</p>

    <div class="metadata">
      <div class="metadata-item">
        <div class="metadata-label">Location</div>
        <div class="metadata-value">~/Desktop/playwright-screencasts/</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Updated</div>
        <div class="metadata-value">${timestamp}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Items</div>
        <div class="metadata-value">${items.length} recordings</div>
      </div>
    </div>

    ${errorsHTML}

    <div class="gallery">
${itemsHTML}
    </div>

    <footer>
      <p>Generated by SIAM AI Test Generator</p>
    </footer>
  </div>

  <div class="lightbox" id="lightbox">
    <span class="lightbox-close" onclick="closeLightbox()">&times;</span>
    <span class="lightbox-nav prev" onclick="navigateLightbox(-1)">&#8249;</span>
    <img id="lightbox-img" src="" alt="" style="display: none;">
    <video id="lightbox-video" controls style="display: none;"></video>
    <span class="lightbox-nav next" onclick="navigateLightbox(1)">&#8250;</span>
    <div class="lightbox-caption" id="lightbox-caption"></div>
  </div>

  <script>
    let currentIndex = 0;
    const items = Array.from(document.querySelectorAll('.gallery-item'));

    function openLightbox(element) {
      currentIndex = items.indexOf(element);
      showItem(currentIndex);
      document.getElementById('lightbox').classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function showItem(index) {
      const item = items[index];
      const type = item.dataset.type;
      const src = item.dataset.src;
      const title = item.dataset.title;

      const img = document.getElementById('lightbox-img');
      const video = document.getElementById('lightbox-video');
      const caption = document.getElementById('lightbox-caption');

      video.pause();
      video.src = '';

      if (type === 'video') {
        img.style.display = 'none';
        video.style.display = 'block';
        video.src = src;
        video.play();
      } else {
        video.style.display = 'none';
        img.style.display = 'block';
        img.src = src;
      }

      caption.textContent = title;
    }

    function closeLightbox() {
      const lightbox = document.getElementById('lightbox');
      const video = document.getElementById('lightbox-video');
      video.pause();
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }

    function navigateLightbox(direction) {
      event.stopPropagation();
      currentIndex = (currentIndex + direction + items.length) % items.length;
      showItem(currentIndex);
    }

    document.addEventListener('keydown', (e) => {
      const lightbox = document.getElementById('lightbox');
      if (!lightbox.classList.contains('active')) return;

      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
      if (e.key === ' ') {
        e.preventDefault();
        const video = document.getElementById('lightbox-video');
        if (video.style.display !== 'none') {
          video.paused ? video.play() : video.pause();
        }
      }
    });

    document.getElementById('lightbox').addEventListener('click', (e) => {
      if (e.target.id === 'lightbox') closeLightbox();
    });
  </script>
</body>
</html>`;
}

// Parse existing gallery to extract items
function parseGalleryItems(html: string): GalleryItem[] {
  const items: GalleryItem[] = [];
  const itemRegex =
    /<div class="gallery-item (video|image)" data-type="(video|image)" data-src="([^"]+)" data-title="([^"]+)"/g;

  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    const [, , type, src, title] = match;
    items.push({
      type: type as "video" | "image",
      src,
      title,
      description: "", // We don't parse description back
      timestamp: new Date().toISOString(),
    });
  }

  return items;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoPath, title, description, consoleErrors = [] } = body;

    if (!videoPath) {
      return NextResponse.json({ error: "videoPath is required" }, { status: 400 });
    }

    // Ensure gallery directory exists
    await mkdir(GALLERY_DIR, { recursive: true });

    // Get existing items from gallery if it exists
    let items: GalleryItem[] = [];
    try {
      const existingHTML = await readFile(GALLERY_FILE, "utf-8");
      items = parseGalleryItems(existingHTML);
    } catch {
      // Gallery doesn't exist yet, start fresh
    }

    // Add new video item at the beginning
    const filename = basename(videoPath);
    const newItem: GalleryItem = {
      type: "video",
      src: filename, // Use relative path since gallery is in same folder
      title: title || filename.replace(/\.webm$/, "").replace(/-/g, " "),
      description: description || `Recorded ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString(),
    };

    // Add to beginning of array (newest first)
    items.unshift(newItem);

    // Generate and write new gallery HTML
    const html = generateGalleryHTML(items, consoleErrors);
    await writeFile(GALLERY_FILE, html, "utf-8");

    return NextResponse.json({
      success: true,
      galleryPath: GALLERY_FILE,
      itemCount: items.length,
    });
  } catch (error) {
    console.error("Gallery generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Scan directory for videos and return gallery info
    await mkdir(GALLERY_DIR, { recursive: true });

    const files = await readdir(GALLERY_DIR);
    const videos = files.filter((f) => f.endsWith(".webm"));

    const items: GalleryItem[] = [];
    for (const video of videos) {
      const filePath = join(GALLERY_DIR, video);
      const stats = await stat(filePath);
      items.push({
        type: "video",
        src: video,
        title: video.replace(/\.webm$/, "").replace(/-/g, " "),
        description: `Recorded ${stats.mtime.toLocaleString()}`,
        timestamp: stats.mtime.toISOString(),
      });
    }

    // Sort by timestamp, newest first
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      galleryDir: GALLERY_DIR,
      galleryFile: GALLERY_FILE,
      items,
    });
  } catch (error) {
    console.error("Gallery scan error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
