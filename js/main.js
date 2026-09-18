/**
 * ============================================
 * RENALDO.AI — SUPREME INTERACTIVE ENGINE
 * Premium Portfolio Experience
 * ============================================
 */

// ============================================
// SYSTEM LATTICE (3D Topographic Manifold & Vector Field Engine)
// Features a 3D Topographic Elevation Surface (Loss Function Manifold),
// Vector Field Flow Streams, Soft Gravitational Cursor Deformation,
// and Depth Fog Dissolve in an Ivory/Petrol Technical Environment.
// ============================================
class SystemLattice {
    constructor() {
        this.canvas = document.getElementById('neural-field');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.gridPoints = [];
        this.particles = [];
        this.width = 0;
        this.height = 0;
        this.scrollY = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;
        
        // 3D Perspective Camera Setup
        this.camRotX = 0.35; // Tilt camera for topographic elevation perspective
        this.camRotY = 0;
        this.targetCamRotX = 0.35;
        this.targetCamRotY = 0;
        this.isRunning = true;
        this.animationId = null;
        
        this.init();
    }

    pause() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }
    
    init() {
        this.resize();
        this.createTopographicGrid();
        this.createVectorParticles();
        
        window.addEventListener('resize', () => this.resize());
        let tickingScroll = false;
        window.addEventListener('scroll', () => {
             if (!tickingScroll) {
                 window.requestAnimationFrame(() => {
                     this.scrollY = window.scrollY;
                     tickingScroll = false;
                 });
                 tickingScroll = true;
             }
        });

        window.addEventListener('mousemove', (e) => {
             this.targetMouseX = e.clientX;
             this.targetMouseY = e.clientY;
             this.targetCamRotY = ((e.clientX - this.width / 2) / (this.width / 2)) * 0.16;
             this.targetCamRotX = 0.35 - ((e.clientY - this.height / 2) / (this.height / 2)) * 0.12;
        });

        window.addEventListener('themeChanged', () => {
             this.createVectorParticles();
        });

        this.animate();
    }
    
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.targetMouseX = this.width / 2;
        this.targetMouseY = this.height / 2;
        this.mouseX = this.width / 2;
        this.mouseY = this.height / 2;
        this.createTopographicGrid();
        this.createVectorParticles();
    }
    
    createTopographicGrid() {
        // High-Precision 3D Contour Wireframe Surface
        const cols = 36;
        const rows = 24;
        const spacingX = (this.width * 1.6) / cols;
        const spacingY = (this.height * 1.6) / rows;
        this.gridPoints = [];

        for (let r = 0; r <= rows; r++) {
            const rowPoints = [];
            for (let c = 0; c <= cols; c++) {
                rowPoints.push({
                    x3d: (c * spacingX) - (this.width * 0.8),
                    y3d: (r * spacingY) - (this.height * 0.8),
                    z3d: 0,
                    c: c,
                    r: r
                });
            }
            this.gridPoints.push(rowPoints);
        }
    }
    
    createVectorParticles() {
        // Vector Field Data Stream Particles (Non-Luminous Mathematical Stream)
        const count = Math.min(95, Math.floor(this.width / 14));
        this.particles = [];

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const colors = isDark ? [
            'rgba(78, 131, 144, ',   // Petrol (#4E8390)
            'rgba(134, 169, 155, ',  // Soft Sage (#86A99B)
            'rgba(24, 59, 78, '      // Navy (#183B4E)
        ] : [
            'rgba(24, 59, 78, ',     // Navy (#183B4E)
            'rgba(39, 106, 115, ',   // Petrol (#276A73)
            'rgba(111, 143, 130, '   // Muted Sage (#6F8F82)
        ];

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x3d: (Math.random() - 0.5) * this.width * 1.5,
                y3d: (Math.random() - 0.5) * this.height * 1.5,
                speed: Math.random() * 0.8 + 0.4,
                size: Math.random() * 1.3 + 0.7,
                colorPrefix: colors[Math.floor(Math.random() * colors.length)],
                baseAlpha: Math.random() * 0.35 + 0.25,
                life: Math.random() * 200 + 100
            });
        }
    }

    // Mathematical Manifold Height Function Z(x, y, t)
    getManifoldHeight(x3d, y3d, time) {
        const freq1 = 0.0020;
        const freq2 = 0.0018;
        const w1 = Math.sin(x3d * freq1 + time * 0.4) * Math.cos(y3d * freq1 + time * 0.3) * 45;
        const w2 = Math.cos(x3d * freq2 - y3d * freq2 + time * 0.25) * 28;
        return w1 + w2;
    }

    project3D(x3d, y3d, z3d, parallaxY) {
        const perspective = 950;
        const cameraDistance = 750;

        const cosY = Math.cos(this.camRotY);
        const sinY = Math.sin(this.camRotY);
        const cosX = Math.cos(this.camRotX);
        const sinX = Math.sin(this.camRotX);

        // Yaw Y
        let rx = x3d * cosY - z3d * sinY;
        let rz1 = x3d * sinY + z3d * cosY;

        // Pitch X
        let ry = y3d * cosX - rz1 * sinX;
        let rzFinal = y3d * sinX + rz1 * cosX + cameraDistance;

        const scale = perspective / Math.max(100, rzFinal);
        const screenX = (this.width / 2) + (rx * scale);
        const screenY = (this.height / 2) + ((ry + parallaxY) * scale);

        return { screenX, screenY, scale, rzFinal, rx, ry };
    }
    
    animate() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.width, this.height);
        const time = Date.now() * 0.001;
        const parallaxY = -this.scrollY * 0.10;

        // Smooth Apple Physical Damping Inertia (Ease 0.045)
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.045;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.045;

        // Convert mouse screen pos to 3D center offset
        const mouse3DX = (this.mouseX - this.width / 2) * 1.2;
        const mouse3DY = (this.mouseY - this.height / 2) * 1.2;

        // 1. Calculate & Project 3D Topographic Manifold Surface
        const projectedGrid = [];
        const rows = this.gridPoints.length;
        const cols = this.gridPoints[0].length;

        for (let r = 0; r < rows; r++) {
            const projRow = [];
            for (let c = 0; c < cols; c++) {
                const pt = this.gridPoints[r][c];

                // Procedural Loss Function Elevation
                let z = this.getManifoldHeight(pt.x3d, pt.y3d, time);

                // Localized Gravitational Mouse Perturbation (Soft Gaussian)
                const distToMouse = Math.hypot(pt.x3d - mouse3DX, pt.y3d - mouse3DY);
                const mousePerturb = Math.exp(-(distToMouse * distToMouse) / (2 * 180 * 180)) * -32;
                z += mousePerturb;

                const proj = this.project3D(pt.x3d, pt.y3d, z, parallaxY);
                projRow.push(proj);
            }
            projectedGrid.push(projRow);
        }

        // 2. Render Topographic Wireframe Contour Lines
        this.ctx.lineWidth = 0.70;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const p = projectedGrid[r][c];

                // Depth Fog Attenuation Dissolving into Light Background
                const depthFog = Math.max(0.01, Math.min(0.20, (1 - p.rzFinal / 1550) * 0.22));

                // Horizontal Contour Line
                if (c < cols - 1) {
                    const pr = projectedGrid[r][c + 1];
                    this.ctx.strokeStyle = `rgba(39, 106, 115, ${depthFog * 0.75})`;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.screenX, p.screenY);
                    this.ctx.lineTo(pr.screenX, pr.screenY);
                    this.ctx.stroke();
                }

                // Vertical Contour Line
                if (r < rows - 1) {
                    const pd = projectedGrid[r + 1][c];
                    this.ctx.strokeStyle = `rgba(24, 59, 78, ${depthFog * 0.65})`;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.screenX, p.screenY);
                    this.ctx.lineTo(pd.screenX, pd.screenY);
                    this.ctx.stroke();
                }
            }
        }

        // 3. Render Dynamic Vector Field Data Stream Particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            // Calculate gradient flow along manifold surface
            const hCenter = this.getManifoldHeight(p.x3d, p.y3d, time);
            const hRight  = this.getManifoldHeight(p.x3d + 10, p.y3d, time);
            const hDown   = this.getManifoldHeight(p.x3d, p.y3d + 10, time);

            const dx = (hRight - hCenter) * 0.05;
            const dy = (hDown - hCenter) * 0.05;

            // Stream velocity along contour orthogonal gradient
            p.x3d += (1.2 - dy) * p.speed;
            p.y3d += (0.4 + dx) * p.speed;

            if (p.x3d > this.width * 0.8) p.x3d = -this.width * 0.8;
            if (p.y3d > this.height * 0.8) p.y3d = -this.height * 0.8;

            const pZ = hCenter + 12; // Float slightly above surface
            const proj = this.project3D(p.x3d, p.y3d, pZ, parallaxY);

            const alpha = Math.max(0.05, Math.min(0.55, p.baseAlpha * (proj.scale * 0.85)));

            this.ctx.beginPath();
            this.ctx.fillStyle = p.colorPrefix + alpha + ')';
            this.ctx.arc(proj.screenX, proj.screenY, Math.max(0.5, p.size * proj.scale), 0, Math.PI * 2);
            this.ctx.fill();
        }

        if (this.isRunning) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }
}

