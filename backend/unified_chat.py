from __future__ import annotations

import json
import os
import subprocess
import sys
from typing import Dict, List

import requests
from dotenv import load_dotenv

# ────────────────────────── ENV / CONFIG ──────────────────────────
load_dotenv()
GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL_NAME = os.getenv("GROQ_MODEL", "llama3-70b-8192")

if not GROQ_API_KEY:
    print("❌ GROQ_API_KEY not found in environment!")
    sys.exit(1)

# Domain‑specific helpers
import fitness

# ─────────────────────────── LLM HELPERS ──────────────────────────

def call_groq_api(messages: List[Dict], temperature: float = 0.7) -> str:
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "temperature": temperature,
    }
    resp = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()


def build_system_prompt(user_data: Dict) -> str:
    todo = [
        "name", "gender", "age", "exercise_name", "goal",
        "equipment", "time (minutes)", "notes",
        "sets & reps **OR** duration (seconds) depending on the exercise",
    ]
    todo_text = "\n- ".join(todo)
    return f"""
You are a friendly, motivational fitness coach chatbot.

Please collect the following information from the user naturally:

- {todo_text}

Store each answer. Once everything is filled in, summarize and ask for confirmation.
Do NOT proceed to planning until the user answers "yes".

Current data (may include blanks):
{json.dumps(user_data, indent=2)}
"""


def extract_user_data(chat_history: List[Dict], keys: List[str]) -> Dict:
    convo = "\n".join([f"{m['role']}: {m['content']}" for m in chat_history])
    prompt = f"""
Read the following conversation and output only a JSON object with
keys {keys}. Use null where data is missing.

Conversation:
{convo}
"""
    messages = [
        {"role": "system", "content": "You are a JSON extraction assistant."},
        {"role": "user", "content": prompt},
    ]
    try:
        raw = call_groq_api(messages, temperature=0)
        return json.loads(raw)
    except Exception:
        return {}


def confirm_message(data: Dict) -> str:
    lines = [f"* {k.replace('_', ' ').title()}: {v}" for k, v in data.items()]
    return (
        "Thanks! Here's what I've got so far:\n\n" +
        "\n".join(lines) +
        "\n\nIs everything correct? (yes/no)"
    )


def yes(inp: str) -> bool:
    return inp.strip().lower() in {"yes", "y"}

# ────────────────────────── FLOW HELPER ──────────────────────────

def run_fitness_flow(collected: Dict):
    ex_name = collected["exercise_name"].lower()

    rep_ex = ex_name in fitness.rep_set_exercises
    if rep_ex and (not collected.get("sets") or not collected.get("reps")):
        collected["sets"] = int(input("Sets per workout: "))
        collected["reps"] = int(input("Reps per set: "))
    if not rep_ex and not collected.get("duration"):
        collected["duration"] = int(input("Duration (seconds): "))

    plan = fitness.generate_exercise_plan(collected)
    folder = fitness.append_prompt_to_json(collected, ex_name, plan)

    print("\n===== Machine‑Usable Prompt =====\n")
    print(plan)

    print("\n🧠 Explaining your workout plan...\n")
    explanation = fitness.explain_prompt_to_user(collected, plan)
    print(explanation)
    fitness.save_explanation_to_json(collected, folder, ex_name, explanation)

    if yes(input("\n🚀 Start real‑time monitoring now? (y/n): ")):
        subprocess.run([sys.executable, "moniter_agent/fitness_agent.py", ex_name])
    else:
        print("👋 You can launch it later via moniter_agent/fitness_agent.py")

# ────────────────────────── CHAT COLLECT ──────────────────────────

def chat_collect() -> Dict:
    keys = [
        "name", "age", "exercise_name", "goal",
        "equipment", "time", "notes", "duration", "sets", "reps",
    ]
    user_data = {k: None for k in keys}
    chat: List[Dict] = []

    chat.append({"role": "system", "content": build_system_prompt(user_data)})
    print("\n💬 Chatbot: Hi! Let's put together your fitness plan!")

    confirmed = False
    manual_confirmed = False

    while True:
        msg = input("You: ").strip()
        if msg.lower() in {"exit", "quit", "bye"}:
            print("Chatbot: Goodbye!")
            sys.exit(0)

        chat.append({"role": "user", "content": msg})

        if msg.lower() in {"save now", "save the data", "done", "confirm"}:
            if all(user_data.values()):
                print("✅ Chatbot: Manual confirmation received. Passing data to planner agent...")
                return user_data
            else:
                print("Chatbot: Let me summarize what you've provided so far:")
                print(user_data)
                print('Please respond with "yes" to confirm or continue providing details.')
                manual_confirmed = True
                continue

        bot_reply = call_groq_api(chat)
        print("Chatbot:", bot_reply)
        chat.append({"role": "assistant", "content": bot_reply})

        extracted = extract_user_data(chat, keys)

        for k in keys:
            if not user_data[k] and extracted.get(k) not in (None, "", "null"):
                user_data[k] = extracted[k]

        if all(user_data.values()) and not confirmed:
            print("Chatbot:", confirm_message(user_data))
            confirmed = True

        if (confirmed or manual_confirmed) and any(word in msg.lower() for word in {"yes", "correct", "confirmed", "okay"}):
            print("✅ Chatbot: Great! Passing data to planner agent...")
            return user_data


# ---------------------------=======================

def chat_step(flow: str, message: str, history: List[Dict], user_data: Dict) -> Dict:
    # Add the message to history
    history.append({"role": "user", "content": message})

    # Build system prompt
    system_prompt = build_system_prompt(user_data)
    full_chat = [{"role": "system", "content": system_prompt}] + history

    # Get assistant response
    reply = call_groq_api(full_chat)
    history.append({"role": "assistant", "content": reply})

    # Extract user data
    keys = [
        "name", "age", "exercise_name", "goal",
        "equipment", "time", "notes", "duration", "sets", "reps",
    ]
    extracted = extract_user_data(history, keys)
    for k in keys:
        if not user_data.get(k) and extracted.get(k):
            user_data[k] = extracted[k]

    # Check if all data is collected
    is_ready = all(user_data.values())

    return {
        "reply": reply,
        "history": history,
        "user_data": user_data,
        "ready": is_ready
    }



# ───────────────────────────── MAIN ─────────────────────────────

if __name__ == "__main__":
    collected_data = chat_collect()
    print("\n✅ All data captured. Generating your plan ...\n")
    run_fitness_flow(collected_data)
