# Content Studio intelligence and media generation

Content Studio keeps marketing intelligence separate from rendering: the existing Gemini-backed intelligence services create the Content Item and Creative Brief, then the Content Studio provider layer sends only approved visual direction to Hugging Face.

Set `GEMINI_API_KEY` for intelligence and `HUGGINGFACE_API_KEY` for media in `backend/.env`; both are backend-only. Set `HUGGINGFACE_IMAGE_MODEL` to an image-capable model and use `HUGGINGFACE_VIDEO_MODEL=Wan-AI/Wan2.1-T2V-1.3B` for video. `MEDIA_IMAGE_PROVIDER` and `MEDIA_VIDEO_PROVIDER` default to Hugging Face when its key exists. There is no automatic fallback to mock assets; mocks require explicit test configuration.

The official `@huggingface/inference` SDK returns binary media. Wan's text-to-video request supports prompt, negative prompt, frames, inference steps, guidance, and seed; it does not promise arbitrary output dimensions, FPS, or duration. The current adapter generates one coherent clip from the existing storyboard. A later assembly layer can concatenate per-scene clips if needed.

Image and video bytes are stored through `FileStorageService`. The Hugging Face SDK retries transient loading responses while the backend enforces a finite timeout; only a returned, stored binary asset completes a GenerationJob. The browser polls only the authenticated `GET /api/content-studio/jobs/:jobId` route.

For local development, `STORAGE_PROVIDER=local` stores files in `uploads/` and serves them from the backend at `http://localhost:5000/uploads/...`. Set `STORAGE_PUBLIC_BASE_URL` when the backend is hosted elsewhere. Replace the storage provider with durable object storage for production/multi-instance deployments.

Hugging Face generation can take minutes and is subject to provider availability and account entitlements. Missing configuration returns `MEDIA_PROVIDER_NOT_CONFIGURED`; no scene manifest is represented as a video asset. `GET /api/content-studio/providers` reports safe configuration status without revealing keys.
