/**
 * 数独游戏 —— 核心生成逻辑与界面控制
 * 纯逻辑部分（生成终盘、解数统计、挖洞）可在 Node 环境下单元测试；
 * 界面部分仅在浏览器环境初始化。
*/
(function (global) {
  'use strict';

  /* ==================== 纯逻辑部分（Node 可测试） ==================== */

  /**
   * 检查在棋盘 board 的 (r,c) 位置放置数字 n 是否符合数独规则（行/列/宫不重复）。
   * @param {number[][]} board - 9x9 二维数组，0 表示空格
   * @param {number} r - 行号 0-8
   * @param {number} c - 列号 0-8
   * @param {number} n - 待放置数字 1-9
   * @returns {boolean} 合法返回 true，否则 false
   */
  function canPlace(board, r, c, n) {
    for (var i = 0; i < 9; i++) {
      if (board[r][i] === n) return false;
      if (board[i][c] === n) return false;
    }
    var br = Math.floor(r / 3) * 3;
    var bc = Math.floor(c / 3) * 3;
    for (var i = br; i < br + 3; i++) {
      for (var j = bc; j < bc + 3; j++) {
        if (board[i][j] === n) return false;
      }
    }
    return true;
  }

  /**
   * 返回数组的一个随机乱序副本（Fisher-Yates 洗牌）。
   * @param {Array} arr - 原数组
   * @returns {Array} 乱序后的新数组
   */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /**
   * 回溯生成一个完整的数独终盘（全部 81 格已填好且合法）。
   * @returns {number[][]} 9x9 完整终盘
   */
  function generateSolved() {
    var board = [];
    for (var r = 0; r < 9; r++) board.push([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    function fill(pos) {
      if (pos === 81) return true;
      var r = Math.floor(pos / 9);
      var c = pos % 9;
      var nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (var i = 0; i < 9; i++) {
        var n = nums[i];
        if (canPlace(board, r, c, n)) {
          board[r][c] = n;
          if (fill(pos + 1)) return true;
          board[r][c] = 0;
        }
      }
      return false;
    }
    fill(0);
    return board;
  }

  /**
   * 统计当前棋盘解的数量（MRV 启发式回溯），找到 limit 个解立即停止。
   * @param {number[][]} board - 9x9 棋盘，0 表示空格
   * @param {number} limit - 解数上限（唯一性校验传 2）
   * @returns {number} 找到的解的数量（达到 limit 即返回）
   */
  function countSolutions(board, limit) {
    var count = 0;
    var b = board.map(function (row) { return row.slice(); });
    function findBest() {
      var best = null;
      var bestLen = 10;
      for (var r = 0; r < 9; r++) {
        for (var c = 0; c < 9; c++) {
          if (b[r][c] !== 0) continue;
          var cands = [];
          for (var n = 1; n <= 9; n++) {
            if (canPlace(b, r, c, n)) cands.push(n);
          }
          if (cands.length < bestLen) {
            best = { r: r, c: c, cands: cands };
            bestLen = cands.length;
          }
          if (bestLen === 0) return best;
        }
      }
      return best;
    }
    function solve() {
      if (count >= limit) return;
      var cell = findBest();
      if (!cell) { count++; return; }
      for (var i = 0; i < cell.cands.length; i++) {
        b[cell.r][cell.c] = cell.cands[i];
        solve();
        b[cell.r][cell.c] = 0;
        if (count >= limit) return;
      }
    }
    solve();
    return count;
  }

  /**
   * 生成一道有唯一解的数独题目：先造终盘，再随机挖洞，
   * 每挖一格都校验唯一性，挖洞后不唯一则放回，直到达到目标提示数或无格可挖。
   * @param {number} targetGivens - 目标提示（已给出）格子数
   * @returns {{puzzle: number[][], solution: number[][], givens: number}}
   */
  function makePuzzle(targetGivens) {
    var solution = generateSolved();
    var puzzle = solution.map(function (row) { return row.slice(); });
    var cells = [];
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) cells.push({ r: r, c: c });
    }
    cells = shuffle(cells);
    var givens = 81;
    for (var i = 0; i < cells.length && givens > targetGivens; i++) {
      var r = cells[i].r;
      var c = cells[i].c;
      var backup = puzzle[r][c];
      if (backup === 0) continue;
      puzzle[r][c] = 0;
      if (countSolutions(puzzle, 2) !== 1) {
        puzzle[r][c] = backup;
      } else {
        givens--;
      }
    }
    return { puzzle: puzzle, solution: solution, givens: givens };
  }

  var SudokuCore = {
    canPlace: canPlace,
    shuffle: shuffle,
    generateSolved: generateSolved,
    countSolutions: countSolutions,
    makePuzzle: makePuzzle
  };

  global.SudokuCore = SudokuCore;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SudokuCore;
  }

  /* ==================== 界面部分（仅浏览器） ==================== */

  if (typeof document === 'undefined') return;

  /** 难度配置：目标提示数 */
  var DIFFICULTIES = {
    easy:   { name: '简单', givens: 40 },
    medium: { name: '中等', givens: 34 },
    hard:   { name: '困难', givens: 28 },
    expert: { name: '专家', givens: 24 }
  };

  var SAVE_KEY = 'sudoku-save-v1';

  /** 游戏状态 */
  var S = {
    puzzle: null,     // 题目（0 为空）
    solution: null,   // 终盘答案
    board: null,      // 当前盘面（含用户填入）
    notes: null,      // 笔记：9x9，每格为长度 10 的布尔数组（下标 1-9）
    sel: null,        // 当前选中格 {r, c}
    noteMode: false,  // 是否笔记模式
    mistakes: 0,      // 错误次数
    hints: 0,         // 提示次数
    seconds: 0,       // 用时秒数
    timerId: null,    // 计时器句柄
    undoStack: [],    // 撤销栈：每步为受影响格子的前置快照数组
    difficulty: 'medium',
    finished: false
  };

  var cellsEls = [];  // 81 个格子 DOM 缓存
  var noteEls = [];   // 每格 9 个笔记 span 缓存

  /**
   * 初始化棋盘 DOM（一次性构建 81 格及内部笔记节点）。
   * @returns {void}
   */
  function buildBoard() {
    var boardEl = document.getElementById('board');
    for (var r = 0; r < 9; r++) {
      cellsEls.push([]);
      noteEls.push([]);
      for (var c = 0; c < 9; c++) {
        (function (r, c) {
          var cell = document.createElement('div');
          cell.className = 'cell';
          if (r % 3 === 0) cell.classList.add('b-top');
          if (c % 3 === 0) cell.classList.add('b-left');
          if (r === 8) cell.classList.add('b-bottom');
          if (c === 8) cell.classList.add('b-right');
          var val = document.createElement('span');
          val.className = 'val';
          cell.appendChild(val);
          var noteBox = document.createElement('div');
          noteBox.className = 'notes';
          var ns = [];
          for (var n = 1; n <= 9; n++) {
            var s = document.createElement('span');
            noteBox.appendChild(s);
            ns.push(s);
          }
          cell.appendChild(noteBox);
          cell.addEventListener('click', function () {
            selectCell(r, c);
          });
          boardEl.appendChild(cell);
          cellsEls[r].push({ cell: cell, val: val });
          noteEls[r].push(ns);
        })(r, c);
      }
    }
  }

  /**
   * 开启新游戏：生成题目并重置全部状态。
   * @param {string} diff - 难度键（easy/medium/hard/expert）
   * @returns {void}
   */
  function newGame(diff) {
    var made = makePuzzle(DIFFICULTIES[diff].givens);
    S.puzzle = made.puzzle;
    S.solution = made.solution;
    S.board = made.puzzle.map(function (row) { return row.slice(); });
    S.notes = [];
    for (var r = 0; r < 9; r++) {
      var row = [];
      for (var c = 0; c < 9; c++) {
        var arr = [];
        for (var n = 0; n <= 9; n++) arr.push(false);
        row.push(arr);
      }
      S.notes.push(row);
    }
    S.sel = null;
    S.noteMode = false;
    S.mistakes = 0;
    S.hints = 0;
    S.seconds = 0;
    S.undoStack = [];
    S.difficulty = diff;
    S.finished = false;
    startTimer();
    save();
    updateAll();
  }

  /**
   * 启动/重置计时器。
   * @returns {void}
   */
  function startTimer() {
    if (S.timerId) clearInterval(S.timerId);
    S.timerId = setInterval(function () {
      if (!S.finished) {
        S.seconds++;
        updateStatus();
        if (S.seconds % 10 === 0) save();
      }
    }, 1000);
  }

  /**
   * 选中格子 (r,c) 并刷新高亮。
   * @param {number} r - 行号
   * @param {number} c - 列号
   * @returns {void}
   */
  function selectCell(r, c) {
    if (S.finished) return;
    S.sel = { r: r, c: c };
    updateBoard();
  }

  /**
   * 记录一步操作的撤销快照（受影响格子修改前的值与笔记）。
   * @param {Array<{r:number,c:number}>} coords - 受影响格子坐标列表
   * @returns {void}
   */
  function pushUndo(coords) {
    var snap = [];
    for (var i = 0; i < coords.length; i++) {
      var r = coords[i].r;
      var c = coords[i].c;
      snap.push({ r: r, c: c, val: S.board[r][c], notes: S.notes[r][c].slice() });
    }
    S.undoStack.push(snap);
    if (S.undoStack.length > 300) S.undoStack.shift();
  }

  /**
   * 悔一步：恢复最近一次操作影响的格子。
   * @returns {void}
   */
  function undo() {
    if (S.finished || !S.undoStack.length) return;
    var snap = S.undoStack.pop();
    for (var i = 0; i < snap.length; i++) {
      var e = snap[i];
      S.board[e.r][e.c] = e.val;
      S.notes[e.r][e.c] = e.notes;
    }
    save();
    updateAll();
  }

  /**
   * 在当前选中格写入数字 n：笔记模式下切换候选笔记；普通模式下填数、
   * 填对则自动清除同行/列/宫的相同笔记，填错则计一次错误。
   * @param {number} n - 数字 1-9
   * @returns {void}
   */
  function place(n) {
    if (S.finished || !S.sel) return;
    var r = S.sel.r;
    var c = S.sel.c;
    if (S.puzzle[r][c] !== 0) return; // 题目给定格不可改
    if (S.noteMode) {
      if (S.board[r][c] !== 0) return; // 已填数的格子不能记笔记
      pushUndo([{ r: r, c: c }]);
      S.notes[r][c][n] = !S.notes[r][c][n];
    } else {
      if (S.board[r][c] === n) return; // 重复点同一数字视为无操作
      pushUndo([{ r: r, c: c }]);
      S.board[r][c] = n;
      if (n !== S.solution[r][c]) {
        S.mistakes++;
      } else {
        clearPeerNotes(r, c, n);
      }
    }
    save();
    updateAll();
    checkWin();
  }

  /**
   * 清除与 (r,c) 同行/列/宫格子中数字 n 的笔记（辅助自动消笔记）。
   * @param {number} r - 行号
   * @param {number} c - 列号
   * @param {number} n - 数字
   * @returns {void}
   */
  function clearPeerNotes(r, c, n) {
    var coords = [];
    for (var i = 0; i < 9; i++) {
      coords.push({ r: r, c: i });
      coords.push({ r: i, c: c });
    }
    var br = Math.floor(r / 3) * 3;
    var bc = Math.floor(c / 3) * 3;
    for (var i = br; i < br + 3; i++) {
      for (var j = bc; j < bc + 3; j++) {
        coords.push({ r: i, c: j });
      }
    }
    var touched = [];
    for (var k = 0; k < coords.length; k++) {
      var rr = coords[k].r;
      var cc = coords[k].c;
      if (S.notes[rr][cc][n]) touched.push(coords[k]);
    }
    if (!touched.length) return;
    pushUndo(touched);
    for (var k = 0; k < touched.length; k++) {
      S.notes[touched[k].r][touched[k].c][n] = false;
    }
  }

  /**
   * 擦除当前选中格的用户数字或笔记。
   * @returns {void}
   */
  function erase() {
    if (S.finished || !S.sel) return;
    var r = S.sel.r;
    var c = S.sel.c;
    if (S.puzzle[r][c] !== 0) return;
    if (S.board[r][c] === 0 && !S.notes[r][c].some(function (x) { return x; })) return;
    pushUndo([{ r: r, c: c }]);
    S.board[r][c] = 0;
    for (var n = 1; n <= 9; n++) S.notes[r][c][n] = false;
    save();
    updateAll();
  }

  /**
   * 提示：将当前选中格填入正确答案并清除关联笔记。
   * @returns {void}
   */
  function hint() {
    if (S.finished || !S.sel) return;
    var r = S.sel.r;
    var c = S.sel.c;
    if (S.board[r][c] === S.solution[r][c]) return;
    S.noteMode = false;
    S.hints++;
    pushUndo([{ r: r, c: c }]);
    S.board[r][c] = S.solution[r][c];
    for (var n = 1; n <= 9; n++) S.notes[r][c][n] = false;
    clearPeerNotes(r, c, S.solution[r][c]);
    save();
    updateAll();
    checkWin();
  }

  /**
   * 检查是否完成：全部格子与终盘一致则结束游戏并展示成绩。
   * @returns {void}
   */
  function checkWin() {
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (S.board[r][c] !== S.solution[r][c]) return;
      }
    }
    S.finished = true;
    if (S.timerId) clearInterval(S.timerId);
    save();
    var overlay = document.getElementById('overlay');
    var t = fmtTime(S.seconds);
    document.getElementById('result').textContent =
      DIFFICULTIES[S.difficulty].name + ' · 用时 ' + t +
      ' · 错误 ' + S.mistakes + ' 次 · 提示 ' + S.hints + ' 次';
    overlay.classList.add('show');
    updateAll();
  }

  /**
   * 秒数格式化为 mm:ss。
   * @param {number} s - 秒数
   * @returns {string} 格式化时间
   */
  function fmtTime(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  }

  /**
   * 刷新状态栏（难度/计时/错误/笔记模式按钮）。
   * @returns {void}
   */
  function updateStatus() {
    document.getElementById('diff-label').textContent = DIFFICULTIES[S.difficulty].name;
    document.getElementById('timer').textContent = fmtTime(S.seconds);
    document.getElementById('mistakes').textContent = S.mistakes;
    document.getElementById('btn-note').classList.toggle('active', S.noteMode);
  }

  /**
   * 刷新棋盘高亮与内容。
   * @returns {void}
   */
  function updateBoard() {
    var selV = S.sel ? S.board[S.sel.r][S.sel.c] : 0;
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var el = cellsEls[r][c];
        var v = S.board[r][c];
        var cell = el.cell;
        el.val.textContent = v === 0 ? '' : String(v);
        cell.classList.toggle('given', S.puzzle[r][c] !== 0);
        cell.classList.toggle('filled', S.puzzle[r][c] === 0 && v !== 0);
        var wrong = S.puzzle[r][c] === 0 && v !== 0 && v !== S.solution[r][c];
        cell.classList.toggle('error', wrong);
        var isPeer = false;
        var isSame = false;
        if (S.sel) {
          isPeer = r === S.sel.r || c === S.sel.c ||
            (Math.floor(r / 3) === Math.floor(S.sel.r / 3) &&
             Math.floor(c / 3) === Math.floor(S.sel.c / 3));
          isSame = v !== 0 && v === selV;
        }
        cell.classList.toggle('sel', !!S.sel && r === S.sel.r && c === S.sel.c);
        cell.classList.toggle('peer', isPeer && !cell.classList.contains('sel'));
        cell.classList.toggle('same', isSame);
        for (var n = 1; n <= 9; n++) {
          noteEls[r][c][n - 1].textContent = S.notes[r][c][n] ? String(n) : '';
        }
      }
    }
  }

  /**
   * 刷新数字键盘（每个数字的剩余可填数量，填满 9 个置灰）。
   * @returns {void}
   */
  function updatePad() {
    var counts = [];
    for (var n = 0; n <= 9; n++) counts.push(0);
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var v = S.board[r][c];
        if (v !== 0) counts[v]++;
      }
    }
    var pad = document.getElementById('pad');
    var btns = pad.querySelectorAll('button[data-n]');
    for (var i = 0; i < btns.length; i++) {
      var n = parseInt(btns[i].getAttribute('data-n'), 10);
      btns[i].querySelector('.rest').textContent = String(Math.max(0, 9 - counts[n]));
      btns[i].disabled = counts[n] >= 9;
    }
  }

  /**
   * 全量刷新界面。
   * @returns {void}
   */
  function updateAll() {
    updateBoard();
    updatePad();
    updateStatus();
  }

  /**
   * 保存进度到 localStorage。
   * @returns {void}
   */
  function save() {
    try {
      var data = {
        v: 1,
        puzzle: S.puzzle,
        solution: S.solution,
        board: S.board,
        notes: S.notes,
        mistakes: S.mistakes,
        hints: S.hints,
        seconds: S.seconds,
        difficulty: S.difficulty,
        finished: S.finished
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) { /* 存储不可用则忽略 */ }
  }

  /**
   * 从 localStorage 恢复进度；无存档或存档已完成返回 false。
   * @returns {boolean} 恢复成功返回 true
   */
  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      var d = JSON.parse(raw);
      if (!d || d.v !== 1 || !d.board || d.finished) return false;
      S.puzzle = d.puzzle;
      S.solution = d.solution;
      S.board = d.board;
      S.notes = d.notes;
      S.mistakes = d.mistakes;
      S.hints = d.hints;
      S.seconds = d.seconds;
      S.difficulty = d.difficulty;
      S.finished = false;
      S.undoStack = [];
      S.sel = null;
      S.noteMode = false;
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 绑定全部界面事件（键盘、按钮、数字键盘、难度切换）。
   * @returns {void}
   */
  function bindEvents() {
    var pad = document.getElementById('pad');
    pad.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button[data-n]');
      if (btn) place(parseInt(btn.getAttribute('data-n'), 10));
    });
    document.getElementById('btn-note').addEventListener('click', function () {
      S.noteMode = !S.noteMode;
      updateStatus();
    });
    document.getElementById('btn-undo').addEventListener('click', undo);
    document.getElementById('btn-erase').addEventListener('click', erase);
    document.getElementById('btn-hint').addEventListener('click', hint);
    document.getElementById('btn-new').addEventListener('click', function () {
      var sel = document.getElementById('diff-select');
      newGame(sel.value);
    });
    document.getElementById('diff-select').addEventListener('change', function () {
      newGame(this.value);
    });
    document.getElementById('overlay').addEventListener('click', function () {
      this.classList.remove('show');
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var k = ev.key;
      if (k >= '1' && k <= '9') {
        place(parseInt(k, 10));
      } else if (k === 'Backspace' || k === 'Delete' || k === '0') {
        erase();
      } else if (k === 'n' || k === 'N') {
        S.noteMode = !S.noteMode;
        updateStatus();
      } else if (k === 'z' || k === 'Z') {
        undo();
      } else if (k.indexOf('Arrow') === 0 && S.sel) {
        ev.preventDefault();
        var r = S.sel.r;
        var c = S.sel.c;
        if (k === 'ArrowUp') r = (r + 8) % 9;
        if (k === 'ArrowDown') r = (r + 1) % 9;
        if (k === 'ArrowLeft') c = (c + 8) % 9;
        if (k === 'ArrowRight') c = (c + 1) % 9;
        selectCell(r, c);
      }
    });
  }

  buildBoard();
  bindEvents();
  if (!load()) {
    newGame('medium');
  } else {
    startTimer();
    updateAll();
  }
})(typeof window !== 'undefined' ? window : globalThis);
