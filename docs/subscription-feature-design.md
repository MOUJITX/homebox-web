# 订阅管理功能需求设计文档

> 状态：草稿，待评审
> 日期：2026-05-22

---

## 一、功能概述

订阅管理（Subscription Management）用于记录和管理各种平台服务的订阅情况，帮助用户：

- 追踪所有平台服务的订阅状态，**避免重复订阅**
- 记录每次付费/续费明细，掌握消费情况
- 续订提醒，**避免错过付款日期**导致服务中断

---

## 二、核心概念

### 2.1 订阅（Subscription）与订阅记录（SubscriptionRecord）

```
Subscription (订阅)  1 ──── N  SubscriptionRecord (订阅记录)
```

- **Subscription**：代表一个"订阅的服务"，例如 "ChatGPT Plus"、"阿里云 OSS"、"百度网盘 SVIP"
- **SubscriptionRecord**：该服务下的每一次付费/续费/扣费明细

### 2.2 订阅类型

| 类型 | 说明 | 典型场景 |
|------|------|---------|
| **按量付费** (PAY_AS_YOU_GO) | 按实际用量计费 | AI 模型 token（预付费）、云文件存储（后付费） |
| **包年包月** (PERIODIC) | 固定周期付费 | 网盘会员按月付费、域名按年续费 |

### 2.3 计费方式

**按量付费** 下的子模式：

| 计费方式 | 说明 | 示例 |
|---------|------|------|
| **预付费** (PREPAID) | 先充值再使用 | OpenAI API token 充值 |
| **后付费** (POSTPAID) | 先用后付，出账单后付款 | AWS S3 存储费用、阿里云 CDN |

**包年包月** 下的计费周期：

- 以**天**为单位存储（`billingCycleDays`，Integer）
- 前端提供**快捷选择**：包月(30天) / 包季(90天) / 包年(365天)
- 同时支持**手动输入**任意天数（如 180 天、7 天试用等）

### 2.4 续订提醒

- **仅包年包月** 类型需要续订提醒，**按量付费不提醒**
- 服务到期前 N 天提醒续费（N 可配置：全局默认值 + 每订阅可单独设定）
- 提醒通过已有 **通知模块**（`Notification`）发送，同时支持 Webhook 推送

---

## 三、后端设计

### 3.1 新增枚举

```java
// SubscriptionType.java
public enum SubscriptionType {
    PAY_AS_YOU_GO,   // 按量付费
    PERIODIC          // 包年包月
}

// BillingMode.java
public enum BillingMode {
    PREPAID,   // 预付费（先付费再使用）
    POSTPAID   // 后付费（先用后计费）
}

// SubscriptionStatus.java
public enum SubscriptionStatus {
    ACTIVE,     // 使用中
    INACTIVE,   // 暂停中
    CANCELLED   // 已取消
}
```

### 3.2 新增实体

#### Subscription（订阅表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | PK, AUTO | — |
| name | VARCHAR(200) | NOT NULL | 订阅名称，如 "ChatGPT Plus" |
| description | TEXT | NULLABLE | 服务描述 |
| subscriptionType | VARCHAR(20) | NOT NULL | SubscriptionType |
| billingMode | VARCHAR(20) | NULLABLE | BillingMode（仅 PAY_AS_YOU_GO） |
| billingCycleDays | INT | NULLABLE | 计费周期天数（仅 PERIODIC） |
| price | DECIMAL(12,2) | NULLABLE | 参考价格/周期价格 |
| currency | VARCHAR(10) | DEFAULT 'CNY' | 币种 |
| platformId | Long | FK → platforms.id, NOT NULL | 所属平台 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | SubscriptionStatus |
| renewNoticeDays | INT | DEFAULT 7 | 续费提醒提前天数（仅 PERIODIC 有效） |
| note | TEXT | NULLABLE | 备注 |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

#### SubscriptionRecord（订阅记录表）

所有记录均视为已支付，不区分购买/续费/扣费类型。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | PK, AUTO | — |
| subscriptionId | Long | FK → subscriptions.id, NOT NULL | 所属订阅 |
| recordDate | DATE | NOT NULL | 扣费日期 |
| amount | DECIMAL(12,2) | NOT NULL | 金额 |
| currency | VARCHAR(10) | DEFAULT 'CNY' | 币种 |
| startDate | DATE | NULLABLE | 服务生效日期（包年包月必须有） |
| endDate | DATE | NULLABLE | 服务到期日期（包年包月必须有） |
| quantity | VARCHAR(100) | NULLABLE | 用量描述（按量付费时，如 "500万 token"） |
| paymentMethodId | Long | FK → payment_methods.id, NULLABLE | 支付方式 |
| note | TEXT | NULLABLE | 备注 |
| createdAt | DATETIME | NOT NULL | 创建时间 |

