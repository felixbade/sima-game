import { app, container } from './render.js'
import { cameraFollow } from './cameraFollow.js'
import { noise } from './noise.js'
const { controller, InputType } = UniversalGameController;

const sendScore = async (score) => {

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (!token) {
        return;
    }

    const response = await fetch('https://sima.bloat.app/submit_highscore', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token,
            score,
        }),
    });
};

window.addEventListener('load', () => {
    let gameOver = false;
    let score = 0;

    const surfaceY = -7000;
    const bubbleSpawnWidth = 5000;

    const gameContainer = new PIXI.Container();
    container.addChild(gameContainer);

    // Background
    const bgTexture = PIXI.Texture.from('assets/images/bg-sima-tile.png');
    const bgContainer = new PIXI.Container();
    gameContainer.addChild(bgContainer);

    const bgSprites = [];
    const bgScale = 0.5;
    const bgSizeX = 720 * bgScale;
    const bgSizeY = 1280 * bgScale;
    for (let x = -5; x <= 5; x++) {
        for (let y = -5; y <= 5; y++) {
            const bgSprite = new PIXI.Sprite(bgTexture);
            bgSprite.anchor.set(bgScale);
            bgSprite.scale.set(bgScale);
            bgSprite.x = x * bgSizeX;
            bgSprite.y = y * bgSizeY;
            bgSprite.dx = x * bgSizeX;
            bgSprite.dy = y * bgSizeY;
            bgContainer.addChild(bgSprite);
            bgSprites.push(bgSprite);
        }
    }

    // Number textures
    const numberTextures = [];
    for (let i = 0; i < 10; i++) {
        const texture = PIXI.Texture.from('assets/images/numbers/' + i + '.png');
        numberTextures.push(texture);
    }
    const scoreContainer = new PIXI.Container();

    const setScore = (score) => {
        // Clear old score
        scoreContainer.removeChildren();

        const scoreString = score.toString();
        const numberScale = 0.8;
        const numberWidth = numberTextures[0].width * numberScale;
        const scoreWidth = scoreString.length * numberWidth;
        for (let i = 0; i < scoreString.length; i++) {
            const digit = parseInt(scoreString[i]);
            const sprite = new PIXI.Sprite(numberTextures[digit]);
            sprite.scale.set(numberScale);
            sprite.x = i * numberWidth - scoreWidth / 2;
            scoreContainer.addChild(sprite);
        }
    }

    // foam (foam.png)
    // repeats horizontally
    const foamTexture = PIXI.Texture.from('assets/images/foam.png');
    const foamContainer = new PIXI.Container();
    gameContainer.addChild(foamContainer);
    const foamSprites = [];
    const foamScale = 0.5;
    const foamSizeX = 720 * foamScale; // 720px image

    for (let x = -5; x <= 5; x++) {
        const foamSprite = new PIXI.Sprite(foamTexture);
        foamSprite.anchor.set(foamScale);
        foamSprite.scale.set(foamScale);
        foamSprite.x = x * foamSizeX;
        // 200 comes from the graphics
        foamSprite.y = -200 + surfaceY;
        foamContainer.addChild(foamSprite);
        foamSprites.push(foamSprite);
    }

    // Instructions
    // swipe-to-play.png
    const instructionsTexture = PIXI.Texture.from('assets/images/swipe-to-play.png');
    const instructions = new PIXI.Sprite(instructionsTexture);
    instructions.anchor.set(0.5);
    instructions.scale.set(0.5 * 1.25);
    instructions.x = 0;
    instructions.y = -200;
    gameContainer.addChild(instructions);

    // Sima bubbles
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
    const initialPlayerSize = 5000;
    newBubble(0, 0, initialPlayerSize);

    // Swawn initial bubbles
    for (let i = 0; i < 300; i++) {
        const minSize = 1000;
        const maxSize = 50000;
        const size = Math.exp(Math.random() * Math.log(maxSize / minSize) + Math.log(minSize));

        // should be while true in theory but we don't want infinite loops
        let x, y;
        for (let i = 0; i < 100; i++) {
            x = Math.random() * bubbleSpawnWidth - bubbleSpawnWidth / 2;
            y = 5000 - Math.random() * 7500;
            // x = Math.random() * 1000 - 500;
            // y = Math.random() * 1000 - 500;

            // check that it's not too close to any other bubble
            let tooClose = false;
            for (let j = 0; j < bubbles.length; j++) {
                const dx = x - bubbles[j].x;
                const dy = y - bubbles[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                distance -= Math.sqrt(size) / 2 + Math.sqrt(bubbles[j].size) / 2;
                if (distance < 0) {
                    tooClose = true;
                    break;
                }
            }
            // distance to the player
            const dx = x - bubbles[0].x;
            const dy = y - bubbles[0].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            distance -= Math.sqrt(size) / 2 * 2 + Math.sqrt(bubbles[0].size) / 2;
            if (distance < 0) {
                tooClose = true;
            }
            if (!tooClose) {
                break;
            }
        }
        newBubble(x, y, size);
    }

    // add score here to be on top of the bubbles
    gameContainer.addChild(scoreContainer);

    // game over screen
    // game-over.png
    const gameOverTexture = PIXI.Texture.from('assets/images/game-over.png');
    const gameOverSprite = new PIXI.Sprite(gameOverTexture);
    gameOverSprite.anchor.set(0.5);
    gameOverSprite.x = 0;
    gameOverSprite.y = 0;
    gameContainer.addChild(gameOverSprite);


    // Game loop
    app.ticker.add(dt => {
        if (!gameOver) {
            // Disable controller when game is over
            const acceleration = 0.25;
            bubbles[0].vx += acceleration * controller.move.x;
            bubbles[0].vy += acceleration * controller.move.y;

            score = Math.max(score, Math.round((bubbles[0].size - initialPlayerSize) / 500));

            // hide game over screen
            gameOverSprite.scale.set(0);
        } else {
            // show game over screen
            gameOverSprite.scale.set(1);
        }

        setScore(score);

        // Random mobement in the noise field + boyancy
        for (let i = 0; i < bubbles.length; i++) {
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

        // Bubbles that are touching get merged
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

        // Update bubble positions
        for (let i = 0; i < bubbles.length; i++) {
            bubbles[i].x += bubbles[i].vx * dt;
            bubbles[i].y += bubbles[i].vy * dt;
            bubbles[i].radius = Math.sqrt(bubbles[i].size) / 2;
            bubbles[i].scale.set(2 * bubbles[i].radius / 240); // 240px size bubble
        }

        // Bubbles over the surface get popped
        for (let i = 0; i < bubbles.length; i++) {
            if (bubbles[i].y < surfaceY) {
                bubbles[i].size = 0;
            }
        }

        // Look at the player
        cameraFollow(bubbles[0]);

        // Background follows the camera
        // bg.x = -container.x;
        // bg.y = -container.y;
        bgContainer.x = Math.round(bubbles[0].x / bgSizeX) * bgSizeX;
        bgContainer.y = Math.round(bubbles[0].y / bgSizeY) * bgSizeY;

        // Score follows the camera
        scoreContainer.x = -container.x;
        scoreContainer.y = -container.y - 480;

        // Foam container x follows the camera
        foamContainer.x = Math.round(bubbles[0].x / foamSizeX) * foamSizeX;

        // game over follows the camera
        gameOverSprite.x = -container.x;
        gameOverSprite.y = -container.y;


        // Game over condition
        if (!gameOver && (bubbles[0].size < 500 || bubbles[0].y < surfaceY)) {
            gameOver = true;
            sendScore(score);
        }
    });

});