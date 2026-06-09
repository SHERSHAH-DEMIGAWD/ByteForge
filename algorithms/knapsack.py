def solve_01_knapsack(weights: list[int], values: list[int], capacity: int) -> dict:
    """
    Solves 0/1 Knapsack using Dynamic Programming.
    Time Complexity: O(N * W)
    Space Complexity: O(N * W)
    """
    n = len(weights)
    # dp[i][w] represents the max value with first i items and capacity w
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    
    for i in range(1, n + 1):
        for w in range(1, capacity + 1):
            if weights[i - 1] <= w:
                dp[i][w] = max(
                    values[i - 1] + dp[i - 1][w - weights[i - 1]],
                    dp[i - 1][w]
                )
            else:
                dp[i][w] = dp[i - 1][w]
                
    # Backtrack to find selected items
    selected_indices = []
    w = capacity
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i - 1][w]:
            selected_indices.append(i - 1)
            w -= weights[i - 1]
            
    selected_indices.reverse()
    
    return {
        "max_value": dp[n][capacity],
        "selected_indices": selected_indices,
        "dp_matrix": dp,
        "weights": weights,
        "values": values,
        "capacity": capacity
    }

def solve_fractional_knapsack(weights: list[int], values: list[int], capacity: int) -> dict:
    """
    Solves Fractional Knapsack using Greedy Technique.
    Time Complexity: O(N log N) for sorting.
    Space Complexity: O(N)
    """
    n = len(weights)
    items = []
    for i in range(n):
        ratio = values[i] / weights[i] if weights[i] > 0 else 0
        items.append({
            "index": i,
            "weight": weights[i],
            "value": values[i],
            "ratio": ratio
        })
        
    # Sort by value/weight ratio descending
    sorted_items = sorted(items, key=lambda x: x["ratio"], reverse=True)
    
    total_value = 0.0
    current_weight = 0
    selections = []
    
    for item in sorted_items:
        if current_weight + item["weight"] <= capacity:
            selections.append({
                "index": item["index"],
                "fraction": 1.0,
                "weight_taken": item["weight"],
                "value_gained": item["value"]
            })
            total_value += item["value"]
            current_weight += item["weight"]
        else:
            remaining = capacity - current_weight
            if remaining > 0:
                fraction = remaining / item["weight"]
                val = item["value"] * fraction
                selections.append({
                    "index": item["index"],
                    "fraction": fraction,
                    "weight_taken": remaining,
                    "value_gained": val
                })
                total_value += val
                current_weight += remaining
            break
            
    return {
        "max_value": total_value,
        "selections": selections,
        "sorted_ratios": sorted_items
    }
