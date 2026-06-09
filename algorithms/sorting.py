import copy

def quick_sort_trace(arr):
    steps = []
    
    # Trace initial array state
    steps.append({
        "array": list(arr),
        "pivot_idx": -1,
        "left_ptr": -1,
        "right_ptr": -1,
        "swap": None,
        "bounds": [0, len(arr) - 1],
        "description": "Initial array state before Quick Sort."
    })
    
    def partition(low, high):
        pivot = arr[high]
        pivot_idx = high
        i = low - 1
        
        steps.append({
            "array": list(arr),
            "pivot_idx": pivot_idx,
            "left_ptr": low,
            "right_ptr": high - 1,
            "swap": None,
            "bounds": [low, high],
            "description": f"Selected pivot element {pivot} at index {high}."
        })
        
        for j in range(low, high):
            steps.append({
                "array": list(arr),
                "pivot_idx": pivot_idx,
                "left_ptr": i if i >= 0 else low,
                "right_ptr": j,
                "swap": None,
                "bounds": [low, high],
                "description": f"Scanning element {arr[j]} at index {j}."
            })
            
            if arr[j] < pivot:
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
                steps.append({
                    "array": list(arr),
                    "pivot_idx": pivot_idx,
                    "left_ptr": i,
                    "right_ptr": j,
                    "swap": [i, j],
                    "bounds": [low, high],
                    "description": f"Swapped {arr[i]} and {arr[j]} (element at index {j} is smaller than pivot {pivot})."
                })
        
        arr[i+1], arr[high] = arr[high], arr[i+1]
        steps.append({
            "array": list(arr),
            "pivot_idx": i + 1,
            "left_ptr": i + 1,
            "right_ptr": high,
            "swap": [i + 1, high],
            "bounds": [low, high],
            "description": f"Placed pivot element {pivot} into its correct sorted position at index {i + 1}."
        })
        return i + 1

    def quick_sort(low, high):
        if low < high:
            pi = partition(low, high)
            quick_sort(low, pi - 1)
            quick_sort(pi + 1, high)
            
    # Run sort on a copy
    work_arr = list(arr)
    arr = work_arr
    quick_sort(0, len(arr) - 1)
    
    steps.append({
        "array": list(arr),
        "pivot_idx": -1,
        "left_ptr": -1,
        "right_ptr": -1,
        "swap": None,
        "bounds": [0, len(arr) - 1],
        "description": "Quick Sort completed. All subarrays partitioned and sorted."
    })
    
    return steps

def merge_sort_trace(arr):
    steps = []
    
    steps.append({
        "array": list(arr),
        "left": 0,
        "mid": -1,
        "right": len(arr) - 1,
        "type": "initial",
        "description": "Initial array state before Merge Sort recursion."
    })

    def merge(low, mid, high):
        left_sub = arr[low:mid+1]
        right_sub = arr[mid+1:high+1]
        
        steps.append({
            "array": list(arr),
            "left": low,
            "mid": mid,
            "right": high,
            "type": "split",
            "description": f"Split array slice into left subsegment {left_sub} and right subsegment {right_sub}."
        })
        
        i = j = 0
        k = low
        
        temp_arr = []
        
        while i < len(left_sub) and j < len(right_sub):
            if left_sub[i] <= right_sub[j]:
                arr[k] = left_sub[i]
                temp_arr.append(left_sub[i])
                i += 1
            else:
                arr[k] = right_sub[j]
                temp_arr.append(right_sub[j])
                j += 1
            
            steps.append({
                "array": list(arr),
                "left": low,
                "mid": mid,
                "right": high,
                "type": "merge",
                "temp_array": list(temp_arr),
                "description": f"Comparing and merging: took value {arr[k]}."
            })
            k += 1
            
        while i < len(left_sub):
            arr[k] = left_sub[i]
            temp_arr.append(left_sub[i])
            steps.append({
                "array": list(arr),
                "left": low,
                "mid": mid,
                "right": high,
                "type": "merge",
                "temp_array": list(temp_arr),
                "description": f"Merged remaining item from left subsegment: {left_sub[i]}."
            })
            i += 1
            k += 1
            
        while j < len(right_sub):
            arr[k] = right_sub[j]
            temp_arr.append(right_sub[j])
            steps.append({
                "array": list(arr),
                "left": low,
                "mid": mid,
                "right": high,
                "type": "merge",
                "temp_array": list(temp_arr),
                "description": f"Merged remaining item from right subsegment: {right_sub[j]}."
            })
            j += 1
            k += 1

    def merge_sort(low, high):
        if low < high:
            mid = (low + high) // 2
            merge_sort(low, mid)
            merge_sort(mid + 1, high)
            merge(low, mid, high)

    work_arr = list(arr)
    arr = work_arr
    merge_sort(0, len(arr) - 1)
    
    steps.append({
        "array": list(arr),
        "left": 0,
        "mid": -1,
        "right": len(arr) - 1,
        "type": "final",
        "description": "Merge Sort completed. Subarrays merged back in sorted order."
    })
    return steps

