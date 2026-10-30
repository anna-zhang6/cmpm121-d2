const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "D2 project";

const message = document.createElement("p");
message.textContent = "Your project starts here.";

app.append(heading, message);

// INTERFACE/CLASS SETUP //

interface Point {
  x: number;
  y: number;
}

interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
  drag(p: Point): void;
}

class Line implements Drawable {
  points: Point[];
  color: string;
  thickness: number;

  constructor(start: Point, color: string, thickness: number) {
    this.points = [start];
    this.color = color;
    this.thickness = thickness;
  }

  drag(p: Point): void {
    this.points.push(p);
  }

  display(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    if (this.points.length === 1) {
      const { x, y } = this.points[0];
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(x, y, this.thickness / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.thickness;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (const { x, y } of this.points) ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

class Sticker implements Drawable {
  position: Point;
  emoji: string;
  size: number;

  constructor(position: Point, emoji: string, size: number) {
    this.position = position;
    this.emoji = emoji;
    this.size = size;
  }

  drag(p: Point): void {
    this.position = p;
  }

  display(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.font = `${this.size}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.position.x, this.position.y);
    ctx.restore();
  }
}

// TOOL DEFINITIONS (DATA) //

interface MarkerTool {
  kind: "marker";
  label: string;
  thickness: number;
}

interface StickerTool {
  kind: "sticker";
  label: string;
  emoji: string;
  size: number;
}

type Tool = MarkerTool | StickerTool;

const tools: Tool[] = [
  { kind: "marker", label: "thin", thickness: 2 },
  { kind: "marker", label: "thick", thickness: 8 },
  { kind: "sticker", label: "🐱", emoji: "🐱", size: 48 },
  { kind: "sticker", label: "🌟", emoji: "🌟", size: 48 },
  { kind: "sticker", label: "🍕", emoji: "🍕", size: 48 },
];

function createCommand(tool: Tool, p: Point): Drawable {
  switch (tool.kind) {
    case "marker":
      return new Line(p, cursorColor, tool.thickness);
    case "sticker":
      return new Sticker(p, tool.emoji, tool.size);
  }
}

// VARIABLE SETUP //
const defaultCursorColor = "#060606";
const canvasColor = "#ececec";
let cursorColor = defaultCursorColor;

const commands: Drawable[] = [];
const redoCommands: Drawable[] = [];
let activeCommand: Drawable | null = null;
let selectedTool: Tool = tools[0];

// CANVAS SETUP //

const canvas = document.createElement("canvas");
canvas.width = 500;
canvas.height = 500;
canvas.style.touchAction = "none";
app.append(canvas);
const context = canvas.getContext("2d");
if (!context) throw new Error("canvas context did not load.");
const ctx: CanvasRenderingContext2D = context;

function canvasPoint(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = canvasColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const command of commands) command.display(ctx);
  if (activeCommand) activeCommand.display(ctx);
}

canvas.addEventListener("pointerdown", (event: PointerEvent) => {
  if (event.button !== 0) return;
  canvas.setPointerCapture(event.pointerId);
  activeCommand = createCommand(selectedTool, canvasPoint(event));
  redraw();
});

canvas.addEventListener("pointermove", (event: PointerEvent) => {
  if (!activeCommand) return;
  activeCommand.drag(canvasPoint(event));
  redraw();
});

canvas.addEventListener("pointerup", () => {
  if (!activeCommand) return;
  commands.push(activeCommand);
  redoCommands.splice(0, redoCommands.length);
  activeCommand = null;
  redraw();
});

canvas.addEventListener("pointercancel", () => {
  activeCommand = null;
  redraw();
});

redraw();

// TOOL PALETTE //

document.body.append(document.createElement("br"));

const toolButtons: HTMLButtonElement[] = [];

function updateToolButtons() {
  toolButtons.forEach((button, i) => {
    const selected = tools[i] === selectedTool;
    button.setAttribute("aria-pressed", String(selected));
    button.style.outline = selected ? "2px solid #3b82f6" : "";
  });
}

for (const tool of tools) {
  const button = document.createElement("button");
  button.textContent = tool.label;
  button.addEventListener("click", () => {
    selectedTool = tool;
    updateToolButtons();
  });
  toolButtons.push(button);
  document.body.append(button);
}
updateToolButtons();

// UNDO/REDO/CLEAR BUTTON LOGIC //

document.body.append(document.createElement("br"));

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  const undone = commands.pop();
  if (undone) {
    redoCommands.push(undone);
    redraw();
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  const redone = redoCommands.pop();
  if (redone) {
    commands.push(redone);
    redraw();
  }
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  commands.splice(0, commands.length);
  redraw();
});

// COLOR PICKER //

const colorInput = document.createElement("input");
colorInput.type = "color";
colorInput.value = defaultCursorColor;
document.body.append(colorInput);

colorInput.addEventListener("input", (event: Event) => {
  const target = event.target as HTMLInputElement;
  cursorColor = target.value;
});
