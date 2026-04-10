/***
 * scroll-animate.js
 * ─────────────────────────────────────────────────────────────
 * Reusable scroll-triggered fade-in animation utility.
 * Configure animations per element by ID at the BOTTOM of this
 * file — easy to find, easy to edit, separate from all logic.
 * ─────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════
//  DIRECTION PRESETS
//  Each preset defines the hidden (start) transform.
//  The visible state is always: opacity 1, transform none.
// ═══════════════════════════════════════════════════════════════

const PRESETS = {
  "fade-up":    { x:   0, y:  60, scale: 1    },
  "fade-down":  { x:   0, y: -40, scale: 1    },
  "fade-left":  { x:  50, y:   0, scale: 1    },
  "fade-right": { x: -50, y:   0, scale: 1    },
  "fade-in":    { x:   0, y:   0, scale: 1    },
  "zoom-in":    { x:   0, y:  20, scale: 0.88 },
  "zoom-out":   { x:   0, y: -20, scale: 1.1  },
};

// ═══════════════════════════════════════════════════════════════
//  CORE ENGINE  (do not edit — configure via ANIMATIONS below)
// ═══════════════════════════════════════════════════════════════

function hide(el, preset) {
  el.style.setProperty("opacity", "0", "important");
  el.style.setProperty("transform", `translate(${preset.x}px, ${preset.y}px) scale(${preset.scale})`, "important");
  el.style.willChange = "opacity, transform";
}

function reveal(el, opts) {
  el.style.transition = [
    `opacity ${opts.duration}ms ${opts.easing} ${opts.delay}ms`,
    `transform ${opts.duration}ms ${opts.easing} ${opts.delay}ms`,
  ].join(", ");

  // Double rAF ensures transition fires after hidden state paints
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.setProperty("opacity", "1", "important");
      el.style.setProperty("transform", "translate(0, 0) scale(1)", "important");
      el.dataset.animated = "true";
    });
  });
}

/**
 * Registers a single element for scroll-triggered animation.
 *
 * @param {string} id       — The element's HTML id attribute
 * @param {object} config
 *   @param {string}  config.from       "fade-up" | "fade-down" | "fade-left" |
 *                                      "fade-right" | "fade-in" | "zoom-in" | "zoom-out"
 *   @param {number}  config.delay      ms before animation starts        (default: 0)
 *   @param {number}  config.duration   ms the animation lasts            (default: 700)
 *   @param {string}  config.easing     any CSS easing string             (default: ease-out spring)
 *   @param {number}  config.threshold  0–1, visibility to trigger at     (default: 0.15)
 *   @param {number}  config.distance   px distance to travel (overrides preset) (optional)
 *   @param {boolean} config.once       animate only once                 (default: true)
 */
