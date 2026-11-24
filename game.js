/**
 * 넘버링크 (Numberlink): 수학적 논리 퍼즐
 * 메인 게임 엔진 & 수학적 배경 렌더러
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. 사운드 신시사이저 (Web Audio API)
  // ==========================================================================
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('numberlink_muted') === 'true';
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('numberlink_muted', this.muted);
      return this.muted;
    }

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }

    playTap() {
      this.playTone(360, 'sine', 0.06, 0.12);
    }

    playConnect() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.22, 0.15);
        }, idx * 60);
      });
    }

    playWrong() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      this.playTone(220, 'sawtooth', 0.2, 0.18);
      setTimeout(() => {
        this.playTone(185, 'sawtooth', 0.3, 0.2);
      }, 130);
    }

    playSuccess() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.35, 0.18);
        }, idx * 80);
      });
    }

    playVictory() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const fanfare = [
        { f: 523.25, d: 0.18 },
        { f: 659.25, d: 0.18 },
        { f: 783.99, d: 0.18 },
        { f: 1046.5, d: 0.4 },
        { f: 880, d: 0.2 },
        { f: 1046.5, d: 0.6 }
      ];
      let delay = 0;
      fanfare.forEach(item => {
        setTimeout(() => {
          this.playTone(item.f, 'triangle', item.d, 0.22);
        }, delay);
        delay += item.d * 1000 * 0.85;
      });
    }
  }

  // ==========================================================================
  // 2. 수학 배경 캔버스 (좌표계, 수식 및 사인 파동 애니메이션)
  // ==========================================================================
  class BackgroundCanvas {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.mathSymbols = [
        '∑', '∫', 'π', 'eⁱᵖ + 1 = 0', '√x', 'f(x)', 'lim', 'φ = 1.618', 
        '∇·B = 0', '∞', 'λ', 'θ', 'Δx', '∂y/∂x', 'E = mc²', 'a² + b² = c²'
      ];
      this.floatingItems = [];
      this.waveTime = 0;
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.initFloating();
      this.animate();
    }

    resize() {
      this.w = this.canvas.width = window.innerWidth;
      this.h = this.canvas.height = window.innerHeight;
    }

    initFloating() {
      this.floatingItems = [];
      const count = Math.floor((this.w * this.h) / 35000);
      for (let i = 0; i < count; i++) {
        this.floatingItems.push({
          text: this.mathSymbols[Math.floor(Math.random() * this.mathSymbols.length)],
          x: Math.random() * this.w,
          y: Math.random() * this.h,
          size: Math.random() * 10 + 13,
          speedY: -(Math.random() * 0.25 + 0.15),
          speedX: (Math.random() - 0.5) * 0.1,
          alpha: Math.random() * 0.25 + 0.08
        });
      }
    }

    animate() {
      this.ctx.clearRect(0, 0, this.w, this.h);

      // 1. 수학적 좌표 격자선 (Faint Cartesian Grid)
      this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.035)';
      this.ctx.lineWidth = 1;
      const gridSize = 48;
      for (let x = 0; x < this.w; x += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.h);
        this.ctx.stroke();
      }
      for (let y = 0; y < this.h; y += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.w, y);
        this.ctx.stroke();
      }

      // 2. 부드럽게 흐르는 삼각함수 사인 파동 (Sine Wave Harmonics)
      this.waveTime += 0.012;
      this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.06)';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      for (let x = 0; x <= this.w; x += 10) {
        const y = this.h * 0.5 + Math.sin(x * 0.005 + this.waveTime) * 45 + Math.cos(x * 0.01 - this.waveTime * 0.5) * 20;
        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();

      this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.04)';
      this.ctx.beginPath();
      for (let x = 0; x <= this.w; x += 10) {
        const y = this.h * 0.65 + Math.sin(x * 0.007 - this.waveTime * 0.8) * 35;
        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();

      // 3. 서서히 떠오르는 수학 수식 텍스트
      this.floatingItems.forEach(item => {
        item.y += item.speedY;
        item.x += item.speedX;
        if (item.y < -30) {
          item.y = this.h + 20;
          item.x = Math.random() * this.w;
        }
        this.ctx.fillStyle = `rgba(56, 189, 248, ${item.alpha})`;
        this.ctx.font = `${item.size}px 'JetBrains Mono', 'Cambria Math', monospace`;
        this.ctx.fillText(item.text, item.x, item.y);
      });

      requestAnimationFrame(() => this.animate());
    }
  }

  // ==========================================================================
  // 3. 축하 폭죽 파티클 (Confetti)
  // ==========================================================================
  class ConfettiSystem {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.active = false;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      this.w = this.canvas.width = window.innerWidth;
      this.h = this.canvas.height = window.innerHeight;
    }

    launch(count = 90) {
      this.resize();
      const colors = ['#06B6D4', '#38BDF8', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#FFFFFF'];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: this.w / 2 + (Math.random() - 0.5) * 200,
          y: this.h / 2 + (Math.random() - 0.5) * 100,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 1.2) * 16,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.2,
          gravity: 0.35,
          alpha: 1,
          decay: Math.random() * 0.015 + 0.008
        });
      }

      if (!this.active) {
        this.active = true;
        this.update();
      }
    }

    update() {
      if (!this.active) return;
      this.ctx.clearRect(0, 0, this.w, this.h);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotSpeed;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.y > this.h + 20) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        requestAnimationFrame(() => this.update());
      } else {
        this.active = false;
        this.ctx.clearRect(0, 0, this.w, this.h);
      }
    }
  }

  // ==========================================================================
  // 4. 메인 게임 클래스 (NumberlinkGame)
  // ==========================================================================
  class NumberlinkGame {
    constructor() {
      this.sound = new SoundManager();
      this.bg = new BackgroundCanvas('bg-canvas');
      this.confetti = new ConfettiSystem('confetti-canvas');

      // 스테이지 진행 상태 (총 16개 스테이지)
      this.unlockedStage = parseInt(localStorage.getItem('numberlink_unlocked') || '1', 10);
      this.currentStageIndex = 0; // 0 ~ 15

      // 현재 퍼즐 보드 상태
      this.puzzle = null;
      this.rows = 0;
      this.cols = 0;
      this.initialGrid = [];
      this.paths = {}; // { number: [ {r, c}, ... ] }
      this.undoStack = [];

      // 인터랙션 (마우스 / 터치 드래그)
      this.isDragging = false;
      this.dragNumber = 0;
      this.dragStartEndpoint = null;
      this.dragTargetEndpoint = null;
      this.lastHoveredCell = null;

      // 시간 측정
      this.timerInterval = null;
      this.stageStartTime = 0;
      this.stageElapsedSeconds = 0;
      this.totalElapsedSeconds = 0;

      // DOM 캐싱 및 이벤트 바인딩
      this.canvas = document.getElementById('puzzle-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.cacheDom();
      this.bindEvents();
      this.updateSoundButton();
    }

    cacheDom() {
      this.screenIntro = document.getElementById('screen-intro');
      this.screenRules = document.getElementById('screen-rules');
      this.screenGame = document.getElementById('screen-game');
      this.screenEnding = document.getElementById('screen-ending');

      this.btnStartGame = document.getElementById('btn-start-game');
      this.btnBeginPuzzle = document.getElementById('btn-begin-puzzle');
      this.btnBackToIntro = document.getElementById('btn-back-to-intro');

      this.stageBadge = document.getElementById('stage-badge');
      this.stageTitle = document.getElementById('stage-title');
      this.gridSizeLbl = document.getElementById('grid-size-lbl');
      this.timerLbl = document.getElementById('timer-lbl');
      this.pairsCountLbl = document.getElementById('pairs-count-lbl');
      this.cellsCoveredLbl = document.getElementById('cells-covered-lbl');

      this.btnSound = document.getElementById('btn-sound');
      this.btnRulesModal = document.getElementById('btn-rules-modal');
      this.btnUndo = document.getElementById('btn-undo');
      this.btnReset = document.getElementById('btn-reset');
      this.btnCheck = document.getElementById('btn-check');

      this.modalAlert = document.getElementById('modal-alert');
      this.modalIcon = document.getElementById('modal-icon');
      this.modalTitle = document.getElementById('modal-title');
      this.modalBody = document.getElementById('modal-body');
      this.modalBtnConfirm = document.getElementById('modal-btn-confirm');

      this.btnRestartAll = document.getElementById('btn-restart-all');
      this.endTotalTime = document.getElementById('end-total-time');
    }

    bindEvents() {
      this.btnStartGame.addEventListener('click', () => {
        this.sound.playTap();
        this.showScreen(this.screenRules);
      });

      this.btnBeginPuzzle.addEventListener('click', () => {
        this.sound.playTap();
        this.loadStage(this.unlockedStage - 1);
        this.showScreen(this.screenGame);
      });

      this.btnBackToIntro.addEventListener('click', () => {
        this.sound.playTap();
        this.showScreen(this.screenIntro);
      });

      this.btnSound.addEventListener('click', () => {
        this.sound.toggleMute();
        this.updateSoundButton();
      });

      this.btnRulesModal.addEventListener('click', () => {
        this.sound.playTap();
        this.showScreen(this.screenRules);
      });

      this.btnUndo.addEventListener('click', () => this.handleUndo());
      this.btnReset.addEventListener('click', () => this.handleReset());
      this.btnCheck.addEventListener('click', () => this.handleCheckAnswer());

      this.modalBtnConfirm.addEventListener('click', () => {
        this.closeModal();
      });

      this.btnRestartAll.addEventListener('click', () => {
        this.sound.playTap();
        this.currentStageIndex = 0;
        this.totalElapsedSeconds = 0;
        this.loadStage(0);
        this.showScreen(this.screenGame);
      });

      this.setupCanvasInteractions();

      window.addEventListener('resize', () => {
        if (this.puzzle) {
          this.resizeCanvas();
          this.render();
        }
      });
    }

    showScreen(targetScreen) {
      [this.screenIntro, this.screenRules, this.screenGame, this.screenEnding].forEach(s => {
        s.classList.remove('active');
      });
      targetScreen.classList.add('active');
    }

    updateSoundButton() {
      this.btnSound.textContent = this.sound.muted ? '🔇' : '🔊';
      this.btnSound.title = this.sound.muted ? '소리 켜기' : '소리 끄기';
    }

    // ========================================================================
    // 스테이지 로드 및 초기화
    // ========================================================================
    loadStage(stageIndex) {
      if (stageIndex < 0) stageIndex = 0;
      if (stageIndex >= PUZZLES.length) stageIndex = PUZZLES.length - 1;

      this.currentStageIndex = stageIndex;
      this.puzzle = PUZZLES[stageIndex];
      this.rows = this.puzzle.rows;
      this.cols = this.puzzle.cols;
      this.initialGrid = this.puzzle.grid.map(row => [...row]);

      this.paths = {};
      this.undoStack = [];

      this.endpoints = {};
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const val = this.initialGrid[r][c];
          if (val > 0) {
            if (!this.endpoints[val]) this.endpoints[val] = [];
            this.endpoints[val].push({ r, c });
          }
        }
      }

      this.stageTitle.textContent = `Stage ${stageIndex + 1}`;
      this.stageBadge.textContent = `${stageIndex + 1} / ${PUZZLES.length}`;
      this.gridSizeLbl.textContent = `${this.rows} × ${this.cols}`;

      this.startStageTimer();
      this.resizeCanvas();
      this.updateStatsUI();
      this.render();
    }

    startStageTimer() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.stageStartTime = Date.now();
      this.stageElapsedSeconds = 0;
      this.timerLbl.textContent = '00:00';

      this.timerInterval = setInterval(() => {
        this.stageElapsedSeconds = Math.floor((Date.now() - this.stageStartTime) / 1000);
        const mins = String(Math.floor(this.stageElapsedSeconds / 60)).padStart(2, '0');
        const secs = String(this.stageElapsedSeconds % 60).padStart(2, '0');
        this.timerLbl.textContent = `${mins}:${secs}`;
      }, 1000);
    }

    resizeCanvas() {
      const maxW = Math.min(window.innerWidth - 48, 620);
      const maxH = Math.min(window.innerHeight - 260, 620);
      const targetSize = Math.max(280, Math.min(maxW, maxH));

      const dpr = window.devicePixelRatio || 1;
      this.cellSize = Math.floor(targetSize / Math.max(this.rows, this.cols));
      this.canvasWidth = this.cellSize * this.cols;
      this.canvasHeight = this.cellSize * this.rows;

      this.canvas.width = this.canvasWidth * dpr;
      this.canvas.height = this.canvasHeight * dpr;
      this.canvas.style.width = `${this.canvasWidth}px`;
      this.canvas.style.height = `${this.canvasHeight}px`;

      this.ctx.scale(dpr, dpr);
    }

    // ========================================================================
    // 인터랙션: 마우스 및 터치 드래그
    // ========================================================================
    setupCanvasInteractions() {
      const getPos = e => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return { r: row, c: col, inBounds: row >= 0 && row < this.rows && col >= 0 && col < this.cols };
      };

      const handlePointerDown = e => {
        e.preventDefault();
        const pos = getPos(e);
        if (!pos.inBounds) return;

        const numAtCell = this.initialGrid[pos.r][pos.c];
        const ownerNum = this.getCellOwner(pos.r, pos.c);

        if (numAtCell > 0) {
          this.sound.playTap();
          this.saveHistory();

          this.paths[numAtCell] = [{ r: pos.r, c: pos.c }];
          this.isDragging = true;
          this.dragNumber = numAtCell;
          this.dragStartEndpoint = { r: pos.r, c: pos.c };
          const pair = this.endpoints[numAtCell];
          this.dragTargetEndpoint = (pair[0].r === pos.r && pair[0].c === pos.c) ? pair[1] : pair[0];
          this.lastHoveredCell = { r: pos.r, c: pos.c };
          this.render();
          this.updateStatsUI();
        } else if (ownerNum > 0) {
          this.sound.playTap();
          this.saveHistory();
          const path = this.paths[ownerNum];
          const idx = path.findIndex(pt => pt.r === pos.r && pt.c === pos.c);
          if (idx !== -1) {
            this.paths[ownerNum] = path.slice(0, idx + 1);
            this.isDragging = true;
            this.dragNumber = ownerNum;
            const startPt = path[0];
            const pair = this.endpoints[ownerNum];
            this.dragStartEndpoint = startPt;
            this.dragTargetEndpoint = (pair[0].r === startPt.r && pair[0].c === startPt.c) ? pair[1] : pair[0];
            this.lastHoveredCell = { r: pos.r, c: pos.c };
            this.render();
            this.updateStatsUI();
          }
        }
      };

      const handlePointerMove = e => {
        if (!this.isDragging) return;
        e.preventDefault();
        const pos = getPos(e);
        if (!pos.inBounds) return;

        if (this.lastHoveredCell && this.lastHoveredCell.r === pos.r && this.lastHoveredCell.c === pos.c) {
          return;
        }

        const path = this.paths[this.dragNumber];
        if (!path || path.length === 0) return;

        const currentHead = path[path.length - 1];

        const dr = Math.abs(pos.r - currentHead.r);
        const dc = Math.abs(pos.c - currentHead.c);
        if (dr + dc !== 1) return;

        // 1. 뒤로 되감기 (Backtracking)
        if (path.length > 1) {
          const prevCell = path[path.length - 2];
          if (prevCell.r === pos.r && prevCell.c === pos.c) {
            path.pop();
            this.sound.playTap();
            this.lastHoveredCell = pos;
            this.render();
            this.updateStatsUI();
            return;
          }
        }

        // 2. 이미 자신의 경로에 포함된 칸
        const existingIdx = path.findIndex(pt => pt.r === pos.r && pt.c === pos.c);
        if (existingIdx !== -1) {
          this.paths[this.dragNumber] = path.slice(0, existingIdx + 1);
          this.sound.playTap();
          this.lastHoveredCell = pos;
          this.render();
          this.updateStatsUI();
          return;
        }

        // 3. 목적지 엔드포인트 도달 (성공 연결)
        if (pos.r === this.dragTargetEndpoint.r && pos.c === this.dragTargetEndpoint.c) {
          path.push({ r: pos.r, c: pos.c });
          this.sound.playConnect();
          this.isDragging = false;
          this.lastHoveredCell = pos;
          this.render();
          this.updateStatsUI();
          return;
        }

        // 4. 다른 고정 숫자가 적힌 칸 진입 불가
        const fixedNum = this.initialGrid[pos.r][pos.c];
        if (fixedNum > 0 && fixedNum !== this.dragNumber) {
          return;
        }

        // 5. 다른 번호의 선 통과 불가 (불교차 원칙)
        const cellOwner = this.getCellOwner(pos.r, pos.c);
        if (cellOwner > 0 && cellOwner !== this.dragNumber) {
          return;
        }

        // 6. 빈 칸으로 경로 연장
        path.push({ r: pos.r, c: pos.c });
        this.sound.playTap();
        this.lastHoveredCell = pos;
        this.render();
        this.updateStatsUI();
      };

      const handlePointerUp = () => {
        if (this.isDragging) {
          this.isDragging = false;
          this.lastHoveredCell = null;
          this.render();
          this.updateStatsUI();
        }
      };

      this.canvas.addEventListener('mousedown', handlePointerDown);
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);

      this.canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
      window.addEventListener('touchcancel', handlePointerUp);
    }

    getCellOwner(r, c) {
      for (const [numStr, path] of Object.entries(this.paths)) {
        const num = parseInt(numStr, 10);
        for (const pt of path) {
          if (pt.r === r && pt.c === c) return num;
        }
      }
      return 0;
    }

    saveHistory() {
      const snapshot = {};
      for (const [k, v] of Object.entries(this.paths)) {
        snapshot[k] = v.map(pt => ({ ...pt }));
      }
      this.undoStack.push(snapshot);
      if (this.undoStack.length > 50) this.undoStack.shift();
    }

    handleUndo() {
      if (this.undoStack.length === 0) return;
      this.sound.playTap();
      this.paths = this.undoStack.pop();
      this.render();
      this.updateStatsUI();
    }

    handleReset() {
      this.sound.playTap();
      this.saveHistory();
      this.paths = {};
      this.render();
      this.updateStatsUI();
    }

    updateStatsUI() {
      let connectedPairs = 0;
      const totalPairs = Object.keys(this.endpoints).length;

      for (const [numStr, pair] of Object.entries(this.endpoints)) {
        const num = parseInt(numStr, 10);
        const path = this.paths[num];
        if (path && path.length >= 2) {
          const first = path[0];
          const last = path[path.length - 1];
          const p1 = pair[0];
          const p2 = pair[1];
          const isConnected =
            (first.r === p1.r && first.c === p1.c && last.r === p2.r && last.c === p2.c) ||
            (first.r === p2.r && first.c === p2.c && last.r === p1.r && last.c === p1.c);
          if (isConnected) connectedPairs++;
        }
      }

      const occupiedCells = new Set();
      for (const path of Object.values(this.paths)) {
        for (const pt of path) {
          occupiedCells.add(`${pt.r},${pt.c}`);
        }
      }

      const totalCells = this.rows * this.cols;
      const filledCount = occupiedCells.size;
      const pct = Math.floor((filledCount / totalCells) * 100);

      this.pairsCountLbl.textContent = `${connectedPairs} / ${totalPairs}`;
      this.cellsCoveredLbl.textContent = `${filledCount} / ${totalCells} (${pct}%)`;
    }

    // ========================================================================
    // 5. 정답 확인 (Check Answer) 로직
    // ========================================================================
    handleCheckAnswer() {
      const result = this.validateSolution();

      if (!result.success) {
        this.sound.playWrong();
        this.showModal({
          type: 'warning',
          icon: '⚠️',
          title: '다시 해보세요.',
          body: result.message,
          confirmText: '계속 풀기'
        });
      } else {
        this.sound.playSuccess();
        this.confetti.launch(80);

        const isLastStage = this.currentStageIndex >= PUZZLES.length - 1;

        if (this.currentStageIndex + 2 > this.unlockedStage) {
          this.unlockedStage = Math.min(PUZZLES.length, this.currentStageIndex + 2);
          localStorage.setItem('numberlink_unlocked', this.unlockedStage);
        }

        this.totalElapsedSeconds += this.stageElapsedSeconds;

        this.showModal({
          type: 'success',
          icon: '✨',
          title: '정답입니다!',
          body: `축하합니다! <strong>${this.puzzle.title}</strong>을(를) 완벽하게 해결했습니다.<br>모든 숫자 쌍이 연결되었으며, 격자의 모든 빈칸이 100% 채워졌습니다.`,
          confirmText: isLastStage ? '최종 결과 확인하기 🎓' : '다음 퍼즐로 이동 ➔',
          onConfirm: () => {
            if (isLastStage) {
              this.showEndingScreen();
            } else {
              this.loadStage(this.currentStageIndex + 1);
            }
          }
        });
      }
    }

    validateSolution() {
      const totalCells = this.rows * this.cols;

      // 1. 모든 숫자 쌍이 연결되었는지 확인
      for (const [numStr, pair] of Object.entries(this.endpoints)) {
        const num = parseInt(numStr, 10);
        const path = this.paths[num];

        if (!path || path.length < 2) {
          return {
            success: false,
            message: `아직 연결되지 않은 숫자(<strong>${num}번</strong>)가 있습니다.<br>같은 번호의 두 숫자를 모두 연결해 주세요.`
          };
        }

        const first = path[0];
        const last = path[path.length - 1];
        const p1 = pair[0];
        const p2 = pair[1];
        const isConnected =
          (first.r === p1.r && first.c === p1.c && last.r === p2.r && last.c === p2.c) ||
          (first.r === p2.r && first.c === p2.c && last.r === p1.r && last.c === p1.c);

        if (!isConnected) {
          return {
            success: false,
            message: `<strong>${num}번</strong> 숫자의 연결선이 중간에 끊어져 있거나 목표 지점에 닿지 못했습니다.`
          };
        }
      }

      // 2. 모든 셀이 빈칸 없이 완전히 채워졌는지 확인 (규칙 3)
      const occupiedMap = {};
      let overlapCount = 0;

      for (const [numStr, path] of Object.entries(this.paths)) {
        const num = parseInt(numStr, 10);
        for (const pt of path) {
          const key = `${pt.r},${pt.c}`;
          if (occupiedMap[key]) overlapCount++;
          occupiedMap[key] = num;
        }
      }

      if (overlapCount > 0) {
        return {
          success: false,
          message: '선이 서로 교차하거나 겹친 칸이 존재합니다.<br>각 칸은 오직 하나의 선만 지나갈 수 있습니다.'
        };
      }

      const filledCount = Object.keys(occupiedMap).length;
      if (filledCount < totalCells) {
        const remaining = totalCells - filledCount;
        return {
          success: false,
          message: `선이 채워지지 않은 <strong>빈칸이 ${remaining}칸</strong> 남아 있습니다.<br>규칙에 따라 격자의 모든 빈칸을 남김없이 채워야 합니다.`
        };
      }

      return { success: true };
    }

    showModal({ type, icon, title, body, confirmText, onConfirm }) {
      this.modalIcon.textContent = icon;
      this.modalTitle.textContent = title;
      this.modalTitle.className = `modal-title ${type}`;
      this.modalBody.innerHTML = body;
      this.modalBtnConfirm.textContent = confirmText || '확인';

      this.pendingModalCallback = onConfirm || null;
      this.modalAlert.classList.add('active');
    }

    closeModal() {
      this.modalAlert.classList.remove('active');
      if (this.pendingModalCallback) {
        const cb = this.pendingModalCallback;
        this.pendingModalCallback = null;
        cb();
      }
    }

    showEndingScreen() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.sound.playVictory();
      this.confetti.launch(150);

      const totalMins = String(Math.floor(this.totalElapsedSeconds / 60)).padStart(2, '0');
      const totalSecs = String(this.totalElapsedSeconds % 60).padStart(2, '0');
      this.endTotalTime.textContent = `${totalMins}:${totalSecs}`;

      this.showScreen(this.screenEnding);
    }

    // ========================================================================
    // 6. 캔버스 렌더러 (모던 수학 테마)
    // ========================================================================
    render() {
      const ctx = this.ctx;
      const w = this.canvasWidth;
      const h = this.canvasHeight;
      const sz = this.cellSize;

      ctx.clearRect(0, 0, w, h);

      // 격자 배경
      ctx.fillStyle = '#090E1A';
      ctx.fillRect(0, 0, w, h);

      // 격자 셀 배경 및 경계선
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const x = c * sz;
          const y = r * sz;

          ctx.fillStyle = (r + c) % 2 === 0 ? '#0D1527' : '#090E1A';
          ctx.fillRect(x, y, sz, sz);

          ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, sz - 1, sz - 1);
        }
      }

      // 선(경로) 렌더링
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const [numStr, path] of Object.entries(this.paths)) {
        if (!path || path.length < 1) continue;
        const num = parseInt(numStr, 10);
        const palette = COLOR_PALETTE[(num - 1) % COLOR_PALETTE.length];

        // 외부 글로우
        ctx.save();
        ctx.strokeStyle = palette.color;
        ctx.lineWidth = Math.max(8, sz * 0.38);
        ctx.shadowColor = palette.glow;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
          const px = path[i].c * sz + sz / 2;
          const py = path[i].r * sz + sz / 2;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // 내부 밝은 코어 하이라이트
        ctx.strokeStyle = palette.light;
        ctx.lineWidth = Math.max(3, sz * 0.12);
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.restore();
      }

      // 숫자 엔드포인트 노드 렌더링
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const val = this.initialGrid[r][c];
          if (val > 0) {
            this.drawNumberNode(r, c, val);
          }
        }
      }
    }

    drawNumberNode(r, c, num) {
      const ctx = this.ctx;
      const sz = this.cellSize;
      const cx = c * sz + sz / 2;
      const cy = r * sz + sz / 2;
      const radius = sz * 0.38;
      const palette = COLOR_PALETTE[(num - 1) % COLOR_PALETTE.length];

      const pair = this.endpoints[num];
      let isConnected = false;
      const path = this.paths[num];
      if (path && path.length >= 2) {
        const first = path[0];
        const last = path[path.length - 1];
        const p1 = pair[0];
        const p2 = pair[1];
        isConnected =
          (first.r === p1.r && first.c === p1.c && last.r === p2.r && last.c === p2.c) ||
          (first.r === p2.r && first.c === p2.c && last.r === p1.r && last.c === p1.c);
      }

      ctx.save();

      // 외부 원형 글로우
      ctx.shadowColor = palette.glow;
      ctx.shadowBlur = isConnected ? 16 : 8;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = palette.color;
      ctx.fill();

      // 테두리
      ctx.lineWidth = Math.max(2, sz * 0.05);
      ctx.strokeStyle = isConnected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)';
      ctx.stroke();

      // 내부 음영 그라데이션
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.88, 0, Math.PI * 2);
      ctx.fill();

      // 숫자 텍스트
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.floor(sz * 0.46)}px 'JetBrains Mono', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num, cx, cy + 1);

      ctx.restore();
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.game = new NumberlinkGame();
  });
})();
