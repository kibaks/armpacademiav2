import re

def split_passages(text: str, limit: int = 240) -> list[str]:
    words = text.split()
    passages = []
    while words:
        size = 0
        end = 0
        for index, word in enumerate(words):
            if index and size + 1 + len(word) > limit:
                break
            size += len(word) + (1 if index else 0)
            end = index + 1
        for index in range(end - 1, max(0, end // 2) - 1, -1):
            if re.search(r'[.!?;,:]$', words[index]):
                end = index + 1
                break
        passages.append(' '.join(words[:end]))
        words = words[end:]
    return passages