def heap_sort_trace(arr):
    steps = []
    n = len(arr)
    
    steps.append({
        "array": list(arr),
        "heap_size": n,
        "action": "initial",
        "active_indices": [],
        "description": "Initial array state before Heap Sort."
    })

    def heapify(size, root):
        largest = root
        left = 2 * root + 1
        right = 2 * root + 2
        
        steps.append({
            "array": list(arr),
            "heap_size": size,
            "action": "heapify_inspect",
            "active_indices": [root, left, right],
            "description": f"Inspecting root node {arr[root]} at index {root} and children indices {[left, right]}."
        })
        
        if left < size and arr[left] > arr[largest]:
            largest = left
        if right < size and arr[right] > arr[largest]:
            largest = right
            
        if largest != root:
            arr[root], arr[largest] = arr[largest], arr[root]
            steps.append({
                "array": list(arr),
                "heap_size": size,
                "action": "heapify_swap",
                "active_indices": [root, largest],
                "description": f"Swapped parent {arr[largest]} and child {arr[root]} to satisfy Max-Heap property."
            })
            heapify(size, largest)

    # 1. Build max heap
    steps.append({
        "array": list(arr),
        "heap_size": n,
        "action": "build_heap_start",
        "active_indices": [],
        "description": "Building Max-Heap starting from the last non-leaf node."
    })
    for i in range(n // 2 - 1, -1, -1):
        heapify(n, i)
        
    steps.append({
        "array": list(arr),
        "heap_size": n,
        "action": "heap_built",
        "active_indices": [],
        "description": "Max-Heap successfully built. Commencing element extraction."
    })

    # 2. Extract elements one by one
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]
        steps.append({
            "array": list(arr),
            "heap_size": i,
            "action": "extract_swap",
            "active_indices": [0, i],
            "description": f"Swapped root {arr[i]} (maximum value) with leaf {arr[0]} at index {i} and reduced heap size."
        })
        heapify(i, 0)
        
    steps.append({
        "array": list(arr),
        "heap_size": 0,
        "action": "final",
        "active_indices": [],
        "description": "Heap Sort completed. Sorted array built from right to left."
    })
    return steps

def counting_sort_trace(arr):
    steps = []
    
    # Bound input to non-negative integers
    arr = [max(0, int(x)) for x in arr]
    max_val = max(arr) if arr else 0
    n = len(arr)
    
    steps.append({
        "array": list(arr),
        "counts": [0] * (max_val + 1),
        "cumulative": [0] * (max_val + 1),
        "output": [-1] * n,
        "active_idx": -1,
        "description": "Initial state before Counting Sort."
    })
    
    # 1. Frequencies
    counts = [0] * (max_val + 1)
    for idx, x in enumerate(arr):
        counts[x] += 1
        steps.append({
            "array": list(arr),
            "counts": list(counts),
            "cumulative": [0] * (max_val + 1),
            "output": [-1] * n,
            "active_idx": idx,
            "description": f"Counting frequency of element {x} at index {idx}."
        })
        
    # 2. Cumulative counts
    cumulative = list(counts)
    for i in range(1, len(cumulative)):
        cumulative[i] += cumulative[i-1]
        steps.append({
            "array": list(arr),
            "counts": list(counts),
            "cumulative": list(cumulative),
            "output": [-1] * n,
            "active_idx": i,
            "description": f"Accumulating values in count array: Index {i} has {cumulative[i]} elements <= {i}."
        })
        
    # 3. Output placement
    output = [-1] * n
    # Reverse scan for stability
    for i in range(n - 1, -1, -1):
        val = arr[i]
        pos = cumulative[val] - 1
        output[pos] = val
        cumulative[val] -= 1
        steps.append({
            "array": list(arr),
            "counts": list(counts),
            "cumulative": list(cumulative),
            "output": list(output),
            "active_idx": i,
            "description": f"Placed element {val} at index {i} to output position {pos} using cumulative offset."
        })
        
    steps.append({
        "array": list(output),
        "counts": list(counts),
        "cumulative": list(cumulative),
        "output": list(output),
        "active_idx": -1,
        "description": "Counting Sort completed. Stable output array fully constructed."
    })
    return steps

