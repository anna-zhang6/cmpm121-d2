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

class Line {
  points: Point[];
  color: string;

  constructor(color: string) {
    this.points = [];
    this.color = color;
  }
}

// VARIABLE SETUP //

const defaultCursorColor = "#060606";
const cursor = {
  "leftMouseDown": false,
  "x": 0,
  "y": 0,
};

let currentLine: Line = new Line(defaultCursorColor);
const lines: Line[] = [];
const redoLines: Line[] = [];

const canvasColor = "#ececec";
let cursorColor = defaultCursorColor;

// CANVAS SETUP //

const canvas = document.createElement("canvas");
canvas.width = 500;
canvas.height = 500;
app.append(canvas);
const context = canvas.getContext("2d");

// if canvas element & its context are found,
// setup canvas color create and mouse listeners
if (canvas && context) {
  redraw();

  canvas.addEventListener("mousedown", (event: MouseEvent): void => {
    if (event.button === 0) {
      cursor.leftMouseDown = true;
      cursor.x = event.offsetX;
      cursor.y = event.offsetY;

      currentLine = new Line(cursorColor);
      lines.push(currentLine);
      redoLines.splice(0, redoLines.length);
      currentLine.points.push({ x: cursor.x, y: cursor.y });

      redraw();
    }
  });

  globalThis.addEventListener("mousemove", (event: MouseEvent): void => {
    if (event.button === 0) {
      if (cursor.leftMouseDown) {
        cursor.x = event.offsetX;
        cursor.y = event.offsetY;
        currentLine.points.push({ x: cursor.x, y: cursor.y });

        redraw();
      }
    }
  });

  globalThis.addEventListener("mouseup", (event: MouseEvent): void => {
    if (event.button === 0) {
      cursor.leftMouseDown = false;
      currentLine = new Line(cursorColor);

      redraw();
    }
  });
} else console.log("error: canvas or its context did not load.");

function redraw() {
  if (context && canvas) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = canvasColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (const line of lines) {
      if (line.points.length > 1) {
        context.beginPath();
        context.strokeStyle = line.color;
        const { x, y } = line.points[0];
        context.moveTo(x, y);
        for (const { x, y } of line.points) {
          context.lineTo(x, y);
        }
        context.stroke();
      }
    }
  } else console.log("error: canvas or its context did not load.");
}

// BUTTON LOGIC //

document.body.append(document.createElement("br"));

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  lines.splice(0, lines.length);
  redraw();
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    const undoLine = lines.pop();
    if (undoLine) redoLines.push(undoLine);
    redraw();
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoLines.length > 0) {
    const redoLine = redoLines.pop();
    if (redoLine) lines.push(redoLine);
    redraw();
  }
});

const colorInput = document.createElement("input");
colorInput.type = "color";
colorInput.value = defaultCursorColor;
document.body.append(colorInput);

colorInput.addEventListener("input", (event: Event) => {
  const target = event.target as HTMLInputElement;
  cursorColor = target.value;
});
