(() => {
  if (location.hostname !== 'yangozheng.github.io') return;
  const send = () => {
    try {
      fetch('https://124.220.193.89/blog-stats/collect', {
        method: 'POST', mode: 'cors', credentials: 'omit',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ path: location.pathname }),
        signal: AbortSignal.timeout(4500), referrerPolicy: 'no-referrer'
      }).catch(() => {});
    } catch {}
  };
  if (document.readyState === 'complete') send();
  else window.addEventListener('load', send, { once: true });
})();
