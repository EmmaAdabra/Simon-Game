let hardMode;
let defaultMaxLevel = 10;
let currentLevel = 1;
let order = 0; // holds index of next tab in the orderSequence
let count = 3; // count down variable
let orderSequence = [];
const btnColors = ["green", "red", "blue", "yellow"];

const maxLevel = document.querySelector("#level");
const heading = document.querySelector("#heading");
const startBtn = document.querySelector("#start-btn");
const countElem = document.querySelector("#count-down");
const hint = document.querySelector("#hint");
const gameBtns = document.querySelectorAll(`[data-btn]`);
const displayScreen = document.querySelector("#screen-wrapper"); // display game level
const levelValue = document.querySelector("#level-value");
const btnContainer = document.querySelector("#btn-wrapper");
const gameBg = document.querySelector("#gameBg");
const winMsg = document.querySelector("#winning-text");
const gameOverMsg = document.querySelector("#game-over-txt");
const gameModes = document.getElementsByName("mode");
const showMenu = document.querySelector("#show-menu");
const gameDetails = document.querySelector("#game-details");
const exitMenu = document.querySelector("#exit-menu");

gameModes.forEach((mode) => {
  mode.addEventListener("input", restartGame);
});

showMenu.addEventListener("click", () => {
  gameDetails.classList.add("visible");
  showMenu.classList.remove("show");
  exitMenu.classList.remove("hidden");
});

exitMenu.addEventListener("click", () => {
  gameDetails.classList.remove("visible");
  showMenu.classList.add("show");
  exitMenu.classList.add("hidden");
});

gameBg.addEventListener("pointerup", (event) => {
  if (gameDetails.classList.contains("visible")) {
    gameDetails.classList.remove("visible");
    showMenu.classList.add("show");
    exitMenu.classList.add("hidden");
    event.stopPropagation()
    event.preventDefault()
  }
});

btnContainer.addEventListener("click", shakeBtn);

window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    gameDetails.classList.remove("visible");
    showMenu.classList.add("show");
    exitMenu.classList.add("hidden");
  }
});

function shakeBtn() {
  startBtn.classList.add("shake-btn");
  setTimeout(() => {
    startBtn.classList.remove("shake-btn");
  }, 1200);
}

maxLevel.addEventListener("input", () => {
  defaultMaxLevel = parseInt(maxLevel.value);
  removeMsg();
  restartGame();
});

function checkGameMode() {
  let gameMode = document.querySelector("input[name='mode']:checked");
  return gameMode.value === "hard" ? true : false;
}

startBtn.addEventListener("click", start);

function start() {
  removeMsg();
  btnContainer.removeEventListener("click", shakeBtn);
  startBtn.classList.add("fade-out");
  startBtn.classList.add("hidden");
  heading.classList.add("fade-out");
  heading.classList.add("hidden");
  displayScreen.classList.remove("hidden");
  displayScreen.classList.add("fade-in");
  levelValue.textContent = `${currentLevel} / ${defaultMaxLevel}`;
  countElem.classList.remove("hidden");
  countElem.classList.add("fade-in");
  countDown();
  setTimeout(playGame, 1800);
}

function countDown() {
  countElem.textContent = count--;

  if (count >= 0) {
    setTimeout(countDown, 500);
  } else {
    countElem.classList.add("fade-out");
    countElem.classList.add("hidden");
  }
}

function playGame() {
  let gameMode = checkGameMode();
  hint.textContent = "Watch out !! for the pressed buttons";
  hint.classList.remove("hidden");
  hint.classList.add("fade-in");
  let btn = btnColors[getRandNum()];
  orderSequence.push(btn);
  if (gameMode) {
    addBtnOnly(btn);
  } else {
    comTurn();
  }
}

function addBtnOnly(btn) {
  playSound(btn);
  pressBtn(btn);
  setTimeout(userTurn, 1000);
}

function comTurn() {
  orderSequence.forEach((btn, index) => {
    setTimeout(() => {
      playSound(btn);
      pressBtn(btn);
    }, (index + 1) * 600);
  });

  setTimeout(userTurn, orderSequence.length * 600 + 500);
}

function userTurn() {
  btnContainer.classList.remove("pointer");
  updateHint();
  handleClick();
}

function handleClick() {
  gameBtns.forEach((btn) => {
    btn.classList.remove("unclickable");
    btn.removeEventListener("click", verifyBtn);
    btn.addEventListener("click", verifyBtn);
  });
}

function verifyBtn(event) {
  let btn = event.target.dataset.btn;
  playSound(btn);
  if (btn !== orderSequence[order]) {
    gameOver();
    return;
  }

  order++;
  if (order === orderSequence.length) {
    if (orderSequence.length === defaultMaxLevel) {
      winMsg.classList.remove("hidden");
      winMsg.classList.add("fade-in");
      displayScreen.classList.add("fade-out");
      displayScreen.classList.add("hidden");
      heading.classList.remove("hidden");
      heading.classList.add("fade-in");
      restartGame();
      return;
    }

    hint.textContent = "Success";
    let newElem = document.createElement("span");
    newElem.textContent = " !!! 🎊🎉";
    newElem.classList.add("dynamic-txt");
    currentLevel++;
    hint.appendChild(newElem);
    order = 0;
    levelValue.textContent = `${currentLevel} / ${defaultMaxLevel}`;
    removeClickEffect();
    setTimeout(playGame, 1000);
    return;
  }
  updateHint();
}

function restartGame() {
  removeClickEffect();
  currentLevel = 1;
  order = 0;
  count = 3;
  orderSequence = [];
  heading.classList.remove("hidden");
  heading.classList.add("fade-in");
  displayScreen.classList.add("fade-out");
  displayScreen.classList.add("hidden");
  hint.classList.add("fade-out");
  hint.classList.add("hidden");
  startBtn.classList.remove("hidden");
  startBtn.classList.add("fade-in");
  btnContainer.addEventListener("click", shakeBtn);
}

function removeClickEffect() {
  btnContainer.classList.add("pointer");
  gameBtns.forEach((btn) => {
    btn.classList.add("unclickable");
  });
}

function updateHint() {
  hint.textContent = `Your turn: ${currentLevel - order} Tab${
    currentLevel - order > 1 ? "s" : ""
  }`;
}

function playSound(btn) {
  let btnSound = document.querySelector(`[data-sound = '${btn}']`);
  btnSound.play();
}

function pressBtn(btn) {
  let activeBtn = document.querySelector(`[data-btn = '${btn}']`);
  activeBtn.classList.add("activated");
  setTimeout(() => {
    activeBtn.classList.remove("activated");
  }, 200);
}

function getRandNum() {
  var randNum = Math.floor(Math.random() * 4);
  return randNum;
}

function removeMsg() {
  gameOverMsg.classList.remove("fade-in");
  gameOverMsg.classList.add("fade-out");
  gameOverMsg.classList.add("hidden");
  winMsg.classList.add("fade-out");
  winMsg.classList.add("hidden");
}

function gameOver() {
  const wrongSound = new Audio("./sounds/wrong.mp3");
  wrongSound.play();
  gameOverMsg.classList.remove("hidden");
  gameOverMsg.classList.add("fade-in");
  gameBg.classList.add("game-over");
  setTimeout(() => {
    gameBg.classList.remove("game-over");
  }, 200);
  restartGame();
}
