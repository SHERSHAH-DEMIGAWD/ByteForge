"""
Strassen's Matrix Multiplication
Paradigm: Divide & Conquer
Time Complexity: O(N^2.807)  (vs naive O(N^3))
Space Complexity: O(N^2)

Explanation: Naive multiplication of two N×N matrices needs N^3 scalar
multiplications (8 recursive sub-products). Strassen rearranges the block
algebra into only 7 sub-products (M1..M7) at the cost of extra additions,
giving the recurrence T(N) = 7·T(N/2) + O(N^2) = O(N^log2(7)).
"""


def _add(A, B):
    return [[A[i][j] + B[i][j] for j in range(len(A))] for i in range(len(A))]


def _sub(A, B):
    return [[A[i][j] - B[i][j] for j in range(len(A))] for i in range(len(A))]


def _split(M):
    n = len(M) // 2
    a = [row[:n] for row in M[:n]]
    b = [row[n:] for row in M[:n]]
    c = [row[:n] for row in M[n:]]
    d = [row[n:] for row in M[n:]]
    return a, b, c, d


def naive_multiply(A, B, counter):
    n = len(A)
    C = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            s = 0
            for k in range(n):
                s += A[i][k] * B[k][j]
                counter[0] += 1
            C[i][j] = s
    return C


def strassen_multiply(A, B, counter, steps, level=0):
    n = len(A)
    if n == 1:
        counter[0] += 1
        return [[A[0][0] * B[0][0]]]

    a, b, c, d = _split(A)
    e, f, g, h = _split(B)

    if len(steps) < 200:
        steps.append({
            "level": level,
            "size": n,
            "explain": (f"Level {level}: split {n}×{n} matrices into four {n//2}×{n//2} blocks "
                        f"and compute the 7 Strassen products M1..M7 (instead of 8 naive block products).")
        })

    m1 = strassen_multiply(_add(a, d), _add(e, h), counter, steps, level + 1)  # (A11+A22)(B11+B22)
    m2 = strassen_multiply(_add(c, d), e, counter, steps, level + 1)           # (A21+A22)B11
    m3 = strassen_multiply(a, _sub(f, h), counter, steps, level + 1)           # A11(B12-B22)
    m4 = strassen_multiply(d, _sub(g, e), counter, steps, level + 1)           # A22(B21-B11)
    m5 = strassen_multiply(_add(a, b), h, counter, steps, level + 1)           # (A11+A12)B22
    m6 = strassen_multiply(_sub(c, a), _add(e, f), counter, steps, level + 1)  # (A21-A11)(B11+B12)
    m7 = strassen_multiply(_sub(b, d), _add(g, h), counter, steps, level + 1)  # (A12-A22)(B21+B22)

    c11 = _add(_sub(_add(m1, m4), m5), m7)
    c12 = _add(m3, m5)
    c21 = _add(m2, m4)
    c22 = _add(_sub(_add(m1, m3), m2), m6)

    top = [c11[i] + c12[i] for i in range(n // 2)]
    bottom = [c21[i] + c22[i] for i in range(n // 2)]
    return top + bottom


def solve_strassen(A, B) -> dict:
    n = len(A)
    if n == 0 or (n & (n - 1)) != 0:
        raise ValueError("Matrix size must be a power of 2 (2, 4 or 8)")
    if n > 8:
        raise ValueError("Matrix size capped at 8×8 for visualization")
    if any(len(r) != n for r in A) or len(B) != n or any(len(r) != n for r in B):
        raise ValueError("Both matrices must be square and the same size")

    naive_count = [0]
    naive_result = naive_multiply(A, B, naive_count)

    strassen_count = [0]
    steps = []
    strassen_result = strassen_multiply(A, B, strassen_count, steps)

    return {
        "result": strassen_result,
        "naive_result": naive_result,
        "results_match": strassen_result == naive_result,
        "naive_multiplications": naive_count[0],     # N^3
        "strassen_multiplications": strassen_count[0],  # 7^log2(N)
        "savings_percent": round(100 * (1 - strassen_count[0] / max(1, naive_count[0])), 2),
        "steps": steps,
        "formulas": [
            "M1 = (A11 + A22)(B11 + B22)",
            "M2 = (A21 + A22) B11",
            "M3 = A11 (B12 - B22)",
            "M4 = A22 (B21 - B11)",
            "M5 = (A11 + A12) B22",
            "M6 = (A21 - A11)(B11 + B12)",
            "M7 = (A12 - A22)(B21 + B22)",
            "C11 = M1 + M4 - M5 + M7",
            "C12 = M3 + M5",
            "C21 = M2 + M4",
            "C22 = M1 - M2 + M3 + M6",
        ],
    }
