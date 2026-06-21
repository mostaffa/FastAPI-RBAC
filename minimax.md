# Using MiniMax-M3 with VS Code

There are a few approaches depending on how you want to access the model:

## Option 1: Via API (If Available)

If MiniMax provides an API endpoint, you can use it with VS Code extensions:

### Using Continue.dev Extension

1. **Install Continue.dev** from VS Code marketplace
2. Open VS Code settings (`Ctrl+,`)
3. Search for "Continue" or edit `config.json` directly:
   - Location: `~/.continue/config.json` (Mac/Linux) or `%USERPROFILE%\.continue\config.json` (Windows)

4. Add this configuration:

   ```json
   {
     "models": [
       {
         "title": "MiniMax-M3",
         "provider": "openai",
         "model": "MiniMaxAI/MiniMax-M3",
         "apiBase": "https://api.minimaxi.com/v1",
         "apiKey": "YOUR_API_KEY_HERE"
       }
     ]
   }
   ```

5. **Note**: I don't have verified information about MiniMax-M3's API endpoint. You'll need to check their official documentation at [minimaxi.com](https://minimaxi.com) for:
   - Correct API base URL
   - Available model names
   - API key signup

## Option 2: Run Locally with Ollama

1. **Install Ollama**: [https://ollama.com](https://ollama.com)
2. Pull the model:
   ```bash
   ollama pull MiniMax-m3
   ```
3. Configure Continue.dev to use Ollama:
   ```json
   {
     "models": [
       {
         "title": "MiniMax-M3 (Local)",
         "provider": "ollama",
         "model": "MiniMax-m3"
       }
     ]
   }
   ```

## Option 3: Using LM Studio + Code Extension

1. Download LM Studio from [lmstudio.ai](https://lmstudio.ai)
2. Load your model in LM Studio and start the local server
3. Use any compatible VS Code extension pointing to `http://localhost:1234/v1`

## ⚠️ Important Disclaimer About Limits

I **cannot provide accurate information** about:

- ❌ MiniMax-M3's specific context window
- ❌ Rate limits
- ❌ Pricing tiers
- ❌ API quotas
- ❌ Token limits

I don't have reliable documentation about this model in my training data. **You should check directly with MiniMax:**

- Official documentation
- API reference page
- Pricing/plan page
- Discord/community channels

## General Context Window Estimates

For reference, most modern coding models offer:
| Model Size | Typical Context |
|------------|----------------|
| 7B models | 4K–8K tokens |
| 13B–14B models | 4K–32K tokens |
| 30B+ models | 8K–128K tokens |

But I **cannot confirm** what MiniMax-M3 specifically offers.

## My Recommendation

1. **Visit minimaxi.com** for official docs
2. **Check their Discord or support** for setup guidance
3. If no API exists, consider the local alternatives I mentioned (Qwen2.5-Coder-14B via Ollama works great on your hardware)

Would you like help setting up Continue.dev with a different model that I can verify works (like Qwen2.5-Coder or DeepSeek-Coder)?