#### SubscriptionRecordAttachment（记录普通附件）

参照现有 `InvoiceAttachment` 模式，用于关联截图、PDF 账单等普通附件：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | PK, AUTO | — |
| recordId | Long | FK → subscription_records.id, NOT NULL | 所属记录 |
| fileId | Long | FK → file_records.id, NOT NULL | 关联文件 |

#### SubscriptionRecordInvoice（记录-发票关联表）

参照现有 `AssetInvoice` 模式，用于关联已存在的发票：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | PK, AUTO | — |
| recordId | Long | FK → subscription_records.id, NOT NULL | 所属记录 |
| invoiceId | Long | FK → invoices.id, NOT NULL | 关联发票 |
| createdAt | DATETIME | NOT NULL | 创建时间 |

唯一约束：`(record_id, invoice_id)` 防止重复绑定。

#### Platform（平台表）

用于统一管理订阅平台，`Subscription.platformId` 关联此表：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | PK, AUTO | — |
| name | VARCHAR(100) | NOT NULL, UNIQUE | 平台名称，如 "百度网盘"、"阿里云" |
| logoFileId | Long | FK → file_records.id, NULLABLE | 平台 logo（上传的图片文件） |
| website | VARCHAR(500) | NULLABLE | 平台官网/管理页面网址 |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

#### PaymentMethod（支付方式表）

用于统一管理支付方式，`SubscriptionRecord.paymentMethodId` 关联此表：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | PK, AUTO | — |
| name | VARCHAR(100) | NOT NULL, UNIQUE | 支付方式名称，如 "微信支付"、"支付宝"、"招商银行信用卡" |
| logoFileId | Long | FK → file_records.id, NULLABLE | 支付方式 logo（上传的图片文件） |
| createdAt | DATETIME | NOT NULL | 创建时间 |
| updatedAt | DATETIME | NOT NULL | 更新时间 |

### 3.3 新增 API

遵循现有项目 RESTful 规范，所有接口需认证。

#### Subscription CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/subscriptions` | 分页列表，支持筛选：type、status、platformId、search |
| GET | `/api/subscriptions/{id}` | 详情（不含记录，记录通过 records 接口单独获取） |
| POST | `/api/subscriptions` | 创建订阅 |
| PUT | `/api/subscriptions/{id}` | 更新订阅 |
| DELETE | `/api/subscriptions/{id}` | 删除订阅（**有记录时禁止删除**，返回 409） |

#### SubscriptionRecord CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/subscriptions/{subId}/records` | 某订阅下的所有记录 |
| POST | `/api/subscriptions/{subId}/records` | 添加记录 |
| PUT | `/api/subscriptions/{subId}/records/{id}` | 更新记录 |
| DELETE | `/api/subscriptions/{subId}/records/{id}` | 删除记录 |

#### SubscriptionRecord 附件（普通文件）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/subscription-records/{id}/attachments` | 上传普通附件（截图、PDF 账单等） |
| GET | `/api/subscription-records/{id}/attachments` | 获取附件列表 |
| DELETE | `/api/subscription-records/{id}/attachments/{attachmentId}` | 删除附件 |

#### SubscriptionRecord 发票关联（参照 Asset-Invoice 绑定模式）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/subscription-records/{id}/invoices` | 获取已关联的发票列表 |
| POST | `/api/subscription-records/{id}/invoices/{invoiceId}` | 绑定已有发票到记录 |
| DELETE | `/api/subscription-records/{id}/invoices/{invoiceId}` | 解绑发票 |

#### Platform CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/platforms` | 全部列表（不分页，供 SearchableSelect 使用） |
| POST | `/api/platforms` | 创建平台（含 logo 上传） |
| PUT | `/api/platforms/{id}` | 更新平台（含 logo） |
| DELETE | `/api/platforms/{id}` | 删除平台（有订阅关联时禁止删除） |

