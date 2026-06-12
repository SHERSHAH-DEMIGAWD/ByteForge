import time
import base64
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from algorithms.huffman import compress as huffman_compress
from algorithms.rle import compress as rle_compress
from algorithms.lz77 import compress as lz77_naive, compress_optimized as lz77_opt
from algorithms.bwt import compress as bwt_compress
from algorithms.deflate import compress as deflate_compress
from algorithms.entropy import calculate_shannon_entropy, get_theoretical_minimum_size
from algorithms.lzw import lzw_compress
from algorithms.arithmetic import arithmetic_compress
from algorithms.huffman import decompress as huffman_decompress
from algorithms.rle import decompress as rle_decompress
from algorithms.lz77 import decompress as lz77_decompress
from algorithms.bwt import decompress as bwt_decompress
from algorithms.deflate import decompress as deflate_decompress
from algorithms.lzw import lzw_decompress
from algorithms.arithmetic import arithmetic_decompress
from utils.profiler import profile_algorithm

from algorithms.string_matching import naive_search, horspool_search, boyer_moore_search, kmp_search
from algorithms.knapsack import solve_01_knapsack, solve_fractional_knapsack
from algorithms.dijkstra import solve_dijkstra
from algorithms.topological import solve_kahns_topological, solve_dfs_topological
from algorithms.bellman_ford import solve_bellman_ford
from algorithms.astar import solve_astar
from algorithms.lcs import solve_lcs
from algorithms.nqueens import solve_nqueens
from algorithms.strassen import solve_strassen

from algorithms.sorting import quick_sort_trace, merge_sort_trace, heap_sort_trace, counting_sort_trace, bubble_sort_trace, selection_sort_trace
from algorithms.mst import solve_kruskals, solve_prims
from algorithms.recursion import get_fibonacci_naive_trace, get_fibonacci_memoized_trace, get_merge_sort_split_trace

