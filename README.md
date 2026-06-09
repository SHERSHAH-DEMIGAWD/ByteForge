# ByteForge 🗜️

ByteForge is an advanced, visually stunning, and highly educational Data Compression Analysis Hub. It provides a deep dive into the fascinating world of Information Theory and Algorithm Design, allowing users to benchmark, compare, and analyze classic compression algorithms against theoretical mathematical limits.

Designed specifically for Design and Analysis of Algorithms (DAA) coursework, ByteForge goes beyond simple string manipulation by implementing real-world data structures and providing a sleek, modern Next.js interface to visualize the results.

## 🌟 Key Features & Unique Selling Propositions (USPs)

- **Deep Information Theory Integration**: Calculates the exact **Shannon Entropy** of uploaded files, displaying the absolute theoretical minimum size in bits/symbol. Every algorithm is then scored on an **Efficiency** metric to show how close it gets to this mathematical limit.
- **Advanced Algorithm Implementations**:
  - **Huffman Coding** (Prefix-free tree construction)
  - **LZ77 (Lempel-Ziv)** (Sliding window and lookahead buffers)
  - **LZW (Lempel-Ziv-Welch)** (Dynamic dictionary building)
  - **Run-Length Encoding (RLE)** (Simple sequence compression)
  - **Burrows-Wheeler Transform (BWT)** (Block-sorting data transformation)
  - **Arithmetic Coding** (High-precision interval fraction encoding)
  - **DEFLATE** (LZ77 + Huffman hybrid, the standard for gzip/ZIP)
- **Engine Toggling (Naive vs. Optimized)**: Switch between naive string manipulation and true $O(N)$ or $O(N \log N)$ optimized data structures (like Rolling Hashes and Suffix Arrays) to see the massive difference in Execution Time and Memory usage.
- **Beautiful Modern UI**: Built with Next.js, Tailwind CSS, and Framer Motion for a fluid, responsive, and glassmorphic user experience.
- **Drag-and-Drop Interface**: Seamlessly upload files of any type (text, DNA sequences, repetitive data) to instantly visualize compression metrics.

## 🚀 Getting Started

ByteForge is split into a high-performance Python FastAPI backend and a Next.js frontend.

### Prerequisites
- Python 3.10+
- Node.js & npm

### 1. Start the Backend (FastAPI)
Open a terminal and navigate to the project root:
```bash
cd byteforge
pip install fastapi uvicorn pydantic
uvicorn api:app --reload --port 8000
```
The backend will run on `http://localhost:8000`.

### 2. Start the Frontend (Next.js)
Open a new terminal and navigate to the frontend directory:
```bash
cd byteforge/frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:3000`. Open this in your browser.

## 🧪 Testing the Application

We have included a script to generate perfect test files for different algorithms:
```bash
cd byteforge
python generate_tests.py
```
This will create a `test_data` folder containing:
- `low_entropy.txt`: Highly repetitive, perfect for showing off RLE and LZ77.
- `high_entropy.txt`: Totally random text, proving that compression cannot overcome Shannon Entropy.
- `standard_text.txt`: Normal English text for testing Huffman and DEFLATE.

Drag and drop these files into the UI to see the algorithms battle it out!

## 🏗️ Architecture

- **Backend**: Python (FastAPI) handles the heavy lifting, executing the complex algorithms and timing their execution.
- **Frontend**: Next.js (React) handles the state, UI rendering, drag-and-drop, and beautiful metric cards.

## 📚 Educational Value
ByteForge is the perfect project to demonstrate mastery of Data Structures and Algorithms. By implementing both Naive and Optimized versions of algorithms like LZ77 and BWT, it vividly illustrates the importance of time complexity ($O(N^2)$ vs $O(N)$) and spatial efficiency.