#### PaymentMethod CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/payment-methods` | 全部列表（不分页，供 SearchableSelect 使用） |
| POST | `/api/payment-methods` | 创建支付方式（含 logo 上传） |
| PUT | `/api/payment-methods/{id}` | 更新支付方式（含 logo） |
| DELETE | `/api/payment-methods/{id}` | 删除支付方式（有记录关联时禁止删除） |

#### 查询参数规范

`GET /api/subscriptions` 支持的查询参数：
- `page` (default 0), `size` (default 20)
- `sortBy` (default "createdAt"), `sortDir` (default "desc")
- `type` — 按 SubscriptionType 筛选
- `status` — 按 SubscriptionStatus 筛选
- `platformId` — 按平台筛选
- `search` — 模糊搜索 name

### 3.4 通知模块集成

#### 新增 NotificationType

```java
SUBSCRIPTION_RENEWAL   // 订阅续费提醒
```

#### 新增 SubscriptionScheduler

参照 `NotificationScheduler` 模式，新建定时任务：

- **调度线程池**：prefix `subscription-`
- **Crontab 配置**：`notification.subscription-crontab`，默认 `0 0 8 * * ?`（每天早 8 点）
- **检查逻辑 `checkAndNotify()`**：
  1. 查询所有 `subscriptionType = PERIODIC` 且 `status = ACTIVE` 的订阅
  2. 找到该订阅最新的 SubscriptionRecord（按 recordDate 降序）
  3. 若 `endDate` 在 `[today, today + renewNoticeDays]` 范围内，生成 `SUBSCRIPTION_RENEWAL` 通知
  4. 通知内容（中文）：`"您的订阅「{name}」将于 {endDate} 到期，请及时续费"`
  5. 通知的 `sourceType = "SUBSCRIPTION"`，`sourceId = subscription.id`
  6. **不做事后去重**：每次 cron 触发时，所有处于提醒期的订阅都生成通知。通知次数由 cron 调度频率决定，手动触发产生的重复是可接受的
  7. **按量付费不生成任何续费提醒**

#### SystemConfig 新增配置项

| Key | 默认值 | 说明 |
|-----|--------|------|
| `notification.subscription-crontab` | `0 0 8 * * ?` | 订阅提醒检查 cron |

### 3.5 文件结构

```
server/src/main/java/com/moujitx/homebox/server/
├── entity/
│   ├── Subscription.java                (NEW)
│   ├── SubscriptionRecord.java          (NEW)
│   ├── SubscriptionRecordAttachment.java(NEW)
│   ├── SubscriptionRecordInvoice.java   (NEW - 参照 AssetInvoice)
│   ├── Platform.java                    (NEW)
│   └── PaymentMethod.java               (NEW)
├── enums/
│   ├── SubscriptionType.java            (NEW)
│   ├── BillingMode.java                 (NEW)
│   ├── SubscriptionStatus.java          (NEW)
│   └── NotificationType.java            (MODIFY: add SUBSCRIPTION_RENEWAL)
├── repository/
│   ├── SubscriptionRepository.java                (NEW)
│   ├── SubscriptionRecordRepository.java          (NEW)
│   ├── SubscriptionRecordAttachmentRepository.java(NEW)
│   ├── SubscriptionRecordInvoiceRepository.java   (NEW - 参照 AssetInvoiceRepository)
│   ├── PlatformRepository.java                    (NEW)
│   └── PaymentMethodRepository.java               (NEW)
├── dto/request/
│   ├── SubscriptionRequest.java          (NEW)
│   ├── SubscriptionRecordRequest.java    (NEW)
│   ├── PlatformRequest.java              (NEW)
│   └── PaymentMethodRequest.java         (NEW)
├── dto/response/
│   ├── SubscriptionResponse.java         (NEW)
│   ├── SubscriptionRecordResponse.java   (NEW)
│   ├── SubscriptionRecordInvoiceResponse.java (NEW - 参照 AssetInvoiceResponse)
│   ├── SubscriptionDashboardResponse.java     (NEW - Dashboard 统计)
│   ├── PlatformResponse.java             (NEW)
│   └── PaymentMethodResponse.java        (NEW)
├── service/
│   ├── SubscriptionService.java          (NEW)
│   ├── SubscriptionRecordService.java    (NEW - 含附件上传 + 发票绑定逻辑)
│   ├── PlatformService.java              (NEW)
│   └── PaymentMethodService.java         (NEW)
├── controller/
│   ├── SubscriptionController.java       (NEW)
│   ├── SubscriptionRecordController.java (NEW)
│   ├── PlatformController.java           (NEW)
│   └── PaymentMethodController.java      (NEW)
└── config/
    └── SubscriptionScheduler.java        (NEW)
```

