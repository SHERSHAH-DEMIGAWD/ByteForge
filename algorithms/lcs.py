"""
Longest Common Subsequence (LCS)
Paradigm: Dynamic Programming
Time Complexity: O(N * M)
Space Complexity: O(N * M) for the DP table (O(min(N,M)) possible if only length needed)

Explanation: LCS finds the longest sequence of characters appearing in the same
relative order (not necessarily contiguous) in both strings. The DP recurrence:
    if a[i-1] == b[j-1]:  L[i][j] = L[i-1][j-1] + 1   (diagonal + 1)
    else:                 L[i][j] = max(L[i-1][j], L[i][j-1])
"""


def solve_lcs(a: str, b: str) -> dict:
    n, m = len(a), len(b)
    L = [[0] * (m + 1) for _ in range(n + 1)]
    steps = []

    for i in range(1, n + 1):
        for j in range(1, m + 1):
            ca, cb = a[i - 1], b[j - 1]
            if ca == cb:
                L[i][j] = L[i - 1][j - 1] + 1
                source = "diagonal"
                explain = (f"a[{i-1}]='{ca}' == b[{j-1}]='{cb}' → take diagonal + 1: "
                           f"L[{i}][{j}] = L[{i-1}][{j-1}] + 1 = {L[i][j]}.")
            elif L[i - 1][j] >= L[i][j - 1]:
                L[i][j] = L[i - 1][j]
                source = "up"
                explain = (f"'{ca}' != '{cb}' → take max of top/left: "
                           f"L[{i}][{j}] = L[{i-1}][{j}] (top) = {L[i][j]}.")
            else:
                L[i][j] = L[i][j - 1]
                source = "left"
                explain = (f"'{ca}' != '{cb}' → take max of top/left: "
                           f"L[{i}][{j}] = L[{i}][{j-1}] (left) = {L[i][j]}.")

            if len(steps) < 600:
                steps.append({
                    "i": i, "j": j,
                    "char_a": ca, "char_b": cb,
                    "match": ca == cb,
                    "value": L[i][j],
                    "source": source,
                    "explain": explain,
                })

    # Traceback to recover the subsequence + highlight path
    lcs_chars = []
    traceback = []
    i, j = n, m
    while i > 0 and j > 0:
        traceback.append([i, j])
        if a[i - 1] == b[j - 1]:
            lcs_chars.append(a[i - 1])
            i -= 1
            j -= 1
        elif L[i - 1][j] >= L[i][j - 1]:
            i -= 1
        else:
            j -= 1
    lcs_chars.reverse()
    traceback.reverse()

    return {
        "table": L,
        "length": L[n][m],
        "lcs": "".join(lcs_chars),
        "traceback": traceback,
        "steps": steps,
    }
