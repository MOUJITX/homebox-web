# 附件上传与内容搜索功能

## 需求背景

当前 Homebox 系统在资产管理（Assets）和有效期管理（Goods/Items）中，仅支持图片上传（用于展示物品照片）。用户需要为资产和有效期物品上传说明书、用户手册、采购合同等文档附件，并能够在不进入具体详情页的情况下，通过关键词快速搜索附件内容。

系统已有 `FileRecord` 通用文件记录表和 `FileStorageStrategy` 存储策略（支持本地和 Qiniu OSS 自动切换），文件管理（Files）模块也已实现通用的文件上传/下载/删除。本需求在此基础上扩展附件能力和内容搜索能力。

**技术方案选型：Elasticsearch**，原因：
1. 原生 IK Analyzer 中文分词，语义边界处理优于 ngram
2. 原生 BM25 相关性排序 + highlight 高亮，无需应用层实现
3. 原生 `dense_vector` + kNN 向量检索，后续接入 AI Chat Bot 的语义搜索/RAG 可无缝升级，无需再次迁移基础设施
4. 原生 hybrid search（RRF 融合排序），关键词 + 语义混合检索开箱即用
5. 避免应用层手动实现分词、过滤、排序、高亮，代码更简洁可靠

---

## 需求内容

### 一、资产附件（Asset Attachments）

#### 1.1 功能描述

在资产详情中新增「附件」Tab（与「图片」并列），支持：
- 上传文档附件（txt / doc / docx / pdf 等，不限制格式）
- 附件列表展示（文件名、大小、上传时间）
- 下载附件
- 删除附件
- 上传后异步文本提取 + ES 索引，未完成时显示「索引中」状态

#### 1.2 与子资产的关系

- 父资产的附件不在子资产详情中显示
- 子资产的附件不在父资产详情中显示
- 各资产的附件完全独立

#### 1.3 数据模型

新建 `asset_attachments` 表：

| 列名 | 类型 | 约束 |
|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT |
| asset_id | BIGINT | NOT NULL, FK → assets(id) |
| file_id | BIGINT | NOT NULL, FK → file_records(id) |

### 二、有效期物品附件（Good Attachments）

#### 2.1 功能描述

在有效期物品（Good）的展开行/详情中新增「附件」Tab（与「图片」并列），功能与资产附件相同。

#### 2.2 数据模型

新建 `good_attachments` 表：

| 列名 | 类型 | 约束 |
|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT |
| good_id | BIGINT | NOT NULL, FK → goods(id) |
| file_id | BIGINT | NOT NULL, FK → file_records(id) |

### 三、文件大小限制调整

将所有文件上传大小限制从当前的 10MB 统一修改为 **100MB**，涉及位置：
- `application.yml`：`spring.servlet.multipart.max-file-size` + `max-request-size`
- `LocalStorageStrategy.validateFile()`
- `QiniuStorageStrategy.validateFile()`

### 四、内容搜索（基于 Elasticsearch）

#### 4.1 搜索范围

同时搜索以下来源的文件内容：
- 资产附件（Asset Attachment）
- 有效期物品附件（Good Attachment）
- 文件管理中的文件（FileRecord / Files）

未来可扩展到发票附件。

#### 4.2 搜索技术方案

