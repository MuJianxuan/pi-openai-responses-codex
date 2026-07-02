# Repository Guidelines

## Project Structure & Module Organization
`src/` 是核心代码目录。`src/index.js` 负责注册 provider；`src/transport/` 存放 vendored OpenAI Responses transport pipeline；`src/utils/` 放本包自带的辅助函数。根目录的 `README.md` 说明架构、安装和环境变量。当前仓库没有独立 `test/` 或 `tests/` 目录。

## Build, Test, and Development Commands
- `npm install`：安装依赖，要求 Node.js `>=22.19.0`。
- `npm run check:syntax`：对关键源文件执行 `node --check`，这是当前主要的代码正确性校验。
- `npm run pack:check`：执行 `npm pack --dry-run`，确认发布包内容正确。
- `npm run prepublishOnly`：发布前串联运行语法检查和打包检查。

本仓库是扩展包，不提供独立 dev server；本地联调以打包校验和在 pi 中安装验证为主。

## Coding Style & Naming Conventions
遵循现有代码风格：ESM 模块、2 空格缩进、双引号、保留分号。优先写小而直接的函数，例如 `readEnv()`、`buildApiKeyConfig()`；常量使用 `UPPER_SNAKE_CASE`，普通变量和函数使用 `camelCase`。新增文件优先放入现有的 `transport/` 或 `utils/` 分类，避免为单次用途引入新抽象。

## Testing Guidelines
当前没有自动化测试框架。提交前至少运行：
- `npm run check:syntax`
- `npm run pack:check`

如果修改 transport 行为，建议同时做一次手工 smoke test，验证 provider 能被 pi 正常加载、模型可见、基础请求可发出。后续若补测试，建议按源码路径镜像命名，例如 `src/utils/hash.test.js`。

## Commit & Pull Request Guidelines
现有历史采用简短、描述式提交标题，例如 `Initial commit: pi-openai-responses-codex extension`。后续建议保持单行、明确范围，例如 `transport: preserve tool-call ids for replay`。PR 应包含：变更目的、影响文件、验证命令输出，以及涉及行为变化时的使用说明。若变更环境变量或发布内容，请同步更新 `README.md`。

## Security & Configuration Tips
不要提交真实 API keys。配置通过 `PI_OPENAI_RESPONSES_CODEX_BASE_URL` 和 `PI_OPENAI_RESPONSES_CODEX_API_KEY_ENV` 控制；修改默认值前，先确认与 `README.md` 中的说明一致。