---

## 四、前端设计

### 4.1 路由

| 路径 | 页面组件 | 权限 |
|------|---------|------|
| `/subscriptions` | SubscriptionsPage | 所有登录用户 |

### 4.2 页面设计

#### SubscriptionsPage（订阅列表页）

采用与现有 AssetsPage / ExpirationPage **一致的 Table + Drawer 模式**：

**顶部工具栏**：
- 搜索框（搜索名称）
- 筛选下拉：`subscriptionType`（全部 / 按量付费 / 包年包月）
- 筛选下拉：`status`（全部 / 使用中 / 暂停中 / 已取消）
- 筛选下拉：`platformId`（按平台筛选）
- "添加订阅" 按钮

**数据表格**（列）：
- 名称
- 平台（含 logo）
- 类型（按量付费/包年包月）
- 状态（彩色 Badge）
- 最新记录（日期 + 金额）
- 到期日期（仅包年包月显示）
- 操作（编辑 / 删除）

**交互**：
- 点击行 → 打开 DetailDrawer（右侧滑出）
- 行尾操作按钮 → 编辑对话框 / 删除确认

#### SubscriptionDetailDrawer（订阅详情抽屉）

使用 `Sheet` 组件（与现有 Asset detail drawer 一致）：

**上半部分 — 订阅信息**：
- 名称、状态 Badge
- 平台（logo + 名称，网址可点击跳转）
- 描述
- 类型 + 计费方式/周期
- 续费提醒设置
- 备注
- 编辑按钮

**下半部分 — 订阅记录列表**：
- 记录表格：日期、金额、支付方式、开始日期、结束日期、用量、备注
- "添加记录" 按钮
- 每条记录可编辑/删除

#### SubscriptionDialog（创建/编辑订阅对话框）

使用 `Dialog` 组件，表单字段：
- 名称（必填）
- 描述（可选）
- 平台（**SearchableSelect**，从已有平台中选择，支持内联新增/编辑/删除平台）
- 订阅类型（按量付费 / 包年包月，切换时联动显示下方字段）
- 计费方式（仅按量付费时显示：预付费 / 后付费）
- 计费周期（仅包年包月时显示）：
  - 快捷按钮：**包月(30天)** | **包季(90天)** | **包年(365天)**，点击后直接填入对应天数
  - 同时支持**手动输入**任意天数覆盖快捷选择
- 参考价格 + 币种
- 状态
- 续费提醒提前天数（仅包年包月时显示）
- 备注

#### SubscriptionRecordDialog（添加/编辑记录对话框）

使用 `Dialog` 组件，表单字段：
- 记录日期
- 金额 + 币种
- 支付方式（**SearchableSelect**，从已有支付方式中选择，支持内联新增/编辑/删除支付方式）
- 开始日期
- 结束日期（包年包月时必须填写）
- 用量描述（按量付费时可填）
- 备注

表单下方分为两个独立区域：

**普通附件**（参照现有文件上传组件）：
- 上传截图、PDF 账单等文件，支持多个文件
- 已上传的附件以列表展示，可删除

**发票关联**（参照 AssetInvoiceManager 模式）：
- "关联发票"按钮 → 打开 `BindInvoiceDialog`，从已有发票列表中选择
- "上传新发票"按钮 → 打开 `CreateInvoiceDialog`，上传/创建后自动绑定
- 已关联的发票以列表展示（日期、发票号、金额、卖方），可解绑

### 4.3 导航菜单

侧边栏新增一项（置于 "收据发票" 和 "用药提醒" 之间）：

```
nav.subscriptions  →  /subscriptions  图标: CreditCard (lucide-react)
```

### 4.4 Dashboard 增强

在 Dashboard 页面增加订阅相关卡片（参照现有 Dashboard 卡片布局），数据通过现有 `/api/dashboard` 接口追加字段返回：

- **活跃订阅数**：统计 `status = ACTIVE` 的订阅数量，点击跳转到订阅列表页
- **本月订阅支出**：汇总本月所有 SubscriptionRecord 的金额
- **即将到期提醒**：列出 `endDate` 在 7 天内到期的包年包月订阅（最多显示 5 条），点击跳转到对应订阅详情

### 4.5 文件结构

