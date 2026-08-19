# Delok

**Delok** is an observability platform that helps developers collect, store, search, and investigate application logs from multiple projects in a single place.

Delok ships a lightweight SDK for sending structured events to a centralized backend, so you can understand what your application is doing without building a logging pipeline from scratch.

> **Status:** Delok is under active development. The frontend and backend are not yet deployed (frontend hardening in progress), and the SDK — while feature-complete — has not been published yet. It will be published once the frontend and backend are ready together.

---

## Table of Contents

- [Why Delok](#why-delok)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Sending Structured Events](#sending-structured-events)
- [Log Levels](#log-levels)
- [How It Works](#how-it-works)
  - [1. Ingestion API](#1-ingestion-api)
  - [2. Event Normalization](#2-event-normalization)
  - [3. Reliable Delivery](#3-reliable-delivery)
  - [4. Realtime Dashboard](#4-realtime-dashboard)
- [License](#license)

---

## Why Delok

Instead of scattering `console.log` calls or ad-hoc log strings across your codebase, Delok encourages sending **structured events** — consistent, queryable, and easy to correlate across services and environments.

- **Drop-in SDK** — a few lines of setup, no infrastructure to run
- **Structured by design** — every event follows the same schema
- **Realtime** — logs reach your dashboard the moment they're stored
- **Project-scoped** — API keys and dashboards are isolated per project

## Architecture

```
Developer Application
        │
        ▼
     Delok SDK
        │
        ▼
 HTTP Ingestion API
        │
        ▼
 API Key Validation
        │
        ▼
 Event Normalization
        │
        ▼
  PostgreSQL Storage
        │
        ▼
  Realtime Service
        │
        ▼
  Delok Dashboard
```

Every event follows the same path: the SDK sends it to the Ingestion API, the API validates and normalizes it, PostgreSQL persists it, and the Realtime Service pushes it to any dashboard subscribed to that project.

## Getting Started

> ⚠️ The SDK is feature-complete but **not published yet**. It will be released once the frontend and backend are deployed. The usage below reflects the intended API once it's published.

Once published, you'll install the SDK in any application you want to monitor:

```bash
npm install delok
```

Initialize it with your project's API key:

```js
import { Delok } from "delok";

const delok = new Delok({
  apiKey: "...",
  environment: "production",
});
```

That's it — your application can now send events.

## Sending Structured Events

Rather than logging arbitrary strings, send structured events with a clear name, message, and payload:

```js
await delok.info({
  event: "user_login",
  message: "User successfully logged in",
  payload: {
    userId: "123",
  },
});
```

Some common event examples:

| Event | Description |
|---|---|
| `user_login` | A user successfully authenticated |
| `payment_completed` | A payment was processed successfully |
| `payment_failed` | A payment attempt failed |
| `email_verification_sent` | A verification email was dispatched |

This consistent structure makes logs easy to search, filter, and analyze later — instead of parsing free-text strings.

## Log Levels

Every event is categorized using one of Delok's built-in log levels:

| Level | Use case |
|---|---|
| `info` | Normal application activity worth recording |
| `warn` | Something unexpected but non-critical |
| `error` | An operation failed and needs attention |
| `fatal` | A critical failure affecting application stability |

## How It Works

### 1. Ingestion API

The SDK sends every event to the Delok Ingestion API along with the project's API key. The backend is responsible for:

- Validating the API key
- Identifying the target project
- Validating incoming data
- Normalizing the event
- Storing the log

The SDK intentionally contains no business logic — its only job is delivering events reliably.

### 2. Event Normalization

Before a log is stored, Delok transforms it into a standardized format. The backend automatically enriches every incoming event with metadata such as:

- Log ID
- Project ID
- Environment
- Timestamp
- Normalized log structure

This guarantees every log follows the same schema, regardless of how or where it was generated.

### 3. Reliable Delivery

The SDK is designed to stay lightweight while handling common network issues automatically:

- Request timeouts
- Automatic retry on transient failures
- Internal error handling
- Defensive network communication

These mechanisms reduce the chance of losing logs to temporary network failures, without blocking or slowing down your application.

### 4. Realtime Dashboard

Once a log is stored, Delok immediately pushes it to subscribed dashboards over WebSocket. Each dashboard only subscribes to its own project, so logs are only ever visible to authorized viewers — letting you watch application activity live, with no manual refreshing.

## License

This project is licensed under the [MIT License](./LICENSE).
