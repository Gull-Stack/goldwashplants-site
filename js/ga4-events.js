(function() {
  "use strict";
  function track(e, p) { if (typeof gtag === "function") gtag("event", e, p); }
  document.addEventListener("submit", function(e) {
    var f = e.target;
    if (f && f.tagName === "FORM") track("form_submission", {
      event_category: "Lead", event_label: f.id || f.action || "unknown_form",
      form_id: f.id || "", page_path: window.location.pathname
    });
  });
  document.addEventListener("click", function(e) {
    var a = e.target.closest("a[href]");
    if (!a) return;
    var h = a.getAttribute("href") || "";
    if (h.indexOf("tel:") === 0) track("phone_click", {
      event_category: "Contact", event_label: h.replace("tel:", "").replace(/\+/g, ""),
      link_text: (a.textContent || "").trim().substring(0, 100), page_path: window.location.pathname
    });
    if (h.indexOf("mailto:") === 0) track("email_click", {
      event_category: "Contact", event_label: h.replace("mailto:", "").split("?")[0],
      link_text: (a.textContent || "").trim().substring(0, 100), page_path: window.location.pathname
    });
  });
})();
