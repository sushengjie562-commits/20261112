// 全域變數宣告：儲存各個狀態的圖片精靈物件
let imgStop, imgWalk, imgJump, imgMagic, imgEffect;
let currentAction = "stop"; // 記錄當前角色狀態：stop(站立), walk(走路), jump(跳躍), magic(施法)
let charX, charY; // 角色1在畫布上的 X 與 Y 座標
let charDirection = 1; // 角色朝向：1 代表面向右邊，-1 代表面向左邊
let moveSpeed = 5; // 角色移動速度

// 動畫幀數控制變數
let currentFrame = 0; // 當前播放的精靈圖格數索引
let frameInterval = 6; // 控制動畫播放速度的幀間隔計數器
let frameCounter = 0; // 計數器

// 跳躍物理與狀態控制變數
let isJumping = false; // 是否正在跳躍
let jumpVelocityY = 0; // 跳躍垂直速度
let baseGroundY = 0; // 記住角色在地面的預設 Y 座標

// 招式與特效相關變數
let isCasting = false; // 是否正在施放招式
let effects = []; // 儲存畫面上多個特效的陣列

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 初始化角色位置：X 軸在畫布的 2/3 位置
  charX = width * (2 / 3);
  // 角色最底端 Y 座標落在畫布的最底端
  charY = height;
  baseGroundY = height; // 記錄地面基準線

  // 根據專案中的實際資料夾與檔名結構進行非同步載入
  imgStop = loadImage("1/stop/04.png");           // 對應 stop/04.png (12張)[cite: 5, 6]
  imgWalk = loadImage("1/walk/03.png");           // 對應 walk/03.png (9張)[cite: 4, 6]
  imgJump = loadImage("1/跳/02.png");             // 對應 跳/02.png (8張，寬1091 高188)[cite: 3, 6, 7]
  imgMagic = loadImage("1/招式/01.png");          // 對應 招式/01.png (4張)[cite: 2, 6]
  imgEffect = loadImage("1/特效/00.png");         // 對應 特效/00.png (5張)[cite: 1, 6]
}

function draw() {
  // 設定畫布背景顏色為天空色（淺藍色）
  background(135, 206, 235);

  // 檢查所有圖片是否已經載入完成
  let isImagesLoaded = imgStop && imgStop.width > 0 && 
                       imgWalk && imgWalk.width > 0 && 
                       imgJump && imgJump.width > 0 && 
                       imgMagic && imgMagic.width > 0 && 
                       imgEffect && imgEffect.width > 0;

  if (!isImagesLoaded) {
    // 若圖片尚未讀取完畢，顯示提示文字
    fill(50);
    textSize(22);
    textAlign(CENTER, CENTER);
    text("正在讀取精靈圖片檔案，請稍候...", width / 2, height / 2);
    return; // 尚未載入完成前先不執行後續動畫
  }

  // 更新跳躍物理位置
  updateJumpPhysics();

  // 處理鍵盤持續按下的移動與狀態控制邏輯
  handleKeyboardInput();

  // 更新並繪製所有特效
  updateAndDrawEffects();

  // 繪製角色精靈動畫
  drawCharacter();
}

// 處理跳躍的物理運動（重力與上下位移）
function updateJumpPhysics() {
  if (isJumping) {
    charY += jumpVelocityY; // 根據垂直速度更新 Y 座標
    jumpVelocityY += 0.7;   // 施加重力加速度（微調讓滯空時間剛好配合 8 張影格）

    // 當角色落回地面基準線時，結束跳躍狀態
    if (charY >= baseGroundY) {
      charY = baseGroundY;
      isJumping = false;
      jumpVelocityY = 0;
      currentAction = "stop"; // 恢復站立狀態
    }
  }
}

