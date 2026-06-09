"""
Huffman Coding
Paradigm: Greedy Algorithm
Time Complexity: O(N log K) where N is the length of data, K is number of unique characters.
Space Complexity: O(K) for the tree and codebook.

Explanation: Huffman coding assigns variable-length binary codes to characters based on their frequencies.
More frequent characters get shorter codes, while less frequent ones get longer codes, resulting in overall smaller file sizes.
"""
import heapq
from collections import Counter

class Node:
    def __init__(self, char, freq):
        self.char = char
        self.freq = freq
        self.left = None
        self.right = None

    def __lt__(self, other):
        return self.freq < other.freq

def build_tree(data: bytes):
    if not data:
        return None
    
    freq_map = Counter(data)
    heap = [Node(char, freq) for char, freq in freq_map.items()]
    heapq.heapify(heap)

    while len(heap) > 1:
        left = heapq.heappop(heap)
        right = heapq.heappop(heap)
        merged = Node(None, left.freq + right.freq)
        merged.left = left
        merged.right = right
        heapq.heappush(heap, merged)

    return heap[0] if heap else None

def build_codebook(node, prefix="", codebook=None):
    if codebook is None:
        codebook = {}
    
    if node is not None:
        if node.char is not None:
            codebook[node.char] = prefix
        build_codebook(node.left, prefix + "0", codebook)
        build_codebook(node.right, prefix + "1", codebook)
        
    return codebook

def encode_bitstring(data, codebook):
    return "".join(codebook[byte] for byte in data)

def bitstring_to_bytes(bitstring):
    # Padding
    padding_length = 8 - (len(bitstring) % 8)
    if padding_length == 8:
        padding_length = 0
    
    padded_bitstring = bitstring + "0" * padding_length
    padded_info = f"{padding_length:08b}"
    
    final_bitstring = padded_info + padded_bitstring
    
    byte_array = bytearray()
    for i in range(0, len(final_bitstring), 8):
        byte = final_bitstring[i:i+8]
        byte_array.append(int(byte, 2))
        
    return bytes(byte_array)

def compress(data: bytes) -> tuple[bytes, float, dict, Node, str, list]:
    """
    Compresses data using Huffman Coding.
    Returns:
        - compressed_data (bytes)
        - compression_ratio (float)
        - codebook (dict)
        - tree_root (Node)
        - encoded_bitstring (str) for visualization
        - step_log (list) for visualization
    """
    if not data:
        return b"", 1.0, {}, None, "", []

    step_log = []
    step_log.append("1. Calculating character frequencies.")
    freq_map = Counter(data)
    
    step_log.append("2. Building Min-Heap for Huffman Tree.")
    tree_root = build_tree(data)
    
    step_log.append("3. Generating Codebook from Tree.")
    codebook = build_codebook(tree_root)
    # Handle single character case
    if len(codebook) == 1:
        codebook[list(codebook.keys())[0]] = "0"
        
    step_log.append("4. Encoding data to bitstring.")
    encoded_bitstring = encode_bitstring(data, codebook)
    
    compressed_bytes = bitstring_to_bytes(encoded_bitstring)
    
    # In a real scenario, we'd need to store the tree/codebook in the compressed file too,
    # but for this academic demo, we just return the compressed payload size.
    # To be fair, let's add an estimate for the tree size to the compressed length.
    tree_size_estimate = len(codebook) * 3 # roughly 3 bytes per unique char
    total_compressed_size = len(compressed_bytes) + tree_size_estimate
    
    ratio = len(data) / total_compressed_size if total_compressed_size else 1.0
    
    return compressed_bytes, ratio, codebook, tree_root, encoded_bitstring, step_log

def decompress(compressed_data: bytes, codebook: dict) -> bytes:
    """
    Decompresses Huffman encoded data. Needs the codebook!
    """
    if not compressed_data or not codebook:
        return b""
        
    # Convert bytes back to bitstring
    bitstring = ""
    for byte in compressed_data:
        bitstring += f"{byte:08b}"
        
    # Remove padding
    padding_length = int(bitstring[:8], 2)
    bitstring = bitstring[8:]
    if padding_length > 0:
        bitstring = bitstring[:-padding_length]
        
    # Reverse codebook
    reverse_codebook = {v: k for k, v in codebook.items()}
    
    decompressed = bytearray()
    current_code = ""
    
    for bit in bitstring:
        current_code += bit
        if current_code in reverse_codebook:
            decompressed.append(reverse_codebook[current_code])
            current_code = ""
            
    return bytes(decompressed)