```
┌─────────────────────────────────────────────────────────────────┐
│                        数据写入路径                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  上传文件（同步）                                                  │
│      → FileService 存储文件 + 创建 FileRecord                     │
│      → 返回成功，附件状态 = "索引中"                                │
│                                                                 │
│  文本提取 + 索引（异步 @Async）                                    │
│      → TextExtractionService:                                    │
│          PDF:  PDFBox 逐页提取文本，记录页码边界                    │
│          其他: Tika 提取全文                                      │
│      → ChunkingService: 按 ~500 字符分块（50 字符重叠）            │
│      → 写入 MySQL text_chunks 表（持久化，数据源头）                │
│      → 批量索引到 ES chunks 索引                                  │
│      → 更新 MySQL text_chunks.indexed = true                     │
│      → 附件状态 = "就绪"                                          │
│                                                                 │
│  删除文件                                                         │
│      → 删除 FileRecord + MySQL text_chunks                       │
│      → ES: delete_by_query(fileId = ?)                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                        数据读取路径                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户搜索 "进口红酒"                                               │
│      → ES query (ik_smart 分词 + multi_match + highlight)       │
│      → 返回: fileId, chunkIndex, pageNumber,                    │
│              高亮片段 (ES highlight), BM25 _score                │
│      → 应用层: 按 fileId 分组                                     │
│      → 批量查 MySQL: file_records + LEFT JOIN 中间表             │
│        → 获取 originalFilename, contentType, fileSize            │
│        → 获取 sources (ASSET/GOOD/FILE 归属信息)                  │
│      → 组装响应，按 _score 排序                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.3 搜索能力对照

| 能力 | 实现方式 | 负责层 |
|------|---------|-------|
| 中文分词 | IK Analyzer（`ik_smart` 搜索时，`ik_max_word` 索引时） | ES |
| 关键词高亮 | ES `highlight` 原生返回 `<em>` 标签包裹的片段 | ES |
| 模糊匹配 | IK 分词语义拆分 + ES `match_phrase` / `multi_match` | ES |
| 排除伪匹配 | IK 分词理解语义边界，不会把「进口红酒」切成「口红」 | ES |
| 页码定位 | PDFBox 逐页提取记录 page_number 到 chunk | 应用层 |
| 相关性排序 | ES BM25 原生 `_score` | ES |
| AI 语义搜索 | ES `dense_vector` + kNN（预留，本期不实现 embedding） | ES（已内置支持） |
| AI 混合搜索 | ES RRF 融合 BM25 + kNN（预留） | ES（已内置支持） |

#### 4.4 新增依赖

**Server（build.gradle）：**
- `org.springframework.boot:spring-boot-starter-data-elasticsearch` — Spring Data ES 集成
- `org.apache.tika:tika-parsers-standard-package` — 多格式文本提取
- ~~`com.huaban:jieba-analysis`~~ — **不需要**（IK Analyzer 替代）

**Docker（docker-compose.yml）：**
- Elasticsearch 8.x 服务（单节点）
- IK Analyzer 插件

### 五、搜索 UI

#### 5.1 入口

- 顶栏（Topbar）全局搜索输入框
- 快捷键：**Ctrl+K** 唤起搜索弹窗

#### 5.2 搜索结果展示

- 每条结果标题格式：`[Tag1][Tag2] 文件名` — Tag 以标签形式显示在文件名前面
  - 关联多个功能时（文件管理除外）全部列出
  - 仅关联文件管理时不显示 Tag
- 每个文件下以子项形式列出高亮内容摘要
  - 最多显示 **5 个子项**
  - 子项按 **相关性排序**（ES `_score` 降序，服务端返回时已排序）
- 点击结果可跳转到对应功能页面

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 进口红酒                                                 │
├─────────────────────────────────────────────────────────────┤
│  [资产]  冰箱说明书.pdf                                       │
│    ├─ 第 3 页：...请使用<mark>进口</mark>压缩机专用电源...     │
│    └─ 第 8 页：...存放<mark>红酒</mark>时建议设置为 5°C...     │
│  [资产][发票]  采购清单.docx                                  │
│    └─ 第 1 页：...<mark>进口红酒</mark>采购批次清单...         │
│  [有效期]  生产日期参数.pdf                                    │
│    ├─ 第 2 页：...<mark>进口</mark>原料生产日期详见...          │
│    └─ 第 6 页：...<mark>红酒</mark>发酵时间需严格控制...        │
│  说明书备份.txt                        ← 仅关联文件管理，无 Tag │
│    ├─ ...<mark>进口</mark>压缩机参数表...                      │
│    └─ ...存储条件：<mark>红酒</mark>类需恒温...                │
├─────────────────────────────────────────────────────────────┤
│  共 12 条结果                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 数据模型变更汇总

### MySQL 新建表

#### `text_chunks` — 文件文本块（数据源头，持久化存储）

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| file_id | BIGINT | NOT NULL, FK → file_records(id) | 所属文件 |
| chunk_index | INT | NOT NULL | 块序号（0, 1, 2, ...） |
| chunk_text | MEDIUMTEXT | NOT NULL | 文本块内容（~500 字符） |
| page_number | INT | NULL | 所在页码（1-based，PDF 可精确，其他为 null） |
| token_count | INT | NULL | 字符数估算 |
| indexed | BIT(1) | NOT NULL, DEFAULT FALSE | 是否已同步到 ES |
| created_at | DATETIME(6) | NOT NULL, auto-set | |

- `file_records` 表**不新增列**（`extracted_text`/`page_offsets` 由 `text_chunks` 替代）
- 唯一约束：`UNIQUE(file_id, chunk_index)`

#### `asset_attachments`

| 列名 | 类型 | 约束 |
|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT |
| asset_id | BIGINT | NOT NULL, FK → assets(id) |
| file_id | BIGINT | NOT NULL, FK → file_records(id) |

#### `good_attachments`

| 列名 | 类型 | 约束 |
|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT |
| good_id | BIGINT | NOT NULL, FK → goods(id) |
| file_id | BIGINT | NOT NULL, FK → file_records(id) |

### Elasticsearch 索引

#### `chunks` 索引

```json
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "refresh_interval": "1s",
    "analysis": {
      "analyzer": {
        "ik_smart": {
          "type": "custom",
          "tokenizer": "ik_smart"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "chunkId":       { "type": "long" },
      "fileId":        { "type": "long" },
      "chunkIndex":    { "type": "integer" },
      "chunkText":     { "type": "text", "analyzer": "ik_max_word", "search_analyzer": "ik_smart" },
      "pageNumber":    { "type": "integer" },
      "createdAt":     { "type": "date" }
    }
  }
}
```

**说明：**
- `chunkText` 索引用 `ik_max_word`（最大粒度切分，提高召回），搜索用 `ik_smart`（最粗粒度切分，提高精度）
- 1 分片 0 副本（单节点小规模部署）
- file 元信息（filename 等）不存 ES，通过 MySQL batch query 获取，避免数据不一致
- 来源归属（asset/good）不存 ES，通过 MySQL JOIN 获取，保证关系数据的实时一致性

---

## API 设计

### 资产附件 API（`/api/assets/{assetId}/attachments`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/assets/{assetId}/attachments` | 获取附件列表 |
| POST | `/api/assets/{assetId}/attachments` | 上传附件（multipart/form-data） |
| GET | `/api/assets/{assetId}/attachments/{attachmentId}/file` | 下载/预览附件 |
| DELETE | `/api/assets/{assetId}/attachments/{attachmentId}` | 删除附件 |

