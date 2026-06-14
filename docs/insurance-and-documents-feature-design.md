# 家庭档案管理功能设计

> 状态：需求已确认，待开发
> 日期：2026-06-14

---

## 一、功能概述

**家庭档案（Archives）** 是一个通用化的家庭文件管理模块，帮助用户：

- 归档各类家庭文档——证件、合同、保单、账单、说明书、保修卡、维修记录等，**统一管理并追踪有效期**
- 支持父-子两级文档结构，**将相关文档组织在一起**（如保险保单及其缴费凭证、房产证及其购房合同）
- 有有效期的文档到期前提醒续期，**避免因过期造成不便或法律风险**
- 所有文档附件支持全文搜索，快速定位所需文件

### 设计原则

- **完全通用**：不限定文档类型，任何家庭文件都可归档。保险保单、身份证、水电费账单、产品保修卡等平级管理
- **灵活字段**：除名称和分类外所有字段均为可选，用户按需填写
- **分类自由**：预设常用分类，用户可自由创建自定义分类
- **到期提醒简单**：设置到期日期即启用提醒，无需额外开关。提醒天数默认 7 天，可自定义
- **两级结构**：支持父-子两级文档关联，最多两层（父文档 → 子文档）

---

## 二、核心概念

### 2.1 文档（Document）

```
DocumentCategory (文档分类)  1 ──── N  Document (文档)
Document (文档, 父)          1 ──── N  Document (文档, 子)  — 最多两层
Document (文档)              1 ──── N  DocumentAttachment (文档附件)
Document (文档)              1 ──── N  DocumentInvoice (文档发票关联)
```

- **Document**：代表一份家庭文档/文件，例如 "张三身份证"、"购房合同"、"平安车险2026"、"2025年水电费账单"
- **DocumentAttachment**：该文档的扫描件、照片、PDF 等附件
- **DocumentCategory**：文档分类，用户可自由创建
- **父-子关系**：子文档挂载在父文档下，最多两层。例如：父文档"平安车险2026"下挂载子文档"2026年保费缴纳凭证"、"2025年保费缴纳凭证"

### 2.2 文档状态

| 状态                         | 说明               |
| ---------------------------- | ------------------ |
| **有效** (ACTIVE)            | 正常有效           |
| **已过期** (EXPIRED)         | 已过有效期         |
| **已注销** (REVOKED)         | 已注销/作废        |
| **已遗失** (LOST)            | 已遗失             |

### 2.3 文档预设分类

用户可在预设分类基础上自由创建新分类：

| 预设分类                     | 说明               | 典型场景                         |
| ---------------------------- | ------------------ | -------------------------------- |
| **身份证件** (IDENTITY)      | 身份证明类         | 身份证、护照、港澳通行证、驾照   |
| **房产证件** (PROPERTY)      | 房产相关           | 房产证、土地使用证、购房合同     |
| **金融证件** (FINANCIAL)     | 金融账户类         | 银行卡、存折、股票账户           |
| **合同协议** (CONTRACT)      | 合同协议类         | 租房合同、劳动合同、服务协议     |
| **证书资质** (CERTIFICATE)   | 证书资质类         | 毕业证、学位证、职业资格证       |
| **家庭证件** (FAMILY)        | 家庭关系类         | 结婚证、出生证、户口本           |
| **保险保单** (INSURANCE)     | 保险类             | 车险保单、重疾险、家财险         |
| **账单收据** (RECEIPT)       | 账单收据类         | 水电费账单、维修收据、购物小票   |
| **保修售后** (WARRANTY)      | 保修与售后服务类   | 产品保修卡、售后服务单、维修记录 |
| **其他** (OTHER)             | 通用归档           | 说明书、会员卡、培训证书等       |

### 2.4 到期提醒

