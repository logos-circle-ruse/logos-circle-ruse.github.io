function resizeIframe() {
  const container = document.getElementById("open-ruse");
  const iframe = container.querySelector("iframe");

  const rect = container.getBoundingClientRect();

  iframe.style.width = rect.width + "px";
}

window.addEventListener("load", resizeIframe);
window.addEventListener("resize", resizeIframe);