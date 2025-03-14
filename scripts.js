const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://flap-it-lawin.vercel.app/assets/tonconnect-manifest.json',
    buttonRootId: 'ton-connect'
});

async function connectToWallet() {
    const connectedWallet = await tonConnectUI.connectWallet();
    console.log(connectedWallet);
}

connectToWallet().catch(error => {
    console.error("Error connecting to wallet:", error);
    tonConnectUI.uiOptions = {
        twaReturnUrl: 'https://t.me/FLAPITLAWIN_bot'
    };
});

Telegram.WebApp.ready();

const canvas = document.getElementById('FlapItLawinCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const shopButton = document.getElementById('shopButton');
const questButton = document.getElementById('questButton');
const menu = document.getElementById('menu');
const shopMenu = document.getElementById('shopMenu');
const questMenu = document.getElementById('questMenu');
const totalScoreDisplay = document.getElementById('totalScoreDisplay');
const gravity = 0.4;
const flapPower = -8;
let birdImg = new Image();
birdImg.src = 'assets/bird.png';
let cliffImg = new Image();
cliffImg.src = 'assets/cliffs.png';
let birdY = canvas.height / 2;
let birdVelocity = 0;
let birdFlap = false;
let birdRadius = 20;
let pipes = [];
let pipeWidth = 40;
let pipeGap = 200;
let pipeSpacing = 250;
let score = 0;
let coins = parseInt(localStorage.getItem('coins')) || 0;
let gameRunning = false;
let availableBirds = JSON.parse(localStorage.getItem('availableBirds')) || { 1: false, 2: false, 3: false };

totalScoreDisplay.innerHTML = `${coins} <img src="assets/coin.png" alt="Coin Icon" id="coinIcon">`;

const bird = {
    x: 50,
    y: birdY,
    draw: function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        let angle = Math.atan2(birdVelocity, 10);
        ctx.rotate(angle);
        ctx.drawImage(birdImg, -birdRadius, -birdRadius, birdRadius * 2, birdRadius * 2);
        ctx.restore();
    },
    update: function() {
        if (birdFlap) {
            birdVelocity = flapPower;
            birdFlap = false;
        }
        birdVelocity += gravity;
        this.y += birdVelocity;

        if (this.y + birdRadius > canvas.height) {
            this.y = canvas.height - birdRadius;
            birdVelocity = 0;
        }
        if (this.y - birdRadius < 0) {
            this.y = birdRadius;
            birdVelocity = 0;
        }
    }
};

function Pipe(x) {
    this.x = x;
    this.height = Math.floor(Math.random() * (canvas.height - pipeGap)) + 50;
    this.width = pipeWidth;
    this.draw = function() {
        ctx.drawImage(cliffImg, this.x, this.height + pipeGap, this.width, canvas.height - this.height - pipeGap);
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.height / 2);
        ctx.scale(1, -1);
        ctx.drawImage(cliffImg, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    };
    this.update = function() {
        this.x -= 2;
        if (this.x + this.width < 0) {
            pipes.shift();
            score++;
            gameSpeed += 0.1;
            pipeGap = Math.max(100, pipeGap - 5);
        }
    };
}

document.addEventListener('click', function() {
    if (!gameRunning) return;
    birdFlap = true;
});

startButton.addEventListener('click', () => {
    menu.style.display = 'none';
    canvas.style.display = 'block';
    startGame();
});

shopButton.addEventListener('click', () => {
    openShop();
});

questButton.addEventListener('click', () => {
    openQuest();
});

