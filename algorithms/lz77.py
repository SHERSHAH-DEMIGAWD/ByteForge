"""
LZ77 Compression
Paradigm: Sliding Window / Divide & Conquer
Time Complexity: O(N * W) where N is data length, W is window size.
Space Complexity: O(W) for the window.

Explanation: LZ77 uses a sliding window to find repeated sequences of characters.
It replaces repeated sequences with a reference (offset, length) to a previous occurrence,
along with the next non-matching character.
"""

def compress(data: bytes, search_window_size=2048, lookahead_buffer_size=255) -> tuple[bytes, float, list[tuple[int, int, bytes]]]:
    """
    Compresses data using LZ77.
    Returns:
        - compressed_data (bytes) - simplistic binary representation
        - compression_ratio (float)
        - tokens (list of (offset, length, next_char) tuples)
    """
    if not data:
        return b"", 1.0, []

    tokens = []
    i = 0
    data_len = len(data)
    
    while i < data_len:
        search_start = max(0, i - search_window_size)
        search_buffer = data[search_start:i]
        lookahead_buffer = data[i:min(i + lookahead_buffer_size, data_len)]
        
        best_offset = 0
        best_length = 0
        
        # Find the longest match in the search buffer
        for length in range(1, len(lookahead_buffer)):
            match_str = lookahead_buffer[:length]
            # Reverse search to find the closest match
            idx = search_buffer.rfind(match_str)
            if idx != -1:
                best_offset = len(search_buffer) - idx
                best_length = length
            else:
                break
                
        if best_length > 0 and i + best_length < data_len:
            next_char = bytes([data[i + best_length]])
            tokens.append((best_offset, best_length, next_char))
            i += best_length + 1
        else:
            next_char = bytes([data[i]]) if i < data_len else b""
            tokens.append((0, 0, next_char))
            i += 1

    # Convert tokens to a simplistic byte format for size estimation
    # Format: [offset (2 bytes), length (1 byte), next_char (1 byte)]
    # This is a fixed 4-byte token size, which isn't optimal but works for demonstration
    compressed = bytearray()
    for offset, length, char in tokens:
        compressed.extend(offset.to_bytes(2, 'big'))
        compressed.append(length)
        if char:
            compressed.extend(char)
        else:
            compressed.append(0) # Pad

    ratio = len(data) / len(compressed) if compressed else 1.0
    return bytes(compressed), ratio, tokens

def compress_optimized(data: bytes, search_window_size=32768, lookahead_buffer_size=255) -> tuple[bytes, float, list[tuple[int, int, bytes]]]:
    """
    Optimized LZ77 using a Rolling Hash / Dictionary for O(1) matching.
    """
    if not data:
        return b"", 1.0, []

    tokens = []
    i = 0
    data_len = len(data)
    
    # Hash map storing lists of previous occurrences of 3-byte sequences
    # Key: bytes, Value: list of indices
    occurrences = {}
    
    MIN_MATCH = 3 # Minimum length to bother looking up
    
    while i < data_len:
        best_offset = 0
        best_length = 0
        
        # We only try to match if we have enough characters left
        if i + MIN_MATCH <= data_len:
            seq = data[i:i+MIN_MATCH]
            if seq in occurrences:
                # Find the longest match among previous occurrences
                # that fall within our search window
                search_start = max(0, i - search_window_size)
                
                # Check valid past indices backwards
                for past_idx in reversed(occurrences[seq]):
                    if past_idx < search_start:
                        break # Out of window
                        
                    # Calculate match length
                    length = MIN_MATCH
                    while (length < lookahead_buffer_size and 
                           i + length < data_len and 
                           data[past_idx + length] == data[i + length]):
                        length += 1
                        
                    if length > best_length:
                        best_length = length
                        best_offset = i - past_idx
                        if best_length == lookahead_buffer_size:
                            break # Max possible match
            
            # Add current sequence to occurrences
            if seq not in occurrences:
                occurrences[seq] = []
            occurrences[seq].append(i)
            
        if best_length >= MIN_MATCH and i + best_length < data_len:
            next_char = bytes([data[i + best_length]])
            tokens.append((best_offset, best_length, next_char))
            
            # Add all intermediate sequences to dictionary
            for j in range(1, best_length + 1):
                if i + j + MIN_MATCH <= data_len:
                    sub_seq = data[i+j : i+j+MIN_MATCH]
                    if sub_seq not in occurrences:
                        occurrences[sub_seq] = []
                    occurrences[sub_seq].append(i+j)
                    
            i += best_length + 1
        else:
            next_char = bytes([data[i]]) if i < data_len else b""
            tokens.append((0, 0, next_char))
            
            if i + MIN_MATCH <= data_len:
                seq = data[i:i+MIN_MATCH]
                if seq not in occurrences:
                    occurrences[seq] = []
                if not occurrences[seq] or occurrences[seq][-1] != i:
                    occurrences[seq].append(i)
            i += 1

    compressed = bytearray()
    for offset, length, char in tokens:
        compressed.extend(offset.to_bytes(2, 'big'))
        compressed.append(length)
        if char:
            compressed.extend(char)
        else:
            compressed.append(0)

    ratio = len(data) / len(compressed) if compressed else 1.0
    return bytes(compressed), ratio, tokens

def decompress(tokens: list[tuple[int, int, bytes]]) -> bytes:
    """
    Decompresses LZ77 tokens.
    """
    decompressed = bytearray()
    
    for offset, length, char in tokens:
        if length > 0:
            start_idx = len(decompressed) - offset
            for i in range(length):
                decompressed.append(decompressed[start_idx + i])
        if char:
            decompressed.extend(char)
            
    return bytes(decompressed)
