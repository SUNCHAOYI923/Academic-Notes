(function() {
    if (document.getElementById('my-image-overlay')) return;

    /*
    function expandAllDetails() {
        document.querySelectorAll('details:not([open])').forEach(detail => {
            detail.setAttribute('open', '');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', expandAllDetails);
    } else {
        expandAllDetails();
    }

    const observer = new MutationObserver(function(mutations) {
        let shouldExpand = false;
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                shouldExpand = true;
                break;
            }
        }
        if (shouldExpand) {
            expandAllDetails();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    */
    const overlay = document.createElement('div');
    overlay.id = 'my-image-overlay';

    const closeBtn = document.createElement('div');
    closeBtn.id = 'my-close-btn';
    closeBtn.innerHTML = '&times;';

    const zoomedImg = document.createElement('img');
    zoomedImg.id = 'my-zoomed-img';

    overlay.appendChild(closeBtn);
    overlay.appendChild(zoomedImg);
    document.body.appendChild(overlay);

    function closeZoom() {
        if (overlay.classList.contains('show')) {
            overlay.style.pointerEvents = 'none';
            overlay.classList.remove('show');
            zoomedImg.classList.remove('show');
            setTimeout(() => {
                zoomedImg.src = '';
            }, 300);
        }
    }

    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'IMG' && e.target.id !== 'my-zoomed-img') {
            if (e.target.clientWidth < 50) return;
            zoomedImg.src = e.target.src;
            overlay.style.pointerEvents = 'auto';
            overlay.classList.add('show');
            zoomedImg.classList.add('show');
        } else if (e.target === overlay || e.target === closeBtn) {
            closeZoom();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
            closeZoom();
        }
    });

    const pb = document.createElement('div');
    pb.id = 'my-progress-bar';
    document.body.appendChild(pb);

    document.addEventListener('scroll', function(e) {
        const t = e.target === document ? document.documentElement : e.target;
        const h = t.scrollHeight - t.clientHeight;
        if (h > 0) {
            pb.style.width = (t.scrollTop / h * 100) + '%';
        }
    }, true);

    const bqs = document.querySelectorAll('blockquote');
    bqs.forEach(function(bq) {
        let html = bq.innerHTML;
        if (html.includes('$$')) {
            let parts = html.split('$$');
            for (let i = 1; i < parts.length; i += 2) {
                parts[i] = parts[i].replace(/(^|<br\s*\/?>|\n|<p>)\s*(?:&gt;|>)\s?/gi, '$1');
            }
            bq.innerHTML = parts.join('$$');
        }
    });

    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(function(code) {
        const pre = code.parentElement;
        if (pre.querySelector('.code-lang-label')) return;
        
        let lang = '';
        code.classList.forEach(function(className) {
            if (className.startsWith('language-')) {
                lang = className.replace('language-', '');
            }
        });

        if (!lang && code.className) {
            const match = code.className.match(/([a-zA-Z0-9]+)/);
            if (match && match[1] !== 'hljs') {
                lang = match[1];
            }
        }

        if (lang) {
            const label = document.createElement('div');
            label.className = 'code-lang-label';
            label.textContent = lang.toUpperCase();
            pre.appendChild(label);
        }
    });
        const exportFloatBtn = document.createElement('button');
    exportFloatBtn.id = 'my-floating-export';
    exportFloatBtn.innerHTML = '🖨️ Export PDF';
    document.body.appendChild(exportFloatBtn);

    const exportModal = document.createElement('div');
    exportModal.id = 'my-export-modal';
    exportModal.innerHTML = `
        <div class="export-modal-content">
            <h3 style="margin-top:0; color: #4A90E2; border-bottom: 2px solid #f0f5ff; padding-bottom: 10px;">🖨️ Export PDF Settings</h3>
            <label style="display:flex; align-items:center; gap:10px;">
                <input type="radio" name="export-mode" value="all" checked>
                Export entire page
            </label>
            <label style="display:flex; align-items:center; gap:10px;">
                <input type="radio" name="export-mode" value="selection">
                Export selected content only
                <button id="export-reselect-btn" style="display:none; padding:4px 8px; font-size:12px; border-radius:6px; border:none; background:#e8f0fe; color:#4A90E2; cursor:pointer;">Select Area</button>
            </label>
            <label style="display:flex; align-items:center; gap:10px; margin-top:5px;">
                <input type="checkbox" id="export-expand-details" checked>
                Auto-expand details
            </label>
            <label style="display:flex; align-items:center; gap:10px; margin-top:5px;">
                Print Font Size:
                <input type="number" id="export-font-size" value="12" min="6" max="72" step="1" style="width: 70px;"> pts
            </label>
            <div id="export-font-error" style="color: #E74C3C; font-size: 13px; display: none;">Invalid input. Enter an integer (6-72).</div>
            <div class="export-actions">
                <button id="export-btn-cancel">Cancel</button>
                <button id="export-btn-confirm">Generate PDF</button>
            </div>
        </div>
    `;
    document.body.appendChild(exportModal);

    const selectToolbar = document.createElement('div');
    selectToolbar.id = 'my-select-toolbar';
    selectToolbar.innerHTML = `
        <span style="font-size:15px; font-weight:bold;">Highlight the content on the page you want to export:</span>
        <button id="my-select-confirm">Confirm Selection</button>
        <button id="my-select-cancel">Cancel</button>
    `;
    document.body.appendChild(selectToolbar);

    const radioAll = document.querySelector('input[value="all"]');
    const radioSelection = document.querySelector('input[value="selection"]');
    const reselectBtn = document.getElementById('export-reselect-btn');
    const checkboxExpand = document.getElementById('export-expand-details');
    const inputFont = document.getElementById('export-font-size');
    const fontError = document.getElementById('export-font-error');

    let savedSelectionFragment = null;

    function openSelectionMode() {
        exportModal.style.display = 'none';
        selectToolbar.style.display = 'flex';
        window.getSelection().removeAllRanges();
    }

    exportFloatBtn.addEventListener('click', () => {
        const sel = window.getSelection();
        if (sel.rangeCount > 0 && sel.toString().trim().length > 0) {
            savedSelectionFragment = sel.getRangeAt(0).cloneContents();
            radioSelection.checked = true;
            reselectBtn.style.display = 'inline-block';
        } else {
            savedSelectionFragment = null;
            radioAll.checked = true;
            reselectBtn.style.display = 'none';
        }
        exportModal.style.display = 'flex';
        fontError.style.display = 'none';
    });

    radioSelection.addEventListener('change', (e) => {
        if (e.target.checked) openSelectionMode();
    });

    reselectBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSelectionMode();
    });

    radioAll.addEventListener('change', (e) => {
        if (e.target.checked) reselectBtn.style.display = 'none';
    });

    document.getElementById('my-select-confirm').addEventListener('click', () => {
        const sel = window.getSelection();
        if (sel.rangeCount > 0 && sel.toString().trim().length > 0) {
            savedSelectionFragment = sel.getRangeAt(0).cloneContents();
            radioSelection.checked = true;
            reselectBtn.style.display = 'inline-block';
        } else {
            savedSelectionFragment = null;
            radioAll.checked = true;
            reselectBtn.style.display = 'none';
        }
        selectToolbar.style.display = 'none';
        exportModal.style.display = 'flex';
    });

    document.getElementById('my-select-cancel').addEventListener('click', () => {
        if (!savedSelectionFragment) {
            radioAll.checked = true;
            reselectBtn.style.display = 'none';
        }
        selectToolbar.style.display = 'none';
        exportModal.style.display = 'flex';
    });

    document.getElementById('export-btn-cancel').addEventListener('click', () => {
        exportModal.style.display = 'none';
    });

    document.getElementById('export-btn-confirm').addEventListener('click', () => {
        const rawValue = inputFont.value.trim();
        const fontScale = Number(rawValue);
        
        if (!Number.isInteger(fontScale) || fontScale < 6 || fontScale > 72) {
            fontError.style.display = 'block';
            return;
        }
        
        fontError.style.display = 'none';
        exportModal.style.display = 'none';
        
        const isSelectionOnly = radioSelection.checked && savedSelectionFragment;
        const isExpand = checkboxExpand.checked;

        const originalDetailsStates = new Map();
        const originalDisplays = new Map();
        let printContainer = null;

        if (isExpand) {
            document.querySelectorAll('details').forEach(d => {
                originalDetailsStates.set(d, d.hasAttribute('open'));
                d.setAttribute('open', '');
            });
        }

        const dynamicStyle = document.createElement('style');
        dynamicStyle.id = 'my-print-dynamic-style';
        dynamicStyle.textContent = `
            @media print {
                .main, .content, main, #my-print-container,
                .main *, .content *, main *, #my-print-container * {
                    font-size: ${fontScale}pt !important;
                }
            }
        `;
        document.head.appendChild(dynamicStyle);

        if (isSelectionOnly) {
            printContainer = document.createElement('div');
            printContainer.id = 'my-print-container';
            
            const existingMain = document.querySelector('.main, .content, main');
            if (existingMain) {
                printContainer.className = existingMain.className;
            } else {
                printContainer.className = 'main content lfe-marked';
            }
            
            printContainer.appendChild(savedSelectionFragment.cloneNode(true));
            
            if (isExpand) {
                printContainer.querySelectorAll('details').forEach(d => {
                    d.setAttribute('open', '');
                });
            }
            
            document.body.appendChild(printContainer);

            document.querySelectorAll('body > *').forEach(child => {
                if (child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE' && child !== printContainer && child !== dynamicStyle) {
                    originalDisplays.set(child, child.style.display);
                    child.style.display = 'none';
                }
            });
        }

        setTimeout(() => {
            window.print();

            if (isExpand) {
                document.querySelectorAll('details').forEach(d => {
                    if (originalDetailsStates.has(d) && !originalDetailsStates.get(d)) {
                        d.removeAttribute('open');
                    }
                });
            }

            if (document.head.contains(dynamicStyle)) {
                document.head.removeChild(dynamicStyle);
            }

            if (isSelectionOnly && printContainer) {
                document.body.removeChild(printContainer);
                originalDisplays.forEach((displayState, element) => {
                    element.style.display = displayState;
                });
            }
        }, 150);
    });
})();