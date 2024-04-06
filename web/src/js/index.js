import { app, container } from './render.js'
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
        bubble.x = x;
        bubble.y = y;
        gameContainer.addChild(bubble);
        bubbles.push(bubble);
    }

    // bubbles[0] is the player
    newBubble(0, 0, 30);

    for (let i = 0; i < 500; i++) {
        const minSize = 10;
        const maxSize = 50;
        const size = Math.exp(Math.random() * Math.log(maxSize / minSize) + Math.log(minSize));
        const x = Math.random() * 1000 - 500;
        const y = Math.random() * 1000 - 500;
        newBubble(x, y, size);
    }

    app.ticker.add(delta => {
        const speed = 5;
        bubbles[0].x += controller.move.x * delta * speed;
        bubbles[0].y += controller.move.y * delta * speed;

        for (let i = 1; i < bubbles.length; i++) {
            const time = app.ticker.lastTime / 1000 * 0.2;
            const noiseX = bubbles[i].x / 300;
            const noiseY = bubbles[i].y / 300;
            const delta = 0.001;
            const speed = 0.1;
            const dx = noise(noiseX + delta, noiseY, time) - noise(noiseX, noiseY, time);
            const dy = noise(noiseX, noiseY + delta, time) - noise(noiseX, noiseY, time);
            bubbles[i].x += dx / delta * speed;
            bubbles[i].y += dy / delta * speed;
        }

        // if trigger is pressed, move player to the center
        if (controller.trigger) {
            bubbles[0].x = 0;
            bubbles[0].y = 0;
        }
    });

});