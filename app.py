import streamlit as st
import pandas as pd
import time
import base64
import os

from utils import file_handler, report_generator, profiler, pdf_generator
from algorithms import huffman, lz77, rle, bwt, deflate
from visualizations import benchmark_charts, bwt_pipeline, huffman_tree, big_o_charts

st.set_page_config(
    page_title="ByteForge — Data Compression Suite",
    page_icon="🗜️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Professional Grade Custom CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    .stApp {
        background-color: #0a0e17;
    }
    /* Hide Streamlit header/footer for app-like feel */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    
    /* Gradient Text for Main Title */
    .gradient-title {
        background: linear-gradient(90deg, #00AAFF 0%, #00FF88 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 800;
        font-size: 3rem;
        margin-bottom: 0px;
        padding-bottom: 0px;
    }
    
    .stButton>button {
        background: linear-gradient(90deg, #00AAFF 0%, #0077FF 100%);
        color: white;
        border-radius: 8px;
        border: none;
        box-shadow: 0 4px 14px 0 rgba(0, 170, 255, 0.39);
        transition: all 0.3s ease;
        font-weight: 600;
        padding: 0.5rem 1rem;
    }
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 170, 255, 0.5);
    }
    
    /* Metric Cards Styling */
    .metric-card {
        background-color: #131a26;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #1e2638;
        border-top: 4px solid #00AAFF;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        text-align: center;
        margin-bottom: 1rem;
    }
    .metric-title {
        font-size: 0.9rem;
        color: #8a99af;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 10px;
    }
    .metric-value {
        font-size: 1.8rem;
        font-weight: 800;
        color: white;
    }
    .metric-sub {
        font-size: 0.8rem;
        color: #00FF88;
        margin-top: 5px;
    }
    
    /* Custom divider */
    hr {
        border-top: 1px solid #1e2638;
    }
