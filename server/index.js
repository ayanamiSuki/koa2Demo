// const Koa = require('koa')
import Koa from 'koa';
import consola from 'consola';
// import pkg from 'nuxt';
// const { Nuxt, Builder } = pkg;
import path from 'path';
const __dirname = path.resolve();
//引入必要的模块
import cors from 'koa2-cors';
import mongoose from 'mongoose';
import bodyParser from 'koa-bodyparser';
import session from 'koa-generic-session';
import Redis from 'koa-redis';
import json from 'koa-json';
import koaStatic from 'koa-static';
import dbConfig from './dbs/config.js';
import passport from './interface/utils/passport.js';
import users from './interface/users.js';
import article from './interface/article.js';
import comment from './interface/comment.js';
import picture from './interface/picture.js';
const app = new Koa();

// Import and Set Nuxt.js options
// import config from '../nuxt.config.js';
// config.dev = app.env !== 'production';

async function start() {
  // Instantiate nuxt.js
  // const nuxt = new Nuxt(config);

  const host = process.env.HOST || '127.0.0.1',
    port = process.env.PORT || 3000;
  // 处理跨域
  app.use(
    cors({
      origin: function (ctx) {
        return 'http://localhost:8080'; //只允许http://localhost:8080这个域名的请求
      },
      maxAge: 5, //指定本次预检请求的有效期，单位为秒。
      credentials: true, //是否允许发送Cookie
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], //设置所允许的HTTP请求方法
      allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'Access-Control-Allow-Headers', 'x-requested-with'], //设置服务器支持的所有头信息字段
      exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'], //设置获取其他自定义字段
    })
  );
  //设定
  app.use(koaStatic(__dirname + './static'));
  app.keys = ['aya', 'keys'];
  app.proxy = true;

  app.use(
    session({
      key: 'aya',
      prefix: 'aya:uid',
      store: new Redis(),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, //one day in ms,
      },
    })
  );
  app.use(
    bodyParser({
      extendTypes: ['json', 'form', 'text'],
    })
  );
  app.use(json());
  //连接数据库
  //DeprecationWarning: collection.ensureIndex is deprecated. Use createIndexes instead
  mongoose.set('useCreateIndex', true);
  //Mongoose: `findOneAndUpdate()` and `findOneAndDelete()` without the `useFindAndModify` option set to false are deprecated.
  mongoose.set('useFindAndModify', false);
  mongoose.connect(dbConfig.dbs, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  //身份验证
  app.use(passport.initialize());
  app.use(passport.session());

  // await nuxt.ready();
  // // Build in development
  // if (config.dev) {
  //   const builder = new Builder(nuxt);
  //   await builder.build();
  // }
  //路由
  app.use(users.routes()).use(users.allowedMethods());
  app.use(article.routes()).use(article.allowedMethods());
  app.use(comment.routes()).use(comment.allowedMethods());
  app.use(picture.routes()).use(picture.allowedMethods());
  //=============
  // app.use(ctx => {
  //   ctx.status = 200;
  //   ctx.respond = false; // Bypass Koa's built-in response handling
  //   ctx.req.ctx = ctx; // This might be useful later on, e.g. in nuxtServerInit or with nuxt-stash
  //   nuxt.render(ctx.req, ctx.res);
  // });

  app.listen(port, host);
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true,
  });
}

start();
