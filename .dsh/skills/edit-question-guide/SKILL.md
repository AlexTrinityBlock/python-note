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
- Every question must include a code example, wrapped in Markdown — except for knowledge single-choice and multiple-choice questions

## Question style
- Short concept and code questions
- Must be discriminating: those who do not understand the concept should be confused and fail

## Answer position rules
- Scatter the correct answers: never place the correct option in the same position for every question (e.g., always A).
- The correct answer of the next question must not be at the same position (same option letter) as the correct answer of the previous question. For multiple-choice questions, the set of correct positions must also not overlap the correct positions of the adjacent questions.
- Try hard to avoid detectable patterns in the correct-answer positions: no A-B-C-D cycling, no A-B-A-B alternation, no repeated adjacent pairs, no evenly spaced progressions (e.g., A, C, E), and no long monotonic trends (a short 3-step run such as C, B, A is acceptable). Keep the distribution of positions roughly balanced, so each letter is used a similar number of times.
- Whenever you reorder options, update the `answer` index array AND every option-letter reference in the `explanation` — e.g., "the correct answer is A", "| B | ... |" table rows, "option C", "(D)", "Correct: B." — so the explanation matches the new positions. Rewrite only real option references; never touch letters inside code samples (e.g., button text "A").

## Explanations
- Must be complete, with code examples
- Must ensure the user fully understands the whole knowledge module; for example, Typing questions should include a complete Typing code example
- Must derive the output step by step: for code questions, trace every round of execution in clearly structured Markdown (e.g., a table of state changes followed by a numbered walkthrough) so learners can observe the details

## Language requirement
- All English, including both text and comments

## Examples that need more detail, and how to fix them

### Example of an insufficient question explanation

Consider this code, which uses the two-argument form of iter() described in PEP 234:

```python
counter = [0]

def tick():
    counter[0] += 1
    return counter[0]

it = iter(tick, 3)
print(list(it))
```

```explain
Incorrect — the correct answer is A: [1, 2]

Explanation
Per PEP 234, iter(callable, sentinel) returns a special kind of iterator that calls the callable to produce a new value and compares the return value to the sentinel. If the return value equals the sentinel, this signals the end of the iteration and StopIteration is raised rather than returning normally; if it does not equal the sentinel, it is returned as the next value from the iterator. Here tick() returns 1, then 2 (both != 3, so yielded), then 3 which equals the sentinel, so StopIteration is raised and list() stops — printing [1, 2]. The PEP also notes the callable is allowed to raise StopIteration itself as an alternative way to end the iteration, and that this functionality is available from the C API as PyCallIter_New(callable, sentinel). The one-argument form, iter(obj), simply calls PyObject_GetIter(obj).
```

### Why this explanation is not detailed enough
- It does not introduce the full functionality of iter() together with its own example code
- It does not derive the output of each round step by step in clearly structured Markdown, so learners cannot observe the details

### How to fix it: step-by-step derivation

#### Step 1 — Present the whole knowledge module with complete example code

Explain the complete functionality first, with runnable example code:

```python
# One-argument form: iter(obj) — calls PyObject_GetIter(obj)
# Two-argument form: iter(callable, sentinel) — calls PyCallIter_New(callable, sentinel)

counter = [0]

def tick():
    counter[0] += 1
    return counter[0]

# Every round: call tick(), then compare the return value with the sentinel 3
# - return value == 3 -> StopIteration is raised, iteration ends
# - return value != 3 -> the value is yielded as the next item
it = iter(tick, 3)
print(list(it))  # [1, 2]
```

#### Step 2 — Derive every round step by step in structured Markdown

Trace each round in a table so learners can observe every state change:

| Round | Call | counter before | counter after | Return value | Equals sentinel 3? | Action |
|-------|------|----------------|---------------|--------------|---------------------|--------|
| 1 | `tick()` | `[0]` | `[1]` | `1` | No | Yield `1` |
| 2 | `tick()` | `[1]` | `[2]` | `2` | No | Yield `2` |
| 3 | `tick()` | `[2]` | `[3]` | `3` | Yes | Raise `StopIteration`, iteration ends |