### 有效期物品附件 API（`/api/goods/{goodId}/attachments`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/goods/{goodId}/attachments` | 获取附件列表 |
| POST | `/api/goods/{goodId}/attachments` | 上传附件（multipart/form-data） |
| GET | `/api/goods/{goodId}/attachments/{attachmentId}/file` | 下载/预览附件 |
| DELETE | `/api/goods/{goodId}/attachments/{attachmentId}` | 删除附件 |

### 内容搜索 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/search?q=keyword&page=1&size=20` | 搜索文件内容 |

**请求参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| q | string | 是 | — | 搜索关键词 |
| page | int | 否 | 1 | 页码（1-based） |
| size | int | 否 | 20 | 每页条数 |

**响应结构：**

```json
{
  "content": [
    {
      "fileId": 123,
      "originalFilename": "冰箱说明书.pdf",
      "contentType": "application/pdf",
      "fileSize": 2048000,
      "sources": [
        {
          "type": "ASSET",
          "typeLabel": "资产",
          "sourceId": 5,
          "sourceName": "三星冰箱"
        }
      ],
      "matches": [
        {
          "chunkId": 456,
          "page": 3,
          "snippet": "...请使用<mark>进口</mark>压缩机专用电源插座...",
          "matchTerms": ["进口"]
        },
        {
          "chunkId": 789,
          "page": 8,
          "snippet": "...存放<mark>红酒</mark>时建议设置为 5°C...",
          "matchTerms": ["红酒"]
        }
      ],
      "score": 12.45
    }
  ],
  "totalElements": 12,
  "totalPages": 1,
  "number": 0,
  "size": 20
}
```