app = FastAPI(title="ByteForge Compression API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CompressRequest(BaseModel):
    data: str
    algorithms: List[str]
    mode: str = "optimized"
    is_base64: bool = False

@app.post("/compress")
async def compress(req: CompressRequest):
    if not req.data:
        raise HTTPException(status_code=400, detail="No data provided")

    try:
        # Decode if base64, otherwise assume text and encode to bytes
        if req.is_base64:
            raw_data = base64.b64decode(req.data)
        else:
            raw_data = req.data.encode('utf-8')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Data decoding error: {str(e)}")

    entropy = calculate_shannon_entropy(raw_data)
    theoretical_min_size = get_theoretical_minimum_size(raw_data)

    results = {
        "original_size": len(raw_data),
        "shannon_entropy": entropy,
        "theoretical_min_size": theoretical_min_size,
        "algorithms": {}
    }

    algos = set(req.algorithms)
    is_opt = (req.mode == "optimized")

    if "huffman" in algos:
        try:
            res, t, m = profile_algorithm(huffman_compress, raw_data)
            results["algorithms"]["huffman"] = {
                "size": len(res[0]),
                "ratio": len(raw_data) / max(1, len(res[0])),
                "time": t,
                "memory": m,
                "codebook": res[2],
                "payload_base64": base64.b64encode(res[0]).decode('utf-8')
            }
        except Exception as e:
            results["algorithms"]["huffman"] = {"error": str(e)}

    if "rle" in algos:
        try:
            res, t, m = profile_algorithm(rle_compress, raw_data)
            results["algorithms"]["rle"] = {
                "size": len(res[0]),
                "ratio": len(raw_data) / max(1, len(res[0])),
                "time": t,
                "memory": m,
                "payload_base64": base64.b64encode(res[0]).decode('utf-8')
            }
        except Exception as e:
            results["algorithms"]["rle"] = {"error": str(e)}

    if "lz77" in algos:
        try:
            func = lz77_opt if is_opt else lz77_naive
            res, t, m = profile_algorithm(func, raw_data)
            tokens = [{"offset": tk[0], "length": tk[1], "next": chr(tk[2][0]) if isinstance(tk[2], bytes) and tk[2] else ""} for tk in res[2][:100]]
            results["algorithms"]["lz77"] = {
                "size": len(res[0]), 
                "ratio": len(raw_data) / max(1, len(res[0])),
                "time": t,
                "memory": m,
                "tokens": tokens,
                "payload_base64": base64.b64encode(res[0]).decode('utf-8')
            }
        except Exception as e:
            results["algorithms"]["lz77"] = {"error": str(e)}

    if "bwt" in algos:
        try:
            res, t, m = profile_algorithm(bwt_compress, raw_data, is_opt)
            results["algorithms"]["bwt"] = {
                "size": len(res[0]),
                "ratio": len(raw_data) / max(1, len(res[0])),
                "time": t,
                "memory": m,
                "payload_base64": base64.b64encode(res[0]).decode('utf-8')
            }
        except Exception as e:
            results["algorithms"]["bwt"] = {"error": str(e)}

    if "deflate" in algos:
        try:
            res, t, m = profile_algorithm(deflate_compress, raw_data, is_opt)
            results["algorithms"]["deflate"] = {
                "size": len(res[0]),
                "ratio": len(raw_data) / max(1, len(res[0])),
                "time": t,
                "memory": m,
                "payload_base64": base64.b64encode(res[0]).decode('utf-8')
            }
        except Exception as e:
            results["algorithms"]["deflate"] = {"error": str(e)}

    if "lzw" in algos:
        try:
            res, t, m = profile_algorithm(lzw_compress, raw_data)
            # Encode list of ints to bytes (2 bytes per int)
            compressed_bytes = b"".join(x.to_bytes(2, 'big') for x in res)
            results["algorithms"]["lzw"] = {
                "size": len(res) * 2, # Rough estimate (each code is usually 12-16 bits)
                "ratio": len(raw_data) / max(1, len(res) * 2),
                "time": t,
                "memory": m,
                "payload_base64": base64.b64encode(compressed_bytes).decode('utf-8')
            }
        except Exception as e:
            results["algorithms"]["lzw"] = {"error": str(e)}

    if "arithmetic" in algos:
        try:
            res, t, m = profile_algorithm(arithmetic_compress, raw_data)
            results["algorithms"]["arithmetic"] = {
                "size": len(res[0]),
                "ratio": len(raw_data) / max(1, len(res[0])),
                "time": t,
                "memory": m,
                "prob_ranges": {k.decode('utf-8') if isinstance(k, bytes) else str(k): v for k, v in res[1].items()},
                "payload_base64": base64.b64encode(res[0]).decode('utf-8')
            }
        except Exception as e:
            results["algorithms"]["arithmetic"] = {"error": str(e)}

    return results

class DecompressRequest(BaseModel):
    data_base64: str
    algorithm: str
    metadata: Optional[Dict[str, Any]] = None

@app.post("/decompress")
async def decompress_endpoint(req: DecompressRequest):
    if not req.data_base64 or not req.algorithm:
        raise HTTPException(status_code=400, detail="Missing data or algorithm")

    try:
        compressed_data = base64.b64decode(req.data_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Base64 decoding error: {str(e)}")

    algo = req.algorithm
    try:
        if algo == "huffman":
            if not req.metadata or "codebook" not in req.metadata:
                raise ValueError("Huffman requires a 'codebook' in metadata")
            
            # JSON serialization converts int keys to strings, need to convert them back
            codebook = {int(k): v for k, v in req.metadata["codebook"].items()}
            decompressed = huffman_decompress(compressed_data, codebook)
        elif algo == "rle":
            decompressed = rle_decompress(compressed_data)
        elif algo == "lz77":
            if not req.metadata or "tokens" not in req.metadata:
                raise ValueError("LZ77 requires 'tokens' in metadata")
            # tokens from json might need parsing
            tokens = []
            for tk in req.metadata["tokens"]:
                tokens.append((tk["offset"], tk["length"], tk["next"].encode('utf-8') if tk["next"] else b""))
            decompressed = lz77_decompress(tokens)
        elif algo == "bwt":
            decompressed = bwt_decompress(compressed_data)
        elif algo == "deflate":
            if not hasattr(deflate_decompress, '__call__'):
                 raise NotImplementedError("Deflate decompression not fully implemented")
            decompressed = deflate_decompress(compressed_data, req.metadata.get("codebook", {}))
        elif algo == "lzw":
            codes = []
            for i in range(0, len(compressed_data), 2):
                codes.append(int.from_bytes(compressed_data[i:i+2], 'big'))
            decompressed = lzw_decompress(codes)
        elif algo == "arithmetic":
            if not req.metadata or "prob_ranges" not in req.metadata or "total_length" not in req.metadata:
                raise ValueError("Arithmetic requires 'prob_ranges' and 'total_length' in metadata")
            prob_ranges = {int(k): tuple(v) for k, v in req.metadata["prob_ranges"].items()}
            decompressed = arithmetic_decompress(compressed_data, prob_ranges, req.metadata["total_length"])
        else:
            raise HTTPException(status_code=400, detail=f"Unknown algorithm: {algo}")

        return {
            "decompressed_text": decompressed.decode('utf-8', errors='replace'),
            "decompressed_base64": base64.b64encode(decompressed).decode('utf-8')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decompression error: {str(e)}")

class StringMatchingRequest(BaseModel):
    text: str
    pattern: str

@app.post("/string-matching")
async def string_matching_endpoint(req: StringMatchingRequest):
    if not req.text or not req.pattern:
        raise HTTPException(status_code=400, detail="Missing text or pattern")
    
    try:
        naive_res = naive_search(req.text, req.pattern)
        horspool_res = horspool_search(req.text, req.pattern)
        bm_res = boyer_moore_search(req.text, req.pattern)
        kmp_res = kmp_search(req.text, req.pattern)

        return {
            "naive": naive_res,
            "horspool": horspool_res,
            "boyer_moore": bm_res,
            "kmp": kmp_res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"String matching error: {str(e)}")

class KnapsackRequest(BaseModel):
    weights: List[int]
    values: List[int]
    capacity: int

@app.post("/knapsack")
async def knapsack_endpoint(req: KnapsackRequest):
    if not req.weights or not req.values or req.capacity <= 0:
        raise HTTPException(status_code=400, detail="Invalid inputs")
    if len(req.weights) != len(req.values):
        raise HTTPException(status_code=400, detail="Weights and values list size mismatch")
        
    try:
        dp_res = solve_01_knapsack(req.weights, req.values, req.capacity)
        greedy_res = solve_fractional_knapsack(req.weights, req.values, req.capacity)
        
        return {
            "dp": dp_res,
            "greedy": greedy_res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Knapsack solver error: {str(e)}")

class DijkstraRequest(BaseModel):
    graph: Dict[str, Dict[str, int]]
    start: str
    end: str

@app.post("/dijkstra-routing")
async def dijkstra_endpoint(req: DijkstraRequest):
    if not req.graph or not req.start or not req.end:
        raise HTTPException(status_code=400, detail="Missing graph, start or end node")
        
    try:
        res = solve_dijkstra(req.graph, req.start, req.end)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dijkstra solver error: {str(e)}")

class TopologicalRequest(BaseModel):
    graph: Dict[str, List[str]]

@app.post("/topological-scheduler")
async def topological_endpoint(req: TopologicalRequest):
    if not req.graph:
        raise HTTPException(status_code=400, detail="Missing graph structure")
        
    try:
        kahns_res = solve_kahns_topological(req.graph)
        dfs_res = solve_dfs_topological(req.graph)
        
        return {
            "kahns": kahns_res,
            "dfs": dfs_res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Topological sort error: {str(e)}")

class BellmanFordRequest(BaseModel):
    graph: Dict[str, Dict[str, int]]
    start: str
    end: Optional[str] = None

@app.post("/bellman-ford")
async def bellman_ford_endpoint(req: BellmanFordRequest):
    if not req.graph or not req.start:
        raise HTTPException(status_code=400, detail="Missing graph or start node")
    if len(req.graph) > 26:
        raise HTTPException(status_code=400, detail="Graph capped at 26 vertices for visualization")
    try:
        return solve_bellman_ford(req.graph, req.start, req.end)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bellman-Ford solver error: {str(e)}")

class AStarRequest(BaseModel):
    rows: int
    cols: int
    walls: List[List[int]] = []
    start: List[int]
    goal: List[int]

@app.post("/astar")
async def astar_endpoint(req: AStarRequest):
    if req.rows < 2 or req.cols < 2 or req.rows > 30 or req.cols > 40:
        raise HTTPException(status_code=400, detail="Grid must be between 2x2 and 30x40")
    if len(req.start) != 2 or len(req.goal) != 2:
        raise HTTPException(status_code=400, detail="Start and goal must be [row, col] pairs")
    try:
        return solve_astar(req.rows, req.cols, req.walls, req.start, req.goal)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"A* solver error: {str(e)}")

class LCSRequest(BaseModel):
    a: str
    b: str

@app.post("/lcs")
async def lcs_endpoint(req: LCSRequest):
    if not req.a or not req.b:
        raise HTTPException(status_code=400, detail="Both strings are required")
    if len(req.a) > 30 or len(req.b) > 30:
        raise HTTPException(status_code=400, detail="Strings capped at 30 characters so the DP table stays readable")
    try:
        return solve_lcs(req.a, req.b)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LCS solver error: {str(e)}")

class NQueensRequest(BaseModel):
    n: int

@app.post("/nqueens")
async def nqueens_endpoint(req: NQueensRequest):
    try:
        return solve_nqueens(req.n)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"N-Queens solver error: {str(e)}")

class StrassenRequest(BaseModel):
    a: List[List[int]]
    b: List[List[int]]

@app.post("/strassen")
async def strassen_endpoint(req: StrassenRequest):
    try:
        return solve_strassen(req.a, req.b)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Strassen solver error: {str(e)}")

class BatchProfileRequest(BaseModel):
    algorithm: str
    data: str
    sizes: List[int]
    mode: str = "optimized"

@app.post("/batch-profile")
async def batch_profile_endpoint(req: BatchProfileRequest):
    if not req.algorithm or not req.data or not req.sizes:
        raise HTTPException(status_code=400, detail="Missing algorithm, data, or sizes")
        
    try:
        raw_data = req.data.encode('utf-8')
        results = []
        is_opt = (req.mode == "optimized")
        
        # Determine the target function
        if req.algorithm == "huffman":
            func = huffman_compress
        elif req.algorithm == "lz77":
            func = lz77_opt if is_opt else lz77_naive
        elif req.algorithm == "rle":
            func = rle_compress
        elif req.algorithm == "bwt":
            # Wrap to pass optimized flag
            def wrapped_bwt(d):
                return bwt_compress(d, is_opt)
            func = wrapped_bwt
        elif req.algorithm == "deflate":
            # Wrap to pass optimized flag
            def wrapped_deflate(d):
                return deflate_compress(d, is_opt)
            func = wrapped_deflate
        elif req.algorithm == "lzw":
            func = lzw_compress
        elif req.algorithm == "arithmetic":
            func = arithmetic_compress
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported algorithm for profiling: {req.algorithm}")
            
        for size in req.sizes:
            chunk = raw_data[:size]
            if not chunk:
                continue
            res, t, m = profile_algorithm(func, chunk)
            results.append({
                "inputSize": len(chunk),
                "time": t,
                "memory": m
            })
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch profiling error: {str(e)}")

class SortingRequest(BaseModel):
    array: List[int]

@app.post("/sorting-trace")
async def sorting_endpoint(req: SortingRequest):
    if not req.array:
        raise HTTPException(status_code=400, detail="Missing array input")
    try:
        # Generate copies so modifications do not interfere
        quick_res = quick_sort_trace(list(req.array))
        merge_res = merge_sort_trace(list(req.array))
        heap_res = heap_sort_trace(list(req.array))
        counting_res = counting_sort_trace(list(req.array))
        bubble_res = bubble_sort_trace(list(req.array))
        selection_res = selection_sort_trace(list(req.array))
        
        return {
            "quick": quick_res,
            "merge": merge_res,
            "heap": heap_res,
            "counting": counting_res,
            "bubble": bubble_res,
            "selection": selection_res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sorting trace error: {str(e)}")

class MSTRequest(BaseModel):
    graph: Dict[str, Dict[str, int]]
    start_vertex: Optional[str] = None

@app.post("/mst-trace")
async def mst_endpoint(req: MSTRequest):
    if not req.graph:
        raise HTTPException(status_code=400, detail="Missing graph structure")
    try:
        kruskal_res = solve_kruskals(req.graph)
        prim_res = solve_prims(req.graph, req.start_vertex)
        return {
            "kruskal": kruskal_res,
            "prim": prim_res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MST solver error: {str(e)}")

class RecursionRequest(BaseModel):
    n: int
    array: Optional[List[int]] = None

@app.post("/recursion-trace")
async def recursion_endpoint(req: RecursionRequest):
    if req.n < 0 or req.n > 8:
        raise HTTPException(status_code=400, detail="Fibonacci n must be between 0 and 8 to prevent call tree bloating")
    try:
        fib_naive = get_fibonacci_naive_trace(req.n)
        fib_memo = get_fibonacci_memoized_trace(req.n)
        
        arr = req.array or [8, 3, 2, 9, 1]
        merge_split = get_merge_sort_split_trace(arr)
        
        return {
            "fib_naive": fib_naive,
            "fib_memo": fib_memo,
            "merge_split": merge_split
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recursion trace error: {str(e)}")