function animate(id, config = {}) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[scroll-animate] No element found with id "${id}"`);
    return;
  }

  let preset = PRESETS[config.from] ?? PRESETS["fade-up"];

  // Allow custom distance override
  if (config.distance !== undefined) {
    preset = { ...preset };
    if (config.from === "fade-up") {
      preset.y = config.distance;
    } else if (config.from === "fade-down") {
      preset.y = -config.distance;
    } else if (config.from === "fade-left") {
      preset.x = config.distance;
    } else if (config.from === "fade-right") {
      preset.x = -config.distance;
    }
  }

  const opts = {
    duration:  config.duration  ?? 700,
    delay:     config.delay     ?? 0,
    easing:    config.easing    ?? "cubic-bezier(0.22, 1, 0.36, 1)",
    threshold: config.threshold ?? 0.15,
    once:      config.once      ?? true,
  };

  hide(el, preset);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      reveal(el, opts);
      if (opts.once) observer.unobserve(el);
    });
  }, {
    threshold:  opts.threshold,
    rootMargin: "0px 0px -40px 0px",
  });

  observer.observe(el);
}

/**
 * Convenience wrapper — animate many elements at once.
 * @param {Array<{ id: string } & object>} items
 */
function animateAll(items = []) {
  items.forEach(({ id, ...config }) => animate(id, config));
}

/**
 * Animates text word by word, with each word's characters fading in from the right.
 * Preserves HTML elements like spans with styling.
 *
 * @param {string} id       — The element's HTML id attribute
 * @param {object} config
 *   @param {number}  config.wordDelay    ms delay between each word        (default: 100)
 *   @param {number}  config.charDelay    ms delay between chars in word    (default: 20)
 *   @param {number}  config.startDelay   ms before animation starts        (default: 0)
 *   @param {number}  config.duration     ms each character takes           (default: 500)
 *   @param {number}  config.distance     px to slide from right            (default: 30)
 *   @param {number}  config.threshold    0–1, visibility to trigger at     (default: 0.15)
 *   @param {boolean} config.once         animate only once                 (default: true)
 */
function animateText(id, config = {}) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[scroll-animate] No element found with id "${id}"`);
    return;
  }

  const opts = {
    wordDelay:  config.wordDelay  ?? 100,
    charDelay:  config.charDelay  ?? 20,
    startDelay: config.startDelay ?? 0,
    duration:   config.duration   ?? 500,
    distance:   config.distance   ?? 30,
    threshold:  config.threshold  ?? 0.15,
    once:       config.once       ?? true,
  };

  // easeOutBack cubic-bezier for bouncy effect
  const easeOutBack = "cubic-bezier(0.34, 1.56, 0.64, 1)";

  // Store original HTML and clear element
  const originalHTML = el.innerHTML;
  el.innerHTML = "";
  el.style.opacity = "1";
  el.style.perspective = "400px";

  // Create a temporary element to parse HTML
  const temp = document.createElement("div");
  temp.innerHTML = originalHTML;

  const wordElements = [];

  // Process all child nodes (text and elements)
  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      // Text node - split into words
      const text = node.textContent;
      const words = text.split(" ").filter(w => w.length > 0);
      words.forEach((word, idx) => {
        const wordWrapper = document.createElement("div");
        wordWrapper.style.position = "relative";
        wordWrapper.style.display = "inline-block";

        word.split("").forEach((char) => {
          const charSpan = document.createElement("div");
          charSpan.textContent = char;
          charSpan.style.position = "relative";
          charSpan.style.display = "inline-block";
          charSpan.style.opacity = "0";
          charSpan.style.transform = `translate(${opts.distance}px, 0px)`;
          charSpan.style.transition = `opacity ${opts.duration}ms ${easeOutBack}, transform ${opts.duration}ms ${easeOutBack}`;
          wordWrapper.appendChild(charSpan);
        });

        el.appendChild(wordWrapper);
        wordElements.push(wordWrapper);

        // Add space after word (except last)
        if (idx < words.length - 1 || node.nextSibling) {
          el.appendChild(document.createTextNode(" "));
        }
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Element node (like span) - preserve it and process its content
      const clone = node.cloneNode(false);
      el.appendChild(clone);

      // Process children of this element
      Array.from(node.childNodes).forEach(child => {
        processNodeInElement(child, clone);
      });
    }
  }

  const underlineElements = [];

  function processNodeInElement(node, parentEl) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const words = text.split(" ").filter(w => w.length > 0);
      words.forEach((word, idx) => {
        const wordWrapper = document.createElement("div");
        wordWrapper.style.position = "relative";
        wordWrapper.style.display = "inline-block";

        // Copy computed styles from parent element to preserve color
        const computedStyle = window.getComputedStyle(parentEl);
        const color = computedStyle.color;

        word.split("").forEach((char) => {
          const charSpan = document.createElement("div");
          charSpan.textContent = char;
          charSpan.style.position = "relative";
          charSpan.style.display = "inline-block";
          charSpan.style.opacity = "0";
          charSpan.style.transform = `translate(${opts.distance}px, 0px)`;
          charSpan.style.transition = `opacity ${opts.duration}ms ${easeOutBack}, transform ${opts.duration}ms ${easeOutBack}`;
          charSpan.style.color = color; // Preserve parent color
          wordWrapper.appendChild(charSpan);
        });

        parentEl.appendChild(wordWrapper);
        wordElements.push(wordWrapper);

        if (idx < words.length - 1) {
          parentEl.appendChild(document.createTextNode(" "));
        }
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Preserve non-text elements (like divs for underlines)
      const clone = node.cloneNode(true);

      // Check if this is an underline element (has absolute positioning and bottom positioning)
      const isUnderline = clone.classList && (Array.from(clone.classList).some(c => c.includes('bottom')) ||
        clone.style.position === 'absolute');

      if (isUnderline) {
        // Hide underline initially and prepare for animation
        clone.style.opacity = "0";
        clone.style.transform = "scaleX(0)";
        clone.style.transformOrigin = "left";
        clone.style.transition = `opacity 400ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
        underlineElements.push(clone);
      }

      parentEl.appendChild(clone);
    }
  }

  // Process all child nodes
  Array.from(temp.childNodes).forEach(processNode);

  // Animate words on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      setTimeout(() => {
        // Calculate when the last word starts animating (not when it finishes)
        const lastWordStartTime = (wordElements.length - 1) * opts.wordDelay;

        // Animate text words
        wordElements.forEach((wordEl, idx) => {
          const chars = wordEl.querySelectorAll("div");
          setTimeout(() => {
            chars.forEach((char, charIndex) => {
              setTimeout(() => {
                char.style.opacity = "1";
                char.style.transform = "translate(0px, 0px)";
              }, charIndex * opts.charDelay);
            });
          }, idx * opts.wordDelay);
        });

        // Animate underlines shortly after the last word starts (not after it finishes)
        if (underlineElements.length > 0) {
          setTimeout(() => {
            underlineElements.forEach((underline) => {
              underline.style.opacity = "1";
              underline.style.transform = "scaleX(1)";
            });
          }, lastWordStartTime + 200); // Start 200ms after last word begins
        }
      }, opts.startDelay);

      if (opts.once) observer.unobserve(el);
    });
  }, {
    threshold: opts.threshold,
    rootMargin: "0px 0px -40px 0px",
  });

  observer.observe(el);
}

/** Runs callback once the DOM is ready. */
function ready(fn) {
  if (document.readyState !== "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
}

// ═══════════════════════════════════════════════════════════════
//  ↓↓↓  USAGE — ADD YOUR ANIMATIONS HERE  ↓↓↓
//
//  Give any HTML element an id, then call animate() with it.
//
//  animate("your-element-id", {
//    from:      "fade-up",   // where it comes from  (see PRESETS)
//    delay:     0,           // ms — pause before playing
//    duration:  700,         // ms — how long it takes
//    threshold: 0.15,        // 0–1 — how visible before triggering
//    once:      true,        // false = re-animate every time it enters view
//  });
//
//  All fields are optional — only "from" is meaningful to set.
//  Pages that uses the script must put <script src="/src/scripts/name-of-page"></script>
// ═══════════════════════════════════════════════════════════════

ready(() => {
  // ═══════════════════════════════════════════════════════════════
  //  HERO ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  
  // Hero headline container
  animate("hero-headline", {
    from: "fade-in",
    delay: 0,
    duration: 800,
    threshold: 0.1,
    once: true,
  });

  // Hero words - staggered slide from left
  animate("hero-word-1", {
    from: "fade-left",
    delay: 200,
    duration: 800,
    distance: 60,
    threshold: 0.1,
    once: true,
  });

  animate("hero-word-2", {
    from: "fade-left",
    delay: 400,
    duration: 800,
    distance: 60,
    threshold: 0.1,
    once: true,
  });

  animate("hero-word-3", {
    from: "fade-left",
    delay: 600,
    duration: 800,
    distance: 60,
    threshold: 0.1,
    once: true,
  });

  // Hero content - slide from right
  animate("hero-content", {
    from: "fade-right",
    delay: 800,
    duration: 800,
    distance: 80,
    threshold: 0.1,
    once: true,
  });

  // Hero description - fade in
  animate("hero-description", {
    from: "fade-in",
    delay: 1000,
    duration: 700,
    threshold: 0.1,
    once: true,
  });

  // Hero actions - scale up
  animate("hero-actions", {
    from: "zoom-in",
    delay: 1200,
    duration: 600,
    threshold: 0.1,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  COMPANY LOGOS ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  
  animate("company-logos", {
    from: "fade-up",
    delay: 0,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("logos-grid", {
    from: "fade-in",
    delay: 100,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  // Individual logos with staggered delays
  animate("logo-1", {
    from: "zoom-in",
    delay: 200,
    duration: 600,
    threshold: 0.1,
    once: true,
  });

  animate("logo-2", {
    from: "zoom-in",
    delay: 300,
    duration: 600,
    threshold: 0.1,
    once: true,
  });

  animate("logo-3", {
    from: "zoom-in",
    delay: 400,
    duration: 600,
    threshold: 0.1,
    once: true,
  });

  animate("logo-4", {
    from: "zoom-in",
    delay: 500,
    duration: 600,
    threshold: 0.1,
    once: true,
  });

  animate("logo-5", {
    from: "zoom-in",
    delay: 600,
    duration: 600,
    threshold: 0.1,
    once: true,
  });

  animate("logo-6", {
    from: "zoom-in",
    delay: 700,
    duration: 600,
    threshold: 0.1,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  COUPONS SECTION ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  
  animate("coupons-section", {
    from: "fade-up",
    delay: 0,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("coupons-header", {
    from: "fade-up",
    delay: 100,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("coupons-title", {
    from: "fade-in",
    delay: 200,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("coupons-subtitle", {
    from: "fade-in",
    delay: 300,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("coupons-grid", {
    from: "fade-up",
    delay: 400,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  // Individual coupons with staggered delays
  animate("coupon-1", {
    from: "zoom-in",
    delay: 500,
    duration: 600,
    threshold: 0.1,
    once: true,
  });

  animate("coupon-2", {
    from: "zoom-in",
    delay: 600,
    duration: 600,
    threshold: 0.1,
    once: true,
  });

  animate("coupon-3", {
    from: "zoom-in",
    delay: 700,
    duration: 600,
    threshold: 0.1,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  WHY CHOOSE US SECTION ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  
  animate("why-choose-us", {
    from: "fade-up",
    delay: 0,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("why-choose-content", {
    from: "fade-left",
    delay: 100,
    duration: 700,
    distance: 60,
    threshold: 0.15,
    once: true,
  });

  animate("why-choose-header", {
    from: "fade-left",
    delay: 200,
    duration: 700,
    distance: 60,
    threshold: 0.15,
    once: true,
  });

  animate("why-choose-label", {
    from: "fade-in",
    delay: 300,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("why-choose-title", {
    from: "fade-left",
    delay: 400,
    duration: 700,
    distance: 60,
    threshold: 0.15,
    once: true,
  });

  animate("why-choose-description", {
    from: "fade-in",
    delay: 500,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("why-choose-features", {
    from: "fade-left",
    delay: 600,
    duration: 700,
    distance: 60,
    threshold: 0.15,
    once: true,
  });

  // Individual features with staggered delays
  animate("feature-1", {
    from: "fade-left",
    delay: 700,
    duration: 600,
    distance: 40,
    threshold: 0.1,
    once: true,
  });

  animate("feature-2", {
    from: "fade-left",
    delay: 800,
    duration: 600,
    distance: 40,
    threshold: 0.1,
    once: true,
  });

  animate("feature-3", {
    from: "fade-left",
    delay: 900,
    duration: 600,
    distance: 40,
    threshold: 0.1,
    once: true,
  });

  animate("feature-4", {
    from: "fade-left",
    delay: 1000,
    duration: 600,
    distance: 40,
    threshold: 0.1,
    once: true,
  });

  // Right side visual elements
  animate("why-choose-visual", {
    from: "fade-right",
    delay: 200,
    duration: 700,
    distance: 80,
    threshold: 0.15,
    once: true,
  });

  animate("why-choose-image", {
    from: "zoom-in",
    delay: 400,
    duration: 800,
    threshold: 0.15,
    once: true,
  });

  animate("experience-badge", {
    from: "zoom-in",
    delay: 600,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("why-choose-cta", {
    from: "zoom-in",
    delay: 800,
    duration: 600,
    threshold: 0.15,
    once: true,
  });
});