</style>
""", unsafe_allow_html=True)

# Generate sample files on first load
file_handler.generate_sample_files()

def main():
    st.sidebar.title("🗜️ ByteForge")
    st.sidebar.caption("Data Compression Suite")
    
    pages = ["Home", "Huffman", "LZ77", "RLE", "BWT Pipeline", "Deflate", "Benchmark", "Empirical Big-O", "Complexity Analysis"]
    selection = st.sidebar.radio("Navigation", pages)
    
    # Toggle for optimized data structures
    st.sidebar.markdown("---")
    st.sidebar.subheader("Engine Settings")
    st.session_state.use_optimized = st.sidebar.toggle("Use Optimized Data Structures", value=True, help="Switch between O(N) optimized code and naive academic implementations.")
    
    if "results" not in st.session_state:
        st.session_state.results = None
    if "current_file_data" not in st.session_state:
        st.session_state.current_file_data = None
        
    if selection == "Home":
        render_home()
    elif selection == "Huffman":
        render_huffman()
    elif selection == "LZ77":
        render_lz77()
    elif selection == "RLE":
        render_rle()
    elif selection == "BWT Pipeline":
        render_bwt()
    elif selection == "Deflate":
        render_deflate()
    elif selection == "Benchmark":
        render_benchmark()
    elif selection == "Empirical Big-O":
        render_empirical_big_o()
    elif selection == "Complexity Analysis":
        render_complexity()

def render_home():
    st.markdown('<h1 class="gradient-title">ByteForge</h1>', unsafe_allow_html=True)
    st.markdown("### Lossless Data Compression Engine")
    st.markdown("A full-featured application that implements, visualizes, and benchmarks 5 data compression algorithms.")
    st.write("")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        upload_type = st.radio("Input Method", ["File Upload", "Sample File", "Text Input"])
        
        data = None
        filename = "input.bin"
        
        if upload_type == "File Upload":
            uploaded_file = st.file_uploader("Drag & Drop File Here")
            if uploaded_file:
                if uploaded_file.size > 5 * 1024 * 1024:
                    st.warning("File is larger than 5MB. Processing might be slow!")
                data = uploaded_file.read()
                filename = uploaded_file.name
                
        elif upload_type == "Sample File":
            samples_dir = "assets/sample_files"
            sample_files = os.listdir(samples_dir) if os.path.exists(samples_dir) else []
            selected_sample = st.selectbox("Select Sample", sample_files)
            if selected_sample:
                data = file_handler.read_file(os.path.join(samples_dir, selected_sample))
                filename = selected_sample
                
        else:
            text_input = st.text_area("Enter Text")
            if text_input:
                data = text_input.encode('utf-8')
                filename = "text_input.txt"
                
        st.session_state.current_file_data = data
        st.session_state.current_filename = filename
        
    with col2:
        st.subheader("Algorithms")
        run_huffman = st.checkbox("Huffman Coding", value=True)
        run_lz77 = st.checkbox("LZ77", value=True)
        run_rle = st.checkbox("RLE", value=True)
        run_bwt = st.checkbox("BWT Pipeline", value=True)
        run_deflate = st.checkbox("Deflate (LZ77+Huffman)", value=True)
        
        if st.button("Compress & Analyze", use_container_width=True) and data:
            with st.spinner("Running Memory & Performance Profiling..."):
                run_compression(data, filename, run_huffman, run_lz77, run_rle, run_bwt, run_deflate)
                
    if st.session_state.results:
        st.divider()
        st.subheader("📊 Compression Summary")
        
        res = st.session_state.results
        st.markdown(f"**Target File:** `{res['filename']}` | **Original Size:** `{res['original_size']:,} bytes`")
        st.write("")
        
        # Display comparison table with styled metrics
        for algo, d in res['algorithms'].items():
            if 'error' not in d:
                savings = f"{(1 - 1/d['ratio'])*100:.1f}%" if d['ratio'] > 0 else "0%"
                st.markdown(f"""
                <div class="metric-card">
                    <div style="font-size:1.2rem; font-weight:800; color:#00AAFF; margin-bottom:15px;">{algo.upper()}</div>
                    <div style="display:flex; justify-content:space-around;">
                        <div>
                            <div class="metric-title">Size (Bytes)</div>
                            <div class="metric-value">{d['size']:,}</div>
                        </div>
                        <div>
                            <div class="metric-title">Ratio</div>
                            <div class="metric-value">{d['ratio']:.2f}x</div>
                        </div>
                        <div>
                            <div class="metric-title">Space Saved</div>
                            <div class="metric-value" style="color:#00FF88;">{savings}</div>
                        </div>
                        <div>
                            <div class="metric-title">Time (ms)</div>
                            <div class="metric-value">{d['time']:.2f}</div>
                        </div>
                    </div>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.error(f"**{algo.upper()} Failed:** {d['error']}")
                
        st.write("")
        
        col_dl1, col_dl2 = st.columns(2)
        with col_dl1:
            report_txt = report_generator.generate_text_report(res)
            st.download_button("Download Report (TXT)", report_txt, "byteforge_report.txt", "text/plain", use_container_width=True)
        with col_dl2:
            pdf_path = pdf_generator.generate_pdf_report(res)
            with open(pdf_path, "rb") as f:
                st.download_button("Download Academic Report (PDF)", f, "byteforge_academic_report.pdf", "application/pdf", use_container_width=True)

