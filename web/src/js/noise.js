
// const functions = [
//     (x, y, z) => x + y,
//     (x, y, z) => -x + y,
//     (x, y, z) => x - y,
//     (x, y, z) => -x - y,
//     (x, y, z) => x + z,
//     (x, y, z) => -x + z,
//     (x, y, z) => x - z,
//     (x, y, z) => -x - z,
//     (x, y, z) => y + z,
//     (x, y, z) => -y + z,
//     (x, y, z) => y - z,
//     (x, y, z) => -y - z,
// ];
// const graddot = (i, x, y, z) => {
//     return functions[i](x, y, z);
// }

const graddot = (i, x, y, z) => {
    if (i === 0) return x + y;
    if (i === 1) return -x + y;
    if (i === 2) return x - y;
    if (i === 3) return -x - y;
    if (i === 4) return x + z;
    if (i === 5) return -x + z;
    if (i === 6) return x - z;
    if (i === 7) return -x - z;
    if (i === 8) return y + z;
    if (i === 9) return -y + z;
    if (i === 10) return y - z;
    if (i === 11) return -y - z;
}



// Simplex 3D
// Returns -1..1
class Noise {
    constructor() {
        // Initialize a permutation table
        this.perm = [];
        this.generatePerm();

        // Skewing and unskewing factors for 3 dimensions
        this.F3 = 1.0 / 3.0;
        this.G3 = 1.0 / 6.0;
    }

    // Method to generate a consistent permutation based on an example 256-entry array
    generatePerm() {
        const p = [...Array(256).keys()]; // Generate an array [0, 1, ..., 255]
        // The permutation is just a random shuffle of the numbers 0-255. You could use any
        // shuffling algorithm you prefer, here we're using a simple version of the Fisher-Yates shuffle.
        let n = p.length;
        while (n) {
            const i = Math.floor(Math.random() * n--);
            [p[n], p[i]] = [p[i], p[n]];
        }
        // Repeat the permutation once to avoid wrapping in the middle of the implementation
        this.perm = p.concat(p);
    }


    noise(xin, yin, zin) {
        // Skewing and unskewing factors for 3 dimensions
        let n0, n1, n2, n3; // Noise contributions from the four simplex corners

        // Skew the input space to determine which simplex cell we're in
        const s = (xin + yin + zin) * this.F3; // Very nice and simple skew factor for 3D
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const k = Math.floor(zin + s);

        const t = (i + j + k) * this.G3;
        const X0 = i - t; // Unskew the cell origin back to (x,y,z) space
        const Y0 = j - t;
        const Z0 = k - t;
        const x0 = xin - X0; // The x,y,z distances from the cell origin
        const y0 = yin - Y0;
        const z0 = zin - Z0;

        // Determine which simplex we are in.
        // Offsets for second corner of simplex in (i,j,k) coords
        let i1, j1, k1;
        // Offsets for third corner of simplex in (i,j,k) coords
        let i2, j2, k2;

        if (x0 >= y0) {
            if (y0 >= z0) {
                i1 = 1; j1 = 0; k1 = 0; // X Y Z order
                i2 = 1; j2 = 1; k2 = 0;
            } else if (x0 >= z0) {
                i1 = 1; j1 = 0; k1 = 0; // X Z Y order
                i2 = 1; j2 = 0; k2 = 1;
            } else {
                i1 = 0; j1 = 0; k1 = 1; // Z X Y order
                i2 = 1; j2 = 0; k2 = 1;
            }
        } else {
            if (y0 < z0) {
                i1 = 0; j1 = 0; k1 = 1; // Z Y X order
                i2 = 0; j2 = 1; k2 = 1;
            } else if (x0 < z0) {
                i1 = 0; j1 = 1; k1 = 0; // Y Z X order
                i2 = 0; j2 = 1; k2 = 1;
            } else {
                i1 = 0; j1 = 1; k1 = 0; // Y X Z order
                i2 = 1; j2 = 1; k2 = 0;
            }
        }

        // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z), and similarly
        // for (0,1,0) and (0,0,1). Now, we calculate the offset from the last corner in
        // unskewed coords and wrap the integer indices at 256 to avoid indexing perm[] out of bounds
        const x1 = x0 - i1 + this.G3; // Offsets for second corner
        const y1 = y0 - j1 + this.G3;
        const z1 = z0 - k1 + this.G3;
        const x2 = x0 - i2 + 2.0 * this.G3; // Offsets for third corner
        const y2 = y0 - j2 + 2.0 * this.G3;
        const z2 = z0 - k2 + 2.0 * this.G3;
        const x3 = x0 - 1.0 + 3.0 * this.G3; // Offsets for fourth corner
        const y3 = y0 - 1.0 + 3.0 * this.G3;
        const z3 = z0 - 1.0 + 3.0 * this.G3;

        // Calculate the hashed gradient indices of the four simplex corners
        const ii = i & 255;
        const jj = j & 255;
        const kk = k & 255;
        const gi0 = this.perm[ii + this.perm[jj + this.perm[kk]]] % 12;
        const gi1 = this.perm[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] % 12;
        const gi2 = this.perm[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] % 12;
        const gi3 = this.perm[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] % 12;

        // Calculate the contribution from the four corners
        let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        n0 = t0 < 0 ? 0 : (t0 *= t0) * t0 * graddot(gi0, x0, y0, z0);

        let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        n1 = t1 < 0 ? 0 : (t1 *= t1) * t1 * graddot(gi1, x1, y1, z1);

        let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        n2 = t2 < 0 ? 0 : (t2 *= t2) * t2 * graddot(gi2, x2, y2, z2);

        let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        n3 = t3 < 0 ? 0 : (t3 *= t3) * t3 * graddot(gi3, x3, y3, z3);

        // Add contributions from each corner to get the final noise value.
        return 32.0 * (n0 + n1 + n2 + n3);
    }
}

const noiseSampler = new Noise(Math.random());
export const noise = (x, y, z) => noiseSampler.noise(x, y, z);