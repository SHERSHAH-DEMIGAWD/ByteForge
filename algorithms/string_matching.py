def naive_search(text: str, pattern: str) -> dict:
    """
    Naive string matching algorithm.
    Time Complexity: O(N * M)
    Space Complexity: O(1)
    """
    comparisons = 0
    alignments = []
    n, m = len(text), len(pattern)
    
    for i in range(n - m + 1):
        match = True
        step = {
            "alignment_index": i,
            "comparisons": [],
            "status": "mismatch"
        }
        for j in range(m):
            comparisons += 1
            char_t = text[i + j]
            char_p = pattern[j]
            step["comparisons"].append({
                "text_idx": i + j,
                "pattern_idx": j,
                "text_char": char_t,
                "pattern_char": char_p,
                "match": char_t == char_p
            })
            if char_t != char_p:
                match = False
                break
        if match:
            step["status"] = "match"
            alignments.append(i)
        
        # Limit steps logged to prevent bloat
        if len(alignments) < 50 or i < 100:
            alignments.append(step)
            
    return {
        "alignments": [x for x in alignments if isinstance(x, int)],
        "steps": [x for x in alignments if isinstance(x, dict)][:100],
        "total_comparisons": comparisons
    }

def horspool_search(text: str, pattern: str) -> dict:
    """
    Horspool's string matching algorithm.
    Time Complexity: O(N) average, O(N * M) worst-case.
    Space Complexity: O(Alphabet_Size) for shift table.
    """
    n, m = len(text), len(pattern)
    comparisons = 0
    alignments = []
    steps = []
    
    # 1. Build Shift Table
    # For Horspool: Shift table size is the alphabet size. Default shift is m.
    shift_table = {chr(i): m for i in range(256)}
    for i in range(m - 1):
        shift_table[pattern[i]] = m - 1 - i
        
    # Format shift table for visualization
    visual_shift_table = {}
    for char, shift in shift_table.items():
        if shift != m or char in pattern:
            visual_shift_table[char] = shift
            
    # 2. Search Phase
    i = 0
    while i <= n - m:
        j = m - 1
        step = {
            "alignment_index": i,
            "comparisons": [],
            "status": "mismatch"
        }
        match = True
        while j >= 0:
            comparisons += 1
            char_t = text[i + j]
            char_p = pattern[j]
            step["comparisons"].append({
                "text_idx": i + j,
                "pattern_idx": j,
                "text_char": char_t,
                "pattern_char": char_p,
                "match": char_t == char_p
            })
            if char_t != char_p:
                match = False
                break
            j -= 1
            
        if match:
            step["status"] = "match"
            alignments.append(i)
        
        # Next shift is determined by the last character of current text window
        last_char = text[i + m - 1]
        shift = shift_table.get(last_char, m)
        step["shift"] = shift
        
        if len(steps) < 100:
            steps.append(step)
            
        i += shift
        
    return {
        "alignments": alignments,
        "steps": steps,
        "shift_table": visual_shift_table,
        "total_comparisons": comparisons
    }

def kmp_search(text: str, pattern: str) -> dict:
    """
    Knuth-Morris-Pratt string matching algorithm.
    Time Complexity: O(N + M) guaranteed (no re-comparison of matched text).
    Space Complexity: O(M) for the failure (LPS) table.
    """
    n, m = len(text), len(pattern)
    comparisons = 0
    alignments = []
    steps = []

    # 1. Build failure table: lps[j] = length of the longest proper prefix of
    # pattern[:j+1] that is also a suffix of it.
    lps = [0] * m
    length = 0
    i = 1
    while i < m:
        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length:
            length = lps[length - 1]
        else:
            lps[i] = 0
            i += 1

    # 2. Search phase — the text pointer never moves backwards.
    i = j = 0
    step = None
    while i < n:
        if step is None:
            step = {"alignment_index": i - j, "comparisons": [], "status": "mismatch"}
        comparisons += 1
        match = text[i] == pattern[j]
        step["comparisons"].append({
            "text_idx": i,
            "pattern_idx": j,
            "text_char": text[i],
            "pattern_char": pattern[j],
            "match": match,
        })
        if match:
            i += 1
            j += 1
            if j == m:
                step["status"] = "match"
                step["shift"] = j - lps[j - 1]
                step["explain"] = (f"Full match at index {i - j}. Failure table lets us keep "
                                   f"{lps[j - 1]} matched prefix characters and continue scanning.")
                alignments.append(i - j)
                if len(steps) < 100:
                    steps.append(step)
                step = None
                j = lps[j - 1]
        else:
            if j:
                step["shift"] = j - lps[j - 1]
                step["explain"] = (f"Mismatch at pattern index {j}: fall back to lps[{j - 1}] = "
                                   f"{lps[j - 1]} — the text pointer stays at {i}, no re-comparisons.")
                j = lps[j - 1]
            else:
                step["shift"] = 1
                step["explain"] = f"Mismatch at pattern index 0: advance the text pointer to {i + 1}."
                i += 1
            if len(steps) < 100:
                steps.append(step)
            step = None

    if step is not None and step["comparisons"] and len(steps) < 100:
        step["shift"] = 0
        step["explain"] = "Reached end of text with a partial match in progress."
        steps.append(step)

    return {
        "alignments": alignments,
        "steps": steps,
        "lps": lps,
        "total_comparisons": comparisons,
    }

def boyer_moore_search(text: str, pattern: str) -> dict:
    """
    Boyer-Moore string matching algorithm (Bad Character heuristic).
    Time Complexity: O(N / M) best-case, O(N * M) worst-case.
    Space Complexity: O(Alphabet_Size) for bad character table.
    """
    n, m = len(text), len(pattern)
    comparisons = 0
    alignments = []
    steps = []
    
    # 1. Bad Character Shift Table
    bad_char_table = {chr(i): -1 for i in range(256)}
    for idx, char in enumerate(pattern):
        bad_char_table[char] = idx
        
    visual_bad_char = {char: idx for char, idx in bad_char_table.items() if idx != -1}
    
    # 2. Search Phase
    i = 0
    while i <= n - m:
        j = m - 1
        step = {
            "alignment_index": i,
            "comparisons": [],
            "status": "mismatch"
        }
        match = True
        while j >= 0:
            comparisons += 1
            char_t = text[i + j]
            char_p = pattern[j]
            step["comparisons"].append({
                "text_idx": i + j,
                "pattern_idx": j,
                "text_char": char_t,
                "pattern_char": char_p,
                "match": char_t == char_p
            })
            if char_t != char_p:
                match = False
                # Bad character shift
                bc_shift = j - bad_char_table.get(char_t, -1)
                shift = max(1, bc_shift)
                break
            j -= 1
            
        if match:
            step["status"] = "match"
            alignments.append(i)
            shift = 1 # shift by 1 after full match
            
        step["shift"] = shift
        if len(steps) < 100:
            steps.append(step)
            
        i += shift
        
    return {
        "alignments": alignments,
        "steps": steps,
        "bad_char_table": visual_bad_char,
        "total_comparisons": comparisons
    }