function startGame() {
    gameRunning = true;
    bird.y = canvas.height / 2;
    birdVelocity = 0;
    score = 0;
    gameSpeed = 2;
    pipeGap = 200;
    pipes = [];
    gameLoop();
}

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bird.update();
    bird.draw();

    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - pipeSpacing) {
        pipes.push(new Pipe(canvas.width));
    }

    pipes.forEach(pipe => {
        pipe.update();
        pipe.draw();
        if (pipe.x < bird.x + birdRadius && pipe.x + pipeWidth > bird.x - birdRadius) {
            if (bird.y - birdRadius < pipe.height || bird.y + birdRadius > pipe.height + pipeGap) {
                gameOver();
            }
        }
    });

    ctx.fillStyle = "#000";
    ctx.font = "20px Comic Sans MS";
    ctx.fillText(`Points: ${score}`, 10, 30);

    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    coins += score;
    localStorage.setItem('coins', coins);
    totalScoreDisplay.innerHTML = `${coins} <img src="assets/coin.png" alt="Coin Icon" id="coinIcon">`;
    menu.style.display = 'flex';
    canvas.style.display = 'none';
    startButton.textContent = 'Restart Game';
}

function updateCoinsDisplay() {
    totalScoreDisplay.innerHTML = `${coins} <img src="assets/coin.png" alt="Coin Icon" id="coinIcon">`;
}

function openShop() {
    shopMenu.style.display = 'flex';
    updateShop();
}

function closeShop() {
    shopMenu.style.display = 'none';
}

function updateShop() {
    for (let i = 1; i <= 3; i++) {
        const shopItem = document.getElementById(`bird${i}`);
        if (availableBirds[i]) {
            shopItem.classList.add('disabled');
            shopItem.innerHTML = `Character ${i} - Purchased`;
        } else {
            shopItem.classList.remove('disabled');
            shopItem.innerHTML = `Character ${i}<br>Price: ${i * 100} coins`;
        }
    }
}

function buyCharacter(birdId) {
    if (coins >= birdId * 100) {
        coins -= birdId * 100;
        availableBirds[birdId] = true;
        localStorage.setItem('coins', coins);
        localStorage.setItem('availableBirds', JSON.stringify(availableBirds));
        updateShop();
        updateCoinsDisplay();
        alert(`Character ${birdId} bought!`);
    } else {
        alert('Not enough coins!');
    }
}

const quests = [
    {
        description: 'Complete 10 games',
        reward: 50,
        target: () => score >= 10,
        type: 'target'
    },
    {
        description: 'Achieve a score between 30 and 50',
        reward: 100,
        target: () => `${30} and ${50}`,
        type: 'range'
    },
    {
        description: 'Score 100 points',
        reward: 200,
        target: () => score >= 100,
        type: 'finish'
    },
    {
        description: 'Collect 500 coins',
        reward: 300,
        target: () => coins >= 500,
        type: 'target'
    },
    {
        description: 'Reach a score of 200',
        reward: 400,
        target: () => score >= 200,
        type: 'finish'
    },
    {
        description: 'Collect 100 coins in one game',
        reward: 250,
        target: () => gameCoins >= 100,
        type: 'target'
    },
    {
        description: 'Fly through 50 pipes',
        reward: 100,
        target: () => pipesPassed >= 50,
        type: 'target'
    },
];

function openQuest() {
    questMenu.style.display = 'flex';
    updateQuest();
}

function updateQuest() {
    const questElements = ['quest1', 'quest2', 'quest3'];
    questElements.forEach((id, index) => {
        const questItem = document.getElementById(id);
        if (questItem) {
            const quest = quests[index];
            questItem.innerHTML = `${quest.description}<br>Reward: ${quest.reward} coins`;
            questItem.onclick = function () {
                completeQuest(quest);
            };
        }
    });
}

function completeQuest(quest) {
    let reward = quest.reward;
    let message = '';

    if (quest.type === 'target' && quest.target() ||
        quest.type === 'range' && score >= parseInt(quest.target().split(' and ')[0]) && score <= parseInt(quest.target().split(' and ')[1]) ||
        quest.type === 'finish' && quest.target() ||
        quest.type === 'time' && quest.target()) {

        coins += reward;
        localStorage.setItem('coins', coins);
        message = `Quest completed! You earned ${reward} coins.`;
    } else {
        message = 'Quest not completed. Keep playing!';
    }

    updateCoinsDisplay();
    alert(message);
    updateQuest();
}

function closeQuest() {
    questMenu.style.display = 'none';
    updateQuest();
}