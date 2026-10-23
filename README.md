# 数独 Sudoku

一个纯前端数独游戏，无任何依赖，单页发布于 GitHub Pages。

**在线试玩**：<https://782042369.github.io/sudoku/>

## 功能

- 四档难度：简单 / 中等 / 困难 / 专家（按提示数 40 / 34 / 28 / 24）
- 生成器保证**唯一解**：随机终盘 + 逐格挖洞，每次挖洞都做解数校验
- 笔记模式（候选数小字）、自动消除同行/列/宫笔记
- 撤销、擦除、提示、错误计数、计时
- 高亮：选中格同行/列/宫、相同数字联动
- 键盘操作：数字键填入、方向键移动、N 笔记、Z 撤销、退格擦除
- 进度自动保存（localStorage），刷新不丢
- 自动适配深色模式与移动端

## 技术说明

- 纯原生 HTML / CSS / JavaScript，零依赖，无构建步骤
- 核心生成逻辑（game.js 前半部分）可在 Node 中直接单元测试：

```bash
node -e "const c = require('./game.js'); const p = c.makePuzzle(34); console.log(p.givens, c.countSolutions(p.puzzle, 2));"
```

## License

MIT