// 處理鍵盤輸入與角色移動行為
function handleKeyboardInput() {
  // 如果正在施放招式，暫時不處理左右移動
  if (isCasting) {
    return;
  }

  // 當按下右鍵時（跳躍在空中時也可以左右微調移動，更符合操作手感）
  if (keyIsDown(RIGHT_ARROW)) {
    if (!isJumping) {
      currentAction = "walk"; // 在地面時才切換為走路動畫
    }
    charDirection = 1; // 設定面向右邊
    charX += moveSpeed; // 角色向右移動
    
    let targetHeight = height / 3;
    let targetWidth = targetHeight * (1246 / 9 / 198);
    if (charX > width - targetWidth / 2) {
      charX = width - targetWidth / 2; // 抵達畫布最右端即停止移動
    }
  } 
  // 當按下左鍵時
  else if (keyIsDown(LEFT_ARROW)) {
    if (!isJumping) {
      currentAction = "walk"; // 在地面時才切換為走路動畫
    }
    charDirection = -1; // 設定面向左邊（圖片做水平翻轉）
    charX -= moveSpeed; // 角色向左移動
    
    let targetHeight = height / 3;
    let targetWidth = targetHeight * (1246 / 9 / 198);
    if (charX < targetWidth / 2) {
      charX = targetWidth / 2; // 抵達畫布最左端即停止移動
    }
  } 
  // 當使用者不按左右鍵，且不在跳躍或施法時，回復到 stop 狀態
  else if (!isJumping && !isCasting) {
    currentAction = "stop";
  }
}

// 監聽單次按鍵事件（用於空白鍵施放招式與向上鍵跳躍）
function keyPressed() {
  // 當按下鍵盤空白鍵且目前沒有在施放招式與跳躍時
  if (key === ' ' && !isCasting && !isJumping) {
    isCasting = true; // 進入施法狀態
    currentAction = "magic"; // 切換狀態為招式
    currentFrame = 0; // 從第一格開始播放
    frameCounter = 0; // 歸零計數器
  }

  // 當按下向上鍵（UP_ARROW）且目前沒有在跳躍或施法時，觸發跳躍
  if (keyCode === UP_ARROW && !isJumping && !isCasting) {
    isJumping = true;
    currentAction = "jump"; // 切換狀態為跳躍
    jumpVelocityY = -16;    // 給予向上的初速度
    currentFrame = 0;       // 從跳躍第一格開始播放
    frameCounter = 0;
  }
}

