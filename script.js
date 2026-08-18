const canvas = document.getElementById("raceCanvas");
const ctx = canvas.getContext("2d");

const speedText = document.getElementById("speed");
const energyText = document.getElementById("energy");
const starsScoreText = document.getElementById("starsScore");
const gameMessage = document.getElementById("gameMessage");
const surprise = document.getElementById("surprise");

let keys = {};
let car = { x: 450, y: 380, width: 42, height: 76, speed: 0 };
let stars = [];
let cones = [];
let score = 0;
let energy = 100;
let started = false;
let won = false;
let roadOffset = 0;
let turbo = 0;
let animation;

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function createItems() {
  stars = [];
  cones = [];

  for (let i = 0; i < 8; i++) {
    stars.push({
      x: random(245, 655),
      y: -i * 175 - random(50, 170),
      size: 14,
      taken: false
    });
  }

  for (let i = 0; i < 13; i++) {
    cones.push({
      x: random(250, 650),
      y: -i * 120 - random(30, 100),
      size: 16
    });
  }
}

function roundedRect(x, y, width, height, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function drawTrack() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "#08051a");
  gradient.addColorStop(0.28, "#121126");
  gradient.addColorStop(0.72, "#121126");
  gradient.addColorStop(1, "#08051a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#050508";
  ctx.fillRect(0, 0, 210, canvas.height);
  ctx.fillRect(690, 0, 210, canvas.height);

  ctx.strokeStyle = "#9b42ff";
  ctx.shadowColor = "#9b42ff";
  ctx.shadowBlur = 14;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(220, 0);
  ctx.lineTo(220, canvas.height);
  ctx.moveTo(680, 0);
  ctx.lineTo(680, canvas.height);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "#e7e2ff";
  ctx.lineWidth = 5;
  ctx.setLineDash([35, 30]);
  ctx.lineDashOffset = roadOffset;
  ctx.beginPath();
  ctx.moveTo(450, 0);
  ctx.lineTo(450, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#00b8ff";
  for (let y = -40; y < canvas.height; y += 80) {
    ctx.fillRect(198, y + (roadOffset % 80), 10, 35);
    ctx.fillRect(692, y + (roadOffset % 80), 10, 35);
  }
}

function drawCar() {
  ctx.save();
  ctx.translate(car.x, car.y);

  ctx.shadowColor = turbo > 0 ? "#00b8ff" : "#9b42ff";
  ctx.shadowBlur = turbo > 0 ? 28 : 16;

  roundedRect(-21, -37, 42, 76, 12, "#9b42ff");
  roundedRect(-15, -26, 30, 30, 8, "#00b8ff");

  ctx.fillStyle = "#edf8ff";
  ctx.fillRect(-11, -23, 22, 17);

  ctx.fillStyle = "#111";
  ctx.fillRect(-27, -26, 7, 19);
  ctx.fillRect(20, -26, 7, 19);
  ctx.fillRect(-27, 14, 7, 19);
  ctx.fillRect(20, 14, 7, 19);

  ctx.fillStyle = "#fff";
  ctx.fillRect(-14, -37, 8, 5);
  ctx.fillRect(6, -37, 8, 5);

  if (turbo > 0) {
    ctx.fillStyle = "#00b8ff";
    ctx.beginPath();
    ctx.moveTo(-12, 37);
    ctx.lineTo(0, 64 + Math.random() * 15);
    ctx.lineTo(12, 37);
    ctx.fill();
  }

  ctx.restore();
  ctx.shadowBlur = 0;
}

function drawStar(item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.fillStyle = "#e9bcff";
  ctx.shadowColor = "#b048ff";
  ctx.shadowBlur = 18;

  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? item.size : item.size / 2;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCone(cone) {
  ctx.fillStyle = "#ff6b00";
  ctx.beginPath();
  ctx.moveTo(cone.x, cone.y - cone.size);
  ctx.lineTo(cone.x - cone.size, cone.y + cone.size);
  ctx.lineTo(cone.x + cone.size, cone.y + cone.size);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.fillRect(cone.x - 10, cone.y + 2, 20, 5);
}

function collides(item, size) {
  return (
    Math.abs(car.x - item.x) < car.width / 2 + size &&
    Math.abs(car.y - item.y) < car.height / 2 + size
  );
}

function update() {
  if (!started || won) return;

  const movingLeft = keys["ArrowLeft"] || keys["a"] || keys["A"];
  const movingRight = keys["ArrowRight"] || keys["d"] || keys["D"];

  if (movingLeft) car.x -= turbo > 0 ? 9 : 6;
  if (movingRight) car.x += turbo > 0 ? 9 : 6;

  car.x = Math.max(245, Math.min(655, car.x));

  const movement = turbo > 0 ? 10 : 5;
  car.speed = turbo > 0 ? 325 : 180;
  roadOffset += movement;

  if (turbo > 0) {
    turbo--;
    energy = Math.max(0, energy - 0.25);
  } else {
    energy = Math.min(100, energy + 0.05);
  }

  stars.forEach(star => {
    star.y += movement;

    if (!star.taken && collides(star, star.size)) {
      star.taken = true;
      score++;
      energy = Math.min(100, energy + 9);

      if (score === 8) {
        winGame();
      }
    }

    if (star.y > canvas.height + 40) {
      star.y = random(-220, -60);
      star.x = random(245, 655);
      star.taken = false;
    }
  });

  cones.forEach(cone => {
    cone.y += movement;

    if (collides(cone, cone.size)) {
      cone.y = random(-250, -80);
      cone.x = random(250, 650);
      energy = Math.max(0, energy - 1.2);
    }

    if (cone.y > canvas.height + 40) {
      cone.y = random(-250, -80);
      cone.x = random(250, 650);
    }
  });

  speedText.textContent = Math.round(car.speed);
  energyText.textContent = Math.round(energy);
  starsScoreText.textContent = score;
}

function draw() {
  drawTrack();

  stars.forEach(star => {
    if (!star.taken) drawStar(star);
  });

  cones.forEach(drawCone);
  drawCar();
}

function loop() {
  update();
  draw();
  animation = requestAnimationFrame(loop);
}

function startGame() {
  if (!started) {
    started = true;
    gameMessage.classList.add("hide");
  }
}

function useTurbo() {
  startGame();

  if (energy > 15 && !won) {
    turbo = 70;
  }
}

function winGame() {
  won = true;
  speedText.textContent = "∞";
  gameMessage.classList.remove("hide");
  gameMessage.innerHTML = `
    <strong>¡Meta alcanzada, Monse! ✦</strong>
    <span>La pista acaba de desbloquear algo especial.</span>
  `;
  surprise.classList.remove("hidden");
  surprise.scrollIntoView({ behavior: "smooth", block: "center" });
}

function restart() {
  cancelAnimationFrame(animation);
  car.x = 450;
  car.speed = 0;
  score = 0;
  energy = 100;
  turbo = 0;
  won = false;
  started = false;
  roadOffset = 0;
  surprise.classList.add("hidden");
  gameMessage.classList.remove("hide");
  gameMessage.innerHTML = `
    <strong>¿Lista para acelerar?</strong>
    <span>Usa ← → o A / D para mover el auto.</span>
  `;
  speedText.textContent = "0";
  energyText.textContent = "100";
  starsScoreText.textContent = "0";
  createItems();
  loop();
}

function confetti() {
  for (let i = 0; i < 100; i++) {
    const piece = document.createElement("span");
    piece.style.cssText = `
      position: fixed;
      z-index: 50;
      left: ${Math.random() * 100}vw;
      top: -20px;
      width: 9px;
      height: 15px;
      background: ${["#00b8ff", "#9b42ff", "#f34dff", "#ffffff"][Math.floor(Math.random() * 4)]};
      transform: rotate(${Math.random() * 360}deg);
      pointer-events: none;
      animation: fall ${1.5 + Math.random() * 2}s linear forwards;
    `;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3500);
  }
}

document.addEventListener("keydown", event => {
  keys[event.key] = true;
  if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)) {
    startGame();
  }
});

