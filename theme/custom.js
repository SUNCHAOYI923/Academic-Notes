(function() {
    if (document.getElementById('my-image-overlay')) return;

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
})();