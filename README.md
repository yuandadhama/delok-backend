# What is Delok?

> Delok is an observability platform that helps developers collect, store, and investigate application logs from multiple projects in a single place.

---

## How does it work?

> Every application that needs to be monitored installs the Delok SDK.

The SDK is responsible for collecting events defined by developers, such as:

* `payment_completed`
* `payment_failed`
* `user_login`

The SDK then sends these events to the Ingestion API using the project's API Key.

## What does the Ingestion API do?

> The Ingestion API validates the API Key, identifies the target project, and normalizes incoming data so that all logs follow a consistent structure.

For example, every log will contain:

* `timestamp`
* `level`
* `environment`
* `event`

even if the developer only provides part of the required information.

---

## What happens next?

> The logs are stored and made available for searching, filtering, and visualization through the Delok dashboard.

---

## Why is it designed this way?

> A consistent log structure enables efficient searching, filtering, aggregation, and future AI-powered analysis.
> 

---


# Apa itu Delok?

> Delok adalah platform observability yang membantu developer mengumpulkan, menyimpan, dan menginvestigasi log aplikasi dari berbagai project dalam satu tempat.
> 

---

## Bagaimana cara kerjanya?

> Setiap aplikasi yang ingin dipantau menginstal Delok SDK.
> 

SDK bertugas mengumpulkan event yang dibuat developer, misalnya:

- payment_completed
- payment_failed
- user_login

SDK mengirim event tersebut ke Ingestion API menggunakan API Key milik Project.

## Apa yang dilakukan Ingestion API?

> Ingestion API memvalidasi API Key, mengetahui Project tujuan, lalu melakukan normalisasi agar semua log memiliki struktur yang konsisten.
> 

Misalnya semua log memiliki:

- timestamp
- level
- environment
- event

meskipun developer hanya mengirim sebagian datanya.

---

## Setelah itu?

> Log disimpan sehingga dapat dicari, difilter, dan divisualisasikan melalui dashboard Delok.
> 

---

## Mengapa dibuat seperti ini?

> Karena struktur log yang konsisten memungkinkan pencarian, filtering, agregasi, hingga analisis AI di masa depan.
>