document.addEventListener("keyup", event => {
  keys[event.key] = false;
});

document.getElementById("leftBtn").addEventListener("pointerdown", () => {
  keys["ArrowLeft"] = true;
  startGame();
});

document.getElementById("rightBtn").addEventListener("pointerdown", () => {
  keys["ArrowRight"] = true;
  startGame();
});

document.addEventListener("pointerup", () => {
  keys["ArrowLeft"] = false;
  keys["ArrowRight"] = false;
});

document.getElementById("boostBtn").addEventListener("click", useTurbo);
document.getElementById("restartBtn").addEventListener("click", restart);
document.getElementById("confettiBtn").addEventListener("click", confetti);

document.querySelectorAll(".choice").forEach(button => {
  button.addEventListener("click", () => {
    const messages = {
      cool: "Buena elección. Monse oficialmente acaba de subir el nivel de esta carrera. 😎",
      magic: "Correcto: contigo hasta una pista de carreras se siente mágica. ✨",
      legend: "Confirmado: Monse corre en categoría leyenda. Nadie la alcanza. 🏁"
    };

    document.getElementById("choiceResult").textContent =
      messages[button.dataset.answer];
  });
});

const style = document.createElement("style");
style.textContent = `
  @keyframes fall {
    to {
      transform: translateY(110vh) rotate(720deg);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

createItems();
loop();
