export const runtime = "nodejs";
export const dynamic = "force-static";

// GET /api/widget/loader.js — the single <script> snippet site owners embed.
// It injects a floating bubble that opens an iframe pointing back at
// /widget on this same origin (so the iframe always talks to /api/chat with
// channel="widget", which enforces the allowed-domain check server-side).
const SCRIPT = `
(function () {
  var currentScript = document.currentScript;
  var origin = new URL(currentScript.src).origin;
  var position = currentScript.getAttribute("data-position") || "bottom-right";
  var side = position.indexOf("left") !== -1 ? "left" : "right";

  var bubble = document.createElement("button");
  bubble.setAttribute("aria-label", "باز کردن گفتگو");
  bubble.style.cssText =
    "position:fixed;bottom:20px;" + side + ":20px;width:56px;height:56px;" +
    "border-radius:9999px;border:none;cursor:pointer;z-index:2147483000;" +
    "background:linear-gradient(135deg,#2563eb,#8b5cf6);box-shadow:0 8px 24px rgba(0,0,0,.25);" +
    "display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;";
  bubble.innerHTML =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';

  var frame = document.createElement("iframe");
  frame.src = origin + "/widget";
  frame.title = "دستیار هوش مصنوعی";
  frame.style.cssText =
    "position:fixed;bottom:88px;" + side + ":20px;width:380px;max-width:calc(100vw - 40px);" +
    "height:600px;max-height:calc(100vh - 120px);border:none;border-radius:16px;" +
    "box-shadow:0 16px 48px rgba(0,0,0,.3);z-index:2147483000;display:none;" +
    "background:transparent;";
  frame.setAttribute("allow", "clipboard-write");

  var open = false;
  bubble.addEventListener("click", function () {
    open = !open;
    frame.style.display = open ? "block" : "none";
  });

  document.body.appendChild(frame);
  document.body.appendChild(bubble);
})();
`;

export async function GET() {
  return new Response(SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