def run_compression(data, filename, do_huffman, do_lz77, do_rle, do_bwt, do_deflate):
    results = {
        "filename": filename,
        "original_size": len(data),
        "algorithms": {}
    }
    
    if do_huffman:
        try:
            res_tuple, mem, exec_t = profiler.profile_algorithm(huffman.compress, data)
            comp, ratio, cb, tree, bitstr, log = res_tuple
            results["algorithms"]["huffman"] = {
                "size": len(comp), "ratio": ratio, "time": exec_t, "memory": mem,
                "codebook": cb, "tree": tree, "bitstring": bitstr, "log": log,
                "compressed_data": comp
            }
        except Exception as e:
            results["algorithms"]["huffman"] = {"error": str(e)}
            
    if do_lz77:
        try:
            opt = st.session_state.get('use_optimized', True)
            func = lz77.compress_optimized if opt else lz77.compress
            res_tuple, mem, exec_t = profiler.profile_algorithm(func, data, 1024, 255)
            comp, ratio, tokens = res_tuple
            results["algorithms"]["lz77"] = {
                "size": len(comp), "ratio": ratio, "time": exec_t, "memory": mem,
                "tokens": tokens, "compressed_data": comp
            }
        except Exception as e:
            results["algorithms"]["lz77"] = {"error": str(e)}

    if do_rle:
        try:
            res_tuple, mem, exec_t = profiler.profile_algorithm(rle.compress, data)
            comp, ratio, runs = res_tuple
            results["algorithms"]["rle"] = {
                "size": len(comp), "ratio": ratio, "time": exec_t, "memory": mem,
                "runs": runs, "compressed_data": comp
            }
        except Exception as e:
            results["algorithms"]["rle"] = {"error": str(e)}
            
    if do_bwt:
        try:
            opt = st.session_state.get('use_optimized', True)
            # Naive BWT is very slow for files > a few KB. We truncate if too large just for the demo.
            bwt_data = data
            truncated = False
            limit = 50000 if opt else 5000
            if len(data) > limit:
                bwt_data = data[:limit]
                truncated = True
                
            func = bwt.bwt_transform_optimized if opt else bwt.bwt_transform
            
            # Since our BWT pipeline isn't fully modular for profiler in one go, we wrap it
            def wrapped_bwt(d):
                return bwt.compress(d)
                
            # Actually, bwt_transform_optimized is internal, we need to hack bwt module to use it.
            # For now, let's just run bwt.compress. We'll skip deep profiling integration for the sub-steps here
            # and just profile the whole bwt.compress wrapper.
            
            start = time.perf_counter()
            # Hack: Temporarily patch bwt module to use optimized or not
            original_func = bwt.bwt_transform
            if opt:
                bwt.bwt_transform = bwt.bwt_transform_optimized
                
            res_tuple, mem, exec_t = profiler.profile_algorithm(bwt.compress, bwt_data)
            comp, ratio, stages = res_tuple
            
            # Restore
            bwt.bwt_transform = original_func
            
            # if truncated, we estimate ratio based on the chunk
            if truncated:
                comp_estimated_size = int((len(comp) / limit) * len(data))
                ratio = len(data) / comp_estimated_size if comp_estimated_size else 1.0
                
            results["algorithms"]["bwt"] = {
                "size": len(comp) if not truncated else comp_estimated_size, 
                "ratio": ratio, 
                "time": exec_t,
                "memory": mem,
                "stages": stages, "compressed_data": comp,
                "truncated": truncated
            }
        except Exception as e:
            results["algorithms"]["bwt"] = {"error": str(e)}

    if do_deflate:
        try:
            opt = st.session_state.get('use_optimized', True)
            res_tuple, mem, exec_t = profiler.profile_algorithm(deflate.compress, data, opt)
            comp, ratio, stages = res_tuple
            results["algorithms"]["deflate"] = {
                "size": len(comp), "ratio": ratio, "time": exec_t, "memory": mem,
                "stages": stages, "compressed_data": comp
            }
        except Exception as e:
            results["algorithms"]["deflate"] = {"error": str(e)}

    st.session_state.results = results