```
client/src/
├── api/
│   ├── subscriptions.ts              (NEW - 订阅 CRUD API)
│   ├── subscriptionRecords.ts        (NEW - 记录 + 附件 + 发票关联 API)
│   ├── platforms.ts                  (NEW - 平台 CRUD API)
│   └── paymentMethods.ts             (NEW - 支付方式 CRUD API)
├── hooks/queries/
│   ├── useSubscriptions.ts           (NEW - React Query hooks)
│   ├── useSubscriptionRecords.ts     (NEW - React Query hooks)
│   ├── usePlatforms.ts               (NEW - React Query hooks)
│   └── usePaymentMethods.ts          (NEW - React Query hooks)
├── pages/
│   └── SubscriptionsPage.tsx         (NEW - 列表页)
├── components/subscriptions/
│   ├── SubscriptionDialog.tsx        (NEW - 创建/编辑对话框)
│   ├── SubscriptionDetailDrawer.tsx  (NEW - 详情抽屉)
│   ├── SubscriptionRecordDialog.tsx  (NEW - 添加/编辑记录 + 附件 + 发票关联)
│   ├── SubscriptionInvoiceManager.tsx(NEW - 发票关联管理，参照 AssetInvoiceManager)
│   └── SubscriptionAttachmentManager.tsx (NEW - 普通附件管理)
├── i18n/locales/
│   ├── en.json                       (MODIFY - 新增 ~70 keys)
│   └── zh.json                       (MODIFY - 新增 ~70 keys)
├── components/
│   ├── Sidebar.tsx                   (MODIFY - 新增导航项)
│   └── DashboardPage.tsx             (MODIFY - 新增订阅统计卡片)
└── App.tsx                           (MODIFY - 新增路由)
```

---

## 五、i18n 新增 Key 清单

### 导航

```
nav.subscriptions  →  en: "Subscriptions"  zh: "订阅管理"
```

### 订阅页面

```
subscriptions.title
subscriptions.create
subscriptions.edit
subscriptions.delete
subscriptions.noSubscriptions
subscriptions.searchPlaceholder
subscriptions.addRecord

subscriptions.table.name
subscriptions.table.platform
subscriptions.table.type
subscriptions.table.status
subscriptions.table.latestRecord
subscriptions.table.endDate
subscriptions.table.actions

subscriptions.filters.allTypes
subscriptions.filters.allStatuses
subscriptions.filters.allPlatforms

subscriptions.status.active
subscriptions.status.inactive
subscriptions.status.cancelled

subscriptions.types.payAsYouGo
subscriptions.types.periodic

subscriptions.billingModes.prepaid
subscriptions.billingModes.postpaid

subscriptions.billingCycles.monthly
subscriptions.billingCycles.quarterly
subscriptions.billingCycles.yearly
subscriptions.billingCycles.custom
subscriptions.billingCycles.daysUnit
```

### 订阅表单

```
subscriptions.form.name
subscriptions.form.nameRequired
subscriptions.form.description
subscriptions.form.platform
subscriptions.form.subscriptionType
subscriptions.form.billingMode
subscriptions.form.billingCycle
subscriptions.form.price
subscriptions.form.currency
subscriptions.form.status
subscriptions.form.renewNoticeDays
subscriptions.form.note
```

### 订阅详情

```
subscriptions.detail.title
subscriptions.detail.records
subscriptions.detail.noRecords
subscriptions.detail.renewalInfo
```

### 订阅记录

```
subscriptions.records.title
subscriptions.records.add
subscriptions.records.edit
subscriptions.records.delete
subscriptions.records.date
subscriptions.records.amount
subscriptions.records.paymentMethod
subscriptions.records.startDate
subscriptions.records.endDate
subscriptions.records.quantity
subscriptions.records.note

subscriptions.invoices.bind
subscriptions.invoices.unbind
subscriptions.invoices.uploadNew

subscriptions.attachments.upload
subscriptions.attachments.delete

subscriptions.errors.hasRecords
subscriptions.errors.cannotDelete

platforms.title
platforms.name
platforms.logo
platforms.website
platforms.create
platforms.edit
platforms.delete

paymentMethods.title
paymentMethods.name
paymentMethods.logo
paymentMethods.create
paymentMethods.edit
paymentMethods.delete
```

### 通知类型

```
notifications.types.subscriptionRenewal  →  en: "Subscription Renewal"  zh: "续费提醒"
```

### Dashboard

