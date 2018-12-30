(_ => {
    const init = _ => {
        console.log('[LOG] Initializing');

        // method
        const getTimeStamp = _ => new Date().getTime();

        const getDistance = (r, x, y, x2, y2) => Math.pow(x - x2, 2) + Math.pow(y - y2, 2) < r * r;

        const destroyBullets = type => {
            bullets.map((data, id) => {
                if (data.type == type) data.disappear = 1;
            });
        };

        // Variables
        /* const */ canvas = document.getElementById('game');
        /* const */ context = canvas.getContext('2d');
        const bootedTime = getTimeStamp();
        const fps = 1000 / 30;
        let height = 512;
        let width = 512;

        canvas.height = height;
        canvas.width = width;

        const myself = {
            body: new Player({x: 255, y: 480, size: 300}),

            shot: {
                interval: 120,
                timestamp: getTimeStamp()
            },

            speed: 7,
            shift: 4,
            alive: true
        }

        const center = {
            x: width / 2,
            y: height / 2
        };

        const gameTick = {
            stage: 0,
            frame: 0,
            steps: 0,

            boss: false,
            ready: false,
            addLastEnemy: false,

            pause: {
                status: false,
                time: getTimeStamp()
            },

            data: {
                frame: 0,
                onLoaded: false
            }
        };

        const guiStatus = {
            frame: 600,
            brightness: -6,
            bgAlpha: 0.22,
            shift: false,

            frames: [
                {size: 800, goto: 220, vertex: 5, direction: 270, accelSpeed: 4, steps: [0]},
                {size: 800, goto: 250, vertex: 5, direction: 270, accelSpeed: 5, steps: [0]},
                {size: 800, goto: 280, vertex: 5, direction: 270, accelSpeed: 6, steps: [0]},
                {size: 800, goto: 230, vertex: 5, direction: 270, accelSpeed: 4, steps: [0], color: '#26afff'},
                {size: 800, goto: 260, vertex: 5, direction: 270, accelSpeed: 5, steps: [0], color: '#26afff'},
                {size: 800, goto: 290, vertex: 5, direction: 270, accelSpeed: 6, steps: [0], color: '#26afff'},
                {size: 700, goto: 490, vertex: 4, direction: 0, accelSpeed: 8, steps: [2], color: '#26afff'},
                {size: 700, goto: 460, vertex: 4, direction: 0, accelSpeed: 7, steps: [2]},
                {size: 700, goto: 450, vertex: 4, direction: 0, accelSpeed: 6, steps: [2]},
                {size: 700, goto: 440, vertex: 4, direction: 0, accelSpeed: 5, steps: [2]},
            ]
        };

        /* const */ boss = {
            hp: null,
            maxHp : null,
            pattern: null,
            init: _ => {
                boss.maxHp = 100;
                boss.hp = boss.maxHp;
                boss.pattern = [];
                gameTick.boss = true;
            }
        }

        let score = 0;
        let gameTitleAlpha = 1;
        let isBackground = false;

        let keyBuffer = [];
        let startDelay = 0;

        let loadDatas = 6;
        let loadDatasSplit = 100 / loadDatas;

        let imageBackground = new Image();
        imageBackground.onload = _ => gameTick.data.onLoaded += loadDatasSplit;
        imageBackground.src = 'img/background-min.png';

        let audios = new Array(loadDatas - 1).fill(0).map(_ => new Audio());
        let audiosPacket = new Array(audios.length).fill(false);
        ['normalBGM', 'negativeBGM', 'pauseBGM', 'impactSE', 'hitSE'].map((path, index) => audios[index].src = `audio/${path}.mp3`);
        [0.92, 0.34, 0.18, 0.86, 0.2].map((value, index) => audios[index].volume = value);

        audios.map(audio => {
            audio.load();
            audio.preload = 'none';
            audio.loop = true;
        });

        audios[3].loop = false;
        audios[4].loop = false;

        let enemyDataset = null;
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = _ => {
            if (xhr.readyState == 4) {
                let json = JSON.parse(xhr.responseText);
                enemyDataset = json;
            }
        };

        xhr.open('GET', './json/enemy.json');
        xhr.send(null);

        const enemies = [];
        const bullets = [];

        window.onGlitch = true;
        window.negative = false;
        window.gameLoop = null;

        const gameTitle = alpha => {
            let beforeAlpha = context.globalAlpha;
            if (alpha !== undefined) context.globalAlpha = alpha;

            context.text({x: center.x, y: 187, bold: 2, color: '#23a8ff', text: 'AURA', px: 230});
            context.text({x: center.x, y: 180, bold: 2, text: 'AURA', px: 230});
            context.text({x: center.x, y: center.y + 82, color: '#1073b3', text: 'HOLD Z KEY', font: 'Haettenschweiler', px: 15});
            context.text({x: center.x, y: center.y + 80, text: 'HOLD Z KEY', font: 'Haettenschweiler', px: 15});
            context.line({x: center.x - startDelay * 3, y: center.y + 90, x2: center.x + startDelay * 3, y2: center.y + 90, bold: 1});

            if (alpha !== undefined) context.globalAlpha = beforeAlpha;
            context.glitch({x: 0, y: 0, width, height, level: startDelay * 3.2});
            context.glitch({x: 0, y: 0, width, height, level: 2 + startDelay * 2.7 + (Math.random() * (2 * (startDelay + 0.3))) >> 0, type: 'box'});
        };

        const gameControll = _ => {
            switch (gameTick.stage) {
                case 0:
                    if (gameTick.ready) {
                        let bool = keyBuffer[90] == 1 && gameTick.frame > 50;
                        startDelay += -0.63 * (1 - bool * 2);
                        startDelay = startDelay < 0 ? 0 : startDelay;

                        if (startDelay > 15) {
                            gameTick.steps = 2;
                            audios[0].play();
                            updateStage();
                        }
                    }
                    break;

                case 1:
                    gameTitleAlpha += -gameTitleAlpha / 8;
                    startDelay += -startDelay / 13;

                    if (gameTitleAlpha < 0.1 && startDelay < 0.1) {
                        gameTitleAlpha = 0;
                        startDelay = 0;
                        updateStage();
                    }
                    break;

                default:
                    let enemyBullets = 0;
                    bullets.map(data => enemyBullets += data.type || 0);
                    if (enemies.length == 0 && enemyBullets == 0 && gameTick.stage < 10) {
                        console.log('[LOG] Reflesh all bullets');
                        updateStage();
                    }
                    break;
            }
        };

        const updateStage = _ => {
            if (gameTick.stage > 0) {
                console.log(`[LOG] Setup ID:${gameTick.stage}`);
                gameTick.addLastEnemy = false;

                let calc = (formula, regexp, replace, trace) => {
                    let stack = `${formula}`.replace(regexp, replace);
                    return trace ? stack : Function(`return ${stack}`)();
                }

                if (enemyDataset[gameTick.stage] != undefined) {
                    let limit = 0; // 個数制限（デバッグ用）0でオフ
                    enemyDataset[gameTick.stage].map((data, index, array) => {
                        if (limit && limit <= index) return;
                        let delay = data.delay; // 発生までのミリあセカンド
                        let isLast = array.length - 1 == limit || array.length; // 最後が否か

                        let x = null;
                        let y = null;
                        let dx = data.dx || 0;
                        let dy = data.dy || 0;
                        let id = data.id || 0;

                        if (data.repeat != undefined) {
                            for (let i = 0, l = data.repeat; i < l; i ++) {
                                x = calc(data.x, /c(enter)?x/gi, center.x, true);
                                y = calc(data.y, /c(enter)?y/gi, center.y, true);
                                x = calc(x, /max/gi, width, true);
                                y = calc(y, /max/gi, height, true);
                                x = calc(x, /i/gi, i);
                                y = calc(y, /i/gi, i);

                                delay = data.delay;
                                delay = calc(delay, /i/gi, i);
                                enemies.push({body: new Enemy({x, y, dx, dy, id, disable: true}), delay, isLast: l - 1 == i ? isLast : false});
                            }
                        } else {
                            x = calc(data.x, /c(enter)?x/gi, center.x);
                            y = calc(data.y, /c(enter)?y/gi, center.y);
                            x = calc(x, /max/gi, width, true);
                            y = calc(y, /max/gi, height, true);

                            enemies.push({body: new Enemy({x, y, x, dy, id, disable: true}), delay, isLast});
                        }
                    });
                }
            }

            enemies.map(data => data.time = getTimeStamp());
            gameTick.stage ++;
        };

        const loadingShape = _ => {
            context.shape({
                x: center.x, y: center.y,
                d: Math.sin((gameTick.frame * 9).toRadian()) * 36, r: 64, v: 7, bold: 1
            });

            context.shape({
                x: center.x, y: center.y,
                d: Math.sin((gameTick.frame * 9).toRadian()) * -36, r: 64, v: 7, bold: 1
            });
        };

        const gameGui = _ => {
            // context.globalCompositeOperation = 'destination-over';

            if (guiStatus.frame - 480 > 0.1) {
                guiStatus.frame += (480 - guiStatus.frame) / 12;

                if (guiStatus.frame - 480 < 0.1) {
                    guiStatus.frame = 480;
                }
            }

            if (guiStatus.shift) {
                context.circle({x: myself.body.x, y: myself.body.y, r: 3, color: '#2e2e2e'});
                context.circle({x: myself.body.x, y: myself.body.y, r: 4, bold: 0.7});
            }

            context.text({x: center.x, y: height - 5, text: `0000000000${score}`.slice(-10), font: 'Haettenschweiler', px: 11});

            if (gameTick.boss) {
                let top = 10;
                let bold = 20;
                let length = 280;
                let y = top + bold;
                let dx = length / boss.maxHp * boss.hp;
                let leftX = center.x - length / 2;
                let rightX = center.x + length / 2;

                context.beginPath();
                context.lineWidth = bold;
                context.strokeStyle = '#f6f6f6';

                context.lineCap = 'round';
                context.moveTo(leftX, y);
                context.lineTo(rightX, y);
                context.stroke();

                context.beginPath();
                context.strokeStyle = '#310606';
                context.lineWidth = bold / 1.2;

                context.moveTo(leftX, y);
                context.lineTo(leftX + dx, y);
                context.stroke();
            }

            if (gameTick.pause.status) {
                context.globalAlpha = 0.4;
                context.fillStyle = '#141415';
                context.fillRect(0, 0, width, height);

                context.globalAlpha = 0.92;
                loadingShape();

                context.text({x: center.x, y: center.y - 90, text: 'BREAK DOWN', font: 'Haettenschweiler', px: 15});
                context.text({x: center.x, y: center.y + 100, text: `${(getTimeStamp() - bootedTime) * 255}`, font: 'Haettenschweiler', px: 15});
                context.text({x: center.x, y: center.y + 10, text: `WAVE${gameTick.stage < 2 ? 1 : gameTick.stage - 1}`, font: 'Haettenschweiler', px: 20});

                // if (gameTick.pause.status) context.gray();
            }

            // context.globalCompositeOperation = 'source-over';
        };

        const audioSwitch = _ => {
            let playId = 0;
            if (negative) playId = 1;
            if (gameTick.pause.status) playId = 3;

            audios.map((data, index) => {
                if (index != playId) {
                    data.pause();
                }
            });

            if (!audios[playId].loop) {
                audios[playId].pause();
                audios[playId].currentTime = 0;
            }

            audios[playId].play();
        };

        /* const */ negativeSwitch = _ => {
            negative = !negative;
            audioSwitch();
        }

        const addScore = id => {
            switch (id) {
                case 0:
                    score += 100;
                    break;

                case 1:
                    score += 250;
                    break;

                case 2:
                    score += 200;
                    break;
            }
        };

        const addEnemyShot = enemy => {
            let id = enemy.id;
            let x = enemy.x;
            let y = enemy.y;

            let speed = null;
            let theta = null;
            let mdx = null;
            let mdy = null;
            let adx = null;
            let ady = null;
            let dx = null;
            let dy = null;

            switch (id) {
                case 0:
                    speed = 3.2;
                    bullets.push(new Bullet({x, y: y + 15, dx: 0.8, dy: speed, adx: 0.1, ady: 0.2, type: 1}));
                    bullets.push(new Bullet({x, y: y + 15, dx: -0.8, dy: speed, adx: -0.1, ady: 0.2, type: 1}));
                    break;

                case 1:
                    let add = (dx, dy) => {
                        mdx = dx * 0.3;
                        mdy = dy * 0.3;
                        adx = dx * -0.02;
                        ady = dy * -0.02;
                        bullets.push(new Bullet({x, y: y + 15, dx, dy, adx, ady, mdx, mdy, type: 1}));
                    };

                    speed = 9;
                    theta = Math.atan2((y + 256) - (myself.body.y + 256), (x + 256) - (myself.body.x + 256)).toDegree();
                    add(Math.cos((theta + 180).toRadian()) * speed, Math.sin((theta + 180).toRadian()) * speed);
                    add(Math.cos((theta + 185).toRadian()) * speed, Math.sin((theta + 185).toRadian()) * speed);
                    add(Math.cos((theta + 175).toRadian()) * speed, Math.sin((theta + 175).toRadian()) * speed);
                    break;

                case 2:
                    speed = 2.3;
                    bullets.push(new Bullet({x, y, dx: 0, dy: speed, type: 1}));
                    bullets.push(new Bullet({x, y, dx: 0, dy: -speed, type: 1}));
                    bullets.push(new Bullet({x, y, dx: speed, dy: 0, type: 1}));
                    bullets.push(new Bullet({x, y, dx: -speed, dy: 0, type: 1}));
                    break;

                case 3:
                    theta = Math.atan2((y + 256) - (myself.body.y + 256), (x + 256) - (myself.body.x + 256)).toDegree();
                    for (let i = 0; i < 5; i ++) {
                        dx = Math.cos((theta + 180).toRadian()) * ((i + 1) * 2);
                        dy = Math.sin((theta + 180).toRadian()) * ((i + 1) * 2);
                        bullets.push(new Bullet({x, y, dx, dy, type: 1}));
                    }
                    break;
            }
        };

        document.oncontextmenu = _ => false;

        document.addEventListener('webkitvisibilitychange', _ => {
            isBackground = document.webkitHidden;
            keyBuffer[27] = isBackground && !gameTick.pause.status >> 0;
        });

        document.addEventListener('keydown', event => keyBuffer[event.keyCode] = 1);

        document.addEventListener('keyup', event => keyBuffer[event.keyCode] = 0);

        canvas.addEventListener('mousemove', event => {
            let rect = canvas.getBoundingClientRect();
            let x = event.clientX - rect.left;
            let y = event.clientY - rect.top;
        });

        const main = _ => {
            gameTick.frame ++;

            let alpha = 0;
            gameControll();

            context.beginPath();
            context.globalAlpha = 1;
            context.fillStyle = '#141415';
            context.fillRect(0, 0, width, height);

            if (gameTick.ready) {
                alpha = gameTick.frame / 90;
                context.globalAlpha = alpha > guiStatus.bgAlpha ? guiStatus.bgAlpha : alpha;
                context.drawImage(imageBackground, -960, gameTick.frame % 1080);
                context.drawImage(imageBackground, -960, -1080 + gameTick.frame % 1080);
            }

            context.globalAlpha = 1;
            guiStatus.frames.map(data => {
                if (data.steps.includes(gameTick.steps)) {
                    let color = data.color || '#e3e3e1';
                    context.shape({x: center.x, y: center.y, r: data.size, v: data.vertex, d: data.direction, bold: 0.5, color});
                    data.size += (data.goto - data.size) / data.accelSpeed;
                }
            });

            if (gameTick.ready) {
                alpha *= 1.6;
                context.globalAlpha = alpha > 1 ? 1 : alpha;
                myself.body.size += (17 - myself.body.size) / 8;
                myself.body.draw(context);

                if (alpha > 1) {
                    gameTitle(gameTitleAlpha);
                } else {
                    gameTitle();
                }

                if (gameTick.stage > 0) {
                    let timeStamp = getTimeStamp();
                    let shift = keyBuffer[16] == 1;
                    guiStatus.shift = shift;

                    if (keyBuffer[27] || keyBuffer[80]) {
                        keyBuffer[27] = 0;
                        keyBuffer[80] = 0;

                        if (getTimeStamp() - gameTick.pause.time > 600 || isBackground) {
                            gameTick.pause.status = !gameTick.pause.status;

                            if (!gameTick.pause.status) {
                                let diffTimeStamp = timeStamp - gameTick.pause.time;
                                enemies.map(data => {
                                    if (data.body.disable) data.time += diffTimeStamp;
                                });
                            } else {
                                keyBuffer.fill(0);
                            }

                            gameTick.pause.time = timeStamp;
                            audioSwitch();
                        }
                    }

                    // 描画
                    bullets.map(data => data.draw(context));
                    enemies.map(data => {
                        if (data.body.disable) {
                            data.body.disable = !(!gameTick.pause.status && timeStamp - data.time > data.delay);
                        } else {
                            data.body.draw(context, gameTick.pause.status);
                            if (data.isLast && !gameTick.addLastEnemy) {
                                gameTick.addLastEnemy = true;
                            }
                        }
                    });

                    gameGui();

                    if (!gameTick.pause.status) {
                        let speed = myself.speed - myself.shift * shift;
                        let dx = ((keyBuffer[39] || 0) - (keyBuffer[37] || 0)) * speed;
                        let dy = ((keyBuffer[40] || 0) - (keyBuffer[38] || 0)) * speed;
                        myself.body.move(dx, dy);

                        let fix = 15;
                        if (fix > myself.body.x)  myself.body.x = fix;
                        if (width - fix < myself.body.x)  myself.body.x = width - fix;
                        if (fix > myself.body.y) myself.body.y = fix;
                        if (height - fix < myself.body.y) myself.body.y = height - fix;

                        if (keyBuffer[90] && getTimeStamp() - myself.shot.timestamp > myself.shot.interval) {
                            let speed = 1.2;
                            let length = 14.2;
                            bullets.push(new Bullet({x: myself.body.x, y: myself.body.y - 20, dx: 0, dy: -length * speed}));
                            bullets.push(new Bullet({x: myself.body.x + 0.3, y: myself.body.y - 20, dx: 0.6 - 0.3 * shift, dy: -length * speed}));
                            bullets.push(new Bullet({x: myself.body.x - 0.3, y: myself.body.y - 20, dx: -0.6 + 0.3 * shift, dy: -length * speed}));
                            myself.shot.timestamp = getTimeStamp();
                        }

                        bullets.map(data => data.update(getTimeStamp()));

                        enemies.map(data => {
                            if (!data.body.disable) {
                                data.body.update();
                                if (data.body.shot.tick == 0) addEnemyShot(data.body);
                            }
                        });

                        let isHitEnemy = false;
                        bullets.map((bullet, bulletID) => {
                            if (bullet.disappear < 0) return;

                            let x = bullet.x;
                            let y = bullet.y;
                            if (bullet.type) {
                                // enemiy's bullet
                                if (myself.alive && getDistance(6, x, y, myself.body.x, myself.body.y)) {
                                    bullets[bulletID].disappear = 2;
                                    // console.log('いたいよ😢😢');
                                    canvas.rotate(9, 2.4, 33);
                                }
                            } else {
                                // player's bullet
                                enemies.map((enemy, enemyID) => {
                                    if (enemy.body.disappear != 0) return;

                                    if (getDistance(enemy.body.hitArea, x, y, enemy.body.x, enemy.body.y)) {
                                        bullets[bulletID].disappear = 2;
                                        enemies[enemyID].body.hp --;

                                        if (enemies[enemyID].body.hp < 0) {
                                            isHitEnemy = true;
                                            addScore(enemy.body.id);
                                            enemies[enemyID].body.disappear = 1;
                                        }
                                    }
                                });
                            }
                        });

                        if (isHitEnemy) {
                            audios[4].pause();
                            audios[4].currentTime = 0;
                            audios[4].play();
                        }

                        // aura
                        enemies.map(data => {
                            if (data.body.aura != undefined) {
                                let body = data.body;
                                if (getDistance(body.aura, body.x, body.y, myself.body.x, myself.body.y)) {
                                    // console.log('[DEBUG]\n私のオーラに触れたな…\n貴様の体は只では済まない…');
                                }
                            }
                        });

                        bullets.map((data, index) => {
                            if (data.disappear == 2) bullets.splice(index, 1);
                        });

                        enemies.map((data, index) => {
                            if (data.body.disappear == 2) enemies.splice(index, 1);
                        });

                        if (gameTick.addLastEnemy && enemies.length == 0) {
                            setTimeout(_ => destroyBullets(1), 900);
                            gameTick.addLastEnemy = false;
                        }

                        // context.glitch({x: 0, y: 0, width, height, level: 50});
                    } else {
                        context.noise({x: 0, y:0, width, height, level: 13, gray: true, alpha: 10});
                        context.glitch({x: 0, y: 0, width, height, level: 6});
                        context.glitch({x: 0, y: 0, width, height, level: 35, type: 'box'});
                    }
                } else {
                    for (let i = 0; i < 4; i++) {
                        let fix = (i + 1) * 23;
                        let x = (Math.random() * width) >> 0;
                        let y = (Math.random() * height) >> 0;
                        let w = (Math.random() * (width - x - fix)) >> 0;
                        let h = (Math.random() * (height - y - fix)) >> 0;
                        let level = 20 + (Math.random() * 40) >> 0;
                        context.glitch({x, y, width: w, height: h, level});
                    }
                    // console.log('test');
                }
            } else {
                // context.globalCompositeOperation = 'lighter'; // test
                if (gameTick.data.frame < 10 && Math.random() < 0.5) {
                    // context.globalCompositeOperation = ['xor', 'destination-over'].random();
                    context.globalCompositeOperation = 'xor';
                } else {
                    context.globalCompositeOperation = 'source-over';
                }

                loadingShape();
                let barSize = 160;
                let parsent = -0.8 + gameTick.data.onLoaded / 50;
                parsent = parsent > 1 ? 1 : parsent;

                let fx = [-1, parsent, parsent, -1].map(x => x * barSize);
                context.shape({x: center.x, y: center.y + 128, d: 45, r: 22, v: 4, fx});

                fx = new Array(4).fill(0).map((...x) => (barSize + 5) * [-1, 1, 1, -1][x[1]]);
                context.shape({x: center.x, y: center.y + 128, d: 45, r: 24, v: 4, bold: 2, fx, fy: [2, 2, -2, -2]});

                if (parsent == 1) {
                    gameTick.data.frame += 0.23; // speed
                    if (Math.random() > 0.4) context.text({x: center.x, y: center.y + 180, text: 'Completed!', font: 'Haettenschweiler', px: 18});

                    context.globalAlpha = gameTick.data.frame / 11;
                    context.beginPath();
                    context.fillStyle = '#141415';
                    context.fillRect(0, 0, width, height);

                    if (gameTick.data.frame > 30) {
                        gameTick.steps = 1;
                        gameTick.frame = 0;
                        gameTick.ready = true;
                        console.log('[LOG] Booted Ready');
                    }
                } else {
                    if (Math.random() > 0.45) context.text({x: center.x, y: center.y + 180, text: 'Loading', font: 'Haettenschweiler', px: 18});

                    audios.map((audio, index) => {
                        if (!audiosPacket[index] && audio.readyState == 4) {
                            gameTick.data.onLoaded += loadDatasSplit;
                            audiosPacket[index] = true;
                        }
                    });
                }
            }

            if (negative) context.negative({x: 0, y: 0, width, height});
            if (guiStatus.brightness != 0) context.lightness(guiStatus.brightness);
            if (gameTick.pause.status) context.gray();

            // test glitch RGB
            context.glitch({x: 0, y: 0, width, height, level: gameTick.ready ? 4 : 10});
            context.glitch({x: 0, y: 0, width, height, level: gameTick.stage > 0 ? 9 : 14, type: 'line'});
        };

        const proposal = document.getElementById('proposal');
        const gameArea = document.getElementById('game-area');
        const goButton = document.getElementById('go-button');
        const goContent = document.getElementById('go-content');

        setTimeout(_ => {
            proposal.classList.add('feed-in');
            goContent.classList.add('feed-in');

            goButton.addEventListener('click', _ => {
                goContent.style.pointerEvents = 'none';
                proposal.classList.remove('feed-in');
                goContent.classList.remove('feed-in');

                proposal.classList.add('feed-out');
                goContent.classList.add('feed-out');

                setTimeout(_ => {
                    onGlitch = document.getElementById('glitch').checked;
                    gameArea.classList.add('feed-in');
                    setTimeout(_ => {
                        gameArea.style.opacity = 1;
                        gameArea.classList.remove('feed-in');
                        setTimeout(_ => gameLoop = setInterval(main, fps), 300);
                    }, 1000);
                }, 1000);
            });
        }, 700);
    };

    window.onload = init;
})();