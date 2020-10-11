const foo = require('./foo.json');
const bar = require('./bar');

module.exports = {

  // 省略method，则默认为get请求
  '/api/users/123': foo,
  '/api/foo/bar': bar(),

  // 支持mockjs语法
  'GET /api/users': { 'users|1': [1, 2] },
  'DELETE /api/users': { users: [1, 2] },

  // 支持自定义函数，API 参考 express4
  'POST /api/users/create': (req, res) => {
    res.end('OK');
  },

  // 支持参数
  'GET /api/users/:id': (req, res) => {
    res.send({ users: [1, 2] });
  }
};