// ============================================
// CURSOR GLOW
// ============================================
class CursorGlow {
    constructor() {
        this.glow = document.getElementById('cursor-glow');
        if (!this.glow) return;
        
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        
        this.init();
    }
    
    init() {
        document.addEventListener('mousemove', (e) => {
            this.targetX = e.clientX;
            this.targetY = e.clientY;
        });
        
        this.animate();
    }
    
    animate() {
        // Smooth follow
        this.x += (this.targetX - this.x) * 0.1;
        this.y += (this.targetY - this.y) * 0.1;
        
        this.glow.style.left = `${this.x}px`;
        this.glow.style.top = `${this.y}px`;
        
        requestAnimationFrame(() => this.animate());
    }
}

// ============================================
// SCROLL ANIMATIONS
// ============================================
class ScrollAnimations {
    constructor() {
        this.init();
    }
    
    init() {
        // Navigation scroll indicator
        // Navigation scroll indicator (Debounced)
        let scrollTicking = false;
        window.addEventListener('scroll', () => {
            if (!scrollTicking) {
                window.requestAnimationFrame(() => {
                    const scrolled = window.scrollY;
                    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                    const percent = (scrolled / maxScroll) * 100;
                    
                    const indicator = document.getElementById('scroll-indicator');
                    if (indicator) indicator.style.width = `${percent}%`;
                    
                    // Nav background
                    const nav = document.getElementById('nav-header');
                    if (nav) nav.classList.toggle('scrolled', scrolled > 50);
                    
                    scrollTicking = false;
                });
                scrollTicking = true;
            }
        });
        
        // Intersection Observer for reveals
        const revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );
        
