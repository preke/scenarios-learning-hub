# Scenarios Learning Hub · 场景教学实验室

**[进入在线展示版](https://preke.github.io/demos/scenarios-learning-hub/index.html)** · [查看个人主页上的 Demo 条目](https://preke.github.io/demo.html#scenarios-learning-hub)

从场景目录选择一项工程任务，也可以直接打开下表中的课程。

| 场景 | 课程内容 | 语言与时长 |
| --- | --- | --- |
| [机械臂的第一次抓取](https://preke.github.io/demos/scenarios-learning-hub/robot-arm/) | 观察六轴机械臂的关节运动，安排抓取和放置零件的顺序。 | 英文，45–60 分钟 |
| [CubeSat 的首次对地观测](https://preke.github.io/demos/scenarios-learning-hub/cubesat/) | 拆看卫星组件，比较日照与地影中的电量，安排拍摄与数据下传。 | 中文，约 25 分钟 |

## 本地预览

在仓库根目录运行以下命令，然后用浏览器打开 [本地场景目录](http://localhost:8000/)。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

## 协作编辑

- 修改目录文案或场景入口，请编辑 `index.html`。两张目录封面位于 `assets/`。
- 修改课程内容或交互，请编辑对应场景目录中的 `index.html`。各场景的样式、脚本和三维引擎均嵌入该 HTML 文件。
- 提交改动前，从本地目录进入修改过的场景，试用模型和实验控件，再通过页面导航返回目录。

本项目从[原场景教学实验室](https://preke.github.io/demos/scenarios-learning-hub/index.html)独立整理。初始内容对应[来源版本](https://github.com/preke/preke.github.io/tree/575ea3369e8104eff148669cb13c8b8ed9433724/demos/scenarios-learning-hub)。各场景页保留了原有的素材来源和署名。