- 设置了到期日期（expiryDate）的文档即视为启用提醒，到期前 N 天提醒（N 默认 7 天，可通过 reminderDays 自定义）
- 无到期日期的文档不做提醒，仅做归档存储
- 提醒逻辑复用现有 `Notification` 机制，与订阅续费提醒同模式

---

## 三、数据模型

### 3.1 文档分类（DocumentCategory）

```
DocumentCategory (文档分类) — 用户可自由创建
  ├── id
  ├── name (分类名称，必填，唯一)
  ├── description? (描述，可选)
  ├── createdAt
  └── updatedAt
```

### 3.2 文档（Document）

```
Document (文档) — 主记录，通用化设计
  ├── id
  ├── name (文档名称，必填，如"张三身份证"、"购房合同"、"平安车险2026")
  ├── documentCategoryId → DocumentCategory (分类，必选)
  ├── parentId? → Document (父文档，可选 — 最多两层：父→子)
  ├── holder? (持有人/相关人，可选)
  ├── documentNumber? (证件号/合同编号，可选)
  ├── issuer? (签发机构/来源，可选)
  ├── issueDate? (签发日期，可选)
  ├── expiryDate? (到期日期，可选 — 无有效期的文档留空)
  ├── status: DocumentStatus (ACTIVE / EXPIRED / REVOKED / LOST)
  ├── importance: Importance (HIGH / MEDIUM / LOW — 重要程度)
  ├── reminderDays (提醒提前天数，默认 7 — 仅 expiryDate 非空时有意义，设置到期日期即视为启用提醒)
  ├── note? (备注，可选)
  ├── subDocumentCount (计算字段，子文档数量 — 应用层维护，创建/删除子文档时同步更新)
  ├── createdAt
  ├── updatedAt
  │
  ├── attachments[] → DocumentAttachment (文档附件 — 扫描件、照片、PDF 等)
  └── invoices[] → DocumentInvoice (发票关联)

DocumentAttachment (文档附件)
  ├── id
  ├── document → Document
  ├── file → FileRecord
  ├── createdAt

DocumentInvoice (文档发票关联)
  ├── id
  ├── document → Document
  ├── invoice → Invoice
  ├── createdAt
  唯一约束：(document_id, invoice_id) 防止重复绑定
```

### 3.3 枚举定义

```java
// DocumentStatus.java
public enum DocumentStatus {
    ACTIVE,      // 有效
    EXPIRED,     // 已过期
    REVOKED,     // 已注销/作废
    LOST         // 已遗失
}

// Importance.java
public enum Importance {
    HIGH,        // 重要
    MEDIUM,      // 一般
    LOW          // 低
}
```

---

## 四、关键设计决策

| 决策                       | 方案                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 完全通用化                 | 不区分保险、证件、合同等类型。所有文档统一为 Document 实体，通过分类和自定义字段区分                                                                          |
| 父-子两级结构              | `parentId` 字段实现两级关联。父文档下可挂载子文档（如保单下的缴费凭证、房产证下的购房合同）。删除父文档时子文档自动解除父子关系（不级联删除）。parentId 仅创建时可设定，编辑时不可变更 |
| 字段全部可选（除名称分类） | holder、documentNumber、issuer、issueDate、expiryDate 均为可选。用户按需填写——身份证可填证件号+到期日，水电费账单只需名称+附件                                  |
| 分类自由定义               | 预设 10 个常用分类（含"保险保单"），用户可自由新增/编辑/删除自定义分类。分类管理参照 GoodCategory 模式                                                         |
| 到期提醒                   | 设置了到期日期的文档即视为启用提醒，到期前 N 天提醒（默认 7 天，可通过 reminderDays 自定义）。无到期日期的文档仅归档  |
| 发票关联                   | 复用现有 InvoiceBindingManager，发票关联到文档级别。适用于保险保费发票、维修发票等                                                                             |
| 附件上传                   | 复用现有 AttachmentManager，支持 PDF、图片等文件上传预览                                                                                                      |
| 重要程度标记               | HIGH/MEDIUM/LOW 三级，列表中以彩色 Badge 显示                                                                                                                 |
| 编号脱敏                   | 列表中部分遮蔽显示（如 `310***********1234`），详情页显示完整号码                                                                                            |
| 文本搜索                   | 名称、编号、持有人支持模糊搜索                                                                                                                                |
| 全文搜索集成               | 文档附件纳入 ES 全文搜索，搜索结果可跳转到文档详情                                                                                                            |
| 删除文档                   | 有子文档时仅解除父子关系（子文档变为顶层），不级联删除。有附件时仅解除关联，不删文件                                                                            |
| 列表页                     | 仅显示顶层文档，子文档在 DetailDrawer 中查看和管理                                                                                                              |
| 子文档 DetailDrawer        | 子文档的 DetailDrawer 隐藏"子文档列表"区域（最多两层），但保留附件和发票管理                                                                                     |
| subDocumentCount           | 应用层维护，创建/删除子文档时在 Service 层同步更新                                                                                                               |

