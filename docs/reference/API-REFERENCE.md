# API Reference

API endpoints, authentication, and usage for SIAM.

## Health Endpoint

**GET** `/api/health`

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-10-26T12:00:00Z",
  "version": "0.13.6"
}
```

## Chat Endpoint

**POST** `/api/chat`

**Headers**:

```
Content-Type: application/json
```

**Request**:

```json
{
  "messages": [...],
  "model": "gpt-4o-mini"
}
```

---

_For quick reference, see [QUICK-START.md](../QUICK-START.md)_
