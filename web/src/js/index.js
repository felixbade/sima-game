import { app, container } from './render.js'
import { cameraFollow } from './cameraFollow.js'
import { noise } from './noise.js'
const { controller, InputType } = UniversalGameController;

window.addEventListener('load', () => {
    const gameContainer = new PIXI.Container();
    container.addChild(gameContainer);

    // brown background
    const bg = new PIXI.Graphics();
    // ok this lagged too much when it was in ticker. but it will not resize now
    bg.beginFill(0xd99c38);
    const aspect = app.screen.width / app.screen.height;
    bg.drawRect(-aspect * 500, -500, aspect * 1000, 1000);
    bg.endFill();

    gameContainer.addChild(bg);

    // todo: sima bubble
    const bubbleTexture = PIXI.Texture.from('assets/images/bubble.png');

    const bubbles = [];

    const newBubble = (x, y, size) => {
        const bubble = new PIXI.Sprite(bubbleTexture);
        bubble.anchor.set(0.5);
        bubble.scale.set(0.5 * size / 100); // 2x dpi
        bubble.size = size;
        bubble.x = x;
        bubble.y = y;
        bubble.vx = 0;
        bubble.vy = 0;
        gameContainer.addChild(bubble);
        bubbles.push(bubble);
    }

    // bubbles[0] is the player
    newBubble(0, 0, 5000);

    for (let i = 0; i < 300; i++) {
        const minSize = 2000;
        const maxSize = 100000;
        const size = Math.exp(Math.random() * Math.log(maxSize / minSize) + Math.log(minSize));

        // should be while true in theory but we don't want infinite loops
        let x, y;
        for (let i = 0; i < 100; i++) {
            x = Math.random() * 2000 - 1000;
            y = 500 - Math.random() * 10000;
            // x = Math.random() * 1000 - 500;
            // y = Math.random() * 1000 - 500;

            // check that it's not too close to any other bubble
            for (let j = 0; j < bubbles.length; j++) {
                const dx = x - bubbles[j].x;
                const dy = y - bubbles[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                distance -= Math.sqrt(size) / 2 + Math.sqrt(bubbles[j].size) / 2;
                if (distance > 0) {
                    break;
                }
            }
        }
        newBubble(x, y, size);
    }

    app.ticker.add(dt => {
        const acceleration = 0.25;
        bubbles[0].vx += acceleration * controller.move.x;
        bubbles[0].vy += acceleration * controller.move.y;

        for (let i = 0; i < bubbles.length; i++) {
            // random floating in the field
            const time = app.ticker.lastTime / 1000 * 0.3;
            const noiseX = bubbles[i].x / 500;
            const noiseY = bubbles[i].y / 500;
            const noiseDelta = 0.001;
            const drag = 0.03;
            const current = 0.1;
            const boyancy = Math.sqrt(bubbles[i].size) * 0.01;
            let vx = noise(noiseX + noiseDelta, noiseY, time) - noise(noiseX, noiseY, time);
            let vy = noise(noiseX, noiseY + noiseDelta, time) - noise(noiseX, noiseY, time);
            vx *= current / noiseDelta;
            vy *= current / noiseDelta;
            vy -= boyancy;

            const dvx = bubbles[i].vx - vx;
            const dvy = bubbles[i].vy - vy;
            bubbles[i].vx -= dvx * dt * drag;
            bubbles[i].vy -= dvy * dt * drag;
        }

        // bubbles that are touching get merged
        for (let i = 0; i < bubbles.length; i++) {
            for (let j = i + 1; j < bubbles.length; j++) {
                const dx = bubbles[i].x - bubbles[j].x;
                const dy = bubbles[i].y - bubbles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const overlap = bubbles[i].radius + bubbles[j].radius - distance;
                if (overlap > 0) {
                    const smaller = Math.min(bubbles[i].size, bubbles[j].size);
                    const eatR = Math.min(overlap, smaller);
                    let eat = Math.pow(eatR, 2);
                    eat = Math.min(eat, smaller);

                    // bigger eats smaller, slowly
                    if (bubbles[i].size > bubbles[j].size) {
                        bubbles[i].size += eat;
                        bubbles[j].size -= eat;
                    } else {
                        bubbles[j].size += eat;
                        bubbles[i].size -= eat;
                    }

                }
            }
        }

        for (let i = 0; i < bubbles.length; i++) {
            bubbles[i].x += bubbles[i].vx * dt;
            bubbles[i].y += bubbles[i].vy * dt;
            bubbles[i].radius = Math.sqrt(bubbles[i].size) / 2;
            bubbles[i].scale.set(2 * bubbles[i].radius / 240); // 240px size bubble
        }

        cameraFollow(bubbles[0]);

        // background follows the camera
        bg.x = -container.x;
        bg.y = -container.y;
    });

});