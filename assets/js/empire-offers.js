/* ============================================================
   EMPIRE REWARDS — SHARED OFFER PAGE LOGIC v4.3
   Load AFTER attribution.js and empire-tracker.js.

   Requires window.EMPIRE_OFFER_CONFIG = { slug: 'page-slug' }

   v4.3 changes (from v4.2):
     - Download now requires BOTH email submit AND offer completion.
       Neither alone unlocks. Prevents the revenue leak where a
       postback alone could reveal the download.
     - State tracked in memory: { emailSubmitted, offerCompleted }
     - Class-based unlock (.is-unlocked) replaces inline style toggle
       so no accidental display:block can leak the download.
     - Removed returning-visitor shortcut (was bypassing the gate
       for 30 days after a single offer — the primary leak).
     - New public hook window.empireOnEmailSuccess() for the page's
       inline email-success watcher to signal email submission.

   v4.2 changes (from v4.1):
     - Offers now carry &subid=<session_id> in their URLs.
       This is the CPA attribution link: when CPAGrip receives a
       click with subid set, its postback returns tracking_id =
       session_id, which allows cpa_events rows to be JOINed back
       to analytics.session_id for full attribution (landing page,
       UTM source, country, etc.).
     - Session_id is read from sessionStorage. If empire-tracker.js
       hasn't yet set it, it's generated inline using the identical
       formula, so the value is consistent across the page lifecycle.

   v4.1 changes (from v4):
     - Dispatch empire_offer_clicked custom event on offer click so
       the page's B2 flow can reveal the email form after an offer
       is chosen.

   v4 changes (from v3):
     - NG (Nigeria) offers added via rileymarker.com / Account #1 (1533836)
     - US support RESTORED (v3 had removed it; that was wrong for
       Pinterest traffic which is US/UK-heavy)
     - Fallback changed from GB to US for unknown geos
     - data-offer-id and data-offer-tag emitted on every card so
       empire-tracker.js delegation captures clicks correctly
     - window.EMPIRE_getOffers() exposed for console debugging
     - NG offers use rileymarker.com base (verified live)
   ============================================================ */
