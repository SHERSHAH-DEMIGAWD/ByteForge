def get_fibonacci_naive_trace(n):
    if n < 0:
        return {"calls": [], "nodes": []}
        
    calls_log = []
    nodes = []
    call_counter = 0
    
    def fib(val, parent_id=None):
        nonlocal call_counter
        my_id = f"call_{call_counter}"
        call_counter += 1
        
        # Log entry
        nodes.append({
            "id": my_id,
            "parent_id": parent_id,
            "label": f"Fib({val})",
            "val": val,
            "status": "active"
        })
        
        calls_log.append({
            "action": f"Called Fib({val})",
            "active_call": my_id,
            "nodes_state": list(nodes),
            "description": f"Fibonacci recursive call for n = {val}."
        })
        
        if val <= 1:
            res = val
            # Update node to show returned result
            for node in nodes:
                if node["id"] == my_id:
                    node["status"] = "resolved"
                    node["label"] = f"Fib({val}) ➔ {res}"
            
            calls_log.append({
                "action": f"Fib({val}) returned {res}",
                "active_call": my_id,
                "nodes_state": list(nodes),
                "description": f"Base case reached. Fib({val}) returns {res}."
            })
            return res
            
        left = fib(val - 1, my_id)
        right = fib(val - 2, my_id)
        res = left + right
        
        for node in nodes:
            if node["id"] == my_id:
                node["status"] = "resolved"
                node["label"] = f"Fib({val}) ➔ {res}"
                
        calls_log.append({
            "action": f"Fib({val}) merged results",
            "active_call": my_id,
            "nodes_state": list(nodes),
            "description": f"Merge: Fib({val-1}) [{left}] + Fib({val-2}) [{right}] = {res}."
        })
        return res
        
    fib(n)
    return {
        "steps": calls_log,
        "total_calls": call_counter
    }

def get_fibonacci_memoized_trace(n):
    if n < 0:
        return {"calls": [], "nodes": []}
        
    calls_log = []
    nodes = []
    call_counter = 0
    memo = {}
    
    def fib_memo(val, parent_id=None):
        nonlocal call_counter
        my_id = f"call_{call_counter}"
        call_counter += 1
        
        # Check memo
        is_hit = val in memo
        
        nodes.append({
            "id": my_id,
            "parent_id": parent_id,
            "label": f"Fib({val}) [Hit]" if is_hit else f"Fib({val})",
            "val": val,
            "status": "memo_hit" if is_hit else "active"
        })
        
        calls_log.append({
            "action": f"Called Fib({val}) " + ("(Cache Hit)" if is_hit else "(Calculating)"),
            "active_call": my_id,
            "nodes_state": list(nodes),
            "description": f"Cache lookup for n={val}. " + (f"Found cached value {memo[val]}." if is_hit else "Not in cache, descending recursively.")
        })
        
        if is_hit:
            return memo[val]
            
        if val <= 1:
            res = val
            memo[val] = res
            for node in nodes:
                if node["id"] == my_id:
                    node["status"] = "resolved"
                    node["label"] = f"Fib({val}) ➔ {res}"
            
            calls_log.append({
                "action": f"Fib({val}) base case returned {res}",
                "active_call": my_id,
                "nodes_state": list(nodes),
                "description": f"Base case reached. Fib({val}) returns {res} and stores in cache."
            })
            return res
            
        left = fib_memo(val - 1, my_id)
        right = fib_memo(val - 2, my_id)
        res = left + right
        memo[val] = res
        
        for node in nodes:
            if node["id"] == my_id:
                node["status"] = "resolved"
                node["label"] = f"Fib({val}) ➔ {res}"
                
        calls_log.append({
            "action": f"Fib({val}) resolved and cached {res}",
            "active_call": my_id,
            "nodes_state": list(nodes),
            "description": f"Computed Fib({val-1}) [{left}] + Fib({val-2}) [{right}] = {res}. Cached result."
        })
        return res
        
    fib_memo(n)
    return {
        "steps": calls_log,
        "total_calls": call_counter
    }

def get_merge_sort_split_trace(arr):
    steps = []
    nodes = []
    call_counter = 0
    
    def split_rec(sub_arr, parent_id=None, side="root"):
        nonlocal call_counter
        my_id = f"split_{call_counter}"
        call_counter += 1
        
        # Label shows the active sub-array
        nodes.append({
            "id": my_id,
            "parent_id": parent_id,
            "label": str(sub_arr),
            "side": side,
            "status": "leaf" if len(sub_arr) <= 1 else "split"
        })
        
        steps.append({
            "action": f"Recursive split on {side}",
            "active_node": my_id,
            "nodes_state": list(nodes),
            "description": f"Dividing subsegment {sub_arr}."
        })
        
        if len(sub_arr) <= 1:
            return
            
        mid = len(sub_arr) // 2
        left_sub = sub_arr[:mid]
        right_sub = sub_arr[mid:]
        
        split_rec(left_sub, my_id, "left")
        split_rec(right_sub, my_id, "right")
        
    split_rec(arr)
    return {
        "steps": steps,
        "total_splits": call_counter
    }
