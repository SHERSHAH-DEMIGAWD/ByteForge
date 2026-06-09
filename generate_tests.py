import os
import random
import string

def generate_test_files():
    os.makedirs("test_data", exist_ok=True)
    
    # 1. Low Entropy (Highly Repetitive) - Great for RLE and LZ77
    with open("test_data/low_entropy.txt", "w") as f:
        f.write("A" * 5000 + "B" * 5000 + "C" * 5000)
        
    # 2. Medium Entropy (English Text) - Great for Huffman and Arithmetic
    english_text = "The quick brown fox jumps over the lazy dog. " * 1000
    with open("test_data/medium_entropy.txt", "w") as f:
        f.write(english_text)
        
    # 3. High Entropy (Random Data) - Will show poor compression, close to Shannon limit
    high_entropy = ''.join(random.choices(string.ascii_letters + string.digits + string.punctuation, k=15000))
    with open("test_data/high_entropy.txt", "w") as f:
        f.write(high_entropy)
        
    # 4. DNA Sequence - Small alphabet (A, C, G, T)
    dna = ''.join(random.choices(['A', 'C', 'G', 'T'], k=15000))
    with open("test_data/dna_sequence.txt", "w") as f:
        f.write(dna)

if __name__ == "__main__":
    generate_test_files()
    print("Test files generated in 'test_data' folder.")
