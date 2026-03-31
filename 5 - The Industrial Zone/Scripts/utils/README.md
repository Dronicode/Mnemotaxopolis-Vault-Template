# Shared Utility Design

This folder contains shared JavaScript utilities used by multiple Obsidian script contexts.

## Goal

Keep reusable logic in one place so Templater scripts, Dataview scripts, and future module-based scripts can all use the same implementation.

## Pattern

- Put shared logic in `Scripts/utils`.
- Import utilities directly with relative `require(...)`.
- Keep utility modules independent from `tp.user`.
- Prefer core Obsidian objects such as `app` or `app.vault.adapter` over plugin-specific objects like `tp`.

## Current Approach

- `normalize_value.js` is a pure utility with no Obsidian dependency.
- `currency_convert_to_czk.js` is a shared utility that accepts a vault adapter for file I/O.
- Templater scripts call it with `tp.app.vault.adapter`.
- Dataview or other module scripts call it with `app.vault.adapter`.

## Why Adapter-Based

The currency converter needs cache file access, but it does not need Templater itself.
Passing the adapter keeps the utility reusable and avoids coupling it to one plugin.

## Mobile Guidance

- Use vault-relative paths, not absolute filesystem paths.
- Use `adapter.exists`, `adapter.read`, `adapter.write`, and `adapter.mkdir` for file access.
- Avoid `basePath`, `path.join`, `fs`, and other desktop-oriented path handling in shared utilities.

## Usage Example

```js
const normalize = require('../utils/normalize_value.js');
const convertCurrencyToCzk = require('../utils/currency_convert_to_czk.js');

const adapter = tp.app.vault.adapter;
const amount = normalize.toNumber('12.5');
const amountCzk = await convertCurrencyToCzk(adapter, 'EUR', amount);
```

## Rule Of Thumb

If code can work without knowing which plugin called it, it belongs in `utils`.
If code depends on Templater prompts, Dataview page objects, or other plugin-specific behavior, keep it in that plugin's script folder and have it call into `utils` when needed.