def bubble_sort_trace(arr):
    steps = []
    n = len(arr)
    work_arr = list(arr)
    
    steps.append({
        "array": list(work_arr),
        "active_indices": [],
        "swap": None,
        "description": "Initial array state before Bubble Sort."
    })
    
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            steps.append({
                "array": list(work_arr),
                "active_indices": [j, j + 1],
                "swap": None,
                "description": f"Comparing element {work_arr[j]} at index {j} and {work_arr[j+1]} at index {j+1}."
            })
            
            if work_arr[j] > work_arr[j+1]:
                work_arr[j], work_arr[j+1] = work_arr[j+1], work_arr[j]
                swapped = True
                steps.append({
                    "array": list(work_arr),
                    "active_indices": [j, j + 1],
                    "swap": [j, j + 1],
                    "description": f"Swapped elements {work_arr[j+1]} and {work_arr[j]} since {work_arr[j+1]} > {work_arr[j]}."
                })
        if not swapped:
            steps.append({
                "array": list(work_arr),
                "active_indices": [],
                "swap": None,
                "description": "No swaps occurred in this pass. Array is fully sorted."
            })
            break
            
    if swapped:
        steps.append({
            "array": list(work_arr),
            "active_indices": [],
            "swap": None,
            "description": "Bubble Sort completed. All elements are sorted."
        })
        
    return steps

def selection_sort_trace(arr):
    steps = []
    n = len(arr)
    work_arr = list(arr)
    
    steps.append({
        "array": list(work_arr),
        "active_indices": [],
        "swap": None,
        "description": "Initial array state before Selection Sort."
    })
    
    for i in range(n):
        min_idx = i
        steps.append({
            "array": list(work_arr),
            "active_indices": [i],
            "swap": None,
            "description": f"Starting pass {i+1}: Assuming current element {work_arr[i]} at index {i} is the minimum."
        })
        
        for j in range(i + 1, n):
            steps.append({
                "array": list(work_arr),
                "active_indices": [min_idx, j],
                "swap": None,
                "description": f"Comparing current minimum {work_arr[min_idx]} at index {min_idx} with element {work_arr[j]} at index {j}."
            })
            if work_arr[j] < work_arr[min_idx]:
                min_idx = j
                steps.append({
                    "array": list(work_arr),
                    "active_indices": [min_idx],
                    "swap": None,
                    "description": f"New minimum found: {work_arr[min_idx]} at index {min_idx}."
                })
                
        if min_idx != i:
            work_arr[i], work_arr[min_idx] = work_arr[min_idx], work_arr[i]
            steps.append({
                "array": list(work_arr),
                "active_indices": [i, min_idx],
                "swap": [i, min_idx],
                "description": f"Swapped minimum element {work_arr[i]} with {work_arr[min_idx]} to place it at sorted index {i}."
            })
        else:
            steps.append({
                "array": list(work_arr),
                "active_indices": [i],
                "swap": None,
                "description": f"Minimum element {work_arr[i]} is already in the correct position at index {i}."
            })
            
    steps.append({
        "array": list(work_arr),
        "active_indices": [],
        "swap": None,
        "description": "Selection Sort completed. All elements are sorted."
    })
    
    return steps

