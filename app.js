/* ============================================
   Lanki - Greeting Card Generator
   Core Application Logic
   ============================================ */

(function () {
    'use strict';

    // ---- Constants ----
    const ADMIN_CODE = '5183';
    const MAX_IMAGES = 4;
    const STORAGE_KEY = 'lanki_data';

    // ---- Default settings (matched to the Eid card reference image) ----
    const DEFAULT_SETTINGS = {
        arabic: {
            fontFamily: 'Tajawal',
            fontSize: 36,
            fontColor: '#1B3A5C',
            posX: 50,
            posY: 82
        },
        english: {
            fontFamily: 'Century Gothic, CenturyGothic, AppleGothic, sans-serif',
            fontSize: 28,
            fontColor: '#1B3A5C',
            posX: 50,
            posY: 87
        },
        images: []
    };

    // ---- State ----
    let state = loadState();
    let selectedCardIndex = -1;
    let currentImage = null; // loaded Image object for the selected card

    // ---- DOM References ----
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dom = {
        // Sections
        selectionSection: $('#selectionSection'),
        editorSection: $('#editorSection'),
        cardGrid: $('#cardGrid'),
        emptyState: $('#emptyState'),
        // Editor
        previewCanvas: $('#previewCanvas'),
        arabicInput: $('#arabicInput'),
        englishInput: $('#englishInput'),
        downloadBtn: $('#downloadBtn'),
        backBtn: $('#backBtn'),
        // Admin
        adminBtn: $('#adminBtn'),
        adminModal: $('#adminModal'),
        adminAuth: $('#adminAuth'),
        adminDashboard: $('#adminDashboard'),
        adminCode: $('#adminCode'),
        authError: $('#authError'),
        authSubmit: $('#authSubmit'),
        closeAuthBtn: $('#closeAuthBtn'),
        closeDashBtn: $('#closeDashBtn'),
        adminImageGrid: $('#adminImageGrid'),
        uploadArea: $('#uploadArea'),
        imageUpload: $('#imageUpload'),
        imageCount: $('#imageCount'),
        saveSettings: $('#saveSettings'),
        // Settings inputs
        arFontFamily: $('#arFontFamily'),
        arFontSize: $('#arFontSize'),
        arFontSizeVal: $('#arFontSizeVal'),
        arFontColor: $('#arFontColor'),
        arColorHex: $('#arColorHex'),
        arPosY: $('#arPosY'),
        arPosYVal: $('#arPosYVal'),
        arPosX: $('#arPosX'),
        arPosXVal: $('#arPosXVal'),
        enFontFamily: $('#enFontFamily'),
        enFontSize: $('#enFontSize'),
        enFontSizeVal: $('#enFontSizeVal'),
        enFontColor: $('#enFontColor'),
        enColorHex: $('#enColorHex'),
        enPosY: $('#enPosY'),
        enPosYVal: $('#enPosYVal'),
        enPosX: $('#enPosX'),
        enPosXVal: $('#enPosXVal'),
        // Toast
        toast: $('#toast')
    };

    // ---- Persistence ----
    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Merge with defaults to fill any missing fields
                return {
                    arabic: { ...DEFAULT_SETTINGS.arabic, ...parsed.arabic },
                    english: { ...DEFAULT_SETTINGS.english, ...parsed.english },
                    images: parsed.images || []
                };
            }
        } catch (e) {
            console.warn('Failed to load state:', e);
        }
        return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('Failed to save state:', e);
            showToast('Storage full. Try removing some images.', 'error');
        }
    }

    // ---- Toast ----
    let toastTimer;
    function showToast(message, type) {
        clearTimeout(toastTimer);
        dom.toast.textContent = message;
        dom.toast.className = 'toast show' + (type ? ' toast-' + type : '');
        toastTimer = setTimeout(() => {
            dom.toast.className = 'toast hidden';
        }, 2800);
    }

    // ---- Card Grid ----
    function renderCardGrid() {
        dom.cardGrid.innerHTML = '';
        if (state.images.length === 0) {
            dom.emptyState.classList.remove('hidden');
            dom.cardGrid.classList.add('hidden');
            return;
        }
        dom.emptyState.classList.add('hidden');
        dom.cardGrid.classList.remove('hidden');

        state.images.forEach((imgData, index) => {
            const item = document.createElement('div');
            item.className = 'card-item';
            item.innerHTML = `
                <img src="${imgData}" alt="Card ${index + 1}" loading="lazy">
                <div class="card-overlay"><span>Select this card</span></div>
            `;
            item.addEventListener('click', () => selectCard(index));
            dom.cardGrid.appendChild(item);
        });
    }

    // ---- Card Selection ----
    function selectCard(index) {
        selectedCardIndex = index;
        dom.selectionSection.classList.add('hidden');
        dom.editorSection.classList.remove('hidden');

        // Reset inputs
        dom.arabicInput.value = '';
        dom.englishInput.value = '';
        dom.downloadBtn.disabled = true;

        // Load image and render
        currentImage = new Image();
        currentImage.crossOrigin = 'anonymous';
        currentImage.onload = () => renderPreview();
        currentImage.src = state.images[index];
    }

    function goBack() {
        dom.editorSection.classList.add('hidden');
        dom.selectionSection.classList.remove('hidden');
        selectedCardIndex = -1;
        currentImage = null;
    }

    // ---- Canvas Preview ----
    function renderPreview() {
        if (!currentImage || !currentImage.complete) return;

        const canvas = dom.previewCanvas;
        const ctx = canvas.getContext('2d');
        const w = currentImage.naturalWidth;
        const h = currentImage.naturalHeight;
        canvas.width = w;
        canvas.height = h;

        // Draw image
        ctx.drawImage(currentImage, 0, 0, w, h);

        const arabicText = dom.arabicInput.value.trim();
        const englishText = dom.englishInput.value.trim();

        // Draw Arabic text
        if (arabicText) {
            const ar = state.arabic;
            const fontSize = Math.round(ar.fontSize * (w / 1080));
            ctx.font = `700 ${fontSize}px "${ar.fontFamily}", sans-serif`;
            ctx.fillStyle = ar.fontColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.direction = 'rtl';
            const x = Math.round(w * ar.posX / 100);
            const y = Math.round(h * ar.posY / 100);
            ctx.fillText(arabicText, x, y);
        }

        // Draw English text
        if (englishText) {
            const en = state.english;
            const fontSize = Math.round(en.fontSize * (w / 1080));
            ctx.font = `700 ${fontSize}px ${en.fontFamily}`;
            ctx.fillStyle = en.fontColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.direction = 'ltr';
            const x = Math.round(w * en.posX / 100);
            const y = Math.round(h * en.posY / 100);
            ctx.fillText(englishText, x, y);
        }
    }

    // ---- Download ----
    function downloadCard() {
        if (!currentImage) return;

        // Render at full resolution
        renderPreview();

        const canvas = dom.previewCanvas;
        const link = document.createElement('a');
        const arabicName = dom.arabicInput.value.trim();
        const englishName = dom.englishInput.value.trim();
        const fileName = (englishName || arabicName || 'greeting-card').replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '').replace(/\s+/g, '-');
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        showToast('Card downloaded successfully!', 'success');
    }

    // ---- Update download button state ----
    function updateDownloadState() {
        const hasArabic = dom.arabicInput.value.trim().length > 0;
        const hasEnglish = dom.englishInput.value.trim().length > 0;
        dom.downloadBtn.disabled = !(hasArabic || hasEnglish);
    }

    // ---- Admin Panel ----
    function openAdmin() {
        dom.adminModal.classList.remove('hidden');
        dom.adminAuth.classList.remove('hidden');
        dom.adminDashboard.classList.add('hidden');
        dom.adminCode.value = '';
        dom.authError.classList.add('hidden');
        setTimeout(() => dom.adminCode.focus(), 100);
    }

    function closeAdmin() {
        dom.adminModal.classList.add('hidden');
        dom.adminCode.value = '';
        dom.authError.classList.add('hidden');
        // Refresh card grid in case images changed
        renderCardGrid();
        // If we were in editor, re-render preview with new settings
        if (selectedCardIndex >= 0 && currentImage) {
            renderPreview();
        }
    }

    function authenticate() {
        if (dom.adminCode.value === ADMIN_CODE) {
            dom.adminAuth.classList.add('hidden');
            dom.adminDashboard.classList.remove('hidden');
            populateAdminSettings();
            renderAdminImages();
        } else {
            dom.authError.classList.remove('hidden');
            dom.adminCode.value = '';
            dom.adminCode.focus();
        }
    }

    // ---- Admin: Settings ----
    function populateAdminSettings() {
        // Arabic
        dom.arFontFamily.value = state.arabic.fontFamily;
        dom.arFontSize.value = state.arabic.fontSize;
        dom.arFontSizeVal.textContent = state.arabic.fontSize + 'px';
        dom.arFontColor.value = state.arabic.fontColor;
        dom.arColorHex.textContent = state.arabic.fontColor;
        dom.arPosY.value = state.arabic.posY;
        dom.arPosYVal.textContent = state.arabic.posY + '%';
        dom.arPosX.value = state.arabic.posX;
        dom.arPosXVal.textContent = state.arabic.posX + '%';
        // English
        dom.enFontFamily.value = state.english.fontFamily;
        dom.enFontSize.value = state.english.fontSize;
        dom.enFontSizeVal.textContent = state.english.fontSize + 'px';
        dom.enFontColor.value = state.english.fontColor;
        dom.enColorHex.textContent = state.english.fontColor;
        dom.enPosY.value = state.english.posY;
        dom.enPosYVal.textContent = state.english.posY + '%';
        dom.enPosX.value = state.english.posX;
        dom.enPosXVal.textContent = state.english.posX + '%';
    }

    function saveSettings() {
        state.arabic.fontFamily = dom.arFontFamily.value;
        state.arabic.fontSize = parseInt(dom.arFontSize.value, 10);
        state.arabic.fontColor = dom.arFontColor.value;
        state.arabic.posY = parseInt(dom.arPosY.value, 10);
        state.arabic.posX = parseInt(dom.arPosX.value, 10);

        state.english.fontFamily = dom.enFontFamily.value;
        state.english.fontSize = parseInt(dom.enFontSize.value, 10);
        state.english.fontColor = dom.enFontColor.value;
        state.english.posY = parseInt(dom.enPosY.value, 10);
        state.english.posX = parseInt(dom.enPosX.value, 10);

        saveState();
        showToast('Settings saved successfully!', 'success');
    }

    // ---- Admin: Image Management ----
    function renderAdminImages() {
        dom.adminImageGrid.innerHTML = '';
        dom.imageCount.textContent = `${state.images.length}/${MAX_IMAGES}`;

        state.images.forEach((imgData, index) => {
            const item = document.createElement('div');
            item.className = 'admin-image-item';
            item.innerHTML = `
                <img src="${imgData}" alt="Card ${index + 1}">
                <button class="admin-image-remove" data-index="${index}" title="Remove">&times;</button>
            `;
            dom.adminImageGrid.appendChild(item);
        });

        // Remove button handlers
        dom.adminImageGrid.querySelectorAll('.admin-image-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index, 10);
                removeImage(idx);
            });
        });

        // Toggle upload area
        if (state.images.length >= MAX_IMAGES) {
            dom.uploadArea.classList.add('upload-disabled');
        } else {
            dom.uploadArea.classList.remove('upload-disabled');
        }
    }

    function addImage(dataUrl) {
        if (state.images.length >= MAX_IMAGES) {
            showToast(`Maximum ${MAX_IMAGES} images allowed.`, 'error');
            return;
        }
        state.images.push(dataUrl);
        saveState();
        renderAdminImages();
        showToast('Image uploaded!', 'success');
    }

    function removeImage(index) {
        state.images.splice(index, 1);
        saveState();
        renderAdminImages();
        // If the removed image was selected, go back
        if (selectedCardIndex === index) {
            goBack();
        } else if (selectedCardIndex > index) {
            selectedCardIndex--;
        }
        showToast('Image removed.', '');
    }

    function handleImageUpload(file) {
        if (!file || !file.type.startsWith('image/')) return;
        if (state.images.length >= MAX_IMAGES) {
            showToast(`Maximum ${MAX_IMAGES} images allowed.`, 'error');
            return;
        }

        // Resize large images to avoid localStorage limits
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const maxDim = 2048;
                let w = img.naturalWidth;
                let h = img.naturalHeight;
                if (w > maxDim || h > maxDim) {
                    const scale = maxDim / Math.max(w, h);
                    w = Math.round(w * scale);
                    h = Math.round(h * scale);
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                addImage(dataUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // ---- Range Input Helpers ----
    function setupRangeSync(rangeEl, displayEl, suffix) {
        rangeEl.addEventListener('input', () => {
            displayEl.textContent = rangeEl.value + suffix;
        });
    }

    function setupColorSync(colorEl, hexEl) {
        colorEl.addEventListener('input', () => {
            hexEl.textContent = colorEl.value.toUpperCase();
        });
    }

    // ---- Event Binding ----
    function init() {
        // Card grid
        renderCardGrid();

        // Editor inputs
        dom.arabicInput.addEventListener('input', () => {
            updateDownloadState();
            renderPreview();
        });
        dom.englishInput.addEventListener('input', () => {
            updateDownloadState();
            renderPreview();
        });

        // Download
        dom.downloadBtn.addEventListener('click', downloadCard);

        // Back
        dom.backBtn.addEventListener('click', goBack);

        // Admin open
        dom.adminBtn.addEventListener('click', openAdmin);

        // Admin close
        dom.closeAuthBtn.addEventListener('click', closeAdmin);
        dom.closeDashBtn.addEventListener('click', closeAdmin);
        dom.adminModal.addEventListener('click', (e) => {
            if (e.target === dom.adminModal) closeAdmin();
        });

        // Auth
        dom.authSubmit.addEventListener('click', authenticate);
        dom.adminCode.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') authenticate();
        });

        // Image upload
        dom.imageUpload.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => handleImageUpload(file));
            e.target.value = '';
        });

        // Drag and drop
        dom.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dom.uploadArea.classList.add('drag-over');
        });
        dom.uploadArea.addEventListener('dragleave', () => {
            dom.uploadArea.classList.remove('drag-over');
        });
        dom.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dom.uploadArea.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            files.forEach(file => handleImageUpload(file));
        });

        // Save settings
        dom.saveSettings.addEventListener('click', saveSettings);

        // Range syncs
        setupRangeSync(dom.arFontSize, dom.arFontSizeVal, 'px');
        setupRangeSync(dom.arPosY, dom.arPosYVal, '%');
        setupRangeSync(dom.arPosX, dom.arPosXVal, '%');
        setupRangeSync(dom.enFontSize, dom.enFontSizeVal, 'px');
        setupRangeSync(dom.enPosY, dom.enPosYVal, '%');
        setupRangeSync(dom.enPosX, dom.enPosXVal, '%');

        // Color syncs
        setupColorSync(dom.arFontColor, dom.arColorHex);
        setupColorSync(dom.enFontColor, dom.enColorHex);

        // Keyboard: Escape closes admin modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !dom.adminModal.classList.contains('hidden')) {
                closeAdmin();
            }
        });
    }

    // Make closeAdmin available globally for inline onclick (if any residual)
    window.closeAdmin = closeAdmin;

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
