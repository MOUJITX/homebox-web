# 图书管理功能需求设计文档

> 状态：设计中（讨论阶段）
> 日期：2026-07-15

---

## 一、功能概述

图书管理用于记录和管理**家庭藏书**，帮助用户：

- 掌握家中藏书清单，知道每本书的存放位置
- 按分类（书籍/杂志/报刊等）整理，支持 ISBN 扫码录入（复用现有 barcode 扫码逻辑）
- 自编条码：格式 `{分类key}+{顺位号}`，如 `LT00001`，便于没有 ISBN 的图书管理
- 连载支持：连载读物（杂志/报刊）可建立父子层级（如"国家地理" → "国家地理 2501期"），父条目有独立条码，子条目条码格式为 `{父条码}-{期数}`
- 系列管理：可创建系列（如"哈利波特系列"、"三体系列"），一本书可归属多个系列
- 豆瓣集成：输入 ISBN / ISSN / 书名，通过豆瓣 API 自动获取书籍详细信息（标题、作者、出版社、出版日期、简介、封面）
- 追踪阅读状态（想读/在读/已读）
- 记录购买信息和关联购买发票
- 支持表格和卡片两种视图切换

---

## 二、核心概念

### 2.1 图书（Book）

一个独立的实体，代表一本实体书或一个连载系列。每本书归属于一个分类和一个存放位置。

### 2.2 分类预设

系统初始化时自动创建三种预设分类：

| 分类 | key  | 默认连载 | 说明                     |
| ---- | ---- | -------- | ------------------------ |
| 书籍 | `BK` | 否       | 普通书籍，如小说、教材等 |
| 杂志 | `MG` | 是       | 期刊杂志，如《国家地理》 |
| 报刊 | `NP` | 是       | 报纸刊物                 |

用户可自行新增或修改分类。新建分类时可设定默认的连载属性。

### 2.3 连载机制

- 每个分类有 `is_serialized`（默认是否连载）属性
- 每本书有 `serialized`（是否连载）字段，**创建时默认取自分类的 `is_serialized`，但允许手动修改**
- 连载书籍支持**父子层级**（自引用 `parent_id`），**严格限制为一级**（父 → 子，不允许孙级）：
  - **父（连载系列）**：代表一个连载系列，如《国家地理》，**正常分配条码**，`serialized=true`
  - **子（具体期数）**：代表系列中的一期，如《国家地理 2025年1月刊》。条码格式为 `{父条码}-{期数}`，其中**期数由用户自由输入**（如 `2501`、`2025-01`、`Vol.5` 等）。子条目的 `serialized` **强制为 false**（不允许继续往下建层级），`parent_id` 指向父条目
- **字段继承**：创建子条目时，自动继承父条目的所有字段值（分类、位置、作者、出版社等），但允许手动修改
- 特殊场景：两本书为上下部但共享一个 ISBN，可创建一个连载父条目（存放共享信息），再创建两个子条目各分配条码

### 2.4 系列（Series）

- **系列**是一个独立概念，用于将不同书籍归类到同一主题系列下
- 与连载（父子层级）**完全不同**：
  - 连载：1 对多，子条目条码依赖父条码，用于期刊杂志的具体期数管理
  - 系列：**多对多**，纯粹的逻辑分组，不影响条码，用于跨书/跨期刊的主题归类
- 一本书可以属于**多个系列**（如《三体》同时属于"三体系列"和"雨果奖获奖作品"）
- 一个系列可以包含**多本书**（包括连载父条目、连载子条目、普通书籍）
- 系列不参与条码生成逻辑

### 2.5 列表展示规则

- 默认列表**仅显示顶级条目**（`parent_id IS NULL`）
- 子条目在父条目的**详情抽屉**中查看和管理
- 不混合展示父子条目

### 2.6 关联关系

```
BookCategory (分类)  1 ──── N  Book (图书)
BookLocation (位置)   1 ──── N  Book (图书)
Book (父/连载系列)   1 ──── N  Book (子/期数)        -> 自引用 parent_id
BookSeries (系列)    N ──── M  Book (图书)            -> book_series_mapping
Book (图书)          1 ──── N  BookPicture (封面)
Book (图书)          N ──── M  Invoice (发票)         -> book_invoices
```