---

## 五、API 设计

遵循现有项目 RESTful 规范，所有接口需认证。

### 5.1 文档分类（DocumentCategory）

| 方法   | 路径                                    | 说明                                         |
| ------ | --------------------------------------- | -------------------------------------------- |
| GET    | `/api/document-categories`              | 全部列表（不分页，供 SearchableSelect 使用） |
| POST   | `/api/document-categories`              | 创建分类                                     |
| PUT    | `/api/document-categories/{id}`         | 更新分类                                     |
| DELETE | `/api/document-categories/{id}`         | 删除分类（有关联文档时禁止删除）             |

### 5.2 文档（Document）

| 方法   | 路径                       | 说明                                                            |
| ------ | -------------------------- | --------------------------------------------------------------- |
| GET    | `/api/documents`           | 分页列表，支持筛选：categoryId、status、importance、parentId、search |
| GET    | `/api/documents/{id}`      | 详情（含子文档列表、附件、关联发票）                            |
| POST   | `/api/documents`           | 创建文档                                                        |
| PUT    | `/api/documents/{id}`      | 更新文档                                                        |
| DELETE | `/api/documents/{id}`      | 删除文档（子文档解除父子关系，附件仅解除关联）                  |

#### 查询参数

- `page` (default 0), `size` (default 20)
- `sortBy` (default "createdAt"), `sortDir` (default "desc")
- `categoryId` — 按分类筛选
- `status` — 按 DocumentStatus 筛选
- `importance` — 按重要程度筛选
- `parentId` — 按父文档筛选（null 表示仅顶层文档）
- `search` — 模糊搜索 name、documentNumber、holder

### 5.3 文档附件

| 方法   | 路径                                                   | 说明               |
| ------ | ------------------------------------------------------ | ------------------ |
| POST   | `/api/documents/{id}/attachments`                      | 上传文档附件       |
| GET    | `/api/documents/{id}/attachments`                      | 获取附件列表       |
| DELETE | `/api/documents/{id}/attachments/{attachmentId}`       | 删除附件           |

### 5.4 文档发票关联

| 方法   | 路径                                               | 说明               |
| ------ | -------------------------------------------------- | ------------------ |
| GET    | `/api/documents/{id}/invoices`                     | 获取已关联发票     |
| POST   | `/api/documents/{id}/invoices/{invoiceId}`         | 绑定发票           |
| DELETE | `/api/documents/{id}/invoices/{invoiceId}`         | 解绑发票           |

---

## 六、通知模块集成

### 6.1 新增 NotificationType

```java
DOCUMENT_EXPIRY  // 文档到期提醒
```

### 6.2 新增 DocumentScheduler

参照现有 `NotificationScheduler` 模式，新建定时任务：

- **调度线程池**：prefix `archives-`
- **Crontab 配置**：`notification.archives-crontab`，默认 `0 0 8 * * ?`（每天早 8 点）

