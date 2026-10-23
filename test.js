/** 数独核心逻辑测试：唯一解、难度分布、终盘合法性 */
var c = require('./game.js');
var diffs = { easy: 40, medium: 34, hard: 28, expert: 24 };
var ok = true;
function fail(msg) { ok = false; console.log('FAIL: ' + msg); }

// 1. generateSolved 合法性
for (var t = 0; t < 50; t++) {
  var s = c.generateSolved();
  var flat = [].concat.apply([], s);
  if (flat.some(function (v) { return v < 1 || v > 9; })) fail('终盘含非法值');
  for (var i = 0; i < 9; i++) {
    var row = {}, col = {}, box = {};
    for (var j = 0; j < 9; j++) {
      row[s[i][j]] = 1; col[s[j][i]] = 1;
      box[s[Math.floor(i / 3) * 3 + Math.floor(j / 3)][(i % 3) * 3 + (j % 3)]] = 1;
    }
    if (Object.keys(row).length !== 9) fail('第' + i + '行重复');
    if (Object.keys(col).length !== 9) fail('第' + i + '列重复');
    if (Object.keys(box).length !== 9) fail('第' + i + '宫重复');
  }
}
console.log('generateSolved x50 合法性通过');

// 2. makePuzzle 唯一解与难度分布
Object.keys(diffs).forEach(function (d) {
  var givens = [];
  for (var t = 0; t < 8; t++) {
    var p = c.makePuzzle(diffs[d]);
    var solCount = c.countSolutions(p.puzzle, 2);
    if (solCount !== 1) fail(d + ' 非唯一解: ' + solCount);
    // puzzle 与 solution 一致性：已填格必须等于终盘
    for (var r = 0; r < 9; r++) for (var cc = 0; cc < 9; cc++) {
      if (p.puzzle[r][cc] !== 0 && p.puzzle[r][cc] !== p.solution[r][cc]) fail(d + ' 题目与终盘矛盾');
    }
    givens.push(p.givens);
  }
  var avg = givens.reduce(function (a, b) { return a + b; }, 0) / givens.length;
  console.log(d + ' x8: givens=' + givens.join(',') + ' (目标 ' + diffs[d] + ', 均值 ' + avg.toFixed(1) + ')');
  if (avg > diffs[d] + 8) fail(d + ' 提示数偏离目标过大');
});

console.log(ok ? 'ALL TESTS PASSED' : 'TESTS FAILED');
process.exit(ok ? 0 : 1);
