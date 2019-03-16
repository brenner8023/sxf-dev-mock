# sxf-dev-mock

sxf-dev-mock 是一种约定式本地动态模拟数据的实现

读取项目的mock目录，会生成配置对应的接口。

比如：
```
├── mock
    ├── api.ts
    └── users.ts
└── src
    └── pages
        └── index.tsx
```
`/mock` 下的 `api.ts` 和 `users.ts` 会被解析为 mock 文件

## 示例

```js
// mock/index.js
const foo = require('./foo.json');
const bar = require('./bar');
import mockjs from 'mockjs';

module.exports = {
  // 同时支持 GET 和 POST
  '/api/users/1': foo,
  '/api/foo/bar': bar(),

  // 支持标准 HTTP
  'GET /api/users': mockjs.mock({
    'list|100': [{
      name: '@city',
      'value|1-100': 50,
      'type|0-2': 1
    }],
  }),
  'DELETE /api/users': { users: [1, 2] },

  // 支持自定义函数，API 参考 express4
  'POST /api/users/create': (req, res) => {
    res.end('OK');
  },

  // 支持参数
  'POST /api/users/:id': (req, res) => {
    res.send({ users: [1, 2] });
  },
};
```

## 服务代码使用方法

```js
// server.js
const express = require('express');

const mockServer = require('mock-server');

const app = express();

mockServer(app);

app.get('/', (req, res) => res.send('hello world'));

app.listen(6001, () => {
  console.log('Example app listening on port 6001!');
  console.log('http://127.0.0.1:6001');
});
```
