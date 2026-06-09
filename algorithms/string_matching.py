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