        document.querySelectorAll('[data-reveal]').forEach(el => {
            revealObserver.observe(el);
        });
    }
}

// ============================================
// 3D REGRESSION & RESPONSE SURFACE LABORATORY
// Executive 3D OLS, Ridge & Polynomial Surface Engine
// Decoupled into js/regression-surface.js per architecture rules
// ============================================

// ============================================
// SCROLL PROGRESS INDICATOR (High-Precision Reading Bar Engine)
// ============================================
class ScrollProgressIndicator {
    constructor() {
        this.indicator = document.getElementById('scroll-indicator');
        if (!this.indicator) return;
        this.ticking = false;
        this.init();
    }

    init() {
        const update = () => {
            const docEl = document.documentElement;
            const maxScroll = docEl.scrollHeight - window.innerHeight;
            if (maxScroll <= 0) {
                this.indicator.style.width = '0%';
                return;
            }
            const progress = Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100));
            this.indicator.style.width = `${progress}%`;
        };

        window.addEventListener('scroll', () => {
            if (!this.ticking) {
                window.requestAnimationFrame(() => {
                    update();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        }, { passive: true });

        update();
    }
}

// ============================================
// UNIFIED SCROLL SPY & NAVIGATION CONTROLLER
// Synchronizes desktop & mobile navigation with aria-current
// ============================================
class ScrollSpyManager {
    constructor() {
        this.desktopLinks = document.querySelectorAll('.nav-item');
        this.mobileLinks = document.querySelectorAll('.drawer-link');
        this.sections = document.querySelectorAll('section[id]');
        this.init();
    }

    init() {
        // Smooth scroll for desktop navigation links
        this.desktopLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        if (!this.sections.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    this.desktopLinks.forEach(item => {
                        const isMatch = item.getAttribute('href') === `#${id}`;
                        item.classList.toggle('active', isMatch);
                        if (isMatch) {
                            item.setAttribute('aria-current', 'page');
                        } else {
                            item.removeAttribute('aria-current');
                        }
                    });

                    this.mobileLinks.forEach(item => {
                        const isMatch = item.getAttribute('href') === `#${id}`;
                        item.classList.toggle('active', isMatch);
                    });
                }
            });
        }, { threshold: 0.25 });

        this.sections.forEach(sec => observer.observe(sec));
    }
}

