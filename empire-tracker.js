/* ============================================================
   EMPIRE REWARDS — ANALYTICS TRACKER v4.4
   - v4.4: Added UTM fallback to referrer classification.
           If an app (TikTok, Telegram, etc.) strips the UTM,
           the tracker now uses document.referrer to attribute
           the traffic to the correct channel.
   - v4.4: Added Tumblr, Medium, Facebook to classification.
   ============================================================ */
(function () {
    'use strict';

    // ── Bot detection ──
    function isBot() {
        try {
            var ua = navigator.userAgent || '';
            var bots = /bot|crawler|spider|scraper|curl|wget|python|java|headless|phantom|selenium|puppeteer|lighthouse|gtmetrix|pagespeed|facebookexternalhit|twitterbot|linkedinbot|telegrambot|whatsapp|slackbot|discordbot|googlebot|bingbot|yandexbot|baiduspider|ahrefsbot|semrushbot|mj12bot|dotbot|petalbot|bytespider|applebot|duckduckbot|gptbot|chatgpt-user|claudebot|anthropic-ai|perplexitybot|ccbot/i;
            if (bots.test(ua)) return true;
            if (navigator.webdriver === true) return true;
            if (window._phantom || window.__nightmare || window.__selenium) return true;
            if (navigator.languages && navigator.languages.length === 0) return true;
        } catch (e) {}
        return false;
    }
    if (isBot()) return;

    // ── Config ──
    var CFG = window.EMPIRE_CONFIG || {};
    var SUPABASE_URL = CFG.supabaseUrl || 'https://qujlyrmatuvlpoeheqgf.supabase.co';
    var SUPABASE_KEY = CFG.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1amx5cm1hdHV2bHBvZWhlcWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwOTE5NDUsImV4cCI6MjA2NzY2Nzk0NX0.PgIRCU_-r6o-u6AIhj52FE1iezdwt3wpi-a9zQvAdsc';
    var ENDPOINT = SUPABASE_URL + '/rest/v1/analytics';

    // ── Page sanitizer ──
    function sanitizePage(raw) {
        if (!raw) return 'unknown.html';
        var s = String(raw);
        s = s.split('?')[0].split('#')[0];
        s = s.split('\\').pop();
        s = s.split('/').pop();
        s = s.trim();
        if (!s || s === '/' || s === '') return 'index.html';
        return s.slice(-5) === '.html' ? s : s + '.html';
    }

    // ── Session & page identity ──
    function generateSessionId() {
        return 's_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
    }
    function getSessionId() {
        try {
            var sid = sessionStorage.getItem('empire_sid');
            if (!sid) {
                sid = generateSessionId();
                sessionStorage.setItem('empire_sid', sid);
            }
            return sid;
        } catch (e) {
            return generateSessionId();
        }
    }
    var sessionId = getSessionId() || generateSessionId();
    if (sessionId) window.__empire_sid = sessionId;

    var pageLoadId = 'p_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);

    // ── Device ──
    function getDevice() {
        var ua = navigator.userAgent;
        if (/android/i.test(ua)) return 'android';
        if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
        return 'desktop';
    }
    var device = getDevice();

    // ── Browser ──
    function getBrowser() {
        var ua = navigator.userAgent;
        if (/Edg\//.test(ua)) return 'Edge';
        if (/OPR\//.test(ua) || /Opera/.test(ua)) return 'Opera';
        if (/SamsungBrowser/.test(ua)) return 'Samsung';
        if (/Firefox\//.test(ua)) return 'Firefox';
        if (/Chrome\//.test(ua) && !/Edg|OPR/.test(ua)) return 'Chrome';
        if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari';
        return 'Other';
    }

    // ── Country via timezone map ──
    var TZ_TO_COUNTRY = {
        'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
        'America/Los_Angeles': 'US', 'America/Anchorage': 'US', 'America/Phoenix': 'US',
        'America/Detroit': 'US', 'Pacific/Honolulu': 'US',
        'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA',
        'America/Winnipeg': 'CA', 'America/Halifax': 'CA',
        'America/Mexico_City': 'MX', 'America/Tijuana': 'MX',
        'America/Sao_Paulo': 'BR', 'America/Bogota': 'CO', 'America/Lima': 'PE',
        'America/Argentina/Buenos_Aires': 'AR', 'America/Santiago': 'CL',
        'Europe/Berlin': 'DE', 'Europe/Busingen': 'DE',
        'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Madrid': 'ES',
        'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL', 'Europe/Zurich': 'CH',
        'Europe/Vienna': 'AT', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO',
        'Europe/Copenhagen': 'DK', 'Europe/Helsinki': 'FI', 'Europe/Brussels': 'BE',
        'Europe/Lisbon': 'PT', 'Europe/Dublin': 'IE', 'Europe/Prague': 'CZ',
        'Europe/Bucharest': 'RO', 'Europe/Budapest': 'HU', 'Europe/Warsaw': 'PL',
        'Europe/Ljubljana': 'SI', 'Europe/Athens': 'GR', 'Europe/Istanbul': 'TR',
        'Asia/Tokyo': 'JP', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
        'Asia/Singapore': 'SG', 'Asia/Shanghai': 'CN', 'Asia/Seoul': 'KR',
        'Asia/Hong_Kong': 'HK', 'Asia/Taipei': 'TW', 'Asia/Bangkok': 'TH',
        'Asia/Jakarta': 'ID', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Manila': 'PH',
        'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Jerusalem': 'IL',
        'Africa/Lagos': 'NG', 'Africa/Cairo': 'EG', 'Africa/Johannesburg': 'ZA',
        'Africa/Nairobi': 'KE', 'Africa/Accra': 'GH',
        'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
        'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU',
        'Pacific/Auckland': 'NZ'
    };

    function getCountry() {
        try {
            var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (TZ_TO_COUNTRY[tz]) return TZ_TO_COUNTRY[tz];
            if (/^Australia\//.test(tz)) return 'AU';
            if (/^America\/Argentina\//.test(tz)) return 'AR';
            if (/^America\//.test(tz)) return 'US';
            if (/^Europe\//.test(tz)) return 'GB';
            if (/^Asia\//.test(tz)) return 'SG';
            if (/^Africa\//.test(tz)) return 'NG';
            return 'US';
        } catch (e) { return 'US'; }
    }
    var country = getCountry();

    // ── Referrer classification (EXPANDED) ──
    function classifyReferrer() {
        var ref = document.referrer || '';
        if (!ref) return 'direct';
        if (/empireaffiliatemarketinghub\.com/i.test(ref)) return 'internal';
        if (/t\.co|twitter\.com|x\.com/i.test(ref)) return 'twitter';
        if (/t\.me|telegram/i.test(ref)) return 'telegram';
        if (/google/i.test(ref)) return 'google';
        if (/facebook|fb\.com/i.test(ref)) return 'facebook';
        if (/instagram/i.test(ref)) return 'instagram';
        if (/reddit/i.test(ref)) return 'reddit';
        if (/linkedin/i.test(ref)) return 'linkedin';
        if (/youtube|youtu\.be/i.test(ref)) return 'youtube';
        if (/tiktok/i.test(ref)) return 'tiktok';
        if (/pinterest/i.test(ref)) return 'pinterest';
        if (/tumblr/i.test(ref)) return 'tumblr';
        if (/medium\.com/i.test(ref)) return 'medium';
        if (/chatgpt\.com|chat\.openai\.com/i.test(ref)) return 'chatgpt';
        if (/perplexity\.ai/i.test(ref)) return 'perplexity';
        if (/claude\.ai/i.test(ref)) return 'claude';
        if (/gemini\.google\.com|bard\.google\.com/i.test(ref)) return 'gemini';
        return 'referral';
    }

    // ── UTM helpers ──
    function urlParam(name) {
        try {
            var m = window.location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
            return m ? decodeURIComponent(m[1]) : null;
        } catch (e) { return null; }
    }

    // ── Payload builder (WITH FALLBACK) ──
    function buildPayload(eventType, extra) {
        // 1. Try to get UTM from URL
        var utmSource = urlParam('utm_source');
        var utmMedium = urlParam('utm_medium');
        var utmCampaign = urlParam('utm_campaign');
        
        // 2. If UTM is missing, check the referrer (Fixes TikTok/Telegram stripping)
        var refSource = classifyReferrer();
        
        // 3. Fallback logic: If no UTM but referrer is a known channel, use referrer
        if (!utmSource && refSource !== 'direct' && refSource !== 'referral') {
            utmSource = refSource;
            utmMedium = utmMedium || 'social';
            utmCampaign = utmCampaign || 'referrer_fallback';
        }

        var payload = {
            event_type: eventType,
            page: sanitizePage(window.location.pathname),
            page_title: document.title || null,
            device: device,
            country: country,
            browser: getBrowser(),
            referrer: classifyReferrer(),
            referrer_url: document.referrer || null,
            session_id: sessionId || getSessionId(),
            page_load_id: pageLoadId,
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            utm_content: urlParam('utm_content'),
            utm_term: urlParam('utm_term'),
            gclid: urlParam('gclid'),
            fbclid: urlParam('fbclid'),
            created_at: new Date().toISOString()
        };
        if (extra) {
            Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });
        }
        return payload;
    }

    // ── Send ──
    function send(payload) {
        if (!payload) return;
        if (!payload.session_id) payload.session_id = getSessionId();
        try {
            fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_KEY,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(payload),
                keepalive: true
            }).catch(function () {});
        } catch (e) {}
    }

    // ── Public API ──
    window.empireTrack = function (eventType, extra) {
        send(buildPayload(eventType, extra));
    };
    window.empireTrackCritical = window.empireTrack;

    // ── Page unload (time-on-page) ──
    var loadTime = Date.now();
    var unloaded = false;
    function onUnload() {
        if (unloaded) return;
        unloaded = true;
        send(buildPayload('page_unload', {
            time_on_page_seconds: Math.round((Date.now() - loadTime) / 1000),
            landing_page: sanitizePage(window.location.pathname)
        }));
    }
    window.addEventListener('pagehide', onUnload);
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') onUnload();
    });

    // ── Offer click tracking (delegated) ──
    var OFFER_URL_PATTERN = /singingfiles\.com|rileymarker\.com|filetrkr\.com|motifiles\.com|cpagrip|cpalead|optilinklock\.com|bearmobiles\.com|quartzfiles\.com/i;
    document.addEventListener('click', function (e) {
        var el = e.target;
        while (el && el.tagName !== 'A' && el !== document.body) el = el.parentElement;
        if (!el || el.tagName !== 'A') return;
        if (el.hasAttribute('data-empire-tracked')) return;
        var href = el.getAttribute('href') || '';
        if (!OFFER_URL_PATTERN.test(href)) return;
        el.setAttribute('data-empire-tracked', '1');

        try {
            sessionStorage.setItem('empire_return_url', window.location.pathname);
        } catch (err) {}

        var idMatch = href.match(/[?&]id=([^&]+)/);
        var card = el.closest('[data-offer-id], .offer-card, .offer-item') || el;

        window.empireTrack('offer_click', {
            offer_id:    card.getAttribute('data-offer-id')    || (idMatch ? idMatch[1] : null),
            offer_title: card.getAttribute('data-offer-title') || el.getAttribute('data-offer-title') || null,
            offer_tag:   card.getAttribute('data-offer-tag')   || null,
            offer_url:   href,
            landing_page: sanitizePage(window.location.pathname)
        });
    });

    // ── Scroll depth ──
    (function () {
        var fired = {};
        function check() {
            var top = window.pageYOffset || document.documentElement.scrollTop;
            var h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            if (h <= 0) return;
            var pct = top / h;
            [25, 50, 75, 90].forEach(function (mark) {
                if (!fired[mark] && pct > mark / 100) {
                    fired[mark] = true;
                    window.empireTrack('scroll_' + mark);
                }
            });
            if (fired[90]) window.removeEventListener('scroll', check);
        }
        window.addEventListener('scroll', check, { passive: true });
    })();

    // ── Offer visibility ──
    (function () {
        if (!('IntersectionObserver' in window)) return;
        var seen = new WeakSet();
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var card = entry.target;
                if (seen.has(card)) return;
                seen.add(card);
                var link = card.querySelector('a[href]');
                window.empireTrack('offer_visible', {
                    offer_id:    card.getAttribute('data-offer-id')    || null,
                    offer_title: card.getAttribute('data-offer-title') || null,
                    offer_tag:   card.getAttribute('data-offer-tag')   || null,
                    offer_url:   link ? link.href : null,
                    landing_page: sanitizePage(window.location.pathname)
                });
            });
        }, { threshold: 0.5 });

        function observeOffers() {
            var cards = document.querySelectorAll('[data-offer-id], .offer-card, .offer-item');
            cards.forEach(function (el) {
                if (!seen.has(el)) observer.observe(el);
            });
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', observeOffers);
        } else {
            observeOffers();
        }
        try {
            var mo = new MutationObserver(observeOffers);
            mo.observe(document.body, { childList: true, subtree: true });
        } catch (e) {}
    })();

    // ── Unlock / reveal public API ──
    window.empireUnlockShown = function (offerId) {
        window.empireTrack('unlock_shown', { offer_id: offerId || null });
    };
    window.empireUnlockClicked = function (offerId) {
        window.empireTrack('unlock_click', { offer_id: offerId || null });
    };
    window.empireOffersRevealed = function (offerId) {
        window.empireTrack('content_unlocked', { offer_id: offerId || null });
    };
    window.empireUnlockClick = window.empireUnlockClicked;
    window.empireContentUnlocked = window.empireOffersRevealed;

    // ── PostMessage listener for CPA conversion callbacks ──
    var TRUSTED_ORIGINS = [
        window.location.origin,
        'https://www.cpagrip.com',
        'https://cpagrip.com',
        'https://rileymarker.com',
        'https://filetrkr.com',
        'https://singingfiles.com',
        'https://motifiles.com'
    ];
    window.addEventListener('message', function (e) {
        if (TRUSTED_ORIGINS.indexOf(e.origin) === -1) return;
        if (e.data && e.data.type === 'cpagrip_conversion') {
            window.empireTrack('conversion', {
                offer_id: e.data.offer_id || null,
                payout: e.data.payout || null,
                transaction_id: e.data.transaction_id || null,
                landing_page: sanitizePage(window.location.pathname)
            });
        }
    });

})();
