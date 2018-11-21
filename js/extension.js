// Number method

Number.prototype.toDegree = function () {
    return this * (180 / Math.PI);
};

Number.prototype.toRadian = function () {
    return this * (Math.PI / 180);
}

// Array method

Array.prototype.last = function () {
    return this[this.length - 1];
}

Array.prototype.random = function (getIndex) {
    let index = (Math.random() * this.length) >> 0;
    return getIndex ? index : this[index];
}

Array.prototype.shuffle = function (status) {
    let range = status.range || 10;
    let keep = status.keep;
    let stack = null;

    if (keep) {
        stack = [];
        this.map(value => stack.push(value));
    }

    for (let i = 0; i < range; i ++) {
        let a = this.random(true);
        let b = this.random(true);

        if (keep) {
            [stack[a], stack[b]] = [stack[b], stack[a]];
        } else {
            [this[a], this[b]] = [this[b], this[a]];
        }
    }

    return keep ? stack : this;
}