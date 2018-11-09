(function () {
    const init = _ => {
        console.log('[LOG] Initializing');

        // Usefull method
        const getTimeStamp = _ => new Date().getTime();

        const getDistance = (r, x, y, x2, y2) => Math.pow(x - x2, 2) + Math.pow(y - y2, 2) < r * r;

        // Variables
        const bootedTime = getTimeStamp();
        const fps = 1000 / 30;

        /* const */ canvas = document.getElementById('game');
        /* const */ context = canvas.getContext('2d');

        let height = 512;
        let width = 512;

        canvas.height = height;
        canvas.width = width;

        let myself = {
            body: new Player({
                x: 255, y: 480,
                size: 100
            }),

            shot: {
                interval: 230,
                timestamp: getTimeStamp()
            },

            speed: 4.5
        }

        let center = {
            x: width / 2,
            y: height / 2
        };

        let gameTick = {
            stage: 0,
            frame: 0,
            ready: false,

            pause: {
                status: false,
                time: getTimeStamp()
            },

            data: {
                onLoaded: false,
                frame: 0
            }
        };

        let guiStatus = {
            frame: 600
        };

        let isBackground = false;

        let gameTitleAlpha = 1;
        let score = 0;

        let keyBuffer = [];
        let startDelay = 0;

        let loadDatas = 5;
        let loadDatasSplit = 100 / loadDatas;

        let imageBackground = new Image();
        imageBackground.onload = _ => gameTick.data.onLoaded += loadDatasSplit;
        imageBackground.src = 'img/background-min.png';

        let audios = new Array(loadDatas - 1).fill(0).map(_ => new Audio());
        let audiosPacket = new Array(audios.length).fill(false);

        ['normalBGM', 'negativeBGM', 'pauseBGM', 'impactSE'].map((path, index) => audios[index].src = `audio/${path}.mp3`);
        [0.92, 0.34, 0.18, 0.86].map((value, index) => audios[index].volume = value);

        audios.map(audio => {
            audio.preload = 'none';
            audio.load();

            audio.loop = true;
        });

        audios[3].loop = false;

        let enemies = [];
        let bullets = [];

        window.negative = false;
        window.gameLoop = null;

        document.addEventListener('keydown', event => {
            keyBuffer[event.keyCode] = 1;
        });

        document.addEventListener('keyup', event => {
            keyBuffer[event.keyCode] = 0;
        });

        const gameTitle = (alpha) => {
            let beforeAlpha = context.globalAlpha;

            if (alpha !== undefined) {
                context.globalAlpha = alpha;
            }

            context.text({
                x: center.x, y: 185,
                bold: 1, color: '#1073b3',
                text: 'AURA', px: 230
            });

            context.text({
                x: center.x, y: 180,
                bold: 1, text: 'AURA', px: 230
            });

            context.text({
                x: center.x, y: center.y + 82, color: '#1073b3',
                text: 'HOLD Z KEY', font: 'Haettenschweiler', px: 15
            });

            context.text({
                x: center.x, y: center.y + 80,
                text: 'HOLD Z KEY', font: 'Haettenschweiler', px: 15
            });

            context.line({
                x: center.x - startDelay * 3, y: center.y + 90,
                x2: center.x + startDelay * 3, y2: center.y + 90,
                bold: 1
            });

            if (alpha !== undefined) {
                context.globalAlpha = beforeAlpha;
            }

            context.glitch({
                x: 0, y: 0,
                width, height,
                level: 0 + (-0.63 + startDelay) * 0.86
            });
        };

        const gameControll = _ => {
            switch (gameTick.stage) {
                case 0:
                    if (gameTick.ready) {
                        let bool = keyBuffer[90] == 1 && gameTick.frame > 50;

                        startDelay += -0.63 * (1 - bool * 2);
                        startDelay = startDelay < 0 ? 0 : startDelay;

                        if (startDelay > 15) {
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
                    if (enemies.length == 0 && gameTick.stage < 10) {
                        console.log('OK');
                        updateStage();
                    }
                    break;
            }
        };

        const updateStage = _ => {
            if (gameTick.stage > 0) {
                console.log(`[LOG] Setup ID:${gameTick.stage}`);
                enemies = [];

                gameTick.wave = 0.1;
            }

            // 敵のセット
            switch (gameTick.stage) {
                case 1:
                    for (let i = 0; i < 3; i ++) {
                        enemies.push({
                            body: new Enemy({
                                x: center.x - 100, y: -10,
                                id: 0, dy: 4,
                                disable: true
                            }), // ここに敵のオブジェクト
                            delay: 1200 + i * 2500 // 発生までのミリあセカンド
                        });

                        enemies.push({
                            body: new Enemy({
                                x: center.x + 100, y: -10,
                                id: 0, dy: 4,
                                disable: true
                            }),
                            delay: 8400 + i * 2500
                        });
                    }
                    break;

                case 2:
                    console.log('CALL!');
                    enemies.push({
                        body: new Enemy({
                            x: center.x, y: -10,
                            id: 1, dy: 4,
                            disable: true
                        }),
                        delay: 1500
                    })
                    break;
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
            if (guiStatus.frame - 480 > 0.1) {
                guiStatus.frame += (480 - guiStatus.frame) / 12;

                if (guiStatus.frame - 480 < 0.1) {
                    guiStatus.frame = 480;
                }
            }

            context.shape({
                x: center.x, y: center.y,
                d: 0, r: guiStatus.frame, v: 4,
                bold: 0.5
            });

            context.text({
                x: center.x, y: height - 5,
                text: `0000000000${score}`.slice(-10), font: 'Haettenschweiler', px: 11
            });

            if (gameTick.pause.status) {
                context.globalAlpha = 0.4;
                context.fillStyle = '#1c1c1e';
                context.fillRect(0, 0, width, height);

                context.globalAlpha = 0.92;

                loadingShape();

                context.text({
                    x: center.x, y: center.y - 80,
                    text: 'BREAK DOWN', font: 'Haettenschweiler', px: 15
                });

                context.text({
                    x: center.x, y: center.y + 90,
                    text: `${(getTimeStamp() - bootedTime) * 255}`, font: 'Haettenschweiler', px: 15
                });

                context.text({
                    x: center.x, y: center.y + 10,
                    text: `WAVE${gameTick.stage < 2 ? 1 : gameTick.stage - 1}`, font: 'Haettenschweiler', px: 20
                });
            }
        };

        const audioSwitch = _ => {
            let playId = 0;

            if (negative) {
                playId = 1;
            }

            if (gameTick.pause.status) {
                // playId = 2;
                playId = 3;
            }

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
            }
        };

        const addEnemyShot = enemy => {
            let id = enemy.id;
            let x = enemy.x;
            let y = enemy.y;

            switch (id) {
                case 0:
                    bullets.push(new Bullet({
                        x, y: y + 15,
                        dx: 1.3, dy: 7,
                        adx: 0.1, type: 1
                    }));

                    bullets.push(new Bullet({
                        x, y: y + 15,
                        dx: -1.3, dy: 7,
                        adx: -0.1, type: 1
                    }));
                    break;
            }
        };

        // events
        document.addEventListener('webkitvisibilitychange', _ => {
            isBackground = document.webkitHidden;
            keyBuffer[27] = isBackground && !gameTick.pause.status >> 0;
        });

        // main loop
        const main = _ => {
            gameTick.frame ++;

            gameControll();

            context.beginPath();
            context.globalAlpha = 1;
            context.fillStyle = '#1c1c1e';
            context.fillRect(0, 0, width, height);

            if (gameTick.ready) {
                // Gaming
                let alpha = gameTick.frame / 90;
                context.globalAlpha = alpha > 0.19 ? 0.19 : alpha;
                
                context.drawImage(imageBackground, -960, gameTick.frame % 1080);
                context.drawImage(imageBackground, -960, -1080 + gameTick.frame % 1080);

                alpha *= 1.6;
                context.globalAlpha = alpha > 1 ? 1 : alpha;

                myself.body.size += (15 - myself.body.size) / 8;
                myself.body.draw(context);

                if (alpha > 1) {
                    gameTitle(gameTitleAlpha);
                } else {
                    gameTitle();
                }

                if (gameTick.stage > 0) {
                    let timeStamp = getTimeStamp();

                    // (!gameTick.pause.status && enemies.length > 0 && enemies[0].body.shot.tick == 0)
                    if (keyBuffer[27] || keyBuffer[80]) {
                        keyBuffer[27] = 0;
                        keyBuffer[80] = 0;

                        // Pause switch
                        if (getTimeStamp() - gameTick.pause.time > 600 || isBackground) {
                            gameTick.pause.status = !gameTick.pause.status;

                            if (!gameTick.pause.status) {
                                let diffTimeStamp = timeStamp - gameTick.pause.time;
                                console.log(diffTimeStamp);

                                enemies.map(data => {
                                    if (data.body.disable) {
                                        data.time += diffTimeStamp;
                                    }
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
                            data.body.draw(context);
                        }
                    });

                    gameGui();

                    if (!gameTick.pause.status) {
                        // プレイヤー移動
                        let dx = ((keyBuffer[39] || 0) - (keyBuffer[37] || 0)) * myself.speed;
                        let dy = ((keyBuffer[40] || 0) - (keyBuffer[38] || 0)) * myself.speed;

                        myself.body.move(dx, dy);

                        let fix = 15;

                        if (fix > myself.body.x) {
                            myself.body.x = fix;
                        }

                        if (width - fix < myself.body.x) {
                            myself.body.x = width - fix;
                        }

                        if (fix > myself.body.y) {
                            myself.body.y = fix;
                        }

                        if (height - fix < myself.body.y) {
                            myself.body.y = height - fix;
                        }

                        // 弾
                        if (keyBuffer[90] && getTimeStamp() - myself.shot.timestamp > myself.shot.interval) {
                            let length = 14;

                            // 追加
                            bullets.push(new Bullet({
                                x: myself.body.x, y: myself.body.y - 25,
                                dx: 0, dy: -length
                            }));

                            bullets.push(new Bullet({
                                x: myself.body.x - 0.3, y: myself.body.y - 25,
                                dx: -0.3, dy: -length
                            }));

                            bullets.push(new Bullet({
                                x: myself.body.x + 0.3, y: myself.body.y - 25,
                                dx: 0.3, dy: -length
                            }));

                            myself.shot.timestamp = getTimeStamp();
                        }

                        // 更新
                        bullets.map(data => data.update());
                        
                        enemies.map(data => {
                            if (!data.body.disable) {
                                data.body.update();

                                if (data.body.shot.tick == 0) {
                                    addEnemyShot(data.body);
                                }
                            }
                        });

                        // 当たり判定
                        bullets.map((bullet, bulletID) => {
                            if (bullet.disappear < 0) return;
                            let x = bullet.x;
                            let y = bullet.y;

                            if (bullet.type) {
                                // enemiy's bullet
                                if (getDistance(6, x, y, myself.body.x, myself.body.y)) {
                                    bullets[bulletID].disappear = 2;
                                    // console.log('HIT PLAYER!');
                                }
                            } else {
                                // player's bullet
                                enemies.map((enemy, enemyID) => {
                                    if (enemy.body.disappear != 0) return;
    
                                    if (getDistance(enemy.body.hitArea, x, y, enemy.body.x, enemy.body.y)) {
                                        bullets[bulletID].disappear = 2;
                                        enemies[enemyID].body.hp --;
    
                                        if (enemies[enemyID].body.hp < 0) {
                                            addScore(enemy.body.id);
                                            enemies[enemyID].body.disappear = 1;
                                        }
                                    }
                                });
                            }
                        });

                        // aura
                        enemies.map(data => {
                            if (data.body.aura != undefined) {
                                let body = data.body;
                                if (getDistance(body.aura, body.x, body.y, myself.body.x, myself.body.y)) {
                                    console.log('[DEBUG]\n私のオーラに触れたな…\n貴様の体は只では済まない…');
                                }
                            }
                        });

                        // 削除
                        bullets.map((data, index) => {
                            if (data.disappear == 2) {
                                bullets.splice(index, 1);
                            }
                        });

                        enemies.map((data, index) => {
                            if (data.body.disappear == 2) {
                                enemies.splice(index, 1);
                            }
                        });
                    } else {
                        context.noise({
                            x: 0, y:0,
                            width, height,
                            level: 30, gray: true,
                            alpha: 13
                        });

                        context.glitch({
                            x: 0, y: 0,
                            width, height,
                            level: 5.6
                        });
                    }
                }
            } else {
                // Loading
                loadingShape();

                let barSize = 160;
                let parsent = -0.8 + gameTick.data.onLoaded / 50;
                parsent = parsent > 1 ? 1 : parsent;

                context.shape({
                    x: center.x, y: center.y + 128, d: 45, r: 22, v: 4,
                    fx: [-1, parsent, parsent, -1].map(x => x * barSize)
                });

                if (parsent == 1) {
                    gameTick.data.frame += 0.5;

                    if (Math.random() > 0.6) {
                        context.text({
                            x: center.x, y: center.y + 180,
                            text: 'Completed', font: 'Haettenschweiler', px: 18
                        });
                    }

                    context.globalAlpha = gameTick.data.frame / 11;
                    
                    context.beginPath();
                    context.fillStyle = '#1c1c1e';
                    context.fillRect(0, 0, width, height);

                    if (gameTick.data.frame > 30) {
                        gameTick.frame = 0;
                        gameTick.ready = true;

                        console.log('[LOG] Booted Ready');
                    }
                } else {
                    audios.map((audio, index) => {
                        if (!audiosPacket[index] && audio.readyState == 4) {
                            gameTick.data.onLoaded += loadDatasSplit;
                            audiosPacket[index] = true;
                        }
                    });
                }
            }

            if (negative) {
                context.negative({
                    x: 0, y: 0,
                    width, height
                });
            }

            // fix lightness
            context.lightness(3, canvas);
        };

        gameLoop = setInterval(main, fps);
    };

    window.onload = init;
})();