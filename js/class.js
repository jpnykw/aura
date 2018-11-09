class Character {
    constructor (status) {
        Object.assign(this, status);
        this.disappear = -1;
    }

    move (dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    checkOverArea () {
        let disappear = this.disappear;

        switch (disappear) {
            case -1:
                disappear += (0 < this.x && 512 > this.x && 0 < this.y && 512 > this.y);
                break;

            case 0:
                disappear += !(0 < this.x && 512 > this.x && 0 < this.y && 512 > this.y) * 2;
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
        let size = this.size || 15;

        context.shape({
            x: this.x, y: this.y,
            d: 270, r: size, v: 3,
            bold: 0.7, fv: [size / 1.5, size / -3, size / -3]
        });
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
                this.hp = 15;

                this.r = 15;

                this.shot.interval = 30;
                break;

            case 1:
                this.hitArea = 20;
                this.hp = 25;

                this.r = 15;
                this.shot.interval = 40;

                this.aura = 70;
                break;
        }

        this.shot.tick = this.shot.interval;
        this.tick = 0;
    }

    draw (context) {
        let x = this.x;
        let y = this.y;
        let d = this.d || 0;

        switch (this.id) {
            case 0:
                context.shape({
                    x, y,
                    d: 90 + d, r: this.r, v: 4,
                    bold: this.bold
                });
                break;

            case 1:
                context.shape({
                    x, y,
                    d: 45 + d, r: this.r + 15, v: 4,
                    bold: this.bold
                });

                context.shape({
                    x, y,
                    d, r: this.r, v: 4,
                    bold: this.bold
                });
                break;
        }

        if (this.aura != undefined) {
            context.shape({
                x, y,
                d: this.tick, r: this.aura, v: 9,
                bold: this.bold
            });

            context.shape({
                x, y,
                d: this.tick + 45, r: this.aura, v: 9,
                bold: this.bold
            });
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
            context.circle({
                x: this.x, y: this.y,
                r: 3, bold: 0.7
            });
        } else {
            context.line({
                x: this.x, y: this.y,
                x2: this.x, y2: this.y - 7,
                bold: 0.4
            });
        }
    }

    update () {
        this.move(this.dx, this.dy);

        this.dx += this.adx || 0;
        this.dy += this.ady || 0;

        this.checkOverArea();
    }
}