### 2.7 条码分配规则

| 场景               | custom_barcode    | isbn | 说明                         |
| ------------------ | ----------------- | ---- | ---------------------------- |
| 普通书籍（非连载） | 自动生成          | 选填 | 标准模式                     |
| 连载父条目         | 自动生成          | 选填 | 正常分配条码                 |
| 连载子条目         | `{父条码}-{期数}` | 选填 | 期数由用户自由输入，整体唯一 |

### 2.7 阅读状态

| 状态         | 说明 |
| ------------ | ---- |
| WANT_TO_READ | 想读 |
| READING      | 在读 |
| READ         | 已读 |

---

## 三、后端设计

### 3.1 新增枚举

```java
// BookStatus.java
public enum BookStatus {
    WANT_TO_READ,   // 想读
    READING,        // 在读
    READ            // 已读
}
```

### 3.2 新增实体

#### BookCategory（图书分类表）

| 字段          | 类型         | 约束                    | 说明                                                   |
| ------------- | ------------ | ----------------------- | ------------------------------------------------------ |
| id            | BIGINT       | PK, AUTO                |                                                        |
| name          | VARCHAR(255) | UNIQUE, NOT NULL        | 分类名称，如"书籍"、"杂志"、"报刊"                     |
| key           | VARCHAR(10)  | UNIQUE, NOT NULL        | 分类编码，用于生成自编条码的前缀，如 `BK`、`MG`、`NP`  |
| is_serialized | BIT(1)       | NOT NULL, DEFAULT FALSE | 默认是否连载，新建图书时作为 `serialized` 字段的默认值 |
| description   | VARCHAR(255) | NULLABLE                | 分类描述                                               |
| created_at    | DATETIME(6)  | NOT NULL, auto-set      |                                                        |
| updated_at    | DATETIME(6)  | NOT NULL, auto-set      |                                                        |

#### BookLocation（存放位置表）

| 字段        | 类型         | 约束               | 说明                            |
| ----------- | ------------ | ------------------ | ------------------------------- |
| id          | BIGINT       | PK, AUTO           |                                 |
| name        | VARCHAR(255) | UNIQUE, NOT NULL   | 位置名称，如"客厅书架A"、"书房" |
| description | VARCHAR(255) | NULLABLE           | 位置描述                        |
| created_at  | DATETIME(6)  | NOT NULL, auto-set |                                 |
| updated_at  | DATETIME(6)  | NOT NULL, auto-set |                                 |

#### Book（图书表）

| 字段           | 类型          | 约束                               | 说明                                                                                 |
| -------------- | ------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| id             | BIGINT        | PK, AUTO                           |                                                                                      |
| title          | VARCHAR(255)  | NOT NULL                           | 书名/期数名称                                                                        |
| author         | VARCHAR(500)  | NULLABLE                           | 作者，多作者逗号分隔，前端输入时逗号分割，显示时自动切割为多个标签                   |
| isbn           | VARCHAR(20)   | UNIQUE, NULLABLE                   | ISBN 码，非必填，支持扫码录入                                                        |
| custom_barcode | VARCHAR(100)  | UNIQUE, NOT NULL                   | 自编条码。普通/父条目自动生成；子条目格式 `{父条码}-{issue_number}`，后端拼接        |
| serialized     | BIT(1)        | NOT NULL, DEFAULT FALSE            | 是否连载。创建时默认取自分类，可手动修改。**子条目（parent_id 不为空）强制为 FALSE** |
| parent_id      | BIGINT        | NULLABLE, FK → books(id)           | 父级图书 ID，用于连载父子层级。**仅一级：子条目的子条目不允许存在**                  |
| issue_number   | VARCHAR(50)   | NULLABLE                           | 期数，仅子条目使用，由用户自由输入（如 `2501`、`Vol.5`）                             |
| publisher      | VARCHAR(255)  | NULLABLE                           | 出版社                                                                               |
| publish_date   | DATE          | NULLABLE                           | 出版日期                                                                             |
| description    | TEXT          | NULLABLE                           | 内容简介/摘要                                                                        |
| category_id    | BIGINT        | FK → book_categories(id), NOT NULL | 所属分类                                                                             |
| location_id    | BIGINT        | FK → book_locations(id), NOT NULL  | 存放位置                                                                             |
| status         | VARCHAR(20)   | NOT NULL, DEFAULT 'WANT_TO_READ'   | BookStatus                                                                           |
| purchase_date  | DATE          | NULLABLE                           | 购买日期                                                                             |
| purchase_price | DECIMAL(12,2) | NULLABLE                           | 购买价格                                                                             |
| note           | TEXT          | NULLABLE                           | 备注                                                                                 |
| created_at     | DATETIME(6)   | NOT NULL, auto-set                 |                                                                                      |
| updated_at     | DATETIME(6)   | NOT NULL, auto-set                 |                                                                                      |

