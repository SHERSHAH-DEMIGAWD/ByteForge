"""
N-Queens Problem
Paradigm: Backtracking
Time Complexity: O(N!) worst case (heavily pruned in practice)
Space Complexity: O(N) for the placement stack + O(N) conflict sets

Explanation: Place N queens on an N×N board so that no two attack each other.
The solver advances row by row; when no column in the current row is safe it
BACKTRACKS — removing the last queen and trying her next column. The visual
trace logs every placement attempt, conflict and retreat.
"""


def solve_nqueens(n: int, max_solutions: int = 10, max_steps: int = 800) -> dict:
    if n < 1 or n > 10:
        raise ValueError("n must be between 1 and 10 for visualization")

    steps = []
    solutions = []
    board = []          # board[row] = col of the queen placed in that row
    cols = set()
    diag1 = set()       # row - col
    diag2 = set()       # row + col
    nodes_explored = 0

    def log(action, row, col, explain):
        if len(steps) < max_steps:
            steps.append({
                "action": action,        # try | conflict | place | backtrack | solution
                "row": row, "col": col,
                "board": list(board),
                "explain": explain,
            })

    def backtrack(row):
        nonlocal nodes_explored
        if len(solutions) >= max_solutions:
            return
        if row == n:
            solutions.append(list(board))
            log("solution", row - 1, board[-1],
                f"All {n} queens placed — solution #{len(solutions)} found: {board}.")
            return
        for col in range(n):
            nodes_explored += 1
            if col in cols:
                log("conflict", row, col,
                    f"Row {row}, col {col}: column already attacked by an earlier queen — skip.")
                continue
            if (row - col) in diag1 or (row + col) in diag2:
                log("conflict", row, col,
                    f"Row {row}, col {col}: cell lies on an attacked diagonal — skip.")
                continue
            board.append(col)
            cols.add(col)
            diag1.add(row - col)
            diag2.add(row + col)
            log("place", row, col,
                f"Row {row}: col {col} is safe — place queen #{row + 1}.")
            backtrack(row + 1)
            board.pop()
            cols.discard(col)
            diag1.discard(row - col)
            diag2.discard(row + col)
            if len(solutions) < max_solutions:
                log("backtrack", row, col,
                    f"Exhausted options below row {row} — remove queen from ({row},{col}) and try the next column.")

    backtrack(0)

    return {
        "n": n,
        "solutions": solutions,
        "solution_count": len(solutions),
        "nodes_explored": nodes_explored,
        "steps": steps,
        "steps_truncated": len(steps) >= max_steps,
    }
