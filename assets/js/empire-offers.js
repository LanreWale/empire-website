/* ============================================================
   EMPIRE REWARDS — SHARED OFFER PAGE LOGIC v4.3.2
   Load AFTER attribution.js and empire-tracker.js.

   Requires window.EMPIRE_OFFER_CONFIG = { slug: 'page-slug' }

   v4.3.2 changes (from v4.3.1):
     - Replaced ?cpa=1 redirect-based completion detection with
       server-verified polling. Browser now asks the Supabase
       Edge Function "has CPAGrip sent an S2S postback for this
       session_id?" every 5 seconds for up to ~2.5 minutes.
     - This works with CPAGrip's actual S2S-only postback system
       (no redirect URLs required, no URL param bypass).
     - Removed ?cpa=1 handler, cpaCallback, cpbCallback globals —
       they were the previous bypass mechanism.
     - Polling starts automatically after email submit and on
       page load for users with emailSubmitted=true but
       offerCompleted=false.
     - Session storage still persists unlock state across page
       navigations (needed for CPAGrip return trip).

   v4.3.1 changes (from v4.3):
     - empireState persists to sessionStorage so it survives
       page navigation (critical for CPAGrip redirect flow).

   v4.3 changes (from v4.2):
     - Download requires BOTH email submit AND offer completion.
     - Class-based unlock (.is-unlocked) replaces inline style.
     - New public hook window.empireOnEmailSuccess().

   v4.2 changes (from v4.1):
     - Offers carry &subid=<session_id> in their URLs.

   v4.1 changes (from v4):
     - Dispatch empire_offer_clicked custom event on offer click.
   ============================================================ */
(function () {
    'use strict';

    var CFG = window.EMPIRE_OFFER_CONFIG || {};

    var BASE_SINGING = 'https://singingfiles.com/show.php?l=0&u=2548035&id=';
    var BASE_RILEY   = 'https://rileymarker.com/show.php?l=0&u=1533836&id=';

    // Supabase Edge Function endpoint for conversion status checks
    var POSTBACK_CHECK_URL = 'https://qujlyrmatuvlpoeheqgf.supabase.co/functions/v1/cpa-postback-receiver';

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

    var banner = document.getElementById('geo-banner');
    if (banner) {
        var countryNames = {
            NG: 'Nigeria', US: 'the United States', GB: 'the United Kingdom',
            AU: 'Australia', CA: 'Canada', SI: 'Slovenia',
            PL: 'Poland', ES: 'Spain', DE: 'Germany'
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
    // State persists to sessionStorage so it survives page navigation.
    // Offer completion is verified by polling the Supabase Edge
    // Function (server-side source of truth for CPAGrip postbacks).
    // ============================================================
    var STORAGE_KEY = 'empire_unlock_state_v432_' + (CFG.slug || 'default');

    var empireState = (function () {
        try {
            var raw = sessionStorage.getItem(STORAGE_KEY);
            if (raw) {
                var p = JSON.parse(raw);
                return {
                    emailSubmitted: p.emailSubmitted === true,
                    offerCompleted: p.offerCompleted === true
                };
            }
        } catch (e) {}
        return { emailSubmitted: false, offerCompleted: false };
    })();

    function saveUnlockState() {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(empireState));
        } catch (e) {}
    }

    // Guard against multiple polling loops
    var _pollingActive = false;

    function pollForConversion(trackingId, attempt) {
        attempt = attempt || 1;
        if (!trackingId) return;
        if (attempt > 30) {
            _pollingActive = false;
            return; // give up after ~150 seconds (30 × 5s)
        }
        fetch(POSTBACK_CHECK_URL + '?check_tracking_id=' + encodeURIComponent(trackingId), {
            method: 'GET',
            cache: 'no-store'
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.found) {
                    _pollingActive = false;
                    empireState.offerCompleted = true;
                    saveUnlockState();
                    tryUnlock();
                    if (window.empireTrack) {
                        window.empireTrack('offer_completion_confirmed', {
                            slug: CFG.slug || null,
                            trackingId: trackingId,
                            attempt: attempt
                        });
                    }
                } else {
                    setTimeout(function () {
                        pollForConversion(trackingId, attempt + 1);
                    }, 5000);
                }
            })
            .catch(function () {
                setTimeout(function () {
                    pollForConversion(trackingId, attempt + 1);
                }, 5000);
            });
    }

    function startPolling() {
        if (_pollingActive) return;
        if (empireState.offerCompleted) return;
        var sid = resolveSessionId();
        if (!sid) return;
        _pollingActive = true;
        if (window.empireTrack) {
            window.empireTrack('offer_completion_polling_started', {
                slug: CFG.slug || null,
                trackingId: sid
            });
        }
        pollForConversion(sid, 1);
    }

    function tryUnlock() {
        if (!empireState.emailSubmitted || !empireState.offerCompleted) {
            return;
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

    window.empireOnEmailSuccess = function () {
        empireState.emailSubmitted = true;
        saveUnlockState();
        tryUnlock();
        // Start polling — the CPAGrip S2S postback may already have
        // fired or may fire while the user is on the sponsor page.
        if (!empireState.offerCompleted) {
            startPolling();
        }
    };

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

    var revealBtn = document.getElementById('reveal-offers-btn');
    var offersPanel = document.getElementById('offers-panel');
    var teaser = document.getElementById('gate-teaser');
    var unlockedEl = document.getElementById('gate-unlocked');

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

    // ── Auto-unlock for returning users (survived page reload) ──
    try { tryUnlock(); } catch (e) {}

    // ── If email submitted but offer not confirmed, start polling ──
    try {
        if (empireState.emailSubmitted && !empireState.offerCompleted) {
            startPolling();
        }
    } catch (e) {}

    window.EMPIRE_getOffers = function () {
        return {
            detectedGeo: geoCode,
            detectedDevice: device,
            routeKey: geoCode + '-' + device,
            matched: OFFERS[geoCode + '-' + device] ? 'exact' : 'fallback',
            sessionId: resolveSessionId(),
            state: { emailSubmitted: empireState.emailSubmitted, offerCompleted: empireState.offerCompleted },
            pollingActive: _pollingActive,
            offers: pickOffers()
        };
    };

})();
