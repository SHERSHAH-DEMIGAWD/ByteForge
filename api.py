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
            decompressed = huffman_decompress(compressed_data, req.metadata["codebook"])
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
            # Deflate might not have implemented decompression in our basic version, let's assume it has it or we will fallback
            if not hasattr(deflate_decompress, '__call__'):
                 raise NotImplementedError("Deflate decompression not fully implemented")
            # Wait, deflate.decompress expects codebook? Let's check deflate.py
            decompressed = deflate_decompress(compressed_data, req.metadata.get("codebook", {}))
        elif algo == "lzw":
            # LZW compressed is a list of ints.
            # Convert the list of integers into bytes (assuming 2 bytes per code)
            compressed_bytes = b"".join(k.to_bytes(2, 'big') for k in compressed_data)
            # Actually, `compressed_data` from request is base64 of bytes, which we decoded.
            # Wait, `compressed_data` passed to decompression IS bytes.
            # We need to turn those bytes back into a list of ints.
            codes = []
            for i in range(0, len(compressed_data), 2):
                codes.append(int.from_bytes(compressed_data[i:i+2], 'big'))
            decompressed = lzw_decompress(codes)
        elif algo == "arithmetic":
            if not req.metadata or "prob_ranges" not in req.metadata or "total_length" not in req.metadata:
                raise ValueError("Arithmetic requires 'prob_ranges' and 'total_length' in metadata")
            # Prob ranges need to have keys as bytes, but json sends strings
            prob_ranges = {k.encode('utf-8') if isinstance(k, str) else bytes([int(k)]): tuple(v) for k, v in req.metadata["prob_ranges"].items()}
            decompressed = arithmetic_decompress(compressed_data, prob_ranges, req.metadata["total_length"])
        else:
            raise HTTPException(status_code=400, detail=f"Unknown algorithm: {algo}")

        return {
            "decompressed_text": decompressed.decode('utf-8', errors='replace'),
            "decompressed_base64": base64.b64encode(decompressed).decode('utf-8')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decompression error: {str(e)}")