#### 文档到期提醒检查逻辑 `checkDocumentExpiry()`

1. 查询所有 `expiryDate IS NOT NULL` 且 `status = ACTIVE` 的文档
2. 若 `expiryDate` 在 `[today, today + reminderDays]` 范围内，生成 `DOCUMENT_EXPIRY` 通知
3. 通知内容：`"您的文档「{name}」将于 {expiryDate} 到期，请及时处理"`
4. `sourceType = "DOCUMENT"`，`sourceId = document.id`

#### 自动状态更新

定时任务同时执行状态自动更新：

- `expiryDate < today` 且 `status = ACTIVE` → 更新为 `EXPIRED`

### 6.3 SystemConfig 新增配置项

| Key                               | 默认值        | 说明                  |
| --------------------------------- | ------------- | --------------------- |
| `notification.archives-crontab`   | `0 0 8 * * ?` | 文档到期提醒检查 cron |

---

## 七、Dashboard 增强

在 Dashboard 页面增加家庭档案相关卡片，数据通过 `/api/dashboard` 接口追加字段返回：

| 卡片                   | 数据来源                                        | 说明                                           |
| ---------------------- | ----------------------------------------------- | ---------------------------------------------- |
| **即将到期文档**       | 未来 30 天内到期的文档（含顶层和子文档）         | 最多显示 5 条，点击跳转到文档详情               |
| **有效文档总数**       | `status = ACTIVE` 的顶层文档数量                 | 点击跳转到文档列表                             |

---

## 八、前端设计

### 8.1 路由

| 路径       | 页面组件       | 权限         |
| ---------- | -------------- | ------------ |
| `/archives`| ArchivesPage   | 所有登录用户 |

### 8.2 页面设计

#### ArchivesPage（家庭档案列表页）

采用 **Table + Drawer** 模式：

**顶部工具栏**：

- 搜索框（搜索名称、编号、持有人）
- 筛选下拉：`categoryId`（按分类筛选）
- 筛选下拉：`status`（全部 / 有效 / 已过期 / ...）
- 筛选下拉：`importance`（全部 / 重要 / 一般 / 低）
- "添加文档" 按钮

**数据表格**（列）：

- 名称（含重要程度彩色 Badge）
- 分类
- 持有人
- 编号（脱敏显示）
- 到期日期（无有效期显示"—"，即将到期高亮）
- 状态（彩色 Badge）
- 子文档数
- 操作（编辑 / 删除）

**交互**：

- 点击行 → 打开 DocumentDetailDrawer（右侧滑出）
- 行尾操作按钮 → 编辑对话框 / 删除确认
- 列表页仅显示顶层文档，子文档在 DetailDrawer 中查看和管理

#### DocumentDetailDrawer（文档详情抽屉）

使用 `Sheet` 组件（与现有 Asset detail drawer 一致）：

**上半部分 — 文档信息**：

- 名称、重要程度 Badge、状态 Badge
- 分类
- 持有人（如有）
- 编号（如有，可切换显示/隐藏）
- 签发机构/来源（如有）
- 签发日期、到期日期（如有）
- 提醒提前天数（如有到期日期）
- 备注
- 编辑按钮

**中间区域 — 子文档列表**：

- 子文档表格：名称、分类、持有人、到期日期、状态
- "添加子文档" 按钮（点击后打开 DocumentDialog，parentId 自动设为当前文档）
- 每条子文档可点击打开独立的 DetailDrawer（子文档 DetailDrawer 隐藏"子文档列表"区域，但保留附件和发票管理）

**下半部分 — 附件区域**：

- 复用 AttachmentManager 组件
- 上传/预览/下载/删除附件

**底部 — 发票关联**：

- 复用 InvoiceBindingManager 组件
- 绑定/解绑已有发票

> 注：子文档同样支持独立的附件上传和发票关联。子文档的 DetailDrawer 布局与父文档相同，但不显示"子文档列表"区域（最多两层结构）。