**source.type 枚举：**

| 值 | typeLabel | 显示 Tag |
|------|-----------|---------|
| `ASSET` | 资产 | 是 |
| `GOOD` | 有效期 | 是 |
| `INVOICE` | 发票（预留） | 是 |
| `FILE` | — | 否（仅此来源时不显示 Tag） |

---

## 实现任务

### Phase 0：基础设施 — Elasticsearch 部署

- [ ] **0.1** `docker-compose.yml` 新增 `elasticsearch` 服务：
  - 镜像：`docker.elastic.co/elasticsearch/elasticsearch:8.17.0`
  - 环境：`discovery.type=single-node`，`xpack.security.enabled=false`（内网单机，关闭安全认证）
  - 内存：`ES_JAVA_OPTS=-Xms512m -Xmx512m`
  - 端口：`9200`（内部通信，不暴露宿主机端口）
  - 挂载卷：`es-data:/usr/share/elasticsearch/data`
  - healthcheck：`curl -s http://localhost:9200/_cluster/health`
- [ ] **0.2** 安装 IK Analyzer 插件（Dockerfile 或启动命令）：
  - `elasticsearch-plugin install https://get.infini.cloud/elasticsearch/analysis-ik/8.17.0`
  - 或使用预装 IK 的第三方镜像
- [ ] **0.3** `homebox` 服务添加 `depends_on: elasticsearch`（condition: service_healthy）
- [ ] **0.4** `docker-compose.yml` 环境变量新增 `ES_HOST`、`ES_PORT`（默认 `elasticsearch:9200`）
- [ ] **0.5** `.env.example` 新增 ES 配置项
- [ ] **0.6** CI 部署流程（`.gitea/workflows/build.yml`）适配新的 ES 环境变量

### Phase 1：后端 — 依赖与配置

- [ ] **1.1** `build.gradle` 添加依赖：
  - `org.springframework.boot:spring-boot-starter-data-elasticsearch`
  - `org.apache.tika:tika-parsers-standard-package`
- [ ] **1.2** `application.yml` 新增 ES 配置：
  ```yaml
  spring:
    elasticsearch:
      uris: ${ES_HOST:localhost}:${ES_PORT:9200}
  ```
- [ ] **1.3** 全局文件大小限制 → 100MB（`application.yml`）

### Phase 2：后端 — 数据模型（MySQL）

- [ ] **2.1** 新建 `TextChunk` 实体（`text_chunks` 表）
- [ ] **2.2** 新建 `TextChunkRepository`
- [ ] **2.3** 新建 `AssetAttachment` 实体（参考 `InvoiceAttachment`）
- [ ] **2.4** 新建 `AssetAttachmentRepository`
- [ ] **2.5** 新建 `GoodAttachment` 实体（参考 `InvoiceAttachment`）
- [ ] **2.6** 新建 `GoodAttachmentRepository`
- [ ] **2.7** `Asset` 实体新增 `@OneToMany attachments` 关联
- [ ] **2.8** `Good` 实体新增 `@OneToMany attachments` 关联
- [ ] **2.9** 更新 `docs/database.md`

### Phase 3：后端 — 文本提取与 ES 索引服务

- [ ] **3.1** 新建 `TextExtractionService`：
  - `extract(FileRecord)` → 返回 `List<TextChunk>`
  - PDF: PDFBox 逐页提取，设置 `pageNumber`
  - 其他格式: Tika 提取全文，`pageNumber = null`
  - 异常处理：捕获异常记录日志，返回空列表