// ============================================
// HERO LIFECYCLE CONTROLLER (GPU & Battery Optimization)
// Halts 60fps canvas animation loops when hero is off-screen
// ============================================
class HeroLifecycleController {
    constructor(lattice, regLab) {
        this.hero = document.getElementById('hero');
        this.lattice = lattice;
        this.regLab = regLab;
        if (!this.hero) return;
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const isVisible = entry.isIntersecting;
                if (isVisible) {
                    if (this.lattice && typeof this.lattice.resume === 'function') this.lattice.resume();
                    if (this.regLab && typeof this.regLab.resume === 'function') this.regLab.resume();
                } else {
                    if (this.lattice && typeof this.lattice.pause === 'function') this.lattice.pause();
                    if (this.regLab && typeof this.regLab.pause === 'function') this.regLab.pause();
                }
            });
        }, { threshold: 0.05 });

        observer.observe(this.hero);
    }
}
// Skills integrated into Projects & Technical Capabilities

// ============================================
// EXECUTIVE SCHEDULING INTERFACE (V7.0)
// ============================================
// ExecutiveScheduler replaced by ContactInterface in contact-system.js

// ============================================
// ROME TIME CLOCK & DATE TICKER
// ============================================
class RomeClock {
    constructor() {
        this.clockEl = document.getElementById('sys-clock');
        this.tickerEl = document.getElementById('date-ticker');
        
        if (!this.clockEl || !this.tickerEl) return;
        
        this.timezone = 'Europe/Rome';
        this.tickerIndex = 0;
        this.tickerItems = [];
        
        this.init();
    }
    
    init() {
        // Start the clock immediately
        this.updateClock();
        
        // Update clock every second
        setInterval(() => this.updateClock(), 1000);
        
        // Update ticker every 3 seconds
        this.updateTicker();
        setInterval(() => this.cycleTicker(), 3000);
    }
    
    getRomeDate() {
        return new Date(new Date().toLocaleString("en-US", { timeZone: this.timezone }));
    }
    
    updateClock() {
        const now = this.getRomeDate();
        
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        this.clockEl.textContent = `${hours}:${minutes}:${seconds}`;
    }
    
    updateTicker() {
        const now = this.getRomeDate();
        
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        
        const dayName = days[now.getDay()];
        const date = String(now.getDate()).padStart(2, '0');
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        
        // Create dynamic ticker items
        this.tickerItems = [
            `${dayName}`,
            `${date} ${month} ${year}`,
            `ROME TIME`,
            `WEEK ${this.getWeekNumber(now)}`
        ];
        
        this.renderTicker();
    }
    
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    
    renderTicker() {
        const currentText = this.tickerItems[this.tickerIndex];
        this.tickerEl.textContent = currentText;
        
        // Add animation class
        this.tickerEl.classList.remove('ticker-fade');
        void this.tickerEl.offsetWidth; // Trigger reflow
        this.tickerEl.classList.add('ticker-fade');
    }
    
    cycleTicker() {
        this.tickerIndex = (this.tickerIndex + 1) % this.tickerItems.length;
        this.updateTicker();
    }
}

// ============================================
// THEME MANAGER (Dark / Light Mode Controller)
// ============================================
class ThemeManager {
    constructor() {
        this.btn = document.getElementById('theme-toggle-btn');
        this.label = document.getElementById('theme-label');
        this.html = document.documentElement;

        const savedTheme = localStorage.getItem('renaldo-theme') || 'light';
        this.applyTheme(savedTheme);

        if (this.btn) {
            this.btn.addEventListener('click', () => this.toggle());
        }
    }

