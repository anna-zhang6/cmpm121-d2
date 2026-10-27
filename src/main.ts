const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "D2 project";

const message = document.createElement("p");
message.textContent = "Your project starts here.";

app.append(heading, message);

// VARIABBLE SETUP //

const cursor = {
  "leftMouseDown": false,
  "x": 0,
  "y": 0,
};

let currentLine: { x: number; y: number }[] = [];
const lines: { x: number; y: number }[][] = [];
const redoLines: [] = [];

const canvasColor = "#ececec";

// CANVAS SETUP //

const canvas = document.createElement("canvas");
canvas.width = 500;
canvas.height = 500;
app.append(canvas);
const context = canvas.getContext("2d");

// if canvas element & its context are found, setup canvas color
if (canvas && context) {
  redraw();

  canvas.addEventListener("mousedown", (event: MouseEvent): void => {
    if (event.button === 0) {
      cursor.leftMouseDown = true;
      cursor.x = event.offsetX;
      cursor.y = event.offsetY;

      currentLine = [];
      lines.push(currentLine);
      redoLines.splice(0, redoLines.length);
      currentLine.push({ x: cursor.x, y: cursor.y });

      redraw();
    }
  });

  globalThis.addEventListener("mousemove", (event: MouseEvent): void => {
    if (event.button === 0) {
      if (cursor.leftMouseDown) {
        cursor.x = event.offsetX;
        cursor.y = event.offsetY;
        currentLine.push({ x: cursor.x, y: cursor.y });

        redraw();
      }
    }
  });

  globalThis.addEventListener("mouseup", (event: MouseEvent): void => {
    if (event.button === 0) {
      cursor.leftMouseDown = false;
      currentLine = [];

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
      if (line.length > 1) {
        context.beginPath();
        const { x, y } = line[0];
        context.moveTo(x, y);
        for (const { x, y } of line) {
          context.lineTo(x, y);
        }
        context.stroke();
      }
    }
  } else console.log("error: canvas or its context did not load.");
}