#### BookSeries（系列表）

| 字段        | 类型         | 约束               | 说明                                   |
| ----------- | ------------ | ------------------ | -------------------------------------- |
| id          | BIGINT       | PK, AUTO           |                                        |
| name        | VARCHAR(255) | UNIQUE, NOT NULL   | 系列名称，如"哈利波特系列"、"三体系列" |
| description | VARCHAR(255) | NULLABLE           | 系列描述                               |
| created_at  | DATETIME(6)  | NOT NULL, auto-set |                                        |
| updated_at  | DATETIME(6)  | NOT NULL, auto-set |                                        |

#### BookSeriesMapping（系列-图书关联表）

| 字段      | 类型   | 约束                           | 说明 |
| --------- | ------ | ------------------------------ | ---- |
| id        | BIGINT | PK, AUTO                       |      |
| book_id   | BIGINT | NOT NULL, FK → books(id)       |      |
| series_id | BIGINT | NOT NULL, FK → book_series(id) |      |

UNIQUE INDEX on (book_id, series_id)

#### BookPicture（封面图片关联表）

| 字段    | 类型   | 约束                            | 说明 |
| ------- | ------ | ------------------------------- | ---- |
| id      | BIGINT | PK, AUTO                        |      |
| book_id | BIGINT | NOT NULL, FK → books(id)        |      |
| file_id | BIGINT | NOT NULL, FK → file_records(id) |      |

#### BookInvoice（图书发票关联表）

| 字段       | 类型   | 约束                        | 说明 |
| ---------- | ------ | --------------------------- | ---- |
| id         | BIGINT | PK, AUTO                    |      |
| book_id    | BIGINT | NOT NULL, FK → books(id)    |      |
| invoice_id | BIGINT | NOT NULL, FK → invoices(id) |      |

### 3.3 API 端点

#### 图书 CRUD

| 方法   | 路径                       | 说明                                                                                                                                                                                                                       |
| ------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/books`               | 分页列表（默认不包含子条目，可通过 `parent_id=null` 过滤顶级），支持搜索（书名/作者/ISBN/自编条码）、分类/位置/状态筛选                                                                                                    |
| POST   | `/api/books`               | 新增图书。后端逻辑：若 `parent_id=null`，自动生成 `custom_barcode`（格式 `{分类key}+{顺位号}`）；若 `parent_id != null`（子条目），`custom_barcode` 拼接为 `{父条码}-{issue_number}`，需校验 `issue_number` 非空且组合唯一 |
| GET    | `/api/books/{id}`          | 图书详情（含关联图片、发票、子条目列表、所属系列）                                                                                                                                                                         |
| GET    | `/api/books/{id}/children` | 获取该图书的子条目列表（仅连载父条目有）                                                                                                                                                                                   |
| PUT    | `/api/books/{id}`          | 更新图书                                                                                                                                                                                                                   |
| DELETE | `/api/books/{id}`          | 删除图书（若为连载父条目，级联删除所有子条目）                                                                                                                                                                             |

#### 豆瓣集成

| 方法 | 路径                                   | 说明                                  |
| ---- | -------------------------------------- | ------------------------------------- |
| GET  | `/api/books/lookup-douban?isbn={isbn}` | 通过 ISBN 查询豆瓣，返回书籍信息      |
| GET  | `/api/books/lookup-douban?issn={issn}` | 通过 ISSN 查询豆瓣（期刊）            |
| GET  | `/api/books/lookup-douban?q={keyword}` | 通过书名/关键词搜索豆瓣，返回候选列表 |

> 豆瓣 API 调用统一走后端代理，避免前端跨域问题。后端负责请求豆瓣开放 API（`https://api.douban.com/v2/book/isbn/:isbn` 等），返回结构化数据。前端仅展示结果供用户确认/修改后保存。

