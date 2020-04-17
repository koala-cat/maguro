# Maguro

Draw Overlay On Map

# Examples

[./examples/map.html](./examples/map.html)

# Dependencies

```
'node_modules/maguro/dist': 'dist/web-content/lib/maguro',
'node_modules/maguro/src/assets/images': 'dist/web-content/assets/images'
```

# Map

#### Clusterer

```
按地图缩放比例显示/隐藏覆盖物
    
import {  showOverlays } from 'clusterer'
map.addEventListener('zoomend', () => {
    showOverlays()
})
```

#### Geometric operation

```
计算点、线、面是否在某个区域内，返回boolean

import { isOverlayInFrame } from 'geo'
```

# Ovelay

drawing on map, extends BMap

```
每个类型覆盖物定义的基本方法：
    overlay.draw(): 绘制
    overlay.enableEditing(): 开启编辑
    overlay.disableEditing(): 关闭编辑
    overlay.update(): 修改
    overlay.delete(): 删除
    overlay.drag(): 拖拽

```

#### Marker

```
在地图上绘制标注（icon（image）、symbol、svg）

class Marker extends BMap.Marker

const marker = new Marker(point, options)
marker.enableEditing()  // 编辑状态、修改、删除、拖拽
```

#### Polyline

```
在地图上绘制直线（solid）、虚线（dashed），鼠标左键双击结束绘制

class Polyline extends BMap.Polyline

const polyline = new Polyline(points, options)
polyline.enableEditing()  // 编辑状态、修改、删除、拖拽
```

#### Circle

```
在地图上绘制圆形

class Circle extends BMap.Circle

const circle = new Circle(points, options)
circle.enableEditing()  // 编辑状态、修改、删除、拖拽
```

#### Rectangle

```
在地图上绘制矩形

class Rectangle extends BMap.Polygon

const rectangle = new Rectangle(points, options)
rectangle.enableEditing()  // 编辑状态、修改、删除、拖拽
```

#### Polygon

```
在地图上绘制多边形，鼠标左键双击结束绘制

class Polygon extends BMap.Polygon

const polygon = new Polygon(points, options)
polygon.enableEditing()  // 编辑状态、修改、删除、拖拽
```

#### Label

```
在地图上绘制文本

class Label extends BMap.Label

const label = new Label(points, options)
label.enableEditing()  // 编辑状态、修改、删除、拖拽
```

#### CustomSpecial

```
在线上绘制特殊覆盖物，类型：
    specialDoubleLine（双平行线）
    specialTripleLine（三平行线）
    specialRect（矩形）
    specialAngularRect（带角矩形）
    
绘制方式：选择类型在折线上打两个点，按照两点间折线走向绘制出特殊类型覆盖物

class CustomSpecial
const special = new CustomSpecial(point, polyline, options)
special.draw()
special.enableEditing() // 编辑状态、修改、删除、拖拽
```


#### CustomOverlay

```
自定义类型覆盖物，主要作为其他类型自定义覆盖物的父类使用

class CustomOverlay extends BMap.Overlay

customOverlay.addEventListener(): 添加监听事件
customOverlay.removeEventListener(): 移除监听事件
customOverlay.getPosition(): 获取覆盖物位置
customOverlay.setPosition(): 设置覆盖物位置
```

#### CustomSvg

```
自定义svg覆盖物

class CustomSvg extends CustomOverlay

扩展方法：
    getBounds(): 获取覆盖物区域范围
    setBounds(): 设置覆盖物区域范围
    setStyle(): 设置svg样式
    setBorder(): 设置覆盖物边框

const overlay = new CustomSvg(point, options)
overlay.enableEditing() // 编辑状态、修改、删除、拖拽
```
