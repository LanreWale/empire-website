/*
 * Empire Attribution — Decorator only (v3)
 *
 * Keeps:
 *   - captureChannel()  → persists utm_source for 30 days in localStorage
 *   - decorateLinks()   → appends tracking_id + utm params to offer URLs
 *   - MutationObserver  → re-decorates when offer cards inject
 *
 * Drops (all handled by empire-tracker.js v4):
 *   - track()             — v4 owns window.empireTrack
 *   - pageview/scroll/unload handlers
 *   - offer_click delegated listener
 *   - postMessage conversion listener
 *   - window.empireTrack assignment
 */
(function () {
  "use strict";

  var STORAGE_KEY = "empire_channel";
  var STORAGE_EXPIRY_KEY = "empire_channel_expiry";
  var TTL_MS = 30 * 24 * 60 * 60 * 1000;

  function normalize(raw) {
    var n = String(raw || "").toLowerCase().trim();
    if (n === "x" || n === "twitter") return "twitter";
    if (n === "ig") return "instagram";
    if (n === "fb") return "facebook";
    if (n === "tg") return "telegram";
    if (n === "yt") return "youtube";
    if (n === "pin" || n === "pinterest") return "pinterest";
    if (n === "rd" || n === "reddit") return "reddit";
    if (n === "li" || n === "linkedin") return "linkedin";
    if (n === "tt" || n === "tiktok") return "tiktok";
    return n || null;
  }

  function captureChannel() {
    var params = new URLSearchParams(window.location.search);
    var source = params.get("utm_source");
    if (!source) return getStoredChannel();

    var payload = {
      channel: normalize(source),
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_content: params.get("utm_content") || "",
      captured_at: new Date().toISOString(),
      landing_url: window.location.pathname
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem(STORAGE_EXPIRY_KEY, String(Date.now() + TTL_MS));
    } catch (e) {}
    return payload;
  }

  function getStoredChannel() {
    try {
      var expiry = parseInt(localStorage.getItem(STORAGE_EXPIRY_KEY) || "0", 10);
      if (!expiry || Date.now() > expiry) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXPIRY_KEY);
        return null;
      }
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function decorateLinks(payload) {
    if (!payload || !payload.channel) return;

    var links = document.querySelectorAll(
      'a[href*="cpagrip"], a[href*="singingfiles"], a.offer-link, a.offer-card, a[data-offer-link]'
    );

    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = a.getAttribute("href");
      if (!href) continue;
      try {
        var url = new URL(href, window.location.origin);
        if (!url.searchParams.has("tracking_id")) {
          var uniqueId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
          url.searchParams.set("tracking_id", payload.channel + "_" + uniqueId);
        }
        if (payload.utm_content && !url.searchParams.has("utm_content")) {
          url.searchParams.set("utm_content", payload.utm_content);
        }
        if (payload.utm_campaign && !url.searchParams.has("utm_campaign")) {
          url.searchParams.set("utm_campaign", payload.utm_campaign);
        }
        a.setAttribute("href", url.toString());
      } catch (e) {}
    }
  }

  function init() {
    var payload = captureChannel();

    // Expose attribution data for other scripts to read — but do NOT
    // take over window.empireTrack. That belongs to empire-tracker.js v4.
    window.EMPIRE_CHANNEL = payload ? payload.channel : "unknown";
    window.EMPIRE_ATTRIBUTION = payload || {};

    decorateLinks(payload);

    // Re-decorate whenever the DOM changes (offer cards get injected)
    try {
      var observer = new MutationObserver(function () { decorateLinks(payload); });
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();