```
dashboard.activeSubscriptions  →  en: "Active Subscriptions"  zh: "活跃订阅"
dashboard.monthlySpending  →  en: "Monthly Spending"  zh: "本月订阅支出"
dashboard.upcomingRenewals  →  en: "Upcoming Renewals"  zh: "即将到期"
```

### 通用

```
common.confirmDelete  →  (可能已存在)
```

---

## 六、待讨论 / 待决策事项

以下问题需要在开发前确认：

| # | 问题 | 选项 | 回答 |
|---|------|------|
| 1 | 订阅数据是否需要按用户隔离？当前系统所有数据为全局共享（只有一个家庭/团队使用）。 | A: 保持全局（与现有模式一致） B: 支持多用户隔离 | A |
| 2 | Dashboard 是否需要在本次迭代中加入订阅统计卡片？ | A: 本次加入 B: 后续版本 | A |
| 3 | 按量付费-预付费的"余额不足"提醒如何处理？系统无法自动获取第三方平台余额。 | A: 每笔记录设置"余量阈值"，由用户手动标记 B: 按固定周期（如每月）提醒检查 | 按量付费不提醒 |
| 4 | 订阅记录是否需要关联发票/附件（截图、PDF账单）？ | A: 需要，使用现有 FileRecord 关联 B: 暂时不需要，备注文字描述即可 | A |
| 5 | 订阅图标如何存储？ | A: 上传图片（存 FileRecord） B: 输入 URL C: 预设 emoji/图标选择 | A |
| 6 | 是否需要数据统计图表（月度支出趋势、分类占比等）？ | A: 需要图表 B: 不需要，列表即可 | B |
| 7 | 删除订阅时是否级联删除关联记录？ | A: 级联删除 B: 禁止删除有记录的订阅 | B |

---

## 七、实施计划预估

**实施原则**：

- **按步骤 commit**：每完成一个关键步骤（如下所列）即进行一次 commit，不在所有步骤完成后统一提交
- **复用优先**：尽可能复用已有组件和代码，降低重复率。若某组件/方法原为特定功能专用但确可复用，允许进行抽象、改造、重命名等操作使其成为通用组件或公共方法

按模块拆分为以下步骤（每个步骤一个 commit）：

1. **后端 — 枚举与实体**：3 个枚举 + 6 个实体（Subscription、SubscriptionRecord、Attachment、Invoice、Platform、PaymentMethod）
2. **后端 — Repository 与 Service**：6 个 Repository + 5 个 Service（Subscription、Record+附件+发票、Platform、PaymentMethod）
3. **后端 — Controller 与 DTO**：4 个 Controller + Request/Response DTO
4. **后端 — 通知集成**：NotificationType 扩展 + SubscriptionScheduler（仅包年包月）+ SystemConfig
5. **后端 — Dashboard 集成**：DashboardService 追加订阅统计字段
6. **前端 — API 层**：API 模块 + React Query hooks（subscriptions、records、platforms、paymentMethods）
7. **前端 — 页面与组件**：SubscriptionsPage + DetailDrawer + SubscriptionDialog + SubscriptionRecordDialog（含附件管理 + 发票关联）
8. **前端 — 路由/导航/Dashboard**：路由注册 + 侧边栏 + Dashboard 订阅卡片 + i18n
9. **现有系统修改**：ES 搜索集成 + 发票绑定实体扩展（详见第八节）
10. **文档更新**：README.md / CLAUDE.md / server docs 更新

---

## 八、现有系统修改

### 8.1 ES 全文搜索集成

当附件/发票关联到订阅记录时，搜索结果需能跳转到订阅管理。

#### 后端

**SearchService.buildSourceMap()** 新增查询：

```
SubscriptionRecordAttachment → SubscriptionRecord → Subscription
  → SourceInfo(SUBSCRIPTION, "订阅", subscriptionId, subscriptionName)
```

| 修改文件 | 变更 |
|---------|------|
| `SourceType.java` | 新增 `SUBSCRIPTION` |
| `SearchService.java` | `buildSourceMap()` 增加 `SubscriptionRecordAttachmentRepository` 查询，解析出 `SourceInfo(SUBSCRIPTION, ... )` |
| `SubscriptionRecordAttachmentRepository.java` | 新增 `findByFileIdIn(List<Long>)` 批量查询方法 |

#### 前端

