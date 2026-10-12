/* ============================================================
   EMPIRE REWARDS — RIBBON INJECTOR
   Builds the bridge ribbon HTML and inserts it at top of page.
   Loaded on every offer page via one <script> tag.
   ============================================================ */
(function () {
    'use strict';

    function injectRibbon() {
        // Don't double-inject
        if (document.querySelector('.empire-ribbon')) return;

        var ribbon = document.createElement('div');
        ribbon.className = 'empire-ribbon';
        ribbon.setAttribute('role', 'banner');
        ribbon.setAttribute('aria-label', 'THE EMPIRE ecosystem link');

        ribbon.innerHTML =
            '<div class="empire-ribbon-inner">' +
                '<div class="empire-ribbon-left">' +
                    '<span class="empire-ribbon-mark" aria-hidden="true">E</span>' +
                    '<span class="empire-ribbon-brand"><strong>THE EMPIRE</strong></span>' +
                    '<span class="empire-ribbon-sep" aria-hidden="true">&middot;</span>' +
                    '<span class="empire-ribbon-context">A project by <strong>THE EMPIRE</strong></span>' +
                '</div>' +
                '<div class="empire-ribbon-right">' +
                    '<a class="empire-ribbon-link" href="/rewards-hub.html" aria-label="Return to the Rewards Hub">' +
                        '<span>Rewards Hub</span>' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
                    '</a>' +
                '</div>' +
            '</div>';

        // Insert as the first child of <body> so it sits above everything
        if (document.body) {
            document.body.insertBefore(ribbon, document.body.firstChild);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectRibbon);
    } else {
        injectRibbon();
    }
})();