#### DocumentDialog（创建/编辑文档对话框）

使用 `Dialog` 组件，表单字段：

- 名称（必填）
- 分类（**SearchableSelect**，从已有分类中选择，支持内联新增/编辑/删除）
- 父文档（**SearchableSelect**，可选 — 选择已有文档作为父文档，仅允许选顶层文档；创建子文档时自动填入。**parentId 仅创建时可设定，编辑时不可变更**）
- 持有人（可选）
- 编号（可选）
- 签发机构/来源（可选）
- 签发日期（可选）
- 到期日期（可选，留空表示无有效期）
- 状态
- 重要程度（下拉选择：重要/一般/低）
- 提醒提前天数（默认 7 天，仅到期日期非空时显示）
- 备注

#### DocumentCategoryManagerDialog（文档分类管理对话框）

参照 CategoryManagerDialog 模式：

- 分类列表（名称 + 描述）
- 新增/编辑/删除操作
- 删除时检查有关联文档

### 8.3 导航菜单

侧边栏新增一项（置于 "医疗记录" 和 "订阅管理" 之间）：

```
nav.archives  →  /archives  图标: ShieldCheck (lucide-react)
```

### 8.4 文件结构

```
client/src/
├── api/
│   ├── documents.ts               (NEW - 文档 CRUD API)
│   ├── documentAttachments.ts     (NEW - 文档附件 API)
│   └── documentCategories.ts      (NEW - 文档分类 CRUD API)
├── hooks/queries/
│   ├── useDocuments.ts            (NEW - React Query hooks)
│   ├── useDocumentCategories.ts   (NEW - React Query hooks)
│   └── documentKeys.ts            (NEW - Query key factory)
├── pages/
│   └── ArchivesPage.tsx           (NEW - 列表页)
├── components/archives/
│   ├── DocumentDialog.tsx         (NEW - 创建/编辑文档)
│   ├── DocumentDetailDrawer.tsx   (NEW - 文档详情 + 子文档列表)
│   ├── DocumentCategoryManagerDialog.tsx (NEW - 文档分类管理)
│   └── DeleteDocumentDialog.tsx   (NEW - 删除确认)
├── i18n/locales/
│   ├── en.json                    (MODIFY - 新增 ~80 keys)
│   └── zh.json                    (MODIFY - 新增 ~80 keys)
├── components/
│   ├── Sidebar.tsx                (MODIFY - 新增导航项)
│   └── App.tsx                    (MODIFY - 新增路由)
```

---

## 九、i18n 新增 Key 清单

### 导航

```
nav.archives  →  en: "Archives"  zh: "家庭档案"
```

### 文档页面

```
archives.title
archives.create
archives.createSubDocument
archives.edit
archives.delete
archives.noData
archives.searchPlaceholder
archives.viewNumber

archives.table.name
archives.table.category
archives.table.holder
archives.table.documentNumber
archives.table.expiryDate
archives.table.status
archives.table.subDocuments
archives.table.actions

archives.filters.allCategories
archives.filters.allStatuses
archives.filters.allImportance

archives.status.active
archives.status.expired
archives.status.revoked
archives.status.lost

archives.importance.high
archives.importance.medium
archives.importance.low

archives.form.name
archives.form.nameRequired
archives.form.category
archives.form.categoryRequired
archives.form.parentDocument
archives.form.parentDocumentPlaceholder
archives.form.holder
archives.form.documentNumber
archives.form.issuer
archives.form.issueDate
archives.form.expiryDate
archives.form.expiryDateHint
archives.form.reminderDays
archives.form.status
archives.form.importance
archives.form.note

archives.detail.title
archives.detail.subDocuments
archives.detail.noSubDocuments
archives.detail.addSubDocument
archives.detail.attachments
archives.detail.noAttachments
archives.detail.invoices
archives.detail.noInvoices

archives.delete.title
archives.delete.confirm
archives.delete.hasSubDocuments
archives.delete.subDocumentsWillBeUnlinked
```

