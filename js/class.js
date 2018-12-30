class Character {
    constructor (status) {
        Object.assign(this, status);
        this.disappear = -1;
        this.tick = 0;
    }

    move (dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    checkOverArea () {
        let disappear = this.disappear;

        let r = this.r || 10;
        let max = 512 + r;
        let min = -r;

        switch (disappear) {
            case -1:
                disappear += (min < this.x && max > this.x && min < this.y && max > this.y);
                break;

            case 0:
                disappear += !(min < this.x && max > this.x && min < this.y && max > this.y) * 2;
                break;
        }

        this.disappear = disappear;
    }
}

class Player extends Character {
    constructor (status) {
        super(status);
    }

    draw (context) {
        let size = this.size;
        context.shape({x: this.x, y: this.y + 10, d: 270, r: size, v: 3, bold: 1.3, color: '#2e2e2e', fv: [size / 1.5, size / -3, size / -3]});
        context.shape({x: this.x, y: this.y + 5, d: 270, r: size, v: 3, bold: 0.7, fv: [size / 1.5, size / -3, size / -3]});
        context.shape({x: this.x, y: this.y + 5, d: 270, r: size / 1.3, v: 3, fv: [size / 1.9, size / -2.8, size / -2.8]});
    }
}

class Enemy extends Character {
    constructor (status) {
        super(status);
        this.setup();
    }

    setup () {
        this.shot = {};
        this.bold = 0.7;

        switch (this.id) {
            case 0:
                this.hitArea = 20;
                this.hp = 10;
                this.r = 15;

                this.shot.interval = 30;
                break;

            case 1:
                this.hitArea = 25;
                this.hp = 10;
                this.r = 20;

                this.shot.interval = 67;
                break;

            case 2:
                this.hitArea = 30;
                this.hp = 9;
                this.r = 18;

                this.shot.interval = 36;
                break;

            case 3:
                this.hitArea = 30;
                this.hp = 14;
                this.r = 20;

                this.shot.interval = 80;
                break;
        }

        this.shot.tick = this.shot.interval;
    }

    draw (context, pause) {
        let x = this.x;
        let y = this.y;
        let d = this.d || 0;
        let r = this.r || 10;
        let bold = this.bold || 1;

        let color = '#26afff';
        switch (this.id) {
            case 0:
                context.shape({x, y, d: 90 + d, r, v: 4, bold, color});
                context.shape({x, y: y + 5, d: 90 + d, r, v: 4, bold});
                break;

            case 1:
                context.shape({x, y, d: 270, r, v: 5, bold, color});
                context.shape({x, y: y, d: 270, r: r + 5, v: 5, bold});
                break;

            case 2:
                context.shape({x, y, d: 270, r: r * 1.7, v: 5, bold, color});
                context.shape({x, y, d: 270, r: r * 1.5, v: 5, bold});

                context.shape({x, y, d: 90, r: r * 0.8, v: 5, bold, color});
                context.shape({x, y, d: 90, r, v: 5, bold});
                break;

            case 3:
                context.shape({ x, y, d: 0, r: r * 1.2, v: 3, bold, color});
                context.shape({ x, y, d: 0, r, v: 3, bold});

                context.shape({ x, y, d: 180, r: r * 1.2, v: 3, bold, color});
                context.shape({ x, y, d: 180, r, v: 3, bold});
                break;
        }

        if (this.aura != undefined) {
            context.shape({x, y, d: this.tick, r: this.aura, v: 9, bold: this.bold});
            context.shape({x, y, d: this.tick + 45, r: this.aura, v: 9, bold: this.bold});
        }

        if (this.disappear == 1) {
            if (this.effectTick == undefined) {
                this.effectTick = 0;

                this.effects = new Array(8).fill(null).map(_ => {
                    let dx = -1 + (Math.random() * 2);
                    let dy = -1 + (Math.random() * 2);
                    return {dx, dy};
                });
            }

            let speed = (this.effectTick + 2) * 9;
            r = 210 / speed;

            // context.globalCompositeOperation = 'lighter';
            this.effects.map(pos => {
                let dx = pos.dx * speed;
                let dy = pos.dy * speed;
                context.circle({x: x + dx, y: y + dy, r, color: '#26afff9c'});

                context.globalCompositeOperation = 'lighter';
                context.circle({x: x + dx, y: y + dy, r: r * 0.7, color: '#2e2e2ecc'});

                dx *= -1.7;
                dy *= -1.7;
                context.circle({x: x + dx, y: y + dy, r: r * 0.86, bold: 0.5, color: '#e3e3e1e6'});
            });

            context.globalCompositeOperation = 'source-over';
            if (!pause) this.effectTick ++;
        }
    }

    update () {
        let dx = this.dx || 0;
        let dy = this.dy || 0;

        this.move(dx, dy);
        this.checkOverArea();

        if (this.disappear == 1) {
            this.shot.tick = Infinity;

            this.bold += -this.bold / 5;
            this.r += -this.r / 12;

            if (this.r < 0.1) {
                this.disappear = 2;
            }
        } else if (this.disappear == 0) {
            this.shot.tick --;

            if (this.shot.tick < 0) {
                this.shot.tick = this.shot.interval;
            }
        }

        this.tick ++;
    }
}

class Bullet extends Character {
    constructor (status) {
        super(status);

        this.limitTime = 10000;
        this.spawnTime = new Date().getTime();
    }

    draw (context) {
        if (this.type == 1) {
            context.circle({x: this.x, y: this.y, r: 3.5, bold: 0.7, color: '#26afff'});
            context.circle({x: this.x, y: this.y, r: 1.5});
        } else {
            context.line({x: this.x, y: this.y + 5, x2: this.x, y2: this.y - 13, bold: 1.4, color: '#2e2e2e'});
            context.line({x: this.x, y: this.y, x2: this.x, y2: this.y - 7, bold: 0.4});
        }
    }

    update (timeStamp) {
        this.move(this.dx, this.dy);

        if (this.mdx !== undefined && Math.abs(this.dx - this.mdx) < 0.1) {
            this.dx = this.mdx;
        } else {
            this.dx += this.adx || 0;
        }

        if (this.mdy !== undefined && Math.abs(this.dy - this.mdy) < 0.1) {
            this.dy = this.mdy;
        } else {
            this.dy += this.ady || 0;
        }

        this.checkOverArea();

        if (this.disappear == -1 && (timeStamp - this.spawnTime) > this.limitTime) {
            console.log('[LOG] Destroy the bullet out limit');
            this.disappear = 2;
        }
    }
}