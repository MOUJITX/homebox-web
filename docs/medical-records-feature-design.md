# 病历管理功能设计

状态：已实现 (v0.5.0)。

## 数据模型

```
MedicalInstitution (医疗机构)
  ├── id, name, note?

VisitRecord (就诊记录) — 主记录
  ├── patientName (就诊人姓名)
  ├── patientAge? (年龄)
  ├── patientGender: Gender (枚举 MALE / FEMALE)
  ├── visitType: VisitType (OUTPATIENT / INPATIENT)
  ├── visitDate (就诊日期/入院日期 — 前端根据 visitType 切换标签)
  ├── institution → MedicalInstitution
  ├── medicalContent (病历内容, LONG TEXT)
  ├── doctor (医生, 简单文本)
  ├── department (就诊科室/入院科室 — 前端根据 visitType 切换标签)
  ├── dischargeDate? (出院时间, 仅住院)
  ├── dischargeDept? (出院科室, 仅住院)
  ├── hospitalizationDays (计算字段 = dischargeDate - visitDate, 列表不显示)
  ├── attachments[] → VisitAttachment (含就诊级别 + 各子记录附件, 通过 sourceType 区分)
  ├── invoices[] → VisitInvoice (含就诊级别 + 各子记录发票, 通过 sourceType 区分)
  │
  ├── VisitExamination (检查)
  │     ├── name, examDate?, description
  │
  ├── VisitLabTest (检验)
  │     ├── name, testDate?, description
  │
  └── VisitPrescription (处方)
        ├── description? (处方备注, 处方级别)
        └── PrescriptionItem[]
              ├── medicationReminder → MedicationReminder (必选)
              └── note? (药品行级备注)

VisitAttachment (附件关联, 统一表)
  ├── visit → VisitRecord
  ├── file → FileRecord
  ├── sourceType: RECORD | EXAMINATION | LAB_TEST | PRESCRIPTION
  └── sourceId (子记录 id；sourceType=RECORD 时与 visit 相同)

VisitInvoice (发票关联, 统一表)
  ├── visit → VisitRecord
  ├── invoice → Invoice
  ├── sourceType: RECORD | EXAMINATION | LAB_TEST | PRESCRIPTION
  └── sourceId
```

## 关键设计决策

