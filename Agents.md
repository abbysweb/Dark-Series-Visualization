# ============================================================
# QUOTA FALLBACK RULES
# ============================================================
#
# When a model returns a 429 (RateLimitError) / quota exceeded,
# IMMEDIATELY retry with the next available model in the list
# below using the following fallback chain:
#
#   1. opencode models (try in order)
#   2. aider free models (try in order)
#   3. other OpenRouter free models (try in order)
#   4. If ALL exhausted, wait 30s and restart from top
#
# Fallback priority within each section is TOP-TO-BOTTOM.
#
# -----------------------------------------------------------------------
# REAL QUOTA EXCEED EXAMPLE (from aider chat on 2026-07-28)
# -----------------------------------------------------------------------
# litellm.RateLimitError: RateLimitError: OpenrouterException -
#   {"error":{"message":"Provider returned error","code":429,
#     "metadata":{"raw":"openai/gpt-oss-20b:free is temporarily
#       rate-limited upstream. Please retry shortly, or add your own
#       key to accumulate your rate limits: https://openrouter.ai/...",
#     "provider_name":"Darkbloom","is_byok":false,
#     "provider_error_code":"rate_limit_exceeded",
#     "retry_after_seconds":30,
#     "headers":{"Retry-After":"30"}}},
#   "user_id":"user_3H88pqiWGJXdDv7DAK9Gv6nwLTZ"}
# The API provider has rate limited you. Try again later or check
#   your quotas.
# -----------------------------------------------------------------------
#
# How to detect quota exceed:
#   - Error code: 429
#   - Error type: RateLimitError / RateLimitError
#   - Keywords: "rate_limit_exceeded", "rate limited", "quota",
#     "Retry-After"
#
# How to apply fallback:
#   1. Kill current command (Ctrl+C)
#   2. Pick the NEXT model from the appropriate section below
#   3. Re-run with the new model
#   4. If the new model also fails, repeat step 2-3
#
# ============================================================
# FREE OPENCODE MODELS (fallback order: 1st tier)
# ============================================================

opencode --model opencode/deepseek-v4-flash-free
opencode --model opencode/north-mini-code-free
opencode --model opencode/nemotron-3-ultra-free
opencode --model opencode/mimo-v2.5-free
opencode --model opencode/ling-3.0-flash-free
opencode --model opencode/laguna-s-2.1-free
opencode --model opencode/big-pickle

# ============================================================
# FREE AIDER (OPENROUTER) MODELS (fallback order: 2nd tier)
# ============================================================

python -m aider --model openrouter/deepseek/deepseek-r1:free
python -m aider --model openrouter/deepseek/deepseek-chat:free
python -m aider --model openrouter/deepseek/deepseek-chat-v3-0324:free
python -m aider --model openrouter/google/gemini-2.0-flash-exp:free
python -m aider --model openrouter/openrouter/free

# ============================================================
# OTHER CURRENTLY AVAILABLE OPENROUTER FREE MODELS
# (fallback order: 3rd tier)
# ============================================================

python -m aider --model openrouter/openai/gpt-oss-20b:free
python -m aider --model openrouter/openai/gpt-oss-120b:free
python -m aider --model openrouter/nvidia/nemotron-3-ultra:free
python -m aider --model openrouter/nvidia/nemotron-3-super:free
python -m aider --model openrouter/nvidia/nemotron-nano-9b-v2:free
python -m aider --model openrouter/nvidia/nemotron-3-nano-30b-a3b:free
python -m aider --model openrouter/meta-llama/llama-3.2-3b-instruct:free
python -m aider --model openrouter/meta-llama/llama-3.3-70b-instruct:free
python -m aider --model openrouter/qwen/qwen3-coder:free
python -m aider --model openrouter/qwen/qwen3-235b-a22b-thinking:free
python -m aider --model openrouter/google/gemma-3-27b-it:free
python -m aider --model openrouter/google/gemma-3-12b-it:free
python -m aider --model openrouter/z-ai/glm-5:free
python -m aider --model openrouter/minimax/minimax-m2.5:free
python -m aider --model openrouter/moonshotai/kimi-k2.5:free