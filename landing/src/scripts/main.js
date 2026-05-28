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
          animateCounter(numEl, target);
        }

        if (numStableEl) {
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

function initPets() {
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

  const hajimiPet = new FloatingPet("hajimi", "/hajimi.webp", 0.6);
  activeCompanions.push(hajimiPet);
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

async function loadDiscordWidget() {
  const container = document.getElementById("discord-widget-container");
  const fallbackIframe = `
          <div style="display: flex; justify-content: center; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(24, 24, 27, 0.05);">
              <iframe src="https://discord.com/widget?id=880360143768924210&theme=light" width="100%" height="500" allowtransparency="true" frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>
          </div>
      `;

  try {
    const response = await fetch(
      "https://discord.com/api/guilds/880360143768924210/widget.json"
    );
    if (!response.ok) throw new Error("API request failed");
    const data = await response.json();

    let html = `
            <div class="discord-mockup">
                <div class="discord-header">
                    <div class="discord-title">
                        <span class="pulse-dot"></span>
                        <strong style="color: #18181b; font-size: 1.1rem;">${data.name}</strong>
                        <span class="discord-badge" style="margin-left: 6px;">PARTNER</span>
                    </div>
                    <span style="color: #10b981; font-weight: bold; font-size: 0.9rem;">${data.presence_count.toLocaleString()} Online</span>
                </div>

                <div class="voice-channels" style="max-height: 250px; overflow-y: auto; padding-right: 5px; margin-bottom: 20px;">
                    <div class="channel-title" style="font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; margin-bottom: 12px;">📚 Kênh Học Tập Hoạt Động</div>
        `;

    let channelCount = 0;
    if (data.channels && data.channels.length > 0) {
      data.channels.forEach((chan) => {
        const activeMembers = data.members
          ? data.members.filter((m) => m.channel_id === chan.id)
          : [];

        if (activeMembers.length > 0 || channelCount < 3) {
          channelCount++;
          html += `
                        <div class="voice-channel">
                            <div style="display: flex; justify-content: space-between; align-items: center; color: #18181b; font-size: 0.9rem; font-weight: 500;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span class="pulse-dot"></span>
                                    <span style="font-weight: 600;">🔊 ${chan.name}</span>
                                </div>
                                <span style="font-size: 0.8rem; color: #71717a;">${activeMembers.length} đang học</span>
                            </div>
                            ${
                              activeMembers.length > 0
                                ? `
                                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; padding-left: 16px;">
                                    ${activeMembers
                                      .slice(0, 5)
                                      .map(
                                        (m) => `
                                        <div style="display: flex; align-items: center; gap: 4px; background: #e4e4e7; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; color: #18181b; border: 1px solid #d4d4d8;">
                                            <img src="${m.avatar_url}" style="width: 14px; height: 14px; border-radius: 50%;" />
                                            <span style="font-weight: 500;">${m.username}</span>
                                        </div>
                                    `
                                      )
                                      .join("")}
                                    ${activeMembers.length > 5 ? `<span style="font-size: 0.75rem; color: #71717a; align-self: center; font-weight: 600;">+${activeMembers.length - 5}</span>` : ""}
                                </div>
                            `
                                : ""
                            }
                        </div>
                    `;
        }
      });
    }

    if (channelCount === 0) {
      html += `<div style="color: #71717a; font-size: 0.85rem; text-align: center; padding: 20px 0;">Hiện chưa có ai vào kênh thoại. Gia nhập ngay nhé!</div>`;
    }

    const inviteLink =
      data.instant_invite || "https://discord.gg/betterme";
    html += `
                    </div>
                    <a href="${inviteLink}" target="_blank" class="btn btn-purple interactive" style="width: 100%; justify-content: center;">
                        Gia Nhập Server Ngay
                    </a>
                </div>
            `;
    container.innerHTML = html;
  } catch (err) {
    console.warn(
      "API fetch thất bại, tự động chuyển đổi sang nhúng Iframe tiêu chuẩn:",
      err
    );
    container.innerHTML = fallbackIframe;
  }
}

window.addEventListener("load", () => {
  initPets();
  loadDiscordWidget();
});
