const MAX_WIDTH = 100
const MAX_HEIGHT = 100

class GameObject {
  constructor({
    x,
    y,
    width,
    height,
    color
  }) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.color = color
  }

  draw({
    ctx,
    vw,
    vh
  }) {
    ctx.fillStyle = this.color
    ctx.fillRect(this.x * vw, this.y * vh, this.width * vw, this.height * vh)
  }

  get right() {
    return this.x + this.width
  }

  get down() {
    return this.y + this.height
  }

  get centerX() {
    return this.x + this.width / 2
  }

  get centerY() {
    return this.y + this.height / 2
  }
}

class Player extends GameObject {
  constructor({
    x,
    y,
    width,
    height,
    color,
    speed
  }) {
    super({
      x,
      y,
      width,
      height,
      color,
    })
    this.speed = speed
  }

  moveRight(dt) {
    const newX = this.x + this.speed * dt
    if (newX + this.width >= MAX_WIDTH) {
      return
    }
    this.x = newX
  }

  moveLeft(dt) {
    const newX = this.x - this.speed * dt
    if (newX < 0) {
      return
    }
    this.x = newX
  }
}

class Ball extends GameObject {
  constructor({
    x,
    y,
    width,
    height,
    speedX,
    speedY,
    color
  }) {
    super({
      x,
      y,
      width,
      height,
      color,
    })
    this.speedX = speedX
    this.speedY = speedY
  }

  move(dt) {
    this.x = this.x + this.speedX * dt
    this.y = this.y + this.speedY * dt
    if (this.right >= MAX_WIDTH || this.x <= 0) {
      this.speedX = -this.speedX
    }
    if (this.y <= 0) {
      this.speedY = -this.speedY
    }
  }
}

function collide(object1, object2) {
  return (isBetween(object1.x, object2.x, object2.right) &&
      isBetween(object1.y, object2.y, object2.down)) ||
    (isBetween(object2.x, object1.x, object1.right) &&
      isBetween(object2.y, object1.y, object1.down)) ?
    true :
    false
}

function isBetween(x, min, max) {
  return x >= min && x <= max ? true : false
}

function play(move, draw) {
  const myCanvas = createCanvas()
  const keys = getKeys(myCanvas.rect)

  let prevTimestamp = 0
  const update = timestamp => {
    // if (keys.keyLeft || keys.keyRight)
    // console.log(keys);
    if (prevTimestamp === 0) {
      prevTimestamp = timestamp
    }
    const dt = timestamp - prevTimestamp

    move(dt, keys)
    draw(myCanvas)

    prevTimestamp = timestamp
    window.requestAnimationFrame(update)
  }

  window.requestAnimationFrame(update)
}

function createPlayer() {
  const width = 20
  const height = 2
  return new Player({
    x: (MAX_WIDTH - width) / 2,
    y: MAX_HEIGHT - height,
    width: width,
    height: height,
    color: 'blue',
    speed: 0.05,
  })
}

function createCanvas() {
  const canvas = document.querySelector('.game-canvas')
  const ctx = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  canvas.setAttribute('width', rect.width)
  canvas.setAttribute('height', rect.height)
  const vw = rect.width / 100
  const vh = rect.height / 100
  return {
    ctx,
    rect,
    vw,
    vh,
  }
}

function getKeys(rect) {
  const keys = {
    keyRight: false,
    keyLeft: false,
  }

  window.addEventListener('keydown', e => {
    e.preventDefault()
    if (e.code === 'ArrowRight') {
      keys.keyRight = true
    }
    if (e.code === 'ArrowLeft') {
      keys.keyLeft = true
    }
  })

  window.addEventListener('keyup', e => {
    e.preventDefault()
    if (e.code === 'ArrowRight') {
      keys.keyRight = false
    }
    if (e.code === 'ArrowLeft') {
      keys.keyLeft = false
    }
  })

  window.addEventListener('mousedown', e => {
    e.preventDefault()
    console.log('touch')
    if (e.clientX < rect.width / 2) {
      keys.keyLeft = true
      keys.keyRight = false
    } else {
      keys.keyRight = true
      keys.keyLeft = false
    }
  })

  window.addEventListener('mouseup', e => {
    e.preventDefault()
    keys.keyLeft = false
    keys.keyRight = false
  })

  window.addEventListener('touchstart', e => {
    e.preventDefault()
    console.log('touch')
    if (e.touches[0].clientX < rect.width / 2) {
      keys.keyLeft = true
      keys.keyRight = false
    } else {
      keys.keyRight = true
      keys.keyLeft = false
    }
  })

  window.addEventListener('touchmove', e => {
    e.preventDefault()
    console.log('touch')
    if (e.touches[0].clientX < rect.width / 2) {
      keys.keyLeft = true
      keys.keyRight = false
    } else {
      keys.keyRight = true
      keys.keyLeft = false
    }
  })

  window.addEventListener('touchend', e => {
    e.preventDefault()
    keys.keyLeft = false
    keys.keyRight = false
  })

  return keys
}