| 决策 | 方案 |
|------|------|
| 就诊日期/科室 | 字段统一：`visitDate` / `department`。门诊标签为"就诊日期/就诊科室"，住院标签为"入院日期/入院科室" |
| 就诊人信息 | 姓名(必填) + 年龄 + 性别(枚举 MALE/FEMALE)，内联字段，不关联 Member |
| 处方药品 | 绑定已有 MedicationReminder 或从处方侧创建新的 MedicationReminder |
| 附件/发票表设计 | 统一表 + sourceType 字段区分来源（RECORD / EXAMINATION / LAB_TEST / PRESCRIPTION），避免为每种子记录建独立关联表 |
| 子记录工作流 | 先保存就诊记录 → 进入详情页 → 逐个添加检查/检验/处方 |
| 子记录详情展示 | VisitDetailDrawer 中按检查/检验/处方分块显示（参考 SubscriptionDetailDrawer 的记录列表模式） |
| 子记录编辑/删除 | 支持编辑和删除。删除时发票仅解除绑定（不删发票），附件级联删除（若附件被其他地方引用则仅解除绑定） |
| 处方中 MedicationReminder 绑定 | 允许绑定已过期或已禁用的提醒（仅作为历史记录关联，不参与通知） |
| 就诊删除 | 存在子记录时禁止删除；不存在子记录时可删除，发票/附件处理同上 |
| 发票绑定 | 从就诊/子记录侧选择已有发票或新增发票。发票列表/详情页需显示被绑定的就诊记录（参考资产或订阅在发票中的关联方式）。需要对现有发票组件做相应改动 |
| 医疗机构 | 独立 CRUD 管理，就诊时必选 |
| 医生信息 | 简单文本字段 |
| 检验/检查 | 文字描述 + 附件，暂不做结构化 |
| 字段必填规则 | 遵循现有模块惯例：核心字段（就诊人、就诊日期、机构）必填；描述性字段（病历内容、医生、备注）可选；住院时出院日期/科室可选（允许未出院状态） |
| 住院未出院 | dischargeDate 为空时，列表显示 `入院日期 ~ 住院中`；详情页出院科室留空 |
| 住院天数 | 计算字段 = dischargeDate - visitDate（仅当 dischargeDate 非空），列表不显示 |
| 列表页 | 列：就诊人(次行性别年龄)、科室(门诊: 第1行就诊科室, 第2行机构名 / 住院: 第1行 入院科室/出院科室, 第2行机构名)、就诊时间(门诊: visitDate / 住院: 入院日期~出院日期 或 入院日期~住院中)、医生。按 visitDate 倒序。筛选：就诊类型、日期范围、机构、就诊人(列表已有就诊人) |
| 就诊人搜索 | 从已有就诊记录中列出不重复的就诊人姓名供选择 |
| 权限 | 所有登录用户 |
| API 结构 | 子记录嵌套路由：`/api/visit-records/{id}/examinations` 等，与现有 goods/items、assets/pictures 等一致 |
| 发票类型自动匹配 | 绑定/创建发票时复用现有发票模块逻辑：上传可识别文件自动识别类型，否则用户手动选择 |
| 医疗机构权限 | 所有用户可管理（与 Platform 一致） |
| 全文搜索 | 暂不纳入 |
| PrescriptionItem 管理 | 独立嵌套端点 `/api/visit-records/{vid}/prescriptions/{pid}/items`（参考 GoodItem 模式） |
| AI 文本解析 | 粘贴文本（如挂号单、病历摘要）到对话框，AI 解析填充就诊字段。复用现有 AI 配置（apiUrl/apiKey/model），独立提示词 |

## AI 文本解析

创建/编辑就诊记录时，通过快捷按钮打开粘贴对话框，用户粘贴非结构化文本（挂号单截图文字、病历摘要等），AI 解析后自动填充就诊记录字段。

### 解析流程

```
用户在 CreateVisitDialog 点击"粘贴解析"按钮
    |
    v
PasteVisitTextDialog 打开（Textarea 输入）
    |
    v
parseVisitRecord(text) -- POST /api/visit-records/parse
    |
    v
AiService.extractVisitRecordInfo(text)
    |-- 读取 system_config: ai.visit-record-prompt
    |-- (prompt 未配置 → 使用内置默认提示词)
    |-- 复用 ai.models / ai.active-model 选择模型和连接信息
    |-- POST {apiUrl}/chat/completions (temperature: 0.1)
    |-- 解析 JSON → VisitRecordParseResponse
    |
    v
CreateVisitDialog.applyParseResult(data) -- 填充表单字段
```

### 解析目标字段

AI 从文本中提取以下字段（均为可选，无法识别则留空）：

| 字段 | 说明 |
|------|------|
| patientName | 就诊人姓名 |
| patientAge | 年龄 |
| patientGender | 性别 (MALE / FEMALE) |
| visitType | OUTPATIENT / INPATIENT |
| visitDate | 就诊日期（门诊）/ 入院日期（住院） |
| medicalContent | 病历内容摘要 |
| doctor | 医生 |
| department | 就诊科室（门诊）/ 入院科室（住院） |
| dischargeDate | 出院时间（仅住院） |
| dischargeDept | 出院科室（仅住院） |

### 系统配置变更

| 配置键 | 默认值 | 说明 |
|--------|--------|------|
| `ai.visit-record-prompt` | `""` (空) | 就诊记录解析提示词；为空时使用内置默认提示词 |

现有 `ai.models` / `ai.active-model` 不变，AI 连接配置（apiUrl/apiKey/model）直接复用。

### AI 设置 UI 调整

SettingsPage 的 AI 配置卡片新增一个输入框用于 `ai.visit-record-prompt`，与现有的 `ai.system-prompt`（发票解析用）并列。

## 前后端文件清单

