import time
import tracemalloc
import threading
import sys

def profile_algorithm(func, *args, **kwargs):
    """
    Profiles an algorithm's time and space complexity.
    Returns:
        result (tuple): The algorithm's return value
        peak_memory (float): Peak memory usage in MB
        exec_time (float): Execution time in milliseconds
    """
    tracemalloc.start()
    
    start_time = time.perf_counter()
    
    try:
        result = func(*args, **kwargs)
    except Exception as e:
        tracemalloc.stop()
        raise e
        
    exec_time = (time.perf_counter() - start_time) * 1000
    
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    
    peak_memory_mb = peak / (1024 * 1024)
    
    return result, peak_memory_mb, exec_time
