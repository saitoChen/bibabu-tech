# API 接口文档

## 基础信息

- **Base URL**: `http://localhost:3000`
- **Content-Type**: `application/json`

---

## 密钥认证接口

### 1. 获取当前密钥

获取当前有效的访问密钥。如果密钥已过期，会自动生成新密钥。

- **URL**: `/api/key`
- **Method**: `GET`
- **Auth Required**: No

#### Success Response

- **Code**: 200 OK
- **Content Example**:

```json
{
  "key": "a1b2c3d4e5f6789012345678...",
  "createdAt": "2026-05-27T12:00:00.000Z",
  "expiresAt": "2026-05-27T12:03:00.000Z"
}
```

#### Error Response

- **Code**: 500 Internal Server Error
- **Content**:

```json
{
  "error": "Failed to get key"
}
```

---

### 2. 刷新密钥

强制生成新的访问密钥。旧密钥在缓冲期内仍然有效。

- **URL**: `/api/key/refresh`
- **Method**: `POST`
- **Auth Required**: No

#### Success Response

- **Code**: 200 OK
- **Content Example**:

```json
{
  "key": "f9e8d7c6b5a4123456789012...",
  "createdAt": "2026-05-27T12:01:30.000Z",
  "expiresAt": "2026-05-27T12:04:30.000Z"
}
```

#### Error Response

- **Code**: 500 Internal Server Error
- **Content**:

```json
{
  "error": "Failed to refresh key"
}
```

---

### 3. 验证密钥

验证密钥是否有效。

- **URL**: `/api/auth/validate`
- **Method**: `POST`
- **Auth Required**: No

#### Request Body

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| key       | string | Yes      | 访问密钥    |

#### Request Example

```json
{
  "key": "a1b2c3d4e5f6789012345678..."
}
```

#### Success Response

- **Code**: 200 OK
- **Content Example**:

```json
{
  "valid": true,
  "expiresAt": "2026-05-27T12:03:00.000Z"
}
```

#### Error Response

- **Code**: 400 Bad Request
- **Content**:

```json
{
  "valid": false,
  "error": "Key is required"
}
```

- **Code**: 200 OK (验证失败)
- **Content**:

```json
{
  "valid": false,
  "error": "Invalid or expired key"
}
```

---

## 数据存储接口

### 4. 获取存储的 Excel 数据

获取服务器上存储的 Excel 数据。

- **URL**: `/api/data`
- **Method**: `GET`
- **Auth Required**: No

#### Success Response

- **Code**: 200 OK
- **Content Example**:

```json
{
  "data": {
    "data": [
      ["2026/05/19", "2026/05/18", "2026/05/15"],
      ["大盘低开震荡高走", "大盘平开震荡一整天", "大盘多空双杀"]
    ],
    "headers": ["2026/05/19", "2026/05/18", "2026/05/15"],
    "fileName": "日报.xlsx"
  }
}
```

#### Error Response

- **Code**: 500 Internal Server Error
- **Content**:

```json
{
  "error": "Failed to read data"
}
```

---

### 5. 保存 Excel 数据

将 Excel 数据保存到服务器。

- **URL**: `/api/data`
- **Method**: `POST`
- **Auth Required**: No
- **Content-Type**: `application/json`

#### Request Body

| Parameter | Type   | Required | Description         |
| --------- | ------ | -------- | ------------------- |
| data      | object | Yes      | Excel 数据对象      |
| fileName  | string | Yes      | 文件名              |
| uploadedAt| string | Yes      | 上传时间 (ISO 格式) |

#### Request Example

```json
{
  "data": {
    "data": [
      ["2026/05/19", "2026/05/18"],
      ["内容1", "内容2"]
    ],
    "headers": ["2026/05/19", "2026/05/18"],
    "fileName": "日报.xlsx"
  },
  "fileName": "日报.xlsx",
  "uploadedAt": "2026-05-27T12:00:00.000Z"
}
```

#### Success Response

- **Code**: 200 OK
- **Content**:

```json
{
  "success": true
}
```

#### Error Response

- **Code**: 500 Internal Server Error
- **Content**:

```json
{
  "error": "Failed to save data"
}
```

---

## 页面路由

### 公开路由

| 路由      | 描述           | 需要认证 |
| --------- | -------------- | -------- |
| `/login`  | 密钥登录页面   | No       |

### 受保护路由

| 路由      | 描述           | 需要认证 |
| --------- | -------------- | -------- |
| `/`       | Excel 上传页面 | Yes      |
| `/daily`  | 日报内容展示页 | Yes      |

---

## 密钥更新配置

密钥更新周期可在 `src/lib/keyAuth.ts` 中配置：

```typescript
// 调试阶段：3分钟
export const KEY_UPDATE_INTERVAL = 3 * 60 * 1000;

// 生产环境：30天（每月1号更新）
// export const KEY_UPDATE_INTERVAL = 30 * 24 * 60 * 60 * 1000;
```

---

## Postman 使用示例

### 1. 获取密钥

```bash
curl http://localhost:3000/api/key
```

### 2. 刷新密钥

```bash
curl -X POST http://localhost:3000/api/key/refresh
```

### 3. 验证密钥

```bash
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"key": "your-key-here"}'
```

### 4. 获取数据

```bash
curl http://localhost:3000/api/data
```

### 5. 保存数据

```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "data": [["2026/05/19", "内容"]],
      "headers": ["2026/05/19"],
      "fileName": "test.xlsx"
    },
    "fileName": "test.xlsx",
    "uploadedAt": "2026-05-27T12:00:00.000Z"
  }'
```

---

## 认证流程

1. 通过 Postman 调用 `GET /api/key` 获取密钥
2. 访问页面时会自动跳转到 `/login`
3. 在登录页面输入密钥
4. 密钥验证通过后保存在 `localStorage`
5. 后续访问自动校验密钥是否过期
6. 密钥过期后自动跳回登录页面
