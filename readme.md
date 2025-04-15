# 1.初始化和启动

```shell
npm install

npm run dev
```


**注意需要替换自己的cenium token，位置src/config.my.js**

# 2.两种方法实现

方法1：v-if加变量控制面板显示（自定义样式，计算位置不遮挡mark）

方法2：自带的infobox(需要代开161行注释和)。

由于cenium默认创建的iframe有严格沙箱限制，打开sandbox权限会有Blocked script execution安全警告
