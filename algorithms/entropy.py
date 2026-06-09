import math
from collections import Counter

def calculate_shannon_entropy(data: bytes) -> float:
    """
    Calculates the Shannon Entropy of a byte sequence.
    This represents the theoretical minimum number of bits per symbol
    needed to encode the data.
    """
    if not data:
        return 0.0

    length = len(data)
    frequencies = Counter(data)
    
    entropy = 0.0
    for count in frequencies.values():
        probability = count / length
        entropy -= probability * math.log2(probability)
        
    return entropy

def get_theoretical_minimum_size(data: bytes) -> float:
    """
    Returns the theoretical minimum size of the data in bytes,
    based on its Shannon Entropy.
    """
    entropy = calculate_shannon_entropy(data)
    # Total bits needed / 8 = Total bytes
    return (entropy * len(data)) / 8.0
