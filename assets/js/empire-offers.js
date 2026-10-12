/* ============================================================
   EMPIRE REWARDS — SHARED OFFER PAGE LOGIC
   Load AFTER attribution.js on every /offers/*.html page.

   Requires window.EMPIRE_OFFER_CONFIG = { slug: 'page-slug' }

   v3 UPDATE — Geo strategy pivot to GB / AU / CA primary markets.
   US support removed. Fallback changed from US to GB.
   ============================================================ */
(function () {
    'use strict';

    var CFG = window.EMPIRE_OFFER_CONFIG || {};
    var OFFER_BASE = 'https://singingfiles.com/show.php?l=0&u=2548035&id=';

    // ============================================================
    // OFFER DATABASE (GB / AU / CA / SI / PL / ES / DE)
    // Payouts sourced from CPAGrip account (Sep 2026)
    // US removed — replaced by GB offers (13-16% network conversion)
    // ============================================================
    var OFFERS = {
        // ── UNITED KINGDOM ──
        'GB-desktop': [
            { emoji: '💷', tag: 'Free Bonus', tagClass: 'email', title: '£750 in Your PayPal Account', desc: 'Enter your info now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: true },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: '£750 on Apple Pay Now', desc: 'Enter your info now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false },
            { emoji: '🛍️', tag: 'Free Bonus', tagClass: 'email', title: '£750 to Spend at Shein', desc: 'Enter your info now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '74437', recommended: false }
        ],
        'GB-android': [
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Start Playing Just Games Now', desc: 'Download now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '73942', recommended: true },
            { emoji: '💷', tag: 'Free Bonus', tagClass: 'email', title: '£750 in Your PayPal Account', desc: 'Enter your info now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: false },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: '£750 on Apple Pay Now', desc: 'Enter your info now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false }
        ],
        'GB-ios': [
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Start Playing Just Games Now', desc: 'Download now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '73942', recommended: true },
            { emoji: '💷', tag: 'Free Bonus', tagClass: 'email', title: '£750 in Your PayPal Account', desc: 'Enter your info now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: false },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: '£750 on Apple Pay Now', desc: 'Enter your info now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false }
        ],

        // ── AUSTRALIA ──
        'AU-desktop': [
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: 'A$750 in Your PayPal Account', desc: 'Enter your info now for a chance to win', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: true },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: 'A$750 on Apple Pay Now', desc: 'Enter your info now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false },
            { emoji: '🛍️', tag: 'Free Bonus', tagClass: 'email', title: 'A$750 to Spend at Lululemon', desc: 'Enter your info now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '74437', recommended: false }
        ],
        'AU-android': [
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: 'A$750 in Your PayPal Account', desc: 'Enter your info now for a chance to win', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: true },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: 'A$750 on Apple Pay Now', desc: 'Enter your info now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false },
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Start Playing Reverse AudioPro', desc: 'Download now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '73895', recommended: false }
        ],
        'AU-ios': [
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: 'A$750 in Your PayPal Account', desc: 'Enter your info now for a chance to win', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: true },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: 'A$750 on Apple Pay Now', desc: 'Enter your info now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false },
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Start Playing Reverse AudioPro', desc: 'Download now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '73895', recommended: false }
        ],

        // ── CANADA ──
        'CA-desktop': [
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: 'C$750 in Your PayPal Account', desc: 'Enter your info now for a chance to win', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: true },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: 'C$750 on Apple Pay Now', desc: 'Enter your info now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false },
            { emoji: '🛍️', tag: 'Free Bonus', tagClass: 'email', title: 'C$750 to Spend at Lululemon', desc: 'Enter your info now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '74437', recommended: false }
        ],
        'CA-android': [
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: 'C$750 in Your PayPal Account', desc: 'Enter your info now for a chance to win', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: true },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: 'C$750 on Apple Pay Now', desc: 'Enter your info now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false },
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Start Playing Reverse AudioPro', desc: 'Download now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '73895', recommended: false }
        ],
        'CA-ios': [
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: 'C$750 in Your PayPal Account', desc: 'Enter your info now for a chance to win', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: true },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: 'C$750 on Apple Pay Now', desc: 'Enter your info now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false },
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Start Playing Reverse AudioPro', desc: 'Download now to get started', sponsor: 'Verified Partner', url: OFFER_BASE + '73895', recommended: false }
        ],

        // ── SLOVENIA (Pin Submit — high conversion) ──
        'SI-desktop': [
            { emoji: '📲', tag: 'Mobile Verify', tagClass: 'pin', title: 'Dostop do najnovejših prenosov', desc: 'Za začetek vnesite svojo mobilno številko', sponsor: 'Verified Partner', url: OFFER_BASE + '49886', recommended: true },
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: '€750 v vašem PayPal računu', desc: 'Vnesite svoje podatke za začetek', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: false },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: '€750 na Apple Pay', desc: 'Vnesite svoje podatke za začetek', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false }
        ],
        'SI-android': [
            { emoji: '📲', tag: 'Mobile Verify', tagClass: 'pin', title: 'Dostop do najnovejših prenosov', desc: 'Za začetek vnesite svojo mobilno številko', sponsor: 'Verified Partner', url: OFFER_BASE + '49886', recommended: true },
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: '€750 v vašem PayPal računu', desc: 'Vnesite svoje podatke za začetek', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: false },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: '€750 na Apple Pay', desc: 'Vnesite svoje podatke za začetek', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false }
        ],
        'SI-ios': [
            { emoji: '📲', tag: 'Mobile Verify', tagClass: 'pin', title: 'Dostop do najnovejših prenosov', desc: 'Za začetek vnesite svojo mobilno številko', sponsor: 'Verified Partner', url: OFFER_BASE + '49886', recommended: true },
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: '€750 v vašem PayPal računu', desc: 'Vnesite svoje podatke za začetek', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: false },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: '€750 na Apple Pay', desc: 'Vnesite svoje podatke za začetek', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false }
        ],

        // ── POLAND ──
        'PL-desktop': [
            { emoji: '📲', tag: 'Mobile Verify', tagClass: 'pin', title: 'Weryfikacja Mobilna', desc: 'Wprowadź numer telefonu aby odblokować', sponsor: 'Verified Partner', url: OFFER_BASE + '74133', recommended: true },
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: '750 zł na Twoim PayPal', desc: 'Wpisz swoje dane aby rozpocząć', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: false },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: '750 zł na Apple Pay', desc: 'Wpisz swoje dane aby rozpocząć', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false }
        ],
        'PL-android': [
            { emoji: '📲', tag: 'Mobile Verify', tagClass: 'pin', title: 'Weryfikacja Mobilna', desc: 'Wprowadź numer telefonu aby odblokować', sponsor: 'Verified Partner', url: OFFER_BASE + '74133', recommended: true },
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: '750 zł na Twoim PayPal', desc: 'Wpisz swoje dane aby rozpocząć', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: false },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: '750 zł na Apple Pay', desc: 'Wpisz swoje dane aby rozpocząć', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false }
        ],
        'PL-ios': [
            { emoji: '📲', tag: 'Mobile Verify', tagClass: 'pin', title: 'Weryfikacja Mobilna', desc: 'Wprowadź numer telefonu aby odblokować', sponsor: 'Verified Partner', url: OFFER_BASE + '74133', recommended: true },
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: '750 zł na Twoim PayPal', desc: 'Wpisz swoje dane aby rozpocząć', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: false },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: '750 zł na Apple Pay', desc: 'Wpisz swoje dane aby rozpocząć', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false }
        ],

        // ── SPAIN ──
        'ES-desktop': [
            { emoji: '📲', tag: 'Mobile Verify', tagClass: 'pin', title: 'Verificación Móvil', desc: 'Introduce tu número para desbloquear', sponsor: 'Verified Partner', url: OFFER_BASE + '68978', recommended: true },
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: '750€ en tu PayPal', desc: 'Introduce tus datos para empezar', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: false },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: '750€ en Apple Pay', desc: 'Introduce tus datos para empezar', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false }
        ],
        'ES-android': [
            { emoji: '📲', tag: 'Mobile Verify', tagClass: 'pin', title: 'Verificación Móvil', desc: 'Introduce tu número para desbloquear', sponsor: 'Verified Partner', url: OFFER_BASE + '68978', recommended: true },
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: '750€ en tu PayPal', desc: 'Introduce tus datos para empezar', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: false },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: '750€ en Apple Pay', desc: 'Introduce tus datos para empezar', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false }
        ],
        'ES-ios': [
            { emoji: '📲', tag: 'Mobile Verify', tagClass: 'pin', title: 'Verificación Móvil', desc: 'Introduce tu número para desbloquear', sponsor: 'Verified Partner', url: OFFER_BASE + '68978', recommended: true },
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: '750€ en tu PayPal', desc: 'Introduce tus datos para empezar', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: false },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: '750€ en Apple Pay', desc: 'Introduce tus datos para empezar', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false }
        ],

        // ── GERMANY ──
        'DE-desktop': [
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: '750€ auf deinem PayPal', desc: 'Gib deine Daten ein, um zu starten', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: true },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: '750€ auf Apple Pay', desc: 'Gib deine Daten ein, um zu starten', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false },
            { emoji: '🛍️', tag: 'Free Bonus', tagClass: 'email', title: '750€ bei Shein ausgeben', desc: 'Gib deine Daten ein, um zu starten', sponsor: 'Verified Partner', url: OFFER_BASE + '74437', recommended: false }
        ],
        'DE-android': [
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Just Games — Install 3 Apps', desc: 'Installiere 3 kostenlose Spiele zum Freischalten', sponsor: 'Verified Partner', url: OFFER_BASE + '73895', recommended: true },
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: '750€ auf deinem PayPal', desc: 'Gib deine Daten ein, um zu starten', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: false },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: '750€ auf Apple Pay', desc: 'Gib deine Daten ein, um zu starten', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false }
        ],
        'DE-ios': [
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Just Games — Install 3 Apps', desc: 'Installiere 3 kostenlose Spiele zum Freischalten', sponsor: 'Verified Partner', url: OFFER_BASE + '73895', recommended: true },
            { emoji: '💰', tag: 'Free Bonus', tagClass: 'email', title: '750€ auf deinem PayPal', desc: 'Gib deine Daten ein, um zu starten', sponsor: 'Verified Partner', url: OFFER_BASE + '75217', recommended: false },
            { emoji: '📱', tag: 'Free Bonus', tagClass: 'email', title: '750€ auf Apple Pay', desc: 'Gib deine Daten ein, um zu starten', sponsor: 'Verified Partner', url: OFFER_BASE + '75218', recommended: false }
        ]
    };

    // ============================================================
    // FALLBACK — GB is now the primary market (13-16% conversion)
    // US is no longer supported. Unrecognized geos get GB offers.
    // ============================================================
    var FALLBACK = {
        desktop: OFFERS['GB-desktop'],
        android: OFFERS['GB-android'],
        ios: OFFERS['GB-ios']
    };

    // ── Device & geo detection ──
    function getDevice() {
        var ua = navigator.userAgent;
        if (/android/i.test(ua)) return 'android';
        if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
        return 'desktop';
    }

    function getGeoCode() {
        try {
            var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            // Primary English-speaking markets
            if (/Europe\/London/.test(tz)) return 'GB';
            if (/^Australia\//.test(tz)) return 'AU';
            if (/America\/Toronto|America\/Vancouver|America\/Edmonton|America\/Winnipeg|America\/Halifax/.test(tz)) return 'CA';
            // Secondary Pin Submit markets
            if (/Europe\/Ljubljana/.test(tz)) return 'SI';
            if (/Europe\/Warsaw/.test(tz)) return 'PL';
            if (/Europe\/Madrid/.test(tz)) return 'ES';
            if (/Europe\/Berlin|Europe\/Busingen/.test(tz)) return 'DE';
            // Everything else → GB
            return 'GB';
        } catch (e) { return 'GB'; }
    }

    var device = getDevice();
    var geoCode = getGeoCode();

    // ── Geo banner ──
    var banner = document.getElementById('geo-banner');
    if (banner) {
        var countryNames = {
            GB: 'the United Kingdom',
            AU: 'Australia',
            CA: 'Canada',
            SI: 'Slovenia',
            PL: 'Poland',
            ES: 'Spain',
            DE: 'Germany'
        };
        banner.textContent = '✨ Offers personalized for ' + (countryNames[geoCode] || 'your region') +
            ' · ' + device.charAt(0).toUpperCase() + device.slice(1);
        banner.classList.add('show');
    }

    // ── Offer picker ──
    function pickOffers() {
        var key = geoCode + '-' + device;
        if (OFFERS[key]) return OFFERS[key];
        if (FALLBACK[device]) return FALLBACK[device];
        return FALLBACK.desktop;
    }

    // ── Escape helper for safe injection into attributes ──
    function escapeAttr(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ── Render offer cards ──
    function renderOffers() {
        var list = pickOffers();
        var grid = document.getElementById('offers-grid');
        if (!grid) return;
        var html = '';
        list.forEach(function (o) {
            html += '<a href="' + o.url + '" target="_blank" rel="nofollow noopener noreferrer" class="offer-card' + (o.recommended ? ' recommended' : '') + '" data-offer-title="' + escapeAttr(o.title) + '">';
            html += '<div class="offer-top">';
            html += '<div class="offer-emoji" aria-hidden="true">' + o.emoji + '</div>';
            html += '<div class="offer-body">';
            html += '<span class="offer-tag ' + o.tagClass + '">' + o.tag + '</span>';
            html += '<div class="offer-title">' + o.title + '</div>';
            html += '<div class="offer-desc">' + o.desc + '</div>';
            html += '</div></div>';
            html += '<div class="offer-footer">';
            html += '<span class="offer-payout">&#10003; ' + o.sponsor + '</span>';
            html += '<span class="offer-cta">Start now &rarr;</span>';
            html += '</div>';
            html += '</a>';
        });
        grid.innerHTML = html;
    }

    // ── Element refs ──
    var revealBtn = document.getElementById('reveal-offers-btn');
    var offersPanel = document.getElementById('offers-panel');
    var teaser = document.getElementById('gate-teaser');
    var unlockedEl = document.getElementById('gate-unlocked');

    // ── Returning visitor: skip the gate entirely ──
    var RETURNING_KEY = 'empire_unlocked_' + (CFG.slug || 'default');
    var isReturning = false;
    try {
        var stamp = parseInt(localStorage.getItem(RETURNING_KEY) || '0', 10);
        if (stamp && (Date.now() - stamp) < 30 * 24 * 60 * 60 * 1000) isReturning = true;
    } catch (e) {}

    if (isReturning && teaser && unlockedEl) {
        teaser.style.display = 'none';
        if (offersPanel) offersPanel.style.display = 'none';
        unlockedEl.style.display = 'block';
        if (window.empireTrack) {
            window.empireTrack('returning_visitor_unlock', { slug: CFG.slug || null });
        }
    }

    // ── Reveal offers on click ──
    if (revealBtn) {
        revealBtn.addEventListener('click', function () {
            renderOffers();
            teaser.style.transition = 'opacity .35s ease, transform .35s ease';
            teaser.style.opacity = '0';
            teaser.style.transform = 'scale(.96)';
            setTimeout(function () {
                teaser.style.display = 'none';
                offersPanel.classList.add('open');
                offersPanel.setAttribute('aria-hidden', 'false');
                if (window.empireTrack) {
                    window.empireTrack('content_unlocked', { slug: CFG.slug || null });
                }
                setTimeout(function () {
                    var y = offersPanel.getBoundingClientRect().top + window.pageYOffset - 100;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }, 100);
            }, 300);
        });
    }

    // ── Unlock callback ──
    function unlockDownload() {
        var t = document.getElementById('gate-teaser');
        var o = document.getElementById('offers-panel');
        var u = document.getElementById('gate-unlocked');
        if (t) t.style.display = 'none';
        if (o) o.style.display = 'none';
        if (u) {
            u.style.display = 'block';
            try { localStorage.setItem(RETURNING_KEY, String(Date.now())); } catch (e) {}
            setTimeout(function () {
                var y = u.getBoundingClientRect().top + window.pageYOffset - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }, 150);
        }
        hideSticky();
        if (window.empireTrack) {
            window.empireTrack('content_unlocked', { slug: CFG.slug || null });
        }
    }
    window.cpaCallback = unlockDownload;
    window.cpbCallback = unlockDownload;

    // ── Sticky CTA visibility ──
    var sticky = document.getElementById('sticky');
    var gateEl = document.getElementById('gate');

    function hideSticky() {
        if (sticky) sticky.classList.remove('show');
    }

    if (gateEl && sticky && 'IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entries) {
            if (unlockedEl && unlockedEl.style.display === 'block') {
                sticky.classList.remove('show');
                return;
            }
            if (entries[0].isIntersecting) sticky.classList.remove('show');
            else sticky.classList.add('show');
        }, { threshold: 0 });
        obs.observe(gateEl);
    }

    // ── Scroll-reveal for sections ──
    (function () {
        var sections = document.querySelectorAll('.section');
        if (!sections.length || !('IntersectionObserver' in window)) {
            sections.forEach(function (s) { s.classList.add('visible'); });
            return;
        }
        var obs2 = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    obs2.unobserve(e.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });
        sections.forEach(function (s) { obs2.observe(s); });
    })();

    // ── Universal unlock triggers ──
    document.querySelectorAll('[data-unlock-trigger]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var g = document.getElementById('gate');
            if (g) g.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(function () {
                var r = document.getElementById('reveal-offers-btn');
                if (r) r.click();
            }, 500);
        });
    });

})();