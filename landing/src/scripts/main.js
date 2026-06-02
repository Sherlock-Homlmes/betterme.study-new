const canvas = document.getElementById("canvas-particles");
const ctx = canvas.getContext("2d");
let particles = [];

function initCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  particles = [];
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.1,
      speedY: -Math.random() * 0.2 - 0.1,
      alpha: Math.random(),
    });
  }
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(24, 24, 27, ${p.alpha * 0.15})`;
    ctx.fill();
    p.x += p.speedX;
    p.y += p.speedY;
    if (p.y < 0) {
      p.y = canvas.height;
      p.x = Math.random() * canvas.width;
    }
  });
  requestAnimationFrame(drawParticles);
}

window.addEventListener("resize", initCanvas);
initCanvas();
drawParticles();

const cursor = document.getElementById("custom-cursor");
document.addEventListener("mousemove", (e) => {
  cursor.style.left = e.clientX + "px";
  cursor.style.top = e.clientY + "px";
});

function animateCounter(el, target) {
  let start = 0;
  const timer = setInterval(() => {
    start += Math.ceil(target / 100);
    if (start >= target) {
      el.innerText =
        target.toLocaleString() +
        (target === 18500 || target === 777 ? "+" : "");
      clearInterval(timer);
    } else {
      el.innerText = start.toLocaleString();
    }
  }, 15);
}

function animateStable(el) {
  let num = 0,
    den = 0;
  const targetNum = 24,
    targetDen = 7;
  const duration = 2000;
  const steps = Math.round(duration / 15);

  let step = 0;
  const timer = setInterval(() => {
    step++;
    const progress = Math.min(step / steps, 1);
    num = Math.round(progress * targetNum);
    den = Math.round(progress * targetDen);
    el.innerText = `${num}/${den}`;
    if (progress >= 1) {
      el.innerText = "24/7";
      clearInterval(timer);
    }
  }, 15);
}

const statsObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const numEl = entry.target.querySelector(".stat-num");
        const numStableEl =
          entry.target.querySelector(".stat-num-stable");

        if (numEl) {
          const target = parseInt(numEl.getAttribute("data-target"));
          numEl.style.minWidth = numEl.offsetWidth + "px";
          animateCounter(numEl, target);
        }

        if (numStableEl) {
          numStableEl.style.minWidth = numStableEl.offsetWidth + "px";
          animateStable(numStableEl);
        }

        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

document
  .querySelectorAll(".stat-item")
  .forEach((item) => statsObserver.observe(item));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
      }
    });
  },
  { threshold: 0.1 }
);

document
  .querySelectorAll(".reveal")
  .forEach((el) => revealObserver.observe(el));

const cinderAnims = {
  idle: { row: 0, frames: 6, speed: 180 },
  "run-right": { row: 1, frames: 8, speed: 100 },
  "run-left": { row: 2, frames: 8, speed: 100 },
  wave: { row: 3, frames: 4, speed: 150, next: "idle" },
  jump: { row: 4, frames: 5, speed: 120, next: "idle" },
};

const activeCompanions = [];

class BoundedPet {
  constructor(id, filename, scale, parentSelector, initialPosFn) {
    this.id = id;
    this.filename = filename;
    this.scale = scale;
    this.parent = document.querySelector(parentSelector);
    this.initialPosFn = initialPosFn;

    this.currentAnimName = "";
    this.currentFrame = 0;
    this.interval = null;
    this.blockScroll = false;

    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.x = 0;
    this.y = 0;
    this.lastX = 0;
    this.isClick = false;

    this.createElement();
    this.initPosition();
    this.setAnimation("idle");
    this.initEvents();
  }

  createElement() {
    this.container = document.createElement("div");
    this.container.className = "desktop-pet-container";
    this.container.style.position = "absolute";
    this.container.style.transform = `scale(${this.scale})`;

    this.sprite = document.createElement("div");
    this.sprite.className = "desktop-pet-sprite";
    this.sprite.style.backgroundImage = `url('${this.filename}')`;

    this.container.appendChild(this.sprite);
    this.parent.appendChild(this.container);
  }

  initPosition() {
    const pos = this.initialPosFn(this.parent, this.container);
    this.x = pos.x;
    this.y = pos.y;
    this.lastX = this.x;
    this.container.style.left = `${this.x}px`;
    this.container.style.top = `${this.y}px`;
  }

  setAnimation(animName) {
    if (this.currentAnimName === animName) return;
    this.currentAnimName = animName;
    this.currentFrame = 0;
    clearInterval(this.interval);

    const cfg = cinderAnims[animName];

    const update = () => {
      const posX = -(this.currentFrame * 192);
      const posY = -(cfg.row * 208);
      this.sprite.style.backgroundPosition = `${posX}px ${posY}px`;

      this.currentFrame++;
      if (this.currentFrame >= cfg.frames) {
        if (cfg.next) {
          this.blockScroll = false;
          this.setAnimation(cfg.next);
        } else {
          this.currentFrame = 0;
        }
      }
    };
    update();
    this.interval = setInterval(update, cfg.speed);
  }

  initEvents() {
    this.container.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      this.isDragging = true;
      this.isClick = true;

      const rect = this.parent.getBoundingClientRect();
      this.startX = e.clientX - rect.left - this.x;
      this.startY = e.clientY - rect.top - this.y;
      this.lastX = e.clientX;

      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      this.isClick = false;

      const rect = this.parent.getBoundingClientRect();
      const nextX = e.clientX - rect.left - this.startX;
      const nextY = e.clientY - rect.top - this.startY;

      const deltaX = e.clientX - this.lastX;
      if (Math.abs(deltaX) > 1.5) {
        if (deltaX > 0) {
          this.setAnimation("run-right");
        } else {
          this.setAnimation("run-left");
        }
      } else {
        this.setAnimation("jump");
      }

      this.x = nextX;
      this.y = nextY;
      this.lastX = e.clientX;

      const maxW = this.parent.offsetWidth - 140;
      const maxH = this.parent.offsetHeight - 170;
      this.x = Math.max(-50, Math.min(maxW, this.x));
      this.y = Math.max(0, Math.min(maxH, this.y));

      this.container.style.left = `${this.x}px`;
      this.container.style.top = `${this.y}px`;
    });

    document.addEventListener("mouseup", () => {
      if (!this.isDragging) return;
      this.isDragging = false;

      if (this.isClick) {
        this.blockScroll = true;
        this.setAnimation("wave");
      } else {
        this.setAnimation("idle");
      }
    });

    this.container.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      this.blockScroll = true;
      this.setAnimation("jump");
    });
  }

  handleScroll(direction) {
    if (this.isDragging || this.blockScroll) return;
    if (direction === "down") {
      this.setAnimation("run-right");
    } else if (direction === "up") {
      this.setAnimation("run-left");
    }
  }

  stopScroll() {
    if (this.isDragging || this.blockScroll) return;
    this.setAnimation("idle");
  }

  handleResize() {
    const maxW = this.parent.offsetWidth - 140;
    const maxH = this.parent.offsetHeight - 170;
    this.x = Math.max(-50, Math.min(maxW, this.x));
    this.y = Math.max(0, Math.min(maxH, this.y));
    this.container.style.left = `${this.x}px`;
    this.container.style.top = `${this.y}px`;
  }
}

class FloatingPet {
  constructor(id, filename, scale) {
    this.id = id;
    this.filename = filename;
    this.scale = scale;
    this.currentAnimName = "";
    this.currentFrame = 0;
    this.interval = null;
    this.blockScroll = false;

    this.x = window.innerWidth - 170;
    this.y = window.innerHeight - 215;

    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.lastX = this.x;
    this.isClick = false;

    this.createElement();
    this.setAnimation("idle");
    this.initEvents();
  }

  createElement() {
    this.container = document.createElement("div");
    this.container.className = "desktop-pet-container";
    this.container.style.position = "fixed";
    this.container.style.left = `${this.x}px`;
    this.container.style.top = `${this.y}px`;
    this.container.style.transform = `scale(${this.scale})`;

    this.sprite = document.createElement("div");
    this.sprite.className = "desktop-pet-sprite";
    this.sprite.style.backgroundImage = `url('${this.filename}')`;

    this.container.appendChild(this.sprite);
    document.body.appendChild(this.container);
  }

  setAnimation(animName) {
    if (this.currentAnimName === animName) return;
    this.currentAnimName = animName;
    this.currentFrame = 0;
    clearInterval(this.interval);

    const cfg = cinderAnims[animName];
    const update = () => {
      const posX = -(this.currentFrame * 192);
      const posY = -(cfg.row * 208);
      this.sprite.style.backgroundPosition = `${posX}px ${posY}px`;

      this.currentFrame++;
      if (this.currentFrame >= cfg.frames) {
        if (cfg.next) {
          this.blockScroll = false;
          this.setAnimation(cfg.next);
        } else {
          this.currentFrame = 0;
        }
      }
    };
    update();
    this.interval = setInterval(update, cfg.speed);
  }

  initEvents() {
    this.container.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      this.isDragging = true;
      this.isClick = true;

      this.startX = e.clientX - this.x;
      this.startY = e.clientY - this.y;
      this.lastX = e.clientX;

      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      this.isClick = false;

      const nextX = e.clientX - this.startX;
      const nextY = e.clientY - this.startY;

      const deltaX = e.clientX - this.lastX;
      if (Math.abs(deltaX) > 1.5) {
        if (deltaX > 0) {
          this.setAnimation("run-right");
        } else {
          this.setAnimation("run-left");
        }
      } else {
        this.setAnimation("jump");
      }

      this.x = nextX;
      this.y = nextY;
      this.lastX = e.clientX;

      this.x = Math.max(-50, Math.min(window.innerWidth - 140, this.x));
      this.y = Math.max(-50, Math.min(window.innerHeight - 150, this.y));

      this.container.style.left = `${this.x}px`;
      this.container.style.top = `${this.y}px`;
    });

    document.addEventListener("mouseup", () => {
      if (!this.isDragging) return;
      this.isDragging = false;

      if (this.isClick) {
        this.blockScroll = true;
        this.setAnimation("wave");
      } else {
        this.setAnimation("idle");
      }
    });

    this.container.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      this.blockScroll = true;
      this.setAnimation("jump");
    });
  }

  handleScroll(direction) {
    if (this.isDragging || this.blockScroll) return;
    if (direction === "down") {
      this.setAnimation("run-right");
    } else if (direction === "up") {
      this.setAnimation("run-left");
    }
  }

  stopScroll() {
    if (this.isDragging || this.blockScroll) return;
    this.setAnimation("idle");
  }

  handleResize() {
    this.x = Math.max(-50, Math.min(window.innerWidth - 140, this.x));
    this.y = Math.max(-50, Math.min(window.innerHeight - 150, this.y));
    this.container.style.left = `${this.x}px`;
    this.container.style.top = `${this.y}px`;
  }
}

function initMobileCinder() {
  const el = document.querySelector(".cinder-mobile-sprite");
  if (!el) return;

  let currentAnim = "";
  let currentFrame = 0;
  let interval = null;

  function setAnimation(animName) {
    if (currentAnim === animName) return;
    currentAnim = animName;
    currentFrame = 0;
    clearInterval(interval);
    const cfg = cinderAnims[animName];

    const update = () => {
      const posX = -(currentFrame * 192);
      const posY = -(cfg.row * 208);
      el.style.backgroundPosition = `${posX}px ${posY}px`;
      currentFrame++;
      if (currentFrame >= cfg.frames) {
        if (cfg.next) {
          setAnimation(cfg.next);
        } else {
          currentFrame = 0;
        }
      }
    };
    update();
    interval = setInterval(update, cfg.speed);
  }

  setAnimation("idle");

  el.addEventListener("click", () => {
    setAnimation("wave");
  });

  el.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    setAnimation("jump");
  });
}

function initPets() {
  if (window.innerWidth <= 968) {
    initMobileCinder();
  } else {
    const cinderPet = new BoundedPet(
      "cinder",
      "/cinder.webp",
      0.6,
      ".hero",
      (parent, container) => {
        const heading = parent.querySelector("h1");
        const rect = heading.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        return {
          x: rect.left - parentRect.left - 150,
          y: rect.top - parentRect.top - 30,
        };
      }
    );
    activeCompanions.push(cinderPet);
  }

  if (window.innerWidth > 968) {
    const bunnyPet = new BoundedPet(
      "bunny",
      "/bunny.webp",
      0.6,
      ".about-section",
      (parent, container) => {
        const heading = parent.querySelector("h2");
        const rect = heading.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        return {
          x: rect.left - parentRect.left - 170,
          y: rect.top - parentRect.top - 60,
        };
      }
    );
    activeCompanions.push(bunnyPet);

    const capyPet = new BoundedPet(
      "capybara",
      "/capybara.png",
      0.6,
      ".pomo-section",
      (parent, container) => {
        const heading = parent.querySelector("h2");
        const rect = heading.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        return {
          x: rect.right - parentRect.left - 30,
          y: rect.top - parentRect.top - 50,
        };
      }
    );
    activeCompanions.push(capyPet);
  }

  const pigPet = new BoundedPet(
    "freddy",
    "/freddy.webp",
    0.65,
    ".footer",
    (parent, container) => {
      return {
        x: parent.offsetWidth / 2 - 96,
        y: 40,
      };
    }
  );
  activeCompanions.push(pigPet);
}

let lastScrollTop = window.scrollY;
let scrollStopTimer = null;

window.addEventListener("scroll", () => {
  const st = window.scrollY;
  const direction = st > lastScrollTop ? "down" : "up";
  lastScrollTop = st;

  activeCompanions.forEach((pet) => pet.handleScroll(direction));

  clearTimeout(scrollStopTimer);
  scrollStopTimer = setTimeout(() => {
    activeCompanions.forEach((pet) => pet.stopScroll());
  }, 180);
});

window.addEventListener("resize", () => {
  activeCompanions.forEach((pet) => pet.handleResize());
});

window.addEventListener("load", () => {
  initPets();
  if (window.innerWidth > 968) {
    const hajimiPet = new FloatingPet("hajimi", "/hajimi.webp", 0.6);
    activeCompanions.push(hajimiPet);
  }
});
