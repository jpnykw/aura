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
        context.shape({x: this.x, y: this.y + 5, d: 270, r: size, v: 3, bold: 0.7, fv: [size / 1.5, size / -3, size / -3]});
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
                this.hp = 5;
                this.r = 15;

                this.shot.interval = 28;
                break;

            case 1:
                this.hitArea = 25;
                this.hp = 10;
                this.r = 20;

                this.shot.interval = 43;
                break;

            case 2:
                this.hitArea = 30;
                this.hp = 9;
                this.r = 18;

                this.shot.interval = 32;
                break;

            case 3:
                this.hitArea = 30;
                this.hp = 14;
                this.r = 20;

                this.shot.interval = 70;
                break;
        }

        this.shot.tick = this.shot.interval;
    }

    draw (context) {
        let x = this.x;
        let y = this.y;
        let d = this.d || 0;
        let r = this.r || 10;
        let bold = this.bold || 1;

        switch (this.id) {
            case 0:
                context.shape({ x, y, d: 90 + d, r, v: 4, bold});
                break;

            case 1:
                context.shape({x, y, d: 270, r, v: 5, bold});
                break;

            case 2:
                context.shape({x, y, d: 270, r: r * 1.5, v: 5, bold});
                context.shape({x, y, d: 90, r, v: 5, bold});
                break;

            case 3:
                context.shape({ x, y, d: 0, r, v: 3, bold});
                context.shape({ x, y, d: 180, r, v: 3, bold});
                break;
        }

        if (this.disappear == 1) {
            if (this.effectTick == undefined) {
                this.effectTick = 0;

                this.effects = new Array(6).fill(null).map(_ => {
                    let dx = -1 + (Math.random() * 2);
                    let dy = -1 + (Math.random() * 2);
                    return {dx, dy};
                });
            }

            let speed = this.effectTick * 3.7;

            this.effects.map(pos => {
                let dx = pos.dx * speed;
                let dy = pos.dy * speed;
                context.circle({x: x + dx, y: y + dy, r, bold: 0.4});
            });

            this.effectTick ++;
        }

        if (this.aura != undefined) {
            context.shape({x, y, d: this.tick, r: this.aura, v: 9, bold: this.bold});
            context.shape({x, y, d: this.tick + 45, r: this.aura, v: 9, bold: this.bold});
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
            this.r += -this.r / 4;

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
    }

    draw (context) {
        if (this.type == 1) {
            context.circle({x: this.x, y: this.y, r: 3, bold: 0.7});
        } else {
            context.line({x: this.x, y: this.y, x2: this.x, y2: this.y - 7, bold: 0.4});
        }
    }

    update () {
        this.move(this.dx, this.dy);

        this.dx += this.adx || 0;
        this.dy += this.ady || 0;

        this.checkOverArea();
    }
}