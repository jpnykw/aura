const Renderer = CanvasRenderingContext2D;

Renderer.prototype.shape = function (status) {
    if (status.v < 3) {
        return false;
    }

    let color = status.color || '#e3e3e1';
    let bold = status.bold || null;

    this.beginPath();

    if (bold == null) {
        this.fillStyle = color;
    } else {
        this.strokeStyle = color;
        this.lineWidth = bold;
    }

    let x = status.x || 0;
    let y = status.y || 0;

    let d = status.d || status.direction || 0;
    let r = status.r || status.radius || 32;

    let v = status.v || status.vertex || 3;

    let zeroVertex = new Array(v).fill(0);
    let fv = status.fv || zeroVertex;
    let fx = status.fx || zeroVertex;
    let fy = status.fy || zeroVertex;

    let dis_theta = 360 / v;
    let theta = d;

    for (let i = 0; i < v; i ++) {
        let point = {
            x: x + Math.cos(theta.toRadian()) * (r + fv[i]) + fx[i],
            y: y + Math.sin(theta.toRadian()) * (r + fv[i]) + fy[i]
        };

        if (i == 0) {
            this.moveTo(point.x, point.y);
        } else {
            this.lineTo(point.x, point.y);
        }

        theta += dis_theta;
    }

    this.closePath();

    if (bold == null) {
        this.fill();
    } else {
        this.stroke();
    }
}

Renderer.prototype.circle = function (status) {
    let x = status.x || 0;
    let y = status.y || 0;
    let r = status.r || status.radius || 32;

    let bold = status.bold || null;
    let color = status.color || '#e3e3e1';

    this.beginPath();

    if (bold == null) {
        this.fillStyle = color;
    } else {
        this.strokeStyle = color;
        this.lineWidth = bold;
    }

    this.arc(x, y, r, 0, Math.PI * 2);
    this.closePath();

    if (bold == null) {
        this.fill();
    } else {
        this.stroke();
    }
}

Renderer.prototype.text = function (status) {
    let x = status.x || 0;
    let y = status.y || 0;

    let bold = status.bold || null;
    let color = status.color || '#e3e3e1';

    let align = status.align || 'center';
    let text = status.text || 'NO TEXT DATA';

    let px = status.px || 16;
    let font = status.font || 'Arial';

    this.beginPath();
    this.textAlign = align;
    this.font = `${px}px ${font}`;

    if (bold == null) {
        this.fillStyle = color;
        this.fillText(text, x, y);
    } else {
        this.strokeStyle = color;
        this.strokeText(text, x, y);
    }
}

Renderer.prototype.line = function (status) {
    let color = status.color || '#e3e3e1';
    let bold = status.bold || 1;

    let x = status.x || 0;
    let y = status.y || 0;
    let x2 = status.x2 || 0;
    let y2 = status.y2 || 0;

    this.beginPath();
    this.lineWidth = bold;
    this.strokeStyle = color;

    this.moveTo(x, y);
    this.lineTo(x2, y2);

    this.closePath();
    this.stroke();
}

Renderer.prototype.negative = function (status) {
    let x = status.x || 0;
    let y = status.y || 0;

    let width = status.w || status.width || 32;
    let height = status.h || status.height || 32;

    let image = this.getImageData(x, y, width, height);
    let data = image.data;

    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
    }

    this.putImageData(image, x, y);
}

Renderer.prototype.noise = function (status) {
    let x = status.x || 0;
    let y = status.y || 0;

    let width = status.w || status.width || 32;
    let height = status.h || status.height || 32;

    let gray = status.gray || false;
    let level = status.level || 1;

    let alpha = status.alpha || 0;

    let image = this.getImageData(x, y, width, height);
    let data = image.data;

    if (gray) {
        for (let i = 0; i < data.length; i += 4) {
            let color = Math.random() * (level * 2) - level;

            data[i] += color;
            data[i + 1] += color;
            data[i + 2] += color;

            data[i + 3] = alpha || Math.random() * 255;
        }
    } else {
        for (let i = 0; i < data.length; i += 4) {
            data[i] += Math.random() * (level * 2) - level;
            data[i + 1] += Math.random() * (level * 2) - level;
            data[i + 2] += Math.random() * (level * 2) - level;
    
            data[i + 3] = alpha || Math.random() * 255;
        }
    }

    this.putImageData(image, x, y);
}

Renderer.prototype.glitch = function (status) {
    let x = status.x || 0;
    let y = status.y || 0;

    let width = status.w || status.width || 32;
    let height = status.h || status.height || 32;

    let level = status.level || 1;

    let image = this.getImageData(x, y, width, height);
    let data = image.data;

    switch (status.type) {
        default:
            let redFix = (Math.random() * level) >> 0;
            let greenFix = (Math.random() * level) >> 0 * level;
            let blueFix = (Math.random() * level) >> 0;

            for (let i = 0; i < data.length; i += 4) {
                data[i] = data[i + redFix * 4];
                data[i + 1] = data[i + 1 + greenFix * 4];
                data[i + 2] = data[i + 2 + blueFix * 4];
        
                data[i + 3] = 180;
            }
            break;

        case 'box':
            let max = width * height;
            let mix = this.mix || false;

            for (let i = 0; i < level; i ++) {
                let index = ((Math.random() * max) >> 0) * 4;

                for (let j = 0, l = (Math.random() * 8000) >> 0; j < l; j ++) {
                    if (mix && Math.random() < 0.5) {
                        [data[index], data[index - height * 4]] = [data[index - height * 4], data[index]];
                        [data[index + 1], data[index + 1 - height * 4]] = [data[index + 1 - height * 4], data[index + 1]];
                        [data[index + 2], data[index + 2 - height * 4]] = [data[index + 2 - height * 4], data[index + 2]];
                    } else {
                        [data[index], data[index + height * 4]] = [data[index + height * 4], data[index]];
                        [data[index + 1], data[index + 1 + height * 4]] = [data[index + 1 + height * 4], data[index + 1]];
                        [data[index + 2], data[index + 2 + height * 4]] = [data[index + 2 + height * 4], data[index + 2]];
                    }

                    index += 4;
                }
            }
            break;
    }

    this.putImageData(image, x, y);
}

Renderer.prototype.lightness = function (level, canvas) {
    let height = canvas.height || 255;
    let width = canvas.width || 255;

    let image = this.getImageData(0, 0, width, height);
    let data = image.data;

    for (let i = 0; i < data.length; i += 4) {
        data[i] += level;
        data[i + 1] += level;
        data[i + 2] += level;
    }

    this.putImageData(image, 0, 0);
}