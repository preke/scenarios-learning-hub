# Scenarios Learning Hub · 场景教学实验室

**[进入在线展示版](https://preke.github.io/demos/scenarios-learning-hub/index.html)** · [查看个人主页上的 Demo 条目](https://preke.github.io/demo.html#scenarios-learning-hub)

从场景目录选择一项工程任务，也可以直接打开下表中的课程。

| 场景 | 课程内容 | 语言与时长 |
| --- | --- | --- |
| [机械臂的第一次抓取](https://preke.github.io/demos/scenarios-learning-hub/robot-arm/) | 观察六轴机械臂的关节运动，安排抓取和放置零件的顺序。 | 英文，45–60 分钟 |
| [CubeSat 的首次对地观测](https://preke.github.io/demos/scenarios-learning-hub/cubesat/) | 拆看卫星组件，比较日照与地影中的电量，安排拍摄与数据下传。 | 中文，约 25 分钟 |
| [用望远镜寻找空间碎片](https://preke.github.io/demos/scenarios-learning-hub/telescope/) | 拆看地面望远镜，记录长短曝光，再从三帧模拟星图中判读移动候选体。 | 中文，约 20 分钟 |
| [点亮第一盏 LED](https://preke.github.io/demos/scenarios-learning-hub/circuit/) | 在虚拟面包板上搭建串联回路，观察 LED 极性和限流电阻怎样影响电流。 | 中文，约 20 分钟 |

## 本地预览

在仓库根目录运行以下命令，然后用浏览器打开 [本地场景目录](http://localhost:8000/)。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

## 协作编辑

- 修改目录文案或场景入口，请编辑 `index.html`。目录封面位于 `assets/`。
- 每门课程的入口是场景目录中的 `index.html`。望远镜与电路课程的脚本和专用样式位于各自目录，共用样式、图标和 Three.js 引擎位于 `common/`。
- 提交改动前，从本地目录进入修改过的场景，试用模型和实验控件，再通过页面导航返回目录。

本项目从[原场景教学实验室](https://preke.github.io/demos/scenarios-learning-hub/index.html)独立整理。初始内容对应[来源版本](https://github.com/preke/preke.github.io/tree/575ea3369e8104eff148669cb13c8b8ed9433724/demos/scenarios-learning-hub)。各场景页保留了原有的素材来源和署名。