#### 封面图片

| 方法   | 路径                                | 说明              |
| ------ | ----------------------------------- | ----------------- |
| GET    | `/api/books/{id}/pictures`          | 获取封面图片列表  |
| POST   | `/api/books/{id}/pictures`          | 上传/关联封面图片 |
| DELETE | `/api/books/{id}/pictures/{fileId}` | 删除封面图片      |

#### 发票绑定

| 方法   | 路径                                   | 说明         |
| ------ | -------------------------------------- | ------------ |
| GET    | `/api/books/{id}/invoices`             | 获取关联发票 |
| POST   | `/api/books/{id}/invoices`             | 绑定发票     |
| DELETE | `/api/books/{id}/invoices/{invoiceId}` | 解绑发票     |

#### 分类管理

| 方法   | 路径                        | 说明     |
| ------ | --------------------------- | -------- |
| GET    | `/api/book-categories`      | 分类列表 |
| POST   | `/api/book-categories`      | 新增分类 |
| PUT    | `/api/book-categories/{id}` | 更新分类 |
| DELETE | `/api/book-categories/{id}` | 删除分类 |

#### 位置管理

| 方法   | 路径                       | 说明     |
| ------ | -------------------------- | -------- |
| GET    | `/api/book-locations`      | 位置列表 |
| POST   | `/api/book-locations`      | 新增位置 |
| PUT    | `/api/book-locations/{id}` | 更新位置 |
| DELETE | `/api/book-locations/{id}` | 删除位置 |

#### 系列管理

| 方法   | 路径                    | 说明     |
| ------ | ----------------------- | -------- |
| GET    | `/api/book-series`      | 系列列表 |
| POST   | `/api/book-series`      | 新增系列 |
| PUT    | `/api/book-series/{id}` | 更新系列 |
| DELETE | `/api/book-series/{id}` | 删除系列 |

#### 图书-系列关联（也可直接嵌入图书 CRUD）

| 方法 | 路径                     | 说明                         |
| ---- | ------------------------ | ---------------------------- |
| GET  | `/api/books/{id}/series` | 获取该书所属系列             |
| PUT  | `/api/books/{id}/series` | 批量设置该书所属系列（替换） |

---

## 四、前端设计

### 4.1 路由

```
/books  →  BooksPage.tsx   （需登录，所有角色可访问）
```

### 4.2 文件结构

```
src/
  api/
    books.ts              # 图书 CRUD API
    bookCategories.ts     # 分类 API
    bookLocations.ts      # 位置 API
    bookSeries.ts         # 系列 API
    bookPictures.ts       # 封面图片 API
    bookInvoices.ts       # 发票绑定 API
  hooks/queries/
    useBooks.ts           # 列表查询 hook
    useBookDetail.ts      # 详情查询 hook
    useBookCategories.ts  # 分类查询 hook
    useBookLocations.ts   # 位置查询 hook
    useBookSeries.ts      # 系列查询 hook
    bookKeys.ts           # query key factory
  components/books/
    CreateBookDialog.tsx         # 新增图书对话框（含豆瓣查询：输入 ISBN/ISSN/书名 → 查询 → 自动填充 → 确认保存）
    EditBookDialog.tsx           # 编辑图书对话框
    DeleteBookDialog.tsx         # 删除确认对话框
    BookDetailDrawer.tsx         # 图书详情抽屉（含子条目、所属系列）
    BookCategoryManagerDialog.tsx  # 分类管理对话框
    BookLocationManagerDialog.tsx  # 位置管理对话框
    BookSeriesManagerDialog.tsx    # 系列管理对话框
  pages/
    BooksPage.tsx          # 列表页（搜索 + 筛选 + CRUD 入口）
```