- [ ] **3.2** 新建 `ChunkingService`：
  - 按 ~500 字符分块（段落边界优先）
  - 块间 50 字符重叠（避免切碎语义单元）
  - 对已分页的 PDF 文本：每页内独立分块
- [ ] **3.3** 新建 `EsIndexService`：
  - `indexChunks(List<TextChunk>)` — 批量索引到 ES `chunks` 索引
  - `deleteByFileId(Long fileId)` — 删除文件的所有 chunk
  - `createIndexIfNotExists()` — 启动时检查并创建索引（含 mapping + settings + IK 配置）
  - 使用 `ElasticsearchOperations` 或 `RestClient` 操作
- [ ] **3.4** 修改 `FileService.upload()`：
  - 上传完成后异步调用 `textExtractionService.extract()` → `chunkingService.chunk()` → `esIndexService.indexChunks()`
  - 使用 `@Async` 注解，配置独立线程池
  - chunk 写入 MySQL 后标记 `indexed = true`
- [ ] **3.5** 修改 `FileService.delete()`：
  - 删除 MySQL `text_chunks` 记录
  - 调用 `esIndexService.deleteByFileId()`
- [ ] **3.6** 配置 Spring 异步任务执行器（`TaskExecutor` bean，核心线程 2，最大线程 4）
- [ ] **3.7** `FileRecordResponse` 新增 `indexed` 字段（通过 `text_chunks.indexed` 判断）

### Phase 4：后端 — 资产附件 API

- [ ] **4.1** 新建 `AssetAttachmentResponse` DTO
- [ ] **4.2** 新建 `AssetAttachmentService`：
  - `getByAssetId(assetId)` / `upload(assetId, file)` / `getFile(assetId, attachmentId)` / `delete(assetId, attachmentId)`
- [ ] **4.3** 新建 `AssetAttachmentController`（`/api/assets/{assetId}/attachments`）
- [ ] **4.4** 修改 `AssetService.deleteAsset()`：级联删除附件文件 + text_chunks + ES 索引
- [ ] **4.5** 修改 `AssetDetailResponse`：新增 `attachments` 字段
- [ ] **4.6** 修改资产详情查询，加载附件列表

### Phase 5：后端 — 有效期物品附件 API

- [ ] **5.1** 新建 `GoodAttachmentResponse` DTO
- [ ] **5.2** 在 `GoodService` 中新增附件方法：
  - `getAttachmentsByGoodId()` / `uploadAttachment()` / `getAttachmentFile()` / `deleteAttachment()`
- [ ] **5.3** 新建 `GoodAttachmentController`（`/api/goods/{goodId}/attachments`）
- [ ] **5.4** 修改 `GoodService.deleteGood()`：级联删除附件文件 + text_chunks + ES 索引
- [ ] **5.5** 修改 `GoodDetailResponse`：新增 `attachments` 字段
- [ ] **5.6** 修改物品详情查询，加载附件列表

### Phase 6：后端 — 内容搜索 API

- [ ] **6.1** 新建搜索相关 DTO：`SearchRequest`、`SearchResponse`、`SearchResultItem`、`SourceInfo`、`MatchInfo`
- [ ] **6.2** 新建 `SearchService`：
  ```
  search(q, page, size):
    1. 构建 ES query:
       - multi_match on chunkText (best_fields)
       - highlight: fragment_size=100, number_of_fragments=5, pre_tags="<mark>", post_tags="</mark>"
       - size = page * size * N (N = 预留 chunk 聚合后仍够 page 的量，取 5)
    2. 执行 ES 查询 → 获取 chunks with highlight + _score
    3. 按 fileId 分组，每组取 top 5 chunks（按 _score）
    4. 收集 fileIds，批量查 MySQL:
       - file_records (id, original_filename, content_type, file_size)
       - LEFT JOIN asset_attachments + assets (id, name)
       - LEFT JOIN good_attachments + goods (id, product_name)
    5. 构建 sources (ASSET / GOOD / FILE)
    6. 组装 SearchResultItem[]
    7. 按最高 chunk _score 排序，应用分页
    8. 返回 SearchResponse
  ```