(function () {
    'use strict';

    var CFG = window.EMPIRE_OFFER_CONFIG || {};

    // ── Offer bases per CPAGrip account ──
    var BASE_SINGING = 'https://singingfiles.com/show.php?l=0&u=2548035&id='; // Account #2
    var BASE_RILEY   = 'https://rileymarker.com/show.php?l=0&u=1533836&id='; // Account #1

    // ============================================================
    // OFFER DATABASE
    // Order within each route: [0] = recommended, [1..n] = alternates
    // ============================================================
    var OFFERS = {

        'NG-android': [
            { emoji: '📱', tag: 'Email Submit', tagClass: 'email', title: 'Win a Samsung Galaxy S25', desc: 'Enter your email to claim your entry', sponsor: 'Verified Partner', offerId: '69174', url: BASE_RILEY + '69174', recommended: true },
            { emoji: '🎧', tag: 'Email Submit', tagClass: 'email', title: 'Get AirPods Max', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '70154', url: BASE_RILEY + '70154', recommended: false },
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Gift Card', desc: 'Quick email entry to claim your spot', sponsor: 'Verified Partner', offerId: '69175', url: BASE_RILEY + '69175', recommended: false }
        ],
        'NG-ios': [
            { emoji: '📱', tag: 'Email Submit', tagClass: 'email', title: 'Win a Samsung Galaxy S25', desc: 'Enter your email to claim your entry', sponsor: 'Verified Partner', offerId: '69175', url: BASE_RILEY + '69175', recommended: true },
            { emoji: '🎧', tag: 'Email Submit', tagClass: 'email', title: 'Get AirPods Max', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '70155', url: BASE_RILEY + '70155', recommended: false },
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Gift Card', desc: 'Quick email entry to claim your spot', sponsor: 'Verified Partner', offerId: '69174', url: BASE_RILEY + '69174', recommended: false }
        ],
        'NG-desktop': [
            { emoji: '📱', tag: 'Email Submit', tagClass: 'email', title: 'Win a Samsung Galaxy S25', desc: 'Enter your email to claim your entry', sponsor: 'Verified Partner', offerId: '69173', url: BASE_RILEY + '69173', recommended: true },
            { emoji: '🎧', tag: 'Email Submit', tagClass: 'email', title: 'Get AirPods Max', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '70153', url: BASE_RILEY + '70153', recommended: false },
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Gift Card', desc: 'Quick email entry to claim your spot', sponsor: 'Verified Partner', offerId: '69174', url: BASE_RILEY + '69174', recommended: false }
        ],

        'US-desktop': [
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: true },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Quick email entry for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false },
            { emoji: '🎫', tag: 'Credit Card', tagClass: 'cc', title: 'AARP Membership — $15/yr', desc: 'Join AARP to unlock instantly', sponsor: 'Verified Partner', offerId: '75158', url: BASE_SINGING + '75158', recommended: false }
        ],
        'US-android': [
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: true },
            { emoji: '🧘', tag: 'Mobile Install', tagClass: 'mobile', title: 'Yoga Workout Game', desc: 'Download a free fitness app to unlock', sponsor: 'Verified Partner', offerId: '74923', url: BASE_SINGING + '74923', recommended: false },
            { emoji: '🎫', tag: 'Credit Card', tagClass: 'cc', title: 'AARP Membership — $15/yr', desc: 'Join AARP to unlock instantly', sponsor: 'Verified Partner', offerId: '75159', url: BASE_SINGING + '75159', recommended: false }
        ],
        'US-ios': [
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: true },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false },
            { emoji: '🎫', tag: 'Credit Card', tagClass: 'cc', title: 'AARP Membership — $15/yr', desc: 'Join AARP to unlock instantly', sponsor: 'Verified Partner', offerId: '75158', url: BASE_SINGING + '75158', recommended: false }
        ],

        'GB-desktop': [
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Start Playing Just Games Now', desc: 'Download now to get started', sponsor: 'Verified Partner', offerId: '73942', url: BASE_SINGING + '73942', recommended: true },
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: false },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Quick email entry for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false }
        ],
        'GB-android': [
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Start Playing Just Games Now', desc: 'Download the free game app to unlock', sponsor: 'Verified Partner', offerId: '73942', url: BASE_SINGING + '73942', recommended: true },
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: false },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false }
        ],
        'GB-ios': [
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Start Playing Just Games Now', desc: 'Download the free game app to unlock', sponsor: 'Verified Partner', offerId: '73942', url: BASE_SINGING + '73942', recommended: true },
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: false },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false }
        ],

        'AU-desktop': [
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: true },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false },
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Just Games — Free Install', desc: 'Download the free game app to unlock', sponsor: 'Verified Partner', offerId: '73895', url: BASE_SINGING + '73895', recommended: false }
        ],
        'AU-android': [
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Just Games — Free Install', desc: 'Download the free game app to unlock', sponsor: 'Verified Partner', offerId: '73895', url: BASE_SINGING + '73895', recommended: true },
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: false },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false }
        ],
        'AU-ios': [
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: true },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false },
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Just Games — Free Install', desc: 'Download the free game app to unlock', sponsor: 'Verified Partner', offerId: '73895', url: BASE_SINGING + '73895', recommended: false }
        ],

        'CA-desktop': [
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: true },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false },
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Just Games — Free Install', desc: 'Download the free game app to unlock', sponsor: 'Verified Partner', offerId: '73895', url: BASE_SINGING + '73895', recommended: false }
        ],
        'CA-android': [
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Just Games — Free Install', desc: 'Download the free game app to unlock', sponsor: 'Verified Partner', offerId: '73895', url: BASE_SINGING + '73895', recommended: true },
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: false },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false }
        ],
        'CA-ios': [
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: true },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false },
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Just Games — Free Install', desc: 'Download the free game app to unlock', sponsor: 'Verified Partner', offerId: '73895', url: BASE_SINGING + '73895', recommended: false }
        ],

        'DE-desktop': [
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: true },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false },
            { emoji: '🎫', tag: 'Credit Card', tagClass: 'cc', title: 'AARP Membership — $15/yr', desc: 'Join AARP to unlock instantly', sponsor: 'Verified Partner', offerId: '75158', url: BASE_SINGING + '75158', recommended: false }
        ],
        'DE-android': [
            { emoji: '🎮', tag: 'App Install', tagClass: 'mobile', title: 'Just Games — Install 3 Apps', desc: 'Install 3 free game apps to unlock', sponsor: 'Verified Partner', offerId: '73895', url: BASE_SINGING + '73895', recommended: true },
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: false },
            { emoji: '🎫', tag: 'Credit Card', tagClass: 'cc', title: 'AARP Membership — $15/yr', desc: 'Join AARP to unlock instantly', sponsor: 'Verified Partner', offerId: '75159', url: BASE_SINGING + '75159', recommended: false }
        ],
        'DE-ios': [
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: true },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false },
            { emoji: '🎫', tag: 'Credit Card', tagClass: 'cc', title: 'AARP Membership — $15/yr', desc: 'Join AARP to unlock instantly', sponsor: 'Verified Partner', offerId: '75158', url: BASE_SINGING + '75158', recommended: false }
        ],

        'SI-ios': [
            { emoji: '📱', tag: 'Pin Submit', tagClass: 'pin', title: 'Mobilna Verifikacija', desc: 'Vnesite mobilno številko za odklepanje', sponsor: 'Verified Partner', offerId: '49886', url: BASE_SINGING + '49886', recommended: true },
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: false },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false }
        ],

        'PL-ios': [
            { emoji: '📱', tag: 'Pin Submit', tagClass: 'pin', title: 'Weryfikacja Mobilna', desc: 'Wprowadź numer telefonu aby odblokować', sponsor: 'Verified Partner', offerId: '74133', url: BASE_SINGING + '74133', recommended: true },
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: false },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false }
        ],

        'ES-ios': [
            { emoji: '💳', tag: 'Credit Card', tagClass: 'cc', title: 'Fitstream Suscripción', desc: 'Suscríbete con tu tarjeta para desbloquear', sponsor: 'Verified Partner', offerId: '68978', url: BASE_SINGING + '68978', recommended: true },
            { emoji: '🎁', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Nike Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '75217', url: BASE_SINGING + '75217', recommended: false },
            { emoji: '💄', tag: 'Email Submit', tagClass: 'email', title: 'Win a $100 Ulta Gift Card', desc: 'Enter your email for a chance to win', sponsor: 'Verified Partner', offerId: '74437', url: BASE_SINGING + '74437', recommended: false }
        ]
    };

    var FALLBACK = {
        desktop: OFFERS['US-desktop'],
        android: OFFERS['US-android'],
        ios: OFFERS['US-ios']
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
            if (/Africa\/Lagos/.test(tz)) return 'NG';
            if (/Europe\/London/.test(tz)) return 'GB';
            if (/^Australia\//.test(tz)) return 'AU';
            if (/America\/Toronto|America\/Vancouver|America\/Edmonton|America\/Winnipeg|America\/Halifax/.test(tz)) return 'CA';
            if (/^America\//.test(tz)) return 'US';
            if (/Europe\/Ljubljana/.test(tz)) return 'SI';
            if (/Europe\/Warsaw/.test(tz)) return 'PL';
            if (/Europe\/Madrid/.test(tz)) return 'ES';
            if (/Europe\/Berlin|Europe\/Busingen/.test(tz)) return 'DE';
            if (/^Europe\//.test(tz)) return 'GB';
            if (/^Africa\//.test(tz)) return 'NG';
            return 'US';
        } catch (e) { return 'US'; }
    }

    var device = getDevice();
    var geoCode = getGeoCode();

    // ── Geo banner ──
    var banner = document.getElementById('geo-banner');
    if (banner) {
        var countryNames = {
            NG: 'Nigeria',
            US: 'the United States',
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

    function pickOffers() {
        var key = geoCode + '-' + device;
        if (OFFERS[key]) return OFFERS[key];
        if (FALLBACK[device]) return FALLBACK[device];
        return FALLBACK.desktop;
    }

    function escapeAttr(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ── Session ID resolver ──
    function resolveSessionId() {
        try {
            if (window.__empire_sid) return window.__empire_sid;
            var sid = sessionStorage.getItem('empire_sid');
            if (!sid) {
                sid = 's_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
                sessionStorage.setItem('empire_sid', sid);
            }
            return sid;
        } catch (e) { return ''; }
    }

    // ============================================================
    // UNLOCK GATE — REQUIRES BOTH email submit AND offer completion
    // Neither alone unlocks. Both flags must be true.
    // ============================================================
    var empireState = {
        emailSubmitted: false,    // set when EmailOctopus reports success
        offerCompleted: false     // set when CPAGrip postback arrives
    };

    function tryUnlock() {
        if (!empireState.emailSubmitted || !empireState.offerCompleted) {
            return; // one or both missing — stay locked
        }
        var u = document.getElementById('gate-unlocked');
        if (u) {
            u.classList.add('is-unlocked');
            setTimeout(function () {
                var y = u.getBoundingClientRect().top + window.pageYOffset - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }, 150);
        }
        hideSticky();
        if (window.empireTrack) {
            window.empireTrack('content_unlocked', {
                slug: CFG.slug || null,
                reason: 'email_and_offer_complete'
            });
        }
    }

    // Public hook — page's inline email watcher calls this on success
    window.empireOnEmailSuccess = function () {
        empireState.emailSubmitted = true;
        tryUnlock();
    };

    // ── Render offer cards ──
    function renderOffers() {
        var list = pickOffers();
        var grid = document.getElementById('offers-grid');
        if (!grid) return;

        var sid = resolveSessionId();
        var subidSuffix = sid ? '&subid=' + encodeURIComponent(sid) : '';

        var html = '';
        list.forEach(function (o) {
            var clickUrl = o.url + subidSuffix;
            html += '<a href="' + clickUrl + '" target="_blank" rel="nofollow noopener noreferrer" class="offer-card' + (o.recommended ? ' recommended' : '') + '"';
            html += ' data-offer-id="' + escapeAttr(o.offerId || '') + '"';
            html += ' data-offer-title="' + escapeAttr(o.title) + '"';
            html += ' data-offer-tag="' + escapeAttr(o.tag) + '">';
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

        grid.querySelectorAll('.offer-card').forEach(function (card) {
            card.addEventListener('click', function () {
                try {
                    window.dispatchEvent(new CustomEvent('empire_offer_clicked', {
                        detail: {
                            offerId: card.getAttribute('data-offer-id') || null,
                            offerTitle: card.getAttribute('data-offer-title') || null,
                            slug: CFG.slug || null
                        }
                    }));
                } catch (e) {}
            });
        });
    }

    // ── Element refs ──
    var revealBtn = document.getElementById('reveal-offers-btn');
    var offersPanel = document.getElementById('offers-panel');
    var teaser = document.getElementById('gate-teaser');
    var unlockedEl = document.getElementById('gate-unlocked');

    // ── Render offers on load ──
    try {
        renderOffers();
        if (offersPanel) {
            offersPanel.classList.add('open');
            offersPanel.setAttribute('aria-hidden', 'false');
            offersPanel.style.display = 'block';
        }
    } catch (e) {
        console.warn('renderOffers on load failed:', e);
    }

    // ── Reveal handler (backward compat) ──
    if (revealBtn) {
        revealBtn.addEventListener('click', function () {
            renderOffers();
            if (teaser) {
                teaser.style.transition = 'opacity .35s ease, transform .35s ease';
                teaser.style.opacity = '0';
                teaser.style.transform = 'scale(.96)';
                setTimeout(function () { teaser.style.display = 'none'; }, 300);
            }
            if (offersPanel) {
                offersPanel.classList.add('open');
                offersPanel.setAttribute('aria-hidden', 'false');
                if (window.empireTrack) {
                    window.empireTrack('content_unlocked', { slug: CFG.slug || null });
                }
                setTimeout(function () {
                    var y = offersPanel.getBoundingClientRect().top + window.pageYOffset - 100;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }, 100);
            }
        });
    }

    // ── CPAGrip postback callback — marks offer completed, not unlock by itself ──
    function onOfferComplete() {
        empireState.offerCompleted = true;
        tryUnlock();
    }
    window.cpaCallback = onOfferComplete;
    window.cpbCallback = onOfferComplete;

    // ── Check for ?cpa=1 on load (CPAGrip redirect-based postback) ──
    try {
        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('cpa') === '1' || urlParams.get('conversion') === '1') {
            onOfferComplete();
        }
    } catch (e) {}

    // ── Sticky CTA visibility ──
    var sticky = document.getElementById('sticky');
    var gateEl = document.getElementById('gate');
    function hideSticky() {
        if (sticky) sticky.classList.remove('show');
    }
    if (gateEl && sticky && 'IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entries) {
            var u = document.getElementById('gate-unlocked');
            if (u && u.classList.contains('is-unlocked')) {
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

    // ── Debug helper ──
    window.EMPIRE_getOffers = function () {
        return {
            detectedGeo: geoCode,
            detectedDevice: device,
            routeKey: geoCode + '-' + device,
            matched: OFFERS[geoCode + '-' + device] ? 'exact' : 'fallback',
            sessionId: resolveSessionId(),
            state: { emailSubmitted: empireState.emailSubmitted, offerCompleted: empireState.offerCompleted },
            offers: pickOffers()
        };
    };

})();