### 4.3 页面布局

```
┌────────────────────────────────────────────────────────┐
│  图书管理                    [扫码] [≡□] [+ 添加图书]   │
│  ┌─────────────┐ ┌──────────────────────────────────┐ │
│  │ 分类筛选     │ │  [搜索框]  表格/卡片视图切换         │ │
│  │ □ 全部      │ │  ┌──────────────────────────────┐ │ │
│  │ □ 文学      │ │  │ 封面 │ 书名 │ 作者 │ 状态 .. │ │ │
│  │ □ 科学      │ │  │     │      │      │         │ │ │
│  │ □ ...       │ │  └──────────────────────────────┘ │ │
│  │             │ │  或: ┌───┐┌───┐┌───┐┌───┐        │ │
│  │ 位置筛选     │ │      │卡片││卡片││卡片││卡片│        │ │
│  │ □ 全部      │ │      └───┘└───┘└───┘└───┘        │ │
│  │ □ 客厅书架  │ │  分页                               │ │
│  │ □ 书房     │ │                                    │ │
│  └─────────────┘ └──────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

- 左侧边栏：分类 + 位置筛选（filter panel）
- 右侧顶部：搜索栏 + 视图切换按钮（表格/卡片）+ 扫码 + 新增
- 表格视图每行：封面缩略图、书名、作者、状态标签、分类、位置、购买日期、操作
- 卡片视图：封面大图为主，书名、作者、状态标签覆盖显示
- 操作：查看详情（Drawer）、编辑、删除

### 4.4 复用组件

| 功能      | 复用组件                | 来源                                              |
| --------- | ----------------------- | ------------------------------------------------- |
| ISBN 扫码 | barcode 扫描逻辑        | `src/components/expiration/` 中 Goods 的扫码实现  |
| 封面图片  | `PictureManager`        | `src/components/shared/PictureManager.tsx`        |
| 发票绑定  | `InvoiceBindingManager` | `src/components/shared/InvoiceBindingManager.tsx` |
| 全局搜索  | `SearchDialog`          | 扩展搜索索引，加入 books                          |

### 4.5 i18n 新增 Key

```json
"books": {
  "title": "图书管理",
  "addBook": "添加图书",
  "addChildBook": "添加期数/分册",
  "editBook": "编辑图书",
  "deleteBook": "删除图书",
  "bookDetail": "图书详情",
  "title_": "书名",
  "author": "作者",
  "authorHint": "多作者用逗号分隔",
  "isbn": "ISBN",
  "isbnOptional": "ISBN（选填）",
  "customBarcode": "自编条码",
  "customBarcodeHint": "自动生成，格式：分类编码+序号",
  "serialized": "连载",
  "serializedHint": "连载读物可添加期数/分册子条目",
  "parentBook": "所属系列",
  "childrenBooks": "期数/分册",
  "noChildrenBooks": "暂无期数，点击添加",
  "issueNumber": "期数",
  "issueNumberHint": "自由输入，如 2501、2025-01、Vol.5",
  "publisher": "出版社",
  "publishDate": "出版日期",
  "description": "简介",
  "category": "分类",
  "categoryKey": "分类编码",
  "categorySerialized": "默认连载",
  "location": "位置",
  "status": "阅读状态",
  "purchaseDate": "购买日期",
  "purchasePrice": "购买价格",
  "note": "备注",
  "cover": "封面",
  "scanIsbn": "扫码录入ISBN",
  "lookupDouban": "豆瓣查询",
  "lookupDoubanHint": "输入 ISBN、ISSN 或书名查询豆瓣，自动填充书籍信息",
  "doubanSearchPlaceholder": "输入 ISBN / ISSN / 书名…",
  "doubanNoResult": "豆瓣未找到匹配结果",
  "doubanFetchError": "豆瓣查询失败，请稍后重试",
  "viewTable": "表格视图",
  "viewCard": "卡片视图",
  "showChildren": "展开子条目",
  "series": {
    "title": "系列",
    "manage": "管理系列",
    "belongTo": "所属系列",
    "noSeries": "暂无系列"
  },
  "categories": {
    "title": "图书分类",
    "manage": "管理分类",
    "keyHelper": "编码用于生成自编条码，建议用英文大写字母，如 BK、MG",
    "presetBook": "书籍",
    "presetMagazine": "杂志",
    "presetNewspaper": "报刊"
  },
  "locations": {
    "title": "存放位置",
    "manage": "管理位置"
  },
  "statuses": {
    "WANT_TO_READ": "想读",
    "READING": "在读",
    "READ": "已读"
  },
  "deleteConfirm": "确定删除图书《{title}》吗？此操作不可撤销。",
  "deleteSeriesConfirm": "该图书为连载系列，删除后将同时删除所有子条目（共 {count} 条）。确定继续？",
  "noBooks": "暂无图书，点击添加第一本吧"
}
```

nav 中新增：`"books": "图书管理"`

---

## 五、实现步骤

| 步骤 | 内容                                                                                                           | 涉及文件     |
| ---- | -------------------------------------------------------------------------------------------------------------- | ------------ |
| 1    | 后端：新增枚举 `BookStatus`                                                                                    | 1 文件       |
| 2    | 后端：新增 Entity（Book, BookCategory, BookLocation, BookSeries, BookSeriesMapping, BookPicture, BookInvoice） | 7 实体       |
| 3    | 后端：新增 CategoryInitializer 预设分类数据（书籍/杂志/报刊）                                                  | 1 文件       |
| 4    | 后端：新增 DTO（Request/Response）                                                                             | ~14 文件     |
| 5    | 后端：新增 Repository + Service + Controller（含豆瓣代理）                                                     | ~9 文件      |
| 6    | 后端：更新 `docs/database.md`                                                                                  | 1 文件       |
| 7    | 前端：API 层                                                                                                   | 6 文件       |
| 8    | 前端：React Query hooks + key factory                                                                          | 6 文件       |
| 9    | 前端：UI 组件（含子条目、系列管理）                                                                            | ~8 组件      |
| 10   | 前端：页面 + 路由 + nav + i18n                                                                                 | 4+ 文件      |
| 11   | 前端：搜索集成 + ISBN 扫码                                                                                     | 修改现有文件 |

---

## 六、已确认的设计决策

| #   | 问题            | 决策                                                                                                           |
| --- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | ISBN 是否必填？ | **否**，改为 NULLABLE。同时新增 `custom_barcode` 自编条码字段，由后端自动生成（格式：`{分类key}+{5位顺位号}`） |
| 2   | 作者字段        | 支持多作者，**逗号分隔**输入与存储，显示时按逗号切割展示                                                       |
| 3   | 列表展示        | 支持**表格和卡片两种视图**，用户可切换                                                                         |
| 4   | 页数字段        | **不需要**，不添加该字段                                                                                       |
| 5   | 分类预设        | 系统初始化预设三种分类：**书籍(BK, 非连载)、杂志(MG, 连载)、报刊(NP, 连载)**                                   |
| 6   | 连载条码        | 父条目正常分配条码；子条目条码 = `{父条码}-{期数}`，期数由用户自由输入                                         |
| 7   | 连载层级        | **严格一级**，子条目 `serialized` 强制为 FALSE，不允许孙级                                                     |
| 8   | 子条目字段      | 创建时**自动继承**父条目的所有字段值（分类、位置、作者等），但允许手动修改                                     |
| 9   | 列表展示策略    | **仅显示顶级条目**（`parent_id IS NULL`），子条目在父条目详情抽屉中查看管理                                    |
| 10  | 系列（Series）  | 新增独立实体，**多对多**关系，纯逻辑分组，与连载机制正交                                                       |
| 11  | 豆瓣集成        | 新增 `/api/books/lookup-douban` 代理端点，支持 ISBN/ISSN/书名查询，后端代理调用豆瓣开放 API                    |