- [ ] **6.3** 新建 `SearchController`（`GET /api/search`）
- [ ] **6.4** 新建 `FileRecordRepository` 批量查询方法（`findByIdIn`）
- [ ] **6.5** 新建 `AssetAttachmentRepository.findByFileIdIn()` + `GoodAttachmentRepository.findByFileIdIn()`

### Phase 7：后端 — 存储限制

- [ ] **7.1** `LocalStorageStrategy.validateFile()`：10MB → 100MB
- [ ] **7.2** `QiniuStorageStrategy.validateFile()`：10MB → 100MB

### Phase 8：前端 — 资产附件 UI

- [ ] **8.1** 新建 `src/api/assetAttachments.ts`（类型 + API 函数）
- [ ] **8.2** 新建 `src/hooks/queries/useAssetAttachments.ts`
- [ ] **8.3** 更新 `src/hooks/queries/assetKeys.ts`
- [ ] **8.4** 新建 `src/components/assets/AssetAttachmentManager.tsx`（参考 `InvoiceAttachmentManager`）
- [ ] **8.5** 修改 `AssetDetailDrawer.tsx`，集成附件管理区域
- [ ] **8.6** 更新 i18n

### Phase 9：前端 — 有效期物品附件 UI

- [ ] **9.1** 新建 `src/api/goodAttachments.ts`
- [ ] **9.2** 更新 `src/api/goods.ts`（`GoodDetail` 新增 `attachments`）
- [ ] **9.3** 新建 `src/components/expiration/AttachmentManager.tsx`
- [ ] **9.4** 修改 `GoodExpandedRow.tsx`，集成附件 Tab
- [ ] **9.5** 更新 i18n

### Phase 10：前端 — 内容搜索 UI

- [ ] **10.1** 新建 `src/api/search.ts`（类型 + `searchContent` 函数）
- [ ] **10.2** 新建 `src/components/SearchDialog.tsx`
- [ ] **10.3** 修改 `src/components/Topbar.tsx`：搜索入口
- [ ] **10.4** 注册 `Ctrl+K` 快捷键
- [ ] **10.5** 更新 i18n

### Phase 11：文档

- [ ] **11.1** 更新 `docs/api.md`
- [ ] **11.2** 更新 `docs/database.md`
- [ ] **11.3** 更新 Postman collection
- [ ] **11.4** 更新 `CLAUDE.md`

---

## 架构设计关键点

### ES 搜索查询（SearchService 核心逻辑）

```java
// 伪代码 - ES query 构建
SearchRequest esRequest = SearchRequest.of(s -> s
    .index("chunks")
    .query(q -> q
        .multi_match(mm -> mm
            .fields("chunkText")
            .query(keyword)
            .type(TextQueryType.BestFields)
        )
    )
    .highlight(h -> h
        .fields("chunkText", hf -> hf
            .fragmentSize(100)
            .numberOfFragments(5)
            .preTags("<mark>")
            .postTags("</mark>")
        )
    )
    .size(page * size * 5)  // 多取一些，因为要按 fileId 聚合
);
```

### 文件归属判断（MySQL 查询阶段）

```sql
-- ES 返回 fileIds 后，批量获取归属信息
SELECT 
    f.id AS file_id,
    f.original_filename, f.content_type, f.file_size,
    aa.asset_id, a.name AS asset_name,
    ga.good_id, g.product_name AS good_name
FROM file_records f
LEFT JOIN asset_attachments aa ON f.id = aa.file_id
LEFT JOIN assets a ON aa.asset_id = a.id
LEFT JOIN good_attachments ga ON f.id = ga.file_id
LEFT JOIN goods g ON ga.good_id = g.id
WHERE f.id IN (:fileIds)
```