### 后端 (Spring Boot)
- `entity/MedicalInstitution.java`
- `entity/VisitRecord.java`
- `entity/VisitExamination.java`
- `entity/VisitLabTest.java`
- `entity/VisitPrescription.java`
- `entity/PrescriptionItem.java`
- `entity/VisitAttachment.java` — 附件关联统一表（sourceType + sourceId 区分来源）
- `entity/VisitInvoice.java` — 发票关联统一表（sourceType + sourceId 区分来源）
- `repository/` — 对应 repository
- `service/` — 对应 service (含发票子记录汇总逻辑)
- `controller/MedicalInstitutionController.java`
- `controller/VisitRecordController.java`
- `controller/VisitExaminationController.java`
- `controller/VisitLabTestController.java`
- `controller/VisitPrescriptionController.java`
- `controller/PrescriptionItemController.java`
- `dto/request/` & `dto/response/` — 请求/响应 DTO
- `dto/response/VisitRecordParseResponse.java` — AI 解析就诊记录响应 DTO
- `enums/VisitType.java` — OUTPATIENT, INPATIENT
- `enums/Gender.java` — MALE, FEMALE
- `service/AiService.java` — 新增 `extractVisitRecordInfo(text)` 方法
- 数据库：`medical_institutions`, `visit_records`, `visit_examinations`, `visit_lab_tests`, `visit_prescriptions`, `prescription_items`, `visit_attachments`, `visit_invoices`（共 8 张新表）

### 前端 (React)
- `src/api/medical.ts` — 就诊/检查/检验/处方 API
- `src/api/institutions.ts` — 医疗机构 API
- `src/pages/MedicalRecordsPage.tsx` — 列表页
- `src/components/medical/`:
  - `CreateVisitDialog.tsx` — 创建/编辑就诊（含"粘贴解析"快捷按钮）
  - `PasteVisitTextDialog.tsx` — 粘贴文本，AI 解析后填充就诊字段
  - `VisitDetailDrawer.tsx` — 就诊详情（含子记录列表、汇总发票、附件管理）
  - `CreateExaminationDialog.tsx` — 检查（含附件上传、发票绑定）
  - `CreateLabTestDialog.tsx` — 检验（含附件上传、发票绑定）
  - `CreatePrescriptionDialog.tsx` — 处方（含附件上传、发票绑定）
  - `EditPrescriptionDialog.tsx` — 编辑处方
  - `CreatePrescriptionItemDialog.tsx` — 处方药品行（选择/创建 MedicationReminder）
  - `InstitutionManagerDialog.tsx` — 医疗机构管理
  - `BindVisitInvoiceDialog.tsx` — 通用发票绑定对话框（复用就诊/子记录）
  - 各 Edit / Delete 对话框
- `src/hooks/queries/medicalKeys.ts` — TanStack Query keys
- 路由：`/medical-records`
- 侧边栏新增入口
- i18n: en.json + zh.json

## 关联现有系统
- **Goods** — 处方不再直接引用 Goods，改为引用 MedicationReminder
- **MedicationReminder** — 处方药品绑定（支持选择已有或创建新提醒）
- **Invoice** — 已支持 MEDICAL_OUTPATIENT / MEDICAL_INPATIENT 类型；需在发票列表/详情页增加就诊记录关联显示
- **FileRecord / 附件** — 复用现有文件基础设施

## 需修改的现有文件

### 前端
- `src/pages/InvoicesPage.tsx` — 列表增加就诊记录关联列
- `src/components/invoices/InvoiceDetailDrawer.tsx` — 详情增加绑定的就诊记录显示
- `src/pages/SettingsPage.tsx` — AI 配置卡片新增 `ai.visit-record-prompt` 输入框
- `src/components/Sidebar.tsx` — 侧边栏新增"病历管理"入口
- `src/App.tsx` — 新增 `/medical-records` 路由

### 后端
- `service/AiService.java` — 新增 `extractVisitRecordInfo(text)` 方法
- `initializer/DataInitializer.java` — 新增 `ai.visit-record-prompt` 默认配置项