// 繪製角色精靈圖的核心函式
function drawCharacter() {
  let spriteImg;
  let totalFrames;
  let totalSheetWidth, totalSheetHeight;

  // 依照當前角色狀態選擇對應的圖片精靈與規格
  if (currentAction === "stop") {
    spriteImg = imgStop;
    totalFrames = 12;                // 站立精靈圖共 12 張[cite: 5]
    totalSheetWidth = 1663;
    totalSheetHeight = 212;
  } else if (currentAction === "walk") {
    spriteImg = imgWalk;
    totalFrames = 9;                 // 走路精靈圖共 9 張[cite: 4]
    totalSheetWidth = 1246;
    totalSheetHeight = 198;
  } else if (currentAction === "jump") {
    spriteImg = imgJump;
    totalFrames = 8;                 // 修正重點：跳躍精靈圖實際為 8 張[cite: 3, 7]
    totalSheetWidth = 1091;          // 總寬度 1091[cite: 7]
    totalSheetHeight = 188;          // 總高度 188[cite: 7]
  } else if (currentAction === "magic") {
    spriteImg = imgMagic;
    totalFrames = 4;                 // 招式精靈圖共 4 張[cite: 2]
    totalSheetWidth = 1039;
    totalSheetHeight = 146;
  }

  // 計算每一格精靈圖在原始圖片中的單張寬高
  let frameWidth = totalSheetWidth / totalFrames;
  let frameHeight = totalSheetHeight;

  // 角色高度設定為整個畫布的 1/3
  let targetHeight = height / 3;
  // 依照原圖高度與播放出來的高度做適當比率設定
  let targetWidth = targetHeight * (frameWidth / frameHeight);

  // 動畫格數切換控制（跳躍時稍微加快一點影格切換，讓 8 張動作剛好在落地前演完）
  let currentInterval = (currentAction === "jump") ? 5 : frameInterval;
  
  frameCounter++;
  if (frameCounter >= currentInterval) {
    frameCounter = 0;
    currentFrame++;

    // 如果是招式動畫（magic），圖片播放執行一次就好
    if (currentAction === "magic") {
      if (currentFrame >= totalFrames) {
        currentFrame = totalFrames - 1; // 停在最後一格
        isCasting = false; // 解除施法狀態
        currentAction = "stop"; // 恢復站立

        // 執行完後，在角色前方產生一特效圖片
        let effectX = charX + (charDirection === 1 ? targetWidth / 2 : -targetWidth / 2);
        let effectY = charY - targetHeight / 2;
        effects.push({
          x: effectX,
          y: effectY,
          dir: charDirection, // 繼承當前角色的面向
          frameCounter: 0
        });
      }
    } else if (currentAction === "jump") {
      // 跳躍動畫播放完最後一格（第 8 張，索引為 7）時停在最後一格，直到落地為止
      if (currentFrame >= totalFrames) {
        currentFrame = totalFrames - 1;
      }
    } else {
      // 一般循環動畫（站立、走路）
      currentFrame = currentFrame % totalFrames;
    }
  }

  if (currentFrame >= totalFrames && currentAction !== "jump") {
    currentFrame = 0;
  }

  let sx = currentFrame * frameWidth;
  let sy = 0;

  // 使用推入/彈出矩陣處理角色面向左右的鏡像翻轉與繪製
  push();
  translate(charX, charY); // 移動原點至角色位置
  scale(charDirection, 1); // 依據方向進行水平翻轉

  image(
    spriteImg,
    -targetWidth / 2, -targetHeight, // 繪製在畫布上的目標 X, Y 位置
    targetWidth, targetHeight,       // 繪製的目標寬高
    sx, sy,                          // 來源圖片裁切 X, Y
    frameWidth, frameHeight          // 來源圖片裁切寬高
  );
  pop();
}

// 更新並繪製所有特效
function updateAndDrawEffects() {
  let fxTotalFrames = 5;             // 特效精靈圖共 5 張[cite: 1]
  let fxSheetWidth = 740;
  let fxSheetHeight = 19;
  let fxFrameWidth = fxSheetWidth / fxTotalFrames;
  let fxFrameHeight = fxSheetHeight;

  let fxTargetHeight = (height / 3) * 0.3; 
  let fxTargetWidth = fxTargetHeight * (fxFrameWidth / fxFrameHeight);
  let fxSpeed = 8; // 特效移動速度

  // 從後往前巡迴陣列，安全地刪除跑出畫布的特效
  for (let i = effects.length - 1; i >= 0; i--) {
    let ef = effects[i];

    // 特效往對應方向移動
    ef.x += fxSpeed * ef.dir;

    // 計算特效動畫播放格數
    ef.frameCounter++;
    let fIndex = Math.floor(ef.frameCounter / 5) % fxTotalFrames;
    let eSx = fIndex * fxFrameWidth;

    push();
    translate(ef.x, ef.y);
    scale(ef.dir, 1); // 依特效行進方向翻轉
    image(
      imgEffect,
      -fxTargetWidth / 2, -fxTargetHeight / 2,
      fxTargetWidth, fxTargetHeight,
      eSx, 0,
      fxFrameWidth, fxFrameHeight
    );
    pop();

    // 當特效往右移動至畫布右端，或往左移動到畫布左端即消失不見
    if (ef.x > width + fxTargetWidth || ef.x < -fxTargetWidth) {
      effects.splice(i, 1);
    }
  }
}

// 當使用者調整瀏覽器視窗大小時，自動更新畫布尺寸
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  baseGroundY = height; // 更新地面基準線
  if (!isJumping) {
    charY = baseGroundY; // 若不在跳躍中，同步將角色貼齊新的畫布底端
  }
}