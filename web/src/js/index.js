import { app, container } from './render.js'
const { controller, InputType } = UniversalGameController;

window.addEventListener('load', () => {
    const gameContainer = new PIXI.Container();
    container.addChild(gameContainer);

    // brown background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x8B4513);
    const aspect = app.screen.width / app.screen.height;
    bg.drawRect(-aspect * 500, -500, aspect * 1000, 1000);
    bg.endFill();
    container.addChild(bg);

    // todo: sima bubble
    const particle = PIXI.Sprite.from('assets/images/gas-particle.svg');
    particle.anchor.set(0.5);
    particle.scale.set(0.5); // 2x dpi
    gameContainer.addChild(particle);

    app.ticker.add(delta => {
        const speed = 5;
        particle.x += controller.move.x * delta * speed;
        particle.y += controller.move.y * delta * speed;

        // if trigger is pressed, move player to the center
        if (controller.trigger) {
            particle.x = 0;
            particle.y = 0;
        }
    });

});