    applyTheme(theme) {
        this.html.setAttribute('data-theme', theme);
        localStorage.setItem('renaldo-theme', theme);

        if (this.label) {
            this.label.textContent = theme === 'dark' ? 'Light' : 'Dark';
        }
        if (this.btn) {
            const nextMode = theme === 'dark' ? 'light' : 'dark';
            this.btn.setAttribute('aria-label', `Switch to ${nextMode} mode`);
            this.btn.setAttribute('title', `Switch to ${nextMode} mode`);
        }
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    toggle() {
        const currentTheme = this.html.getAttribute('data-theme') || 'light';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(nextTheme);
    }
}

// ============================================
// MOBILE NAVIGATION MANAGER
// Accessible Frosted-Glass Drawer Controller
// ============================================
class MobileNavManager {
    constructor() {
        this.menuBtn = document.getElementById('mobile-menu-btn');
        this.drawer = document.getElementById('mobile-nav-drawer');
        this.closeBtn = document.getElementById('drawer-close-btn');
        this.backdrop = document.getElementById('drawer-backdrop');
        this.links = document.querySelectorAll('.drawer-link');
        
        if (!this.menuBtn || !this.drawer) return;
        
        this.isOpen = false;
        this.init();
    }
    
    init() {
        this.menuBtn.addEventListener('click', () => this.toggle());
        if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
        if (this.backdrop) this.backdrop.addEventListener('click', () => this.close());
        
        // Handle ESC key and Focus Trapping for accessibility
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;

            if (e.key === 'Escape') {
                this.close();
                return;
            }

            if (e.key === 'Tab') {
                const focusables = this.drawer.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (!focusables.length) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        last.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === last) {
                        first.focus();
                        e.preventDefault();
                    }
                }
            }
        });
        
        // Handle link clicks with smooth scroll
        this.links.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                if (targetId && targetId.startsWith('#')) {
                    e.preventDefault();
                    this.close();
                    
                    const targetEl = document.querySelector(targetId);
                    if (targetEl) {
                        setTimeout(() => {
                            targetEl.scrollIntoView({ behavior: 'smooth' });
                        }, 250);
                    }
                }
            });
        });
    }
    
    open() {
        this.isOpen = true;
        this.drawer.classList.add('is-open');
        this.menuBtn.classList.add('is-active');
        this.menuBtn.setAttribute('aria-expanded', 'true');
        this.drawer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        this.isOpen = false;
        this.drawer.classList.remove('is-open');
        this.menuBtn.classList.remove('is-active');
        this.menuBtn.setAttribute('aria-expanded', 'false');
        this.drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
}

// ============================================
// HERO SCROLL CUE CONTROLLER
// Ambient Editorial Scroll Cue with Progressive Dissolution
// ============================================
class HeroScrollCue {
    constructor() {
        this.cue = document.getElementById('hero-scroll-cue');
        if (!this.cue) return;
        this.isTicking = false;
        this.init();
    }

    init() {
        const scrollToProfile = () => {
            const target = document.querySelector('#profile') || document.querySelector('#about');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        };

        this.cue.addEventListener('click', scrollToProfile);
        this.cue.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                scrollToProfile();
            }
        });

        // Progressive dissolution as user scrolls towards second section (#profile)
        const updateDissolve = () => {
            const profileSection = document.getElementById('profile') || document.getElementById('about');
            const scrollY = window.scrollY || window.pageYOffset;
            
            let opacity = 1;
            let translateY = 0;

            if (profileSection) {
                const profileTop = profileSection.getBoundingClientRect().top;
                const windowHeight = window.innerHeight;
                
                // When profileTop >= windowHeight: user is in hero/home section (opacity = 1)
                // When profileTop <= 80: user has arrived at the second section (#profile) (opacity = 0)
                // Between windowHeight and 80: progressive linear dissolution from 1 down to 0
                if (profileTop >= windowHeight) {
                    opacity = 1;
                    translateY = 0;
                } else if (profileTop <= 80) {
                    opacity = 0;
                    translateY = 16;
                } else {
                    const progress = (windowHeight - profileTop) / (windowHeight - 80);
                    opacity = Math.max(0, Math.min(1, 1 - progress));
                    translateY = progress * 14;
                }
            } else {
                // Fallback if #profile not found in DOM
                const fadeDistance = window.innerHeight * 0.7;
                const progress = Math.min(1, scrollY / fadeDistance);
                opacity = Math.max(0, 1 - progress);
                translateY = progress * 14;
            }

            this.cue.style.opacity = opacity.toFixed(3);
            this.cue.style.transform = `translateY(${translateY.toFixed(1)}px)`;

            if (opacity <= 0.01) {
                this.cue.style.visibility = 'hidden';
                this.cue.style.pointerEvents = 'none';
            } else {
                this.cue.style.visibility = 'visible';
                this.cue.style.pointerEvents = opacity > 0.2 ? 'auto' : 'none';
            }
        };

        window.addEventListener('scroll', () => {
            if (!this.isTicking) {
                window.requestAnimationFrame(() => {
                    updateDissolve();
                    this.isTicking = false;
                });
                this.isTicking = true;
            }
        }, { passive: true });

        // Trigger on initial load and window resize
        updateDissolve();
        window.addEventListener('resize', updateDissolve, { passive: true });
    }
}

