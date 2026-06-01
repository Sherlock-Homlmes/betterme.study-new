export function lazyLoadIframe({ wrapperSelector, placeholderSelector, iframeSelector }) {
  const wrapper = document.querySelector(wrapperSelector);
  const placeholder = document.querySelector(placeholderSelector);
  const iframe = document.querySelector(iframeSelector);
  if (!wrapper || !placeholder || !iframe) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        iframe.src = iframe.dataset.src || '';
        iframe.style.display = 'block';
        iframe.addEventListener('load', () => {
          placeholder.style.display = 'none';
        });
        observer.disconnect();
      }
    },
    { rootMargin: '200px' }
  );
  observer.observe(wrapper);
}