function createBricks(xCount, yCount) {
  const bricks = []
  const width = 5
  const height = 4
  for (let i = 0; i < yCount; i++) {
    for (let j = 0; j < xCount; j++) {
      bricks.push(
        new GameObject({
          x: (MAX_WIDTH - xCount * width) / 2 + j * width,
          y: (i + 1) * height,
          width: width - 1,
          height: height - 1,
          color: 'green',
        })
      )
    }
  }

  return bricks
}

function createBall() {
  const width = 2
  const height = 2
  return new Ball({
    x: (MAX_WIDTH - width) / 2,
    y: (MAX_HEIGHT - height) / 2,
    width,
    height,
    color: 'red',
    speedX: Math.random() / 20 - 0.025,
    speedY: -Math.random() / 20 - 0.1,
  })
}

function createGameWorld() {
  return {
    player: createPlayer(),
    bricks: createBricks(10, 5),
    ball: createBall(),
  }
}

function createGame() {
  let gameWorld = createGameWorld()

  let started = false
  const move = (dt, keys) => {
    if (keys.keyRight) {
      started = true
      gameWorld.player.moveRight(dt)
    }
    if (keys.keyLeft) {
      started = true
      gameWorld.player.moveLeft(dt)
    }
    if (!started) {
      return
    }
    const prevBall = new Ball(gameWorld.ball)
    gameWorld.ball.move(dt)
    if (collide(gameWorld.ball, gameWorld.player)) {
      console.log('collide')
      gameWorld.ball.speedY = -gameWorld.ball.speedY
      gameWorld.ball.speedX +=
        (gameWorld.ball.centerX - gameWorld.player.centerX) / 200
      // speedX shouldn't be too fast
      if (
        Math.abs(gameWorld.ball.speedX) >
        Math.abs(gameWorld.ball.speedY) / 2
      ) {
        gameWorld.ball.speedX =
          Math.sign(gameWorld.ball.speedX) * Math.abs(gameWorld.ball.speedY / 2)
      }
      gameWorld.ball.move(dt)
    }
    for (let brick of gameWorld.bricks) {
      if (collide(gameWorld.ball, brick)) {
        // check from which side the brick was hit
        if (
          isBetween(prevBall.x, brick.x, brick.right) ||
          isBetween(prevBall.right, brick.x, brick.right)
        ) {
          gameWorld.ball.speedY = -gameWorld.ball.speedY
        } else {
          gameWorld.ball.speedX = -gameWorld.ball.speedX
        }
        const brickIndex = gameWorld.bricks.indexOf(brick)
        gameWorld.bricks.splice(brickIndex, 1)
        break
      }
    }
    if (gameWorld.ball.down > MAX_HEIGHT) {
      started = false
      const newGameWorld = createGameWorld()
      gameWorld.player = newGameWorld.player
      gameWorld.bricks = newGameWorld.bricks
      gameWorld.ball = newGameWorld.ball
    }
  }

  const draw = canvas => {
    canvas.ctx.clearRect(0, 0, canvas.rect.width, canvas.rect.height)
    gameWorld.player.draw(canvas)
    gameWorld.ball.draw(canvas)
    for (let brick of gameWorld.bricks) {
      brick.draw(canvas)
    }
  }

  return {
    gameWorld,
    move,
    draw,
  }
}

const {
  move,
  draw
} = createGame()

play(move, draw)