### 文档分类

```
archives.categories.title
archives.categories.name
archives.categories.namePlaceholder
archives.categories.description
archives.categories.manage
archives.categories.create
archives.categories.edit
archives.categories.delete
archives.categories.hasDocuments
archives.categories.cannotDelete

archives.categories.preset.identity
archives.categories.preset.property
archives.categories.preset.financial
archives.categories.preset.contract
archives.categories.preset.certificate
archives.categories.preset.family
archives.categories.preset.insurance
archives.categories.preset.receipt
archives.categories.preset.warranty
archives.categories.preset.other
```

### 通知类型

```
notifications.types.documentExpiry  →  en: "Document Expiry"  zh: "文档到期提醒"
```

### Dashboard

```
archives.dashboard.activeDocuments   →  en: "Active Documents"   zh: "有效文档"
archives.dashboard.upcomingExpiries  →  en: "Upcoming Expiries"  zh: "即将到期"
```

### 附件与发票

```
archives.document.attachments.manage  →  en: "Attachments"      zh: "文档附件"
archives.document.invoices.manage     →  en: "Invoices"         zh: "关联发票"
```

### 搜索

```
search.tags.document  →  en: "Document"  zh: "文档"
```

---

## 十、关联现有系统

### 10.1 与现有模块的关系

| 现有关联模块         | 关联方式                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------ |
| **Invoice（发票）**  | 文档可关联发票（如保险保费发票、维修发票）。发票列表/详情页需新增文档关联显示               |
| **FileRecord（文件）** | 文档附件复用现有文件基础设施                                                           |
| **Notification（通知）** | 到期提醒复用现有通知模块 + Webhook 机制                                                |
| **Dashboard（仪表盘）** | 新增文档统计卡片                                                                         |
| **SearchDialog（全局搜索）** | 文档附件纳入 ES 全文搜索，搜索结果可跳转到文档详情                                   |

### 10.2 需修改的现有文件

#### 前端

| 文件                                | 变更                                                          |
| ----------------------------------- | ------------------------------------------------------------- |
| `src/App.tsx`                       | 新增 `/archives` 路由                                         |
| `src/components/Sidebar.tsx`        | 新增"家庭档案"导航项                                          |
| `src/pages/InvoicesPage.tsx`        | 列表增加文档关联列                                            |
| `src/components/invoices/InvoiceDetailDrawer.tsx` | 详情增加绑定的文档显示                              |
| `src/components/SearchDialog.tsx`   | `handleNavigate()` 新增 `DOCUMENT` case                       |
| `src/api/search.ts`                 | `SourceInfo.type` 类型联合新增 `"DOCUMENT"`                   |
| `src/i18n/locales/en.json`          | 新增 ~80 keys                                                 |
| `src/i18n/locales/zh.json`          | 新增 ~80 keys                                                 |

#### 后端

| 文件                                           | 变更                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| `enums/NotificationType.java`                 | 新增 `DOCUMENT_EXPIRY`                                                     |
| `enums/SourceType.java`                       | 新增 `DOCUMENT`                                                            |
| `initializer/DataInitializer.java`            | 新增 `notification.archives-crontab` 默认配置项 + 预设文档分类数据         |
| `service/SearchService.java`                  | `buildSourceMap()` 增加 DocumentAttachment → Document 关联查询             |
| `InvoiceService.java`                         | 新增文档关联查询                                                           |

---

## 十一、ES 全文搜索集成

当文档附件上传并完成内容提取后，搜索结果需能跳转到文档详情。

### 后端

**SearchService.buildSourceMap()** 新增查询：

```
DocumentAttachment → Document
  → SourceInfo(DOCUMENT, "文档", documentId, documentName)
```