// ============================================
// FUTURISTIC BUTTON TACTILE MOTION ENGINE
// ============================================
class FuturisticButtonFX {
    constructor() {
        this.buttons = document.querySelectorAll('.hero-btn');
        if (!this.buttons.length) return;
        this.init();
    }

    init() {
        this.buttons.forEach(btn => {
            // Interactive pointer tracking for dynamic sheen spotlight
            btn.addEventListener('pointermove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                btn.style.setProperty('--btn-sheen-x', `${x}px`);
                btn.style.setProperty('--btn-sheen-y', `${y}px`);
            }, { passive: true });

            // Tactile Quantum Ripple & Instant Compression on pointerdown
            btn.addEventListener('pointerdown', (e) => {
                btn.classList.add('is-pressed');

                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const ripple = document.createElement('span');
                ripple.className = 'quantum-ripple';
                const size = Math.max(rect.width, rect.height) * 2.2;
                ripple.style.width = `${size}px`;
                ripple.style.height = `${size}px`;
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;

                btn.appendChild(ripple);

                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });

            // Clean release
            const release = () => {
                btn.classList.remove('is-pressed');
            };

            btn.addEventListener('pointerup', release);
            btn.addEventListener('pointerleave', release);
            btn.addEventListener('pointercancel', release);
        });
    }
}

// ============================================
// SKILLS MATRIX RUNTIME CONSOLE CONTROLLER
// Domain Tab Filtering, Live Telemetry HUD & CV Feedback
// ============================================
class SkillsMatrixController {
    constructor() {
        this.tabs = document.querySelectorAll('#skills-domain-tabs .skill-tab');
        this.chips = document.querySelectorAll('#skills-rack-grid .skill-chip');
        this.telemetryText = document.getElementById('skills-telemetry-text');
        this.telemetryDot = document.getElementById('skills-telemetry-dot');
        this.telemetryBadge = document.getElementById('skills-telemetry-badge');
        this.cvBtn = document.getElementById('cv-download-btn');

        this.currentDomain = 'all';
        this.revertTimeout = null;

        this.domainMeta = {
            all: {
                text: 'Stack Integrity: 16 Core Modules · Active Production Topology',
                badge: '100% Deterministic',
                color: '#10b981'
            },
            stats: {
                text: 'Domain: Statistical Inference & Quantitative Modeling · 4 Active Modules',
                badge: 'M.Sc. Rigor',
                color: '#38bdf8'
            },
            ml: {
                text: 'Domain: Neural Architectures & SOTA Estimators · 4 Active Modules',
                badge: 'PyTorch / GPU',
                color: '#818cf8'
            },
            llm: {
                text: 'Domain: Retrieval Augmented Generation & Agent Topologies · 4 Active Modules',
                badge: 'ReAct Systems',
                color: '#34d399'
            },
            infra: {
                text: 'Domain: Deterministic Serving & Distributed Cloud Infrastructure · 4 Active Modules',
                badge: 'Cloud OCI',
                color: '#fbbf24'
            }
        };

        if (!this.tabs.length || !this.chips.length) return;
        this.init();
    }

