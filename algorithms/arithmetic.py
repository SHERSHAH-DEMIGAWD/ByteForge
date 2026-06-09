from collections import Counter

def arithmetic_compress(data: bytes) -> tuple:
    """
    Compresses data using Arithmetic Coding.
    Uses 32-bit integer interval arithmetic to avoid floating-point underflow.
    """
    if not data:
        return bytes(), {}

    # Calculate frequencies
    freq = Counter(data)
    total = len(data)
    
    # Create probability ranges (cumulative frequencies)
    prob_ranges = {}
    cum_freq = 0
    for symbol, count in sorted(freq.items()):
        prob_ranges[symbol] = (cum_freq, cum_freq + count)
        cum_freq += count

    # 32-bit integer arithmetic coding
    MAX_CODE = 0xFFFFFFFF
    ONE_HALF = 0x80000000
    ONE_QUARTER = 0x40000000
    THREE_QUARTERS = 0xC0000000

    low = 0
    high = MAX_CODE
    pending_bits = 0
    
    compressed_bits = []
    
    def emit_bit(bit):
        compressed_bits.append(bit)
        for _ in range(pending_bits):
            compressed_bits.append(1 - bit)
            
    for symbol in data:
        symbol_low, symbol_high = prob_ranges[symbol]
        range_val = high - low + 1
        
        high = low + (range_val * symbol_high) // total - 1
        low = low + (range_val * symbol_low) // total
        
        while True:
            if high < ONE_HALF:
                emit_bit(0)
                pending_bits = 0
                low = low << 1
                high = (high << 1) | 1
            elif low >= ONE_HALF:
                emit_bit(1)
                pending_bits = 0
                low = (low - ONE_HALF) << 1
                high = ((high - ONE_HALF) << 1) | 1
            elif low >= ONE_QUARTER and high < THREE_QUARTERS:
                pending_bits += 1
                low = (low - ONE_QUARTER) << 1
                high = ((high - ONE_QUARTER) << 1) | 1
            else:
                break
                
    pending_bits += 1
    if low < ONE_QUARTER:
        emit_bit(0)
    else:
        emit_bit(1)
        
    # Convert bits to bytes
    compressed_bytes = bytearray()
    for i in range(0, len(compressed_bits), 8):
        byte = 0
        for j in range(8):
            if i + j < len(compressed_bits):
                byte = (byte << 1) | compressed_bits[i+j]
            else:
                byte = byte << 1
        compressed_bytes.append(byte)
        
    return bytes(compressed_bytes), prob_ranges

def arithmetic_decompress(compressed_data: bytes, prob_ranges: dict, total_length: int) -> bytes:
    """
    Decompresses data using Arithmetic Coding.
    Requires the probability ranges and the total original length.
    """
    if not compressed_data or total_length == 0:
        return bytes()

    # Calculate total frequency
    total_freq = sum(high - low for low, high in prob_ranges.values())

    # Reverse prob_ranges for quick lookup
    # Not strictly O(1) but fine for small alphabet
    def get_symbol(value):
        for sym, (low, high) in prob_ranges.items():
            if low <= value < high:
                return sym, low, high
        return None, 0, 0

    MAX_CODE = 0xFFFFFFFF
    ONE_HALF = 0x80000000
    ONE_QUARTER = 0x40000000
    THREE_QUARTERS = 0xC0000000

    # Extract bits
    bits = []
    for byte in compressed_data:
        for i in range(7, -1, -1):
            bits.append((byte >> i) & 1)

    bit_idx = 0
    def read_bit():
        nonlocal bit_idx
        if bit_idx < len(bits):
            b = bits[bit_idx]
            bit_idx += 1
            return b
        return 0

    # Initialize value
    value = 0
    for _ in range(32):
        value = (value << 1) | read_bit()

    low = 0
    high = MAX_CODE
    
    decompressed = bytearray()
    
    for _ in range(total_length):
        range_val = high - low + 1
        
        # Avoid division by zero
        if range_val == 0:
            break
            
        scaled_value = ((value - low + 1) * total_freq - 1) // range_val
        
        symbol, sym_low, sym_high = get_symbol(scaled_value)
        if symbol is None:
            break
            
        decompressed.append(symbol)
        
        high = low + (range_val * sym_high) // total_freq - 1
        low = low + (range_val * sym_low) // total_freq
        
        while True:
            if high < ONE_HALF:
                pass
            elif low >= ONE_HALF:
                value -= ONE_HALF
                low -= ONE_HALF
                high -= ONE_HALF
            elif low >= ONE_QUARTER and high < THREE_QUARTERS:
                value -= ONE_QUARTER
                low -= ONE_QUARTER
                high -= ONE_QUARTER
            else:
                break
                
            low = low << 1
            high = (high << 1) | 1
            value = (value << 1) | read_bit()
            
    return bytes(decompressed)
