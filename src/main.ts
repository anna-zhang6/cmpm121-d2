const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "Epic Drawing App";

const message = document.createElement("p");
message.textContent = "Your beautiful creation awaits you :D";

app.append(heading, message);

// INTERFACE/CLASS SETUP //

interface Point {
  x: number;
  y: number;
}

interface Drawable {
  display(ctx: CanvasRenderingContext2D, canvasScale?: number): void;
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

  display(ctx: CanvasRenderingContext2D, canvasScale?: number): void {
    canvasScale = canvasScale || 1;
    ctx.save();
    if (this.points.length === 1) {
      const { x, y } = this.points[0];
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(
        x * canvasScale,
        y * canvasScale,
        this.thickness / 2 * canvasScale,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    } else {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.thickness * canvasScale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(
        this.points[0].x * canvasScale,
        this.points[0].y * canvasScale,
      );
      for (const { x, y } of this.points) {
        ctx.lineTo(x * canvasScale, y * canvasScale);
      }
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

  display(ctx: CanvasRenderingContext2D, canvasScale?: number): void {
    canvasScale = canvasScale || 1;
    ctx.save();
    ctx.font = `${this.size * canvasScale}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      this.emoji,
      this.position.x * canvasScale,
      this.position.y * canvasScale,
    );
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
  { kind: "marker", label: "thick", thickness: 10 },
  { kind: "marker", label: "thicker", thickness: 50 },
  { kind: "marker", label: "thickest", thickness: 100 },
  { kind: "sticker", label: "🐱", emoji: "🐱", size: 48 },
  { kind: "sticker", label: "🌟", emoji: "🌟", size: 48 },
  { kind: "sticker", label: "🍕", emoji: "🍕", size: 48 },
  { kind: "sticker", label: "🫩", emoji: "🫩", size: 48 },
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
const canvasExportScale = 4;
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

function redraw(canvasScale?: number) {
  canvasScale = canvasScale || 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = canvasColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const command of commands) command.display(ctx, canvasScale);
  if (activeCommand) activeCommand.display(ctx, canvasScale);
}

function exportDrawing() {
  canvas.width *= canvasExportScale;
  canvas.height *= canvasExportScale;

  redraw(canvasExportScale);

  canvas.toBlob(
    (blob: Blob | null) => {
      if (!blob) {
        console.error("Canvas to Blob conversion failed");
        return;
      }

      const blobURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "beautifulCreation";
      link.href = blobURL;
      link.click();
      URL.revokeObjectURL(blobURL);
    },
    "image/png",
    1.0,
  );

  canvas.width /= canvasExportScale;
  canvas.height /= canvasExportScale;
  redraw();
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

// UNDO/REDO/CLEAR/EXPORT BUTTON LOGIC //

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

const exportButton = document.createElement("button");
exportButton.innerHTML = "export";
document.body.append(exportButton);

exportButton.addEventListener("click", () => {
  exportDrawing();
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