    init() {
        // Tab click handling & ARIA synchronization
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const domain = tab.getAttribute('data-domain') || 'all';
                this.currentDomain = domain;

                // Update tab states & ARIA
                this.tabs.forEach(t => {
                    const isActive = (t === tab);
                    t.classList.toggle('active', isActive);
                    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
                });

                // Update telemetry
                this.updateTelemetryForDomain(domain);

                // Filter skills chips with hardware-accelerated micro-transition
                this.chips.forEach(chip => {
                    const chipDomain = chip.getAttribute('data-domain');
                    const isMatch = (domain === 'all' || chipDomain === domain);

                    if (isMatch) {
                        chip.classList.remove('chip-hidden');
                        chip.style.opacity = '0';
                        chip.style.transform = 'scale(0.96)';
                        requestAnimationFrame(() => {
                            chip.style.transition = 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
                            chip.style.opacity = '1';
                            chip.style.transform = 'scale(1)';
                        });
                    } else {
                        chip.classList.add('chip-hidden');
                    }
                });
            });
        });

        // Chip Hover / Focus Live Telemetry Inspection Stream
        this.chips.forEach(chip => {
            const inspectChip = () => {
                if (this.revertTimeout) clearTimeout(this.revertTimeout);
                const name = chip.getAttribute('data-name') || chip.querySelector('.skill-name')?.textContent || 'Module';
                const meta = chip.getAttribute('data-meta') || 'Active Production Capability';
                const domain = chip.getAttribute('data-domain') || 'all';
                const domainColor = this.domainMeta[domain]?.color || '#10b981';

                if (this.telemetryText) {
                    this.telemetryText.classList.add('is-inspecting');
                    this.telemetryText.textContent = `[INSPECT: ${name.toUpperCase()}] // ${meta}`;
                }
                if (this.telemetryDot) {
                    this.telemetryDot.style.background = domainColor;
                    this.telemetryDot.style.boxShadow = `0 0 10px ${domainColor}`;
                }
                if (this.telemetryBadge) {
                    this.telemetryBadge.textContent = 'Telemetry Live';
                }
            };

            const releaseChip = () => {
                if (this.revertTimeout) clearTimeout(this.revertTimeout);
                this.revertTimeout = setTimeout(() => {
                    this.updateTelemetryForDomain(this.currentDomain);
                }, 180);
            };

            chip.addEventListener('pointerenter', inspectChip);
            chip.addEventListener('pointerleave', releaseChip);
            chip.addEventListener('focus', inspectChip);
            chip.addEventListener('blur', releaseChip);
        });

        // CV Download Button Tactical Feedback
        if (this.cvBtn) {
            this.cvBtn.addEventListener('click', () => {
                const originalText = this.cvBtn.querySelector('.btn-text')?.textContent || 'Download CV';
                const textEl = this.cvBtn.querySelector('.btn-text');
                const iconEl = this.cvBtn.querySelector('.btn-icon i');

                this.cvBtn.classList.add('is-downloading');
                if (textEl) textEl.textContent = 'Download Initiated';
                if (iconEl) iconEl.className = 'fa-solid fa-circle-check';

                setTimeout(() => {
                    this.cvBtn.classList.remove('is-downloading');
                    if (textEl) textEl.textContent = originalText;
                    if (iconEl) iconEl.className = 'fa-solid fa-file-arrow-down';
                }, 2200);
            });
        }
    }

    updateTelemetryForDomain(domain) {
        const meta = this.domainMeta[domain] || this.domainMeta.all;
        if (this.telemetryText) {
            this.telemetryText.classList.remove('is-inspecting');
            this.telemetryText.textContent = meta.text;
        }
        if (this.telemetryDot) {
            this.telemetryDot.style.background = meta.color;
            this.telemetryDot.style.boxShadow = `0 0 8px ${meta.color}`;
        }
        if (this.telemetryBadge) {
            this.telemetryBadge.textContent = meta.badge;
        }
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Theme
    new ThemeManager();

    // Initialize mobile navigation
    new MobileNavManager();
    
    // Initialize systems
    const lattice = new SystemLattice();
    new CursorGlow();
    new ScrollAnimations();
    new HeroScrollCue();
    new FuturisticButtonFX();
    const regLab = window.RegressionSurfaceLab ? new window.RegressionSurfaceLab() : null;
    
    // Initialize Navigation, Progress & Lifecycle
    new ScrollSpyManager();
    new ScrollProgressIndicator();
    new HeroLifecycleController(lattice, regLab);
    
    // Initialize Profile & Skills Matrix
    new SkillsMatrixController();

    // Initialize Projects & Architecture Systems
    new KineticStream(); // Executive Projects Grid
    new RomeClock(); // Rome timezone clock & date ticker
    // ExecutiveScheduler initialization moved to contact-system.js

    
    // Add reveal class for CSS animations
    document.querySelectorAll('[data-reveal]').forEach((el, i) => {
        el.style.transitionDelay = `${i * 50}ms`;
    });
    
    console.log('%c NEURAL ARCHITECT V6 ONLINE ', 'background: #000; color: #00f0ff;');
});

// ============================================
// PERFORMANCE: Pause animations when tab not visible
// ============================================
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Could pause expensive animations here
    }
});