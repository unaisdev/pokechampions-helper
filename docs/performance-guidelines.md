# Performance guidelines

## Images

- Keep capture quality reasonable (`quality` in `takePicture`); avoid loading huge bitmaps into JS unnecessarily.

## Network

- Never fan out uncached PokéAPI calls for many candidates; resolve OCR candidates sequentially or cap requests.
- Rely on repository cache for repeat lookups.

## UI

- Show loading states during network and future inference; avoid blocking the JS thread with heavy synchronous work.

## Native / ML (future)

- Run inference off the UI thread where the ML SDK allows; measure cold start and frame time on low-end devices.
