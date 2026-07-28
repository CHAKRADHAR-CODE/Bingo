// Interactive Canvas 2D Particle Engine for Gaming FX

export type ParticleMode = 'starfield' | 'neon' | 'matrix' | 'fireworks';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay?: number;
}

export class ParticleEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animId: number | null = null;
  private mode: ParticleMode = 'neon';
  private colors: string[] = ['#00f0ff', '#ff007f', '#7000ff', '#00ff9f'];
  private mouseX: number = -1000;
  private mouseY: number = -1000;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D context not supported');
    this.ctx = context;

    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousemove', this.handleMouseMove);
    this.handleResize();
  }

  private handleResize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private handleMouseMove(e: MouseEvent) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  }

  public setMode(mode: ParticleMode, colors?: string[]) {
    this.mode = mode;
    if (colors && colors.length > 0) this.colors = colors;
    this.initParticles();
  }

  private initParticles() {
    this.particles = [];
    const count = this.mode === 'starfield' ? 180 : 80;

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (this.mode === 'starfield') {
      return {
        x: (Math.random() - 0.5) * w,
        y: (Math.random() - 0.5) * h,
        vx: 0,
        vy: 0,
        size: Math.random() * 2 + 0.5,
        color: '#ffffff',
        alpha: Math.random() * 0.8 + 0.2,
      };
    }

    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 3 + 1,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      alpha: Math.random() * 0.6 + 0.2,
    };
  }

  public triggerFireworks(x?: number, y?: number) {
    const cx = x ?? this.canvas.width / 2;
    const cy = y ?? this.canvas.height / 2;

    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015,
      });
    }
  }

  public start() {
    if (this.animId !== null) return;
    this.initParticles();

    const loop = () => {
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  public stop() {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
  }

  private render() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    if (this.mode === 'starfield') {
      const cx = w / 2;
      const cy = h / 2;

      this.ctx.save();
      this.ctx.translate(cx, cy);

      for (let p of this.particles) {
        p.size += 0.02;
        p.x *= 1.02;
        p.y *= 1.02;

        if (Math.abs(p.x) > cx || Math.abs(p.y) > cy) {
          p.x = (Math.random() - 0.5) * 50;
          p.y = (Math.random() - 0.5) * 50;
          p.size = 0.5;
        }

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        this.ctx.fill();
      }

      this.ctx.restore();
      return;
    }

    // Neon or Fireworks mode
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.decay) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
      } else {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        // Subtle mouse interaction pull/repel
        const dx = this.mouseX - p.x;
        const dy = this.mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.x -= (dx / dist) * 1.5;
          p.y -= (dy / dist) * 1.5;
        }
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = p.color;
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
  }
}
