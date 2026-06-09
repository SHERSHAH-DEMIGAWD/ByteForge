"""
Run-Length Encoding (RLE)
Paradigm: Brute Force / Sequential counting
Time Complexity: O(N) where N is the length of the input data.
Space Complexity: O(N) in the worst case (no runs), O(1) auxiliary space.

Explanation: RLE is a simple form of lossless data compression in which runs of data 
(sequences in which the same data value occurs in many consecutive data elements) 
are stored as a single data value and count, rather than as the original run.
"""

def compress(data: bytes) -> tuple[bytes, float, list[tuple[int, int]]]:
    """
    Compresses data using Run-Length Encoding.
    Returns:
        - compressed_data (bytes)
        - compression_ratio (float)
        - runs (list of tuples for visualization: (count, value))
    """
    if not data:
        return b"", 1.0, []

    runs = []
    compressed = bytearray()
    
    current_byte = data[0]
    count = 1
    
    for byte in data[1:]:
        if byte == current_byte and count < 255:
            count += 1
        else:
            runs.append((count, current_byte))
            compressed.append(count)
            compressed.append(current_byte)
            current_byte = byte
            count = 1
            
    runs.append((count, current_byte))
    compressed.append(count)
    compressed.append(current_byte)
    
    ratio = len(data) / len(compressed) if compressed else 1.0
    return bytes(compressed), ratio, runs

def decompress(compressed_data: bytes) -> bytes:
    """
    Decompresses RLE compressed data.
    """
    if not compressed_data:
        return b""
        
    decompressed = bytearray()
    # Data is in pairs of (count, value)
    for i in range(0, len(compressed_data), 2):
        count = compressed_data[i]
        value = compressed_data[i+1]
        decompressed.extend(bytes([value]) * count)
        
    return bytes(decompressed)