| 修改文件                               | 变更                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| `SourceType.java`                      | 新增 `DOCUMENT`                                                                        |
| `SearchService.java`                   | `buildSourceMap()` 增加 `DocumentAttachmentRepository` 查询                            |
| `DocumentAttachmentRepository.java`    | 新增 `findByFileIdIn(List<Long>)` 批量查询方法                                        |

### 前端

| 修改文件                | 变更                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `SearchDialog.tsx`      | `handleNavigate()` 新增 `DOCUMENT` → `/archives?documentId={sourceId}`                 |
| `ArchivesPage.tsx`      | 读取 URL query param `?documentId=X`，打开对应 DetailDrawer                             |
| `search.ts` (API)       | `SourceInfo.type` 类型联合新增 `"DOCUMENT"`                                            |
| `en.json / zh.json`     | 新增 `search.tags.document`                                                            |

---

## 十二、发票绑定实体扩展

文档通过 DocumentInvoice 关联到发票，需在发票列表和详情中展示这些关联。

### 后端

**新增 Response DTO**：

```java
// BoundDocumentResponse — 发票关联的文档信息
public class BoundDocumentResponse {
    Long id;              // DocumentInvoice.id
    Long documentId;
    String documentName;
    Long categoryId;
    String categoryName;
}
```

**InvoiceResponse / InvoiceDetailResponse** 新增字段：

```java
List<BoundDocumentResponse> documents = new ArrayList<>();
```

### 前端

**列显示**（InvoicesPage 表格列）：

合并现有 assets + subscriptions + documents：

- 取 `[...assets, ...subscriptions, ...documents]` 的第一个元素显示
- 溢出显示 "+N"

**详情显示**（InvoiceDetailDrawer）：

新增子区域：

| 区域     | 标题 i18n                              | 内容                                                     |
| -------- | -------------------------------------- | -------------------------------------------------------- |
| 关联资产 | `invoices.detail.boundAssets`          | 现有 asset 列表（不变）                                  |
| 关联订阅 | `invoices.detail.boundSubscriptions`   | 现有订阅列表（不变）                                     |
| 关联文档 | `invoices.detail.boundDocuments`       | 文档列表（分类 + 文档名），点击跳转到对应文档详情         |

#### i18n 新增 Key

```
invoices.detail.boundDocuments  →  en: "Bound Documents"  zh: "关联文档"
```

---

## 十三、待讨论 / 待决策事项

全部已确认，无待决策事项。

---

## 十四、实施计划预估

**实施原则**：

- **按步骤 commit**：每完成一个关键步骤即进行一次 commit
- **复用优先**：尽可能复用已有组件（AttachmentManager、InvoiceBindingManager 等）

按模块拆分为以下步骤（每个步骤一个 commit）：

1. **后端 — 枚举与实体**：2 个枚举（DocumentStatus、Importance）+ 3 个实体（Document、DocumentAttachment、DocumentCategory）+ 1 个关联表（DocumentInvoice）
2. **后端 — Repository 与 Service**：对应 Repository + Service 层（含父子文档查询、附件、发票关联）
3. **后端 — Controller 与 DTO**：Controller + Request/Response DTO
4. **后端 — 通知集成**：NotificationType 扩展 + DocumentScheduler + SystemConfig + 预设文档分类数据初始化
5. **后端 — Dashboard 集成**：DashboardService 追加文档统计字段
6. **前端 — API 层**：API 模块 + React Query hooks（documents、categories）
7. **前端 — 页面与组件**：ArchivesPage + DocumentDetailDrawer（含子文档列表）+ DocumentDialog（含父文档选择）+ DocumentCategoryManagerDialog
8. **前端 — 路由/导航/Dashboard**：路由注册 + 侧边栏 + Dashboard 卡片 + i18n
9. **现有系统修改**：ES 搜索集成 + 发票绑定实体扩展（详见第十、十一、十二节）
10. **文档更新**：README.md / CLAUDE.md / server docs 更新

---

_文档状态：需求已确认，待开发。_