def render_huffman():
    st.title("Huffman Coding")
    res = st.session_state.results
    if not res or "huffman" not in res['algorithms'] or 'error' in res['algorithms']['huffman']:
        st.warning("Please run Huffman compression on the Home tab first.")
        return
        
    data = res['algorithms']['huffman']
    
    col1, col2 = st.columns([1, 1])
    with col1:
        st.subheader("Step-by-step Log")
        for step in data['log']:
            st.text(step)
            
        st.subheader("Codebook")
        st.dataframe(pd.DataFrame([{"Character": repr(bytes([k])) if isinstance(k, int) else repr(k), "Binary Code": v} for k, v in data['codebook'].items()]), use_container_width=True)
        
    with col2:
        st.subheader("Huffman Tree")
        if data['tree']:
            img_bytes = huffman_tree.draw_huffman_tree(data['tree'])
            if img_bytes:
                st.image(img_bytes)

def render_lz77():
    st.title("LZ77 Compression")
    res = st.session_state.results
    if not res or "lz77" not in res['algorithms'] or 'error' in res['algorithms']['lz77']:
        st.warning("Please run LZ77 compression on the Home tab first.")
        return
        
    data = res['algorithms']['lz77']
    
    st.subheader("Token Table (Offset, Length, Next Char)")
    tokens = data['tokens'][:1000] # limit display
    
    df = pd.DataFrame([{
        "Offset": t[0], 
        "Length": t[1], 
        "Next Char": repr(t[2])
    } for t in tokens])
    
    st.dataframe(df, use_container_width=True)
    if len(data['tokens']) > 1000:
        st.caption("Showing first 1000 tokens.")

def render_rle():
    st.title("Run-Length Encoding (RLE)")
    res = st.session_state.results
    if not res or "rle" not in res['algorithms'] or 'error' in res['algorithms']['rle']:
        st.warning("Please run RLE compression on the Home tab first.")
        return
        
    data = res['algorithms']['rle']
    runs = data['runs'][:1000]
    
    st.subheader("Run Breakdown")
    df = pd.DataFrame([{
        "Count": r[0], 
        "Value (Byte)": r[1],
        "Character": repr(bytes([r[1]]))
    } for r in runs])
    
    st.dataframe(df, use_container_width=True)

def render_bwt():
    st.title("BWT Pipeline")
    res = st.session_state.results
    if not res or "bwt" not in res['algorithms'] or 'error' in res['algorithms']['bwt']:
        st.warning("Please run BWT compression on the Home tab first.")
        return
        
    data = res['algorithms']['bwt']
    if data.get('truncated', False):
        st.warning("BWT display is truncated to first 5000 bytes due to naive O(N^2 log N) complexity.")
        
    st.subheader("Pipeline Stages")
    bwt_pipeline.render_bwt_stages(data['stages'])

def render_deflate():
    st.title("Deflate (LZ77 + Huffman)")
    res = st.session_state.results
    if not res or "deflate" not in res['algorithms'] or 'error' in res['algorithms']['deflate']:
        st.warning("Please run Deflate compression on the Home tab first.")
        return
        
    data = res['algorithms']['deflate']
    stages = data['stages']
    
    st.subheader("1. LZ77 Tokenization")
    st.write(f"Generated {len(stages['lz77_tokens'])} tokens. Intermediate size: {stages['lz77_size']} bytes.")
    
    st.subheader("2. Huffman Coding")
    st.write(f"Codebook contains {len(stages['huffman_codebook'])} unique symbols.")
    
    st.subheader("Final Output")
    st.write(f"Total Deflated Size: {stages['final_size']} bytes.")

