import os
import random
import csv

def generate_sample_files(sample_dir="assets/sample_files"):
    """Generates sample files for compression testing if they don't exist."""
    os.makedirs(sample_dir, exist_ok=True)
    
    files = {
        "lorem.txt": _generate_lorem,
        "dna.txt": _generate_dna,
        "repeated.txt": _generate_repeated,
        "mixed.csv": _generate_csv
    }
    
    for filename, generator in files.items():
        filepath = os.path.join(sample_dir, filename)
        if not os.path.exists(filepath):
            generator(filepath)

def _generate_lorem(filepath):
    lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n"
    # Generate ~50KB
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(lorem * 120)

def _generate_dna(filepath):
    # Generate ~20KB
    bases = ['A', 'C', 'G', 'T']
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("".join(random.choices(bases, k=20000)))

def _generate_repeated(filepath):
    # Generate ~10KB highly repetitive text
    pattern = "A" * 50 + "B" * 20 + "C" * 100 + "D" * 10
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(pattern * 56)

def _generate_csv(filepath):
    # Generate ~30KB CSV
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["ID", "Name", "Score", "Category", "Status"])
        for i in range(1000):
            writer.writerow([
                i, 
                f"User_{i}", 
                random.randint(0, 100), 
                random.choice(["Alpha", "Beta", "Gamma"]), 
                random.choice(["Active", "Inactive", "Pending"])
            ])

def read_file(filepath):
    """Reads a file as bytes."""
    with open(filepath, 'rb') as f:
        return f.read()

def write_file(filepath, data):
    """Writes bytes to a file."""
    with open(filepath, 'wb') as f:
        f.write(data)

def get_file_size(filepath):
    return os.path.getsize(filepath)
