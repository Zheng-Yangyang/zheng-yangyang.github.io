# 博客访问日志

生产部署：`/home/zyy/blog-visitor-log/`，Docker 容器 `blog-visitor-log`。
Caddy 在现有 HTTPS IP 站点上转发 `/blog-stats/*`，不对公网直接开放 3088。

- 管理页：https://124.220.193.89/blog-stats/admin
- 用户名：zyy
- 随机生成的密码只保存在服务器 `data/admin-password`，不提交 Git。
- 查看密码：`ssh zyy@124.220.193.89 'cat ~/blog-visitor-log/data/admin-password'`
- 日志：`data/YYYY-MM-DD.jsonl`，自动保留 90 天；请按需备份。
- 仅接受博客 Origin，每 IP 每分钟最多 30 次；Origin 校验不能防止伪造统计。
- 通过 ipwho.is 查询近似地区，超时则记录“未知”。
- 停用：移除博客对 `/visitor-log.js` 的引用，然后停止容器；不影响 GitHub Pages。
- Caddy 原配置备份：`/home/zyy/lifeos/deploy/Caddyfile.ip.before-blog-stats`。

更新代码后重启容器生效。已有服务器密码、日志均不在本仓库内。
