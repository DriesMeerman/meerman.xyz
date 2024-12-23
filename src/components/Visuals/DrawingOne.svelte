<script>
    /**
     * This is a simple example of a canvas animation that draws lines in a diagonal pattern.
     * The structure of code and animation is bad and should not be followed as a good example.
     * Following iterations will be using improved structure.
    */

    import { darkMode } from "../../state";

    const SECONDARY_COLOR_LIGHT = "#15b8a6";
    const SECONDARY_COLOR_DARK = "#0084c7";
    const WIDTHS = [200, 300, 400, 800];
    const LINESIZES = [15, 30, 45, 60];

    let aspectRatios = [4/3, 16/9, 16/10, 1];
    let aspectIndex = Math.floor(Math.random() * aspectRatios.length);
    let selectedAspectRatio = aspectRatios[aspectIndex];

    let selectedWidthIndex = Math.floor(Math.random() * WIDTHS.length);
    let selectedWidth = WIDTHS[selectedWidthIndex];
    let selectedHeight = selectedWidth * selectedAspectRatio; // 4:3 aspect ratio

    let secondColor = SECONDARY_COLOR_LIGHT;
    let pause = false;
    let width, height = 0;

    darkMode.subscribe((enabled) => {
        if (enabled) {
            secondColor = SECONDARY_COLOR_DARK;
        } else {
            secondColor = SECONDARY_COLOR_LIGHT;
        }
    });

    // Still need to fix so onMount works again at some point
    setTimeout(() => { setupCanvas(12) }, 10);

    function setupCanvas(fontSize) {
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");

        ctx.font = `${fontSize}px monospace`;
        ctx.fillStyle = "#19d419";

        width = canvas.width;
        height = canvas.height;

        let field = new CanvasAnimator(ctx, canvas.width, canvas.height);
        field.animate(0);
    }

    /**
     * Private class for handling the canvas animation.
     * This will be refactored in the next iteration to be more modular and reusable.
     */
    class CanvasAnimator {
        #ctx;
        #width;
        #height;
        #cellSize;

        constructor(ctx, width, height) {
            this.#ctx = ctx;
            this.#width = width;
            this.#height = height;
            this.#cellSize = 10;
            this.lastRender = 0;
            this.interval = 1000 / 60; // 60fps
            this.timer = 0;
            this.tempOffset = 0;
            this.tempLineLength = LINESIZES[selectedWidthIndex];
        }


        animate(timestamp) {
            if (pause) {
                setTimeout(() => { this.animate(0) }, 50);
                return;
            }

            const elapsed = timestamp - this.lastRender;

            if (elapsed > this.interval) {
                this.lastRender = timestamp - (elapsed % this.interval);
                this.timer += 1;
                this.tempLineLength += Math.random() * (Math.sin(this.timer) * 20);
                this.drawDebugLines(this.tempOffset++, this.tempLineLength);
            }

            if (this.tempOffset > this.#height || this.offset > this.#width) {
                this.#ctx.clearRect(0, 0, this.#width, this.#height);
                this.tempOffset = Math.cos(this.timer) * 15;
                this.tempLineLength = LINESIZES[selectedWidthIndex];
            }

            requestAnimationFrame(this.animate.bind(this));
        }

        drawDebugLines(offset, lineLength) {
            let xStart = offset;
            let yStart = offset;
            let xEnd = xStart + lineLength;
            let yEnd = yStart + lineLength;

            // draw horizontal line
            this.#ctx.strokeStyle = "black";
            this.#ctx.beginPath();
            this.#ctx.moveTo(xStart, yStart);
            this.#ctx.lineTo(xEnd, yStart);
            this.#ctx.stroke();

            // draw vertical line
            this.#ctx.strokeStyle = secondColor;
            this.#ctx.beginPath();
            this.#ctx.moveTo(xStart, yStart);
            this.#ctx.lineTo(xStart, yEnd);
            this.#ctx.stroke();
        }
    }
</script>

<div class="relative flex min-h-[200px] w-full h-full">
    <canvas id="canvas" class="flex-grow border-2 border-teal-500 dark:border-sky-600 w-full h-full" width="{selectedWidth}" height="{selectedHeight}"></canvas>
    <button class="icon-hover pause-button" on:click={() => {pause = !pause}}>
        {#if pause}
        ▶
        {:else}
        ⏸
        {/if}
        ︎</button>
</div>
<p class="p-2 text-xs">{width} × {height}</p>

<style>
#canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
}

.pause-button {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1;
}

.icon-hover {
    transition: transform 0.3s ease, fill 0.3s ease;
    color: rgba(0,0,0,1);
}

.icon-hover:hover {
    transform: scale(1.1);
    color: rgba(0,0,0,0.3);
}
</style>
