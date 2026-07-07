"""
ai.prompts — prompt / response templates for the AI infrastructure (Layer 1).

Keeping prompts here (rather than inline in the endpoints) has two benefits:

* **Live providers** get well-structured system + user messages with clear
  pedagogical framing.
* **The offline provider** can parse the same messages, because every user
  message embeds single-line ``MARKER: value`` fields (``TASK``, ``TOPIC``,
  ``LEVEL``, ``ANSWER``) that :class:`ai.provider.OfflineProvider` extracts
  without a model.

This dual purpose is deliberate: the exact same prompt works whether the backend
is offline or a hosted LLM, so switching providers changes nothing about how the
endpoints build their input.
"""

from __future__ import annotations

from typing import List, Optional

from .provider import LLMMessage


# A shared system message that sets the assistant's role. Live providers use it
# as the system prompt; the offline provider ignores it (it keys off the markers
# in the user message) but it costs nothing to include.
SYSTEM_TUTOR = (
    "You are ByteForge Tutor, a concise, encouraging computer-science tutor for a "
    "Design & Analysis of Algorithms course. Prefer intuition first, then rigor. "
    "Use short paragraphs and name the algorithmic paradigm when relevant."
)


def build_explain_messages(
    topic: str,
    level: str = "beginner",
    question: Optional[str] = None,
) -> List[LLMMessage]:
    """Build messages that ask the assistant to explain a topic.

    The ``TASK``/``TOPIC``/``LEVEL`` markers let the offline provider route and
    template a response; a live provider simply reads them as context.
    """
    user_lines = [
        "TASK: explain",
        f"TOPIC: {topic}",
        f"LEVEL: {level}",
    ]
    if question:
        user_lines.append(f"QUESTION: {question}")
    user_lines.append(
        "\nExplain the topic at the requested level. Keep it focused and cite "
        "the paradigm and complexity."
    )
    return [
        LLMMessage(role="system", content=SYSTEM_TUTOR),
        LLMMessage(role="user", content="\n".join(user_lines)),
    ]


def build_assess_messages(topic: str, answer: str) -> List[LLMMessage]:
    """Build messages that ask the assistant to give feedback on a learner answer.

    The offline provider uses the ``ANSWER`` marker to run keyword-coverage
    feedback; a live provider produces qualitative feedback from the same input.
    """
    user_lines = [
        "TASK: assess",
        f"TOPIC: {topic}",
        f"ANSWER: {answer}",
        "\nGive brief, constructive feedback. Note what is correct and what key "
        "concepts are missing. Do not just restate the answer.",
    ]
    return [
        LLMMessage(role="system", content=SYSTEM_TUTOR),
        LLMMessage(role="user", content="\n".join(user_lines)),
    ]
