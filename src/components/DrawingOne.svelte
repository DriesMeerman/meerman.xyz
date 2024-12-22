<script>

    setTimeout(() => {
        alternate(12);
    }, 100);



    function alternate(fontSize) {
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        ctx.font = `${fontSize}px monospace`;
        ctx.fillStyle = "#19d419";

        let field = new CanvasAnimator(ctx, canvas.width, canvas.height);
        field.animate(0);
    }

    class CanvasAnimator {
        #ctx;
        #width;
        #height;
        #cellSize;

        constructor(ctx, width, height) {
            this.#ctx = ctx;
            this.#width = width;
            this.#height = height;
            this.#cellSize = 12;
            this.lastRender = 0;
            this.interval = 1000 / 60; // 60fps
            this.timer = 0;

            this.tempOffset = 0;
            this.tempLineLength = 15;
        }

        animate(timestamp) {
            const elapsed = timestamp - this.lastRender;
            if (elapsed > this.interval) {
                this.lastRender = timestamp - (elapsed % this.interval);
                this.timer += 1;
                this.tempLineLength += Math.random() * (Math.sin(this.timer)*20)
                this.drawDebugLines(this.tempOffset++, this.tempLineLength );
            }

            if (this.tempOffset > this.#height || this.offset > this.#width) {
                this.#ctx.clearRect(0, 0, this.#width, this.#height);
                this.tempOffset = Math.cos(this.timer) * 15;
                this.tempLineLength = 15;
            }

            requestAnimationFrame(this.animate.bind(this));
        }

        drawDebugLines(offset, lineLength){
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
            this.#ctx.strokeStyle = "red";
            this.#ctx.beginPath();
            this.#ctx.moveTo(xStart, yStart);
            this.#ctx.lineTo(xStart, yEnd);
            this.#ctx.stroke();
        }

    }
</script>

<canvas id="canvas" class="w-full h-full border-2 border-red"></canvas>
