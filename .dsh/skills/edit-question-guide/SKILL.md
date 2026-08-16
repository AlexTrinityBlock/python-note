---
name: edit-question-guide
description: Use this Skill when adding or modifying questions.
---

# Editing Questions

## Files you edit
- `topics.json` (project root): topic list
- `<TopicID>/questions.json`: the questions themselves

## How to
- Add a topic: create `<TopicID>/questions.json`, then add `{"id","name","description"}` to `topics.json`
- Edit questions: edit `<TopicID>/questions.json` directly
- Question format: `type` (single/multiple), `question`, `options`, `answer` (0-based index array), `explanation`

## Reference material
- Must-read: `<TopicID>\reference\` as the source for writing questions

## Example

```json
[
  {
    "type": "single",
    "question": "What happens when this code runs?\n\n```python\nclass A:\n    def __init__(self):\n        return 42\n\nA()\n```",
    "options": [
      "Raises TypeError at runtime because `__init__` must not return a non-None value",
      "The value 42 is silently ignored and A() returns a new instance",
      "A() evaluates to the integer 42",
      "Raises SyntaxError at class definition time because return with a value is not allowed in `__init__`"
    ],
    "answer": [
      0
    ],
    "explanation": "`__new__` creates the object and `__init__` customizes it — `__init__` is not the constructor's \"return value\" mechanism. The data model states that no non-`None` value may be returned by `__init__()`; doing so raises `TypeError` at **runtime** (`__init__() should return None, not 'int'`). This is not a syntax error, and the returned value is neither silently dropped nor used as the result of the call."
  },
]
```

## Preventing staleness and bias
- Reference material exists only locally and may be outdated
- Before writing questions, search the web to ensure the information is up to date
- Reference material must come from authoritative sources, such as the official Python documentation

## Hard requirement
- Every question must include a code example, wrapped in Markdown

## Question style
- Short concept and code questions
- Must be discriminating: those who do not understand the concept should be confused and fail

## Explanations
- Must be complete, with code examples
- Must ensure the user fully understands the whole knowledge module; for example, Typing questions should include a complete Typing code example

## Language requirement
- All English, including both text and comments