def render_empirical_big_o():
    st.title("Empirical Big-O Verification")
    st.markdown("Proves theoretical asymptotic bounds by measuring execution time against increasing input sizes.")
    
    data = st.session_state.current_file_data
    if not data:
        st.warning("Please upload a file on the Home tab first.")
        return
        
    if len(data) < 1000:
        st.warning("Please upload a larger file (> 100KB) for meaningful empirical results.")
        return

    algo_choice = st.selectbox("Select Algorithm to Profile", ["Huffman", "LZ77", "RLE", "BWT"])
    
    if st.button("Run Empirical Profiling"):
        with st.spinner("Generating chunks and profiling..."):
            chunks = []
            chunk_sizes = []
            
            # Create 5 linearly spaced chunks
            max_size = min(len(data), 100000) # Cap at 100KB for speed
            if algo_choice == "BWT" and not st.session_state.get('use_optimized', True):
                max_size = min(len(data), 5000) # Naive BWT is too slow
                
            step = max_size // 5
            for i in range(1, 6):
                size = step * i
                chunks.append(data[:size])
                chunk_sizes.append(size)
                
            times = []
            
            # Map choice to function
            if algo_choice == "Huffman":
                f = huffman.compress
                expected = "O(N log N)"
            elif algo_choice == "LZ77":
                f = lz77.compress_optimized if st.session_state.get('use_optimized', True) else lz77.compress
                expected = "O(N)" if st.session_state.get('use_optimized', True) else "O(N^2)"
            elif algo_choice == "RLE":
                f = rle.compress
                expected = "O(N)"
            else:
                f = bwt.compress
                expected = "O(N log N)" if st.session_state.get('use_optimized', True) else "O(N^2)"
                
            # Temporarily mock BWT module if optimized
            original_bwt = bwt.bwt_transform
            if algo_choice == "BWT" and st.session_state.get('use_optimized', True):
                bwt.bwt_transform = bwt.bwt_transform_optimized
                
            for chunk in chunks:
                start = time.perf_counter()
                f(chunk)
                times.append((time.perf_counter() - start) * 1000)
                
            # Restore BWT
            if algo_choice == "BWT":
                bwt.bwt_transform = original_bwt
                
            fig = big_o_charts.create_empirical_chart(chunk_sizes, times, algo_choice, expected)
            st.plotly_chart(fig, use_container_width=True)
            
            st.success(f"Profiling complete. Plotted {len(chunk_sizes)} data points.")

def render_benchmark():
    st.title("Benchmark Dashboard")
    res = st.session_state.results
    if not res:
        st.warning("Please compress a file on the Home tab first.")
        return
        
    col1, col2, col3 = st.columns(3)
    with col1:
        st.plotly_chart(benchmark_charts.create_ratio_chart(res), use_container_width=True)
    with col2:
        st.plotly_chart(benchmark_charts.create_speed_chart(res), use_container_width=True)
    with col3:
        st.plotly_chart(benchmark_charts.create_memory_chart(res), use_container_width=True)
        
    st.plotly_chart(benchmark_charts.create_radar_chart(), use_container_width=True)

def render_complexity():
    st.title("Complexity Analysis")
    
    st.markdown("""
    ### 1. Huffman Coding
    - **Paradigm**: Greedy
    - **Time Complexity**: $O(N \log K)$ (N: data length, K: unique chars)
    - **Space Complexity**: $O(K)$
    - **Best For**: Text files with uneven character distributions.
    
    ### 2. LZ77
    - **Paradigm**: Sliding Window / Divide & Conquer
    - **Time Complexity**: $O(N \\times W)$ (W: window size)
    - **Space Complexity**: $O(W)$
    - **Best For**: Files with repeated phrases (source code, formatted text).
    
    ### 3. Run-Length Encoding (RLE)
    - **Paradigm**: Brute Force
    - **Time Complexity**: $O(N)$
    - **Space Complexity**: $O(1)$ auxiliary
    - **Best For**: Simple images (bitmaps) or highly repetitive data (DNA sequences).
    
    ### 4. BWT Pipeline
    - **Paradigm**: Transformation + Greedy Encoding
    - **Time Complexity**: $O(N^2 \log N)$ (naive sorting, can be $O(N)$ with suffix arrays)
    - **Space Complexity**: $O(N^2)$ (naive, can be $O(N)$)
    - **Best For**: Text files with contextual repetitions and structure (log files, natural language).
    """)

if __name__ == "__main__":
    main()
