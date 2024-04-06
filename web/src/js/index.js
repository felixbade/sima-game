import { app, container } from './render.js'
const { controller, InputType } = UniversalGameController;

window.addEventListener('load', () => {
    const gameContainer = new PIXI.Container();
    container.addChild(gameContainer);

    // brown background
    const bg = new PIXI.Graphics();
    container.addChild(bg);

    // todo: sima bubble
    const particle = PIXI.Sprite.from('assets/images/gas-particle.svg');
    particle.anchor.set(0.5);
    particle.scale.set(0.5); // 2x dpi
    gameContainer.addChild(particle);

    app.ticker.add(delta => {
        // needed here for resize
        // rgb(217, 156, 56)
        bg.beginFill(0xd99c38);
        const aspect = app.screen.width / app.screen.height;
        bg.drawRect(-aspect * 500, -500, aspect * 1000, 1000);
        bg.endFill();


    // todo: sima bubble
    const bubbleTexture = PIXI.Texture.from('assets/images/bubble.png');

    const bubble = new PIXI.Sprite(bubbleTexture);
    bubble.anchor.set(0.5);
    bubble.scale.set(0.5); // 2x dpi
    gameContainer.addChild(bubble);
        const speed = 5;
        bubble.x += controller.move.x * delta * speed;
        bubble.y += controller.move.y * delta * speed;

        // if trigger is pressed, move player to the center
        if (controller.trigger) {
            bubble.x = 0;
            bubble.y = 0;
        }
    });

});