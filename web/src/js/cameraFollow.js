import { container } from './render.js'

export const cameraFollow = sprite => {
    const view = container.getGlobalPosition();
    const target = sprite.getGlobalPosition();
    const canvasScaling = container.parent.scale;

    const r = a => Math.sqrt(a.x * a.x + a.y * a.y);

    const speedCompensation = 0;
    const lookAhead = 50;
    const lookAheadMax = 300;
    const vx = 0 * sprite.vx || 0;
    const vy = 0 * sprite.vy || 0;
    const vr = r({ x: vx, y: vy });
    let vxClamped = vx;
    let vyClamped = vy;
    if (vr > lookAheadMax) {
        const t = lookAheadMax / vr;
        vxClamped *= t;
        vyClamped *= t;
    }

    const newCentering = {
        x: (view.x - target.x) / canvasScaling.x - vxClamped * lookAhead - vx * speedCompensation,
        y: (view.y - target.y) / canvasScaling.y - vyClamped * lookAhead - vy * speedCompensation,
    };

    const diff = {
        x: newCentering.x - container.x,
        y: newCentering.y - container.y,
    };

    // Exponential smoothing
    const farSnap = 0.04;
    const endSnap = 0.2;
    const t = mapClamp(1 / (Math.sqrt(r(diff)) * 1.2 + 1), 1, 0.1, endSnap, farSnap);
    // const t = 0.07
    container.x += diff.x * t;
    container.y += diff.y * t;
};

const mapClamp = (x, in_min, in_max, out_min, out_max) => {
    // x = in_min .. in_max
    x -= in_min;
    // x = 0 .. in_max - in_min
    x /= (in_max - in_min);
    // x = 0 .. 1
    x = Math.max(0, Math.min(1, x));
    x *= (out_max - out_min);
    // x = 0 .. out_max - out_min
    x += out_min;
    // x = out_min .. out_max
    return x;
};