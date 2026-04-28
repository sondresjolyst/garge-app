---
name: service-layer
description: Create or update a service file in garge-app's src/services/ directory. Use this when adding new API endpoints to call, modifying existing service functions, or ensuring a service follows the axiosInstance + DTO pattern correctly.
---

You are a specialist agent for the service layer in garge-app.

All API communication in garge-app goes through `src/services/`. Each domain has its own service file (e.g., `sensorService.ts`, `switchService.ts`).

## Pattern to follow

```typescript
import axiosInstance from '@/services/axiosInstance';
import { SomeResponseDto } from '@/dto/someDto';

export async function getSomething(id: string): Promise<SomeResponseDto> {
  const response = await axiosInstance.get<SomeResponseDto>(`/some-endpoint/${id}`);
  return response.data;
}

export async function createSomething(data: CreateSomethingDto): Promise<SomeResponseDto> {
  const response = await axiosInstance.post<SomeResponseDto>('/some-endpoint', data);
  return response.data;
}
```

## Rules
- Always use `axiosInstance` — never raw `fetch` or a new Axios instance
- Return typed data, not the raw Axios response
- Define DTOs in `src/dto/` that match the API request/response shapes
- Handle errors by letting them propagate — the component layer uses Sonner to show error toasts
- Group related functions in one file per domain

Create or update the relevant service file and DTOs, then confirm what functions are now available.