Then follow it with a numbered walkthrough:

1. `list(it)` asks `it` for its first item. `tick()` runs: `counter` becomes `[1]`, returns `1`. Since `1 != 3`, the value `1` is yielded.
2. `list(it)` asks for the next item. `tick()` runs: `counter` becomes `[2]`, returns `2`. Since `2 != 3`, the value `2` is yielded.
3. `list(it)` asks for the next item. `tick()` runs: `counter` becomes `[3]`, returns `3`. Since `3 == 3`, `StopIteration` is raised and the iteration ends.
4. `list()` collects the yielded values, so the result is `[1, 2]`.

#### Step 3 — Rewrite the explanation combining both

The fixed explanation covers the full concept with code, then derives the output step by step (in the real `questions.json`, the code block inside the `explanation` string is wrapped in Markdown ```python fences):

```explain
Incorrect — the correct answer is A: [1, 2]

Explanation
The two-argument form iter(callable, sentinel) (PEP 234) returns a special iterator that repeatedly calls the callable and compares each return value with the sentinel:
- Equal to the sentinel -> StopIteration is raised and the value is NOT yielded
- Not equal to the sentinel -> the value is yielded as the next item
The callable may also raise StopIteration itself to end the iteration early. In C, this is PyCallIter_New(callable, sentinel); the one-argument form iter(obj) simply calls PyObject_GetIter(obj).

Complete example:

    counter = [0]

    def tick():
        counter[0] += 1
        return counter[0]

    it = iter(tick, 3)
    print(list(it))  # [1, 2]

Step-by-step derivation:

| Round | counter before | counter after | Return value | Equals 3? | Action |
|-------|----------------|---------------|--------------|-----------|--------|
| 1     | [0]            | [1]           | 1            | No        | yield 1 |
| 2     | [1]            | [2]           | 2            | No        | yield 2 |
| 3     | [2]            | [3]           | 3            | Yes       | StopIteration, iteration ends |

1. tick() -> counter becomes [1], returns 1; 1 != 3, so yield 1
2. tick() -> counter becomes [2], returns 2; 2 != 3, so yield 2
3. tick() -> counter becomes [3], returns 3; 3 == 3, so StopIteration is raised
4. list() collects the yielded values: [1, 2]

Correct output: [1, 2]
```

## Knowledge single-choice questions

Knowledge single-choice questions are pure knowledge questions and do not require a code example. They must have exactly one correct option:

- Set `type` to `"single"`.
- Store exactly one 0-based option index in `answer`, for example `"answer": [2]`.
- Include both the correct answer and conceptually similar but incorrect distractors.
- Explain every option completely, including why each incorrect option is wrong.
- Search the web when creating the question and use authoritative, current sources.

## Knowledge multiple-choice questions

Knowledge multiple-choice questions are pure knowledge questions and do not require a code example. They must have two or more correct options:

- Set `type` to `"multiple"`.
- Store all correct 0-based option indices in `answer`.
- Include both correct and incorrect options, including confusing items that are conceptually similar but wrong.
- Explain every option completely, including why each incorrect option is wrong.
- Search the web when creating the question and use authoritative, current sources.

The structure of a knowledge multiple-choice question is:

[] A
[] B
[] C
...

The `answer` array must contain the indices of all correct options and must contain at least two indices.

## Progressive code single-choice questions

This question type is single-choice, and the related questions in a set must appear in a **strict sequential (progressive) order**: each question builds on the code of the previous one, and the code shown in a later question reveals the answers to the earlier ones. If a reader sees the later questions in advance, the earlier questions lose their validity — the set must never be shuffled or presented out of sequence.

### Question 1

How do you import tkinter?

```python

```

A ...
B ...
C ...

### Question 2

How do you create the object?

```python
import tkinter
```

A ...
B ...
C ...


### Question 3

How do you create the main loop?

```python
import tkinter

skylight = tkinter.Tk()
```

```
