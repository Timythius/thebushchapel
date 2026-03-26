import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs';

const pdfUrl = document.querySelector('.pdf-download a').getAttribute('href');
const wrapper = document.getElementById('pdf-canvas-wrapper');
const prevBtn = document.getElementById('pdf-prev');
const nextBtn = document.getElementById('pdf-next');
const pageInfo = document.getElementById('pdf-page-info');
const zoomInBtn = document.getElementById('pdf-zoom-in');
const zoomOutBtn = document.getElementById('pdf-zoom-out');

if (wrapper && pdfUrl) {
    let pdfDoc = null;
    let currentPage = 1;
    let userZoom = 1;
    const ZOOM_STEP = 0.25;
    const ZOOM_MIN = 0.5;
    const ZOOM_MAX = 3;

    function renderPage(num) {
        pdfDoc.getPage(num).then(page => {
            const dpr = window.devicePixelRatio || 1;
            const containerWidth = wrapper.clientWidth;
            const unscaledViewport = page.getViewport({ scale: 1 });

            // Base scale fits the page to the container width
            const baseScale = containerWidth / unscaledViewport.width;
            const cssScale = baseScale * userZoom;
            // Render at higher resolution for sharp text on Retina displays
            const renderScale = cssScale * dpr;

            const viewport = page.getViewport({ scale: renderScale });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            // CSS size is the logical size (before DPR multiplication)
            canvas.style.width = Math.round(viewport.width / dpr) + 'px';
            canvas.style.height = Math.round(viewport.height / dpr) + 'px';

            wrapper.innerHTML = '';
            wrapper.appendChild(canvas);

            page.render({
                canvasContext: canvas.getContext('2d'),
                viewport: viewport
            });

            pageInfo.textContent = `${num} / ${pdfDoc.numPages}`;
            prevBtn.disabled = num <= 1;
            nextBtn.disabled = num >= pdfDoc.numPages;
            if (zoomOutBtn) zoomOutBtn.disabled = userZoom <= ZOOM_MIN;
            if (zoomInBtn) zoomInBtn.disabled = userZoom >= ZOOM_MAX;
        });
    }

    pdfjsLib.getDocument(pdfUrl).promise.then(pdf => {
        pdfDoc = pdf;
        renderPage(1);
    }).catch(() => {
        wrapper.innerHTML = '<div class="pdf-loading">Unable to load PDF. Please use the download link below.</div>';
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; renderPage(currentPage); }
    });
    nextBtn.addEventListener('click', () => {
        if (pdfDoc && currentPage < pdfDoc.numPages) { currentPage++; renderPage(currentPage); }
    });

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            if (userZoom < ZOOM_MAX) {
                userZoom = Math.min(userZoom + ZOOM_STEP, ZOOM_MAX);
                renderPage(currentPage);
            }
        });
    }
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            if (userZoom > ZOOM_MIN) {
                userZoom = Math.max(userZoom - ZOOM_STEP, ZOOM_MIN);
                renderPage(currentPage);
            }
        });
    }

    // Re-render on window resize for responsive scaling
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (pdfDoc) renderPage(currentPage);
        }, 200);
    });
}