```
归属判断逻辑:
  - asset_id IS NOT NULL  → sources += {type: ASSET, sourceId, sourceName}
  - good_id IS NOT NULL   → sources += {type: GOOD, sourceId, sourceName}
  - 以上都没有             → sources += {type: FILE}
```

### Tag 显示逻辑（前端）

```typescript
const getTags = (sources: SourceInfo[]): SourceInfo[] => {
  const nonFileSources = sources.filter(s => s.type !== 'FILE');
  return nonFileSources.length > 0 ? nonFileSources : [];
  // 空数组 → 不显示任何 Tag
};
```

### MySQL 与 ES 数据一致性

```
正常路径:
  上传 → MySQL text_chunks (indexed=false) → ES index → MySQL text_chunks (indexed=true)
  删除 → ES delete_by_query → MySQL text_chunks DELETE → MySQL file_records DELETE

异常恢复:
  启动时扫描 MySQL text_chunks WHERE indexed = false → 重新索引到 ES
  定期对账（可选）: 对比 MySQL file_records.id 与 ES chunks.fileId 的差集
```

### 与 AI Chat Bot 的兼容路径（预留）

当前 ES 索引已为 AI 场景做好准备，后续只需：

1. **Embedding 生成**：新增 `EmbeddingService`，调用 Embedding API（如 text-embedding-3-small）为每个 chunk 生成向量
2. **ES mapping 扩展**：`chunkTextVector` 字段（`dense_vector`, 768 维或 1536 维，视模型而定）
3. **混合搜索**：ES query 改为 `knn` + `multi_match`，RRF 融合排序
4. **RAG Tool**：搜索 API 可直接作为 AI function calling 的 tool，ES 返回的 chunk 内容直接注入 LLM prompt

无需更换基础设施、无需数据迁移，只需扩展 ES mapping 和增加 embedding 生成流程。

---

## 实现参考

| 新功能 | 参考现有实现 |
|--------|------------|
| AssetAttachment 实体 | `InvoiceAttachment.java` — 相同模式（id + parent FK + file FK） |
| AssetAttachmentController | `InvoiceAttachmentController.java` |
| AssetAttachmentService | `InvoiceService.uploadAttachment()` / `deleteAttachment()` |
| GoodAttachment 全套 | 同上，parent 指向 Good |
| AssetAttachmentManager (前端) | `InvoiceAttachmentManager.tsx` |
| GoodAttachmentManager (前端) | `InvoiceAttachmentManager.tsx` |
| TextExtractionService | 全新（PDFBox 已有的 invoice 预览代码可复用） |
| ES 索引操作 | 全新（Spring Data Elasticsearch `ElasticsearchOperations`） |
| SearchService | 全新 |
| SearchDialog (前端) | 全新 |

---

## 注意事项

1. **ES 启动依赖**：Spring Boot 启动时检查 ES 连接可用性，不可用时打印警告但不阻止启动（搜索功能降级但系统其他功能正常）。
2. **文本提取异步**：使用独立线程池，上传请求不阻塞。提取失败不影响文件上传成功（附件可用，只是不能搜索）。
3. **IK 分词器版本**：必须与 ES 版本严格匹配（8.17.0），否则节点无法启动。
4. **chunk 大小**：500 字符是平衡点——太小则语义碎片化，太大则搜索精度下降。PDF 已按页分割，页内再按 500 字符分块，块边界尽量选在段落/句号处。
5. **highlight fragment**：`fragment_size=100` 即返回匹配位置前后共 100 字符的片段，适合前端一行展示。
6. **文件删除级联**：删除资产/物品 → 删除 AssetAttachment/GoodAttachment → 删除 FileRecord + text_chunks → 同步删除 ES 文档 + 存储文件。
7. **文件重命名同步**：`FileController.rename()` 仅改 `originalFilename`，不影响 ES 索引（ES 不存 filename）。
8. **页码精度**：仅 PDF 可精确到页，其他格式 `pageNumber = null`。
