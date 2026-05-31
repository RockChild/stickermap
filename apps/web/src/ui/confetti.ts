const COLORS = ["#ff5da2", "#4ecdc4", "#ffd23f", "#a78bfa", "#6ee7ff"];

/** Design-book confetti burst at a screen position. */
export function burstConfetti(x: number, y: number): void {
  for (let i = 0; i < 18; i++) {
    const el = document.createElement("span");
    el.className = "confetti-piece";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.background = COLORS[i % COLORS.length]!;
    const angle = (Math.PI * 2 * i) / 18;
    const dist = 60 + Math.random() * 50;
    el.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    el.style.setProperty("--dy", `${Math.sin(angle) * dist - 20}px`);
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("go"));
    setTimeout(() => el.remove(), 1000);
  }
}
