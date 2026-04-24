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

  // New Hero right content container
  animate("hero-right-content", {
    from: "fade-right",
    delay: 800,
    duration: 800,
    distance: 80,
    threshold: 0.1,
    once: true,
  });

  // Hero subheading
  animate("hero-subheading", {
    from: "fade-in",
    delay: 1000,
    duration: 700,
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

  // Hero trust signals
  animate("hero-trust", {
    from: "fade-up",
    delay: 1400,
    duration: 600,
    threshold: 0.1,
    once: true,
  });

  // Hero coupon - subtle entrance
  animate("hero-coupon", {
    from: "fade-in",
    delay: 1600,
    duration: 700,
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
    delay: 300,
    duration: 700,
    distance: 60,
    threshold: 0.15,
    once: true,
  });

  animate("why-choose-description", {
    from: "fade-in",
    delay: 300,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("why-choose-features", {
    from: "fade-left",
    delay: 200,
    duration: 700,
    distance: 60,
    threshold: 0.15,
    once: true,
  });

  // Individual features with staggered delays
  animate("feature-1", {
    from: "fade-left",
    delay: 200,
    duration: 600,
    distance: 40,
    threshold: 0.1,
    once: true,
  });

  animate("feature-2", {
    from: "fade-left",
    delay: 300,
    duration: 600,
    distance: 40,
    threshold: 0.1,
    once: true,
  });

  animate("feature-3", {
    from: "fade-left",
    delay: 400,
    duration: 600,
    distance: 40,
    threshold: 0.1,
    once: true,
  });

  animate("feature-4", {
    from: "fade-left",
    delay: 500,
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

  // ═══════════════════════════════════════════════════════════════
  //  SERVICES SECTION ANIMATIONS (FASTER TIMING)
  // ═══════════════════════════════════════════════════════════════
  
  animate("services-section", {
    from: "fade-up",
    delay: 0,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("services-header", {
    from: "fade-up",
    delay: 50,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("services-label", {
    from: "fade-in",
    delay: 100,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("services-title", {
    from: "fade-up",
    delay: 150,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("services-description", {
    from: "fade-in",
    delay: 200,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("services-container", {
    from: "fade-up",
    delay: 10,
    duration: 200,
    threshold: 0.15,
    once: true,
  });

  animate("services-tabs", {
    from: "zoom-in",
    delay: 200,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  // Individual service tabs with faster staggered delays
  animate("service-tab-1", {
    from: "fade-left",
    delay: 250,
    duration: 400,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  animate("service-tab-2", {
    from: "fade-left",
    delay: 275,
    duration: 400,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  animate("service-tab-3", {
    from: "fade-left",
    delay: 300,
    duration: 400,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  animate("service-tab-4", {
    from: "fade-left",
    delay: 325,
    duration: 400,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  animate("services-content", {
    from: "fade-up",
    delay: 350,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  // Service content grids
  animate("service-content-1", {
    from: "fade-in",
    delay: 400,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("service-grid-1", {
    from: "fade-up",
    delay: 450,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  // Gradient overlay
  animate("services-gradient", {
    from: "fade-in",
    delay: 100,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  MAINTENANCE PLANS SECTION ANIMATIONS (FASTER TIMING)
  // ═══════════════════════════════════════════════════════════════
  
  animate("maintenance-section", {
    from: "fade-up",
    delay: 0,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-gradient", {
    from: "fade-in",
    delay: 30,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-header", {
    from: "fade-up",
    delay: 60,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-label", {
    from: "fade-in",
    delay: 90,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-title", {
    from: "fade-up",
    delay: 120,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-description", {
    from: "fade-in",
    delay: 150,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-content", {
    from: "fade-up",
    delay: 180,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  // Left column animations
  animate("maintenance-left-column", {
    from: "fade-left",
    delay: 210,
    duration: 600,
    distance: 60,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-info-card", {
    from: "zoom-in",
    delay: 240,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-info-title", {
    from: "fade-up",
    delay: 270,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-image-container", {
    from: "zoom-in",
    delay: 200,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-image", {
    from: "zoom-out",
    delay: 230,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-overlay-content", {
    from: "fade-left",
    delay: 260,
    duration: 500,
    distance: 40,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-overlay-title", {
    from: "fade-up",
    delay: 290,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-overlay-description", {
    from: "fade-in",
    delay: 220,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-highlights", {
    from: "fade-up",
    delay: 250,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  // Individual highlights with staggered delays
  animate("maintenance-highlight-1", {
    from: "fade-left",
    delay: 280,
    duration: 350,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("maintenance-highlight-2", {
    from: "fade-left",
    delay: 300,
    duration: 350,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("maintenance-highlight-3", {
    from: "fade-left",
    delay: 220,
    duration: 350,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("maintenance-highlight-4", {
    from: "fade-left",
    delay: 240,
    duration: 350,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("maintenance-benefits", {
    from: "fade-up",
    delay: 270,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-benefits-title", {
    from: "fade-in",
    delay: 300,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-benefits-grid", {
    from: "fade-up",
    delay: 330,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  // Right column animations
  animate("maintenance-right-column", {
    from: "fade-right",
    delay: 210,
    duration: 600,
    distance: 60,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-pricing-card", {
    from: "zoom-in",
    delay: 240,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-pricing-header", {
    from: "fade-up",
    delay: 270,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-pricing-title", {
    from: "fade-in",
    delay: 300,
    duration: 350,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-price", {
    from: "zoom-in",
    delay: 330,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-price-description", {
    from: "fade-in",
    delay: 360,
    duration: 350,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-pricing-features", {
    from: "fade-up",
    delay: 390,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  // Individual pricing features
  animate("maintenance-pricing-feature-1", {
    from: "fade-left",
    delay: 420,
    duration: 350,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("maintenance-pricing-feature-2", {
    from: "fade-left",
    delay: 440,
    duration: 350,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("maintenance-pricing-feature-3", {
    from: "fade-left",
    delay: 460,
    duration: 350,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("maintenance-cta-button", {
    from: "zoom-in",
    delay: 480,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-why-card", {
    from: "zoom-in",
    delay: 300,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-why-title", {
    from: "fade-up",
    delay: 330,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("maintenance-why-list", {
    from: "fade-up",
    delay: 360,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  // Individual why items
  animate("maintenance-why-item-1", {
    from: "fade-left",
    delay: 390,
    duration: 350,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("maintenance-why-item-2", {
    from: "fade-left",
    delay: 410,
    duration: 350,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("maintenance-why-item-3", {
    from: "fade-left",
    delay: 430,
    duration: 350,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("maintenance-why-item-4", {
    from: "fade-left",
    delay: 450,
    duration: 350,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  FINANCING SECTION ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  
  animate("financing-section", {
    from: "fade-up",
    delay: 0,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("financing-top-border", {
    from: "fade-in",
    delay: 50,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("financing-bottom-gradient", {
    from: "fade-in",
    delay: 100,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("financing-header", {
    from: "fade-up",
    delay: 150,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("financing-label", {
    from: "fade-in",
    delay: 200,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("financing-title", {
    from: "fade-up",
    delay: 250,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("financing-description", {
    from: "fade-in",
    delay: 300,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("financing-columns", {
    from: "fade-up",
    delay: 350,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  // Left card animations
  animate("financing-left-card", {
    from: "fade-left",
    delay: 200,
    duration: 600,
    distance: 60,
    threshold: 0.15,
    once: true,
  });

  animate("financing-left-title", {
    from: "fade-up",
    delay: 250,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("financing-left-features", {
    from: "fade-up",
    delay: 300,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  // Left features with staggered delays
  animate("financing-left-feature-1", {
    from: "fade-left",
    delay: 250,
    duration: 400,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  animate("financing-left-feature-2", {
    from: "fade-left",
    delay: 280,
    duration: 400,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  animate("financing-left-feature-3", {
    from: "fade-left",
    delay: 310,
    duration: 400,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  // Right card animations
  animate("financing-right-card", {
    from: "fade-right",
    delay: 300,
    duration: 600,
    distance: 60,
    threshold: 0.15,
    once: true,
  });

  animate("financing-right-title", {
    from: "fade-up",
    delay: 350,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("financing-right-features", {
    from: "fade-up",
    delay: 300,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  // Right features with staggered delays
  animate("financing-right-feature-1", {
    from: "fade-right",
    delay: 350,
    duration: 400,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  animate("financing-right-feature-2", {
    from: "fade-right",
    delay: 380,
    duration: 400,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  animate("financing-right-feature-3", {
    from: "fade-right",
    delay: 310,
    duration: 400,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  animate("financing-right-feature-4", {
    from: "fade-right",
    delay: 340,
    duration: 400,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  // How to Apply section
  animate("financing-apply-section", {
    from: "fade-up",
    delay: 370,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("financing-apply-header", {
    from: "fade-up",
    delay: 300,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("financing-apply-title", {
    from: "fade-in",
    delay: 330,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("financing-apply-description", {
    from: "fade-in",
    delay: 360,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("financing-process", {
    from: "fade-up",
    delay: 390,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("financing-connection-line", {
    from: "fade-in",
    delay: 420,
    duration: 800,
    threshold: 0.15,
    once: true,
  });

  animate("financing-steps", {
    from: "fade-up",
    delay: 250,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  // Step 1 animations
  animate("financing-step-1", {
    from: "fade-up",
    delay: 280,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("financing-step-1-icon", {
    from: "zoom-in",
    delay: 210,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("financing-step-1-card", {
    from: "fade-up",
    delay: 240,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("financing-step-1-title", {
    from: "fade-in",
    delay: 270,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("financing-step-1-description", {
    from: "fade-in",
    delay: 200,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  // Step 2 animations
  animate("financing-step-2", {
    from: "fade-up",
    delay: 210,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("financing-step-2-icon", {
    from: "zoom-in",
    delay: 240,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("financing-step-2-card", {
    from: "fade-up",
    delay: 270,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("financing-step-2-title", {
    from: "fade-in",
    delay: 200,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("financing-step-2-description", {
    from: "fade-in",
    delay: 230,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  // Step 3 animations
  animate("financing-step-3", {
    from: "fade-up",
    delay: 240,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("financing-step-3-icon", {
    from: "zoom-in",
    delay: 270,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("financing-step-3-card", {
    from: "fade-up",
    delay: 200,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("financing-step-3-title", {
    from: "fade-in",
    delay: 230,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("financing-step-3-description", {
    from: "fade-in",
    delay: 260,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  FEATURED WORKS SECTION ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  
  animate("featured-works-section", {
    from: "fade-up",
    delay: 0,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("featured-works-gradient", {
    from: "fade-in",
    delay: 50,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("featured-works-header", {
    from: "fade-up",
    delay: 100,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("featured-works-label", {
    from: "fade-in",
    delay: 150,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("featured-works-title", {
    from: "fade-up",
    delay: 200,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("featured-works-description", {
    from: "fade-in",
    delay: 250,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("featured-works-grid", {
    from: "fade-up",
    delay: 300,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  // Individual featured works with staggered delays
  animate("featured-work-1", {
    from: "zoom-in",
    delay: 350,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("featured-work-2", {
    from: "zoom-in",
    delay: 400,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("featured-work-3", {
    from: "zoom-in",
    delay: 450,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("featured-work-4", {
    from: "zoom-in",
    delay: 500,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("featured-work-5", {
    from: "zoom-in",
    delay: 550,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("featured-work-6", {
    from: "zoom-in",
    delay: 600,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("featured-works-cta", {
    from: "zoom-in",
    delay: 650,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  TESTIMONIALS SECTION ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  
  animate("testimonials-section", {
    from: "fade-up",
    delay: 0,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("testimonials-header", {
    from: "fade-up",
    delay: 100,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("testimonials-label", {
    from: "fade-in",
    delay: 150,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("testimonials-title", {
    from: "fade-up",
    delay: 200,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("testimonials-description", {
    from: "fade-in",
    delay: 250,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("testimonials-carousel", {
    from: "fade-up",
    delay: 300,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("testimonials-blur-left", {
    from: "fade-in",
    delay: 350,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("testimonials-blur-right", {
    from: "fade-in",
    delay: 350,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("testimonials-row-1", {
    from: "fade-left",
    delay: 400,
    duration: 700,
    distance: 100,
    threshold: 0.15,
    once: true,
  });

  animate("testimonials-track-1", {
    from: "fade-in",
    delay: 450,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("testimonials-row-2", {
    from: "fade-right",
    delay: 500,
    duration: 700,
    distance: 100,
    threshold: 0.15,
    once: true,
  });

  animate("testimonials-track-2", {
    from: "fade-in",
    delay: 550,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  CALL TO ACTION SECTION ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  
  animate("cta-section", {
    from: "fade-up",
    delay: 0,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("cta-gradient-overlay", {
    from: "fade-in",
    delay: 50,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("cta-top-gradient", {
    from: "fade-in",
    delay: 50,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("cta-top-gradient-alt", {
    from: "fade-in",
    delay: 50,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("cta-card", {
    from: "zoom-in",
    delay: 100,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("cta-content", {
    from: "fade-up",
    delay: 150,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  // Left content animations
  animate("cta-left-content", {
    from: "fade-left",
    delay: 200,
    duration: 600,
    distance: 50,
    threshold: 0.15,
    once: true,
  });

  animate("cta-label", {
    from: "fade-in",
    delay: 250,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("cta-title", {
    from: "fade-up",
    delay: 300,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("cta-button", {
    from: "zoom-in",
    delay: 350,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  // Phone section animations
  animate("cta-phone-section", {
    from: "zoom-in",
    delay: 200,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("cta-phone-label", {
    from: "fade-in",
    delay: 250,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("cta-phone-number", {
    from: "zoom-in",
    delay: 300,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("cta-emergency-text", {
    from: "fade-in",
    delay: 350,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  // Features animations
  animate("cta-features", {
    from: "fade-right",
    delay: 200,
    duration: 600,
    distance: 50,
    threshold: 0.15,
    once: true,
  });

  animate("cta-feature-1", {
    from: "fade-right",
    delay: 250,
    duration: 500,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  animate("cta-feature-2", {
    from: "fade-right",
    delay: 300,
    duration: 500,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  animate("cta-feature-3", {
    from: "fade-right",
    delay: 350,
    duration: 500,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  SERVICE AREAS SECTION ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  
  animate("service-areas-header", {
    from: "fade-up",
    delay: 0,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("service-areas-label", {
    from: "fade-in",
    delay: 100,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("service-areas-title", {
    from: "fade-up",
    delay: 150,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("service-areas-description", {
    from: "fade-in",
    delay: 200,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("service-areas-tags", {
    from: "fade-up",
    delay: 250,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  // First row of service area tags
  animate("service-areas-row-1", {
    from: "fade-up",
    delay: 300,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  // Individual tags in first row with staggered delays
  animate("service-area-tag-1", {
    from: "zoom-in",
    delay: 350,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-2", {
    from: "zoom-in",
    delay: 375,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-3", {
    from: "zoom-in",
    delay: 400,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-4", {
    from: "zoom-in",
    delay: 425,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-5", {
    from: "zoom-in",
    delay: 450,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-6", {
    from: "zoom-in",
    delay: 475,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-7", {
    from: "zoom-in",
    delay: 500,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  // Second row of service area tags
  animate("service-areas-row-2", {
    from: "fade-up",
    delay: 400,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  // Individual tags in second row
  animate("service-area-tag-8", {
    from: "zoom-in",
    delay: 450,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-9", {
    from: "zoom-in",
    delay: 475,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-10", {
    from: "zoom-in",
    delay: 500,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-11", {
    from: "zoom-in",
    delay: 525,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-12", {
    from: "zoom-in",
    delay: 550,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-13", {
    from: "zoom-in",
    delay: 575,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-14", {
    from: "zoom-in",
    delay: 600,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  // Third row of service area tags
  animate("service-areas-row-3", {
    from: "fade-up",
    delay: 500,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  // Individual tags in third row
  animate("service-area-tag-15", {
    from: "zoom-in",
    delay: 550,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-16", {
    from: "zoom-in",
    delay: 575,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-17", {
    from: "zoom-in",
    delay: 600,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-18", {
    from: "zoom-in",
    delay: 625,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-19", {
    from: "zoom-in",
    delay: 650,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-tag-20", {
    from: "zoom-in",
    delay: 675,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  // Interactive map
  animate("service-areas-map", {
    from: "zoom-in",
    delay: 700,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  HERO2 SECTION ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  
  animate("hero2-section", {
    from: "fade-in",
    delay: 0,
    duration: 800,
    threshold: 0.1,
    once: true,
  });

  animate("hero2-background", {
    from: "zoom-out",
    delay: 0,
    duration: 1000,
    threshold: 0.1,
    once: true,
  });

  animate("hero2-overlay", {
    from: "fade-in",
    delay: 200,
    duration: 600,
    threshold: 0.1,
    once: true,
  });

  animate("hero2-gradient", {
    from: "fade-in",
    delay: 300,
    duration: 600,
    threshold: 0.1,
    once: true,
  });

  animate("hero2-headline", {
    from: "fade-in",
    delay: 200,
    duration: 800,
    threshold: 0.1,
    once: true,
  });

  // Hero2 headline lines with staggered delays
  animate("hero2-line1", {
    from: "fade-left",
    delay: 300,
    duration: 800,
    distance: 60,
    threshold: 0.1,
    once: true,
  });

  animate("hero2-line2", {
    from: "fade-left",
    delay: 400,
    duration: 800,
    distance: 60,
    threshold: 0.1,
    once: true,
  });

  animate("hero2-line3", {
    from: "fade-left",
    delay: 300,
    duration: 800,
    distance: 60,
    threshold: 0.1,
    once: true,
  });

  // Hero2 content animations
  animate("hero2-content", {
    from: "fade-right",
    delay: 400,
    duration: 800,
    distance: 80,
    threshold: 0.1,
    once: true,
  });

  animate("hero2-description", {
    from: "fade-in",
    delay: 400,
    duration: 700,
    threshold: 0.1,
    once: true,
  });

  animate("hero2-actions", {
    from: "zoom-in",
    delay: 400,
    duration: 600,
    threshold: 0.1,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  COMMERCIAL SERVICES SECTION ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  
  animate("commercial-services-section", {
    from: "fade-up",
    delay: 0,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-services-gradient", {
    from: "fade-in",
    delay: 50,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-services-grid", {
    from: "fade-up",
    delay: 100,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  // Left side - Image animations
  animate("commercial-services-image-container", {
    from: "fade-left",
    delay: 150,
    duration: 700,
    distance: 60,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-services-image", {
    from: "zoom-out",
    delay: 200,
    duration: 800,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-services-badge", {
    from: "zoom-in",
    delay: 300,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  // Right side - Content animations
  animate("commercial-services-content", {
    from: "fade-right",
    delay: 150,
    duration: 700,
    distance: 60,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-services-header", {
    from: "fade-up",
    delay: 200,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-services-tag", {
    from: "fade-in",
    delay: 250,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-services-title", {
    from: "fade-up",
    delay: 300,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-services-description", {
    from: "fade-in",
    delay: 350,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-services-features", {
    from: "fade-up",
    delay: 300,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  // Individual features with staggered delays
  animate("commercial-feature-1", {
    from: "fade-right",
    delay: 350,
    duration: 500,
    distance: 40,
    threshold: 0.1,
    once: true,
  });

  animate("commercial-feature-2", {
    from: "fade-right",
    delay: 300,
    duration: 500,
    distance: 40,
    threshold: 0.1,
    once: true,
  });

  animate("commercial-feature-3", {
    from: "fade-right",
    delay: 350,
    duration: 500,
    distance: 40,
    threshold: 0.1,
    once: true,
  });

  animate("commercial-feature-4", {
    from: "fade-right",
    delay: 300,
    duration: 500,
    distance: 40,
    threshold: 0.1,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  PROCESS TIMELINE SECTION ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  
  animate("process-timeline-section", {
    from: "fade-up",
    delay: 0,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("process-timeline-bg-image", {
    from: "zoom-out",
    delay: 0,
    duration: 1000,
    threshold: 0.15,
    once: true,
  });

  animate("process-timeline-header", {
    from: "fade-up",
    delay: 100,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("process-timeline-tag", {
    from: "fade-in",
    delay: 150,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("process-timeline-title", {
    from: "fade-up",
    delay: 200,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("process-timeline-description", {
    from: "fade-in",
    delay: 250,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("process-timeline-steps", {
    from: "fade-up",
    delay: 300,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  // Step 1 animations
  animate("process-step-1", {
    from: "fade-up",
    delay: 350,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("process-number-1", {
    from: "zoom-in",
    delay: 300,
    duration: 500,
    threshold: 0.1,
    once: true,
  });

  animate("process-icon-1", {
    from: "zoom-in",
    delay: 350,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("process-step-title-1", {
    from: "fade-up",
    delay: 300,
    duration: 500,
    threshold: 0.1,
    once: true,
  });

  animate("process-step-description-1", {
    from: "fade-in",
    delay: 350,
    duration: 500,
    threshold: 0.1,
    once: true,
  });

  // Step 2 animations
  animate("process-step-2", {
    from: "fade-up",
    delay: 300,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("process-number-2", {
    from: "zoom-in",
    delay: 350,
    duration: 500,
    threshold: 0.1,
    once: true,
  });

  animate("process-icon-2", {
    from: "zoom-in",
    delay: 300,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("process-step-title-2", {
    from: "fade-up",
    delay: 350,
    duration: 500,
    threshold: 0.1,
    once: true,
  });

  animate("process-step-description-2", {
    from: "fade-in",
    delay: 300,
    duration: 500,
    threshold: 0.1,
    once: true,
  });

  // Step 3 animations
  animate("process-step-3", {
    from: "fade-up",
    delay: 350,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("process-number-3", {
    from: "zoom-in",
    delay: 300,
    duration: 500,
    threshold: 0.1,
    once: true,
  });

  animate("process-icon-3", {
    from: "zoom-in",
    delay: 350,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("process-step-title-3", {
    from: "fade-up",
    delay: 300,
    duration: 500,
    threshold: 0.1,
    once: true,
  });

  animate("process-step-description-3", {
    from: "fade-in",
    delay: 350,
    duration: 500,
    threshold: 0.1,
    once: true,
  });

  // Step 4 animations
  animate("process-step-4", {
    from: "fade-up",
    delay: 300,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("process-number-4", {
    from: "zoom-in",
    delay: 350,
    duration: 500,
    threshold: 0.1,
    once: true,
  });

  animate("process-icon-4", {
    from: "zoom-in",
    delay: 300,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("process-step-title-4", {
    from: "fade-up",
    delay: 350,
    duration: 500,
    threshold: 0.1,
    once: true,
  });

  animate("process-step-description-4", {
    from: "fade-in",
    delay: 300,
    duration: 500,
    threshold: 0.1,
    once: true,
  });

  // Connecting lines
  animate("process-line-1", {
    from: "fade-in",
    delay: 300,
    duration: 800,
    threshold: 0.15,
    once: true,
  });

  animate("process-line-2", {
    from: "fade-in",
    delay: 350,
    duration: 800,
    threshold: 0.15,
    once: true,
  });

  animate("process-line-3", {
    from: "fade-in",
    delay: 300,
    duration: 800,
    threshold: 0.15,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  COMMERCIAL OFFERS SECTION ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  
  animate("commercial-offers-section", {
    from: "fade-up",
    delay: 0,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-offers-gradient", {
    from: "fade-in",
    delay: 50,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-offers-header", {
    from: "fade-up",
    delay: 100,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-offers-tag", {
    from: "fade-in",
    delay: 150,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-offers-title", {
    from: "fade-up",
    delay: 200,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-offers-description", {
    from: "fade-in",
    delay: 250,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-offers-grid", {
    from: "fade-up",
    delay: 300,
    duration: 700,
    threshold: 0.15,
    once: true,
  });

  // Individual offer cards with staggered delays
  animate("commercial-offer-1", {
    from: "zoom-in",
    delay: 350,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-offer-2", {
    from: "zoom-in",
    delay: 450,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  animate("commercial-offer-3", {
    from: "zoom-in",
    delay: 550,
    duration: 600,
    threshold: 0.15,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  FAQ SECTION ANIMATIONS (FAST TIMING)
  // ═══════════════════════════════════════════════════════════════
  
  animate("faq-section", {
    from: "fade-up",
    delay: 0,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("faq-top-gradient", {
    from: "fade-in",
    delay: 30,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("faq-bottom-gradient", {
    from: "fade-in",
    delay: 30,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("faq-header", {
    from: "fade-up",
    delay: 60,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("faq-label", {
    from: "fade-in",
    delay: 90,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("faq-title", {
    from: "fade-up",
    delay: 120,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("faq-description", {
    from: "fade-in",
    delay: 150,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("faq-items", {
    from: "fade-up",
    delay: 180,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  // Individual FAQ items with fast staggered delays
  animate("faq-item-1", {
    from: "fade-up",
    delay: 210,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("faq-item-2", {
    from: "fade-up",
    delay: 240,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("faq-item-3", {
    from: "fade-up",
    delay: 270,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("faq-item-4", {
    from: "fade-up",
    delay: 300,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("faq-item-5", {
    from: "fade-up",
    delay: 330,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("faq-item-6", {
    from: "fade-up",
    delay: 360,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  SERVICE COVERAGE SECTION ANIMATIONS (FAST TIMING)
  // ═══════════════════════════════════════════════════════════════
  
  animate("service-coverage-section", {
    from: "fade-up",
    delay: 0,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("service-coverage-bg-image", {
    from: "zoom-out",
    delay: 0,
    duration: 800,
    threshold: 0.15,
    once: true,
  });

  animate("service-coverage-overlay", {
    from: "fade-in",
    delay: 30,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("service-coverage-grid", {
    from: "fade-up",
    delay: 60,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  // Left side - Map animations
  animate("service-coverage-map-container", {
    from: "fade-left",
    delay: 90,
    duration: 500,
    distance: 50,
    threshold: 0.15,
    once: true,
  });

  animate("service-coverage-map-wrapper", {
    from: "zoom-in",
    delay: 120,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("service-coverage-map", {
    from: "fade-in",
    delay: 150,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("service-coverage-areas", {
    from: "fade-up",
    delay: 180,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("service-coverage-areas-title", {
    from: "fade-in",
    delay: 210,
    duration: 300,
    threshold: 0.15,
    once: true,
  });

  animate("service-coverage-areas-grid", {
    from: "fade-up",
    delay: 240,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  // Individual service area items with fast staggered delays
  animate("service-area-item-1", {
    from: "fade-left",
    delay: 270,
    duration: 300,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-item-2", {
    from: "fade-left",
    delay: 285,
    duration: 300,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-item-3", {
    from: "fade-left",
    delay: 300,
    duration: 300,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-item-4", {
    from: "fade-left",
    delay: 315,
    duration: 300,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-item-5", {
    from: "fade-left",
    delay: 330,
    duration: 300,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("service-area-item-6", {
    from: "fade-left",
    delay: 345,
    duration: 300,
    distance: 20,
    threshold: 0.1,
    once: true,
  });

  animate("service-coverage-radius", {
    from: "zoom-in",
    delay: 360,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  // Right side - Content animations
  animate("service-coverage-content", {
    from: "fade-right",
    delay: 90,
    duration: 500,
    distance: 50,
    threshold: 0.15,
    once: true,
  });

  animate("service-coverage-header", {
    from: "fade-up",
    delay: 120,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("service-coverage-label", {
    from: "fade-in",
    delay: 150,
    duration: 300,
    threshold: 0.15,
    once: true,
  });

  animate("service-coverage-title", {
    from: "fade-up",
    delay: 180,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("service-coverage-description", {
    from: "fade-in",
    delay: 210,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("service-coverage-highlights", {
    from: "fade-up",
    delay: 240,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  // Individual highlights with fast staggered delays
  animate("service-coverage-highlight-1", {
    from: "fade-right",
    delay: 270,
    duration: 400,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  animate("service-coverage-highlight-2", {
    from: "fade-right",
    delay: 300,
    duration: 400,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  animate("service-coverage-highlight-3", {
    from: "fade-right",
    delay: 330,
    duration: 400,
    distance: 30,
    threshold: 0.1,
    once: true,
  });

  // ═══════════════════════════════════════════════════════════════
  //  SERVICES LIST SECTION ANIMATIONS (FAST TIMING)
  // ═══════════════════════════════════════════════════════════════
  
  animate("services-list-section", {
    from: "fade-up",
    delay: 0,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("services-list-header", {
    from: "fade-up",
    delay: 60,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("services-list-label", {
    from: "fade-in",
    delay: 90,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("services-list-title", {
    from: "fade-up",
    delay: 120,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  animate("services-list-description", {
    from: "fade-in",
    delay: 150,
    duration: 400,
    threshold: 0.15,
    once: true,
  });

  animate("services-list-grid", {
    from: "fade-up",
    delay: 180,
    duration: 500,
    threshold: 0.15,
    once: true,
  });

  // Individual service cards with fast staggered delays
  animate("services-list-card-1", {
    from: "zoom-in",
    delay: 210,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("services-list-card-2", {
    from: "zoom-in",
    delay: 240,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("services-list-card-3", {
    from: "zoom-in",
    delay: 270,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("services-list-card-4", {
    from: "zoom-in",
    delay: 200,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("services-list-card-5", {
    from: "zoom-in",
    delay: 230,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("services-list-card-6", {
    from: "zoom-in",
    delay: 260,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("services-list-card-7", {
    from: "zoom-in",
    delay: 290,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("services-list-card-8", {
    from: "zoom-in",
    delay: 220,
    duration: 400,
    threshold: 0.1,
    once: true,
  });

  animate("services-list-card-9", {
    from: "zoom-in",
    delay: 250,
    duration: 400,
    threshold: 0.1,
    once: true,
  });
});