def lzw_compress(data: bytes) -> list[int]:
    """
    Compresses data using the Lempel-Ziv-Welch (LZW) algorithm.
    Dynamically builds a dictionary of sequences.
    """
    if not data:
        return []

    # Initialize dictionary with single-byte sequences
    dictionary = {bytes([i]): i for i in range(256)}
    dict_size = 256
    
    w = bytes()
    compressed = []

    for c in data:
        wc = w + bytes([c])
        if wc in dictionary:
            w = wc
        else:
            compressed.append(dictionary[w])
            # Add wc to the dictionary
            dictionary[wc] = dict_size
            dict_size += 1
            w = bytes([c])

    if w:
        compressed.append(dictionary[w])

    return compressed

def lzw_decompress(compressed: list[int]) -> bytes:
    """
    Decompresses LZW-compressed data (list of integer codes).
    """
    if not compressed:
        return b""

    # Initialize dictionary with single-byte sequences
    dictionary = {i: bytes([i]) for i in range(256)}
    dict_size = 256
    
    result = bytearray()
    w = dictionary[compressed[0]]
    result.extend(w)

    for k in compressed[1:]:
        if k in dictionary:
            entry = dictionary[k]
        elif k == dict_size:
            entry = w + bytes([w[0]])
        else:
            raise ValueError(f"Bad compressed k: {k}")

        result.extend(entry)
        
        # Add w+entry[0] to the dictionary
        dictionary[dict_size] = w + bytes([entry[0]])
        dict_size += 1
        w = entry

    return bytes(result)
