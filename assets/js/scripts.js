/* site.js — PartsMtaani shared scripts */

// ── Hamburger nav toggle ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }

  // ── Sticky TOC active state ───────────────────────────────────
  const tocLinks = document.querySelectorAll('.prose-toc ul li a');
  if (tocLinks.length > 0) {
    const headings = Array.from(
      document.querySelectorAll('.prose-section[id]')
    );

    function setActive() {
      let current = '';
      headings.forEach(section => {
        if (window.scrollY >= section.offsetTop - 120) {
          current = section.id;
        }
      });
      tocLinks.forEach(link => {
        const li = link.parentElement;
        li.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
          li.classList.add('active');
        }
      });
    }

    window.addEventListener('scroll', setActive, { passive: true });
    setActive();
  }
});