| 修改文件 | 变更 |
|---------|------|
| `SearchDialog.tsx` | `handleNavigate()` 新增 `SUBSCRIPTION` case：`navigate("/subscriptions?subscriptionId={sourceId}")` |
| `SearchDialog.tsx` | `getTags()` 过滤中保留 `SUBSCRIPTION` 类型，显示 badge |
| `SubscriptionsPage.tsx` | 新增 `useEffect` 读取 URL query param `?subscriptionId=X`，打开对应 DetailDrawer |
| `search.ts` (API) | `SourceInfo.type` 类型联合新增 `"SUBSCRIPTION"` |
| `en.json / zh.json` | 新增 `search.tags.subscription` → en: "Subscription" / zh: "订阅" |

### 8.2 发票绑定实体扩展

发票通过 `SubscriptionRecordInvoice` 关联到订阅记录，需在发票列表和详情中展示这些关联。

#### 后端

**新增 Response DTO**：

```java
// BoundSubscriptionResponse — 发票关联的订阅信息
public class BoundSubscriptionResponse {
    Long id;              // SubscriptionRecordInvoice.id
    Long subscriptionId;
    String subscriptionName;
    Long platformId;
    String platformName;
    String platformLogoUrl;  // Platform.logoFileId 的 OSS URL
}
```

**InvoiceResponse / InvoiceDetailResponse** 新增字段：

```java
List<BoundSubscriptionResponse> subscriptions = new ArrayList<>();
```

| 修改文件 | 变更 |
|---------|------|
| `InvoiceResponse.java` | 新增 `subscriptions` 字段 (`List<BoundSubscriptionResponse>`) |
| `InvoiceDetailResponse.java` | 新增 `subscriptions` 字段 |
| `BoundSubscriptionResponse.java` | **NEW** — 参照 BoundAssetResponse 模式 |
| `InvoiceService.java` (getInvoices) | 批量查询 `subscriptionRecordInvoiceRepository.findByInvoiceIdIn()`，分组后 setSubscriptions |
| `InvoiceService.java` (getInvoiceById) | 查询 `subscriptionRecordInvoiceRepository.findByInvoiceId()`，传入 detail response |
| `SubscriptionRecordInvoiceRepository.java` | 新增 `findByInvoiceId(Long)` 和 `findByInvoiceIdIn(List<Long>)` |

**存储库新增查询**：

```java
// SubscriptionRecordInvoiceRepository
List<SubscriptionRecordInvoice> findByInvoiceId(Long invoiceId);
List<SubscriptionRecordInvoice> findByInvoiceIdIn(List<Long> invoiceIds);
```

#### 前端

**列显示**（InvoicesPage 表格列）：

当前列只显示第一个 asset。修改后合并 `assets` 和 `subscriptions`：
- 取 `[...assets, ...subscriptions]` 的第一个元素
- asset 显示：图片 + name
- subscription 显示：平台 logo + subscriptionName
- 总数 = `assets.length + subscriptions.length`
- 溢出显示 "+N"

**详情显示**（InvoiceDetailDrawer）：

拆分为两个子区域：

| 区域 | 标题 i18n | 内容 |
|------|----------|------|
| 关联资产 | `invoices.detail.boundAssets` | 现有 asset 列表（不变） |
| 关联订阅 | `invoices.detail.boundSubscriptions` | 订阅列表（平台 logo + 订阅名），点击跳转到对应订阅详情 |

**导航**：点击关联订阅项 → `navigate("/subscriptions?subscriptionId={id}")`

#### 重命名

| 原 i18n Key | 原值 (en/zh) | 新 Key | 新值 (en/zh) |
|------------|-------------|--------|-------------|
| `invoices.columns.boundAssets` | Assets / 绑定资产 | — | Associations / 关联 |
| `invoices.detail.boundAssets` | Bound Assets / 关联资产 | — | Bound Assets / 关联资产 |
| *(新增)* | — | `invoices.detail.boundSubscriptions` | Bound Subscriptions / 关联订阅 |

**注意**：列标题 `invoices.columns.boundAssets` 保持原 key 不变，仅修改其对应的 en/zh 翻译值，避免破坏现有代码引用。详情中的资产子区域标题也保持不变。新增 `boundSubscriptions` 用于订阅子区域标题。

#### i18n 新增 Key

```
search.tags.subscription  →  en: "Subscription"  zh: "订阅"
invoices.detail.boundSubscriptions  →  en: "Bound Subscriptions"  zh: "关联订阅"
```

---

*文档状态：已定稿。所有决策事项已确认，待开始实现。*
